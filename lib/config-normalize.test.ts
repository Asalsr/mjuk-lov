import { describe, it, expect } from "vitest";
import {
  normalizeLineConfig,
  priceLineSek,
  describeLine,
  configKey,
  leadDaysFor,
  FLAVOURS,
  FILLINGS,
  PARTY_MIN_CAKES,
  type LineConfig,
} from "./pricing";

// Regression + hardening suite for the CLASS of bug that took the basket down:
// a cart line persisted (localStorage or the Supabase `carts` JSONB column)
// under an OLDER config shape, deserialized on login, then fed to the pricing /
// summary functions which assumed the current shape and threw during render —
// crashing the whole basket ("This page couldn't load"). The fix is twofold:
// normalizeLineConfig coerces any drifted/foreign shape to the current one at
// the read boundary, and the pricing/summary functions guard their own inputs.
// These tests pin BOTH: a raw legacy shape must not throw even without
// normalization, and normalization must produce a valid, current-shape config.

const LANGS = ["sv", "en", "fa"] as const;

/** Every consumer that runs during a basket render / order submit. If any of
 *  these throws on a config, the page dies — so the assertion is "never throws"
 *  plus a sane return type. */
function expectConsumable(cfg: LineConfig) {
  expect(() => leadDaysFor(cfg)).not.toThrow();
  expect(() => configKey(cfg)).not.toThrow();
  const price = priceLineSek(cfg);
  expect(Number.isFinite(price)).toBe(true);
  expect(price).toBeGreaterThanOrEqual(0);
  for (const lang of LANGS) {
    expect(() => describeLine(cfg, lang)).not.toThrow();
    expect(typeof describeLine(cfg, lang)).toBe("string");
  }
}

// --- The production fixture that started this -------------------------------
// asal.sr89's saved cart (public.carts) at the time of the report: two lines in
// the LEGACY party shape (`cakes` a number, a separate `vanilla` count, fillings
// pooled by sponge) plus one line already in the current per-cake shape. The
// legacy lines are what threw `cfg.cakes.reduce is not a function`.
const PROD_LEGACY_CART: unknown[] = [
  {
    qty: 1,
    date: "2026-07-20",
    lineId: "party|party-pack|4|2|…@2026-07-20",
    productId: "party-pack",
    config: {
      kind: "party",
      cakes: 4,
      vanilla: 2,
      tools: { brush: 2, knife: 1, piping: 2 },
      colours: { sky: 5, sage: 5, blush: 5, butter: 1, natural: 1, terracotta: 1 },
      fillings: {
        vanilla: { berries: 0, "nuts-fruit": 1, "chocolate-berry": 1 },
        chocolate: { berries: 1, "chocolate-berry": 1 },
      },
      productId: "party-pack",
    },
  },
  {
    qty: 1,
    date: "2026-07-23",
    lineId: "party|party-pack|3|1|…@2026-07-23",
    productId: "party-pack",
    config: {
      kind: "party",
      cakes: 3,
      vanilla: 1,
      tools: { brush: 3, knife: 0, piping: 3 },
      colours: { blush: 1, lilac: 1, butter: 1 },
      fillings: {
        vanilla: { berries: 0, "nuts-fruit": 1, "chocolate-berry": 1 },
        chocolate: { berries: 2 },
      },
      productId: "party-pack",
    },
  },
  {
    qty: 1,
    date: "2026-08-02",
    lineId: "party|party-pack|…@2026-08-02",
    productId: "party-pack",
    config: {
      kind: "party",
      cakes: [
        { flavour: "vanilla", fillings: ["berries"] },
        { flavour: "chocolate", fillings: ["berries"] },
        { flavour: "vanilla", fillings: ["berries"] },
      ],
      tools: { brush: 2, knife: 2, piping: 2 },
      colours: { sky: 2, blush: 2, butter: 2, terracotta: 2 },
      productId: "party-pack",
    },
  },
];

describe("production regression: asal.sr89's legacy cart no longer crashes", () => {
  it("the raw legacy party config is consumable WITHOUT normalization (the guards)", () => {
    // This is the exact call that used to throw during the basket render.
    for (const line of PROD_LEGACY_CART) {
      const raw = (line as { config: LineConfig }).config;
      expectConsumable(raw);
    }
  });

  it("normalizes every line to the current per-cake shape, preserving cake count", () => {
    const expectedCounts = [4, 3, 3];
    PROD_LEGACY_CART.forEach((line, i) => {
      const cfg = normalizeLineConfig((line as { config: unknown }).config);
      expect(cfg.kind).toBe("party");
      if (cfg.kind !== "party") return;
      expect(Array.isArray(cfg.cakes)).toBe(true);
      expect(cfg.cakes.length).toBe(expectedCounts[i]);
      for (const cake of cfg.cakes) {
        expect(FLAVOURS).toContain(cake.flavour);
        expect(cake.fillings.length).toBeGreaterThanOrEqual(1);
        expect(cake.fillings.length).toBeLessThanOrEqual(2);
        for (const f of cake.fillings) expect(FILLINGS).toContain(f);
      }
      expectConsumable(cfg);
    });
  });

  it("preserves the flavour split from the legacy vanilla count", () => {
    const cfg = normalizeLineConfig((PROD_LEGACY_CART[0] as { config: unknown }).config);
    if (cfg.kind !== "party") throw new Error("expected party");
    expect(cfg.cakes.filter((c) => c.flavour === "vanilla").length).toBe(2);
    expect(cfg.cakes.filter((c) => c.flavour === "chocolate").length).toBe(2);
  });

  it("normalization is idempotent (re-running yields an identical config)", () => {
    for (const line of PROD_LEGACY_CART) {
      const once = normalizeLineConfig((line as { config: unknown }).config);
      const twice = normalizeLineConfig(once);
      expect(twice).toEqual(once);
    }
  });
});

// --- Every known/plausible legacy or drifted shape --------------------------
describe("normalizeLineConfig — legacy & drifted party shapes", () => {
  it("count + flat filling array (the oldest shape) → per-cake list", () => {
    const cfg = normalizeLineConfig({ kind: "party", productId: "party-pack", cakes: 3, fillings: ["berries", "biscoff"] });
    expect(cfg.kind).toBe("party");
    if (cfg.kind !== "party") return;
    expect(cfg.cakes.length).toBe(3);
    expectConsumable(cfg);
  });

  it("missing tools/colours are backfilled to empty, not left undefined", () => {
    const cfg = normalizeLineConfig({ kind: "party", productId: "party-pack", cakes: 2, vanilla: 1 });
    if (cfg.kind !== "party") throw new Error("expected party");
    expect(cfg.tools).toEqual({ piping: 0, brush: 0, knife: 0 });
    expect(cfg.colours).toEqual({});
    expectConsumable(cfg);
  });

  it("a cake count below the minimum is raised to PARTY_MIN_CAKES", () => {
    const cfg = normalizeLineConfig({ kind: "party", productId: "party-pack", cakes: 1 });
    if (cfg.kind !== "party") throw new Error("expected party");
    expect(cfg.cakes.length).toBe(PARTY_MIN_CAKES);
  });

  it("unknown enum values are sanitized to valid ones", () => {
    const cfg = normalizeLineConfig({
      kind: "party",
      productId: "party-pack",
      cakes: [{ flavour: "strawberry", fillings: ["jam", "berries", "berries", "biscoff"] }],
    });
    if (cfg.kind !== "party") throw new Error("expected party");
    expect(cfg.cakes[0].flavour).toBe("vanilla"); // unknown flavour → default
    expect(cfg.cakes[0].fillings).toEqual(["berries", "biscoff"]); // 'jam' dropped, dedup, capped at 2
  });
});

describe("normalizeLineConfig — kit shapes", () => {
  it("a bare kit config is filled with valid defaults", () => {
    const cfg = normalizeLineConfig({ kind: "kit", productId: "kit-medio" });
    if (cfg.kind !== "kit") throw new Error("expected kit");
    expect(cfg.fillings).toEqual(["berries"]); // a cake always has ≥1 filling
    expect(cfg.tools).toEqual({ piping: 0, brush: 0, knife: 0 });
    expect(cfg.colours).toEqual([]);
    expectConsumable(cfg);
  });

  it("garbage kit fields are coerced (fillings not an array, unknown colours)", () => {
    const cfg = normalizeLineConfig({ kind: "kit", productId: "kit-medio", fillings: "nope", colours: ["blush", "fuchsia"], flavour: 7 });
    if (cfg.kind !== "kit") throw new Error("expected kit");
    expect(cfg.fillings).toEqual(["berries"]);
    expect(cfg.colours).toEqual(["blush"]); // 'fuchsia' dropped
    expect(cfg.flavour).toBe("vanilla");
    expectConsumable(cfg);
  });
});

// --- Fuzz: nothing deserialized can crash the pipeline ----------------------
describe("fuzz — arbitrary/garbage input never throws", () => {
  const garbage: unknown[] = [
    null,
    undefined,
    42,
    "party",
    [],
    {},
    { kind: "party" },
    { kind: "party", cakes: "x" },
    { kind: "party", cakes: 5 },
    { kind: "party", cakes: {} },
    { kind: "party", cakes: [null, {}, { flavour: 1, fillings: 2 }] },
    { kind: "party", cakes: [], tools: null, colours: 5 },
    { kind: "kit" },
    { kind: "kit", fillings: {}, tools: "x", colours: 3 },
    { kind: "totally-unknown", productId: 9 },
    { productId: "party-pack", cakes: 3 }, // no `kind` at all
  ];

  it("normalizeLineConfig returns a valid, consumable config for any input", () => {
    for (const g of garbage) {
      const cfg = normalizeLineConfig(g);
      expect(["kit", "party"]).toContain(cfg.kind);
      expectConsumable(cfg);
    }
  });

  it("the pricing/summary functions tolerate raw garbage directly (no normalization)", () => {
    // Belt-and-suspenders: even if a config reaches a consumer un-normalized,
    // the guards inside each function keep the page alive.
    for (const g of garbage) {
      const cfg = g as LineConfig;
      expect(() => priceLineSek(cfg)).not.toThrow();
      expect(() => configKey(cfg)).not.toThrow();
      expect(() => leadDaysFor(cfg)).not.toThrow();
      for (const lang of LANGS) expect(() => describeLine(cfg, lang)).not.toThrow();
    }
  });
});
