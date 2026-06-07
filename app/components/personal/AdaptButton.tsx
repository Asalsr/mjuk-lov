"use client";

import { useState } from "react";
import { ui, type Lang } from "@/lib/i18n";

type Swap = { from: string; to: string; note: string };
type AdaptResult = {
  summary: string;
  swaps: Swap[];
  adaptedIngredients: { qty: string; item: string }[];
  allergens: { codes: string[]; declaration: { sv: string; en: string } } | null;
};

export function AdaptButton({
  lang,
  slug,
  title,
  ingredients,
  targets = ["vegetarian", "vegan"],
}: {
  lang: Lang;
  slug: string;
  title: string;
  ingredients: { qty: string; item: string }[];
  /** Which diets to offer — a recipe already satisfying a diet omits it. */
  targets?: ("vegan" | "vegetarian")[];
}) {
  const t = ui[lang];
  const [loading, setLoading] = useState<"vegan" | "vegetarian" | null>(null);
  const [result, setResult] = useState<AdaptResult | null>(null);
  const [error, setError] = useState(false);

  const adapt = async (target: "vegan" | "vegetarian") => {
    if (loading) return;
    setLoading(target);
    setError(false);
    setResult(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "adapt", lang, target, recipe: { slug, title, ingredients } }),
      });
      const out = await res.json();
      if (!res.ok || out.error) setError(true);
      else setResult(out);
    } catch {
      setError(true);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {targets.includes("vegetarian") && (
          <button
            type="button"
            onClick={() => adapt("vegetarian")}
            disabled={loading !== null}
            className="type-caps tap px-5 py-3 transition-all hover:bg-[var(--warm-peach)] disabled:opacity-40"
            style={{ border: "1px solid var(--warm-cocoa)" }}
          >
            {loading === "vegetarian" ? t.thinking : t.makeVegetarian}
          </button>
        )}
        {targets.includes("vegan") && (
          <button
            type="button"
            onClick={() => adapt("vegan")}
            disabled={loading !== null}
            className="type-caps tap px-5 py-3 transition-all hover:bg-[var(--warm-peach)] disabled:opacity-40"
            style={{ border: "1px solid var(--warm-cocoa)" }}
          >
            {loading === "vegan" ? t.thinking : t.makeVegan}
          </button>
        )}
      </div>

      {error && <p className="type-body opacity-70 mt-4" style={{ color: "var(--dusty-wine)" }}>{t.aiError}</p>}

      {result && (
        <div className="mt-6 p-6 md:p-8" style={{ backgroundColor: "var(--soft-peach)", border: "1px solid rgba(61, 42, 34, 0.15)" }}>
          <div className="type-caps opacity-60 mb-3">{t.adaptHeading}</div>
          <p className="type-body mb-5">{result.summary}</p>

          {result.swaps.length > 0 && (
            <>
              <div className="type-caps opacity-40 mb-2" style={{ fontSize: "0.6875rem" }}>{t.swapsHeading}</div>
              <ul className="space-y-2 mb-5">
                {result.swaps.map((s, i) => (
                  <li key={i} className="type-body">
                    <span className="opacity-60 line-through">{s.from}</span>
                    {" → "}
                    <span style={{ color: "var(--dusty-terracotta)" }}>{s.to}</span>
                    {s.note ? <span className="opacity-60"> — {s.note}</span> : null}
                  </li>
                ))}
              </ul>
            </>
          )}

          {result.allergens && (
            <div className="mb-4">
              <div className="type-caps opacity-40 mb-1" style={{ fontSize: "0.6875rem" }}>{t.adaptedAllergens}</div>
              <p className="type-body">{result.allergens.declaration[lang]}</p>
            </div>
          )}

          <p className="type-caps opacity-40" style={{ fontSize: "0.625rem" }}>{t.aiDisclaimer}</p>
        </div>
      )}
    </div>
  );
}
