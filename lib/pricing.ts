// Single source of truth for shop pricing + lead-time rules. Imported by the
// client configurator (preview), the cart page (line totals), and the
// order-request route (server-side recomputation — never trust the client).
// Money is SEK and VAT-inclusive (livsmedelsmoms sits inside the price).
import { getProduct } from "@/lib/products";
import type { Lang } from "@/lib/i18n";

// ───────────────────────────────────────────────────────────────
// Tunables (Asal owns these; defaults are usable as-is)
// ───────────────────────────────────────────────────────────────
export const EXTRA_ITEM_SEK = 29; // flat surcharge for any extra colour or tool
export const FILLING_FREE_COUNT = 1; // fillings included free; extras at EXTRA_ITEM_SEK
export const PARTY_BASE_SEK = 390; // covers 2 cakes
export const PARTY_BASE_CAKES = 2;
export const PARTY_PER_CAKE_SEK = 185; // each additional cake (3rd … 10th)
export const PARTY_MAX_SELF_SERVE = 10; // 11+ routes to contact-us
export const LEAD_DAYS_KIT = 3;
export const LEAD_DAYS_PARTY = 7; // hard rule
export const LEAD_DAYS_MENU = 2;
export const LEAD_DAYS_MENU_BIG = 4;
export const MENU_BIG_ORDER_QTY = 30;

// ───────────────────────────────────────────────────────────────
// Option sets — shared by UI + describeLine()
// ───────────────────────────────────────────────────────────────
export const FLAVOURS = ["vanilla", "chocolate"] as const;
export const FILLINGS = ["berries", "chocolate-berry", "nuts-fruits", "biscoff", "caramel"] as const;
export const TOOLS = ["piping", "brush", "knife"] as const;

export type Flavour = (typeof FLAVOURS)[number];
export type Filling = (typeof FILLINGS)[number];
export type ToolKind = (typeof TOOLS)[number];

type Tri = { sv: string; en: string; fa: string };

export const FLAVOUR_LABELS: Record<Flavour, Tri> = {
  vanilla: { sv: "vanilj", en: "vanilla", fa: "وانیلی" },
  chocolate: { sv: "choklad", en: "chocolate", fa: "شکلاتی" },
};

export const FILLING_LABELS: Record<Filling, Tri> = {
  berries: { sv: "bär", en: "berries", fa: "میوه‌های قرمز" },
  "chocolate-berry": { sv: "choklad & bär", en: "chocolate & berry", fa: "شکلات و توت" },
  "nuts-fruits": { sv: "nötter & frukt", en: "nuts & fruit", fa: "آجیل و میوه" },
  biscoff: { sv: "Biscoff", en: "Biscoff", fa: "بیسکاف" },
  caramel: { sv: "kola", en: "caramel", fa: "کارامل" },
};

export const TOOL_LABELS: Record<ToolKind, Tri> = {
  piping: { sv: "spritspåse", en: "piping bag", fa: "قیف خامه" },
  brush: { sv: "pensel", en: "brush", fa: "قلم‌مو" },
  knife: { sv: "palettkniv", en: "palette knife", fa: "کاردک" },
};

// ───────────────────────────────────────────────────────────────
// Line configuration — the unit the cart stores + the route receives
// ───────────────────────────────────────────────────────────────
export type LineConfig = {
  productId: string;
  qty: number;
  flavour?: Flavour; // kit
  fillings?: Filling[]; // kit, length 1–2
  colours?: number; // kit — total chosen colour count (≥ included.colours)
  tools?: { piping: number; brush: number; knife: number }; // kit
  variantId?: string; // menu
  partyCakes?: number; // party — 2 … PARTY_MAX_SELF_SERVE
};

const toolTotal = (t?: LineConfig["tools"]): number =>
  t ? t.piping + t.brush + t.knife : 0;

/** Line price in kronor (integer). Returns 0 if the product is unknown. */
export function priceLineSek(cfg: LineConfig): number {
  const p = getProduct(cfg.productId);
  if (!p) return 0;
  const qty = Math.max(1, cfg.qty | 0);

  if (p.kind === "party") {
    const cakes = Math.max(PARTY_BASE_CAKES, Math.min(PARTY_MAX_SELF_SERVE, cfg.partyCakes ?? PARTY_BASE_CAKES));
    const extra = Math.max(0, cakes - PARTY_BASE_CAKES);
    return Math.round(PARTY_BASE_SEK + extra * PARTY_PER_CAKE_SEK) * qty;
  }

  if (p.kind === "menu") {
    const v = p.variants?.find((x) => x.id === cfg.variantId) ?? p.variants?.[0];
    const unit = v?.priceSek ?? p.priceSek;
    return Math.round(unit) * qty;
  }

  // Kit (configurable) — base + extras for fillings/tools/colours.
  const base = p.priceSek;
  const fillings = cfg.fillings?.length ?? 0;
  const extraFillings = Math.max(0, fillings - FILLING_FREE_COUNT);
  const includedTools = p.included?.tools ?? 0;
  const includedColours = p.included?.colours ?? 0;
  const extraTools = Math.max(0, toolTotal(cfg.tools) - includedTools);
  const extraColours = Math.max(0, (cfg.colours ?? includedColours) - includedColours);
  const unit = base + (extraFillings + extraTools + extraColours) * EXTRA_ITEM_SEK;
  return Math.round(unit) * qty;
}

/** Minimum lead days for a single line. Uses the product's `leadDays` and the
 *  big-order escalation for the menu line. */
export function leadDaysFor(cfg: LineConfig): number {
  const p = getProduct(cfg.productId);
  if (!p) return LEAD_DAYS_KIT;
  if (p.kind === "party") return LEAD_DAYS_PARTY;
  if (p.kind === "menu") {
    const v = p.variants?.find((x) => x.id === cfg.variantId);
    // Treat the variant's quantity-bearing label loosely: rely on cfg.qty alone
    // since variants like box4/box9 each ship as one box. For big-order purposes
    // we use total *boxes* × an implicit piece count? Simplest correct rule:
    // qty itself is the unit count callers pass; large orders ≥ MENU_BIG_ORDER_QTY.
    void v;
    return cfg.qty >= MENU_BIG_ORDER_QTY ? LEAD_DAYS_MENU_BIG : LEAD_DAYS_MENU;
  }
  if (p.kind === "kit") return p.leadDays ?? LEAD_DAYS_KIT;
  return p.leadDays ?? LEAD_DAYS_KIT;
}

/** Today + max-lead across the cart, as YYYY-MM-DD (UTC). */
export function earliestDateFor(cfgs: LineConfig[]): string {
  const lead = cfgs.reduce((m, c) => Math.max(m, leadDaysFor(c)), LEAD_DAYS_KIT);
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + lead);
  return d.toISOString().slice(0, 10);
}

const pickTri = (t: Tri, lang: Lang): string => t[lang];

/** Human-readable, localized one-line summary used in cart rows + owner email. */
export function describeLine(cfg: LineConfig, lang: Lang): string {
  const p = getProduct(cfg.productId);
  if (!p) return cfg.productId;
  const name = p.name[lang];

  if (p.kind === "party") {
    const cakes = cfg.partyCakes ?? PARTY_BASE_CAKES;
    const cakesWord = lang === "sv" ? "tårtor" : lang === "fa" ? "کیک" : "cakes";
    return `${name} — ${cakes} ${cakesWord}`;
  }

  if (p.kind === "menu") {
    const v = p.variants?.find((x) => x.id === cfg.variantId) ?? p.variants?.[0];
    return v ? `${name} — ${pickTri(v.label, lang)}` : name;
  }

  if (p.kind === "kit") {
    const parts: string[] = [];
    if (cfg.flavour) parts.push(pickTri(FLAVOUR_LABELS[cfg.flavour], lang));
    if (cfg.fillings && cfg.fillings.length)
      parts.push(cfg.fillings.map((f) => pickTri(FILLING_LABELS[f], lang)).join(" + "));
    const total = toolTotal(cfg.tools);
    if (total > 0 && cfg.tools) {
      const tools = (Object.keys(cfg.tools) as ToolKind[])
        .filter((k) => (cfg.tools as Record<ToolKind, number>)[k] > 0)
        .map((k) => `${(cfg.tools as Record<ToolKind, number>)[k]} ${pickTri(TOOL_LABELS[k], lang)}`)
        .join(", ");
      const includedTools = p.included?.tools ?? 0;
      const extra = Math.max(0, total - includedTools);
      const extraTxt =
        extra > 0
          ? lang === "sv"
            ? ` (${extra} extra)`
            : lang === "fa"
              ? ` (${extra} اضافه)`
              : ` (${extra} extra)`
          : "";
      parts.push(tools + extraTxt);
    }
    return parts.length ? `${name} — ${parts.join(" · ")}` : name;
  }

  return name;
}
