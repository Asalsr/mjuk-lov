import {
  type System,
  type UnitCode,
  dimensionOf,
  gramsPerMassUnit,
  mlPerVolumeUnit,
} from "./units";

export interface ConvertOptions {
  /** Spoon/cup sizing system. Defaults to metric (EU), the authored form. */
  system?: System;
  /** Ingredient density in g/ml — required only for mass↔volume conversion. */
  density?: number | null;
}

/**
 * Convert `value` from one unit to another.
 *
 * Same-dimension conversions (mass↔mass, volume↔volume) never need a density.
 * Mass↔volume requires `density` (g/ml); without it this throws — callers
 * should gate the option with `canConvert()` so the UI never offers it.
 * Count units (`piece`) only convert to themselves.
 */
export function convert(
  value: number,
  from: UnitCode,
  to: UnitCode,
  { system = "metric", density = null }: ConvertOptions = {},
): number {
  if (from === to) return value;

  const fromDim = dimensionOf(from);
  const toDim = dimensionOf(to);

  if (fromDim === "count" || toDim === "count") {
    if (fromDim === toDim) return value;
    throw new Error(`Cannot convert count unit between ${from} and ${to}`);
  }

  if (fromDim === "mass" && toDim === "mass") {
    return (value * gramsPerMassUnit(from)) / gramsPerMassUnit(to);
  }
  if (fromDim === "volume" && toDim === "volume") {
    return (value * mlPerVolumeUnit(from, system)) / mlPerVolumeUnit(to, system);
  }

  // Cross-dimension: needs density.
  if (density == null || !(density > 0)) {
    throw new Error(`Mass↔volume conversion (${from}→${to}) needs a density`);
  }
  if (fromDim === "mass" && toDim === "volume") {
    const grams = value * gramsPerMassUnit(from);
    const ml = grams / density;
    return ml / mlPerVolumeUnit(to, system);
  }
  // volume → mass
  const ml = value * mlPerVolumeUnit(from, system);
  const grams = ml * density;
  return grams / gramsPerMassUnit(to);
}

/** Whether `from`→`to` is possible given whether a density is available. */
export function canConvert(from: UnitCode, to: UnitCode, hasDensity: boolean): boolean {
  const fromDim = dimensionOf(from);
  const toDim = dimensionOf(to);
  if (fromDim === "count" || toDim === "count") return fromDim === toDim;
  if (fromDim === toDim) return true;
  return hasDensity; // mass↔volume
}

export type TempUnit = "C" | "F";

export function convertTemp(value: number, from: TempUnit, to: TempUnit): number {
  if (from === to) return value;
  return from === "C" ? value * (9 / 5) + 32 : (value - 32) * (5 / 9);
}
