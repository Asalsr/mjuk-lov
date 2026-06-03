"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ui, type Lang } from "@/lib/i18n";

export function LoginForm({ lang }: { lang: Lang }) {
  const t = ui[lang];
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;
    setLoading(true);
    setError(false);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/${lang}/min-sida`,
        },
      });
      if (error) setError(true);
      else setSent(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) return <p className="type-body">{t.linkSent}</p>;

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t.email}
        className="w-full p-4 type-body bg-transparent"
        style={{ border: "1px solid rgba(61, 42, 34, 0.2)" }}
      />
      <button
        type="submit"
        disabled={loading}
        className="type-caps tap px-6 py-3 transition-all hover:bg-[var(--warm-peach)] disabled:opacity-40"
        style={{ border: "1px solid var(--warm-cocoa)" }}
      >
        {loading ? t.thinking : t.sendLink}
      </button>
      {error && <p className="type-body" style={{ color: "var(--dusty-wine)" }}>{t.aiError}</p>}
    </form>
  );
}
