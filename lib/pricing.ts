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
export const INCLUDED_COLOURS_GRANDE = 5; // the large DIY kit (grande) includes five
export const INCLUDED_TOOLS_DEFAULT = 2; // two tools included
export const INCLUDED_TOOLS_GRANDE = 4; // the large DIY kit (grande) includes four

export const PARTY_BASE_SEK = 400; // covers PARTY_BASE_CAKES cakes
export const PARTY_BASE_CAKES = 1;
export const PARTY_PER_CAKE_SEK = 290; // each cake beyond the base
// The advertised floor: the minimum order is PARTY_MIN_CAKES cakes, so a party
// starts at PARTY_BASE_SEK + (PARTY_MIN_CAKES - PARTY_BASE_CAKES) * PARTY_PER_CAKE_SEK
// = 400 + 290 = 690 kr (kept in sync with PARTY_PACK.priceSek in lib/products.ts).
export const PARTY_MIN_CAKES = 2;
export const PARTY_MAX_SELF_SERVE = 10; // 11+ → "contact us"

export const LEAD_DAYS_KIT = 3;
export const LEAD_DAYS_PARTY = 7;

// Cakes & Bakes: above this many of one bake, we ask for extra notice.
export const MENU_BIG_ORDER_QTY = 10;

// --- Option sets ----------------------------------------------------------
export const FLAVOURS = ["vanilla", "chocolate"] as const;
export type Flavour = (typeof FLAVOURS)[number];

export const FILLINGS = ["berries", "chocolate-berry", "nuts-fruit", "biscoff", "caramel"] as const;
export type Filling = (typeof FILLINGS)[number];
/** Party fillings are counted per filling (portions), bucketed by sponge, so a
 *  party of N cakes gets INCLUDED_FILLINGS per cake. Kits pick a distinct list. */
export type FillingCounts = Partial<Record<Filling, number>>;

export const TOOLS = ["piping", "brush", "knife"] as const;
export type ToolKey = (typeof TOOLS)[number];
export type Tools = Record<ToolKey, number>;

// Curated gel colours we stock. The swatch hex is decorative only — the name is
// always shown alongside (accessibility), so the fill never carries meaning.
export const COLOURS = [
  { key: "blush", hex: "#F4C2C2", label: { sv: "Rosa", en: "Blush pink", fa: "صورتی" } },
  { key: "sky", hex: "#AFCBE3", label: { sv: "Himmelsblå", en: "Sky blue", fa: "آبی آسمانی" } },
  { key: "sage", hex: "#B7C4A6", label: { sv: "Salviagrön", en: "Sage green", fa: "سبز مریم‌گلی" } },
  { key: "butter", hex: "#F3DFA2", label: { sv: "Smörgul", en: "Butter yellow", fa: "زرد کره‌ای" } },
  { key: "terracotta", hex: "#A85D4E", label: { sv: "Terrakotta", en: "Terracotta", fa: "تراکوتا" } },
  { key: "lilac", hex: "#C9B6D6", label: { sv: "Lila", en: "Lilac", fa: "یاسی" } },
  { key: "cocoa", hex: "#6B4A39", label: { sv: "Kakao", en: "Cocoa", fa: "کاکائو" } },
  { key: "natural", hex: "#F3ECE0", label: { sv: "Naturvit", en: "Natural", fa: "طبیعی" } },
] as const;
export type ColourKey = (typeof COLOURS)[number]["key"];
/** Party colours are counted per shade (pots), like tools — a party of N guests
 *  gets INCLUDED_COLOURS pots per cake. Kits, by contrast, pick a distinct set. */
export type ColourCounts = Partial<Record<ColourKey, number>>;

// --- Config shapes --------------------------------------------------------
export type KitConfig = {
  kind: "kit";
  // DIY kits (kit-piccolo | kit-medio | kit-grande) or ready-made cakes
  // (cake-piccolo | cake-medio | cake-grande). Both use this shape; a ready-made
  // cake simply carries no tools and no colours (see defaultKitConfig).
  productId: string;
  flavour: Flavour;
  fillings: Filling[]; // 1–2
  tools: Tools; // counts per tool
  colours: ColourKey[]; // chosen shades; INCLUDED_COLOURS free, extras +EXTRA_ITEM_SEK each
};

export type PartyConfig = {
  kind: "party";
  productId: string; // party-pack
  cakes: number; // PARTY_MIN_CAKES..PARTY_MAX_SELF_SERVE
  vanilla: number; // 0..cakes; chocolate = cakes - vanilla
  // Fillings are bucketed by sponge so each cake's filling is unambiguous. Each
  // bucket's portions sum to that sponge's cake count; INCLUDED_FILLINGS per cake.
  fillings: { vanilla: FillingCounts; chocolate: FillingCounts };
  tools: Tools; // total counts across the party; INCLUDED_TOOLS_DEFAULT per cake included
  colours: ColourCounts; // pots per shade; INCLUDED_COLOURS per cake included
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
  return productId === "kit-grande" ? INCLUDED_TOOLS_GRANDE : INCLUDED_TOOLS_DEFAULT;
}

/** Grande's larger colour allowance mirrors its larger tool allowance. */
export function includedColoursFor(productId: string): number {
  return productId === "kit-grande" ? INCLUDED_COLOURS_GRANDE : INCLUDED_COLOURS;
}

/** A Party Pack is one DIY cake per guest, so each guest gets a kit's worth of
 *  decorating: INCLUDED_TOOLS_DEFAULT tools per cake. The included allowance
 *  therefore scales with the cake count (10 cakes → 20 tools, not a flat 2). */
export function includedToolsForParty(cakes: number): number {
  return INCLUDED_TOOLS_DEFAULT * Math.max(0, cakes);
}

/** Default party tools: a starter set per guest — one piping bag and one brush
 *  each (= INCLUDED_TOOLS_DEFAULT per cake), so the default never costs extra. */
export function defaultPartyTools(cakes: number): Tools {
  const n = Math.max(0, cakes);
  return { piping: n, brush: n, knife: 0 };
}

/** Like tools, party colours scale with guests: INCLUDED_COLOURS pots per cake
 *  (10 cakes → 30 pots included). */
export function includedColoursForParty(cakes: number): number {
  return INCLUDED_COLOURS * Math.max(0, cakes);
}

/** Total pots chosen across all shades. Tolerates a missing map (a party line
 *  persisted before colours existed) by treating it as empty. */
export function colourCount(colours: ColourCounts | undefined): number {
  if (!colours) return 0;
  return COLOURS.reduce((n, c) => n + (colours[c.key] || 0), 0);
}

/** Default party colours: a starter trio per guest — one pot each of the first
 *  three curated shades (= INCLUDED_COLOURS per cake), so it never costs extra. */
export function defaultPartyColours(cakes: number): ColourCounts {
  const n = Math.max(0, cakes);
  return { [COLOURS[0].key]: n, [COLOURS[1].key]: n, [COLOURS[2].key]: n };
}

/** Ready-made cakes (kind "cake") use the shorter flavour + filling flow — no
 *  decorating tools or colours. Everything else (DIY kits) is a full build. */
export function isSimpleCake(productId: string): boolean {
  return getProduct(productId)?.kind === "cake";
}

function evenSplit(count: number): { vanilla: number } {
  return { vanilla: Math.ceil(count / 2) };
}

export function defaultKitConfig(productId: string): KitConfig {
  // Ready-made cake: we decorate it, so no tools and no colours to pick.
  if (isSimpleCake(productId)) {
    return { kind: "kit", productId, flavour: "vanilla", fillings: ["berries"], tools: { piping: 0, brush: 0, knife: 0 }, colours: [] };
  }
  const included = includedToolsFor(productId);
  // Spread the included tools across piping + brush (and knife, plus a second
  // piping bag on grande).
  const tools: Tools =
    included >= 4 ? { piping: 2, brush: 1, knife: 1 } : { piping: 1, brush: 1, knife: included >= 3 ? 1 : 0 };
  // Default to the first N curated shades (an even, pretty set).
  const colours = COLOURS.slice(0, includedColoursFor(productId)).map((c) => c.key);
  return { kind: "kit", productId, flavour: "vanilla", fillings: ["berries"], tools, colours };
}

/** Total filling portions in a bucket. Tolerates a missing/legacy shape. */
export function fillingCount(fc: FillingCounts | undefined): number {
  if (!fc) return 0;
  return FILLINGS.reduce((n, f) => n + (fc[f] || 0), 0);
}

/** Default party fillings: every cake gets berries, bucketed by sponge, so the
 *  buckets sum to the split and nothing costs extra. */
export function defaultPartyFillings(vanilla: number, chocolate: number): { vanilla: FillingCounts; chocolate: FillingCounts } {
  return {
    vanilla: vanilla > 0 ? { berries: vanilla } : {},
    chocolate: chocolate > 0 ? { berries: chocolate } : {},
  };
}

/** Rescale a filling bucket to a new sponge-cake count, preserving the rough
 *  distribution and keeping the bucket summing exactly to newCount. */
export function rebalanceFillings(fc: FillingCounts, newCount: number): FillingCounts {
  const n = Math.max(0, newCount);
  if (n === 0) return {};
  const total = fillingCount(fc);
  if (total === 0) return { berries: n };
  const out: FillingCounts = {};
  let assigned = 0;
  let maxKey: Filling = FILLINGS[0];
  let maxVal = -1;
  for (const f of FILLINGS) {
    const v = fc[f] || 0;
    if (v <= 0) continue;
    const scaled = Math.round((v / total) * n);
    if (scaled > 0) out[f] = scaled;
    assigned += scaled;
    if (v > maxVal) {
      maxVal = v;
      maxKey = f;
    }
  }
  // Land the rounding remainder on the largest bucket so the total is exactly n.
  const diff = n - assigned;
  if (diff !== 0) out[maxKey] = Math.max(0, (out[maxKey] || 0) + diff);
  return out;
}

export function defaultPartyConfig(productId = "party-pack"): PartyConfig {
  const cakes = PARTY_MIN_CAKES; // configurator always opens at the minimum order
  const vanilla = evenSplit(cakes).vanilla;
  return {
    kind: "party",
    productId,
    cakes,
    vanilla,
    fillings: defaultPartyFillings(vanilla, cakes - vanilla),
    tools: defaultPartyTools(cakes),
    colours: defaultPartyColours(cakes),
  };
}

// --- Derived counts -------------------------------------------------------
export function toolCount(tools: Tools): number {
  return TOOLS.reduce((n, k) => n + (tools[k] || 0), 0);
}

export function extraFillings(cfg: LineConfig): number {
  if (cfg.kind === "kit") return Math.max(0, cfg.fillings.length - INCLUDED_FILLINGS);
  // Party: one filling per cake included, per sponge bucket. A cake with a
  // second filling (bucket portions beyond its cake count) is one extra each.
  const choc = cfg.cakes - cfg.vanilla;
  return (
    Math.max(0, fillingCount(cfg.fillings?.vanilla) - cfg.vanilla) +
    Math.max(0, fillingCount(cfg.fillings?.chocolate) - choc)
  );
}

export function extraTools(cfg: LineConfig): number {
  const included = cfg.kind === "kit" ? includedToolsFor(cfg.productId) : includedToolsForParty(cfg.cakes);
  return Math.max(0, toolCount(cfg.tools) - included);
}

export function extraColours(cfg: LineConfig): number {
  if (cfg.kind === "kit") return Math.max(0, cfg.colours.length - includedColoursFor(cfg.productId));
  return Math.max(0, colourCount(cfg.colours) - includedColoursForParty(cfg.cakes));
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
    // Fillings named under each sponge so the pairing is explicit.
    const fillBucket = (fc: FillingCounts | undefined) =>
      FILLINGS.filter((f) => ((fc ?? {})[f] || 0) > 0)
        .map((f) => {
          const n = (fc ?? {})[f] || 0;
          return n > 1 ? `${n}× ${FILLING_LABELS[f][lang]}` : FILLING_LABELS[f][lang];
        })
        .join(", ");
    const vf = fillBucket(cfg.fillings?.vanilla);
    const cf = fillBucket(cfg.fillings?.chocolate);
    const fillingBits = [
      vf && `${FLAVOUR_LABELS.vanilla[lang]}: ${vf}`,
      cf && `${FLAVOUR_LABELS.chocolate[lang]}: ${cf}`,
    ]
      .filter(Boolean)
      .join(sep);
    const cc = cfg.colours ?? {};
    const colourBits = COLOURS.filter((c) => (cc[c.key] || 0) > 0).map((c) => {
      const n = cc[c.key] || 0;
      return n > 1 ? `${n}× ${c.label[lang]}` : c.label[lang];
    });
    return [`${name}: ${cfg.cakes} ${cakesWord}`, split, fillingBits, toolBits.join(", "), colourBits.join(", ")]
      .filter(Boolean)
      .join(sep);
  }

  const fillings = cfg.fillings.map((f) => FILLING_LABELS[f][lang]).join(", ");
  // List chosen shades in palette order for a stable, readable summary.
  const colours = COLOURS.filter((c) => cfg.colours.includes(c.key))
    .map((c) => c.label[lang])
    .join(", ");
  return [name, FLAVOUR_LABELS[cfg.flavour][lang], fillings, toolBits.join(", "), colours]
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
      "fv:" + FILLINGS.map((f) => `${f}:${cfg.fillings?.vanilla?.[f] || 0}`).join(","),
      "fc:" + FILLINGS.map((f) => `${f}:${cfg.fillings?.chocolate?.[f] || 0}`).join(","),
      TOOLS.map((k) => `${k}:${cfg.tools[k] || 0}`).join(","),
      COLOURS.map((c) => `${c.key}:${cfg.colours?.[c.key] || 0}`).join(","),
    ].join("|");
  }
  return [
    "kit",
    cfg.productId,
    cfg.flavour,
    cfg.fillings.slice().sort().join("+"),
    TOOLS.map((k) => `${k}:${cfg.tools[k] || 0}`).join(","),
    `c:${cfg.colours.slice().sort().join("+")}`,
  ].join("|");
}
