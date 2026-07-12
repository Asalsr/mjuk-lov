// DIY cake kits + corporate subscriptions — the products sold. Prices from the
// handbook (§ Kits / § Corporate).
export type Product = {
  id: string;
  name: { sv: string; en: string; fa: string };
  size: string; // e.g. "17 cm" — empty for subscriptions, which use `unit`
  unit?: { sv: string; en: string; fa: string }; // e.g. "12 portions/month" (subscriptions)
  description: { sv: string; en: string; fa: string };
  priceSek: number; // kronor — for the party pack this is the "from" base price
  recurring?: boolean; // subscription billed monthly
  popular?: boolean; // highlighted tier
  // Product family. "kit" (DIY) and "cake" (ready-made) both open the
  // step-by-step configurator, as does "party"; the difference is the flow —
  // a "cake" is baked and decorated by us, so it skips the tools/colours steps
  // (see the Configurator). Subscriptions are not configurable; "menu" is the
  // Cakes & Bakes line, sold by box size. Defaults to "kit" when omitted.
  kind?: "kit" | "cake" | "party" | "subscription" | "menu";
  configurable?: boolean; // routed through the "Make it yours" configurator
  leadDays?: number; // minimum days' notice (kit 3, party 7) — see lib/pricing
  // Menu line (Cakes & Bakes): box-size options and a seasonal flag.
  variants?: { id: string; label: { sv: string; en: string; fa: string }; priceSek: number }[];
  rotating?: boolean; // seasonal bake — contents follow the season
  // Product photos under /public (illustrative; see PhotoDisclaimer). One shows a
  // single framed photo; several become a slideshow. Filenames may contain spaces
  // and are SVG, so they render via a plain <img> (encodeURI'd), not next/image.
  images?: string[];
};

// Flat delivery fee in kronor (pickup is free).
export const DELIVERY_FEE_SEK = 79;

// The three sizes come in two formats that share the same cakes: DIY kits
// (KITS, below — the Mjuk Lov signature: you decorate) and ready-made cakes
// (CAKES — we bake and decorate). Names piccolo/medio/grande are proper names,
// never translated. DIY is priced above the ready-made base (see per-tier prices below).
//
// Display order on /kit and /butik: piccolo, medio, grande. `popular` marks the
// recommended tier — medio (the versatile middle) only.
export const KITS: Product[] = [
  {
    id: "kit-piccolo",
    size: "10 cm",
    priceSek: 390,
    kind: "kit",
    configurable: true,
    leadDays: 3,
    name: { sv: "DIY Piccolo", en: "DIY Piccolo", fa: "DIY Piccolo" },
    description: {
      sv: "En liten DIY-tårta för två till fyra. Vi bakar botten, du väljer smak och fyllning och dekorerar själv.",
      en: "A little DIY cake for two to four. We bake the base, you choose flavour and filling and decorate it yourself.",
      fa: "یک کیک کوچک DIY برای دو تا چهار نفر. ما پایه را می‌پزیم، شما طعم و پرکننده را انتخاب می‌کنید و خودتان تزیین می‌کنید.",
    },
  },
  {
    id: "kit-medio",
    size: "17 cm",
    priceSek: 590,
    popular: true,
    kind: "kit",
    configurable: true,
    leadDays: 3,
    name: { sv: "DIY Medio", en: "DIY Medio", fa: "DIY Medio" },
    description: {
      sv: "DIY-tårtan för sex till åtta. Vi bakar botten, du väljer smak och fyllning och gör dekoren till din.",
      en: "The DIY cake for six to eight. We bake the base, you choose flavour and filling and make the decoration your own.",
      fa: "کیک DIY برای شش تا هشت نفر. ما پایه را می‌پزیم، شما طعم و پرکننده را انتخاب می‌کنید و تزیین را به سبک خودتان انجام می‌دهید.",
    },
  },
  {
    id: "kit-grande",
    size: "25 cm",
    priceSek: 849,
    kind: "kit",
    configurable: true,
    leadDays: 3,
    name: { sv: "DIY Grande", en: "DIY Grande", fa: "DIY Grande" },
    description: {
      sv: "Den stora DIY-tårtan för sexton till tjugo. Extra höjd, extra allt, och verktygen för att dekorera hela sällskapets tårta.",
      en: "The big DIY cake for sixteen to twenty. Extra height, extra everything, and the tools to decorate a cake for the whole gathering.",
      fa: "کیک بزرگ DIY برای شانزده تا بیست نفر. ارتفاع بیشتر، همه‌چیز بیشتر، و ابزار لازم برای تزیین کیکِ کل جمع.",
    },
  },
];

// Ready-made cakes — the same three sizes, baked and decorated by us. Shorter
// flow (flavour + filling only; no tools, no colours) and a lower base price.
// Sold in the shop alongside the kits; the /kit page and home stay DIY-only.
export const CAKES: Product[] = [
  {
    id: "cake-piccolo",
    size: "10 cm",
    priceSek: 349,
    kind: "cake",
    configurable: true,
    leadDays: 3,
    name: { sv: "Piccolo", en: "Piccolo", fa: "Piccolo" },
    description: {
      sv: "En liten tårta för två till fyra, bakad och dekorerad av oss. Du väljer bara smak och fyllning.",
      en: "A little cake for two to four, baked and decorated by us. You just choose flavour and filling.",
      fa: "یک کیک کوچک برای دو تا چهار نفر، پخته و تزیین‌شده توسط ما. شما فقط طعم و پرکننده را انتخاب می‌کنید.",
    },
  },
  {
    id: "cake-medio",
    size: "17 cm",
    priceSek: 549,
    popular: true,
    kind: "cake",
    configurable: true,
    leadDays: 3,
    name: { sv: "Medio", en: "Medio", fa: "Medio" },
    description: {
      sv: "Tårtan för sex till åtta, bakad och dekorerad av oss. Välj smak och fyllning, resten fixar vi.",
      en: "The cake for six to eight, baked and decorated by us. Choose flavour and filling, we do the rest.",
      fa: "کیک برای شش تا هشت نفر، پخته و تزیین‌شده توسط ما. طعم و پرکننده را انتخاب کنید، بقیه‌اش با ما.",
    },
  },
  {
    id: "cake-grande",
    size: "25 cm",
    priceSek: 749,
    kind: "cake",
    configurable: true,
    leadDays: 3,
    name: { sv: "Grande", en: "Grande", fa: "Grande" },
    description: {
      sv: "Den stora tårtan för sexton till tjugo, bakad och dekorerad av oss. Välj smak och fyllning.",
      en: "The big cake for sixteen to twenty, baked and decorated by us. Choose flavour and filling.",
      fa: "کیک بزرگ برای شانزده تا بیست نفر، پخته و تزیین‌شده توسط ما. طعم و پرکننده را انتخاب کنید.",
    },
  },
];

// Party Pack — the same kit, multiplied: one little cake per guest, each
// decorated by them. `priceSek` is the "from" base (covers two cakes); the
// configurator adds per-cake and any extras. See lib/pricing for the maths.
export const PARTY: Product[] = [
  {
    id: "party-pack",
    size: "",
    priceSek: 390,
    kind: "party",
    configurable: true,
    leadDays: 7,
    name: { sv: "Festpaket", en: "Party Pack", fa: "بسته جشن" },
    unit: { sv: "från 2 tårtor", en: "from 2 cakes", fa: "از ۲ کیک" },
    description: {
      sv: "En liten tårta per gäst, var och en dekorerad av dem. Dekorerandet är festen.",
      en: "One little cake per guest, each decorated by them. The decorating is the party.",
      fa: "یک کیک کوچک برای هر مهمان، هرکدام تزیین‌شده به دست خودشان. تزیین کردن، خودِ جشن است.",
    },
  },
];

// Corporate subscriptions — billed monthly, invoiced. Prices from the handbook
// (§ Corporate). Delivered within Gothenburg.
export const SUBSCRIPTIONS: Product[] = [
  {
    id: "sub-small",
    size: "",
    priceSek: 890,
    recurring: true,
    name: { sv: "Liten", en: "Small", fa: "کوچک" },
    unit: { sv: "12 portioner/månad", en: "12 portions/month", fa: "۱۲ پرس در ماه" },
    description: {
      sv: "Fredagsfika för teamet. Varje vecka.",
      en: "Friday fika for the team. Every week.",
      fa: "فیکای جمعه برای تیم. هر هفته.",
    },
  },
  {
    id: "sub-medium",
    size: "",
    priceSek: 1590,
    recurring: true,
    popular: true,
    name: { sv: "Medium", en: "Medium", fa: "متوسط" },
    unit: { sv: "24 portioner/månad", en: "24 portions/month", fa: "۲۴ پرس در ماه" },
    description: {
      sv: "Veckomöten, kundbesök, spontana fikapauser.",
      en: "Weekly meetings, client visits, spontaneous breaks.",
      fa: "جلسه‌های هفتگی، دیدار با مشتری، استراحت‌های فی‌البداهه.",
    },
  },
  {
    id: "sub-large",
    size: "",
    priceSek: 2390,
    recurring: true,
    name: { sv: "Stor", en: "Large", fa: "بزرگ" },
    unit: { sv: "40 portioner/månad", en: "40 portions/month", fa: "۴۰ پرس در ماه" },
    description: {
      sv: "För kontoret som tar fika på allvar.",
      en: "For the office that takes fika seriously.",
      fa: "برای دفتری که فیکا را جدی می‌گیرد.",
    },
  },
];

// Cakes & Bakes — a small menu line alongside the kits, sold by box size.
// Made to order; not configurable (no decorating). Each variant is a fixed box.
//
// Sizes are a FIXED vocabulary tied to the pans/jars we actually own, and every
// variant label carries its serving count (customers buy by servings, not cm —
// see house rule §2b): tray 18×28 = 9 pieces, 30×28 = 15 pieces; a round 17 cm
// cut into 8 is the reference slice, so a 25 cm ≈ 17 by equal area; jars sold six
// to a box. Brand names (Blusmisu, Lemomisu) are never translated. Photos live in
// /public/gallery and are illustrative — the shop renders one PhotoDisclaimer
// beneath the grid (§2a), not per card.
export const MENU: Product[] = [
  {
    id: "menu-blusmisu",
    size: "",
    priceSek: 294,
    kind: "menu",
    leadDays: 2,
    images: ["/gallery/blue berry tiramisu - blumisu (1).svg"],
    name: { sv: "Blusmisu", en: "Blusmisu", fa: "Blusmisu" },
    description: {
      sv: "Blåbärstiramisu på burk. Säljs i ask om sex.",
      en: "Blueberry tiramisu in a jar. Sold by the box of six.",
      fa: "تیرامیسوی بلوبری در شیشه. در جعبه‌های شش‌تایی.",
    },
    variants: [
      { id: "box6", priceSek: 294, label: { sv: "Ask om 6 burkar", en: "Box of 6 jars", fa: "جعبه ۶ تایی" } },
    ],
  },
  {
    id: "menu-lemomisu",
    size: "",
    priceSek: 294,
    kind: "menu",
    leadDays: 2,
    images: ["/gallery/lemon tiramisu - lemomisu (1).svg", "/gallery/lemon tiramisu - lemomisu (2).svg"],
    name: { sv: "Lemomisu", en: "Lemomisu", fa: "Lemomisu" },
    description: {
      sv: "Citrontiramisu på burk. Säljs i ask om sex.",
      en: "Lemon tiramisu in a jar. Sold by the box of six.",
      fa: "تیرامیسوی لیمو در شیشه. در جعبه‌های شش‌تایی.",
    },
    variants: [
      { id: "box6", priceSek: 294, label: { sv: "Ask om 6 burkar", en: "Box of 6 jars", fa: "جعبه ۶ تایی" } },
    ],
  },
  {
    id: "menu-lemon",
    size: "",
    priceSek: 399,
    kind: "menu",
    leadDays: 2,
    images: ["/gallery/lemon cake (3).svg", "/gallery/lemon cake (2).svg"],
    name: { sv: "Citronkaka", en: "Lemon cake", fa: "کیک لیمو" },
    description: {
      sv: "Saftig citronkaka, toppad med blåbär och citron. Säljs hel.",
      en: "Moist lemon cake, finished with blueberry and lemon. Sold whole.",
      fa: "کیک لطیف لیمو با تزیین بلوبری و لیمو. به‌صورت کامل.",
    },
    variants: [
      { id: "box9", priceSek: 399, label: { sv: "Hel kaka · 18×28 cm · 9 bitar", en: "Whole cake · 18×28 cm · serves 9", fa: "کیک کامل · ۱۸×۲۸ سانتی‌متر · ۹ برش" } },
      { id: "box15", priceSek: 499, label: { sv: "Hel kaka · 30×28 cm · 15 bitar", en: "Whole cake · 30×28 cm · serves 15", fa: "کیک کامل · ۳۰×۲۸ سانتی‌متر · ۱۵ برش" } },
    ],
  },
  {
    id: "menu-brownie",
    size: "",
    priceSek: 499,
    kind: "menu",
    leadDays: 2,
    images: ["/gallery/brownies (2).svg", "/gallery/brownies cut.svg"],
    name: { sv: "Brownie", en: "Brownie", fa: "براونی" },
    description: {
      sv: "Seg, mörk brownie, toppad med grädde och chokladbitar. Säljs hel.",
      en: "Dense, dark brownie, finished with cream and chocolate pieces. Sold whole.",
      fa: "براونی نرم و تیره با تزیین خامه و تکه‌های شکلات. به‌صورت کامل.",
    },
    variants: [
      { id: "box9", priceSek: 499, label: { sv: "Hel kaka · 18×28 cm · 9 bitar", en: "Whole cake · 18×28 cm · serves 9", fa: "کیک کامل · ۱۸×۲۸ سانتی‌متر · ۹ برش" } },
      { id: "box15", priceSek: 599, label: { sv: "Hel kaka · 30×28 cm · 15 bitar", en: "Whole cake · 30×28 cm · serves 15", fa: "کیک کامل · ۳۰×۲۸ سانتی‌متر · ۱۵ برش" } },
    ],
  },
  {
    id: "menu-lotus",
    size: "",
    priceSek: 449,
    kind: "menu",
    leadDays: 2,
    images: ["/gallery/lotus cake (1).svg", "/gallery/lotus cake (2) (1).svg"],
    name: { sv: "Lotustårta", en: "Lotus cake", fa: "کیک لوتوس" },
    description: {
      sv: "Lotustårta, hel. Välj 17 cm eller 25 cm.",
      en: "Lotus cake, whole. Choose 17 cm or 25 cm.",
      fa: "کیک لوتوس، کامل. ۱۷ یا ۲۵ سانتی‌متر.",
    },
    variants: [
      { id: "box8", priceSek: 449, label: { sv: "Hel tårta · 17 cm · 8 bitar", en: "Whole cake · 17 cm · 8 slices", fa: "کیک کامل · ۱۷ سانتی‌متر · ۸ برش" } },
      { id: "box17", priceSek: 549, label: { sv: "Hel tårta · 25 cm · 17 bitar", en: "Whole cake · 25 cm · 17 slices", fa: "کیک کامل · ۲۵ سانتی‌متر · ۱۷ برش" } },
    ],
  },
  {
    id: "menu-chocolate",
    size: "",
    priceSek: 449,
    kind: "menu",
    leadDays: 2,
    images: ["/gallery/chocolate cake (1).svg", "/gallery/chocolate cake (2) (1).svg"],
    name: { sv: "Chokladtårta", en: "Chocolate cake", fa: "کیک شکلاتی" },
    description: {
      sv: "Chokladtårta, hel. Välj 17 cm eller 25 cm.",
      en: "Chocolate cake, whole. Choose 17 cm or 25 cm.",
      fa: "کیک شکلاتی، کامل. ۱۷ یا ۲۵ سانتی‌متر.",
    },
    variants: [
      { id: "box8", priceSek: 449, label: { sv: "Hel tårta · 17 cm · 8 bitar", en: "Whole cake · 17 cm · 8 slices", fa: "کیک کامل · ۱۷ سانتی‌متر · ۸ برش" } },
      { id: "box17", priceSek: 549, label: { sv: "Hel tårta · 25 cm · 17 bitar", en: "Whole cake · 25 cm · 17 slices", fa: "کیک کامل · ۲۵ سانتی‌متر · ۱۷ برش" } },
    ],
  },
];

// Each menu variant as its own orderable product (id `<menu>-<variant>`), so a
// chosen box adds to the cart and prices/labels resolve through getProduct just
// like any other line — no change to the cart/order pipeline.
export const MENU_VARIANT_PRODUCTS: Product[] = MENU.flatMap((m) =>
  (m.variants ?? []).map((v) => ({
    id: `${m.id}-${v.id}`,
    size: "",
    priceSek: v.priceSek,
    kind: "menu" as const,
    leadDays: m.leadDays,
    name: {
      sv: `${m.name.sv} · ${v.label.sv}`,
      en: `${m.name.en} · ${v.label.en}`,
      fa: `${m.name.fa} · ${v.label.fa}`,
    },
    description: m.description,
  })),
);

// Everything orderable, in one list.
export const PRODUCTS: Product[] = [...KITS, ...CAKES, ...PARTY, ...MENU, ...MENU_VARIANT_PRODUCTS, ...SUBSCRIPTIONS];

export const PARTY_PACK = PARTY[0];

export function getProduct(id: string): Product | null {
  return PRODUCTS.find((p) => p.id === id) ?? null;
}
