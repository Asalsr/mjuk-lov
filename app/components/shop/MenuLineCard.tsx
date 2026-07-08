"use client";

import { useCart, addToCart, setQty } from "@/lib/cart/store";
import { ui, locNum, type Lang } from "@/lib/i18n";
import type { Product } from "@/lib/products";

/** A Cakes & Bakes menu card. Each box-size variant is its own orderable
 *  product (`<menu>-<variant>`). A variant starts with an add (+) button; once
 *  in the basket it shows a quantity stepper, and decrementing past one removes
 *  the line — so a customer can set any quantity (or none) right from the card,
 *  the same as adjusting a line in the basket. */
export function MenuLineCard({ product, lang }: { product: Product; lang: Lang }) {
  const items = useCart();
  const t = ui[lang];
  const variants = product.variants ?? [];

  /* type-serif's line-height (1.5, at a clamp()-scaled font-size) is an
     unlayered global rule, so it beats Tailwind's `leading-none` regardless of
     class order — the glyph's line box overflows the fixed 44px button and
     drifts off-center as the clamp scales with viewport width. Flex-centering
     plus an inline line-height (which always wins) keeps +/− centered at every
     screen size. */
  const sqBtn: React.CSSProperties = { border: "1px solid var(--warm-cocoa)", lineHeight: 1 };
  const sqBtnClass =
    "type-serif w-11 h-11 leading-none shrink-0 flex items-center justify-center transition-all hover:bg-[var(--warm-peach)]";

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
          const qty = items.find((i) => i.productId === id)?.qty ?? 0;
          return (
            <div
              key={v.id}
              className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-2.5"
              style={{ border: "1px solid var(--warm-cocoa)" }}
            >
              <span className="type-caps">
                {v.label[lang]}
                <span className="type-price ink-muted ms-2">{locNum(v.priceSek, lang)} kr</span>
              </span>
              {qty === 0 ? (
                <button
                  type="button"
                  onClick={() => addToCart(id)}
                  aria-label={`${t.addToCart}: ${v.label[lang]}`}
                  className={sqBtnClass}
                  style={sqBtn}
                >
                  +
                </button>
              ) : (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setQty(id, qty - 1)}
                    aria-label={`${t.cfgDecrease}: ${v.label[lang]}`}
                    className={sqBtnClass}
                    style={sqBtn}
                  >
                    −
                  </button>
                  <span className="type-price min-w-[1.75rem] text-center" aria-label={t.quantity}>
                    {locNum(qty, lang)}
                  </span>
                  <button
                    type="button"
                    onClick={() => addToCart(id)}
                    aria-label={`${t.cfgIncrease}: ${v.label[lang]}`}
                    className={sqBtnClass}
                    style={sqBtn}
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
