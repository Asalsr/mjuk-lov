import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_KEY } from "@/lib/supabase/config";

// Email confirmation / magic-link / password-recovery callback.
// Establishes a session from either a PKCE `code` or a `token_hash` OTP
// (recovery links use one of these), then redirects to `next`.
//
// IMPORTANT: the Supabase client here writes the new session cookies onto the
// `response` we return. Writing via next/headers' cookies() would NOT attach
// them to a freshly constructed NextResponse.redirect(), so the session would
// silently fail to reach the browser (→ "Auth session missing!" on the next
// page). The middleware uses this same response-bound pattern.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const errorCode = searchParams.get("error_code") || searchParams.get("error");
  const next = searchParams.get("next") || "/";

  const dest = new URL(next, origin);

  // Supabase bounced back with an error (expired/consumed/invalid link). Forward
  // the reason so the target page can show a clear "request a new link" message
  // instead of failing later with a cryptic "Auth session missing!".
  if (errorCode) {
    dest.searchParams.set("error", errorCode);
    return NextResponse.redirect(dest);
  }

  // Redirect response that the Supabase client writes session cookies onto.
  const response = NextResponse.redirect(dest);
  const supabase = createServerClient(SUPABASE_URL!, SUPABASE_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const fail = (reason: string) => {
    dest.searchParams.set("error", reason);
    return NextResponse.redirect(dest);
  };

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return error ? fail(error.code || "exchange_failed") : response;
  }
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    return error ? fail(error.code || "verify_failed") : response;
  }

  // No code/token at all → land on the target (shows logged-out state).
  return NextResponse.redirect(dest);
}
