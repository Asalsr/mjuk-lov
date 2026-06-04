"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ui, type Lang } from "@/lib/i18n";

export function KitBuyButton({ productId, lang }: { productId: string; lang: Lang }) {
  const t = ui[lang];
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buy = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, lang }),
      });
      if (res.status === 401) {
        router.push(`/${lang}/logga-in`);
        return;
      }
      const out = await res.json();
      if (out.url) window.location.href = out.url; // → Stripe hosted checkout
      else setError(t.aiError);
    } catch {
      setError(t.aiError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={buy}
        disabled={loading}
        className="type-caps w-full px-6 py-3 transition-all hover:bg-[var(--warm-peach)] disabled:opacity-40"
        style={{ border: "1px solid var(--warm-cocoa)" }}
      >
        {loading ? t.thinking : t.buy}
      </button>
      {error && <p className="type-body mt-2" style={{ color: "var(--dusty-wine)" }}>{error}</p>}
    </div>
  );
}
