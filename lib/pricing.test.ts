import { describe, it, expect } from "vitest";
import {
  priceLineSek,
  leadDaysFor,
  EXTRA_ITEM_SEK,
  PARTY_BASE_SEK,
  PARTY_PER_CAKE_SEK,
  PARTY_MAX_SELF_SERVE,
  LEAD_DAYS_KIT,
  LEAD_DAYS_PARTY,
  LEAD_DAYS_MENU,
  LEAD_DAYS_MENU_BIG,
} from "./pricing";

describe("priceLineSek — kit", () => {
  it("base price when only 1 filling + included tools/colours", () => {
    expect(
      priceLineSek({
        productId: "kit-standard",
        qty: 1,
        flavour: "vanilla",
        fillings: ["berries"],
        colours: 3,
        tools: { piping: 0, brush: 1, knife: 1 },
      }),
    ).toBe(345);
  });

  it("2 fillings + 1 extra tool = base + 2 × EXTRA", () => {
    // Standard: included.tools = 2, FILLING_FREE_COUNT = 1.
    // 2 fillings → 1 extra; 3 tools → 1 extra. Total extras: 2.
    expect(
      priceLineSek({
        productId: "kit-standard",
        qty: 1,
        flavour: "chocolate",
        fillings: ["berries", "caramel"],
        colours: 3,
        tools: { piping: 1, brush: 1, knife: 1 },
      }),
    ).toBe(345 + 2 * EXTRA_ITEM_SEK);
  });

  it("multiplies by qty", () => {
    const unit = priceLineSek({
      productId: "kit-deluxe",
      qty: 1,
      flavour: "vanilla",
      fillings: ["berries"],
      colours: 3,
      tools: { piping: 1, brush: 1, knife: 1 },
    });
    const two = priceLineSek({
      productId: "kit-deluxe",
      qty: 2,
      flavour: "vanilla",
      fillings: ["berries"],
      colours: 3,
      tools: { piping: 1, brush: 1, knife: 1 },
    });
    expect(two).toBe(unit * 2);
  });
});

describe("priceLineSek — party", () => {
  it("2 cakes = base", () => {
    expect(priceLineSek({ productId: "party-pack", qty: 1, partyCakes: 2 })).toBe(PARTY_BASE_SEK);
  });
  it("max cakes = base + (max − 2) × per-cake", () => {
    expect(priceLineSek({ productId: "party-pack", qty: 1, partyCakes: PARTY_MAX_SELF_SERVE })).toBe(
      PARTY_BASE_SEK + (PARTY_MAX_SELF_SERVE - 2) * PARTY_PER_CAKE_SEK,
    );
  });
});

describe("priceLineSek — menu", () => {
  it("variant price × qty", () => {
    // menu-brownie has box4=120, box9=230
    expect(priceLineSek({ productId: "menu-brownie", qty: 1, variantId: "box4" })).toBe(120);
    expect(priceLineSek({ productId: "menu-brownie", qty: 2, variantId: "box9" })).toBe(460);
  });
});

describe("leadDaysFor", () => {
  it("party = 7", () => {
    expect(leadDaysFor({ productId: "party-pack", qty: 1, partyCakes: 2 })).toBe(LEAD_DAYS_PARTY);
  });
  it("menu small = 2, big = 4", () => {
    expect(leadDaysFor({ productId: "menu-cookie", qty: 1, variantId: "pack6" })).toBe(LEAD_DAYS_MENU);
    expect(leadDaysFor({ productId: "menu-cookie", qty: 30, variantId: "pack6" })).toBe(LEAD_DAYS_MENU_BIG);
  });
  it("kit = 3", () => {
    expect(leadDaysFor({ productId: "kit-standard", qty: 1 })).toBe(LEAD_DAYS_KIT);
  });
});
