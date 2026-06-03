import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Magic-link / OTP callback: exchange the code for a session, then redirect.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  // No code or exchange failed → land on the target anyway (shows logged-out state).
  return NextResponse.redirect(`${origin}${next}`);
}
