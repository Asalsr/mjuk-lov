"use client";

import { useCart, addToCart } from "@/lib/cart/store";
import { ui, type Lang } from "@/lib/i18n";
import type { LineConfig } from "@/lib/pricing";

/** Minimal add button — used for menu items (variant + qty) and as a fallback.
 *  Kits/party go through the configurator. Accepts a full `LineConfig` so the
 *  caller controls qty, variant, etc. */
export function AddToCartButton({ config, lang }: { config: LineConfig; lang: Lang }) {
  const items = useCart();
  const t = ui[lang];
  // "In cart" is by product id (not exact config) — close enough as visual feedback.
  const inCart = items.find((i) => i.config.productId === config.productId);

  return (
    <button
      type="button"
      onClick={() => addToCart(config)}
      className="type-caps w-full px-6 py-3 transition-all hover:bg-[var(--warm-peach)]"
      style={{
        border: "1px solid var(--warm-cocoa)",
        backgroundColor: inCart ? "var(--warm-peach)" : "transparent",
      }}
    >
      {inCart ? `${t.inCart} (${inCart.config.qty})` : t.addToCart}
    </button>
  );
}
