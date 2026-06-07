import { createClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!;
const s = createClient(url, key, { auth: { persistSession: false } });
const { data, error } = await s.auth.signInWithPassword({ email: "asal.sr89@gmail.com", password: "TestReset!2026" });
console.log(error ? "LOGIN FAILED: " + error.message : "LOGIN OK as " + data.user!.email);
