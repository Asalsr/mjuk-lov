// Unit definitions for the recipe ingredient converter.
//
// Recipes are authored in EU/metric (g, dl, ml, tsk=5 ml, msk=15 ml), so metric
// is the canonical stored form and the default display. US customary is offered
// as an opt-in. Spoon/cup sizes differ between the two systems, so the few
// volume units whose size is system-dependent resolve their millilitre value
// through `mlPerVolumeUnit(unit, system)` rather than a fixed factor.

export type Dimension = "mass" | "volume" | "count";
export type System = "metric" | "us";

/** Canonical unit codes. The recipe Zod schema derives its enum from this so
 *  the data model can never drift from the converter. */
export const UNIT_CODES = [
  "g", "kg", "oz", "lb", // mass
  "ml", "dl", "l", "tsp", "tbsp", "cup", "floz", // volume
  "piece", // count
] as const;

export type UnitCode = (typeof UNIT_CODES)[number];

export interface UnitDef {
  dimension: Dimension;
  /** Which system this unit belongs to (for grouping the dropdown). "both" = shown in either. */
  system: System | "both";
  /** Short label shown in the UI (sv / en / fa). */
  label: { sv: string; en: string; fa: string };
}

export const UNITS: Record<UnitCode, UnitDef> = {
  // mass (base = gram)
  g: { dimension: "mass", system: "metric", label: { sv: "g", en: "g", fa: "گرم" } },
  kg: { dimension: "mass", system: "metric", label: { sv: "kg", en: "kg", fa: "کیلوگرم" } },
  oz: { dimension: "mass", system: "us", label: { sv: "oz", en: "oz", fa: "اونس" } },
  lb: { dimension: "mass", system: "us", label: { sv: "lb", en: "lb", fa: "پوند" } },
  // volume (base = millilitre)
  ml: { dimension: "volume", system: "metric", label: { sv: "ml", en: "ml", fa: "میلی‌لیتر" } },
  dl: { dimension: "volume", system: "metric", label: { sv: "dl", en: "dl", fa: "دسی‌لیتر" } },
  l: { dimension: "volume", system: "metric", label: { sv: "l", en: "l", fa: "لیتر" } },
  // tsk / msk in the source data; the Swedish names are shown in sv.
  tsp: { dimension: "volume", system: "both", label: { sv: "tsk", en: "tsp", fa: "ق.چ" } },
  tbsp: { dimension: "volume", system: "both", label: { sv: "msk", en: "tbsp", fa: "ق.غ" } },
  cup: { dimension: "volume", system: "both", label: { sv: "cup", en: "cup", fa: "پیمانه" } },
  floz: { dimension: "volume", system: "us", label: { sv: "fl oz", en: "fl oz", fa: "اونس مایع" } },
  // count
  piece: { dimension: "count", system: "both", label: { sv: "st", en: "pcs", fa: "عدد" } },
};

/** Grams per 1 unit of mass. */
const GRAMS_PER_MASS_UNIT: Partial<Record<UnitCode, number>> = {
  g: 1,
  kg: 1000,
  oz: 28.349523125,
  lb: 453.59237,
};

/** Millilitres per 1 unit of volume, for units whose size is fixed across systems. */
const ML_PER_FIXED_VOLUME_UNIT: Partial<Record<UnitCode, number>> = {
  ml: 1,
  dl: 100,
  l: 1000,
  floz: 29.5735295625, // US fluid ounce
};

/**
 * Millilitres per 1 spoon/cup, which differ by system.
 * Metric (Swedish/EU): tsk 5, msk 15, cup (kkp) 250.
 * US customary: tsp 4.92892159, tbsp 14.7867648, cup 236.5882365.
 */
const ML_PER_SYSTEM_VOLUME_UNIT: Record<System, Partial<Record<UnitCode, number>>> = {
  metric: { tsp: 5, tbsp: 15, cup: 250 },
  us: { tsp: 4.92892159, tbsp: 14.7867648, cup: 236.5882365 },
};

export function gramsPerMassUnit(unit: UnitCode): number {
  const g = GRAMS_PER_MASS_UNIT[unit];
  if (g == null) throw new Error(`Not a mass unit: ${unit}`);
  return g;
}

export function mlPerVolumeUnit(unit: UnitCode, system: System): number {
  const fixed = ML_PER_FIXED_VOLUME_UNIT[unit];
  if (fixed != null) return fixed;
  const sys = ML_PER_SYSTEM_VOLUME_UNIT[system][unit];
  if (sys != null) return sys;
  throw new Error(`Not a volume unit: ${unit}`);
}

export function dimensionOf(unit: UnitCode): Dimension {
  return UNITS[unit].dimension;
}

/** Units offered in the per-row dropdown for a given dimension, ordered for kitchen use. */
export const UNITS_BY_DIMENSION: Record<Dimension, UnitCode[]> = {
  mass: ["g", "kg", "oz", "lb"],
  volume: ["ml", "dl", "l", "tsp", "tbsp", "cup", "floz"],
  count: ["piece"],
};
