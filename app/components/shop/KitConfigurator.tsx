"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { addToCart } from "@/lib/cart/store";
import {
  FLAVOURS,
  FILLINGS,
  TOOLS,
  FLAVOUR_LABELS,
  FILLING_LABELS,
  TOOL_LABELS,
  priceLineSek,
  PARTY_BASE_CAKES,
  PARTY_MAX_SELF_SERVE,
  EXTRA_ITEM_SEK,
  FILLING_FREE_COUNT,
  type Flavour,
  type Filling,
  type LineConfig,
  type ToolKind,
} from "@/lib/pricing";
import type { Product } from "@/lib/products";
import { ui, locNum, type Lang } from "@/lib/i18n";

// Visual constants — match the existing shop card system (zero radius, 1px
// warm-cocoa borders, warm-peach hover).
const sectionStyle = { borderTop: "1px solid var(--border)" } as const;
const fieldStyle = { border: "1px solid var(--border)" } as const;

// Small + - stepper for tools / colours / cake count. Keyboard-operable, with
// clear aria-labels (uses ink-muted token, never opacity on the digits).
function Stepper({
  label,
  value,
  setValue,
  min,
  max,
  ariaLabel,
}: {
  label: string;
  value: number;
  setValue: (n: number) => void;
  min: number;
  max: number;
  ariaLabel: string;
}) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  return (
    <div className="flex items-center justify-between gap-3" role="group" aria-label={ariaLabel}>
      <span className="type-body">{label}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setValue(clamp(value - 1))}
          disabled={value <= min}
          aria-label={`− ${ariaLabel}`}
          className="tap w-10 h-10 flex items-center justify-center disabled:opacity-40 hover:bg-[var(--warm-peach)]"
          style={fieldStyle}
        >
          −
        </button>
        <span className="type-body w-8 text-center" aria-live="polite">{value}</span>
        <button
          type="button"
          onClick={() => setValue(clamp(value + 1))}
          disabled={value >= max}
          aria-label={`+ ${ariaLabel}`}
          className="tap w-10 h-10 flex items-center justify-center disabled:opacity-40 hover:bg-[var(--warm-peach)]"
          style={fieldStyle}
        >
          +
        </button>
      </div>
    </div>
  );
}

/** Configurator for kits (flavour / fillings 1–2 / tools mix / extra colours)
 *  and for the party pack (cake-count stepper). Live price preview via
 *  priceLineSek; adds a fully-shaped LineConfig to the cart on submit. */
export function KitConfigurator({ product, lang }: { product: Product; lang: Lang }) {
  const t = ui[lang];
  const isParty = product.kind === "party";
  const includedTools = product.included?.tools ?? 0;
  const includedColours = product.included?.colours ?? 0;

  // Kit state
  const [flavour, setFlavour] = useState<Flavour>("vanilla");
  const [fillings, setFillings] = useState<Filling[]>(["berries"]);
  const [tools, setTools] = useState<{ piping: number; brush: number; knife: number }>(() => {
    // Distribute the included count across the three tools, default to brush+knife
    // (Standard) or brush+knife+piping (Deluxe). Customers can shift the mix.
    const start = { piping: 0, brush: 0, knife: 0 } as { piping: number; brush: number; knife: number };
    const order: ToolKind[] = ["brush", "knife", "piping"];
    let remaining = includedTools;
    for (const k of order) {
      if (remaining <= 0) break;
      start[k] = 1;
      remaining--;
    }
    return start;
  });
  const [colours, setColours] = useState<number>(includedColours);

  // Party state
  const [partyCakes, setPartyCakes] = useState<number>(PARTY_BASE_CAKES);

  const config: LineConfig = useMemo(
    () =>
      isParty
        ? { productId: product.id, qty: 1, partyCakes }
        : { productId: product.id, qty: 1, flavour, fillings, colours, tools },
    [isParty, product.id, partyCakes, flavour, fillings, colours, tools],
  );

  const price = priceLineSek(config);
  const toolTotal = tools.piping + tools.brush + tools.knife;
  const extraTools = Math.max(0, toolTotal - includedTools);
  const extraColours = Math.max(0, colours - includedColours);
  const extraFillings = Math.max(0, fillings.length - FILLING_FREE_COUNT);
  const showFillingExtra = extraFillings > 0;

  const [added, setAdded] = useState(false);
  const submit = () => {
    addToCart(config);
    setAdded(true);
    // Brief "added" affordance, no toast yet — the header cart count updates instantly.
    setTimeout(() => setAdded(false), 1500);
  };

  const toggleFilling = (f: Filling) => {
    setFillings((cur) => {
      if (cur.includes(f)) {
        if (cur.length === 1) return cur; // enforce ≥ 1
        return cur.filter((x) => x !== f);
      }
      if (cur.length >= 2) return cur; // enforce ≤ 2
      return [...cur, f];
    });
  };

  return (
    <div className="flex flex-col gap-6 mt-6 pt-6" style={sectionStyle}>
      {isParty ? (
        // ───────── Party stepper ─────────
        <div className="flex flex-col gap-3">
          <div className="type-caps ink-muted">{t.partyCakesLabel}</div>
          <Stepper
            label={`${locNum(partyCakes, lang)} ${lang === "sv" ? "tårtor" : lang === "fa" ? "کیک" : "cakes"}`}
            value={partyCakes}
            setValue={setPartyCakes}
            min={PARTY_BASE_CAKES}
            max={PARTY_MAX_SELF_SERVE}
            ariaLabel={t.partyCakesLabel}
          />
          <p className="type-caps ink-muted" style={{ fontSize: "0.875rem" }}>{t.partyLeadNote}</p>
          {partyCakes >= PARTY_MAX_SELF_SERVE && (
            <Link
              href={`/${lang}/kontakt`}
              className="type-caps underline hover:text-[var(--dusty-terracotta)]"
              style={{ fontSize: "0.875rem" }}
            >
              {t.partyContactOver(PARTY_MAX_SELF_SERVE)}
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Step 1 — Flavour */}
          <div className="flex flex-col gap-3">
            <div className="type-caps ink-muted">{t.flavourLabel}</div>
            <div className="flex gap-3" role="radiogroup" aria-label={t.flavourLabel}>
              {FLAVOURS.map((f) => {
                const selected = flavour === f;
                return (
                  <button
                    key={f}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setFlavour(f)}
                    className="tap px-4 py-2 type-body transition-colors hover:bg-[var(--warm-peach)]"
                    style={{
                      ...fieldStyle,
                      backgroundColor: selected ? "var(--warm-peach)" : "transparent",
                    }}
                  >
                    {FLAVOUR_LABELS[f][lang]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2 — Fillings */}
          <div className="flex flex-col gap-3">
            <div className="type-caps ink-muted flex items-center justify-between gap-3">
              <span>{t.fillingLabel}</span>
              <span style={{ fontSize: "0.875rem" }}>{t.fillingHint}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {FILLINGS.map((f) => {
                const selected = fillings.includes(f);
                return (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleFilling(f)}
                    className="tap px-4 py-2 type-body transition-colors hover:bg-[var(--warm-peach)]"
                    style={{
                      ...fieldStyle,
                      backgroundColor: selected ? "var(--warm-peach)" : "transparent",
                    }}
                  >
                    {selected ? "✓ " : ""}
                    {FILLING_LABELS[f][lang]}
                  </button>
                );
              })}
            </div>
            {showFillingExtra && (
              <p className="type-caps ink-muted" style={{ fontSize: "0.875rem" }}>
                {t.extraItemNote(EXTRA_ITEM_SEK)}
              </p>
            )}
          </div>

          {/* Step 3 — Tools */}
          <div className="flex flex-col gap-3">
            <div className="type-caps ink-muted flex items-center justify-between gap-3">
              <span>{t.toolsLabel}</span>
              <span style={{ fontSize: "0.875rem" }}>{t.toolsHint(includedTools)}</span>
            </div>
            {TOOLS.map((k) => (
              <Stepper
                key={k}
                label={TOOL_LABELS[k][lang]}
                value={tools[k]}
                setValue={(n) => setTools({ ...tools, [k]: n })}
                min={0}
                max={6}
                ariaLabel={TOOL_LABELS[k][lang]}
              />
            ))}
            <p className="type-caps ink-muted" style={{ fontSize: "0.875rem" }}>
              {locNum(includedTools, lang)} {lang === "sv" ? "ingår" : lang === "fa" ? "شامل" : "included"}
              {extraTools > 0
                ? ` · ${locNum(extraTools, lang)} ${lang === "sv" ? "extra" : lang === "fa" ? "اضافه" : "extra"} (${t.extraItemNote(EXTRA_ITEM_SEK)})`
                : ""}
            </p>
          </div>

          {/* Step 4 — Colours */}
          <div className="flex flex-col gap-3">
            <div className="type-caps ink-muted flex items-center justify-between gap-3">
              <span>{t.coloursLabel}</span>
              <span style={{ fontSize: "0.875rem" }}>{t.coloursHint(includedColours)}</span>
            </div>
            <Stepper
              label={`${locNum(colours, lang)} ${lang === "sv" ? "färger" : lang === "fa" ? "رنگ" : "colours"}`}
              value={colours}
              setValue={setColours}
              min={includedColours}
              max={includedColours + 6}
              ariaLabel={t.coloursLabel}
            />
            {extraColours > 0 && (
              <p className="type-caps ink-muted" style={{ fontSize: "0.875rem" }}>
                {locNum(extraColours, lang)} {lang === "sv" ? "extra" : lang === "fa" ? "اضافه" : "extra"} · {t.extraItemNote(EXTRA_ITEM_SEK)}
              </p>
            )}
          </div>
        </>
      )}

      {/* Add to cart — live price */}
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
        {added ? `${ui[lang].inCart}` : t.addToCartWithPrice(price)}
      </button>
    </div>
  );
}
