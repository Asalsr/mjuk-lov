import { z } from "zod";

/** The 14 EU major allergens (Reg 1169/2011 Annex II). */
export const ALLERGEN_CODES = [
  "gluten", "crustaceans", "egg", "fish", "peanut", "soy", "milk",
  "nuts", "celery", "mustard", "sesame", "sulphites", "lupin", "molluscs",
] as const;

export const AllergenCode = z.enum(ALLERGEN_CODES);
export type AllergenCode = z.infer<typeof AllergenCode>;

/** Dietary tags a recipe can satisfy (used by the device-local diet filter). */
export const DIET_TAGS = ["vegan", "vegetarian"] as const;
export const DietTag = z.enum(DIET_TAGS);
export type DietTag = z.infer<typeof DietTag>;

/** Every user-facing string is bilingual (Swedish + English). */
const Localized = z.object({ sv: z.string(), en: z.string() });
export type Localized = z.infer<typeof Localized>;

export const RecipeSchema = z.object({
  slug: z.string().min(1),
  title: Localized,
  headnote: Localized,
  servings: z.number().int().positive(),
  time: z.object({
    prepMin: z.number().int().nonnegative(),
    totalMin: z.number().int().nonnegative(),
  }),
  /** YouTube video id for the official embed, or null if none yet. */
  youtubeId: z.string().nullable(),
  /** Optional photo URL (or /public path). Falls back to the video thumbnail, then a placeholder. */
  image: z.string().nullable().default(null),
  /** Credit when this is our original at-home take inspired by a creator's video. */
  inspiredBy: z
    .object({ channel: z.string(), url: z.string() })
    .nullable()
    .default(null),
  ingredients: z.array(z.object({ qty: z.string(), item: Localized })).min(1),
  /** Dietary tags this recipe satisfies (optional; defaults to none). */
  diet: z.array(DietTag).default([]),
  steps: z.array(Localized).min(1),
  notes: Localized,
  /** Engine output — must be human-approved before publishing (see index.ts). */
  allergens: z.object({
    codes: z.array(AllergenCode),
    declaration: Localized,
    needsReview: z.array(z.string()),
    approvedBy: z.string(),
    approvedAt: z.string(),
  }),
  published: z.boolean(),
});

export type Recipe = z.infer<typeof RecipeSchema>;
