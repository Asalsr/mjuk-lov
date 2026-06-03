// Central Supabase config. The whole auth layer stays dormant until these env
// vars are set (Vercel or .env), so the site works without a backend until you
// connect a Supabase project. Supports the new publishable key and legacy anon key.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
