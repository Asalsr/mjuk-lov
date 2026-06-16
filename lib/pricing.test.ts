import { describe, it, expect } from "vitest";
import {
  priceLineSek,
  leadDaysFor,
  describeLine,
  configKey,
  defaultKitConfig,
  defaultPartyConfig,
  extraTools,
  EXTRA_ITEM_SEK,
  PARTY_BASE_SEK,
  PARTY_PER_CAKE_SEK,
  type KitConfig,
  type PartyConfig,
} from "./pricing";

describe("priceLineSek — kits", () => {
  it("default kit is the base price (nothing extra)", () => {
    expect(priceLineSek(defaultKitConfig("kit-standard"))).toBe(345);
  });

  it("a second filling adds one extra-item fee", () => {
    const cfg: KitConfig = { ...defaultKitConfig("kit-standard"), fillings: ["berries", "caramel"] };
    expect(priceLineSek(cfg)).toBe(345 + EXTRA_ITEM_SEK);
  });

  it("a third tool (beyond the 2 included) adds one fee", () => {
    const cfg: KitConfig = { ...defaultKitConfig("kit-standard"), tools: { piping: 1, brush: 1, knife: 1 } };
    expect(extraTools(cfg)).toBe(1);
    expect(priceLineSek(cfg)).toBe(345 + EXTRA_ITEM_SEK);
  });

  it("Deluxe includes three tools — no fee for the third", () => {
    const cfg: KitConfig = { ...defaultKitConfig("kit-deluxe"), tools: { piping: 1, brush: 1, knife: 1 } };
    expect(extraTools(cfg)).toBe(0);
    expect(priceLineSek(cfg)).toBe(445);
  });

  it("three chosen colours are included — no fee", () => {
    const cfg: KitConfig = { ...defaultKitConfig("kit-standard"), colours: ["blush", "sky", "sage"] };
    expect(priceLineSek(cfg)).toBe(345);
  });

  it("a fourth colour adds one fee", () => {
    const cfg: KitConfig = { ...defaultKitConfig("kit-standard"), colours: ["blush", "sky", "sage", "butter"] };
    expect(priceLineSek(cfg)).toBe(345 + EXTRA_ITEM_SEK);
  });
});

describe("priceLineSek — party", () => {
  it("base price covers two cakes", () => {
    expect(priceLineSek(defaultPartyConfig())).toBe(PARTY_BASE_SEK);
  });

  it("each cake beyond two adds the per-cake price", () => {
    const cfg: PartyConfig = { ...defaultPartyConfig(), cakes: 5, vanilla: 3 };
    expect(priceLineSek(cfg)).toBe(PARTY_BASE_SEK + 3 * PARTY_PER_CAKE_SEK);
  });

  it("extras stack on top of the per-cake price", () => {
    const cfg: PartyConfig = {
      ...defaultPartyConfig(),
      cakes: 4,
      vanilla: 2,
      fillings: ["berries", "biscoff"],
    };
    expect(priceLineSek(cfg)).toBe(PARTY_BASE_SEK + 2 * PARTY_PER_CAKE_SEK + EXTRA_ITEM_SEK);
  });
});

describe("leadDaysFor", () => {
  it("kits need 3 days, parties 7", () => {
    expect(leadDaysFor(defaultKitConfig("kit-standard"))).toBe(3);
    expect(leadDaysFor(defaultPartyConfig())).toBe(7);
  });
});

describe("configKey", () => {
  it("identical configs share a key", () => {
    expect(configKey(defaultKitConfig("kit-standard"))).toBe(configKey(defaultKitConfig("kit-standard")));
  });

  it("different flavour → different key", () => {
    const a = defaultKitConfig("kit-standard");
    const b: KitConfig = { ...a, flavour: "chocolate" };
    expect(configKey(a)).not.toBe(configKey(b));
  });
});

describe("describeLine", () => {
  it("names the kit, flavour and fillings", () => {
    const s = describeLine(defaultKitConfig("kit-standard"), "en");
    expect(s).toContain("Standard");
    expect(s).toContain("Vanilla");
    expect(s).toContain("Berries");
  });

  it("party line shows the flavour split", () => {
    const cfg: PartyConfig = { ...defaultPartyConfig(), cakes: 4, vanilla: 3 };
    const s = describeLine(cfg, "en");
    expect(s).toContain("4 cakes");
    expect(s).toContain("3 vanilla / 1 chocolate");
  });
});
