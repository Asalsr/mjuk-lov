// Fill the Persian (fa) side of every localized field in a recipe, translating
// idiomatically from the English source. sv/en are the source of truth and are
// left untouched. Run:
//   npm run translate -- <slug>     # one recipe
//   npm run translate -- --all      # every recipe in content/recipes/
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { chat } from "../lib/ai/chat";
import { RecipeSchema, type Recipe } from "../lib/recipes/schema";

const RECIPES_DIR = path.join(process.cwd(), "content", "recipes");

const SYSTEM = `You are a native Persian (fa-IR) food writer localizing a Swedish dessert brand's recipe site into natural, idiomatic Persian — the way a real Iranian recipe site reads, NEVER word-by-word.
Rules:
- Translate the given English values into fluent Persian. Output Persian only.
- Keep the brand name "Mjuk Lov" in Latin script, never transliterated.
- Preserve temperature tokens EXACTLY, e.g. "215°C" stays "215°C" (Western digits + °C). Keep other numbers in prose as Western digits (e.g. 10–12), not Persian digits.
- Use the formal register (شما, verb endings -ید) for instructions (e.g. اضافه کنید, بپزید).
- Preserve array length and order EXACTLY — one Persian string per input string.
Return ONLY a JSON object with EXACTLY these keys:
{ "title": string, "headnote": string, "notes": string, "yieldNote": string,
  "declaration": string, "steps": string[], "ingredients": string[],
  "qtyTexts": string[], "tips": string[], "equipment": string[] }
If an input is an empty string or empty array, return the same empty value.`;

type FaPayload = {
  title: string; headnote: string; notes: string; yieldNote: string; declaration: string;
  steps: string[]; ingredients: string[]; qtyTexts: string[]; tips: string[]; equipment: string[];
};

async function translateRecipe(recipe: Recipe): Promise<Recipe> {
  const src = {
    title: recipe.title.en,
    headnote: recipe.headnote.en,
    notes: recipe.notes.en,
    yieldNote: recipe.yieldNote?.en ?? "",
    declaration: recipe.allergens.declaration.en,
    steps: recipe.steps.map((s) => s.text.en),
    ingredients: recipe.ingredients.map((i) => i.item.en),
    // qualitative quantities ("to taste"); "" for structured {value,unit} rows
    qtyTexts: recipe.ingredients.map((i) => ("text" in i.qty ? i.qty.text.en : "")),
    tips: recipe.tips.map((t) => t.en),
    equipment: recipe.equipment.map((e) => e.en),
  };

  const raw = await chat({ system: SYSTEM, user: JSON.stringify(src), json: true, maxTokens: 2500, temperature: 0.3 });
  const fa = JSON.parse(raw) as Partial<FaPayload>;
  const faAt = (arr: string[] | undefined, i: number, fallback: string) => arr?.[i] || fallback;

  return {
    ...recipe,
    title: { ...recipe.title, fa: fa.title || recipe.title.en },
    headnote: { ...recipe.headnote, fa: fa.headnote || recipe.headnote.en },
    notes: { ...recipe.notes, fa: fa.notes || recipe.notes.en },
    yieldNote: recipe.yieldNote ? { ...recipe.yieldNote, fa: fa.yieldNote || recipe.yieldNote.en } : recipe.yieldNote,
    steps: recipe.steps.map((s, i) => ({ ...s, text: { ...s.text, fa: faAt(fa.steps, i, s.text.en) } })),
    ingredients: recipe.ingredients.map((ing, i) => ({
      ...ing,
      item: { ...ing.item, fa: faAt(fa.ingredients, i, ing.item.en) },
      qty: "text" in ing.qty ? { text: { ...ing.qty.text, fa: faAt(fa.qtyTexts, i, ing.qty.text.en) } } : ing.qty,
    })),
    tips: recipe.tips.map((t, i) => ({ ...t, fa: faAt(fa.tips, i, t.en) })),
    equipment: recipe.equipment.map((e, i) => ({ ...e, fa: faAt(fa.equipment, i, e.en) })),
    allergens: {
      ...recipe.allergens,
      declaration: { ...recipe.allergens.declaration, fa: fa.declaration || recipe.allergens.declaration.en },
    },
  };
}

async function runOne(slug: string): Promise<void> {
  const file = path.join(RECIPES_DIR, `${slug}.json`);
  const recipe = RecipeSchema.parse(JSON.parse(readFileSync(file, "utf8")));
  const out = await translateRecipe(recipe);
  const parsed = RecipeSchema.safeParse(out);
  if (!parsed.success) throw new Error(`Invalid after translation (${slug}):\n${parsed.error.message}`);
  writeFileSync(file, JSON.stringify(parsed.data, null, 2) + "\n", "utf8");
  console.log(`✓ fa filled → content/recipes/${slug}.json`);
}

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: npm run translate -- <slug> | --all");
    process.exit(1);
  }
  const slugs =
    arg === "--all"
      ? readdirSync(RECIPES_DIR).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""))
      : [arg];
  for (const slug of slugs) {
    try {
      await runOne(slug);
    } catch (e) {
      console.error(`✗ ${slug}: ${e instanceof Error ? e.message : e}`);
    }
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
