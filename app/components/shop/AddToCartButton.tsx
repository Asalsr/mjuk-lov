"use client";

import { useCart, addToCart } from "@/lib/cart/store";
import { ui, type Lang } from "@/lib/i18n";

export function AddToCartButton({ productId, lang }: { productId: string; lang: Lang }) {
  const items = useCart();
  const inCart = items.find((i) => i.productId === productId);
  const t = ui[lang];

  return (
    <button
      type="button"
      onClick={() => addToCart(productId)}
      className="type-caps w-full px-6 py-3 transition-all hover:bg-[var(--warm-peach)]"
      style={{
        border: "1px solid var(--warm-cocoa)",
        backgroundColor: inCart ? "var(--warm-peach)" : "transparent",
      }}
    >
      {inCart ? `${t.inCart} (${inCart.qty})` : t.addToCart}
    </button>
  );
}
