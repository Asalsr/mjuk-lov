"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ui, type Lang } from "@/lib/i18n";

export function ResetPasswordForm({ lang }: { lang: Lang }) {
  const t = ui[lang];
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || loading) return;
    setLoading(true);
    setError(null);
    try {
      const { error } = await createClient().auth.updateUser({ password });
      if (error) setError(error.message);
      else {
        setDone(true);
        setTimeout(() => {
          router.push(`/${lang}/min-sida`);
          router.refresh();
        }, 1500);
      }
    } catch {
      setError(t.aiError);
    } finally {
      setLoading(false);
    }
  };

  if (done) return <p className="type-body">{t.passwordUpdated}</p>;

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 max-w-[400px]">
      <input
        type="password"
        required
        minLength={6}
        placeholder={t.newPassword}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-3 type-body bg-transparent"
        style={{ border: "1px solid rgba(61, 42, 34, 0.2)" }}
      />
      <button
        type="submit"
        disabled={loading}
        className="type-caps tap px-6 py-3 transition-all hover:bg-[var(--warm-peach)] disabled:opacity-40"
        style={{ border: "1px solid var(--warm-cocoa)" }}
      >
        {loading ? t.thinking : t.updatePassword}
      </button>
      {error && <p className="type-body" style={{ color: "var(--dusty-wine)" }}>{error}</p>}
    </form>
  );
}
