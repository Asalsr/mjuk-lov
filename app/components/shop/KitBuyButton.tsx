"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ui, type Lang } from "@/lib/i18n";

export function KitBuyButton({ productId, lang }: { productId: string; lang: Lang }) {
  const t = ui[lang];
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  // Ref guard: blocks a second click before the `loading` state re-renders,
  // which would otherwise open two Stripe checkout sessions (double charge).
  const inFlight = useRef(false);

  const buy = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, lang, code: code.trim() || undefined }),
      });
      if (res.status === 401) {
        router.push(`/${lang}/logga-in`);
        return;
      }
      const out = await res.json();
      if (out.url) window.location.href = out.url; // → Stripe hosted checkout
      else setError(out.error === "invalid_code" ? t.invalidCode : t.aiError);
    } catch {
      setError(t.aiError);
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  };

  return (
    <div>
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder={t.discountCode}
        aria-label={t.discountCode}
        autoComplete="off"
        className="w-full p-3 mb-2 type-body bg-transparent"
        style={{ border: "1px solid rgba(61, 42, 34, 0.2)" }}
      />
      <button
        type="button"
        onClick={buy}
        disabled={loading}
        className="type-caps w-full px-6 py-3 transition-all hover:bg-[var(--warm-peach)] disabled:opacity-40"
        style={{ border: "1px solid var(--warm-cocoa)" }}
      >
        {loading ? t.thinking : t.buy}
      </button>
      {error && <p className="type-body mt-2" role="alert" aria-live="assertive" style={{ color: "var(--dusty-wine)" }}>{error}</p>}
    </div>
  );
}
