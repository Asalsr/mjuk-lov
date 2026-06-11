import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import { SUPABASE_URL, SUPABASE_KEY } from "@/lib/supabase/config";

// GDPR Art. 17 (erasure). Destructive + outward-facing, so it requires a valid
// session AND a password re-auth (a hijacked session alone can't delete).
//
// Accounting caveat: `orders` is retained (user_id is `on delete set null`) to
// satisfy Bokföringslagen's ~7-year retention — but its PII columns are wiped
// here. Everything else cascades away with the auth user.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

export async function POST(req: Request) {
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user?.email) return json({ error: "unauthorized" }, 401);

  let body: { password?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad_request" }, 400);
  }
  const password = typeof body.password === "string" ? body.password : "";
  if (!password) return json({ error: "password_required" }, 400);

  // Re-authenticate against the password on a throwaway client (persistSession
  // off, so it never touches the real session).
  const check = createSupabaseClient(SUPABASE_URL!, SUPABASE_KEY!, { auth: { persistSession: false } });
  const { error: pwErr } = await check.auth.signInWithPassword({ email: user.email, password });
  if (pwErr) return json({ error: "invalid_password" }, 403);

  if (!isAdminConfigured) return json({ error: "not_configured" }, 500);
  const admin = createAdminClient();

  // 1) Strip PII from retained accounting rows BEFORE the user is gone (after
  //    deletion their user_id is null and we couldn't target them). Users have
  //    no UPDATE policy on orders, so this must use the service-role client.
  const { error: anonErr } = await admin
    .from("orders")
    .update({
      contact_name: null,
      contact_email: null,
      contact_phone: null,
      address: null,
      dietary: null,
      notes: null,
    })
    .eq("user_id", user.id);
  if (anonErr) return json({ error: "anonymise_failed" }, 500);

  // 2) Delete the auth user — cascades profiles, favorites, wishlist, notes,
  //    cooking_history, delivery_addresses, consents, ai_messages, ai_summary;
  //    and nulls orders.user_id (rows already PII-stripped above).
  const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
  if (delErr) return json({ error: "delete_failed" }, 500);

  return json({ ok: true });
}
