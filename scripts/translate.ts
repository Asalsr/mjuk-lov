// Fill in the missing language side of a recipe's localized fields.
// Keeps existing non-empty values; translates empty/one-sided fields in the
// Mjuk Lov tone. Run: npm run translate -- <slug>
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { chat } from "../lib/ai/chat";
import { RecipeSchema } from "../lib/recipes/schema";

const SYSTEM = `You translate Mjuk Lov recipe content between Swedish (sv) and English (en).
For every localized field given as { sv, en }, fill any missing or empty side by translating
from the present side, preserving the warm editorial tone. Keep existing non-empty values unchanged.
Return ONLY JSON with the SAME shape and array order you received.`;

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error("Usage: npm run translate -- <slug>");
    process.exit(1);
  }

  const file = path.join(process.cwd(), "content", "recipes", `${slug}.json`);
  const recipe = RecipeSchema.parse(JSON.parse(readFileSync(file, "utf8")));

  const payload = {
    title: recipe.title,
    headnote: recipe.headnote,
    notes: recipe.notes,
    steps: recipe.steps.map((s) => s.text),
    ingredients: recipe.ingredients.map((i) => i.item),
  };

  const raw = await chat({
    system: SYSTEM,
    user: JSON.stringify(payload),
    json: true,
    maxTokens: 1600,
    temperature: 0.2,
  });
  const t = JSON.parse(raw) as Partial<typeof payload>;

  if (t.title) recipe.title = t.title;
  if (t.headnote) recipe.headnote = t.headnote;
  if (t.notes) recipe.notes = t.notes;
  if (Array.isArray(t.steps)) {
    recipe.steps = recipe.steps.map((s, i) => ({ ...s, text: t.steps?.[i] ?? s.text }));
  }
  if (Array.isArray(t.ingredients)) {
    recipe.ingredients = recipe.ingredients.map((ing, i) => ({
      ...ing, // preserve structured qty + densityKey
      item: t.ingredients?.[i] ?? ing.item,
    }));
  }

  const parsed = RecipeSchema.safeParse(recipe);
  if (!parsed.success) {
    console.error("Translation result invalid:\n" + parsed.error.message);
    process.exit(1);
  }

  writeFileSync(file, JSON.stringify(parsed.data, null, 2) + "\n", "utf8");
  console.log(`Filled both languages → content/recipes/${slug}.json`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
