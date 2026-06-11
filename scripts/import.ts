// Import a recipe from a URL (YouTube or a recipe page) into a draft JSON.
// The AI extracts factual ingredients + steps and writes an ORIGINAL headnote in
// Mjuk Lov's voice (no copied prose). Output is an UNPUBLISHED draft — review it,
// run `npm run label`, then set approvedBy + published.
//
// Run: npm run import -- <url>
import { writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { chat } from "../lib/ai/chat";
import { RecipeSchema } from "../lib/recipes/schema";
import { parseQty } from "../lib/units/parse";
import { resolveDensityKey } from "../lib/units/densities";

function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  return m ? m[1] : null;
}

async function fetchPageText(url: string): Promise<string> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; MjukLovBot)" } });
    const html = await res.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .slice(0, 6000);
  } catch {
    return "";
  }
}

const SYSTEM = `You extract dessert recipes into structured JSON for Mjuk Lov, a premium Swedish dessert brand.
Provide BOTH Swedish (sv) and English (en) for every text field — translate as needed.
Write an ORIGINAL short headnote in Mjuk Lov's warm, editorial voice. Do NOT copy the source's prose or descriptions.
Extract only factual ingredients and steps. Set diet tags only if clearly true.

Return ONLY JSON of this shape:
{
  "slug": "kebab-case-english-slug",
  "title": { "sv": "", "en": "" },
  "headnote": { "sv": "", "en": "" },
  "servings": 8,
  "time": { "prepMin": 0, "totalMin": 0 },
  "ingredients": [{ "qty": "", "item": { "sv": "", "en": "" } }],
  "steps": [{ "sv": "", "en": "" }],
  "notes": { "sv": "", "en": "" },
  "diet": []
}`;

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error("Usage: npm run import -- <url>");
    process.exit(1);
  }

  const vid = youtubeId(url);
  const pageText = await fetchPageText(url);

  const raw = await chat({
    system: SYSTEM,
    user: `Source URL: ${url}\n\nPage text (may be partial):\n${pageText || "(unavailable — infer from the URL)"}`,
    json: true,
    maxTokens: 1600,
    temperature: 0.3,
  });

  const data = JSON.parse(raw) as Record<string, unknown>;
  const diet = Array.isArray(data.diet)
    ? (data.diet as string[]).filter((d) => d === "vegan" || d === "vegetarian")
    : [];

  // The AI extracts qty as free text ("250 g", "1 tsk"); convert to the
  // structured form and assign a densityKey. Unparseable strings fall back to
  // a qualitative text quantity for the author to fix.
  const rawIngredients = Array.isArray(data.ingredients) ? data.ingredients : [];
  const ingredients = (rawIngredients as { qty?: unknown; item?: { sv: string; en: string } }[]).map(
    (ing) => {
      const item = ing.item ?? { sv: "", en: "" };
      const parsed = typeof ing.qty === "string" ? parseQty(ing.qty) : null;
      const qty = parsed ?? { text: { sv: String(ing.qty ?? ""), en: String(ing.qty ?? "") } };
      const densityKey = resolveDensityKey(`${item.sv} ${item.en}`);
      return { qty, item, ...(densityKey ? { densityKey } : {}) };
    },
  );

  const recipe = {
    ...data,
    ingredients,
    youtubeId: vid,
    diet,
    allergens: { codes: [], declaration: { sv: "", en: "" }, needsReview: [], approvedBy: "", approvedAt: "" },
    published: false,
  };

  const parsed = RecipeSchema.safeParse(recipe);
  if (!parsed.success) {
    console.error("Extracted recipe failed validation:\n" + parsed.error.message);
    process.exit(1);
  }

  const file = path.join(process.cwd(), "content", "recipes", `${parsed.data.slug}.json`);
  if (existsSync(file)) {
    console.error(`Refusing to overwrite existing ${parsed.data.slug}.json`);
    process.exit(1);
  }

  writeFileSync(file, JSON.stringify(parsed.data, null, 2) + "\n", "utf8");
  console.log(`Imported DRAFT → content/recipes/${parsed.data.slug}.json${vid ? ` (video ${vid})` : ""}`);
  console.log(`Next: npm run label -- ${parsed.data.slug}  → review → set approvedBy + "published": true`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
