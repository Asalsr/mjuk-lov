// In-progress configurator drafts (Layer A persistence). Saves the working
// LineConfig + chosen date per product to localStorage so a visitor — guest or
// logged-in — who closes the panel or the tab returns to their choices. Cleared
// once the line is added to the cart. Guests-included, no account required.
import type { LineConfig } from "@/lib/pricing";

export type CartDraft = { config: LineConfig; date?: string };

const PREFIX = "mjuklov_draft_";
const keyFor = (productId: string) => `${PREFIX}${productId}`;

export function loadDraft(productId: string): CartDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(keyFor(productId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CartDraft>;
    // A draft is only useful if it carries a config for this product.
    if (!parsed || typeof parsed !== "object" || !parsed.config || parsed.config.productId !== productId) return null;
    return { config: parsed.config, date: typeof parsed.date === "string" ? parsed.date : undefined };
  } catch {
    return null;
  }
}

export function saveDraft(productId: string, draft: CartDraft): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(keyFor(productId), JSON.stringify(draft));
  } catch {
    /* quota / disabled storage — drafts are best-effort */
  }
}

export function clearDraft(productId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(keyFor(productId));
  } catch {
    /* ignore */
  }
}
