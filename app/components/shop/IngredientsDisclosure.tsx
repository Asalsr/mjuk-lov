"use client";

import { useId, useState } from "react";
import { ui, type Lang } from "@/lib/i18n";
import { LABELS, CANONICAL_ORDER } from "@/lib/allergen/labels";
import type { AllergenCode } from "@/lib/recipes/schema";

/** Ingredients + allergen disclosure for a shop product card (EU FIC 1169/2011).
 *
 *  The allergen line is ALWAYS visible when the product contains any of the 14
 *  major allergens: the law requires disclosure before purchase without the
 *  customer asking, so it renders by default and never hides behind the toggle.
 *  The full ingredient list sits in a panel that is collapsed to zero height by
 *  default and animates open on tap. State is local to each instance, so cards
 *  open independently and one card's panel never grows or reflows another's
 *  (same isolation as the size stepper).
 *
 *  Accessibility (house rule §3): the muted allergen line uses the solid
 *  `.ink-muted` token, never text opacity (opacity on cream fails WCAG); the
 *  toggle is a real <button> with a >=40px tap target via padding (not a larger
 *  glyph); the chevron is aria-hidden and the panel is wired with
 *  aria-expanded/aria-controls. The grid-rows 0fr->1fr animation is flattened
 *  automatically under prefers-reduced-motion by globals.css.
 *
 *  The Inter font family, terracotta accent, and cocoa divider match the size
 *  row's "+" treatment so this reads as part of the same card, not a new panel. */
export function IngredientsDisclosure({
  lang,
  allergens,
  ingredients,
  className,
}: {
  lang: Lang;
  allergens?: AllergenCode[];
  ingredients?: { sv: string; en: string; fa: string };
  className?: string;
}) {
  const t = ui[lang];
  const [open, setOpen] = useState(false);
  const panelId = useId();

  // Declare in the canonical EU label order, not the authoring order.
  const present = CANONICAL_ORDER.filter((c) => allergens?.includes(c));
  const hasAllergens = present.length > 0;
  const hasIngredients = !!ingredients && ingredients[lang].trim().length > 0;

  // No allergens and no list: render nothing so the card keeps its no-data
  // height exactly (task point 7).
  if (!hasAllergens && !hasIngredients) return null;

  const inter = "var(--font-inter), Inter, system-ui, sans-serif";

  return (
    <div className={className}>
      {/* Allergen line (left) + Ingredients toggle (right) on one row. On a
          narrow card flex-wrap drops the toggle to its own line, and ms-auto
          keeps it right-aligned there (same wrap rule as the stepper). */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {hasAllergens && (
          <span
            className="ink-muted uppercase"
            style={{ fontFamily: inter, fontSize: "0.75rem", letterSpacing: "0.04em", lineHeight: 1.4 }}
          >
            {t.contains} {present.map((c) => LABELS[c][lang]).join(", ")}
          </span>
        )}
        {hasIngredients && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls={panelId}
            className="ms-auto inline-flex items-center gap-1 py-2.5 transition-colors"
            style={{ color: "var(--dusty-terracotta)", fontFamily: inter, fontSize: "0.75rem", fontWeight: 500 }}
          >
            {t.ingredients}
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              style={{ transition: "transform 220ms ease", transform: open ? "rotate(180deg)" : "none" }}
            >
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Expandable panel. grid-rows 0fr->1fr animates to the content's natural
          height with no magic max-height, stays contained to this card, and adds
          zero height while closed. */}
      {hasIngredients && (
        <div
          id={panelId}
          className="grid"
          style={{ gridTemplateRows: open ? "1fr" : "0fr", transition: "grid-template-rows 220ms ease" }}
        >
          <div style={{ overflow: "hidden" }}>
            <p
              style={{
                fontFamily: inter,
                fontSize: "0.75rem",
                lineHeight: 1.6,
                color: "var(--warm-cocoa)",
                marginTop: "0.5rem",
                paddingTop: "0.5rem",
                borderTop: "0.5px solid rgba(61, 42, 34, 0.18)",
              }}
            >
              {ingredients![lang]}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
