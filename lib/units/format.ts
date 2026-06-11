import { type UnitCode, UNITS } from "./units";
import type { Lang } from "@/lib/i18n";

// Kitchen-friendly display: spoons and cups read better as fractions
// (¾ cup, not 0.74 cup); weights/volumes read better rounded sensibly.

const FRACTIONS: Array<[number, string]> = [
  [1 / 8, "⅛"],
  [1 / 4, "¼"],
  [1 / 3, "⅓"],
  [3 / 8, "⅜"],
  [1 / 2, "½"],
  [5 / 8, "⅝"],
  [2 / 3, "⅔"],
  [3 / 4, "¾"],
  [7 / 8, "⅞"],
];

const FRACTION_UNITS = new Set<UnitCode>(["tsp", "tbsp", "cup"]);

function decimal(value: number, lang: Lang, places: number): string {
  let s = value.toFixed(places);
  if (s.includes(".")) s = s.replace(/\.?0+$/, ""); // strip trailing zeros only after a decimal point
  return lang === "sv" ? s.replace(".", ",") : s;
}

/** Snap small spoon/cup amounts to the nearest common fraction. */
function toFraction(value: number, lang: Lang): string {
  const whole = Math.floor(value);
  const frac = value - whole;

  let best = "";
  let bestErr = 0.06; // tolerance — beyond this, fall back to a decimal
  if (frac <= bestErr) return String(whole); // effectively whole
  for (const [v, glyph] of FRACTIONS) {
    const err = Math.abs(frac - v);
    if (err < bestErr) {
      bestErr = err;
      best = glyph;
    }
  }
  if (!best) return decimal(value, lang, 2);
  return whole > 0 ? `${whole}${best}` : best;
}

/** The numeric part only (no unit label) — used when the unit is shown separately (e.g. a dropdown). */
export function formatValue(value: number, unit: UnitCode, lang: Lang): string {
  if (unit === "piece") return String(Math.round(value));

  if (FRACTION_UNITS.has(unit) && value < 10) return toFraction(value, lang);

  // Weights / metric volumes / large spoon counts.
  if (value >= 50) return decimal(Math.round(value), lang, 0);
  if (value >= 10) return decimal(Math.round(value * 2) / 2, lang, 1); // nearest 0.5
  if (value >= 1) return decimal(value, lang, 1);
  return decimal(value, lang, 2);
}

/** "1½ msk" / "1½ tbsp" — number plus the unit's localized label. */
export function formatAmount(value: number, unit: UnitCode, lang: Lang): string {
  return `${formatValue(value, unit, lang)} ${UNITS[unit].label[lang]}`;
}
