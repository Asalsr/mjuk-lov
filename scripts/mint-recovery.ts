// One-off: mint a password-recovery token (token_hash) via the Supabase admin
// API so the recovery flow can be exercised end-to-end without an inbox.
// Run: npx tsx --env-file=.env --env-file=.env.local scripts/mint-recovery.ts <email>
import { createClient } from "@supabase/supabase-js";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: mint-recovery.ts <email>");
    process.exit(1);
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
  });
  if (error) {
    console.error("generateLink error:", error.message);
    process.exit(1);
  }
  const p = data.properties;
  console.log(JSON.stringify({
    hashed_token: p?.hashed_token,
    verification_type: p?.verification_type,
    user_email: data.user?.email,
  }));
}

main();
