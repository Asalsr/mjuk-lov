import { describe, it, expect, beforeEach } from "vitest";
import {
  addLine,
  updateLine,
  addToCart,
  setQty,
  removeFromCart,
  clearCart,
  getCart,
  cartCount,
  mergeCarts,
  hydrateCart,
  type CartItem,
} from "./store";
import { defaultKitConfig, configKey, priceLineSek, type KitConfig, type PartyConfig } from "@/lib/pricing";

// This module keeps its state in a module-level `cache`, not localStorage,
// when `window` is undefined (the vitest node environment) — so every store
// function still exercises real logic here. Reset between tests via the
// exported clearCart().
beforeEach(() => {
  clearCart();
});

describe("addToCart — plain (non-configured) products", () => {
  it("adds a new line keyed by productId", () => {
    addToCart("kit-medio");
    expect(getCart()).toEqual([{ lineId: "kit-medio", productId: "kit-medio", qty: 1 }]);
  });

  it("bumps quantity instead of duplicating on a repeat add", () => {
    addToCart("kit-medio");
    addToCart("kit-medio");
    expect(getCart()).toEqual([{ lineId: "kit-medio", productId: "kit-medio", qty: 2 }]);
  });
});

describe("addLine — configured kit/party lines", () => {
  it("adds a new configured line with qty 1", () => {
    const cfg = defaultKitConfig("kit-medio");
    addLine(cfg);
    const cart = getCart();
    expect(cart).toHaveLength(1);
    expect(cart[0].config).toEqual(cfg);
    expect(cart[0].qty).toBe(1);
  });

  it("merges two identical configs into one line, bumping qty", () => {
    const cfg = defaultKitConfig("kit-medio");
    addLine(cfg);
    addLine(cfg);
    const cart = getCart();
    expect(cart).toHaveLength(1);
    expect(cart[0].qty).toBe(2);
  });

  it("does not carry a date on the line (pickup date is order-level)", () => {
    const cfg = defaultKitConfig("kit-medio");
    addLine(cfg);
    const cart = getCart();
    expect(cart[0].lineId).not.toContain("@");
    expect((cart[0] as Record<string, unknown>).date).toBeUndefined();
  });

  it("keeps different configs (e.g. flavour) as separate lines", () => {
    const vanilla = defaultKitConfig("kit-medio");
    const chocolate: KitConfig = { ...vanilla, flavour: "chocolate" };
    addLine(vanilla);
    addLine(chocolate);
    expect(getCart()).toHaveLength(2);
  });
});

describe("updateLine", () => {
  it("replaces the config in place, recomputing the lineId", () => {
    const cfg = defaultKitConfig("kit-medio");
    addLine(cfg);
    const oldLineId = getCart()[0].lineId;
    const updated: KitConfig = { ...cfg, flavour: "chocolate" };
    updateLine(oldLineId, updated);
    const cart = getCart();
    expect(cart).toHaveLength(1);
    expect(cart[0].config).toEqual(updated);
    expect(cart[0].lineId).not.toBe(oldLineId);
  });

  it("merges into an existing line when the new config collides with one already in the cart", () => {
    // Explicit flavours: a fresh config has none pre-selected, so the two
    // lines here have to differ on a choice actually made.
    const a: KitConfig = { ...defaultKitConfig("kit-medio"), flavour: "vanilla" };
    const b: KitConfig = { ...a, flavour: "chocolate" };
    addLine(a); // qty 1
    addLine(b); // qty 1
    const [lineA] = getCart().filter((i) => i.config?.kind === "kit" && (i.config as KitConfig).flavour === "vanilla");
    // Edit line A's config to match line B's config → should merge into B.
    updateLine(lineA.lineId, b);
    const cart = getCart();
    expect(cart).toHaveLength(1);
    expect(cart[0].qty).toBe(2);
  });

  it("is a no-op when the old lineId no longer exists", () => {
    const cfg = defaultKitConfig("kit-medio");
    addLine(cfg);
    const before = getCart();
    updateLine("does-not-exist", cfg);
    expect(getCart()).toEqual(before);
  });
});

describe("setQty / removeFromCart / clearCart", () => {
  it("setQty updates the quantity of the matching line", () => {
    addToCart("kit-medio");
    setQty("kit-medio", 5);
    expect(getCart()[0].qty).toBe(5);
  });

  it("setQty removes the line when qty drops to 0 or below", () => {
    addToCart("kit-medio");
    setQty("kit-medio", 0);
    expect(getCart()).toEqual([]);
  });

  it("removeFromCart drops only the matching line", () => {
    addToCart("kit-medio");
    addToCart("kit-piccolo");
    removeFromCart("kit-medio");
    expect(getCart().map((i) => i.lineId)).toEqual(["kit-piccolo"]);
  });

  it("clearCart empties the cart", () => {
    addToCart("kit-medio");
    clearCart();
    expect(getCart()).toEqual([]);
  });
});

describe("cartCount", () => {
  it("sums quantities across all lines", () => {
    const items: CartItem[] = [
      { lineId: "a", productId: "a", qty: 2 },
      { lineId: "b", productId: "b", qty: 3 },
    ];
    expect(cartCount(items)).toBe(5);
  });

  it("is 0 for an empty cart", () => {
    expect(cartCount([])).toBe(0);
  });
});

describe("hydrateCart — migrating legacy/server cart shapes (via migrate())", () => {
  it("backfills a missing lineId from productId (pre-lineId carts)", () => {
    hydrateCart([{ productId: "kit-medio" } as unknown as CartItem]);
    expect(getCart()).toEqual([{ lineId: "kit-medio", productId: "kit-medio", qty: 1, config: undefined, message: undefined }]);
  });

  it("coerces a missing/invalid qty to 1", () => {
    hydrateCart([{ productId: "kit-medio", qty: "nonsense" } as unknown as CartItem]);
    expect(getCart()[0].qty).toBe(1);
  });

  it("drops entries with no productId", () => {
    hydrateCart([{ qty: 2 } as unknown as CartItem, { productId: "kit-medio", qty: 1 } as CartItem]);
    expect(getCart()).toHaveLength(1);
  });

  it("drops non-object entries and tolerates a non-array payload", () => {
    hydrateCart([null, "garbage", 42] as unknown as CartItem[]);
    expect(getCart()).toEqual([]);
    hydrateCart("not an array" as unknown as CartItem[]);
    expect(getCart()).toEqual([]);
  });

  it("preserves an explicit lineId when already present", () => {
    hydrateCart([{ lineId: "custom-id", productId: "kit-medio", qty: 2 } as CartItem]);
    expect(getCart()[0].lineId).toBe("custom-id");
  });

  it("strips a legacy `@date` suffix and merges lines that differed only by date", () => {
    const cfg = defaultKitConfig("kit-medio");
    const base = configKey(cfg);
    hydrateCart([
      { lineId: `${base}@2026-07-24`, productId: "kit-medio", qty: 1, config: cfg } as unknown as CartItem,
      { lineId: `${base}@2026-08-28`, productId: "kit-medio", qty: 2, config: cfg } as unknown as CartItem,
    ]);
    const cart = getCart();
    expect(cart).toHaveLength(1);
    expect(cart[0].lineId).toBe(base);
    expect(cart[0].lineId).not.toContain("@");
    expect(cart[0].qty).toBe(3);
  });

  // The bug that motivated all of this: a legacy party line (`cakes` a number)
  // reached the basket un-normalized and crashed the render. migrate() must now
  // normalize configs to the current per-cake shape at the read boundary — so
  // this is what fires when a legacy line arrives from the server `carts` row.
  it("normalizes a legacy party config (cakes:number) to the current per-cake shape", () => {
    hydrateCart([
      {
        productId: "party-pack",
        qty: 1,
        config: {
          kind: "party",
          productId: "party-pack",
          cakes: 4,
          vanilla: 2,
          tools: { brush: 2, knife: 1, piping: 2 },
          colours: { sky: 5, blush: 5 },
          fillings: { vanilla: { "chocolate-berry": 1 }, chocolate: { berries: 1 } },
        },
      } as unknown as CartItem,
    ]);
    const cfg = getCart()[0].config as PartyConfig;
    expect(cfg.kind).toBe("party");
    expect(Array.isArray(cfg.cakes)).toBe(true);
    expect(cfg.cakes.length).toBe(4);
    // And it's now safe to price — the exact call that used to throw on render.
    expect(() => priceLineSek(cfg)).not.toThrow();
  });
});

describe("mergeCarts", () => {
  it("sums quantity for lines sharing a lineId", () => {
    const a: CartItem[] = [{ lineId: "x", productId: "x", qty: 2 }];
    const b: CartItem[] = [{ lineId: "x", productId: "x", qty: 3 }];
    const merged = mergeCarts(a, b);
    expect(merged).toEqual([{ lineId: "x", productId: "x", qty: 5 }]);
  });

  it("keeps distinct lineIds as separate entries", () => {
    const a: CartItem[] = [{ lineId: "x", productId: "x", qty: 1 }];
    const b: CartItem[] = [{ lineId: "y", productId: "y", qty: 1 }];
    const merged = mergeCarts(a, b);
    expect(merged).toHaveLength(2);
  });

  it("is order-stable-ish and doesn't mutate the inputs", () => {
    const a: CartItem[] = [{ lineId: "x", productId: "x", qty: 1 }];
    const b: CartItem[] = [{ lineId: "x", productId: "x", qty: 1 }];
    mergeCarts(a, b);
    expect(a[0].qty).toBe(1);
    expect(b[0].qty).toBe(1);
  });
});
