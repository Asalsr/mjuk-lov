"use client";

import { useUserData, toggleAllergy, toggleDiet, clearFilters } from "@/lib/userdata/store";
import { LABELS } from "@/lib/allergen/labels";
import { DIET_TAGS, type AllergenCode } from "@/lib/recipes/schema";
import { ui, type Lang } from "@/lib/i18n";

/** The full 14 EU allergens (schema.ts) stay complete for legal recipe
 *  declarations, but this filter only needs to offer ones that actually occur
 *  across the current recipe content — everything else is noise in the chip
 *  list on a sweets-only site. */
const SWEETS_ALLERGEN_CODES: AllergenCode[] = ["gluten", "egg", "milk", "peanut", "nuts", "sulphites"];

export function DietFilter({ lang }: { lang: Lang }) {
  const data = useUserData();
  const t = ui[lang];
  const active = data.profile.allergies.length + data.profile.diet.length > 0;

  return (
    <div className="mb-12 p-6 md:p-8" style={{ border: "1px solid rgba(61, 42, 34, 0.15)" }}>
      <div className="flex items-center justify-between mb-5">
        <div className="type-caps ink-muted">{t.yourPreferences}</div>
        {active && (
          <button
            type="button"
            onClick={clearFilters}
            className="type-caps ink-muted transition-colors hover:text-[var(--dusty-terracotta)]"
          >
            {t.clearFilters}
          </button>
        )}
      </div>

      <div className="mb-5">
        <div className="type-caps ink-muted mb-2" style={{ fontSize: "0.75rem" }}>{t.diet}</div>
        <div className="flex flex-wrap gap-2">
          {DIET_TAGS.map((tag) => {
            const on = data.profile.diet.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleDiet(tag)}
                aria-pressed={on}
                className="type-caps tap px-3"
                style={{
                  border: on ? "1px solid var(--warm-cocoa)" : "1px solid rgba(61, 42, 34, 0.2)",
                  backgroundColor: on ? "var(--warm-peach)" : "transparent",
                  fontWeight: on ? 600 : undefined,
                }}
              >
                {on ? "✓ " : ""}{t[tag]}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="type-caps ink-muted mb-2" style={{ fontSize: "0.75rem" }}>{t.avoidAllergens}</div>
        <div className="flex flex-wrap gap-2">
          {SWEETS_ALLERGEN_CODES.map((code) => {
            const on = data.profile.allergies.includes(code);
            return (
              <button
                key={code}
                type="button"
                onClick={() => toggleAllergy(code)}
                aria-pressed={on}
                className="type-caps tap"
                style={{
                  fontSize: "0.75rem",
                  padding: "0.25rem 0.6rem",
                  border: on ? "1px solid var(--dusty-terracotta)" : "1px solid rgba(61, 42, 34, 0.2)",
                  backgroundColor: on ? "var(--dusty-terracotta)" : "transparent",
                  color: on ? "var(--vanilla-cream)" : "inherit",
                }}
              >
                {on ? "✓ " : ""}{LABELS[code][lang]}
              </button>
            );
          })}
        </div>
      </div>

      <p className="type-caps ink-muted mt-5" style={{ fontSize: "0.75rem" }}>
        {t.savedOnDevice}
      </p>
    </div>
  );
}
