import { describe, it, expect } from "vitest";
import { buildLabel } from "./engine";

describe("buildLabel", () => {
  it("orders codes canonically and builds the bilingual declaration", () => {
    const r = buildLabel({ allergens: [{ code: "milk" }, { code: "gluten" }] }, []);
    expect(r.codes).toEqual(["gluten", "milk"]);
    expect(r.declaration.sv).toBe("Innehåller: gluten, mjölk");
    expect(r.declaration.en).toBe("Contains: gluten, milk");
  });

  it("adds sulphites from marsala via the safety-net (covers what AI missed)", () => {
    const r = buildLabel({ allergens: [{ code: "egg" }, { code: "milk" }] }, ["4 msk marsala"]);
    expect(r.codes).toEqual(["egg", "milk", "sulphites"]);
    expect(r.needsReview.some((n) => n.includes("sulphites"))).toBe(true);
  });

  it("does NOT false-positive milk on coconut cream", () => {
    const r = buildLabel({ allergens: [] }, ["4 dl kokosgrädde"]);
    expect(r.codes).toEqual([]);
    expect(r.declaration.en).toBe("Contains: none of the 14 allergens");
  });

  it("catches nuts + gluten the AI missed on adapted ingredient names", () => {
    const r = buildLabel({ allergens: [] }, [
      "300 g vegan ladyfingers",
      "500 g cashew or coconut mascarpone",
    ]);
    expect(r.codes).toEqual(["gluten", "nuts"]);
  });

  it("does not flag gluten on gluten-free items (negation)", () => {
    const r = buildLabel({ allergens: [] }, ["200 g gluten-free ladyfingers"]);
    expect(r.codes).toEqual([]);
  });

  it("coconut/cashew do not false-positive milk (left to the AI)", () => {
    const r = buildLabel({ allergens: [] }, ["4 dl kokosgrädde", "200 g coconut cream"]);
    expect(r.codes).toEqual([]);
  });

  it("dedupes repeats and ignores invalid codes", () => {
    const r = buildLabel(
      { allergens: [{ code: "milk" }, { code: "milk" }, { code: "bogus" }] },
      [],
    );
    expect(r.codes).toEqual(["milk"]);
  });
});
