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

// The gel colours actually in stock, in the supplier's own family order
// (yellows, reds, pinks, purples, blues, greens, neutrals) so the grid reads
// top to bottom. "natural" is the odd one out and deliberately last: it is
// undyed buttercream, i.e. the choice to add no colour at all.
//
// The swatch hex is decorative ONLY. It is a rough sample of the mixed shade,
// never a colour-match, and the name is always shown alongside it
// (accessibility: the fill never carries meaning on its own). See
// colourBatchNote in lib/i18n.ts for what the customer is told about this.
export const COLOURS = [
  { key: "lemon-yellow", hex: "#F5DE3B", label: { sv: "Citrongul", en: "Lemon yellow", fa: "زرد لیمویی" } },
  { key: "orange", hex: "#F28E1C", label: { sv: "Orange", en: "Orange", fa: "نارنجی" } },
  { key: "dark-yellow", hex: "#E8B00C", label: { sv: "Mörkgul", en: "Dark yellow", fa: "زرد پررنگ" } },
  { key: "orange-red", hex: "#E9541F", label: { sv: "Orangeröd", en: "Orange red", fa: "نارنجی قرمز" } },
  { key: "red", hex: "#D4232B", label: { sv: "Röd", en: "Red", fa: "قرمز" } },
  { key: "dark-red", hex: "#8C1A23", label: { sv: "Mörkröd", en: "Dark red", fa: "قرمز تیره" } },
  { key: "cherry-red", hex: "#AE1E3C", label: { sv: "Körsbärsröd", en: "Cherry red", fa: "قرمز گیلاسی" } },
  { key: "pink", hex: "#EE6AA9", label: { sv: "Rosa", en: "Pink", fa: "صورتی" } },
  { key: "rose", hex: "#DE3781", label: { sv: "Rosé", en: "Rose", fa: "رز" } },
  { key: "fuchsia", hex: "#C0286D", label: { sv: "Fuchsia", en: "Fuchsia", fa: "سرخابی" } },
  { key: "taro-purple", hex: "#8B5AA4", label: { sv: "Tarolila", en: "Taro purple", fa: "بنفش تارو" } },
  { key: "grape-purple", hex: "#5A2C8C", label: { sv: "Druvlila", en: "Grape purple", fa: "بنفش انگوری" } },
  { key: "sky-blue", hex: "#3CA6DE", label: { sv: "Himmelsblå", en: "Sky blue", fa: "آبی آسمانی" } },
  { key: "blue-green", hex: "#1A8C88", label: { sv: "Blågrön", en: "Blue green", fa: "آبی سبز" } },
  { key: "light-green", hex: "#5CC43A", label: { sv: "Ljusgrön", en: "Light green", fa: "سبز روشن" } },
  { key: "grass-green", hex: "#7CB92E", label: { sv: "Gräsgrön", en: "Grass green", fa: "سبز چمنی" } },
  { key: "navy-blue", hex: "#1E2C6B", label: { sv: "Marinblå", en: "Navy blue", fa: "آبی سرمه‌ای" } },
  { key: "green", hex: "#1D9949", label: { sv: "Grön", en: "Green", fa: "سبز" } },
  { key: "dark-green", hex: "#0F4E2B", label: { sv: "Mörkgrön", en: "Dark green", fa: "سبز تیره" } },
  { key: "black", hex: "#1A1A1A", label: { sv: "Svart", en: "Black", fa: "مشکی" } },
  { key: "brown", hex: "#6B4A39", label: { sv: "Brun", en: "Brown", fa: "قهوه‌ای" } },
  { key: "coffee", hex: "#482D21", label: { sv: "Kaffebrun", en: "Coffee", fa: "قهوه‌ای تیره" } },
  { key: "natural", hex: "#F3ECE0", label: { sv: "Naturvit", en: "Natural", fa: "طبیعی" } },
] as const;
export type ColourKey = (typeof COLOURS)[number]["key"];

/** Shades from the earlier curated palette, mapped to their nearest stocked
 *  gel. A saved cart (localStorage or the `carts` JSONB column) outlives the
 *  palette that wrote it, so without this a customer's chosen colours would be
 *  silently dropped on their next visit and the line would re-price. Two old
 *  keys can land on one stocked shade, so counts are summed, never overwritten
 *  (see asColourCounts). */
const LEGACY_COLOUR_ALIASES: Record<string, ColourKey> = {
  blush: "pink",
  sky: "sky-blue",
  sage: "light-green",
  butter: "lemon-yellow",
  terracotta: "orange-red",
  lilac: "taro-purple",
  cocoa: "brown",
};
/** Party colours are counted per shade (pots), like tools — a party of N guests
 *  gets INCLUDED_COLOURS pots per cake. Kits, by contrast, pick a distinct set. */
export type ColourCounts = Partial<Record<ColourKey, number>>;

// --- Config shapes --------------------------------------------------------
// NOTHING is pre-selected anywhere in a configuration. `null` / an empty list
// means "the customer has not chosen yet", and the configurator refuses to
// advance past the step that owns that choice (see isStepChosen below). A
// pre-ticked option reads as a decision already made, which is how people end
// up ordering a sponge or filling they never picked.
export type KitConfig = {
  kind: "kit";
  // DIY kits (kit-piccolo | kit-medio | kit-grande) or ready-made cakes
  // (cake-piccolo | cake-medio | cake-grande). Both use this shape; a ready-made
  // cake simply carries no tools and no colours (see defaultKitConfig).
  productId: string;
  flavour: Flavour | null; // null = not chosen yet
  fillings: Filling[]; // 0–2; empty = not chosen yet
  tools: Tools; // counts per tool
  colours: ColourKey[]; // chosen shades; INCLUDED_COLOURS free, extras +EXTRA_ITEM_SEK each
};

// One physical cake in a Party Pack — its own flavour and fillings, same rule
// as a kit (1–2 fillings, one always included). Pooling these by sponge type
// used to make "two vanilla cakes, two different fillings" indistinguishable
// from "one vanilla cake with both fillings" in the UI; tracking each cake
// individually removes that ambiguity entirely.
export type PartyCakeConfig = {
  flavour: Flavour | null; // null = not chosen yet
  fillings: Filling[]; // 0–2; empty = not chosen yet
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

/** A fully-allotted party tool set: one piping bag and one brush per guest
 *  (= INCLUDED_TOOLS_DEFAULT per cake), so it never costs extra. NOT a default
 *  the configurator applies — see defaultPartyColours. */
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

/** A fully-allotted party palette: one pot each of the first three stocked
 *  shades per guest (= INCLUDED_COLOURS per cake), so it never costs extra.
 *  NOT a default the configurator applies — nothing is pre-selected there.
 *  Kept for tests and any caller that wants a "spend the whole allowance"
 *  starting point. */
export function defaultPartyColours(cakes: number): ColourCounts {
  const n = Math.max(0, cakes);
  return { [COLOURS[0].key]: n, [COLOURS[1].key]: n, [COLOURS[2].key]: n };
}

/** A blank configuration: NOTHING pre-selected. Not the sponge flavour, not the
 *  filling, not the colours, not the tools — every one of those is a decision
 *  the customer makes in the configurator, and a pre-ticked option is
 *  indistinguishable from one they chose. The flow gates each step on
 *  isStepChosen instead, so an unmade choice stops the customer with a message
 *  rather than shipping our guess. */
export function defaultKitConfig(productId: string): KitConfig {
  return {
    kind: "kit",
    productId,
    flavour: null,
    fillings: [],
    tools: { piping: 0, brush: 0, knife: 0 },
    colours: [],
  };
}

/** One blank cake — mirrors defaultKitConfig, so a Party Pack's per-cake
 *  starting point matches a standalone kit's: nothing chosen. */
export function blankPartyCake(): PartyCakeConfig {
  return { flavour: null, fillings: [] };
}

export function defaultPartyConfig(productId = "party-pack"): PartyConfig {
  const n = PARTY_MIN_CAKES; // configurator always opens at the minimum order
  return {
    kind: "party",
    productId,
    cakes: Array.from({ length: n }, blankPartyCake),
    // defaultPartyTools/defaultPartyColours still exist for tests and any
    // caller that wants a "fully allotted" starting point.
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

/** A known flavour, or null for "not chosen". Anything unrecognised becomes
 *  null rather than a default — normalization must never invent a choice the
 *  customer didn't make (that is exactly the pre-selection this flow removed). */
function asFlavour(v: unknown): Flavour | null {
  return typeof v === "string" && FLAVOUR_SET.has(v) ? (v as Flavour) : null;
}
/** A valid 0–2 filling list; drops unknown/duplicate codes. An empty result is
 *  legitimate — it means "not chosen yet", not "broken". */
function asFillings(v: unknown): Filling[] {
  const arr = Array.isArray(v) ? v.filter((f): f is Filling => typeof f === "string" && FILLING_SET.has(f)) : [];
  return Array.from(new Set(arr)).slice(0, 2);
}
function asToolCount(n: unknown): number {
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}
function asTools(v: unknown): Tools {
  const t = (v ?? {}) as Partial<Record<ToolKey, unknown>>;
  return { piping: asToolCount(t.piping), brush: asToolCount(t.brush), knife: asToolCount(t.knife) };
}
/** A stocked shade for this key, following a legacy alias if that's what the
 *  saved line carries. Unknown keys yield null and are dropped. */
function asColourKey(v: unknown): ColourKey | null {
  if (typeof v !== "string") return null;
  if (COLOUR_SET.has(v)) return v as ColourKey;
  return LEGACY_COLOUR_ALIASES[v] ?? null;
}
function asColourCounts(v: unknown): ColourCounts {
  const src = (v ?? {}) as Record<string, unknown>;
  const out: ColourCounts = {};
  // Summed, not assigned: two legacy keys can alias onto one stocked shade, and
  // dropping either would quietly reduce the pot count the customer paid for.
  for (const raw of Object.keys(src)) {
    const key = asColourKey(raw);
    const n = asToolCount(src[raw]);
    if (key && n > 0) out[key] = (out[key] || 0) + n;
  }
  return out;
}
function asColourKeys(v: unknown): ColourKey[] {
  const arr = Array.isArray(v) ? v.map(asColourKey).filter((k): k is ColourKey => k !== null) : [];
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
  // FILLINGS order — a plausible split, not the literal original. This path is
  // reconstruction of an ALREADY-COMMITTED legacy line (the pooled shape the
  // configurator stopped writing long ago), so the "berries" backfill below
  // stays: it keeps an old saved cart rendering as it always did. Nothing the
  // configurator produces today reaches here, so it can't re-introduce a
  // pre-selected filling in the live flow.
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

// --- Required choices -----------------------------------------------------
/** The configurator steps that own a choice the customer MUST make. "cakes"
 *  (a count that always starts at the minimum) and "review" are not here —
 *  they carry no unmade decision. "flavour" and "sponge" ask the same
 *  question, on a kit and on a party respectively. */
export const CHOICE_STEPS = ["flavour", "sponge", "filling", "colour", "tools"] as const;
export type ChoiceStep = (typeof CHOICE_STEPS)[number];

/** How many colour pots this configuration must actually carry, and how many
 *  tools. This is the allowance ALREADY IN THE PRICE, so it is a floor, not a
 *  suggestion: a Party Pack allots a decorating set per guest, and ordering
 *  four tools for a party of four leaves half the guests with nothing while
 *  the customer still pays for the full eight. Extras above this are the paid
 *  ones (see extraColours/extraTools). */
export function requiredColours(cfg: LineConfig): number {
  if (!isConfigObject(cfg)) return 0;
  if (cfg.kind === "kit") return includedColoursFor(cfg.productId);
  return includedColoursForParty(Array.isArray(cfg.cakes) ? cfg.cakes.length : 0);
}
export function requiredTools(cfg: LineConfig): number {
  if (!isConfigObject(cfg)) return 0;
  if (cfg.kind === "kit") return includedToolsFor(cfg.productId);
  return includedToolsForParty(Array.isArray(cfg.cakes) ? cfg.cakes.length : 0);
}

/** What the customer has picked for a countable step, for comparison against
 *  the floor above. Kits pick distinct shades; parties count pots per shade. */
export function chosenColours(cfg: LineConfig): number {
  if (!isConfigObject(cfg)) return 0;
  if (cfg.kind === "kit") return Array.isArray(cfg.colours) ? cfg.colours.length : 0;
  return colourCount(cfg.colours);
}

/** Has the customer actually made the choice this step owns? Nothing is
 *  pre-selected (see defaultKitConfig), so this is what stands between an
 *  unmade decision and a cart line: the configurator refuses to advance and
 *  shows the step's message instead of quietly carrying a default forward.
 *  Party sponge/filling need the choice on EVERY cake, not just one, and
 *  colours/tools need the whole included allowance, not merely one of each. */
export function isStepChosen(cfg: LineConfig, step: ChoiceStep): boolean {
  if (!isConfigObject(cfg)) return false;
  const cakes = cfg.kind === "party" && Array.isArray(cfg.cakes) ? cfg.cakes : [];
  const everyCake = (ok: (c: PartyCakeConfig) => boolean) => cakes.length > 0 && cakes.every((c) => ok(c ?? blankPartyCake()));
  const listLen = (v: unknown) => (Array.isArray(v) ? v.length : 0);

  switch (step) {
    case "flavour":
    case "sponge":
      return cfg.kind === "kit" ? !!cfg.flavour : everyCake((c) => !!c.flavour);
    case "filling":
      return cfg.kind === "kit" ? listLen(cfg.fillings) > 0 : everyCake((c) => listLen(c.fillings) > 0);
    // Math.max(1, ...) so a malformed config can never satisfy the gate by
    // having a floor of zero: a party whose `cakes` didn't survive
    // deserialization allots nothing per guest, and 0 >= 0 would wave it
    // through with no colours and no tools at all.
    case "colour":
      return chosenColours(cfg) >= Math.max(1, requiredColours(cfg));
    case "tools":
      return toolCount(cfg.tools) >= Math.max(1, requiredTools(cfg));
  }
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
    // Counted, not derived by subtraction: a cake whose sponge is still
    // unchosen is neither, and must not be tallied as chocolate.
    const chocCount = cakes.filter((c) => c?.flavour === "chocolate").length;
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
      const key = `${c?.flavour ?? ""}|${fills.map((f) => FILLING_LABELS[f]?.[lang] ?? f).join(", ")}`;
      groups.set(key, (groups.get(key) || 0) + 1);
    }
    const fillingBits = Array.from(groups.entries())
      .map(([key, n]) => {
        const [flavourKey, fillingLabel] = key.split("|");
        const flavourLabel = FLAVOUR_LABELS[flavourKey as Flavour]?.[lang] ?? flavourKey;
        const bits = [flavourLabel, fillingLabel].filter(Boolean).join(": ");
        return n > 1 ? `${n}× ${bits}` : bits;
      })
      .filter(Boolean)
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
  // An unchosen flavour contributes nothing rather than a stand-in name.
  const flavour = cfg.flavour ? (FLAVOUR_LABELS[cfg.flavour]?.[lang] ?? cfg.flavour) : "";
  return [name, flavour, fillings, toolBits.join(", "), colours].filter(Boolean).join(sep);
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
      cakes
        .map((c) => `${c?.flavour ?? ""}:${(Array.isArray(c?.fillings) ? c.fillings : []).slice().sort().join("+")}`)
        .join(","),
      TOOLS.map((k) => `${k}:${cfg.tools?.[k] || 0}`).join(","),
      COLOURS.map((c) => `${c.key}:${cfg.colours?.[c.key] || 0}`).join(","),
    ].join("|");
  }
  return [
    "kit",
    cfg.productId,
    cfg.flavour ?? "",
    (Array.isArray(cfg.fillings) ? cfg.fillings : []).slice().sort().join("+"),
    TOOLS.map((k) => `${k}:${cfg.tools?.[k] || 0}`).join(","),
    `c:${(Array.isArray(cfg.colours) ? cfg.colours : []).slice().sort().join("+")}`,
  ].join("|");
}
