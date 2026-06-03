// Mjuk Lov — allergen + ingredient label engine (SPIKE / go-no-go)
// Goal: prove we can turn a free-text bilingual (sv/en) ingredient list into
// an EU 1169/2011-compliant allergen declaration, automatically.
//
// This is throwaway-quality on purpose. If the output is trustworthy on real
// dessert recipes, the concept is viable and we port this to a TS module in
// app/lib/. If it's garbage, we rethink.
//
// Run:  node spike/allergen-engine.mjs

// --- The 14 EU major allergens (Reg 1169/2011 Annex II) -------------------
// Each entry: bilingual display label + keywords that signal it (sv + en).
// Keywords are matched as substrings on a normalised lowercase line.
const ALLERGENS = {
  gluten:    { sv: "gluten",    en: "gluten",     keys: ["vetemjöl","vete ","vetemj","mannagryn","ströbröd","savoiardi","ladyfinger","sockerkak","kex","digestive","rågmjöl","råg","korn","havre","dinkel","spelt","wheat","flour","breadcrumb","semolina","barley","rye"] },
  egg:       { sv: "ägg",       en: "egg",        keys: ["ägg","äggula","äggvita","egg","yolk"] },
  milk:      { sv: "mjölk",     en: "milk",       keys: ["mjölk","grädde","smör","mascarpone","ost","crème fraiche","gräddfil","yoghurt","milk","cream","butter","cheese","whey","vassle"] },
  nuts:      { sv: "nötter",    en: "tree nuts",  keys: ["hasselnöt","mandel","mandelmjöl","valnöt","pekannöt","cashew","pistage","paranöt","macadamia","nöt","hazelnut","almond","walnut","pecan","pistachio","brazil nut"] },
  peanut:    { sv: "jordnötter",en: "peanuts",    keys: ["jordnöt","peanut"] },
  soy:       { sv: "soja",      en: "soy",        keys: ["soja","soy","lecitin","lecithin"] },
  sesame:    { sv: "sesam",     en: "sesame",     keys: ["sesam","sesame","tahini"] },
  sulphite:  { sv: "sulfit",    en: "sulphites",  keys: ["marsala","vin","sherry","russin","torkad frukt","aprikos","sulfit","wine","raisin","dried apricot","sulphite","sulfite"] },
  fish:      { sv: "fisk",      en: "fish",       keys: ["fisk","lax","torsk","ansjovis","fish","salmon","cod","anchovy"] },
  crustacean:{ sv: "skaldjur",  en: "crustaceans",keys: ["räk","krabba","hummer","shrimp","prawn","crab","lobster"] },
  mollusc:   { sv: "blötdjur",  en: "molluscs",   keys: ["mussla","ostron","bläckfisk","mussel","oyster","squid","clam"] },
  celery:    { sv: "selleri",   en: "celery",     keys: ["selleri","celery"] },
  mustard:   { sv: "senap",     en: "mustard",    keys: ["senap","mustard"] },
  lupin:     { sv: "lupin",     en: "lupin",      keys: ["lupin"] },
};

// "Free-from" phrases that should SUPPRESS an allergen even if a keyword hits.
// e.g. "glutenfritt mjöl" contains both "gluten" and "mjöl" but is gluten-free.
const NEGATIONS = {
  gluten: ["glutenfri", "gluten-free", "gluten free"],
  milk:   ["laktosfri", "lactose-free", "lactose free", "mjölkfri", "veganskt smör", "vegan butter"],
};

// Ambiguous keywords that should match but be flagged for human review,
// because the substring is genuinely uncertain (a compliance tool assists,
// it does not silently certify).
const REVIEW_FLAGS = [
  { key: "mjöl", note: "‘mjöl’ alone — confirm wheat vs nut/seed flour" },
  { key: "choklad", note: "chocolate — check label for soy lecithin / milk / nuts" },
  { key: "chocolate", note: "chocolate — check label for soy lecithin / milk / nuts" },
];

function normalise(line) {
  return line.toLowerCase().trim();
}

function detectAllergens(ingredients) {
  const found = new Map();   // allergen -> Set of matched source words
  const reviews = new Set();

  for (const raw of ingredients) {
    const line = normalise(raw);

    for (const [code, def] of Object.entries(ALLERGENS)) {
      // skip if a free-from phrase for this allergen is present on the line
      const negated = (NEGATIONS[code] || []).some((n) => line.includes(n));
      if (negated) continue;

      for (const key of def.keys) {
        if (line.includes(key)) {
          if (!found.has(code)) found.set(code, new Set());
          found.get(code).add(key.trim());
          break;
        }
      }
    }

    for (const r of REVIEW_FLAGS) {
      if (line.includes(r.key)) reviews.add(r.note);
    }
  }
  return { found, reviews };
}

// Build the bilingual "Contains" declaration string, EU-style.
function buildDeclaration(found) {
  if (found.size === 0) return { sv: "—", en: "—" };
  const sv = [], en = [];
  for (const [code] of found) {
    sv.push(ALLERGENS[code].sv);
    en.push(ALLERGENS[code].en);
  }
  return {
    sv: "Innehåller: " + sv.join(", "),
    en: "Contains: " + en.join(", "),
  };
}

// --- Sample real Mjuk Lov recipes -----------------------------------------
const RECIPES = {
  "Tiramisu (flagship)": [
    "300 g savoiardi (ladyfingers)",
    "4 ägg",
    "500 g mascarpone",
    "100 g socker",
    "3 dl starkt espresso",
    "4 msk marsala",
    "kakao till garnering",
  ],
  "Hasselnötstårta / Hazelnut layer cake": [
    "200 g vetemjöl",
    "4 ägg",
    "150 g smör",
    "200 g socker",
    "150 g rostade hasselnötter",
    "100 g mörk choklad",
  ],
  "Vegansk panna cotta (allergivänlig)": [
    "4 dl kokosgrädde",
    "2 msk socker",
    "1 tsk vaniljpasta",
    "2 g agar agar",
    "färska hallon",
  ],
};

// Cross-contamination line — from the handbook §6.7.
const CROSS_CONTAM = {
  sv: "Tillverkad i ett kök som hanterar nötter, mjölk, ägg och gluten.",
  en: "Produced in a kitchen that handles nuts, milk, eggs and gluten.",
};

console.log("\n=== Mjuk Lov — auto allergen labels (spike) ===\n");
for (const [name, ingredients] of Object.entries(RECIPES)) {
  const { found, reviews } = detectAllergens(ingredients);
  const decl = buildDeclaration(found);
  console.log("• " + name);
  console.log("    " + decl.sv);
  console.log("    " + decl.en);
  if (found.size) {
    const detail = [...found.entries()]
      .map(([c, words]) => `${c} ←(${[...words].join(", ")})`)
      .join("  |  ");
    console.log("    matched: " + detail);
  }
  if (reviews.size) {
    for (const r of reviews) console.log("    ⚠ review: " + r);
  }
  console.log("    " + CROSS_CONTAM.sv);
  console.log();
}
