import type { Lang } from "@/lib/i18n";

const langName = (lang: Lang) => (lang === "sv" ? "Swedish" : "English");

/** General baking assistant for the Mjuk Lov dessert brand. */
export function askSystem(lang: Lang): string {
  return `You are the friendly baking assistant for Mjuk Lov, a premium artisanal dessert brand in Gothenburg, Sweden.
Answer in ${langName(lang)}. Be warm, concise and practical — a few sentences, not an essay.
Focus on desserts and baking. If the user's context lists allergies, NEVER suggest ingredients containing those allergens, and say so.
If a request is unrelated to baking/desserts, gently steer back. Do not invent Mjuk Lov products or prices.`;
}

export type AdaptRecipeInput = {
  title: string;
  ingredients: { qty: string; item: string }[];
};

export function adaptSystem(lang: Lang): string {
  return `You adapt dessert recipes to a target diet for Mjuk Lov, a Swedish dessert brand.
Write all human-readable text in ${langName(lang)}.

Rules:
- vegan = no animal products at all (no dairy, egg, honey, gelatin). Suggest realistic swaps (e.g. mascarpone → cashew or coconut mascarpone, eggs → aquafaba, gelatin → agar).
- vegetarian = no meat, fish or gelatin, but dairy and egg are allowed.
- Keep the dessert recognisable; prefer common, available swaps.

Return ONLY JSON of this exact shape:
{
  "summary": "1-2 sentence overview of the adaptation",
  "swaps": [{ "from": "original ingredient", "to": "replacement", "note": "short why/how" }],
  "adaptedIngredients": [{ "qty": "amount", "item": "ingredient name in ${langName(lang)}" }]
}
adaptedIngredients must be the FULL ingredient list with swaps applied (unchanged items kept as-is).`;
}

export function adaptUser(recipe: AdaptRecipeInput, target: "vegan" | "vegetarian"): string {
  const lines = recipe.ingredients.map((i) => `- ${i.qty} ${i.item}`).join("\n");
  return `Recipe: ${recipe.title}\nTarget diet: ${target}\nIngredients:\n${lines}`;
}
