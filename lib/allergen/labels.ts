import type { AllergenCode } from "../recipes/schema";

/** Canonical EU 1169/2011 label wording — the ONLY source of declaration text.
 *  Key order = the order allergens appear in a declaration. */
export const LABELS: Record<AllergenCode, { sv: string; en: string; fa: string }> = {
  gluten:      { sv: "gluten",     en: "gluten",      fa: "گلوتن" },
  crustaceans: { sv: "kräftdjur",  en: "crustaceans", fa: "سخت‌پوستان" },
  egg:         { sv: "ägg",        en: "egg",         fa: "تخم‌مرغ" },
  fish:        { sv: "fisk",       en: "fish",        fa: "ماهی" },
  peanut:      { sv: "jordnötter", en: "peanuts",     fa: "بادام‌زمینی" },
  soy:         { sv: "soja",       en: "soy",         fa: "سویا" },
  milk:        { sv: "mjölk",      en: "milk",        fa: "شیر" },
  nuts:        { sv: "nötter",     en: "tree nuts",   fa: "آجیل درختی" },
  celery:      { sv: "selleri",    en: "celery",      fa: "کرفس" },
  mustard:     { sv: "senap",      en: "mustard",     fa: "خردل" },
  sesame:      { sv: "sesam",      en: "sesame",      fa: "کنجد" },
  sulphites:   { sv: "sulfiter",   en: "sulphites",   fa: "سولفیت" },
  lupin:       { sv: "lupin",      en: "lupin",       fa: "لوپین" },
  molluscs:    { sv: "blötdjur",   en: "molluscs",    fa: "نرم‌تنان" },
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
