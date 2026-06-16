"use client";

import { useState } from "react";
import { addToCart } from "@/lib/cart/store";
import { priceLineSek } from "@/lib/pricing";
import type { Product } from "@/lib/products";
import { ui, locNum, type Lang } from "@/lib/i18n";

const inputStyle = { border: "1px solid var(--border)" } as const;

/** Menu-line card — variant (format) selector + qty + simple add. Uses
 *  priceLineSek so the displayed unit price matches the cart. */
export function MenuLineCard({ product, lang }: { product: Product; lang: Lang }) {
  const t = ui[lang];
  const variants = product.variants ?? [];
  const [variantId, setVariantId] = useState<string>(variants[0]?.id ?? "");
  const [qty, setQty] = useState<number>(1);

  const config = { productId: product.id, qty, variantId };
  const linePrice = priceLineSek(config);
  const [added, setAdded] = useState(false);

  const submit = () => {
    addToCart(config);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div
      className="relative p-6 md:p-8 flex flex-col"
      style={{ backgroundColor: "var(--vanilla-cream)", boxShadow: "0 4px 20px rgba(61, 42, 34, 0.05)" }}
    >
      <h3 className="mb-3" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}>{product.name[lang]}</h3>
      <p className="type-body ink-muted mb-4">{product.description[lang]}</p>
      {product.rotating && (
        <p className="type-caps ink-muted italic mb-4" style={{ fontSize: "0.875rem" }}>{t.seasonalNote}</p>
      )}
      <div className="flex flex-col gap-3 mt-auto">
        {variants.length > 1 && (
          <div className="flex flex-col gap-2">
            <div className="type-caps ink-muted">{t.formatLabel}</div>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t.formatLabel}>
              {variants.map((v) => {
                const selected = variantId === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setVariantId(v.id)}
                    className="tap px-3 py-2 type-body transition-colors hover:bg-[var(--warm-peach)]"
                    style={{
                      ...inputStyle,
                      backgroundColor: selected ? "var(--warm-peach)" : "transparent",
                    }}
                  >
                    {v.label[lang]} · {locNum(v.priceSek, lang)} kr
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div className="flex items-center gap-3">
          <label className="type-caps ink-muted" htmlFor={`qty-${product.id}`}>{t.quantity}</label>
          <input
            id={`qty-${product.id}`}
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-20 p-2 type-body bg-transparent"
            style={inputStyle}
          />
        </div>
        <button
          type="button"
          onClick={submit}
          className="type-caps tap w-full px-6 py-3 transition-colors hover:bg-[var(--warm-peach)]"
          style={{
            border: "1px solid var(--warm-cocoa)",
            backgroundColor: added ? "var(--warm-peach)" : "transparent",
          }}
          aria-live="polite"
        >
          {added ? t.inCart : t.addToCartWithPrice(linePrice)}
        </button>
      </div>
    </div>
  );
}
