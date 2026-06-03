import type { AllergenCode } from "../recipes/schema";

/** Canonical EU 1169/2011 label wording — the ONLY source of declaration text.
 *  Key order = the order allergens appear in a declaration. */
export const LABELS: Record<AllergenCode, { sv: string; en: string }> = {
  gluten:      { sv: "gluten",     en: "gluten" },
  crustaceans: { sv: "kräftdjur",  en: "crustaceans" },
  egg:         { sv: "ägg",        en: "egg" },
  fish:        { sv: "fisk",       en: "fish" },
  peanut:      { sv: "jordnötter", en: "peanuts" },
  soy:         { sv: "soja",       en: "soy" },
  milk:        { sv: "mjölk",      en: "milk" },
  nuts:        { sv: "nötter",     en: "tree nuts" },
  celery:      { sv: "selleri",    en: "celery" },
  mustard:     { sv: "senap",      en: "mustard" },
  sesame:      { sv: "sesam",      en: "sesame" },
  sulphites:   { sv: "sulfiter",   en: "sulphites" },
  lupin:       { sv: "lupin",      en: "lupin" },
  molluscs:    { sv: "blötdjur",   en: "molluscs" },
};

export const CANONICAL_ORDER = Object.keys(LABELS) as AllergenCode[];

/** Reliable, distinctive triggers the AI tends to under-detect — especially on
 *  vague AI-generated ingredient names (e.g. "cashew mascarpone", "vegan
 *  ladyfingers"). Word-start boundaries (no naive substring) so compounds like
 *  "kokosgrädde"/"rostade" don't false-trigger. Milk/egg are left to the AI,
 *  which reasons about coconut/cashew correctly (keywords there would misfire). */
export const SAFETY_NET: { re: RegExp; code: AllergenCode; note: string }[] = [
  { re: /\b(marsala|sherry|portvin|vermouth)\b/i, code: "sulphites", note: "fortified wine → sulphites (rule)" },
  { re: /\b(russin|sultanas?|torkade?\s+(aprikos|frukt))\b/i, code: "sulphites", note: "dried fruit → sulphites (rule)" },
  {
    re: /\b(cashew|hasselnöt|mandel|valnöt|pekan|pistage|pistasch|pistachio|paranöt|macadamia|hazelnut|almond|walnut|pecan)/i,
    code: "nuts",
    note: "nut ingredient → nuts (rule)",
  },
  {
    re: /\b(vetemjöl|vete|wheat|savoiardi|ladyfinger|rågmjöl|råg|korn|havre|dinkel|spelt|semolina|mannagryn|barley|rye)/i,
    code: "gluten",
    note: "cereal → gluten (rule)",
  },
];

/** Phrases that SUPPRESS a safety-net code even if its keyword matches
 *  (e.g. "gluten-free ladyfingers" must not be flagged gluten). */
export const NEGATIONS: Partial<Record<AllergenCode, RegExp[]>> = {
  gluten: [/glutenfri/i, /gluten[-\s]?free/i],
};

export function buildDeclaration(codes: AllergenCode[]): { sv: string; en: string } {
  const ordered = CANONICAL_ORDER.filter((c) => codes.includes(c));
  if (ordered.length === 0) {
    return {
      sv: "Innehåller: inget av de 14 allergenerna",
      en: "Contains: none of the 14 allergens",
    };
  }
  return {
    sv: "Innehåller: " + ordered.map((c) => LABELS[c].sv).join(", "),
    en: "Contains: " + ordered.map((c) => LABELS[c].en).join(", "),
  };
}
