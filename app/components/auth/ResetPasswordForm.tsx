"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PasswordInput } from "./PasswordInput";
import { ui, type Lang } from "@/lib/i18n";

export function ResetPasswordForm({ lang }: { lang: Lang }) {
  const t = ui[lang];
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  // null = still checking, true = recovery session present, false = link invalid/expired.
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    // The callback forwards `?error=...` when the recovery link was expired,
    // already used, or invalid — treat that as definitive, regardless of any
    // stale session cookie that might otherwise be present.
    const linkFailed = Boolean(new URLSearchParams(window.location.search).get("error"));
    const supabase = createClient();
    let active = true;
    // getUser() validates against the server (unlike getSession(), which trusts
    // whatever is in storage), so a stale/expired cookie won't render a form
    // that's doomed to fail on submit.
    supabase.auth.getUser().then(({ data, error }) => {
      if (active) setHasSession(!linkFailed && Boolean(data.user) && !error);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (active && session && !linkFailed && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN")) {
        setHasSession(true);
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || loading) return;
    setLoading(true);
    setError(null);
    try {
      const { error } = await createClient().auth.updateUser({ password });
      if (error) {
        // No valid session by submit time (expired/used link, or it never
        // landed) — guide the user to request a fresh link instead of showing
        // the raw "Auth session missing!" string.
        if (error.code === "session_not_found" || /session/i.test(error.message)) {
          setHasSession(false);
        } else {
          setError(error.message);
        }
      } else {
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

  // The recovery link never created a session (expired, already used, or opened
  // in a different browser) — guide the user to request a fresh one.
  if (hasSession === false) {
    return (
      <div className="flex flex-col gap-4 max-w-[400px]">
        <p className="type-body" style={{ color: "var(--dusty-wine)" }}>{t.resetLinkInvalid}</p>
        <Link
          href={`/${lang}/logga-in`}
          className="type-caps tap px-6 py-3 self-start transition-all hover:bg-[var(--warm-peach)]"
          style={{ border: "1px solid var(--warm-cocoa)" }}
        >
          {t.backToLogin}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 max-w-[400px]">
      <PasswordInput
        lang={lang}
        value={password}
        onChange={setPassword}
        placeholder={t.newPassword}
        minLength={6}
        autoComplete="new-password"
      />
      <button
        type="submit"
        disabled={loading || hasSession === null}
        className="type-caps tap px-6 py-3 transition-all hover:bg-[var(--warm-peach)] disabled:opacity-40"
        style={{ border: "1px solid var(--warm-cocoa)" }}
      >
        {loading ? t.thinking : t.updatePassword}
      </button>
      {error && <p className="type-body" style={{ color: "var(--dusty-wine)" }}>{error}</p>}
    </form>
  );
}
