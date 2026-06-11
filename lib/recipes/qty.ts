import type { Lang } from "@/lib/i18n";
import { formatAmount } from "@/lib/units/format";
import type { Quantity } from "./schema";

/**
 * Render a structured quantity as a single display string in the recipe's
 * authored (metric) units — e.g. "250 g", "1 tsk"/"1 tsp", "to garnish".
 * Used wherever a plain string is needed (AI prompts, scripts, fallbacks);
 * the interactive converter on the detail page formats differently.
 */
export function quantityToString(qty: Quantity, lang: Lang): string {
  if ("text" in qty) return qty.text[lang];
  return formatAmount(qty.value, qty.unit, lang);
}
