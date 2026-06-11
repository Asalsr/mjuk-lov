import type { UnitCode } from "./units";

// Parses the legacy free-text `qty` strings (authored in EU/Swedish units) into
// the structured form. Used by the backfill script. Returns null when a string
// can't be parsed so the script can report it for manual handling rather than
// guessing.

export type ParsedQty = { value: number; unit: UnitCode } | { text: { sv: string; en: string } };

const UNIT_WORD: Record<string, UnitCode> = {
  g: "g",
  kg: "kg",
  ml: "ml",
  dl: "dl",
  l: "l",
  tsk: "tsp", // Swedish teaspoon
  msk: "tbsp", // Swedish tablespoon
  st: "piece",
};

// Qualitative phrases that carry no convertible quantity.
const QUALITATIVE: Record<string, { sv: string; en: string }> = {
  "till garnering": { sv: "till garnering", en: "to garnish" },
  "till servering": { sv: "till servering", en: "to serve" },
  "efter smak": { sv: "efter smak", en: "to taste" },
  "en nypa": { sv: "en nypa", en: "a pinch" },
};

function parseNumber(s: string): number | null {
  const t = s.trim();
  const mixed = t.match(/^(\d+)\s+(\d+)\/(\d+)$/); // "1 1/2"
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const frac = t.match(/^(\d+)\s*\/\s*(\d+)$/); // "3/4"
  if (frac) return Number(frac[1]) / Number(frac[2]);
  const dec = t.replace(",", "."); // "1,5" → "1.5"
  if (/^\d+(\.\d+)?$/.test(dec)) return parseFloat(dec);
  return null;
}

export function parseQty(raw: string): ParsedQty | null {
  const s = raw.trim();

  // number + optional single unit word: "300 g", "1/2 tsk", "1,5 tsk", "4", "1 krm", "1 nypa"
  const m = s.match(/^(\d+(?:[.,]\d+)?|\d+\s*\/\s*\d+|\d+\s+\d+\/\d+)\s*([a-zA-ZåäöÅÄÖ]+)?$/);
  if (m) {
    const num = parseNumber(m[1]);
    if (num == null) return null;
    const word = (m[2] ?? "").toLowerCase();
    if (!word) return { value: num, unit: "piece" }; // bare number = count
    if (word === "krm") return { value: num, unit: "ml" }; // 1 krm (kryddmått) = 1 ml
    if (word === "nypa" || word === "nypor") {
      return { text: { sv: `${m[1]} nypa`, en: `${m[1]} pinch` } };
    }
    const u = UNIT_WORD[word];
    if (u) return { value: num, unit: u };
    return null; // unknown unit word → report
  }

  const phrase = QUALITATIVE[s.toLowerCase()];
  if (phrase) return { text: phrase };

  return null; // unparseable
}
