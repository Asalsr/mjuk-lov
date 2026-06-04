// DIY cake kits — the first products sold. Prices from the handbook (§ Kits).
export type Product = {
  id: string;
  name: { sv: string; en: string };
  size: string;
  description: { sv: string; en: string };
  priceSek: number; // kronor
};

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

export function getProduct(id: string): Product | null {
  return KITS.find((p) => p.id === id) ?? null;
}
