"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { appOrigin } from "@/lib/site";
import { PasswordInput } from "./PasswordInput";
import { ui, type Lang } from "@/lib/i18n";

const inputStyle = { border: "1px solid rgba(61, 42, 34, 0.2)" } as const;
type Mode = "signin" | "signup" | "reset";

export function LoginForm({ lang }: { lang: Lang }) {
  const t = ui[lang];
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !email.trim()) return;
    if (mode !== "reset" && !password) return;
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${appOrigin()}/auth/callback?next=/${lang}/min-sida` },
        });
        if (error) setError(error.message);
        else setNotice(t.confirmEmailSent);
      } else if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${appOrigin()}/auth/callback?next=/${lang}/aterstall`,
        });
        if (error) setError(error.message);
        else setNotice(t.resetEmailSent);
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

  if (notice) {
    return (
      <div className="flex flex-col gap-4">
        <p className="type-body">{notice}</p>
        <button
          type="button"
          onClick={() => { setNotice(null); setMode("signin"); setPassword(""); }}
          className="type-caps tap px-6 py-3 self-start transition-all hover:bg-[var(--warm-peach)]"
          style={{ border: "1px solid var(--warm-cocoa)" }}
        >
          {t.backToLogin}
        </button>
      </div>
    );
  }

  const cta = mode === "signup" ? t.createAccount : mode === "reset" ? t.sendResetLink : t.signIn;

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
      {mode !== "reset" && (
        <PasswordInput
          lang={lang}
          value={password}
          onChange={setPassword}
          placeholder={t.password}
          minLength={6}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
        />
      )}
      <button
        type="submit"
        disabled={loading}
        className="type-caps tap px-6 py-3 transition-all hover:bg-[var(--warm-peach)] disabled:opacity-40"
        style={{ border: "1px solid var(--warm-cocoa)" }}
      >
        {loading ? t.thinking : cta}
      </button>
      {error && <p className="type-body" style={{ color: "var(--dusty-wine)" }}>{error}</p>}

      <div className="flex flex-col gap-1 mt-1">
        {mode === "signin" && (
          <>
            <button type="button" onClick={() => { setMode("reset"); setError(null); }} className="type-caps opacity-60 self-start transition-colors hover:text-[var(--dusty-terracotta)]">
              {t.forgotPassword}
            </button>
            <button type="button" onClick={() => { setMode("signup"); setError(null); }} className="type-caps opacity-60 self-start transition-colors hover:text-[var(--dusty-terracotta)]">
              {t.noAccount}
            </button>
          </>
        )}
        {mode === "signup" && (
          <button type="button" onClick={() => { setMode("signin"); setError(null); }} className="type-caps opacity-60 self-start transition-colors hover:text-[var(--dusty-terracotta)]">
            {t.haveAccount}
          </button>
        )}
        {mode === "reset" && (
          <button type="button" onClick={() => { setMode("signin"); setError(null); }} className="type-caps opacity-60 self-start transition-colors hover:text-[var(--dusty-terracotta)]">
            {t.signIn}
          </button>
        )}
      </div>
    </form>
  );
}
