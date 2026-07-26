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

// One physical cake in a Party Pack — its own flavour and fillings, same rule
// as a kit (1–2 fillings, one always included). Pooling these by sponge type
// used to make "two vanilla cakes, two different fillings" indistinguishable
// from "one vanilla cake with both fillings" in the UI; tracking each cake
// individually removes that ambiguity entirely.
export type PartyCakeConfig = {
  flavour: Flavour;
  fillings: Filling[]; // 1–2
};

export type PartyConfig = {
  kind: "party";
  productId: string; // party-pack
  // One entry per physical cake — length IS the cake count
  // (PARTY_MIN_CAKES..PARTY_MAX_SELF_SERVE).
  cakes: PartyCakeConfig[];
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

function evenSplit(count: number): { vanilla: number } {
  return { vanilla: Math.ceil(count / 2) };
}

/** Nothing pre-chosen beyond what's required to price the base cake (one
 *  flavour, one filling — see house rule: a cake needs both to exist).
 *  Tools and colours start empty for every kit, ready-made or DIY: picking
 *  them is the point of the flow, not a default we've made on the
 *  customer's behalf. */
export function defaultKitConfig(productId: string): KitConfig {
  return {
    kind: "kit",
    productId,
    flavour: "vanilla",
    fillings: ["berries"],
    tools: { piping: 0, brush: 0, knife: 0 },
    colours: [],
  };
}

/** One cake's worth of defaults: vanilla, one filling — mirrors defaultKitConfig
 *  so a Party Pack's per-cake starting point matches a standalone kit's. */
function defaultPartyCake(flavour: Flavour = "vanilla"): PartyCakeConfig {
  return { flavour, fillings: ["berries"] };
}

export function defaultPartyConfig(productId = "party-pack"): PartyConfig {
  const n = PARTY_MIN_CAKES; // configurator always opens at the minimum order
  const vanillaCount = evenSplit(n).vanilla;
  const cakes: PartyCakeConfig[] = Array.from({ length: n }, (_, i) =>
    defaultPartyCake(i < vanillaCount ? "vanilla" : "chocolate"),
  );
  return {
    kind: "party",
    productId,
    cakes,
    // Nothing pre-chosen for tools/colours — picking them is the point of the
    // flow. defaultPartyTools/defaultPartyColours still exist for tests and
    // any caller that wants a "fully allotted" starting point.
    tools: { piping: 0, brush: 0, knife: 0 },
    colours: {},
  };
}

// --- Runtime validation of persisted configs ------------------------------
// Cart and draft configs are persisted (localStorage + the Supabase `carts`
// JSONB column) and outlive the code that wrote them. Everything below treats
// a deserialized config as UNTRUSTED: normalizeLineConfig coerces any drifted
// or foreign shape back to the current one so the pricing/summary functions
// can assume a valid config, and those functions additionally guard their own
// inputs (belt-and-suspenders) so a stray shape degrades instead of throwing.
// This is the fix for the class of bug where an old cart line (e.g. a party
// pack saved as `cakes: number` before the per-cake rework) crashed the whole
// basket on render. See lib/pricing.test.ts for the fixtures this locks down.
const FLAVOUR_SET = new Set<string>(FLAVOURS);
const FILLING_SET = new Set<string>(FILLINGS);
const COLOUR_SET = new Set<string>(COLOURS.map((c) => c.key));

/** A config must at least be a non-null object before any field access. The
 *  public pricing/summary functions call this first so a null/primitive that
 *  somehow reaches them yields a safe default instead of a thrown page. */
function isConfigObject(cfg: unknown): cfg is LineConfig {
  return !!cfg && typeof cfg === "object";
}

function asFlavour(v: unknown): Flavour {
  return typeof v === "string" && FLAVOUR_SET.has(v) ? (v as Flavour) : "vanilla";
}
/** A valid 1–2 filling list; drops unknown/duplicate codes and guarantees the
 *  one always-included filling so a cake is never filling-less. */
function asFillings(v: unknown): Filling[] {
  const arr = Array.isArray(v) ? v.filter((f): f is Filling => typeof f === "string" && FILLING_SET.has(f)) : [];
  const unique = Array.from(new Set(arr)).slice(0, 2);
  return unique.length ? unique : ["berries"];
}
function asToolCount(n: unknown): number {
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}
function asTools(v: unknown): Tools {
  const t = (v ?? {}) as Partial<Record<ToolKey, unknown>>;
  return { piping: asToolCount(t.piping), brush: asToolCount(t.brush), knife: asToolCount(t.knife) };
}
function asColourCounts(v: unknown): ColourCounts {
  const src = (v ?? {}) as Record<string, unknown>;
  const out: ColourCounts = {};
  for (const c of COLOURS) {
    const n = asToolCount(src[c.key]);
    if (n > 0) out[c.key] = n;
  }
  return out;
}
function asColourKeys(v: unknown): ColourKey[] {
  const arr = Array.isArray(v) ? v.filter((k): k is ColourKey => typeof k === "string" && COLOUR_SET.has(k)) : [];
  return Array.from(new Set(arr));
}

/** Coerce any persisted or foreign value into a valid, current-shape
 *  LineConfig. TOTAL: never throws, always returns something the pricing and
 *  summary functions can consume. The single boundary the cart store runs
 *  every deserialized line through (see lib/cart/store `migrate`), and what
 *  the Configurator seeds from. Older party shapes seen in the wild carried
 *  `cakes` as a count with a separate `vanilla` count and fillings pooled by
 *  sponge (`{ vanilla, chocolate }`) or, older still, a flat `Filling[]`. None
 *  tracked which physical cake got which filling, so the per-cake
 *  reconstruction is best-effort — it preserves cake count, flavour split and
 *  total filling count (and therefore price) exactly, not the literal original. */
export function normalizeLineConfig(input: unknown): LineConfig {
  const cfg = (input ?? {}) as Record<string, unknown>;
  if (cfg.kind === "party") return normalizeParty(cfg);
  const productId = typeof cfg.productId === "string" && cfg.productId ? cfg.productId : "kit-medio";
  return {
    kind: "kit",
    productId,
    flavour: asFlavour(cfg.flavour),
    fillings: asFillings(cfg.fillings),
    tools: asTools(cfg.tools),
    colours: asColourKeys(cfg.colours),
  };
}

function normalizeParty(cfg: Record<string, unknown>): PartyConfig {
  const productId = typeof cfg.productId === "string" && cfg.productId ? cfg.productId : "party-pack";
  const tools = asTools(cfg.tools);
  const colours = asColourCounts(cfg.colours);

  if (Array.isArray(cfg.cakes)) {
    const cakes = cfg.cakes.map((c) => {
      const cc = (c ?? {}) as Record<string, unknown>;
      return { flavour: asFlavour(cc.flavour), fillings: asFillings(cc.fillings) };
    });
    return { kind: "party", productId, cakes: cakes.length ? cakes : defaultPartyConfig(productId).cakes, tools, colours };
  }

  // Legacy: `cakes` a count, a separate `vanilla` count, fillings pooled by sponge.
  const total = Math.max(PARTY_MIN_CAKES, typeof cfg.cakes === "number" ? Math.floor(cfg.cakes) : PARTY_MIN_CAKES);
  const vanillaCount = Math.min(
    total,
    Math.max(0, typeof cfg.vanilla === "number" ? Math.floor(cfg.vanilla) : Math.ceil(total / 2)),
  );
  const pooled = cfg.fillings;
  const bucketFor = (flavour: "vanilla" | "chocolate"): Partial<Record<Filling, number>> => {
    if (!pooled || Array.isArray(pooled) || typeof pooled !== "object") return {}; // flat/legacy array — no per-sponge data
    return ((pooled as Record<string, unknown>)[flavour] ?? {}) as Partial<Record<Filling, number>>;
  };
  // Distribute a sponge bucket's portions across its n cakes, up to 2 each, in
  // FILLINGS order — a plausible split, not the literal original.
  const distribute = (bucket: Partial<Record<Filling, number>>, n: number): Filling[][] => {
    const remaining: Partial<Record<Filling, number>> = {};
    for (const f of FILLINGS) remaining[f] = asToolCount(bucket[f]);
    const perCake: Filling[][] = Array.from({ length: Math.max(0, n) }, () => []);
    for (let i = 0; i < perCake.length; i++) {
      for (const f of FILLINGS) {
        if (perCake[i].length >= 2) break;
        if ((remaining[f] || 0) > 0) {
          perCake[i].push(f);
          remaining[f] = (remaining[f] || 0) - 1;
        }
      }
      if (perCake[i].length === 0) perCake[i].push("berries");
    }
    return perCake;
  };
  const cakes: PartyCakeConfig[] = [
    ...distribute(bucketFor("vanilla"), vanillaCount).map((fillings) => ({ flavour: "vanilla" as const, fillings })),
    ...distribute(bucketFor("chocolate"), total - vanillaCount).map((fillings) => ({ flavour: "chocolate" as const, fillings })),
  ];
  return { kind: "party", productId, cakes, tools, colours };
}

// --- Derived counts -------------------------------------------------------
// All counts guard their inputs so a config that slipped past normalization
// (e.g. a legacy party line with `cakes` as a number) degrades instead of
// throwing — never `.reduce`/`.length` on a value that might not be an array.
export function toolCount(tools: Tools | undefined): number {
  return TOOLS.reduce((n, k) => n + (tools?.[k] || 0), 0);
}

export function extraFillings(cfg: LineConfig): number {
  if (cfg.kind === "kit") return Math.max(0, (Array.isArray(cfg.fillings) ? cfg.fillings.length : 0) - INCLUDED_FILLINGS);
  // Party: each cake is its own kit-style filling list — one included, a
  // second on that specific cake is one extra.
  const cakes = Array.isArray(cfg.cakes) ? cfg.cakes : [];
  return cakes.reduce((n, c) => n + Math.max(0, (Array.isArray(c?.fillings) ? c.fillings.length : 0) - INCLUDED_FILLINGS), 0);
}

export function extraTools(cfg: LineConfig): number {
  const cakeCount = cfg.kind === "party" && Array.isArray(cfg.cakes) ? cfg.cakes.length : 0;
  const included = cfg.kind === "kit" ? includedToolsFor(cfg.productId) : includedToolsForParty(cakeCount);
  return Math.max(0, toolCount(cfg.tools) - included);
}

export function extraColours(cfg: LineConfig): number {
  if (cfg.kind === "kit") return Math.max(0, (Array.isArray(cfg.colours) ? cfg.colours.length : 0) - includedColoursFor(cfg.productId));
  const cakeCount = Array.isArray(cfg.cakes) ? cfg.cakes.length : 0;
  return Math.max(0, colourCount(cfg.colours) - includedColoursForParty(cakeCount));
}

// --- Price ----------------------------------------------------------------
/** Price of a single unit of this configuration (kronor). Cart quantity is
 *  applied separately. */
export function priceLineSek(cfg: LineConfig): number {
  if (!isConfigObject(cfg)) return 0;
  const extras = (extraFillings(cfg) + extraTools(cfg) + extraColours(cfg)) * EXTRA_ITEM_SEK;
  if (cfg.kind === "party") {
    const cakeCount = Array.isArray(cfg.cakes) ? cfg.cakes.length : 0;
    const cakes = Math.max(PARTY_MIN_CAKES, cakeCount);
    return PARTY_BASE_SEK + Math.max(0, cakes - PARTY_BASE_CAKES) * PARTY_PER_CAKE_SEK + extras;
  }
  const base = getProduct(cfg.productId)?.priceSek ?? 0;
  return base + extras;
}

export function leadDaysFor(cfg: LineConfig): number {
  return isConfigObject(cfg) && cfg.kind === "party" ? LEAD_DAYS_PARTY : LEAD_DAYS_KIT;
}

// --- Human-readable summary ----------------------------------------------
/** One-line summary for the review step, cart row and order email. */
export function describeLine(cfg: LineConfig, lang: Lang): string {
  if (!isConfigObject(cfg)) return "";
  const sep = " · ";
  // Label lookups fall back to the raw key (never `undefined[lang]`) so a
  // drifted/unknown code can't throw while building a human summary.
  const toolBits = TOOLS.filter((k) => (cfg.tools?.[k] ?? 0) > 0).map((k) => {
    const n = cfg.tools?.[k] ?? 0;
    const label = TOOL_LABELS[k]?.[lang] ?? k;
    return n > 1 ? `${n}× ${label}` : label;
  });
  const name = getProduct(cfg.productId)?.name[lang] ?? cfg.productId;

  if (cfg.kind === "party") {
    const cakes = Array.isArray(cfg.cakes) ? cfg.cakes : [];
    const vanillaCount = cakes.filter((c) => c?.flavour === "vanilla").length;
    const chocCount = cakes.length - vanillaCount;
    const split =
      lang === "sv"
        ? `${vanillaCount} vanilj / ${chocCount} choklad`
        : lang === "fa"
          ? `${vanillaCount} وانیل / ${chocCount} شکلات`
          : `${vanillaCount} vanilla / ${chocCount} chocolate`;
    const cakesWord = lang === "sv" ? "tårtor" : lang === "fa" ? "کیک" : "cakes";
    // Group cakes with an identical flavour+filling pick so the summary stays
    // compact while still reflecting each cake's own choice, not a guess.
    const groups = new Map<string, number>();
    for (const c of cakes) {
      const fills = Array.isArray(c?.fillings) ? c.fillings : [];
      const key = `${c?.flavour ?? "vanilla"}|${fills.map((f) => FILLING_LABELS[f]?.[lang] ?? f).join(", ")}`;
      groups.set(key, (groups.get(key) || 0) + 1);
    }
    const fillingBits = Array.from(groups.entries())
      .map(([key, n]) => {
        const [flavourKey, fillingLabel] = key.split("|");
        const flavourLabel = FLAVOUR_LABELS[flavourKey as Flavour]?.[lang] ?? flavourKey;
        return n > 1 ? `${n}× ${flavourLabel}: ${fillingLabel}` : `${flavourLabel}: ${fillingLabel}`;
      })
      .join(sep);
    const cc = cfg.colours ?? {};
    const colourBits = COLOURS.filter((c) => (cc[c.key] || 0) > 0).map((c) => {
      const n = cc[c.key] || 0;
      return n > 1 ? `${n}× ${c.label[lang]}` : c.label[lang];
    });
    return [`${name}: ${cakes.length} ${cakesWord}`, split, fillingBits, toolBits.join(", "), colourBits.join(", ")]
      .filter(Boolean)
      .join(sep);
  }

  const fillings = (Array.isArray(cfg.fillings) ? cfg.fillings : [])
    .map((f) => FILLING_LABELS[f]?.[lang] ?? f)
    .join(", ");
  // List chosen shades in palette order for a stable, readable summary.
  const chosenColours = Array.isArray(cfg.colours) ? cfg.colours : [];
  const colours = COLOURS.filter((c) => chosenColours.includes(c.key))
    .map((c) => c.label[lang])
    .join(", ");
  return [name, FLAVOUR_LABELS[cfg.flavour]?.[lang] ?? cfg.flavour, fillings, toolBits.join(", "), colours]
    .filter(Boolean)
    .join(sep);
}

/** Stable key for a configuration — two identical configs collapse to one cart
 *  line (and bump quantity) instead of stacking duplicates. */
export function configKey(cfg: LineConfig): string {
  if (!isConfigObject(cfg)) return "invalid";
  if (cfg.kind === "party") {
    const cakes = Array.isArray(cfg.cakes) ? cfg.cakes : [];
    return [
      "party",
      cfg.productId,
      cakes.map((c) => `${c?.flavour ?? ""}:${(Array.isArray(c?.fillings) ? c.fillings : []).slice().sort().join("+")}`).join(","),
      TOOLS.map((k) => `${k}:${cfg.tools?.[k] || 0}`).join(","),
      COLOURS.map((c) => `${c.key}:${cfg.colours?.[c.key] || 0}`).join(","),
    ].join("|");
  }
  return [
    "kit",
    cfg.productId,
    cfg.flavour,
    (Array.isArray(cfg.fillings) ? cfg.fillings : []).slice().sort().join("+"),
    TOOLS.map((k) => `${k}:${cfg.tools?.[k] || 0}`).join(","),
    `c:${(Array.isArray(cfg.colours) ? cfg.colours : []).slice().sort().join("+")}`,
  ].join("|");
}
