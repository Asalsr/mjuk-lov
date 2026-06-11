"use client";

import { useState } from "react";
import { useUserData, setProfile } from "@/lib/userdata/store";
import { ui, type Lang } from "@/lib/i18n";

export function AskAssistant({ lang }: { lang: Lang }) {
  const data = useUserData();
  const t = ui[lang];
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const consented = data.profile.consentAi;

  const ask = async () => {
    if (!question.trim() || loading) return;
    setLoading(true);
    setError(false);
    setAnswer(null);
    try {
      // Only attach diet/allergies (health data) if the user consented.
      const userContext = consented
        ? { diet: data.profile.diet, allergies: data.profile.allergies }
        : undefined;
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "ask", lang, question, userContext }),
        signal: AbortSignal.timeout(30000),
      });
      const out = await res.json();
      if (!res.ok || out.error) setError(true);
      else setAnswer(out.answer);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-16 p-6 md:p-8" style={{ border: "1px solid rgba(61, 42, 34, 0.15)", backgroundColor: "var(--vanilla-cream)" }}>
      <div className="type-caps ink-muted mb-4">{t.askHeading}</div>

      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder={t.askPlaceholder}
        rows={2}
        maxLength={500}
        className="w-full p-4 type-body bg-transparent"
        style={{ border: "1px solid rgba(61, 42, 34, 0.2)" }}
      />

      <label className="flex items-start gap-3 mt-4 cursor-pointer">
        <input
          type="checkbox"
          checked={consented}
          onChange={(e) => setProfile({ consentAi: e.target.checked })}
          className="mt-1"
        />
        <span className="type-body ink-muted" style={{ fontSize: "0.85rem" }}>
          {t.consentLabel}
        </span>
      </label>

      <button
        type="button"
        onClick={ask}
        disabled={loading || !question.trim()}
        className="type-caps tap mt-5 px-6 py-3 transition-all hover:bg-[var(--warm-peach)] disabled:opacity-40"
        style={{ border: "1px solid var(--warm-cocoa)" }}
      >
        {loading ? <span role="status" aria-live="polite">{t.thinking}</span> : t.askButton}
      </button>

      {error && <p className="type-body opacity-70 mt-5" role="alert" aria-live="assertive" style={{ color: "var(--dusty-wine)" }}>{t.aiError}</p>}
      {answer && (
        <div className="mt-6 pt-6" style={{ borderTop: "1px solid rgba(61, 42, 34, 0.12)" }}>
          <p className="type-body whitespace-pre-wrap">{answer}</p>
          <p className="type-caps ink-muted mt-4" style={{ fontSize: "0.75rem" }}>{t.aiDisclaimer}</p>
        </div>
      )}
    </div>
  );
}
