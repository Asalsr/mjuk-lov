// Pricing + configuration model for the configurable products (cake kits and
// the party pack). The configurator UI reads everything it needs from here, and
// the server recomputes prices from the same functions — never trust a price
// sent by the browser. All amounts in kronor (SEK).
import type { Lang } from "@/lib/i18n";
import { getProduct } from "@/lib/products";

// --- Tunables -------------------------------------------------------------
export const EXTRA_ITEM_SEK = 29; // flat price for one extra filling / tool / colour
export const INCLUDED_FILLINGS = 1; // one filling is always included
export const INCLUDED_COLOURS = 3; // three colours are always included (kits)
export const INCLUDED_TOOLS_DEFAULT = 2; // two tools included
export const INCLUDED_TOOLS_DELUXE = 3; // Deluxe includes three

export const PARTY_BASE_SEK = 390; // covers PARTY_BASE_CAKES cakes
export const PARTY_BASE_CAKES = 2;
export const PARTY_PER_CAKE_SEK = 185; // each cake beyond the base
export const PARTY_MIN_CAKES = 2;
export const PARTY_MAX_SELF_SERVE = 10; // 11+ → "contact us"

export const LEAD_DAYS_KIT = 3;
export const LEAD_DAYS_PARTY = 7;

// --- Option sets ----------------------------------------------------------
export const FLAVOURS = ["vanilla", "chocolate"] as const;
export type Flavour = (typeof FLAVOURS)[number];

export const FILLINGS = ["berries", "chocolate-berry", "nuts-fruit", "biscoff", "caramel"] as const;
export type Filling = (typeof FILLINGS)[number];

export const TOOLS = ["piping", "brush", "knife"] as const;
export type ToolKey = (typeof TOOLS)[number];
export type Tools = Record<ToolKey, number>;

// --- Config shapes --------------------------------------------------------
export type KitConfig = {
  kind: "kit";
  productId: string; // kit-standard | kit-gift | kit-deluxe
  flavour: Flavour;
  fillings: Filling[]; // 1–2
  tools: Tools; // counts per tool
  colours: number; // ≥ INCLUDED_COLOURS
};

export type PartyConfig = {
  kind: "party";
  productId: string; // party-pack
  cakes: number; // PARTY_MIN_CAKES..PARTY_MAX_SELF_SERVE
  vanilla: number; // 0..cakes; chocolate = cakes - vanilla
  fillings: Filling[]; // 1–2, shared across the party
  tools: Tools; // shared set
};

export type LineConfig = KitConfig | PartyConfig;

// --- Labels (trilingual) --------------------------------------------------
type L = { sv: string; en: string; fa: string };

export const FLAVOUR_LABELS: Record<Flavour, L> = {
  vanilla: { sv: "Vanilj", en: "Vanilla", fa: "وانیل" },
  chocolate: { sv: "Choklad", en: "Chocolate", fa: "شکلات" },
};

export const FILLING_LABELS: Record<Filling, L> = {
  berries: { sv: "Bär", en: "Berries", fa: "توت‌ها" },
  "chocolate-berry": { sv: "Choklad & bär", en: "Chocolate & berry", fa: "شکلات و توت" },
  "nuts-fruit": { sv: "Nötter & frukt", en: "Nuts & fruit", fa: "آجیل و میوه" },
  biscoff: { sv: "Biscoff", en: "Biscoff", fa: "بیسکاف" },
  caramel: { sv: "Kola", en: "Caramel", fa: "کارامل" },
};

export const TOOL_LABELS: Record<ToolKey, L> = {
  piping: { sv: "Spritspåse", en: "Piping bag", fa: "قیف" },
  brush: { sv: "Pensel", en: "Brush", fa: "قلم‌مو" },
  knife: { sv: "Palettkniv", en: "Palette knife", fa: "کاردک" },
};

// --- Defaults -------------------------------------------------------------
export function includedToolsFor(productId: string): number {
  return productId === "kit-deluxe" ? INCLUDED_TOOLS_DELUXE : INCLUDED_TOOLS_DEFAULT;
}

function evenSplit(count: number): { vanilla: number } {
  return { vanilla: Math.ceil(count / 2) };
}

export function defaultKitConfig(productId: string): KitConfig {
  const included = includedToolsFor(productId);
  // Spread the included tools across piping + brush (and knife on Deluxe).
  const tools: Tools = { piping: 1, brush: 1, knife: included >= 3 ? 1 : 0 };
  return { kind: "kit", productId, flavour: "vanilla", fillings: ["berries"], tools, colours: INCLUDED_COLOURS };
}

export function defaultPartyConfig(productId = "party-pack"): PartyConfig {
  const cakes = PARTY_BASE_CAKES;
  return {
    kind: "party",
    productId,
    cakes,
    vanilla: evenSplit(cakes).vanilla,
    fillings: ["berries"],
    tools: { piping: 1, brush: 1, knife: 0 },
  };
}

// --- Derived counts -------------------------------------------------------
export function toolCount(tools: Tools): number {
  return TOOLS.reduce((n, k) => n + (tools[k] || 0), 0);
}

export function extraFillings(cfg: LineConfig): number {
  return Math.max(0, cfg.fillings.length - INCLUDED_FILLINGS);
}

export function extraTools(cfg: LineConfig): number {
  const included = cfg.kind === "kit" ? includedToolsFor(cfg.productId) : INCLUDED_TOOLS_DEFAULT;
  return Math.max(0, toolCount(cfg.tools) - included);
}

export function extraColours(cfg: LineConfig): number {
  return cfg.kind === "kit" ? Math.max(0, cfg.colours - INCLUDED_COLOURS) : 0;
}

// --- Price ----------------------------------------------------------------
/** Price of a single unit of this configuration (kronor). Cart quantity is
 *  applied separately. */
export function priceLineSek(cfg: LineConfig): number {
  const extras = (extraFillings(cfg) + extraTools(cfg) + extraColours(cfg)) * EXTRA_ITEM_SEK;
  if (cfg.kind === "party") {
    const cakes = Math.max(PARTY_MIN_CAKES, cfg.cakes);
    return PARTY_BASE_SEK + Math.max(0, cakes - PARTY_BASE_CAKES) * PARTY_PER_CAKE_SEK + extras;
  }
  const base = getProduct(cfg.productId)?.priceSek ?? 0;
  return base + extras;
}

export function leadDaysFor(cfg: LineConfig): number {
  return cfg.kind === "party" ? LEAD_DAYS_PARTY : LEAD_DAYS_KIT;
}

// --- Human-readable summary ----------------------------------------------
/** One-line summary for the review step, cart row and order email. */
export function describeLine(cfg: LineConfig, lang: Lang): string {
  const sep = " · ";
  const fillings = cfg.fillings.map((f) => FILLING_LABELS[f][lang]).join(", ");
  const toolBits = TOOLS.filter((k) => cfg.tools[k] > 0).map((k) => {
    const n = cfg.tools[k];
    return n > 1 ? `${n}× ${TOOL_LABELS[k][lang]}` : TOOL_LABELS[k][lang];
  });
  const name = getProduct(cfg.productId)?.name[lang] ?? cfg.productId;

  if (cfg.kind === "party") {
    const choc = cfg.cakes - cfg.vanilla;
    const split =
      lang === "sv"
        ? `${cfg.vanilla} vanilj / ${choc} choklad`
        : lang === "fa"
          ? `${cfg.vanilla} وانیل / ${choc} شکلات`
          : `${cfg.vanilla} vanilla / ${choc} chocolate`;
    const cakesWord = lang === "sv" ? "tårtor" : lang === "fa" ? "کیک" : "cakes";
    return [`${name} — ${cfg.cakes} ${cakesWord}`, split, fillings, toolBits.join(", ")]
      .filter(Boolean)
      .join(sep);
  }

  return [name, FLAVOUR_LABELS[cfg.flavour][lang], fillings, toolBits.join(", ")]
    .filter(Boolean)
    .join(sep);
}

/** Stable key for a configuration — two identical configs collapse to one cart
 *  line (and bump quantity) instead of stacking duplicates. */
export function configKey(cfg: LineConfig): string {
  if (cfg.kind === "party") {
    return [
      "party",
      cfg.productId,
      cfg.cakes,
      cfg.vanilla,
      cfg.fillings.slice().sort().join("+"),
      TOOLS.map((k) => `${k}:${cfg.tools[k] || 0}`).join(","),
    ].join("|");
  }
  return [
    "kit",
    cfg.productId,
    cfg.flavour,
    cfg.fillings.slice().sort().join("+"),
    TOOLS.map((k) => `${k}:${cfg.tools[k] || 0}`).join(","),
    `c:${cfg.colours}`,
  ].join("|");
}
