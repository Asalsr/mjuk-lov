"use client";

import { useUserData, toggleAllergy, toggleDiet, clearFilters } from "@/lib/userdata/store";
import { LABELS } from "@/lib/allergen/labels";
import { ALLERGEN_CODES, DIET_TAGS } from "@/lib/recipes/schema";
import { ui, type Lang } from "@/lib/i18n";

export function DietFilter({ lang }: { lang: Lang }) {
  const data = useUserData();
  const t = ui[lang];
  const active = data.profile.allergies.length + data.profile.diet.length > 0;

  return (
    <div className="mb-12 p-6 md:p-8" style={{ border: "1px solid rgba(61, 42, 34, 0.15)" }}>
      <div className="flex items-center justify-between mb-5">
        <div className="type-caps opacity-60">{t.yourPreferences}</div>
        {active && (
          <button
            type="button"
            onClick={clearFilters}
            className="type-caps opacity-50 transition-colors hover:opacity-100 hover:text-[var(--dusty-terracotta)]"
          >
            {t.clearFilters}
          </button>
        )}
      </div>

      <div className="mb-5">
        <div className="type-caps opacity-40 mb-2" style={{ fontSize: "0.6875rem" }}>{t.diet}</div>
        <div className="flex flex-wrap gap-2">
          {DIET_TAGS.map((tag) => {
            const on = data.profile.diet.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleDiet(tag)}
                className="type-caps tap px-3"
                style={{
                  border: "1px solid rgba(61, 42, 34, 0.2)",
                  backgroundColor: on ? "var(--warm-peach)" : "transparent",
                }}
              >
                {t[tag]}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="type-caps opacity-40 mb-2" style={{ fontSize: "0.6875rem" }}>{t.avoidAllergens}</div>
        <div className="flex flex-wrap gap-2">
          {ALLERGEN_CODES.map((code) => {
            const on = data.profile.allergies.includes(code);
            return (
              <button
                key={code}
                type="button"
                onClick={() => toggleAllergy(code)}
                className="type-caps tap"
                style={{
                  fontSize: "0.625rem",
                  padding: "0.25rem 0.6rem",
                  border: "1px solid rgba(61, 42, 34, 0.2)",
                  backgroundColor: on ? "var(--dusty-terracotta)" : "transparent",
                  color: on ? "var(--vanilla-cream)" : "inherit",
                }}
              >
                {LABELS[code][lang]}
              </button>
            );
          })}
        </div>
      </div>

      <p className="type-caps opacity-40 mt-5" style={{ fontSize: "0.625rem" }}>
        {t.savedOnDevice}
      </p>
    </div>
  );
}
