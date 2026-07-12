import { describe, it, expect } from "vitest";
import { buildDeclaration, CANONICAL_ORDER, SAFETY_NET, NEGATIONS, LABELS } from "./labels";
import type { AllergenCode } from "../recipes/schema";

describe("buildDeclaration", () => {
  it("orders codes by the canonical EU declaration order regardless of input order", () => {
    const shuffled: AllergenCode[] = ["sesame", "gluten", "milk"];
    const d = buildDeclaration(shuffled);
    expect(d.sv).toBe("Innehåller: gluten, mjölk, sesam");
    expect(d.en).toBe("Contains: gluten, milk, sesame");
  });

  it("returns the explicit none-of-14 wording for an empty code list", () => {
    const d = buildDeclaration([]);
    expect(d.sv).toBe("Innehåller: inget av de 14 allergenerna");
    expect(d.en).toBe("Contains: none of the 14 allergens");
  });

  it("every canonical code has a label in every language", () => {
    for (const code of CANONICAL_ORDER) {
      expect(LABELS[code].sv).toBeTruthy();
      expect(LABELS[code].en).toBeTruthy();
      expect(LABELS[code].fa).toBeTruthy();
    }
  });
});

describe("SAFETY_NET — word-boundary matching (no substring false positives)", () => {
  const nutsRule = SAFETY_NET.find((r) => r.code === "nuts")!;
  const glutenRule = SAFETY_NET.find((r) => r.code === "gluten")!;
  const sulphitesWineRule = SAFETY_NET.find((r) => r.note.includes("fortified wine"))!;
  const sulphitesFruitRule = SAFETY_NET.find((r) => r.note.includes("dried fruit"))!;

  it("matches real nut ingredients", () => {
    expect(nutsRule.re.test("100 g mandel")).toBe(true);
    expect(nutsRule.re.test("cashew mascarpone")).toBe(true);
    expect(nutsRule.re.test("hasselnötter")).toBe(true);
  });

  it("does not false-positive on an unrelated word containing the fragment", () => {
    // "kokosgrädde" must not match any nut/gluten rule via naive substring matching.
    expect(nutsRule.re.test("kokosgrädde")).toBe(false);
    expect(glutenRule.re.test("kokosgrädde")).toBe(false);
  });

  it("matches cereal ingredients for gluten", () => {
    expect(glutenRule.re.test("vetemjöl")).toBe(true);
    expect(glutenRule.re.test("vegan ladyfingers")).toBe(true);
    expect(glutenRule.re.test("rågmjöl")).toBe(true);
  });

  it("matches fortified wine and dried fruit for sulphites", () => {
    expect(sulphitesWineRule.re.test("4 msk marsala")).toBe(true);
    expect(sulphitesWineRule.re.test("sherry")).toBe(true);
    expect(sulphitesFruitRule.re.test("russin")).toBe(true);
    expect(sulphitesFruitRule.re.test("torkade aprikos")).toBe(true);
  });

  it("misses the Swedish plural 'aprikoser' (word-boundary cuts off after 'aprikos')", () => {
    // Documents a real gap: the regex requires \b right after "aprikos", which
    // "aprikoser" doesn't satisfy — a recipe ingredient written in the plural
    // won't trigger the sulphites safety net. Flagging rather than silently
    // fixing since it's a labels.ts regex change, not a test change.
    expect(sulphitesFruitRule.re.test("torkade aprikoser")).toBe(false);
  });
});

describe("NEGATIONS — suppress a safety-net code on explicit free-from phrasing", () => {
  it("has a gluten negation that matches gluten-free phrasing in sv and en", () => {
    const negs = NEGATIONS.gluten ?? [];
    expect(negs.some((re) => re.test("glutenfri"))).toBe(true);
    expect(negs.some((re) => re.test("gluten-free ladyfingers"))).toBe(true);
    expect(negs.some((re) => re.test("gluten free"))).toBe(true);
  });

  it("does not suppress on ordinary gluten-containing text", () => {
    const negs = NEGATIONS.gluten ?? [];
    expect(negs.some((re) => re.test("vetemjöl"))).toBe(false);
  });
});
