"use client";

import { useEffect, useState } from "react";
import type { Recipe } from "@/lib/recipes/schema";
import type { Lang } from "@/lib/i18n";
import { type UnitCode, UNITS, UNITS_BY_DIMENSION, dimensionOf } from "@/lib/units/units";
import { convert } from "@/lib/units/convert";
import { densityFor } from "@/lib/units/densities";
import { formatValue } from "@/lib/units/format";

type Ingredient = Recipe["ingredients"][number];

// A global, cross-recipe preference: "show every <source unit> as <target unit>".
// Keyed by the recipe's native unit, so picking g→oz once applies everywhere.
const STORE_KEY = "mjuklov_unitmap";

const T = {
  sv: { heading: "Enheter", show: (u: string) => `Visa ${u} som`, noDensity: "visas i originalenhet" },
  en: { heading: "Units", show: (u: string) => `Show ${u} as`, noDensity: "shown in its original unit" },
} as const;

// Spoon/cup sizes use the EU/metric definition (the recipes' authored system).
const SYSTEM = "metric" as const;

/** Units offered when remapping a source unit: its own dimension, then the other (mass↔volume). */
function optionsFor(source: UnitCode): UnitCode[] {
  const dim = dimensionOf(source);
  if (dim === "count") return ["piece"];
  const other = dim === "mass" ? "volume" : "mass";
  return [...UNITS_BY_DIMENSION[dim], ...UNITS_BY_DIMENSION[other]];
}

function readMap(): Record<string, UnitCode> {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, UnitCode>) : {};
  } catch {
    return {};
  }
}

export function IngredientList({
  ingredients,
  lang,
}: {
  ingredients: Recipe["ingredients"];
  lang: Lang;
}) {
  const [unitMap, setUnitMap] = useState<Record<string, UnitCode>>({});
  const t = T[lang];

  useEffect(() => {
    setUnitMap(readMap());
  }, []);

  const setSourceUnit = (source: UnitCode, target: UnitCode) => {
    setUnitMap((prev) => {
      const next = { ...prev, [source]: target };
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  // Distinct measurable source units this recipe uses, in first-seen order.
  const sourceUnits: UnitCode[] = [];
  for (const ing of ingredients) {
    if ("value" in ing.qty) {
      const u = ing.qty.unit;
      if (dimensionOf(u) !== "count" && !sourceUnits.includes(u)) sourceUnits.push(u);
    }
  }

  const display = (ing: Ingredient): { text: string; fallback: boolean } => {
    const qty = ing.qty;
    if ("text" in qty) return { text: qty.text[lang], fallback: false };

    const native = qty.unit;
    if (dimensionOf(native) === "count") {
      return { text: formatValue(qty.value, native, lang), fallback: false };
    }
    const target = unitMap[native] ?? native;
    const density = densityFor(ing.densityKey);
    try {
      const value = convert(qty.value, native, target, { system: SYSTEM, density });
      return { text: `${formatValue(value, target, lang)} ${UNITS[target].label[lang]}`, fallback: false };
    } catch {
      // Cross-dimension requested but this ingredient has no density — keep native.
      return { text: `${formatValue(qty.value, native, lang)} ${UNITS[native].label[lang]}`, fallback: true };
    }
  };

  return (
    <div>
      {sourceUnits.length > 0 && (
        <div role="group" aria-label={t.heading} className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-5">
          <span className="type-caps ink-muted" style={{ fontSize: "0.75rem" }}>
            {t.heading}
          </span>
          {sourceUnits.map((su) => (
            <select
              key={su}
              aria-label={t.show(UNITS[su].label[lang])}
              value={unitMap[su] ?? su}
              onChange={(e) => setSourceUnit(su, e.target.value as UnitCode)}
              className="type-caps ink-muted tap cursor-pointer"
              style={{
                fontSize: "0.675rem",
                backgroundColor: "var(--vanilla-cream)",
                border: "1px solid rgba(61, 42, 34, 0.2)",
                padding: "0.12rem 0.25rem",
                appearance: "none",
                WebkitAppearance: "none",
                textAlign: "center",
                textAlignLast: "center",
                minHeight: "2.34rem", // 15% less than the .tap 2.75rem default
                height: "2.34rem",
              }}
            >
              {optionsFor(su).map((u) => (
                <option key={u} value={u}>
                  {UNITS[u].label[lang]}
                </option>
              ))}
            </select>
          ))}
        </div>
      )}

      <ul className="divide-y" style={{ borderColor: "rgba(61, 42, 34, 0.1)" }}>
        {ingredients.map((ing, i) => {
          const d = display(ing);
          return (
            <li
              key={i}
              className="flex items-baseline justify-between gap-4 py-2.5"
              style={{ borderColor: "rgba(61, 42, 34, 0.1)" }}
            >
              <span className="type-body">{ing.item[lang]}</span>
              <span
                className="type-caps ink-muted whitespace-nowrap"
                title={d.fallback ? t.noDensity : undefined}
                style={d.fallback ? { borderBottom: "1px dotted rgba(61, 42, 34, 0.35)" } : undefined}
              >
                {d.text}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
