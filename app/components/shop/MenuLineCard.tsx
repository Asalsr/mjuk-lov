"use client";

import { useCart, addToCart, setQty } from "@/lib/cart/store";
import { ui, locNum, type Lang } from "@/lib/i18n";
import type { Product } from "@/lib/products";
import { ProductImageCarousel } from "@/app/components/shop/ProductImageCarousel";

/** A Cakes & Bakes menu card. Each box-size variant is its own orderable
 *  product (`<menu>-<variant>`) with an independent quantity — a customer can
 *  order any mix of sizes straight from the card. Every size is a row: it starts
 *  as a single "+" and, once in the basket, expands into a −/qty/+ stepper;
 *  decrementing past one removes the line (the same as editing a basket line).
 *
 *  Responsive (§3): the +/stepper keeps a 44px tap target and never shrinks its
 *  glyphs. On a narrow column it wraps to its own line beneath the size + price
 *  rather than squeezing onto the label's row — `flex-wrap`, with the label
 *  holding a min width so the control drops under it instead of being crushed. */
export function MenuLineCard({ product, lang }: { product: Product; lang: Lang }) {
  const items = useCart();
  const t = ui[lang];
  const variants = product.variants ?? [];

  if (variants.length === 0) return null; // menu products always carry ≥1 size

  /* One border wraps the whole size list, so the controls inside stay borderless
     (a single rectangle per card). `shrink-0` + a fixed font-size stop the glyph
     shrinking on narrow cards; h-11 / min-w-11 hold the 44px tap target; the
     inline line-height beats type-serif's global 1.5 so the glyph stays centred. */
  const glyph =
    "type-serif shrink-0 h-11 min-w-[2.75rem] px-2 flex items-center justify-center transition-all hover:bg-[var(--warm-peach)]";
  const glyphStyle: React.CSSProperties = { color: "var(--dusty-terracotta)", lineHeight: 1, fontSize: "1.4rem" };

  return (
    <div
      className="p-6 md:p-8 flex flex-col"
      style={{ backgroundColor: "var(--vanilla-cream)", boxShadow: "0 4px 20px rgba(61, 42, 34, 0.05)" }}
    >
      {product.images && product.images.length > 0 && (
        // Illustrative product photos — one framed image, or a slideshow when
        // there are several. The shop shows a single PhotoDisclaimer beneath the
        // grid (§2a), not per card, so none is rendered here.
        <ProductImageCarousel images={product.images} alt={product.name[lang]} lang={lang} />
      )}
      <h3 className="type-product mb-2" style={{ fontSize: "clamp(1.25rem, 2.5vw, 1.6rem)" }}>{product.name[lang]}</h3>
      <p className="type-body ink-muted mb-4">{product.description[lang]}</p>
      {product.rotating && <p className="type-caps ink-muted mb-4">{t.seasonalNote}</p>}

      {/* One border around the whole size list; thin dividers between rows so the
          sizes read as one coherent list, not separate floating boxes. */}
      <div className="mt-auto" style={{ border: "1px solid var(--warm-cocoa)" }}>
        {variants.map((v, i) => {
          const id = `${product.id}-${v.id}`;
          const qty = items.find((it) => it.productId === id)?.qty ?? 0;
          return (
            <div
              key={v.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2"
              style={i > 0 ? { borderTop: "1px solid rgba(61, 42, 34, 0.15)" } : undefined}
            >
              {/* flex-1 + a min width: the size/price fills the row and pushes the
                  control to the end when it fits, and forces the control onto its
                  own line under the price (via flex-wrap) when it doesn't. */}
              <span className="type-caps flex-1 min-w-[9rem]">
                {v.label[lang]}
                <span className="type-price ink-muted ms-2">{locNum(v.priceSek, lang)} kr</span>
              </span>
              {qty === 0 ? (
                <button
                  type="button"
                  onClick={() => addToCart(id)}
                  aria-label={`${t.addToCart}: ${v.label[lang]}`}
                  className={glyph}
                  style={glyphStyle}
                >
                  +
                </button>
              ) : (
                <div className="flex items-center shrink-0">
                  <button
                    type="button"
                    onClick={() => setQty(id, qty - 1)}
                    aria-label={`${t.cfgDecrease}: ${v.label[lang]}`}
                    className={glyph}
                    style={glyphStyle}
                  >
                    −
                  </button>
                  <span
                    className="type-price shrink-0 min-w-[2.5rem] text-center"
                    aria-label={t.quantity}
                  >
                    {locNum(qty, lang)}
                  </span>
                  <button
                    type="button"
                    onClick={() => addToCart(id)}
                    aria-label={`${t.cfgIncrease}: ${v.label[lang]}`}
                    className={glyph}
                    style={glyphStyle}
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
