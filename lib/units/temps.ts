import { convertTemp } from "./convert";

// Matches a temperature written with a degree sign: "215°C", "190 °C", "350°F".
const TEMP_RE = /(\d+(?:[.,]\d+)?)\s*°\s*(C|F)\b/gi;

/**
 * Rewrites every temperature in a piece of text to show both scales, e.g.
 * "Bake at 215°C" → "Bake at 215°C (419°F)". Always-both (no toggle), so it
 * works inside step instructions and notes without any client interaction.
 * Runs once on authored text; idempotent enough for that use.
 */
export function annotateTemps(text: string): string {
  return text.replace(TEMP_RE, (_m, num: string, unitRaw: string) => {
    const unit = unitRaw.toUpperCase() as "C" | "F";
    const other = unit === "C" ? "F" : "C";
    const value = parseFloat(num.replace(",", "."));
    const converted = Math.round(convertTemp(value, unit, other));
    return `${num}°${unit} (${converted}°${other})`;
  });
}
