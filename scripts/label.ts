// Draft an allergen label for a recipe (AI + safety-net) and write it back as a
// DRAFT for human review. Re-drafting clears approval — a regenerated legal label
// must be re-checked before publishing.
//
// Run: npm run label -- <slug>
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { RecipeSchema } from "../lib/recipes/schema";
import { quantityToString } from "../lib/recipes/qty";
import { aiDetect } from "../lib/allergen/provider";
import { draftLabel } from "../lib/allergen/engine";

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error("Usage: npm run label -- <slug>");
    process.exit(1);
  }

  const file = path.join(process.cwd(), "content", "recipes", `${slug}.json`);
  const recipe = RecipeSchema.parse(JSON.parse(readFileSync(file, "utf8")));

  const ingredientStrings = recipe.ingredients.map(
    (i) => `${quantityToString(i.qty, "sv")} ${i.item.sv} / ${i.item.en}`,
  );
  const label = await draftLabel(ingredientStrings, aiDetect);

  console.log(`\nDraft allergen label for "${slug}":`);
  console.log("  codes :", label.codes.join(", ") || "(none)");
  console.log("  sv    :", label.declaration.sv);
  console.log("  en    :", label.declaration.en);
  for (const r of label.needsReview) console.log("  ⚠     :", r);

  recipe.allergens = {
    codes: label.codes,
    declaration: label.declaration,
    needsReview: label.needsReview,
    approvedBy: "", // cleared — review and re-approve before publishing
    approvedAt: "",
  };
  writeFileSync(file, JSON.stringify(recipe, null, 2) + "\n", "utf8");
  console.log(`\nWrote DRAFT to ${slug}.json — review it, then set allergens.approvedBy before publishing.`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
