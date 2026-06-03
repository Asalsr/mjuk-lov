import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { RecipeSchema, type Recipe } from "./schema";

// This is the swappable data layer. Phase 1 reads local JSON files; Phase 2
// can replace these functions with Supabase queries without touching callers.
const RECIPES_DIR = path.join(process.cwd(), "content", "recipes");

/** Load and validate every recipe file. Throws on invalid data (fails the build). */
export function getAllRecipes(): Recipe[] {
  const files = readdirSync(RECIPES_DIR).filter((f) => f.endsWith(".json"));
  return files.map((file) => {
    const raw = JSON.parse(readFileSync(path.join(RECIPES_DIR, file), "utf8"));
    const result = RecipeSchema.safeParse(raw);
    if (!result.success) {
      throw new Error(`Invalid recipe "${file}":\n${result.error.message}`);
    }
    return result.data;
  });
}

export function getRecipe(slug: string): Recipe | null {
  return getAllRecipes().find((r) => r.slug === slug) ?? null;
}

/** Only published recipes whose allergen label a human has approved. */
export function getPublishedRecipes(): Recipe[] {
  return getAllRecipes().filter(
    (r) => r.published && r.allergens.approvedBy.trim() !== "",
  );
}
