import { describe, it, expect } from "vitest";
import {
  priceLineSek,
  leadDaysFor,
  describeLine,
  configKey,
  defaultKitConfig,
  defaultPartyConfig,
  extraTools,
  extraColours,
  extraFillings,
  includedToolsForParty,
  includedColoursForParty,
  defaultPartyTools,
  defaultPartyColours,
  defaultPartyFillings,
  rebalanceFillings,
  colourCount,
  fillingCount,
  toolCount,
  EXTRA_ITEM_SEK,
  PARTY_BASE_SEK,
  PARTY_BASE_CAKES,
  PARTY_PER_CAKE_SEK,
  PARTY_MIN_CAKES,
  type KitConfig,
  type PartyConfig,
} from "./pricing";

describe("priceLineSek — kits", () => {
  it("default kit is the base price (nothing extra)", () => {
    expect(priceLineSek(defaultKitConfig("kit-medio"))).toBe(590);
  });

  it("a second filling adds one extra-item fee", () => {
    const cfg: KitConfig = { ...defaultKitConfig("kit-medio"), fillings: ["berries", "caramel"] };
    expect(priceLineSek(cfg)).toBe(590 + EXTRA_ITEM_SEK);
  });

  it("a third tool (beyond the 2 included) adds one fee", () => {
    const cfg: KitConfig = { ...defaultKitConfig("kit-medio"), tools: { piping: 1, brush: 1, knife: 1 } };
    expect(extraTools(cfg)).toBe(1);
    expect(priceLineSek(cfg)).toBe(590 + EXTRA_ITEM_SEK);
  });

  it("grande includes four tools — no fee for the fourth", () => {
    const cfg: KitConfig = { ...defaultKitConfig("kit-grande"), tools: { piping: 2, brush: 1, knife: 1 } };
    expect(extraTools(cfg)).toBe(0);
    expect(priceLineSek(cfg)).toBe(849);
  });

  it("a fifth tool on grande adds one fee", () => {
    const cfg: KitConfig = { ...defaultKitConfig("kit-grande"), tools: { piping: 2, brush: 2, knife: 1 } };
    expect(extraTools(cfg)).toBe(1);
    expect(priceLineSek(cfg)).toBe(849 + EXTRA_ITEM_SEK);
  });

  it("three chosen colours are included — no fee", () => {
    const cfg: KitConfig = { ...defaultKitConfig("kit-medio"), colours: ["blush", "sky", "sage"] };
    expect(priceLineSek(cfg)).toBe(590);
  });

  it("a fourth colour adds one fee", () => {
    const cfg: KitConfig = { ...defaultKitConfig("kit-medio"), colours: ["blush", "sky", "sage", "butter"] };
    expect(priceLineSek(cfg)).toBe(590 + EXTRA_ITEM_SEK);
  });

  it("grande includes five colours — no fee for the fifth", () => {
    const cfg: KitConfig = {
      ...defaultKitConfig("kit-grande"),
      colours: ["blush", "sky", "sage", "butter", "terracotta"],
    };
    expect(extraColours(cfg)).toBe(0);
    expect(priceLineSek(cfg)).toBe(849);
  });

  it("a sixth colour on grande adds one fee", () => {
    const cfg: KitConfig = {
      ...defaultKitConfig("kit-grande"),
      colours: ["blush", "sky", "sage", "butter", "terracotta", "lilac"],
    };
    expect(extraColours(cfg)).toBe(1);
    expect(priceLineSek(cfg)).toBe(849 + EXTRA_ITEM_SEK);
  });
});

describe("priceLineSek — ready-made cakes", () => {
  it("a ready-made cake is its base price, with no tools or colours", () => {
    const cfg = defaultKitConfig("cake-piccolo");
    expect(cfg.tools).toEqual({ piping: 0, brush: 0, knife: 0 });
    expect(cfg.colours).toEqual([]);
    expect(priceLineSek(cfg)).toBe(349);
  });

  it("a second filling still adds one fee on a ready-made cake", () => {
    const cfg: KitConfig = { ...defaultKitConfig("cake-medio"), fillings: ["berries", "caramel"] };
    expect(priceLineSek(cfg)).toBe(549 + EXTRA_ITEM_SEK);
  });
});

describe("priceLineSek — party", () => {
  it("base price covers one cake; the minimum order (two cakes) bills one extra", () => {
    expect(priceLineSek(defaultPartyConfig())).toBe(PARTY_BASE_SEK + (PARTY_MIN_CAKES - PARTY_BASE_CAKES) * PARTY_PER_CAKE_SEK);
  });

  it("each cake beyond the base adds the per-cake price", () => {
    const cfg: PartyConfig = { ...defaultPartyConfig(), cakes: 5, vanilla: 3 };
    expect(priceLineSek(cfg)).toBe(PARTY_BASE_SEK + (5 - PARTY_BASE_CAKES) * PARTY_PER_CAKE_SEK);
  });

  it("extras stack on top of the per-cake price", () => {
    // A second filling on one of the two vanilla cakes is the one extra here.
    const cfg: PartyConfig = {
      ...defaultPartyConfig(),
      cakes: 4,
      vanilla: 2,
      fillings: { vanilla: { berries: 2, biscoff: 1 }, chocolate: { berries: 2 } },
      tools: defaultPartyTools(4),
      colours: defaultPartyColours(4),
    };
    expect(priceLineSek(cfg)).toBe(PARTY_BASE_SEK + (4 - PARTY_BASE_CAKES) * PARTY_PER_CAKE_SEK + EXTRA_ITEM_SEK);
  });
});

describe("party tools scale with the number of cakes", () => {
  it("included tool allowance is 2 per cake, not a flat 2", () => {
    expect(includedToolsForParty(2)).toBe(4);
    expect(includedToolsForParty(10)).toBe(20);
  });

  it("the default party gives each guest a set, so it never costs extra", () => {
    for (const cakes of [2, 5, 10]) {
      const cfg: PartyConfig = {
        ...defaultPartyConfig(),
        cakes,
        tools: defaultPartyTools(cakes),
        colours: defaultPartyColours(cakes),
      };
      expect(toolCount(cfg.tools)).toBe(2 * cakes);
      expect(colourCount(cfg.colours)).toBe(3 * cakes);
      expect(extraTools(cfg)).toBe(0);
      expect(extraColours(cfg)).toBe(0);
      expect(priceLineSek(cfg)).toBe(PARTY_BASE_SEK + (cakes - PARTY_BASE_CAKES) * PARTY_PER_CAKE_SEK);
    }
  });

  it("a 10-cake party fits 20 tools with no fee, and bills the 21st", () => {
    const base: PartyConfig = { ...defaultPartyConfig(), cakes: 10, vanilla: 5, tools: defaultPartyTools(10) };
    expect(extraTools(base)).toBe(0);
    const oneMore: PartyConfig = { ...base, tools: { ...base.tools, knife: 1 } };
    expect(extraTools(oneMore)).toBe(1);
    expect(priceLineSek(oneMore)).toBe(PARTY_BASE_SEK + (10 - PARTY_BASE_CAKES) * PARTY_PER_CAKE_SEK + EXTRA_ITEM_SEK);
  });
});

describe("party colours scale with the number of cakes", () => {
  it("included colour allowance is 3 per cake (10 cakes → 30 pots)", () => {
    expect(includedColoursForParty(2)).toBe(6);
    expect(includedColoursForParty(10)).toBe(30);
  });

  it("tolerates a legacy party line saved before colours existed", () => {
    expect(colourCount(undefined)).toBe(0);
    const legacy = { ...defaultPartyConfig(), colours: undefined } as unknown as PartyConfig;
    expect(extraColours(legacy)).toBe(0);
    expect(() => priceLineSek(legacy)).not.toThrow();
  });

  it("a 10-cake party fits 30 pots with no fee, and bills the 31st", () => {
    const base: PartyConfig = { ...defaultPartyConfig(), cakes: 10, vanilla: 5, colours: defaultPartyColours(10) };
    expect(colourCount(base.colours)).toBe(30);
    expect(extraColours(base)).toBe(0);
    const oneMore: PartyConfig = { ...base, colours: { ...base.colours, terracotta: 1 } };
    expect(extraColours(oneMore)).toBe(1);
    expect(priceLineSek(oneMore)).toBe(PARTY_BASE_SEK + (10 - PARTY_BASE_CAKES) * PARTY_PER_CAKE_SEK + EXTRA_ITEM_SEK);
  });
});

describe("party fillings are bucketed by sponge", () => {
  it("the default fills every cake once, so nothing costs extra", () => {
    const cfg: PartyConfig = {
      ...defaultPartyConfig(),
      cakes: 8,
      vanilla: 4,
      fillings: defaultPartyFillings(4, 4),
    };
    expect(fillingCount(cfg.fillings.vanilla)).toBe(4);
    expect(fillingCount(cfg.fillings.chocolate)).toBe(4);
    expect(extraFillings(cfg)).toBe(0);
    expect(priceLineSek(cfg)).toBe(PARTY_BASE_SEK + (8 - PARTY_BASE_CAKES) * PARTY_PER_CAKE_SEK);
  });

  it("a second filling in one cake bills once, and only in that sponge bucket", () => {
    const cfg: PartyConfig = {
      ...defaultPartyConfig(),
      cakes: 8,
      vanilla: 4,
      // Vanilla: 4 cakes, 5 portions (one double-filled) → 1 extra. Chocolate exact.
      fillings: { vanilla: { berries: 4, caramel: 1 }, chocolate: { berries: 2, biscoff: 2 } },
    };
    expect(extraFillings(cfg)).toBe(1);
    expect(priceLineSek(cfg)).toBe(PARTY_BASE_SEK + (8 - PARTY_BASE_CAKES) * PARTY_PER_CAKE_SEK + EXTRA_ITEM_SEK);
  });

  it("an empty sponge bucket never offsets an overfilled one", () => {
    const cfg: PartyConfig = {
      ...defaultPartyConfig(),
      cakes: 8,
      vanilla: 4,
      fillings: { vanilla: { berries: 6 }, chocolate: {} }, // 2 extra in vanilla, 0 in chocolate
    };
    expect(extraFillings(cfg)).toBe(2);
  });

  it("rebalanceFillings keeps the bucket summing to the new cake count", () => {
    expect(fillingCount(rebalanceFillings({ berries: 2, caramel: 2 }, 10))).toBe(10);
    expect(fillingCount(rebalanceFillings({ berries: 4 }, 3))).toBe(3);
    expect(rebalanceFillings({}, 5)).toEqual({ berries: 5 });
    expect(rebalanceFillings({ berries: 3 }, 0)).toEqual({});
  });

  it("tolerates a legacy party line whose fillings are still a flat array", () => {
    const legacy = { ...defaultPartyConfig(), fillings: ["berries", "biscoff"] } as unknown as PartyConfig;
    expect(extraFillings(legacy)).toBe(0);
    expect(() => priceLineSek(legacy)).not.toThrow();
    expect(() => describeLine(legacy, "en")).not.toThrow();
    expect(() => configKey(legacy)).not.toThrow();
  });
});

describe("leadDaysFor", () => {
  it("kits need 3 days, parties 7", () => {
    expect(leadDaysFor(defaultKitConfig("kit-medio"))).toBe(3);
    expect(leadDaysFor(defaultPartyConfig())).toBe(7);
  });
});

describe("configKey", () => {
  it("identical configs share a key", () => {
    expect(configKey(defaultKitConfig("kit-medio"))).toBe(configKey(defaultKitConfig("kit-medio")));
  });

  it("different flavour → different key", () => {
    const a = defaultKitConfig("kit-medio");
    const b: KitConfig = { ...a, flavour: "chocolate" };
    expect(configKey(a)).not.toBe(configKey(b));
  });
});

describe("describeLine", () => {
  it("names the kit, flavour and fillings", () => {
    const s = describeLine(defaultKitConfig("kit-medio"), "en");
    expect(s).toContain("Medio");
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
