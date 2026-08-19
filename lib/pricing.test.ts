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
  colourCount,
  toolCount,
  isStepChosen,
  CHOICE_STEPS,
  EXTRA_ITEM_SEK,
  PARTY_BASE_SEK,
  PARTY_BASE_CAKES,
  PARTY_PER_CAKE_SEK,
  PARTY_MIN_CAKES,
  type KitConfig,
  type PartyConfig,
  type PartyCakeConfig,
} from "./pricing";

// N individual cakes, alternating vanilla/chocolate, each with one filling —
// the per-cake replacement for the old "cakes: number, vanilla: number"
// pooled-by-sponge shape.
function makeCakes(n: number, vanillaCount = Math.ceil(n / 2)): PartyCakeConfig[] {
  return Array.from({ length: n }, (_, i) => ({
    flavour: i < vanillaCount ? "vanilla" : "chocolate",
    fillings: ["berries"],
  }));
}

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
    const cfg: KitConfig = { ...defaultKitConfig("kit-medio"), colours: ["pink", "sky-blue", "light-green"] };
    expect(priceLineSek(cfg)).toBe(590);
  });

  it("a fourth colour adds one fee", () => {
    const cfg: KitConfig = { ...defaultKitConfig("kit-medio"), colours: ["pink", "sky-blue", "light-green", "lemon-yellow"] };
    expect(priceLineSek(cfg)).toBe(590 + EXTRA_ITEM_SEK);
  });

  it("grande includes five colours — no fee for the fifth", () => {
    const cfg: KitConfig = {
      ...defaultKitConfig("kit-grande"),
      colours: ["pink", "sky-blue", "light-green", "lemon-yellow", "orange-red"],
    };
    expect(extraColours(cfg)).toBe(0);
    expect(priceLineSek(cfg)).toBe(849);
  });

  it("a sixth colour on grande adds one fee", () => {
    const cfg: KitConfig = {
      ...defaultKitConfig("kit-grande"),
      colours: ["pink", "sky-blue", "light-green", "lemon-yellow", "orange-red", "taro-purple"],
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
    const cfg: PartyConfig = { ...defaultPartyConfig(), cakes: makeCakes(5, 3) };
    expect(priceLineSek(cfg)).toBe(PARTY_BASE_SEK + (5 - PARTY_BASE_CAKES) * PARTY_PER_CAKE_SEK);
  });

  it("extras stack on top of the per-cake price", () => {
    // A second filling on one specific cake is the one extra here.
    const cakes = makeCakes(4, 2);
    cakes[0] = { ...cakes[0], fillings: ["berries", "biscoff"] };
    const cfg: PartyConfig = {
      ...defaultPartyConfig(),
      cakes,
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
    for (const n of [2, 5, 10]) {
      const cfg: PartyConfig = {
        ...defaultPartyConfig(),
        cakes: makeCakes(n),
        tools: defaultPartyTools(n),
        colours: defaultPartyColours(n),
      };
      expect(toolCount(cfg.tools)).toBe(2 * n);
      expect(colourCount(cfg.colours)).toBe(3 * n);
      expect(extraTools(cfg)).toBe(0);
      expect(extraColours(cfg)).toBe(0);
      expect(priceLineSek(cfg)).toBe(PARTY_BASE_SEK + (n - PARTY_BASE_CAKES) * PARTY_PER_CAKE_SEK);
    }
  });

  it("a 10-cake party fits 20 tools with no fee, and bills the 21st", () => {
    const base: PartyConfig = { ...defaultPartyConfig(), cakes: makeCakes(10, 5), tools: defaultPartyTools(10) };
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
    const base: PartyConfig = { ...defaultPartyConfig(), cakes: makeCakes(10, 5), colours: defaultPartyColours(10) };
    expect(colourCount(base.colours)).toBe(30);
    expect(extraColours(base)).toBe(0);
    const oneMore: PartyConfig = { ...base, colours: { ...base.colours, "orange-red": 1 } };
    expect(extraColours(oneMore)).toBe(1);
    expect(priceLineSek(oneMore)).toBe(PARTY_BASE_SEK + (10 - PARTY_BASE_CAKES) * PARTY_PER_CAKE_SEK + EXTRA_ITEM_SEK);
  });
});

describe("party fillings are per cake, not pooled by sponge", () => {
  it("the default gives every cake exactly one filling, so nothing costs extra", () => {
    const cfg: PartyConfig = { ...defaultPartyConfig(), cakes: makeCakes(8, 4) };
    expect(cfg.cakes.every((c) => c.fillings.length === 1)).toBe(true);
    expect(extraFillings(cfg)).toBe(0);
    expect(priceLineSek(cfg)).toBe(PARTY_BASE_SEK + (8 - PARTY_BASE_CAKES) * PARTY_PER_CAKE_SEK);
  });

  it("a second filling on one specific cake bills once, for that cake only", () => {
    const cakes = makeCakes(8, 4);
    cakes[0] = { ...cakes[0], fillings: ["berries", "caramel"] };
    const cfg: PartyConfig = { ...defaultPartyConfig(), cakes };
    expect(extraFillings(cfg)).toBe(1);
    expect(priceLineSek(cfg)).toBe(PARTY_BASE_SEK + (8 - PARTY_BASE_CAKES) * PARTY_PER_CAKE_SEK + EXTRA_ITEM_SEK);
  });

  it("two vanilla cakes can each get a different single filling, at no extra cost", () => {
    // Regression case: the old pooled-by-sponge model represented this as
    // "2 vanilla cakes, 1 berries + 1 caramel", which was indistinguishable
    // from "cake 1 gets both fillings, cake 2 gets neither" (a billable
    // extra). Per-cake tracking makes the two cases genuinely different.
    const cakes: PartyCakeConfig[] = [
      { flavour: "vanilla", fillings: ["berries"] },
      { flavour: "vanilla", fillings: ["caramel"] },
    ];
    const cfg: PartyConfig = { ...defaultPartyConfig(), cakes };
    expect(extraFillings(cfg)).toBe(0);
    expect(priceLineSek(cfg)).toBe(PARTY_BASE_SEK + (2 - PARTY_BASE_CAKES) * PARTY_PER_CAKE_SEK);
  });

  it("multiple cakes billed extra sum correctly", () => {
    const cakes = makeCakes(8, 4);
    cakes[0] = { ...cakes[0], fillings: ["berries", "caramel"] }; // vanilla, +1
    cakes[4] = { ...cakes[4], fillings: ["berries", "biscoff"] }; // chocolate, +1
    const cfg: PartyConfig = { ...defaultPartyConfig(), cakes };
    expect(extraFillings(cfg)).toBe(2);
  });
});

describe("nothing is pre-selected", () => {
  it("a fresh kit config has no flavour, no filling, no colours and no tools", () => {
    const cfg = defaultKitConfig("kit-medio");
    expect(cfg.flavour).toBeNull();
    expect(cfg.fillings).toEqual([]);
    expect(cfg.colours).toEqual([]);
    expect(toolCount(cfg.tools)).toBe(0);
  });

  it("a fresh party config has no sponge and no filling on any cake", () => {
    const cfg = defaultPartyConfig();
    expect(cfg.cakes).toHaveLength(PARTY_MIN_CAKES);
    expect(cfg.cakes.every((c) => c.flavour === null)).toBe(true);
    expect(cfg.cakes.every((c) => c.fillings.length === 0)).toBe(true);
    expect(colourCount(cfg.colours)).toBe(0);
    expect(toolCount(cfg.tools)).toBe(0);
  });

  it("a blank config still prices as the plain base (nothing unchosen is billed)", () => {
    expect(priceLineSek(defaultKitConfig("kit-medio"))).toBe(590);
    expect(priceLineSek(defaultPartyConfig())).toBe(PARTY_BASE_SEK + (PARTY_MIN_CAKES - PARTY_BASE_CAKES) * PARTY_PER_CAKE_SEK);
  });
});

describe("isStepChosen — the gate that replaces pre-selection", () => {
  it("every required step of a blank kit is unchosen", () => {
    const cfg = defaultKitConfig("kit-medio");
    for (const step of CHOICE_STEPS) expect(isStepChosen(cfg, step)).toBe(false);
  });

  it("a step flips to chosen as soon as the customer picks something", () => {
    const cfg = defaultKitConfig("kit-medio");
    expect(isStepChosen({ ...cfg, flavour: "chocolate" }, "flavour")).toBe(true);
    expect(isStepChosen({ ...cfg, fillings: ["caramel"] }, "filling")).toBe(true);
    expect(isStepChosen({ ...cfg, colours: ["light-green"] }, "colour")).toBe(true);
    expect(isStepChosen({ ...cfg, tools: { piping: 1, brush: 0, knife: 0 } }, "tools")).toBe(true);
  });

  it("a party needs the sponge and a filling on EVERY cake, not just the first", () => {
    const half: PartyConfig = {
      ...defaultPartyConfig(),
      cakes: [
        { flavour: "vanilla", fillings: ["berries"] },
        { flavour: null, fillings: [] },
      ],
    };
    expect(isStepChosen(half, "sponge")).toBe(false);
    expect(isStepChosen(half, "filling")).toBe(false);

    const whole: PartyConfig = { ...half, cakes: makeCakes(2) };
    expect(isStepChosen(whole, "sponge")).toBe(true);
    expect(isStepChosen(whole, "filling")).toBe(true);
  });

  it("party colours and tools count across the whole party", () => {
    const cfg = defaultPartyConfig();
    expect(isStepChosen(cfg, "colour")).toBe(false);
    expect(isStepChosen({ ...cfg, colours: { pink: 1 } }, "colour")).toBe(true);
    expect(isStepChosen({ ...cfg, tools: { piping: 1, brush: 0, knife: 0 } }, "tools")).toBe(true);
  });

  it("garbage never reports a choice as made", () => {
    for (const g of [null, undefined, 42, {}, { kind: "kit" }, { kind: "party", cakes: 3 }]) {
      for (const step of CHOICE_STEPS) expect(isStepChosen(g as never, step)).toBe(false);
    }
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
    const cfg: KitConfig = { ...defaultKitConfig("kit-medio"), flavour: "vanilla", fillings: ["berries"] };
    const s = describeLine(cfg, "en");
    expect(s).toContain("Medio");
    expect(s).toContain("Vanilla");
    expect(s).toContain("Berries");
  });

  it("a blank config names no flavour and no filling — it does not guess one", () => {
    const s = describeLine(defaultKitConfig("kit-medio"), "en");
    expect(s).toContain("Medio");
    expect(s).not.toContain("Vanilla");
    expect(s).not.toContain("Berries");
  });

  it("party line shows the flavour split", () => {
    const cfg: PartyConfig = { ...defaultPartyConfig(), cakes: makeCakes(4, 3) };
    const s = describeLine(cfg, "en");
    expect(s).toContain("4 cakes");
    expect(s).toContain("3 vanilla / 1 chocolate");
  });

  it("party line names each cake's own filling, not a pooled guess", () => {
    const cakes: PartyCakeConfig[] = [
      { flavour: "vanilla", fillings: ["berries"] },
      { flavour: "vanilla", fillings: ["caramel"] },
    ];
    const cfg: PartyConfig = { ...defaultPartyConfig(), cakes };
    const s = describeLine(cfg, "en");
    expect(s).toContain("Vanilla: Berries");
    expect(s).toContain("Vanilla: Caramel");
  });
});

describe("configKey — party", () => {
  it("identical per-cake configs share a key", () => {
    const cakes = makeCakes(4, 2);
    const a: PartyConfig = { ...defaultPartyConfig(), cakes };
    const b: PartyConfig = { ...defaultPartyConfig(), cakes: makeCakes(4, 2) };
    expect(configKey(a)).toBe(configKey(b));
  });

  it("two vanilla cakes with different fillings produce a different key than identical fillings", () => {
    const mixed: PartyConfig = {
      ...defaultPartyConfig(),
      cakes: [
        { flavour: "vanilla", fillings: ["berries"] },
        { flavour: "vanilla", fillings: ["caramel"] },
      ],
    };
    const uniform: PartyConfig = {
      ...defaultPartyConfig(),
      cakes: [
        { flavour: "vanilla", fillings: ["berries"] },
        { flavour: "vanilla", fillings: ["berries"] },
      ],
    };
    expect(configKey(mixed)).not.toBe(configKey(uniform));
  });
});
