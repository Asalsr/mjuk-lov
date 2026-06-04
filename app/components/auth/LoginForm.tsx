"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ui, type Lang } from "@/lib/i18n";

const inputStyle = { border: "1px solid rgba(61, 42, 34, 0.2)" } as const;

export function LoginForm({ lang }: { lang: Lang }) {
  const t = ui[lang];
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || loading) return;
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      if (mode === "signup") {
        // Email + password. The one-time link only confirms the address.
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/${lang}/min-sida` },
        });
        if (error) setError(error.message);
        else setConfirmSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError(error.message);
        else {
          router.push(`/${lang}/min-sida`);
          router.refresh();
        }
      }
    } catch {
      setError(t.aiError);
    } finally {
      setLoading(false);
    }
  };

  if (confirmSent) return <p className="type-body">{t.confirmEmailSent}</p>;

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <input
        type="email"
        required
        placeholder={t.email}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-3 type-body bg-transparent"
        style={inputStyle}
      />
      <input
        type="password"
        required
        minLength={6}
        placeholder={t.password}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-3 type-body bg-transparent"
        style={inputStyle}
      />
      <button
        type="submit"
        disabled={loading}
        className="type-caps tap px-6 py-3 transition-all hover:bg-[var(--warm-peach)] disabled:opacity-40"
        style={{ border: "1px solid var(--warm-cocoa)" }}
      >
        {loading ? t.thinking : mode === "signup" ? t.createAccount : t.signIn}
      </button>
      {error && <p className="type-body" style={{ color: "var(--dusty-wine)" }}>{error}</p>}
      <button
        type="button"
        onClick={() => {
          setMode(mode === "signup" ? "signin" : "signup");
          setError(null);
        }}
        className="type-caps opacity-60 self-start transition-colors hover:text-[var(--dusty-terracotta)]"
      >
        {mode === "signup" ? t.haveAccount : t.noAccount}
      </button>
    </form>
  );
}
