// One-off backfill: convert the legacy free-text `qty` strings in every
// content/recipes/*.json into the structured { value, unit } | { text } form,
// and assign a densityKey from the ingredient name where one is known.
//
// Idempotent: ingredients whose qty is already an object are left untouched.
// Reports any qty string it can't parse and exits non-zero so they can be
// fixed by hand rather than silently dropped.
//
// Run: npm run structure-qty

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseQty } from "../lib/units/parse";
import { resolveDensityKey } from "../lib/units/densities";

const DIR = join(process.cwd(), "content", "recipes");

type RawIngredient = { qty: unknown; item: { sv: string; en: string }; densityKey?: string };

let changed = 0;
const unparsed: string[] = [];

for (const file of readdirSync(DIR).filter((f) => f.endsWith(".json"))) {
  const path = join(DIR, file);
  const recipe = JSON.parse(readFileSync(path, "utf8")) as { ingredients: RawIngredient[] };
  let touched = false;

  recipe.ingredients = recipe.ingredients.map((ing) => {
    // Convert a legacy string qty if present; otherwise keep the structured one.
    let qty = ing.qty;
    if (typeof qty === "string") {
      const parsed = parseQty(qty);
      if (!parsed) {
        unparsed.push(`${file}: "${qty}" (${ing.item.en})`);
        return ing; // leave as-is; reported below
      }
      qty = parsed;
      touched = true;
    }
    // Always (re)assign densityKey from the (possibly expanded) resolver so a
    // re-run picks up newly-covered ingredients.
    const densityKey = resolveDensityKey(`${ing.item.sv} ${ing.item.en}`) ?? undefined;
    if (densityKey !== ing.densityKey) touched = true;
    return { qty, item: ing.item, ...(densityKey ? { densityKey } : {}) };
  });

  if (touched) {
    writeFileSync(path, JSON.stringify(recipe, null, 2) + "\n", "utf8");
    changed++;
  }
}

console.log(`Structured quantities in ${changed} recipe file(s).`);
if (unparsed.length) {
  console.error(`\n${unparsed.length} qty string(s) could not be parsed — fix by hand:`);
  for (const u of unparsed) console.error("  • " + u);
  process.exit(1);
}
