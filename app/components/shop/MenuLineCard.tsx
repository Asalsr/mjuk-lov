"use client";

import { useCart, addToCart } from "@/lib/cart/store";
import { ui, locNum, type Lang } from "@/lib/i18n";
import type { Product } from "@/lib/products";

/** A Cakes & Bakes menu card. Each box-size variant is its own orderable
 *  product (`<menu>-<variant>`), so picking one adds a normal cart line. */
export function MenuLineCard({ product, lang }: { product: Product; lang: Lang }) {
  const items = useCart();
  const t = ui[lang];
  const variants = product.variants ?? [];

  return (
    <div
      className="p-6 md:p-8 flex flex-col"
      style={{ backgroundColor: "var(--vanilla-cream)", boxShadow: "0 4px 20px rgba(61, 42, 34, 0.05)" }}
    >
      <h3 className="type-product mb-2" style={{ fontSize: "clamp(1.25rem, 2.5vw, 1.6rem)" }}>{product.name[lang]}</h3>
      <p className="type-body ink-muted mb-4">{product.description[lang]}</p>
      {product.rotating && <p className="type-caps ink-muted mb-4">{t.seasonalNote}</p>}
      <div className="mt-auto flex flex-col gap-2">
        {variants.map((v) => {
          const id = `${product.id}-${v.id}`;
          const inCart = items.find((i) => i.productId === id);
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => addToCart(id)}
              className="type-caps w-full px-4 py-2.5 flex items-center justify-between gap-3 transition-all hover:bg-[var(--warm-peach)]"
              style={{
                border: "1px solid var(--warm-cocoa)",
                backgroundColor: inCart ? "var(--warm-peach)" : "transparent",
              }}
            >
              <span>
                {v.label[lang]}
                {inCart && ` (${locNum(inCart.qty, lang)})`}
              </span>
              <span className="type-price">{locNum(v.priceSek, lang)} kr</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
