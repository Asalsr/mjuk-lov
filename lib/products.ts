// DIY cake kits + corporate subscriptions — the products sold. Prices from the
// handbook (§ Kits / § Corporate).
export type Product = {
  id: string;
  name: { sv: string; en: string; fa: string };
  size: string; // e.g. "15 cm" — empty for subscriptions, which use `unit`
  unit?: { sv: string; en: string; fa: string }; // e.g. "12 portions/month" (subscriptions)
  description: { sv: string; en: string; fa: string };
  priceSek: number; // kronor — for the party pack this is the "from" base price
  recurring?: boolean; // subscription billed monthly
  popular?: boolean; // highlighted tier
  // Product family. "kit" and "party" open the step-by-step configurator;
  // subscriptions are not configurable; "menu" is the Cakes & Bakes line, sold
  // by box size. Defaults to "kit" when omitted.
  kind?: "kit" | "party" | "subscription" | "menu";
  configurable?: boolean; // routed through the "Make it yours" configurator
  leadDays?: number; // minimum days' notice (kit 3, party 7) — see lib/pricing
  // Menu line (Cakes & Bakes): box-size options and a seasonal flag.
  variants?: { id: string; label: { sv: string; en: string; fa: string }; priceSek: number }[];
  rotating?: boolean; // seasonal bake — contents follow the season
};

// Flat delivery fee in kronor (pickup is free).
export const DELIVERY_FEE_SEK = 79;

// Order here is the display order on /kit and /butik: Standard first (the
// recommended entry point), then Gift Edition, then Deluxe. `popular` marks the
// recommended tier — Standard only.
export const KITS: Product[] = [
  {
    id: "kit-standard",
    size: "15 cm",
    priceSek: 345,
    popular: true,
    kind: "kit",
    configurable: true,
    leadDays: 3,
    name: { sv: "Standard", en: "Standard", fa: "استاندارد" },
    description: {
      sv: "Perfekt för 6–8 personer. Allt du behöver för att skapa din tårta hemma.",
      en: "Perfect for 6–8 people. Everything you need to create your cake at home.",
      fa: "مناسب برای ۶ تا ۸ نفر. هر آنچه برای ساختن کیک در خانه نیاز دارید.",
    },
  },
  {
    id: "kit-gift",
    size: "15 cm",
    priceSek: 395,
    kind: "kit",
    configurable: true,
    leadDays: 3,
    name: { sv: "Presentupplaga", en: "Gift Edition", fa: "نسخه هدیه" },
    description: {
      sv: "Som Standard, men i vacker presentask med en hälsning.",
      en: "Like Standard, but in a beautiful gift box with a dedication.",
      fa: "مانند استاندارد، اما در جعبه‌ای زیبا همراه با یک پیام.",
    },
  },
  {
    id: "kit-deluxe",
    size: "20 cm",
    priceSek: 445,
    kind: "kit",
    configurable: true,
    leadDays: 3,
    name: { sv: "Deluxe", en: "Deluxe", fa: "دلوکس" },
    description: {
      sv: "För 10–12 personer. Extra höjd, extra smak, extra allt.",
      en: "For 10–12 people. Extra height, extra flavour, extra everything.",
      fa: "برای ۱۰ تا ۱۲ نفر. ارتفاع بیشتر، طعم بیشتر، همه‌چیز بیشتر.",
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
// Made to order; not configurable (no decorating). Each variant is a fixed bake.
export const MENU: Product[] = [
  {
    id: "menu-brownie",
    size: "",
    priceSek: 120,
    kind: "menu",
    leadDays: 2,
    name: { sv: "Brownie", en: "Brownie", fa: "براونی" },
    description: {
      sv: "Sega, mörka brownies. Säljs per ask.",
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
      sv: "Klassisk, fuktig citronkaka: färsk citronzest och en mild glasyr.",
      en: "Classic moist lemon cake: fresh zest and a soft glaze.",
      fa: "کیک کلاسیک و لطیف لیمو: پوست تازه لیمو و یک لعاب ملایم.",
    },
    variants: [{ id: "loaf", priceSek: 200, label: { sv: "Hel limpa", en: "Whole loaf", fa: "یک قالب کامل" } }],
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
export const PRODUCTS: Product[] = [...KITS, ...PARTY, ...MENU, ...MENU_VARIANT_PRODUCTS, ...SUBSCRIPTIONS];

export const PARTY_PACK = PARTY[0];

export function getProduct(id: string): Product | null {
  return PRODUCTS.find((p) => p.id === id) ?? null;
}
