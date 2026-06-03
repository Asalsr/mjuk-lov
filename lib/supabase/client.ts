import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_KEY } from "./config";

/** Browser Supabase client (Client Components). Uses the publishable/anon key,
 *  which is safe to ship to the browser. */
export function createClient() {
  return createBrowserClient(SUPABASE_URL!, SUPABASE_KEY!);
}
