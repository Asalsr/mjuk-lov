// M0 acceptance check — verifies recipe files validate and load typed.
// Run: npx tsx scripts/check-recipes.ts
import { getAllRecipes, getRecipe, getPublishedRecipes } from "../lib/recipes/index";

const all = getAllRecipes();
console.log(`Loaded & validated ${all.length} recipe(s).`);

const t = getRecipe("tiramisu");
if (!t) {
  console.error("FAIL: getRecipe('tiramisu') returned null");
  process.exit(1);
}

console.log("OK getRecipe('tiramisu') →");
console.log("  title.sv      :", t.title.sv);
console.log("  servings      :", t.servings);
console.log("  ingredients   :", t.ingredients.length);
console.log("  allergens     :", t.allergens.codes.join(", "));
console.log("  declaration.sv:", t.allergens.declaration.sv);
console.log("  approvedBy    :", t.allergens.approvedBy || "(none)");

console.log(`Published (approved) recipes: ${getPublishedRecipes().length}`);
