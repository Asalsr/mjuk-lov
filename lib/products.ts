// DIY cake kits, party packs, baked-goods menu, and corporate subscriptions —
// the products sold. Kit/party prices are SEK and VAT-inclusive (12 % livsmedels-
// moms sits inside the price). Pricing maths + lead-time rules live in
// `lib/pricing.ts` (the single source of truth shared by UI + the order route).
export type Product = {
  id: string;
  name: { sv: string; en: string; fa: string };
  size: string; // e.g. "15 cm" — empty for subscriptions, which use `unit`
  unit?: { sv: string; en: string; fa: string }; // e.g. "12 portions/month" (subscriptions)
  description: { sv: string; en: string; fa: string };
  priceSek: number; // kronor — for configurable kits this is the base
  recurring?: boolean; // subscription billed monthly
  popular?: boolean; // highlighted tier
  kind?: "kit" | "subscription" | "party" | "menu";
  configurable?: boolean; // kits with flavour/fillings/tools picker
  included?: { colours: number; tools: number }; // configurable kits only
  comingSoon?: boolean; // hide price + disable CTA, keep card visible
  leadDays?: number; // minimum lead time in days
  variants?: { id: string; label: { sv: string; en: string; fa: string }; priceSek: number }[];
  rotating?: boolean; // seasonal slot — content changes through the year
};

// Flat delivery fee in kronor (pickup is free).
export const DELIVERY_FEE_SEK = 79;

export const KITS: Product[] = [
  {
    id: "kit-standard",
    size: "15 cm",
    priceSek: 345,
    kind: "kit",
    configurable: true,
    leadDays: 3,
    included: { colours: 3, tools: 2 },
    name: { sv: "Standard", en: "Standard", fa: "استاندارد" },
    description: {
      sv: "Vit, klar att dekorera. Du väljer smak, fyllning och verktyg — vi sköter resten.",
      en: "White, ready to decorate. You pick the flavour, fillings and tools — we handle the rest.",
      fa: "سفید و آماده تزیین. شما طعم، پرکننده و ابزار را انتخاب می‌کنید — بقیه با ماست.",
    },
  },
  {
    id: "kit-deluxe",
    size: "20 cm",
    priceSek: 445,
    kind: "kit",
    configurable: true,
    leadDays: 3,
    included: { colours: 3, tools: 3 },
    name: { sv: "Deluxe", en: "Deluxe", fa: "دلوکس" },
    description: {
      sv: "Större tårta, fler verktyg — för dig som vill leka lite längre.",
      en: "Bigger cake, more tools — for when you'd like to play a little longer.",
      fa: "کیک بزرگ‌تر، ابزار بیشتر — برای وقتی که می‌خواهید کمی بیشتر سرگرم شوید.",
    },
  },
  {
    id: "kit-gift",
    size: "15 cm",
    priceSek: 395,
    kind: "kit",
    configurable: true,
    leadDays: 3,
    included: { colours: 3, tools: 2 },
    name: { sv: "Presentupplaga", en: "Gift Edition", fa: "نسخه هدیه" },
    description: {
      sv: "Samma tårta som Standard — i en vacker presentask med en hälsning.",
      en: "The same cake as Standard — in a beautiful gift box with a dedication.",
      fa: "همان کیک استاندارد — در جعبه‌ای زیبا همراه با یک پیام.",
    },
  },
];

// Corporate subscriptions — billed monthly, invoiced. We're rethinking the model;
// keep the tiers visible but hidden behind `comingSoon` until the new offer ships.
export const SUBSCRIPTIONS: Product[] = [
  {
    id: "sub-small",
    size: "",
    priceSek: 890,
    recurring: true,
    kind: "subscription",
    comingSoon: true,
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
    kind: "subscription",
    comingSoon: true,
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
    kind: "subscription",
    comingSoon: true,
    name: { sv: "Stor", en: "Large", fa: "بزرگ" },
    unit: { sv: "40 portioner/månad", en: "40 portions/month", fa: "۴۰ پرس در ماه" },
    description: {
      sv: "För kontoret som tar fika på allvar.",
      en: "For the office that takes fika seriously.",
      fa: "برای دفتری که فیکا را جدی می‌گیرد.",
    },
  },
];

// Party line — each guest decorates their own mini cake. Sold with a cake-count
// configurator; base covers 2 cakes, each additional cake adds a per-cake charge.
// 11+ cakes routes to "contact us" (see PARTY_MAX_SELF_SERVE in lib/pricing.ts).
export const PARTY: Product[] = [
  {
    id: "party-pack",
    size: "",
    priceSek: 390,
    kind: "party",
    leadDays: 7,
    name: { sv: "Festpaket", en: "Party Pack", fa: "بسته جشن" },
    description: {
      sv: "En liten tårta per gäst, att dekorera tillsammans. Inte bara efterrätt — en stund att skapa något ihop.",
      en: "One little cake per guest, to decorate together. Not just dessert — an hour of making something with people you love.",
      fa: "یک کیک کوچک برای هر مهمان، تا با هم تزیینش کنید. فقط دسر نیست — ساعتی برای ساختن چیزی در کنار هم.",
    },
  },
];

// NOTE(asal): menu items are corporate-reusable — qty + lead tiers + the
// standard pickup/delivery fields let a future bulk path reuse them as-is.
// NOTE(asal): menu prices are estimates pending real COGS — adjust before launch.
export const MENU: Product[] = [
  {
    id: "menu-brownie",
    size: "",
    priceSek: 120,
    kind: "menu",
    leadDays: 2,
    name: { sv: "Brownie", en: "Brownie", fa: "براونی" },
    description: {
      sv: "Sega, mörka brownies. Sälj per ask.",
      en: "Dense, dark brownies. Sold by the box.",
      fa: "براونی‌های نرم و تیره. در جعبه ارائه می‌شود.",
    },
    variants: [
      { id: "box4", priceSek: 120, label: { sv: "Ask om 4", en: "Box of 4", fa: "جعبه ۴ تایی" } },
      { id: "box9", priceSek: 230, label: { sv: "Ask om 9", en: "Box of 9", fa: "جعبه ۹ تایی" } },
    ],
  },
  {
    id: "menu-lemon",
    size: "",
    priceSek: 200,
    kind: "menu",
    leadDays: 2,
    name: { sv: "Citronkaka", en: "Lemon cake", fa: "کیک لیمو" },
    description: {
      sv: "Klassisk, fuktig citronkaka — färsk citronzest och en mild glasyr.",
      en: "Classic moist lemon cake — fresh zest and a soft glaze.",
      fa: "کیک کلاسیک و لطیف لیمو — پوست تازه لیمو و یک لعاب ملایم.",
    },
    variants: [
      { id: "loaf", priceSek: 200, label: { sv: "Hel limpa", en: "Whole loaf", fa: "یک قالب کامل" } },
    ],
  },
  {
    id: "menu-cookie",
    size: "",
    priceSek: 100,
    kind: "menu",
    leadDays: 2,
    name: { sv: "Kakor", en: "Cookies", fa: "کوکی" },
    description: {
      sv: "Frasiga utanpå, sega inuti. Bakas dagen innan.",
      en: "Crisp outside, chewy inside. Baked the day before.",
      fa: "بیرون ترد، داخل نرم. روز قبل پخته می‌شوند.",
    },
    variants: [
      { id: "pack6", priceSek: 100, label: { sv: "6-pack", en: "Pack of 6", fa: "بسته ۶ تایی" } },
      { id: "pack12", priceSek: 180, label: { sv: "12-pack", en: "Pack of 12", fa: "بسته ۱۲ تایی" } },
    ],
  },
  {
    id: "menu-seasonal",
    size: "",
    priceSek: 120,
    kind: "menu",
    leadDays: 2,
    rotating: true,
    name: { sv: "Säsongens bakverk", en: "Seasonal bake", fa: "شیرینی فصلی" },
    description: {
      sv: "Det vi bakar just nu. Innehållet följer säsongen.",
      en: "Whatever we're baking right now. The bake follows the season.",
      fa: "آنچه همین حالا می‌پزیم. محتوا با فصل تغییر می‌کند.",
    },
    variants: [
      { id: "box4", priceSek: 120, label: { sv: "Ask om 4", en: "Box of 4", fa: "جعبه ۴ تایی" } },
      { id: "box9", priceSek: 230, label: { sv: "Ask om 9", en: "Box of 9", fa: "جعبه ۹ تایی" } },
    ],
  },
];

// Everything orderable, in one list.
export const PRODUCTS: Product[] = [...KITS, ...SUBSCRIPTIONS, ...PARTY, ...MENU];

export function getProduct(id: string): Product | null {
  return PRODUCTS.find((p) => p.id === id) ?? null;
}
