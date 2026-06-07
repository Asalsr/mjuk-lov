import { chat } from "./chat";
import {
  adaptSystem,
  adaptUser,
  judgeAdaptationSystem,
  judgeAdaptationUser,
  type AdaptRecipeInput,
} from "./prompts";
import type { Lang } from "@/lib/i18n";

// Server-side adaptation generation with a quality gate:
//   1. Generate two candidates in parallel.
//   2. Auto-validate each (parse, non-empty summary + ingredient list, drop any
//      swap that doesn't reference a real ingredient).
//   3. If both survive, an LLM judge picks the better; if one survives, use it;
//      if neither does, retry once, then give up (caller surfaces the AI error).
// The result is cached and served to every future visitor, so the one-time
// best-of-2 cost is amortised across all of them.

export type Swap = { from: string; to: string; note: string };
export type AdaptParsed = {
  summary: string;
  swaps: Swap[];
  adaptedIngredients: { qty: string; item: string }[];
};

const isStr = (v: unknown): v is string => typeof v === "string";

/** Tokens (≥3 chars) of the original ingredient items, for swap validation. */
function ingredientTokens(input: AdaptRecipeInput): Set<string> {
  const tokens = new Set<string>();
  for (const ing of input.ingredients) {
    for (const tok of ing.item.toLowerCase().split(/[^\p{L}]+/u)) {
      if (tok.length >= 3) tokens.add(tok);
    }
  }
  return tokens;
}

/** A swap is "real" if its `from` shares a word with some original ingredient. */
function swapReferencesIngredient(from: string, tokens: Set<string>): boolean {
  for (const tok of from.toLowerCase().split(/[^\p{L}]+/u)) {
    if (tok.length >= 3 && tokens.has(tok)) return true;
  }
  return false;
}

/** Parse + validate one candidate; returns the cleaned result or null. */
function validate(raw: string, input: AdaptRecipeInput): AdaptParsed | null {
  let obj: unknown;
  try {
    obj = JSON.parse(raw);
  } catch {
    return null;
  }
  const o = obj as Record<string, unknown>;
  const summary = isStr(o.summary) ? o.summary.trim() : "";
  if (!summary) return null;

  const adaptedIngredients = Array.isArray(o.adaptedIngredients)
    ? o.adaptedIngredients
        .filter((i): i is { qty: unknown; item: unknown } => !!i && typeof i === "object")
        .map((i) => ({ qty: isStr(i.qty) ? i.qty : "", item: isStr(i.item) ? i.item : "" }))
        .filter((i) => i.item.trim() !== "")
    : [];
  if (adaptedIngredients.length === 0) return null;

  const tokens = ingredientTokens(input);
  const swaps = (Array.isArray(o.swaps) ? o.swaps : [])
    .filter((s): s is Record<string, unknown> => !!s && typeof s === "object")
    .map((s) => ({
      from: isStr(s.from) ? s.from.trim() : "",
      to: isStr(s.to) ? s.to.trim() : "",
      note: isStr(s.note) ? s.note.trim() : "",
    }))
    // Drop hallucinated swaps: empty, or not referencing a real ingredient.
    .filter((s) => s.from && s.to && swapReferencesIngredient(s.from, tokens));

  return { summary, swaps, adaptedIngredients };
}

async function generateOne(
  input: AdaptRecipeInput,
  target: "vegan" | "vegetarian",
  lang: Lang,
): Promise<{ parsed: AdaptParsed; raw: string } | null> {
  const raw = await chat({
    system: adaptSystem(lang),
    user: adaptUser(input, target),
    json: true,
    temperature: 0.4,
  });
  const parsed = validate(raw, input);
  return parsed ? { parsed, raw } : null;
}

/** Best-of-2 + validation. Returns the chosen adaptation, or null on failure. */
export async function generateAdaptation(
  input: AdaptRecipeInput,
  target: "vegan" | "vegetarian",
  lang: Lang,
): Promise<AdaptParsed | null> {
  const [a, b] = await Promise.all([
    generateOne(input, target, lang),
    generateOne(input, target, lang),
  ]);
  const valid = [a, b].filter((x): x is { parsed: AdaptParsed; raw: string } => x !== null);

  if (valid.length === 0) {
    // Both malformed — one retry before giving up.
    const retry = await generateOne(input, target, lang);
    return retry?.parsed ?? null;
  }
  if (valid.length === 1) return valid[0].parsed;

  // Two good candidates — let the judge pick. Default to the first on any doubt.
  try {
    const verdict = await chat({
      system: judgeAdaptationSystem(target),
      user: judgeAdaptationUser(input, target, valid[0].raw, valid[1].raw),
      json: true,
      temperature: 0,
      maxTokens: 20,
    });
    const winner = (JSON.parse(verdict) as { winner?: unknown }).winner;
    return winner === 2 ? valid[1].parsed : valid[0].parsed;
  } catch {
    return valid[0].parsed;
  }
}
