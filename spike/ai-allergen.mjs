// Mjuk Lov — AI allergen + ingredient label engine (SPIKE v3, hybrid)
//
// v1 (substring) false-positived: kokosgrädde→milk, rostade→cheese.
// v2 (pure AI) fixed those, but improvised label wording and MISSED marsala→sulphites.
// v3 = hybrid, the production-shaped design:
//   1. AI reasons about ingredients and returns allergen CODES only (no free-text labels).
//   2. A deterministic safety-net catches reliable processed triggers the AI under-detects.
//   3. The bilingual declaration is built from a FIXED label table in code — never improvised.
//   4. Output is a DRAFT for human approval (correct posture for a legal declaration).
//
// PROVIDER-AGNOSTIC: prototype on OpenAI, flip PROVIDER=claude later. No logic changes.
//
// Run (PowerShell):  node spike/ai-allergen.mjs

import { readFileSync, existsSync } from "node:fs";

// --- tiny .env loader (key never goes in chat/CLI history) -----------------
function loadDotEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m) process.env[m[1]] ??= m[2].trim().replace(/^["']|["']$/g, "");
  }
}
loadDotEnv(new URL("./.env", import.meta.url).pathname.replace(/^\//, ""));

const PROVIDER = process.env.PROVIDER || "openai";

// --- canonical EU 1169/2011 labels — the ONLY source of declaration wording -
// Order is the order they appear in the declaration.
const LABELS = {
  gluten:     { sv: "gluten",     en: "gluten" },
  crustaceans:{ sv: "kräftdjur",  en: "crustaceans" },
  egg:        { sv: "ägg",        en: "egg" },
  fish:       { sv: "fisk",       en: "fish" },
  peanut:     { sv: "jordnötter", en: "peanuts" },
  soy:        { sv: "soja",       en: "soy" },
  milk:       { sv: "mjölk",      en: "milk" },
  nuts:       { sv: "nötter",     en: "tree nuts" },
  celery:     { sv: "selleri",    en: "celery" },
  mustard:    { sv: "senap",      en: "mustard" },
  sesame:     { sv: "sesam",      en: "sesame" },
  sulphites:  { sv: "sulfiter",   en: "sulphites" },
  lupin:      { sv: "lupin",      en: "lupin" },
  molluscs:   { sv: "blötdjur",   en: "molluscs" },
};

// --- deterministic safety-net: reliable, distinctive triggers AI tends to miss
// Word-boundary regex (no naive substring), so it won't re-introduce v1 bugs.
const SAFETY_NET = [
  { re: /\b(marsala|sherry|portvin|vermouth)\b/i, code: "sulphites", note: "fortified wine → sulphites (rule)" },
  { re: /\b(russin|sultanas?|torkade?\s+(aprikos|frukt))\b/i, code: "sulphites", note: "dried fruit → sulphites (rule)" },
];

// --- the contract: AI returns CODES only, plus review notes -----------------
const SYSTEM = `You are a food-safety assistant for a Swedish dessert business.
Given a recipe's ingredient list (Swedish and/or English), identify which of the
14 EU major allergens (Reg 1169/2011 Annex II) are present.

Use ONLY these exact codes:
gluten, crustaceans, egg, fish, peanut, soy, milk, nuts, celery, mustard,
sesame, sulphites, lupin, molluscs.

Reasoning rules:
- "kokosgrädde"/"coconut cream"/"kokosmjölk" is dairy-free → NOT milk.
- "mandelmjöl"/"almond flour" is nuts → NOT gluten. "glutenfritt mjöl" is gluten-free.
- Wine, marsala and dried fruit usually carry sulphites.
- Chocolate, margarine and pre-made bases often hide soy/milk → put in needsReview, don't guess.
- Be conservative: if unsure, use needsReview, do not assert.

Return ONLY JSON of this shape (do NOT write any declaration text yourself):
{
  "allergens": [{"code": "<one of the codes>", "from": "ingredient that triggered it"}],
  "needsReview": ["short note", "..."]
}`;

// --- provider-agnostic LLM call --------------------------------------------
async function callLLM(systemText, userText) {
  if (PROVIDER === "openai") return openaiJSON(systemText, userText);
  if (PROVIDER === "claude") return claudeJSON(systemText, userText);
  throw new Error(`Unknown PROVIDER "${PROVIDER}" (use "openai" or "claude")`);
}

async function openaiJSON(systemText, userText) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not set (env var or spike/.env)");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemText },
        { role: "user", content: userText },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  return JSON.parse((await res.json()).choices[0].message.content);
}

async function claudeJSON(systemText, userText) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set (env var or spike/.env)");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: process.env.CLAUDE_MODEL || "claude-sonnet-4-6",
      max_tokens: 1024, temperature: 0, system: systemText,
      messages: [{ role: "user", content: userText + "\n\nReturn ONLY the JSON object." }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const text = (await res.json()).content.map((b) => b.text || "").join("");
  return JSON.parse(text.replace(/^```json\s*|\s*```$/g, ""));
}

// --- hybrid pipeline: AI codes + safety-net, then canonical declaration -----
async function draftLabel(name, ingredients) {
  const ai = await callLLM(SYSTEM, `Recipe: ${name}\nIngredients:\n- ${ingredients.join("\n- ")}`);

  const codes = new Map();   // code -> source string
  const reviews = new Set(ai.needsReview || []);

  for (const a of ai.allergens || []) {
    if (LABELS[a.code] && !codes.has(a.code)) codes.set(a.code, a.from || "ai");
  }
  // deterministic safety-net pass
  for (const ing of ingredients) {
    for (const rule of SAFETY_NET) {
      if (rule.re.test(ing) && !codes.has(rule.code)) {
        codes.set(rule.code, ing + " [rule]");
        reviews.add(rule.note);
      }
    }
  }

  // build declaration in canonical EU order from the FIXED table
  const order = Object.keys(LABELS).filter((c) => codes.has(c));
  const decl = order.length
    ? { sv: "Innehåller: " + order.map((c) => LABELS[c].sv).join(", "),
        en: "Contains: " + order.map((c) => LABELS[c].en).join(", ") }
    : { sv: "Innehåller: inget av de 14 allergenerna", en: "Contains: none of the 14 allergens" };

  return { decl, codes, reviews };
}

// --- sample recipes (same 3, incl. the tricky ones) ------------------------
const RECIPES = {
  "Tiramisu (flagship)": [
    "300 g savoiardi (ladyfingers)", "4 ägg", "500 g mascarpone",
    "100 g socker", "3 dl starkt espresso", "4 msk marsala", "kakao till garnering",
  ],
  "Hasselnötstårta / Hazelnut layer cake": [
    "200 g vetemjöl", "4 ägg", "150 g smör", "200 g socker",
    "150 g rostade hasselnötter", "100 g mörk choklad",
  ],
  "Vegansk panna cotta (allergivänlig)": [
    "4 dl kokosgrädde", "2 msk socker", "1 tsk vaniljpasta", "2 g agar agar", "färska hallon",
  ],
};

const CROSS_CONTAM_SV = "Tillverkad i ett kök som hanterar nötter, mjölk, ägg och gluten.";

console.log(`\n=== Mjuk Lov — hybrid AI allergen DRAFT (provider: ${PROVIDER}) ===\n`);
for (const [name, ingredients] of Object.entries(RECIPES)) {
  try {
    const { decl, codes, reviews } = await draftLabel(name, ingredients);
    console.log("• " + name);
    console.log("    " + decl.sv);
    console.log("    " + decl.en);
    if (codes.size) {
      console.log("    matched: " + [...codes].map(([c, src]) => `${c} ←(${src})`).join("  |  "));
    }
    for (const r of reviews) console.log("    ⚠ review: " + r);
    console.log("    " + CROSS_CONTAM_SV);
    console.log("    (DRAFT — requires human approval before printing)\n");
  } catch (e) {
    console.error("• " + name + "  — ERROR: " + e.message + "\n");
  }
}
