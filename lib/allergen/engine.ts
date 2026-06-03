import { ALLERGEN_CODES, type AllergenCode } from "../recipes/schema";
import { SAFETY_NET, NEGATIONS, CANONICAL_ORDER, buildDeclaration } from "./labels";

/** Shape returned by the AI detector (provider.ts) — codes + review notes only. */
export type AiAllergenResult = {
  allergens: { code: string; from?: string }[];
  needsReview?: string[];
};

export type AllergenLabel = {
  codes: AllergenCode[];
  declaration: { sv: string; en: string };
  needsReview: string[];
};

const VALID = new Set<string>(ALLERGEN_CODES);

/**
 * Pure, deterministic core: combine the AI's detected codes with the
 * safety-net dictionary, then build the canonical bilingual declaration.
 * Given the same inputs it always returns the same label — hence testable.
 */
export function buildLabel(ai: AiAllergenResult, ingredients: string[]): AllergenLabel {
  const codes = new Map<AllergenCode, string>();
  const reviews = new Set<string>(ai.needsReview ?? []);

  for (const a of ai.allergens ?? []) {
    if (VALID.has(a.code) && !codes.has(a.code as AllergenCode)) {
      codes.set(a.code as AllergenCode, a.from ?? "ai");
    }
  }
  for (const ing of ingredients) {
    for (const rule of SAFETY_NET) {
      if (codes.has(rule.code)) continue;
      const negated = (NEGATIONS[rule.code] ?? []).some((re) => re.test(ing));
      if (!negated && rule.re.test(ing)) {
        codes.set(rule.code, `${ing} [rule]`);
        reviews.add(rule.note);
      }
    }
  }

  const ordered = CANONICAL_ORDER.filter((c) => codes.has(c));
  return { codes: ordered, declaration: buildDeclaration(ordered), needsReview: [...reviews] };
}

/** Draft a label using an injected AI detector (injection keeps this testable). */
export async function draftLabel(
  ingredients: string[],
  detect: (ingredients: string[]) => Promise<AiAllergenResult>,
): Promise<AllergenLabel> {
  return buildLabel(await detect(ingredients), ingredients);
}
