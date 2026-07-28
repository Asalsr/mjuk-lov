"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ui, locNum, isRtl, type Lang } from "@/lib/i18n";
import type { Product } from "@/lib/products";
import { PriceTag } from "@/app/components/shop/PriceTag";
import { openingOfferActive, openingOfferPriceSek } from "@/lib/opening-offer";
import { addLine, updateLine } from "@/lib/cart/store";
import { loadDraft, saveDraft, clearDraft } from "@/lib/cart/draft";
import {
  FLAVOURS,
  FILLINGS,
  TOOLS,
  COLOURS,
  FLAVOUR_LABELS,
  FILLING_LABELS,
  TOOL_LABELS,
  EXTRA_ITEM_SEK,
  INCLUDED_COLOURS,
  PARTY_MIN_CAKES,
  PARTY_MAX_SELF_SERVE,
  defaultKitConfig,
  defaultPartyConfig,
  includedToolsFor,
  includedToolsForParty,
  includedColoursFor,
  includedColoursForParty,
  colourCount,
  toolCount,
  priceLineSek,
  leadDaysFor,
  describeLine,
  normalizeLineConfig,
  extraFillings,
  type LineConfig,
  type KitConfig,
  type PartyConfig,
  type PartyCakeConfig,
  type Filling,
  type Flavour,
  type ToolKey,
  type Tools,
  type ColourKey,
  type ColourCounts,
} from "@/lib/pricing";

// Max shades a customer can pick: the included trio plus six extras.
const MAX_COLOURS = INCLUDED_COLOURS + 6;

const KIT_STEPS = ["flavour", "filling", "colour", "tools", "date", "review"] as const;
// Ready-made cakes (kind "cake"): we decorate them, so no colours/tools steps.
const CAKE_STEPS = ["flavour", "filling", "date", "review"] as const;
// "sponge" and "filling" are separate steps — each screen asks one question
// with one kind of button grid, so it's never ambiguous which buttons are
// choosing what. Both are per-cake (see renderPartySponge/renderPartyFillings),
// unlike the old pooled-by-sponge model this replaced.
const PARTY_STEPS = ["cakes", "sponge", "filling", "colour", "tools", "date", "review"] as const;

const cardBtn = (selected: boolean): React.CSSProperties => ({
  border: "1px solid var(--warm-cocoa)",
  backgroundColor: selected ? "var(--warm-peach)" : "transparent",
});

/** One cake's worth of defaults, mirroring defaultKitConfig in lib/pricing. */
function defaultPartyCake(flavour: Flavour = "vanilla"): PartyCakeConfig {
  return { flavour, fillings: ["berries"] };
}

/** Sequential "Make it yours" flow — one decision per screen, a single
 *  persistent price, and "included vs +29 kr" stated in words. Rendered as a
 *  modal over the shop. RTL-safe, keyboard-operable. */
export function Configurator({
  product,
  lang,
  onClose,
  initialConfig,
  initialDate,
  editLineId,
}: {
  product: Product;
  lang: Lang;
  onClose: () => void;
  initialConfig?: LineConfig;
  initialDate?: string;
  editLineId?: string;
}) {
  const t = ui[lang];
  const router = useRouter();
  const rtl = isRtl(lang);
  const arrow = rtl ? "←" : "→";
  const back = rtl ? "→" : "←";

  const isParty = product.kind === "party";
  const isSimpleCake = product.kind === "cake";
  const isEdit = !!editLineId;
  const steps = isParty ? PARTY_STEPS : isSimpleCake ? CAKE_STEPS : KIT_STEPS;

  // In edit mode the seed comes from the existing cart line — never from the
  // draft (a draft is a partial new build, not a snapshot of the line being
  // edited). Add mode keeps the in-progress draft restore.
  const [config, setConfig] = useState<LineConfig>(() => {
    if (initialConfig) return normalizeLineConfig(initialConfig);
    const seed = loadDraft(product.id)?.config ?? (isParty ? defaultPartyConfig(product.id) : defaultKitConfig(product.id));
    return normalizeLineConfig(seed);
  });
  const [date, setDate] = useState(() => {
    if (isEdit) return initialDate ?? "";
    return loadDraft(product.id)?.date ?? "";
  });
  const [step, setStep] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Render through a portal to document.body so no ancestor `transform` (the
  // shop cards' scroll-reveal and hover animations) can reparent or clip the
  // fixed modal — that ancestor-transform clipping was why the panel appeared
  // to "vanish" when the pointer entered it. Guard for SSR: only portal after
  // mount, when document.body exists.
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time SSR mount flag so the portal only renders client-side
  useEffect(() => setMounted(true), []);

  // Lock background scroll, trap focus inside the dialog, wire Escape-to-close,
  // and restore focus to the trigger on close. Opens on click and only closes
  // via ✕ / backdrop / Esc — there is no hover-driven open/close anywhere.
  // Runs once the dialog is actually in the DOM (after the portal mounts).
  useEffect(() => {
    if (!mounted) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const root = dialogRef.current;
      if (!root) return;
      const focusable = Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null || el === root);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === root)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      previouslyFocused?.focus?.();
    };
  }, [onClose, mounted]);

  // Layer A persistence: debounce-save the working draft as choices change.
  // Skip in edit mode — the source of truth is the cart line, and we don't want
  // an open edit to overwrite an unrelated in-progress draft for the same product.
  useEffect(() => {
    if (isEdit) return;
    const id = setTimeout(() => saveDraft(product.id, { config, date: date || undefined }), 400);
    return () => clearTimeout(id);
  }, [config, date, product.id, isEdit]);

  const setKit = (patch: Partial<KitConfig>) => setConfig((c) => ({ ...(c as KitConfig), ...patch }));
  const setParty = (patch: Partial<PartyConfig>) => setConfig((c) => ({ ...(c as PartyConfig), ...patch }));

  const includedTools = isParty
    ? includedToolsForParty((config as PartyConfig).cakes.length)
    : includedToolsFor(product.id);
  // Party colours scale per guest (INCLUDED_COLOURS per cake); kits get the flat
  // included set (grande gets a larger one). Used by the colour step and the
  // review extras line.
  const includedColours = isParty
    ? includedColoursForParty((config as PartyConfig).cakes.length)
    : includedColoursFor(product.id);

  // Earliest reservable date for this product's lead time.
  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + leadDaysFor(config));
    return d.toISOString().slice(0, 10);
  }, [config]);

  const price = priceLineSek(config);
  // What the line actually costs while the opening offer is live — used on the
  // add/save button; the PriceTag spots show the struck original alongside it.
  const shownPrice = openingOfferActive() ? openingOfferPriceSek(price) : price;
  const current = steps[step];
  const onDateStep = current === "date";
  const canAdvance = !onDateStep || (!!date && date >= minDate);

  const next = () => {
    if (step < steps.length - 1) setStep((s) => s + 1);
    else add();
  };
  const prev = () => (step > 0 ? setStep((s) => s - 1) : onClose());

  const add = () => {
    if (isEdit) {
      updateLine(editLineId, config, { date: date || undefined });
      onClose();
      return; // already on the cart page; let it re-render in place
    }
    addLine(config, { date: date || undefined });
    clearDraft(product.id); // committed to cart — drop the in-progress draft
    onClose();
    router.push(`/${lang}/varukorg`);
  };

  // --- shared controls ----------------------------------------------------
  const setTool = (k: ToolKey, delta: number) => {
    const c = config;
    const nextVal = Math.max(0, (c.tools[k] || 0) + delta);
    if (isParty) setParty({ tools: { ...c.tools, [k]: nextVal } });
    else setKit({ tools: { ...c.tools, [k]: nextVal } });
  };

  // Party colours are counted per shade (pots), like tools.
  const setPartyColour = (key: ColourKey, delta: number) => {
    const c = config as PartyConfig;
    const nextVal = Math.max(0, (c.colours[key] || 0) + delta);
    setParty({ colours: { ...c.colours, [key]: nextVal } });
  };

  // Party: each cake owns its own flavour and 1–2 fillings, same rule as a
  // kit. Only the cake at index i changes; the rest of the party is untouched.
  const setPartyCakeFlavour = (i: number, flavour: Flavour) => {
    const c = config as PartyConfig;
    setParty({ cakes: c.cakes.map((cake, idx) => (idx === i ? { ...cake, flavour } : cake)) });
  };
  const togglePartyCakeFilling = (i: number, f: Filling) => {
    const c = config as PartyConfig;
    setParty({
      cakes: c.cakes.map((cake, idx) => {
        if (idx !== i) return cake;
        const has = cake.fillings.includes(f);
        if (has) {
          if (cake.fillings.length === 1) return cake; // one is always required
          return { ...cake, fillings: cake.fillings.filter((x) => x !== f) };
        }
        if (cake.fillings.length >= 2) return cake; // cap at two
        return { ...cake, fillings: [...cake.fillings, f] };
      }),
    });
  };

  // Kit / ready-made cake fillings stay a distinct 1–2 selection.
  const toggleFilling = (f: Filling) => {
    const c = config as KitConfig;
    const has = c.fillings.includes(f);
    let fillings: Filling[];
    if (has) {
      if (c.fillings.length === 1) return; // one is always required
      fillings = c.fillings.filter((x) => x !== f);
    } else {
      if (c.fillings.length >= 2) return; // cap at two
      fillings = [...c.fillings, f];
    }
    setKit({ fillings });
  };

  const toggleColour = (key: ColourKey) => {
    const c = config as KitConfig;
    const has = c.colours.includes(key);
    if (has) {
      if (c.colours.length <= includedColoursFor(c.productId)) return; // can't drop below the included count
      setKit({ colours: c.colours.filter((k) => k !== key) });
    } else {
      if (c.colours.length >= MAX_COLOURS) return; // cap at included + 6
      setKit({ colours: [...c.colours, key] });
    }
  };

  const Stepper = ({
    label,
    swatch,
    value,
    onDec,
    onInc,
    decDisabled,
    incDisabled,
  }: {
    label: string;
    swatch?: string;
    value: number;
    onDec: () => void;
    onInc: () => void;
    decDisabled?: boolean;
    incDisabled?: boolean;
  }) => (
    <div className="flex items-center justify-between gap-4 py-3" style={{ borderTop: "1px solid rgba(61, 42, 34, 0.12)" }}>
      <span className="type-body flex items-center gap-3">
        {swatch && (
          <span
            aria-hidden="true"
            className="inline-block shrink-0"
            style={{ width: "1.5rem", height: "1.5rem", backgroundColor: swatch, border: "1px solid rgba(61, 42, 34, 0.25)" }}
          />
        )}
        {label}
      </span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onDec}
          disabled={decDisabled}
          aria-label={`${t.cfgDecrease}: ${label}`}
          className="w-11 h-11 type-price flex items-center justify-center transition-all hover:bg-[var(--warm-peach)] disabled:opacity-30"
          style={{ border: "1px solid var(--warm-cocoa)", fontSize: "1.9rem", fontWeight: 800, lineHeight: 1 }}
        >
          −
        </button>
        <span className="type-price min-w-[1.5rem] text-center" style={{ fontSize: "1.15rem" }}>
          {locNum(value, lang)}
        </span>
        <button
          type="button"
          onClick={onInc}
          disabled={incDisabled}
          aria-label={`${t.cfgIncrease}: ${label}`}
          className="w-11 h-11 type-price flex items-center justify-center transition-all hover:bg-[var(--warm-peach)] disabled:opacity-30"
          style={{ border: "1px solid var(--warm-cocoa)", fontSize: "1.9rem", fontWeight: 800, lineHeight: 1 }}
        >
          +
        </button>
      </div>
    </div>
  );

  // --- step bodies --------------------------------------------------------
  const renderFlavour = (c: KitConfig) => (
    <div role="radiogroup" aria-label={t.cfgFlavourTitle} className="grid grid-cols-2 gap-3">
      {FLAVOURS.map((f) => {
        const selected = c.flavour === f;
        return (
          <button
            key={f}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setKit({ flavour: f })}
            className="type-body px-4 py-4 text-start transition-all hover:bg-[var(--warm-peach)]"
            style={cardBtn(selected)}
          >
            {selected && <span aria-hidden="true">✓ </span>}
            {FLAVOUR_LABELS[f][lang]}
          </button>
        );
      })}
    </div>
  );

  const renderFilling = () => {
    const kit = config as KitConfig;
    const twoChosen = kit.fillings.length >= 2;
    return (
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          {FILLINGS.map((f) => {
            const selected = kit.fillings.includes(f);
            return (
              <button
                key={f}
                type="button"
                aria-pressed={selected}
                disabled={!selected && twoChosen}
                onClick={() => toggleFilling(f)}
                className="type-body px-4 py-3 text-start transition-all hover:bg-[var(--warm-peach)] disabled:opacity-40"
                style={cardBtn(selected)}
              >
                {selected && <span aria-hidden="true">✓ </span>}
                {FILLING_LABELS[f][lang]}
              </button>
            );
          })}
        </div>
        {twoChosen && (
          <p className="type-caps" style={{ color: "var(--dusty-wine)" }}>
            +{locNum(EXTRA_ITEM_SEK, lang)} kr · {t.cfgReasonFilling}
          </p>
        )}
      </div>
    );
  };

  // Sponge and filling are deliberately separate screens (see PARTY_STEPS):
  // one kind of button grid per step, so it's never ambiguous which buttons
  // pick the cake's sponge and which pick its filling. Each cake keeps its
  // own flavour and 1–2 fillings — no pooling by sponge, so "two vanilla
  // cakes with different fillings" is an explicit, visible choice per cake
  // rather than an ambiguous shared count.
  const renderPartySponge = (c: PartyConfig) => (
    <div className="flex flex-col gap-4">
      {c.cakes.map((cake, i) => (
        <div key={i}>
          <div className="type-caps ink-muted mb-2">
            {t.cfgCakeWord} {locNum(i + 1, lang)}
          </div>
          <div
            role="radiogroup"
            aria-label={`${t.cfgCakeWord} ${locNum(i + 1, lang)}: ${t.cfgFlavourTitle}`}
            className="grid grid-cols-2 gap-2"
          >
            {FLAVOURS.map((f) => {
              const selected = cake.flavour === f;
              return (
                <button
                  key={f}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setPartyCakeFlavour(i, f)}
                  className="type-body px-3 py-2 text-start transition-all hover:bg-[var(--warm-peach)]"
                  style={cardBtn(selected)}
                >
                  {selected && <span aria-hidden="true">✓ </span>}
                  {FLAVOUR_LABELS[f][lang]}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  const renderPartyFillings = (c: PartyConfig) => (
    <div className="flex flex-col gap-6">
      {c.cakes.map((cake, i) => {
        const twoChosen = cake.fillings.length >= 2;
        return (
          <div key={i}>
            {/* Names the sponge chosen on the previous step — the filling
                buttons below are the only interactive control on this card. */}
            <div className="type-caps ink-muted mb-2">
              {t.cfgCakeWord} {locNum(i + 1, lang)} · {FLAVOUR_LABELS[cake.flavour][lang]}
            </div>
            <div
              role="group"
              aria-label={`${t.cfgCakeWord} ${locNum(i + 1, lang)}: ${t.cfgFillingTitle}`}
              className="grid grid-cols-2 gap-2"
            >
              {FILLINGS.map((f) => {
                const selected = cake.fillings.includes(f);
                return (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={selected}
                    disabled={!selected && twoChosen}
                    onClick={() => togglePartyCakeFilling(i, f)}
                    className="type-body px-3 py-2 text-start transition-all hover:bg-[var(--warm-peach)] disabled:opacity-40"
                    style={cardBtn(selected)}
                  >
                    {selected && <span aria-hidden="true">✓ </span>}
                    {FILLING_LABELS[f][lang]}
                  </button>
                );
              })}
            </div>
            {twoChosen && (
              <p className="type-caps mt-2" style={{ color: "var(--dusty-wine)" }}>
                +{locNum(EXTRA_ITEM_SEK, lang)} kr · {t.cfgReasonFilling}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderTools = () => {
    const used = toolCount(config.tools);
    const extra = Math.max(0, used - includedTools);
    return (
      <div>
        {TOOLS.map((k) => (
          <Stepper
            key={k}
            label={TOOL_LABELS[k][lang]}
            value={config.tools[k] || 0}
            onDec={() => setTool(k, -1)}
            onInc={() => setTool(k, +1)}
            decDisabled={(config.tools[k] || 0) <= 0}
          />
        ))}
        <p className="type-caps mt-4" style={{ color: extra > 0 ? "var(--dusty-wine)" : undefined }}>
          {extra > 0
            ? `+${locNum(extra * EXTRA_ITEM_SEK, lang)} kr · ${locNum(extra, lang)} ${t.cfgReasonTool}`
            : `${locNum(used, lang)} ${t.cfgOfWord} ${locNum(includedTools, lang)} ${t.cfgIncludedWord}`}
        </p>
      </div>
    );
  };

  const renderColours = (c: KitConfig) => {
    const included = includedColoursFor(c.productId);
    const extra = Math.max(0, c.colours.length - included);
    return (
      <div>
        <div role="group" aria-label={t.cfgColoursTitle} className="grid grid-cols-2 gap-3">
          {COLOURS.map(({ key, hex, label }) => {
            const selected = c.colours.includes(key);
            const atCap = !selected && c.colours.length >= MAX_COLOURS;
            return (
              <button
                key={key}
                type="button"
                role="checkbox"
                aria-checked={selected}
                disabled={atCap}
                onClick={() => toggleColour(key)}
                className="type-body flex items-center gap-3 px-3 py-3 text-start transition-all hover:bg-[var(--warm-peach)] disabled:opacity-40"
                style={{
                  minHeight: "44px",
                  border: selected ? "2px solid var(--dusty-terracotta)" : "1px solid var(--warm-cocoa)",
                  backgroundColor: selected ? "var(--warm-peach)" : "transparent",
                }}
              >
                <span
                  aria-hidden="true"
                  className="inline-block shrink-0"
                  style={{ width: "1.5rem", height: "1.5rem", backgroundColor: hex, border: "1px solid rgba(61, 42, 34, 0.25)" }}
                />
                <span className="flex-1">{label[lang]}</span>
                {selected && <span aria-hidden="true">✓</span>}
              </button>
            );
          })}
        </div>
        <p className="type-caps mt-4" style={{ color: extra > 0 ? "var(--dusty-wine)" : undefined }}>
          {extra > 0
            ? `+${locNum(extra * EXTRA_ITEM_SEK, lang)} kr · ${locNum(extra, lang)} ${t.cfgReasonColour}`
            : `${locNum(c.colours.length, lang)} ${t.cfgOfWord} ${locNum(included, lang)} ${t.cfgIncludedWord}`}
        </p>
      </div>
    );
  };

  // Party colours are pots per shade (like tools), so guests can share or spread
  // shades freely across the party. Included allowance scales per guest.
  const renderPartyColours = (c: PartyConfig) => {
    const used = colourCount(c.colours);
    const extra = Math.max(0, used - includedColours);
    return (
      <div>
        <div role="group" aria-label={t.cfgColoursTitle}>
          {COLOURS.map(({ key, hex, label }) => (
            <Stepper
              key={key}
              label={label[lang]}
              swatch={hex}
              value={c.colours[key] || 0}
              onDec={() => setPartyColour(key, -1)}
              onInc={() => setPartyColour(key, +1)}
              decDisabled={(c.colours[key] || 0) <= 0}
            />
          ))}
        </div>
        <p className="type-caps mt-4" style={{ color: extra > 0 ? "var(--dusty-wine)" : undefined }}>
          {extra > 0
            ? `+${locNum(extra * EXTRA_ITEM_SEK, lang)} kr · ${locNum(extra, lang)} ${t.cfgReasonColour}`
            : `${locNum(used, lang)} ${t.cfgOfWord} ${locNum(includedColours, lang)} ${t.cfgIncludedWord}`}
        </p>
      </div>
    );
  };

  const renderCakes = (c: PartyConfig) => {
    const total = c.cakes.length;
    const atMax = total >= PARTY_MAX_SELF_SERVE;
    const setCakeCount = (n: number) => {
      const target = Math.min(PARTY_MAX_SELF_SERVE, Math.max(PARTY_MIN_CAKES, n));
      const cakes =
        target > total
          ? [...c.cakes, ...Array.from({ length: target - total }, () => defaultPartyCake())]
          : c.cakes.slice(0, target);
      // Scale tools and colours with the guest count — each guest decorates
      // their own cake, so the per-guest sets grow/shrink with the party size
      // (preserves any extra the customer added, per guest).
      const scale = (v: number) => (total > 0 ? Math.round((v / total) * target) : v);
      const tools: Tools = { piping: scale(c.tools.piping), brush: scale(c.tools.brush), knife: scale(c.tools.knife) };
      const colours: ColourCounts = {};
      for (const { key } of COLOURS) {
        const scaled = scale(c.colours[key] || 0);
        if (scaled > 0) colours[key] = scaled;
      }
      setParty({ cakes, tools, colours });
    };
    return (
      <div>
        <Stepper
          label={t.cfgCakesAria}
          value={total}
          onDec={() => setCakeCount(total - 1)}
          onInc={() => setCakeCount(total + 1)}
          decDisabled={total <= PARTY_MIN_CAKES}
          incDisabled={atMax}
        />
        <p className="type-caps ink-muted mt-3">{t.cfgCakesPer}</p>
        <p className="type-caps ink-muted mt-1">{t.cfgCakesSize}</p>
        {atMax && (
          <a
            href="mailto:mjuklov.se@gmail.com"
            className="type-caps inline-flex items-center gap-2 mt-4 underline transition-colors hover:text-[var(--dusty-terracotta)]"
          >
            {t.cfgCakesContact} <span aria-hidden="true">{arrow}</span>
          </a>
        )}
      </div>
    );
  };

  const renderDate = () => (
    <div>
      <input
        type="date"
        value={date}
        min={minDate}
        onChange={(e) => setDate(e.target.value)}
        aria-label={t.cfgDateTitle}
        className="p-3 type-body bg-transparent w-full"
        style={{ border: "1px solid rgba(61, 42, 34, 0.2)" }}
      />
    </div>
  );

  const renderReview = () => {
    const extras: string[] = [];
    const fillExtra = extraFillings(config);
    if (fillExtra > 0)
      extras.push(`+${locNum(fillExtra * EXTRA_ITEM_SEK, lang)} kr · ${locNum(fillExtra, lang)} ${t.cfgReasonFilling}`);
    const toolExtra = Math.max(0, toolCount(config.tools) - includedTools);
    if (toolExtra > 0)
      extras.push(`+${locNum(toolExtra * EXTRA_ITEM_SEK, lang)} kr · ${locNum(toolExtra, lang)} ${t.cfgReasonTool}`);
    const colExtra = isParty
      ? Math.max(0, colourCount((config as PartyConfig).colours) - includedColours)
      : Math.max(0, (config as KitConfig).colours.length - includedColours);
    if (colExtra > 0)
      extras.push(`+${locNum(colExtra * EXTRA_ITEM_SEK, lang)} kr · ${locNum(colExtra, lang)} ${t.cfgReasonColour}`);
    return (
      <div className="flex flex-col gap-4">
        <p className="type-body">{describeLine(config, lang)}</p>
        {date && <p className="type-caps ink-muted">{locNum(date, lang)}</p>}
        {extras.length > 0 && (
          <ul className="list-none p-0 m-0 flex flex-col gap-1">
            {extras.map((x, i) => (
              <li key={i} className="type-caps" style={{ color: "var(--dusty-wine)" }}>
                {x}
              </li>
            ))}
          </ul>
        )}
        <div className="type-price" style={{ fontSize: "1.5rem" }}>
          <PriceTag sek={price} lang={lang} />
        </div>
      </div>
    );
  };

  const titleFor: Record<string, string> = {
    flavour: t.cfgFlavourTitle,
    sponge: t.cfgFlavourTitle,
    filling: t.cfgFillingTitle,
    colour: t.cfgColoursTitle,
    tools: t.cfgToolsTitle,
    date: t.cfgDateTitle,
    review: t.cfgReviewTitle,
    cakes: t.cfgCakesTitle,
  };
  const includedFor: Record<string, string | null> = {
    flavour: t.cfgFlavourIncluded,
    sponge: t.cfgSpongeIncluded,
    filling: isParty ? t.cfgFillingPartyIncluded : t.cfgFillingIncluded,
    colour: isParty
      ? t.cfgColoursPartyIncluded
      : product.id === "kit-grande"
        ? t.cfgColoursPickDeluxe
        : t.cfgColoursPick,
    tools: isParty
      ? t.cfgToolsIncludedParty
      : product.id === "kit-grande"
        ? t.cfgToolsIncludedDeluxe
        : t.cfgToolsIncluded,
    date: isParty ? t.cfgDateIncludedParty : t.cfgDateIncludedKit,
    review: null,
    cakes: t.cfgCakesIncluded,
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-6"
      style={{ backgroundColor: "rgba(61, 42, 34, 0.45)" }}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cfg-heading"
        tabIndex={-1}
        dir={rtl ? "rtl" : "ltr"}
        lang={lang}
        onClick={(e) => e.stopPropagation()}
        // Fixed height, not shrink-to-fit: every step renders at the same box
        // size (sized for the tallest step in the flow, capped by viewport)
        // instead of the sheet visibly growing/shrinking as you move between
        // steps. Short steps just leave empty space above the footer; tall
        // ones scroll internally (see the sticky footer below).
        className="w-full sm:max-w-[34rem] h-[min(80vh,42rem)] flex flex-col focus-visible:outline-none"
        style={{ backgroundColor: "var(--vanilla-cream)", boxShadow: "0 -8px 40px rgba(61, 42, 34, 0.18)" }}
      >
        {/* Header: name + close */}
        <div className="flex items-center justify-between gap-4 px-6 pt-6 shrink-0">
          <div className="type-caps ink-muted">
            {t.cfgStepWord} {locNum(step + 1, lang)} {t.cfgOfWord} {locNum(steps.length, lang)} ·{" "}
            <span className="type-product" style={{ textTransform: "none" }}>{product.name[lang]}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.cfgClose}
            className="type-caps ink-muted hover:text-[var(--dusty-terracotta)] p-2 -m-2"
          >
            ✕
          </button>
        </div>

        {/* Progress: a single passive status line, not a control. It used to be
            six segmented, tappable-looking buttons, but only already-visited
            ones actually responded — that mismatch between shape and behaviour
            is what read as broken. This is decorative only (the "Steg X av 6"
            label above already states position in words), so no click handler
            and no per-segment shapes that could imply one. */}
        <div className="px-6 mt-3 shrink-0">
          <div aria-hidden="true" className="h-1 relative overflow-hidden" style={{ backgroundColor: "rgba(61, 42, 34, 0.15)" }}>
            <div
              className="absolute inset-y-0 start-0 transition-all duration-300"
              style={{ width: `${((step + 1) / steps.length) * 100}%`, backgroundColor: "var(--dusty-terracotta)" }}
            />
          </div>
        </div>

        {/* Step body — the sheet's own scrollable region. The nav footer lives
            inside it (last child, sticky to its bottom), not fixed to the
            window: a window-fixed bar jumps as the mobile browser's address bar
            shows/hides and resizes the live viewport, but a bar sticky within
            this internal scroll container is immune to that. */}
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col px-6">
          <div className="flex-1 py-6">
            <h2 id="cfg-heading" className="mb-1" style={{ fontSize: "clamp(1.4rem, 3vw, 1.9rem)" }}>
              {titleFor[current]}
            </h2>
            {includedFor[current] && <p className="type-body ink-muted mb-6">{includedFor[current]}</p>}
            {current === "flavour" && renderFlavour(config as KitConfig)}
            {current === "sponge" && renderPartySponge(config as PartyConfig)}
            {current === "filling" && (isParty ? renderPartyFillings(config as PartyConfig) : renderFilling())}
            {current === "colour" && (isParty ? renderPartyColours(config as PartyConfig) : renderColours(config as KitConfig))}
            {current === "tools" && renderTools()}
            {current === "cakes" && renderCakes(config as PartyConfig)}
            {current === "date" && renderDate()}
            {current === "review" && renderReview()}
          </div>

          {/* Footer: single persistent price + Back/Next/Add. Sticky to the
              bottom of the scroll area above, with its own opaque background so
              scrolled-under content doesn't show through, and safe-area padding
              so it clears the home indicator on notched iPhones. */}
          <div
            className="sticky bottom-0 flex items-center justify-between gap-4 pt-4"
            style={{
              borderTop: "1px solid rgba(61, 42, 34, 0.12)",
              backgroundColor: "var(--vanilla-cream)",
              paddingBottom: "calc(1rem + env(safe-area-inset-bottom))",
            }}
          >
            <div className="leading-tight">
              <div className="type-caps ink-muted">{t.cfgPrice}</div>
              <div className="type-price" style={{ fontSize: "1.35rem" }}>
                <PriceTag sek={price} lang={lang} compact />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={prev}
                className="type-caps min-h-11 px-4 py-3 transition-colors hover:text-[var(--dusty-terracotta)]"
              >
                <span aria-hidden="true">{back}</span> {t.cfgBack}
              </button>
              {current === "review" ? (
                <button
                  type="button"
                  onClick={add}
                  className="type-caps min-h-11 px-5 py-3 transition-all hover:bg-[var(--warm-peach)]"
                  style={{ border: "1px solid var(--warm-cocoa)" }}
                >
                  {isEdit ? t.cfgSaveChanges : t.cfgAddWord} · {locNum(shownPrice, lang)} kr
                </button>
              ) : (
                <button
                  type="button"
                  onClick={next}
                  disabled={!canAdvance}
                  className="type-caps min-h-11 px-5 py-3 transition-all hover:bg-[var(--warm-peach)] disabled:opacity-40"
                  style={{ border: "1px solid var(--warm-cocoa)" }}
                >
                  {t.cfgNext} <span aria-hidden="true">{arrow}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
