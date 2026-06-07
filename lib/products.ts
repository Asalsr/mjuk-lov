// DIY cake kits + corporate subscriptions — the products sold. Prices from the
// handbook (§ Kits / § Corporate).
export type Product = {
  id: string;
  name: { sv: string; en: string };
  size: string; // e.g. "15 cm" — empty for subscriptions, which use `unit`
  unit?: { sv: string; en: string }; // e.g. "12 portions/month" (subscriptions)
  description: { sv: string; en: string };
  priceSek: number; // kronor
  recurring?: boolean; // subscription billed monthly
  popular?: boolean; // highlighted tier
};

// Flat delivery fee in kronor (pickup is free).
export const DELIVERY_FEE_SEK = 79;

export const KITS: Product[] = [
  {
    id: "kit-standard",
    size: "15 cm",
    priceSek: 345,
    name: { sv: "Standard", en: "Standard" },
    description: {
      sv: "Perfekt för 6–8 personer. Allt du behöver för att skapa din tårta hemma.",
      en: "Perfect for 6–8 people. Everything you need to create your cake at home.",
    },
  },
  {
    id: "kit-deluxe",
    size: "20 cm",
    priceSek: 445,
    name: { sv: "Deluxe", en: "Deluxe" },
    description: {
      sv: "För 10–12 personer. Extra höjd, extra smak, extra allt.",
      en: "For 10–12 people. Extra height, extra flavour, extra everything.",
    },
  },
  {
    id: "kit-gift",
    size: "15 cm",
    priceSek: 395,
    name: { sv: "Presentupplaga", en: "Gift Edition" },
    description: {
      sv: "Som Standard, men i vacker presentask med en hälsning.",
      en: "Like Standard, but in a beautiful gift box with a dedication.",
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
    name: { sv: "Liten", en: "Small" },
    unit: { sv: "12 portioner/månad", en: "12 portions/month" },
    description: {
      sv: "Fredagsfika för teamet. Varje vecka.",
      en: "Friday fika for the team. Every week.",
    },
  },
  {
    id: "sub-medium",
    size: "",
    priceSek: 1590,
    recurring: true,
    popular: true,
    name: { sv: "Medium", en: "Medium" },
    unit: { sv: "24 portioner/månad", en: "24 portions/month" },
    description: {
      sv: "Veckomöten, kundbesök, spontana fikapauser.",
      en: "Weekly meetings, client visits, spontaneous breaks.",
    },
  },
  {
    id: "sub-large",
    size: "",
    priceSek: 2390,
    recurring: true,
    name: { sv: "Stor", en: "Large" },
    unit: { sv: "40 portioner/månad", en: "40 portions/month" },
    description: {
      sv: "För kontoret som tar fika på allvar.",
      en: "For the office that takes fika seriously.",
    },
  },
];

// Everything orderable, in one list.
export const PRODUCTS: Product[] = [...KITS, ...SUBSCRIPTIONS];

export function getProduct(id: string): Product | null {
  return PRODUCTS.find((p) => p.id === id) ?? null;
}
