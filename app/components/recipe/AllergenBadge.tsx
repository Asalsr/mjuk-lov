import { LABELS } from "@/lib/allergen/labels";
import { ui, type Lang } from "@/lib/i18n";
import type { AllergenCode } from "@/lib/recipes/schema";

/** Inline chips for cards / compact views. */
export function AllergenChips({ codes, lang }: { codes: AllergenCode[]; lang: Lang }) {
  if (codes.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2">
      {codes.map((c) => (
        <li
          key={c}
          className="type-caps ink-muted"
          style={{
            fontSize: "0.75rem",
            padding: "0.2rem 0.55rem",
            border: "1px solid rgba(61, 42, 34, 0.18)",
          }}
        >
          {LABELS[c][lang]}
        </li>
      ))}
    </ul>
  );
}

/** Full declaration block for the detail page — styled like a printed label,
 *  echoing the physical jar/box labels. Public-facing: legal declaration +
 *  cross-contamination line. (needsReview is author-only, never shown.) */
export function AllergenBlock({
  declaration,
  lang,
}: {
  declaration: { sv: string; en: string; fa: string };
  lang: Lang;
}) {
  const t = ui[lang];
  return (
    <div
      className="p-6 md:p-8"
      style={{ backgroundColor: "var(--soft-peach)", border: "1px solid rgba(61, 42, 34, 0.15)" }}
    >
      <div className="type-caps ink-muted mb-3">{t.allergens}</div>
      <p className="type-serif" style={{ fontSize: "clamp(1.1rem, 2vw, 1.35rem)" }}>
        {declaration[lang]}
      </p>
      <p className="type-caps ink-muted mt-4" style={{ fontSize: "0.75rem", lineHeight: 1.6 }}>
        {t.crossContamination}
      </p>
      <p className="type-caps ink-muted mt-2" style={{ fontSize: "0.75rem", lineHeight: 1.6 }}>
        {t.checkPackaging}
      </p>
    </div>
  );
}
