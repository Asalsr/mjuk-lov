// Ingredient densities (grams per millilitre) for mass↔volume conversion.
//
// There is NO universal gram↔teaspoon factor — it depends on the ingredient
// (1 tsp of flour ≈ 2.6 g, of sugar ≈ 4.2 g, of water = 5 g). To convert
// between mass and volume we need the ingredient's density. These are curated
// approximate baking values (standard published weights); they are good enough
// for kitchen use, not laboratory precision. Mark each new ingredient here.
//
// An ingredient line carries an optional `densityKey` into this table. If it
// has no key, the converter only offers same-dimension units for that row.

export const DENSITIES: Record<string, number> = {
  // flours & dry starches
  flour: 0.53, // all-purpose / wheat flour
  cornmeal: 0.62,
  cornstarch: 0.54,
  oats: 0.41,
  cocoa: 0.45,
  // sugars
  sugar: 0.85, // granulated / caster
  brownSugar: 0.93, // packed
  powderedSugar: 0.56, // icing / confectioners'
  // fats
  butter: 0.911,
  oil: 0.918,
  peanutButter: 1.08,
  // liquids
  water: 1.0,
  milk: 1.03,
  cream: 1.0,
  buttermilk: 1.03,
  juice: 1.0, // lemon / citrus juice
  honey: 1.42,
  syrup: 1.37,
  // dairy solids
  creamCheese: 1.0,
  mascarpone: 1.0,
  yogurt: 1.03,
  // leaveners & seasonings (small spoon amounts)
  bakingPowder: 0.9,
  bakingSoda: 0.9,
  salt: 1.2,
  vanilla: 0.88, // extract (liquid)
  yeast: 0.8, // dry
  gelatin: 0.7, // powdered
  // mix-ins
  chocolate: 0.7, // chopped
  chocolateChips: 0.75,
  nuts: 0.5, // chopped
  raisins: 0.8,
  sprinkles: 0.8,
};

export type DensityKey = keyof typeof DENSITIES;

export function densityFor(key: string | undefined | null): number | null {
  if (!key) return null;
  return DENSITIES[key] ?? null;
}

/**
 * Best-effort mapping from an ingredient's name (sv/en) to a density key.
 * Used by the backfill script to assign `densityKey`; order matters
 * (more specific patterns first). Returns null when nothing matches —
 * the ingredient then stays mass↔mass / volume↔volume only.
 */
// Order matters — more specific patterns first (peanut butter before butter,
// chocolate chips before chocolate, brown/icing sugar before sugar).
const RULES: Array<{ key: DensityKey; re: RegExp }> = [
  { key: "peanutButter", re: /jordnötssmör|peanut ?butter/i },
  { key: "powderedSugar", re: /florsocker|icing sugar|powdered sugar|confectioner/i },
  { key: "brownSugar", re: /(brun|farin|muscovado)\w*\s*socker|brown sugar|muscovado/i },
  { key: "vanilla", re: /vaniljsocker|vanilla sugar/i }, // vanilla sugar ≈ sugar-based, but treat as vanilla mass-wise
  { key: "sugar", re: /socker|sugar/i },
  { key: "cocoa", re: /kakao|cocoa/i },
  { key: "chocolateChips", re: /chokladbitar|chokladknappar|chocolate chips|choc(olate)? chips/i },
  { key: "chocolate", re: /choklad|chocolate/i },
  { key: "cornstarch", re: /majsstärkelse|maizena|cornstarch|corn ?flour/i },
  { key: "cornmeal", re: /majsmjöl|cornmeal|polenta/i },
  { key: "oats", re: /havregryn|havre|oats|oat\b/i },
  { key: "flour", re: /mjöl|flour/i },
  { key: "buttermilk", re: /kärnmjölk|buttermilk/i },
  { key: "butter", re: /smör|butter/i },
  { key: "oil", re: /olja|oil/i },
  { key: "creamCheese", re: /färskost|cream cheese/i },
  { key: "mascarpone", re: /mascarpone/i },
  { key: "yogurt", re: /yoghurt|yogurt/i },
  { key: "milk", re: /mjölk|\bmilk\b/i },
  { key: "cream", re: /grädde|\bcream\b/i },
  { key: "honey", re: /honung|honey/i },
  { key: "syrup", re: /sirap|syrup|golden syrup|treacle/i },
  { key: "juice", re: /juice|saft|citronsaft|lemon juice/i },
  { key: "water", re: /vatten|water/i },
  { key: "bakingPowder", re: /bakpulver|baking powder/i },
  { key: "bakingSoda", re: /bikarbonat|baking soda|sodium bicarbonate/i },
  { key: "salt", re: /\bsalt\b/i },
  { key: "vanilla", re: /vanilj|vanilla/i }, // extract
  { key: "yeast", re: /\bjäst\b|\byeast\b/i },
  { key: "gelatin", re: /gelatin|gelatine|gelatinblad/i },
  { key: "nuts", re: /\bnöt|mandel|almond|pekan|pecan|valnöt|walnut|cashew|hasselnöt|hazelnut|pistage|pistachio/i },
  { key: "raisins", re: /russin|raisins/i },
  { key: "sprinkles", re: /strössel|sprinkles|nonpareil/i },
];

export function resolveDensityKey(name: string): DensityKey | null {
  for (const { key, re } of RULES) {
    if (re.test(name)) return key;
  }
  return null;
}
