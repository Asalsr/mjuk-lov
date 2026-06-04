import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";

// SERVER-ONLY. The service-role key bypasses RLS — never import this into a
// Client Component or anything that ships to the browser. Used by the Stripe
// webhook to mark orders paid without a user session.
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isAdminConfigured = Boolean(SUPABASE_URL && SERVICE_KEY);

export function createAdminClient() {
  return createClient(SUPABASE_URL!, SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
