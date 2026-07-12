import { describe, it, expect } from "vitest";
import { RecipeSchema, Localized, Step, Quantity, Amount } from "./schema";

describe("Localized — fa falls back to en when omitted", () => {
  it("fills fa from en when fa is missing", () => {
    const parsed = Localized.parse({ sv: "Hej", en: "Hi" });
    expect(parsed).toEqual({ sv: "Hej", en: "Hi", fa: "Hi" });
  });

  it("keeps an explicit fa untouched", () => {
    const parsed = Localized.parse({ sv: "Hej", en: "Hi", fa: "سلام" });
    expect(parsed.fa).toBe("سلام");
  });

  it("requires sv and en", () => {
    expect(Localized.safeParse({ en: "Hi" }).success).toBe(false);
    expect(Localized.safeParse({ sv: "Hej" }).success).toBe(false);
  });
});

describe("Step — legacy {sv,en} bodies are wrapped into {text}", () => {
  it("wraps a bare localized object into { text }", () => {
    const parsed = Step.parse({ sv: "Blanda", en: "Mix" });
    expect(parsed.text).toEqual({ sv: "Blanda", en: "Mix", fa: "Mix" });
  });

  it("passes through a modern { text, durationMin } step unchanged in shape", () => {
    const parsed = Step.parse({ text: { sv: "Blanda", en: "Mix" }, durationMin: 5 });
    expect(parsed.text.sv).toBe("Blanda");
    expect(parsed.durationMin).toBe(5);
  });

  it("rejects a negative or non-integer durationMin", () => {
    expect(Step.safeParse({ text: { sv: "a", en: "b" }, durationMin: -1 }).success).toBe(false);
    expect(Step.safeParse({ text: { sv: "a", en: "b" }, durationMin: 1.5 }).success).toBe(false);
  });
});

describe("Quantity — structured amount or qualitative text", () => {
  it("accepts a structured amount", () => {
    const q = Quantity.parse({ value: 250, unit: "g" });
    expect(q).toEqual({ value: 250, unit: "g" });
  });

  it("accepts qualitative text", () => {
    const q = Quantity.parse({ text: { sv: "efter smak", en: "to taste" } });
    expect("text" in q).toBe(true);
  });

  it("rejects a non-positive amount", () => {
    expect(Amount.safeParse({ value: 0, unit: "g" }).success).toBe(false);
    expect(Amount.safeParse({ value: -5, unit: "g" }).success).toBe(false);
  });

  it("rejects an amount whose unit isn't in the canonical unit list", () => {
    expect(Amount.safeParse({ value: 1, unit: "bushel" }).success).toBe(false);
  });

  it("rejects a value that is neither an amount nor qualitative text", () => {
    expect(Quantity.safeParse({ foo: "bar" }).success).toBe(false);
  });
});

describe("RecipeSchema — end to end", () => {
  const minimalValidRecipe = {
    slug: "test-cake",
    title: { sv: "Testtårta", en: "Test cake" },
    headnote: { sv: "En testtårta.", en: "A test cake." },
    servings: 8,
    time: { prepMin: 20, totalMin: 60 },
    youtubeId: null,
    ingredients: [{ qty: { value: 250, unit: "g" }, item: { sv: "Mjöl", en: "Flour" } }],
    steps: [{ sv: "Blanda allt.", en: "Mix everything." }],
    notes: { sv: "", en: "" },
    allergens: {
      codes: ["gluten"],
      declaration: { sv: "Innehåller: gluten", en: "Contains: gluten" },
      needsReview: [],
      approvedBy: "asal",
      approvedAt: "2026-01-01",
    },
    published: true,
  };

  it("parses a minimal valid recipe, defaulting optional fields", () => {
    const parsed = RecipeSchema.parse(minimalValidRecipe);
    expect(parsed.image).toBeNull();
    expect(parsed.inspiredBy).toBeNull();
    expect(parsed.oven).toBeNull();
    expect(parsed.diet).toEqual([]);
    expect(parsed.equipment).toEqual([]);
    expect(parsed.tips).toEqual([]);
    expect(parsed.steps[0].text.en).toBe("Mix everything.");
  });

  it("rejects a recipe with no ingredients", () => {
    const bad = { ...minimalValidRecipe, ingredients: [] };
    expect(RecipeSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a recipe with no steps", () => {
    const bad = { ...minimalValidRecipe, steps: [] };
    expect(RecipeSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a recipe missing the allergen approval fields", () => {
    const bad = {
      ...minimalValidRecipe,
      allergens: { codes: [], declaration: { sv: "x", en: "y" }, needsReview: [] },
    };
    expect(RecipeSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a non-positive servings count", () => {
    const bad = { ...minimalValidRecipe, servings: 0 };
    expect(RecipeSchema.safeParse(bad).success).toBe(false);
  });

  it("accepts an optional oven temperature with a valid unit", () => {
    const withOven = { ...minimalValidRecipe, oven: { value: 200, unit: "C" } };
    expect(RecipeSchema.safeParse(withOven).success).toBe(true);
  });

  it("rejects an oven unit that isn't C or F", () => {
    const bad = { ...minimalValidRecipe, oven: { value: 200, unit: "K" } };
    expect(RecipeSchema.safeParse(bad).success).toBe(false);
  });
});
