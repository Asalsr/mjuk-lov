"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ui, locNum, isRtl, type Lang } from "@/lib/i18n";
import type { Product } from "@/lib/products";
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
  defaultPartyTools,
  defaultPartyColours,
  defaultPartyFillings,
  rebalanceFillings,
  includedToolsFor,
  includedToolsForParty,
  includedColoursForParty,
  colourCount,
  fillingCount,
  toolCount,
  priceLineSek,
  leadDaysFor,
  describeLine,
  extraFillings,
  type LineConfig,
  type KitConfig,
  type PartyConfig,
  type Filling,
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
const PARTY_STEPS = ["cakes", "split", "filling", "colour", "tools", "date", "review"] as const;

const cardBtn = (selected: boolean): React.CSSProperties => ({
  border: "1px solid var(--warm-cocoa)",
  backgroundColor: selected ? "var(--warm-peach)" : "transparent",
});

/** Repair a config seeded from an older persisted draft or cart line: a Party
 *  Pack saved before tools/colours scaled per guest may lack those maps, and one
 *  saved before fillings were bucketed by sponge carries a flat `Filling[]`. */
function ensurePartyShape(cfg: LineConfig): LineConfig {
  if (cfg.kind !== "party") return cfg;
  const fillings =
    cfg.fillings && !Array.isArray(cfg.fillings)
      ? cfg.fillings
      : defaultPartyFillings(cfg.vanilla, cfg.cakes - cfg.vanilla);
  return {
    ...cfg,
    fillings,
    tools: cfg.tools ?? defaultPartyTools(cfg.cakes),
    colours: cfg.colours ?? defaultPartyColours(cfg.cakes),
  };
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
    if (initialConfig) return ensurePartyShape(initialConfig);
    const seed = loadDraft(product.id)?.config ?? (isParty ? defaultPartyConfig(product.id) : defaultKitConfig(product.id));
    return ensurePartyShape(seed);
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
    ? includedToolsForParty((config as PartyConfig).cakes)
    : includedToolsFor(product.id);
  // Party colours scale per guest (INCLUDED_COLOURS per cake); kits get the flat
  // included trio. Used by the colour step and the review extras line.
  const includedColours = isParty ? includedColoursForParty((config as PartyConfig).cakes) : INCLUDED_COLOURS;

  // Earliest reservable date for this product's lead time.
  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + leadDaysFor(config));
    return d.toISOString().slice(0, 10);
  }, [config]);

  const price = priceLineSek(config);
  const current = steps[step];
  const onDateStep = current === "date";
  const canAdvance = !onDateStep || (!!date && date >= minDate);

  const next = () => (step < steps.length - 1 ? setStep((s) => s + 1) : add());
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

  // Party fillings are counted per filling, bucketed by sponge. A bucket can hold
  // up to two fillings per cake (2 × its cake count), matching the kit's cap.
  const setPartyFilling = (group: "vanilla" | "chocolate", f: Filling, delta: number) => {
    const c = config as PartyConfig;
    const bucketCakes = group === "vanilla" ? c.vanilla : c.cakes - c.vanilla;
    const bucket = c.fillings[group] ?? {};
    const nextVal = Math.max(0, (bucket[f] || 0) + delta);
    if (delta > 0 && fillingCount(bucket) >= 2 * bucketCakes) return; // no third filling on a cake
    setParty({ fillings: { ...c.fillings, [group]: { ...bucket, [f]: nextVal } } });
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
      if (c.colours.length <= INCLUDED_COLOURS) return; // can't drop below the included count
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
          className="w-11 h-11 type-price transition-all hover:bg-[var(--warm-peach)] disabled:opacity-30"
          style={{ border: "1px solid var(--warm-cocoa)" }}
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
          className="w-11 h-11 type-price transition-all hover:bg-[var(--warm-peach)] disabled:opacity-30"
          style={{ border: "1px solid var(--warm-cocoa)" }}
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
        {twoChosen && (
          <p className="type-caps" style={{ color: "var(--dusty-wine)" }}>
            +{locNum(EXTRA_ITEM_SEK, lang)} kr · {t.cfgReasonFilling}
          </p>
        )}
      </div>
    );
  };

  // Party fillings, bucketed by sponge so which filling goes on which sponge is
  // explicit. Each bucket's portions target its cake count; a second filling on
  // a cake (portions beyond the count) is +29, like the kit.
  const renderPartyFillings = (c: PartyConfig) => {
    const groups: { key: "vanilla" | "chocolate"; cakes: number }[] = [
      { key: "vanilla", cakes: c.vanilla },
      { key: "chocolate", cakes: c.cakes - c.vanilla },
    ];
    return (
      <div className="flex flex-col gap-6">
        {groups
          .filter((g) => g.cakes > 0)
          .map((g) => {
            const bucket = c.fillings[g.key] ?? {};
            const used = fillingCount(bucket);
            const extra = Math.max(0, used - g.cakes);
            return (
              <div key={g.key}>
                <div className="type-caps ink-muted mb-1">
                  {FLAVOUR_LABELS[g.key][lang]} {t.cfgSpongeWord} · {locNum(g.cakes, lang)} {t.cfgCakesWord}
                </div>
                {FILLINGS.map((f) => (
                  <Stepper
                    key={f}
                    label={FILLING_LABELS[f][lang]}
                    value={bucket[f] || 0}
                    onDec={() => setPartyFilling(g.key, f, -1)}
                    onInc={() => setPartyFilling(g.key, f, +1)}
                    decDisabled={(bucket[f] || 0) <= 0}
                    incDisabled={used >= 2 * g.cakes}
                  />
                ))}
                <p className="type-caps mt-3" style={{ color: extra > 0 ? "var(--dusty-wine)" : undefined }}>
                  {extra > 0
                    ? `+${locNum(extra * EXTRA_ITEM_SEK, lang)} kr · ${locNum(extra, lang)} ${t.cfgReasonFilling}`
                    : `${locNum(used, lang)} ${t.cfgOfWord} ${locNum(g.cakes, lang)} ${t.cfgAssignedWord}`}
                </p>
              </div>
            );
          })}
      </div>
    );
  };

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
    const extra = Math.max(0, c.colours.length - INCLUDED_COLOURS);
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
            : `${locNum(c.colours.length, lang)} ${t.cfgOfWord} ${locNum(INCLUDED_COLOURS, lang)} ${t.cfgIncludedWord}`}
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
    const atMax = c.cakes >= PARTY_MAX_SELF_SERVE;
    const setCakes = (n: number) => {
      const cakes = Math.min(PARTY_MAX_SELF_SERVE, Math.max(PARTY_MIN_CAKES, n));
      // Rescale the split proportionally and re-clamp so it still sums to cakes.
      const vanilla =
        c.cakes > 0 ? Math.min(cakes, Math.max(0, Math.round((c.vanilla / c.cakes) * cakes))) : Math.ceil(cakes / 2);
      // Scale the tools and colours with the guest count too — each guest
      // decorates their own cake, so the per-guest sets grow/shrink with cakes
      // (keeps the 2 tools + 3 colours per guest default, and preserves any
      // extra the customer added, per guest).
      const scale = (v: number) => (c.cakes > 0 ? Math.round((v / c.cakes) * cakes) : v);
      const tools: Tools = { piping: scale(c.tools.piping), brush: scale(c.tools.brush), knife: scale(c.tools.knife) };
      const colours: ColourCounts = {};
      for (const { key } of COLOURS) {
        const scaled = scale(c.colours[key] || 0);
        if (scaled > 0) colours[key] = scaled;
      }
      // Keep each sponge bucket's fillings summing to its new cake count.
      const fillings = {
        vanilla: rebalanceFillings(c.fillings.vanilla ?? {}, vanilla),
        chocolate: rebalanceFillings(c.fillings.chocolate ?? {}, cakes - vanilla),
      };
      setParty({ cakes, vanilla, tools, colours, fillings });
    };
    return (
      <div>
        <Stepper
          label={t.cfgCakesAria}
          value={c.cakes}
          onDec={() => setCakes(c.cakes - 1)}
          onInc={() => setCakes(c.cakes + 1)}
          decDisabled={c.cakes <= PARTY_MIN_CAKES}
          incDisabled={atMax}
        />
        <p className="type-caps ink-muted mt-3">{t.cfgCakesPer}</p>
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

  const renderSplit = (c: PartyConfig) => {
    const choc = c.cakes - c.vanilla;
    // One auto-balancing control: the divide always sums to the cake count, so
    // there's no way to produce a wrong total and no error state.
    const splitLabel = `${FLAVOUR_LABELS.vanilla[lang]} ${locNum(c.vanilla, lang)} · ${FLAVOUR_LABELS.chocolate[lang]} ${locNum(choc, lang)}`;
    return (
      <div>
        <div className="type-serif text-center mb-5" style={{ fontSize: "1.3rem" }}>
          {splitLabel}
        </div>
        <input
          type="range"
          className="flavour-slider w-full"
          min={0}
          max={c.cakes}
          step={1}
          value={c.vanilla}
          onChange={(e) => {
            const vanilla = Math.min(c.cakes, Math.max(0, Number(e.target.value)));
            // Re-bucket the fillings so each sponge's fillings sum to its new count.
            const fillings = {
              vanilla: rebalanceFillings(c.fillings.vanilla ?? {}, vanilla),
              chocolate: rebalanceFillings(c.fillings.chocolate ?? {}, c.cakes - vanilla),
            };
            setParty({ vanilla, fillings });
          }}
          aria-label={t.cfgSplitAria}
          aria-valuetext={splitLabel}
        />
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
      : Math.max(0, (config as KitConfig).colours.length - INCLUDED_COLOURS);
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
          {locNum(price, lang)} kr
        </div>
      </div>
    );
  };

  const titleFor: Record<string, string> = {
    flavour: t.cfgFlavourTitle,
    filling: t.cfgFillingTitle,
    colour: t.cfgColoursTitle,
    tools: t.cfgToolsTitle,
    date: t.cfgDateTitle,
    review: t.cfgReviewTitle,
    cakes: t.cfgCakesTitle,
    split: t.cfgSplitTitle,
  };
  const includedFor: Record<string, string | null> = {
    flavour: t.cfgFlavourIncluded,
    filling: isParty ? t.cfgFillingPartyIncluded : t.cfgFillingIncluded,
    colour: isParty ? t.cfgColoursPartyIncluded : t.cfgColoursPick,
    tools: isParty
      ? t.cfgToolsIncludedParty
      : product.id === "kit-grande"
        ? t.cfgToolsIncludedDeluxe
        : t.cfgToolsIncluded,
    date: isParty ? t.cfgDateIncludedParty : t.cfgDateIncludedKit,
    review: null,
    cakes: t.cfgCakesIncluded,
    split: t.cfgSplitIncluded,
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
        className="w-full sm:max-w-[34rem] max-h-[92vh] flex flex-col focus-visible:outline-none"
        style={{ backgroundColor: "var(--vanilla-cream)", boxShadow: "0 -8px 40px rgba(61, 42, 34, 0.18)" }}
      >
        {/* Header: name + close + progress dots */}
        <div className="flex items-center justify-between gap-4 px-6 pt-6">
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
        <div className="flex gap-1.5 px-6 mt-3" aria-hidden="true">
          {steps.map((s, i) => (
            <span
              key={s}
              className="h-1 flex-1"
              style={{ backgroundColor: i <= step ? "var(--dusty-terracotta)" : "rgba(61, 42, 34, 0.15)" }}
            />
          ))}
        </div>

        {/* Step body */}
        <div className="px-6 py-6 overflow-y-auto">
          <h2 id="cfg-heading" className="mb-1" style={{ fontSize: "clamp(1.4rem, 3vw, 1.9rem)" }}>
            {titleFor[current]}
          </h2>
          {includedFor[current] && <p className="type-body ink-muted mb-6">{includedFor[current]}</p>}
          {current === "flavour" && renderFlavour(config as KitConfig)}
          {current === "filling" && (isParty ? renderPartyFillings(config as PartyConfig) : renderFilling())}
          {current === "colour" && (isParty ? renderPartyColours(config as PartyConfig) : renderColours(config as KitConfig))}
          {current === "tools" && renderTools()}
          {current === "cakes" && renderCakes(config as PartyConfig)}
          {current === "split" && renderSplit(config as PartyConfig)}
          {current === "date" && renderDate()}
          {current === "review" && renderReview()}
        </div>

        {/* Footer: single persistent price + Back/Next/Add */}
        <div
          className="mt-auto flex items-center justify-between gap-4 px-6 py-4"
          style={{ borderTop: "1px solid rgba(61, 42, 34, 0.12)" }}
        >
          <div className="leading-tight">
            <div className="type-caps ink-muted">{t.cfgPrice}</div>
            <div className="type-price" style={{ fontSize: "1.35rem" }}>
              {locNum(price, lang)} kr
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={prev}
              className="type-caps px-4 py-3 transition-colors hover:text-[var(--dusty-terracotta)]"
            >
              <span aria-hidden="true">{back}</span> {t.cfgBack}
            </button>
            {current === "review" ? (
              <button
                type="button"
                onClick={add}
                className="type-caps px-5 py-3 transition-all hover:bg-[var(--warm-peach)]"
                style={{ border: "1px solid var(--warm-cocoa)" }}
              >
                {isEdit ? t.cfgSaveChanges : t.cfgAddWord} · {locNum(price, lang)} kr
              </button>
            ) : (
              <button
                type="button"
                onClick={next}
                disabled={!canAdvance}
                className="type-caps px-5 py-3 transition-all hover:bg-[var(--warm-peach)] disabled:opacity-40"
                style={{ border: "1px solid var(--warm-cocoa)" }}
              >
                {t.cfgNext} <span aria-hidden="true">{arrow}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
