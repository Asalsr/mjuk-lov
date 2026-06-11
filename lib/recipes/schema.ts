import { z } from "zod";
import { UNIT_CODES } from "@/lib/units/units";

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

/** Every user-facing string carries Swedish + English; Persian (`fa`) is
 *  optional and falls back to English so /fa routes render before content is
 *  professionally translated. The transform guarantees `fa` is always a string,
 *  so `localized[lang]` is safe for every Lang without touching call sites. */
export const Localized = z
  .object({ sv: z.string(), en: z.string(), fa: z.string().optional() })
  .transform((o) => ({ sv: o.sv, en: o.en, fa: o.fa ?? o.en }));
export type Localized = z.infer<typeof Localized>;

/** A structured, convertible amount (e.g. 250 g, 1 tsp) … */
export const Amount = z.object({
  value: z.number().positive(),
  unit: z.enum(UNIT_CODES),
});
export type Amount = z.infer<typeof Amount>;

/** … or a qualitative quantity that can't be converted ("a pinch", "to taste"). */
export const Quantity = z.union([Amount, z.object({ text: Localized })]);
export type Quantity = z.infer<typeof Quantity>;

/** A method step: localized text plus optional per-step timing and photo.
 *  Legacy recipes authored a step as a bare { sv, en }; `z.preprocess` wraps
 *  that into { text } so every consumer can read `step.text` uniformly. */
const StepBody = z.object({
  text: Localized,
  /** Hands-on/elapsed minutes for this step (optional; shown as a chip). */
  durationMin: z.number().int().positive().optional(),
  /** Photo for this step — /public path or URL (optional; M9b). */
  image: z.string().optional(),
});
export const Step = z.preprocess(
  (v) => (v && typeof v === "object" && "text" in v ? v : { text: v }),
  StepBody,
);
export type Step = z.infer<typeof Step>;

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
  ingredients: z
    .array(
      z.object({
        qty: Quantity,
        item: Localized,
        /** Optional ref into the density table, enabling mass↔volume conversion for this row. */
        densityKey: z.string().optional(),
      }),
    )
    .min(1),
  /** Optional oven temperature, shown with a °C/°F toggle. */
  oven: z
    .object({ value: z.number(), unit: z.enum(["C", "F"]) })
    .nullable()
    .default(null),
  /** Dietary tags this recipe satisfies (optional; defaults to none). */
  diet: z.array(DietTag).default([]),
  /** Equipment/tools needed (optional; bilingual). */
  equipment: z.array(Localized).default([]),
  /** Richer yield than `servings` alone, e.g. "one 20 cm cake" (optional). */
  yieldNote: Localized.optional(),
  steps: z.array(Step).min(1),
  notes: Localized,
  /** Actionable technique tips, distinct from `notes` (optional; bilingual). */
  tips: z.array(Localized).default([]),
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
