import { describe, it, expect } from "vitest";
import { parseQty } from "./parse";

describe("parseQty — unit words", () => {
  it("covers every mapped unit word", () => {
    expect(parseQty("300 g")).toEqual({ value: 300, unit: "g" });
    expect(parseQty("1 kg")).toEqual({ value: 1, unit: "kg" });
    expect(parseQty("60 ml")).toEqual({ value: 60, unit: "ml" });
    expect(parseQty("3 dl")).toEqual({ value: 3, unit: "dl" });
    expect(parseQty("1 l")).toEqual({ value: 1, unit: "l" });
    expect(parseQty("1 tsk")).toEqual({ value: 1, unit: "tsp" });
    expect(parseQty("4 msk")).toEqual({ value: 4, unit: "tbsp" });
    expect(parseQty("2 st")).toEqual({ value: 2, unit: "piece" });
  });

  it("is case-insensitive on the unit word", () => {
    expect(parseQty("300 G")).toEqual({ value: 300, unit: "g" });
    expect(parseQty("4 MSK")).toEqual({ value: 4, unit: "tbsp" });
  });
});

describe("parseQty — numeric forms", () => {
  it("parses a mixed number", () => {
    expect(parseQty("1 1/2 dl")).toEqual({ value: 1.5, unit: "dl" });
  });

  it("parses a bare fraction", () => {
    expect(parseQty("3/4 tsk")).toEqual({ value: 0.75, unit: "tsp" });
  });

  it("parses a comma decimal", () => {
    expect(parseQty("1,5 tsk")).toEqual({ value: 1.5, unit: "tsp" });
  });

  it("treats a bare number as a count", () => {
    expect(parseQty("4")).toEqual({ value: 4, unit: "piece" });
  });
});

describe("parseQty — special-cased words", () => {
  it("krm (kryddmått) is 1 ml", () => {
    expect(parseQty("1 krm")).toEqual({ value: 1, unit: "ml" });
    expect(parseQty("2 krm")).toEqual({ value: 2, unit: "ml" });
  });

  it("nypa/nypor becomes qualitative text, not a convertible amount", () => {
    expect(parseQty("1 nypa")).toEqual({ text: { sv: "1 nypa", en: "1 pinch" } });
    // NB: the sv text is hardcoded to "nypa" regardless of the plural "nypor"
    // in the source — this documents current behavior, not necessarily
    // desired behavior (see the coverage report note on this).
    expect(parseQty("2 nypor")).toEqual({ text: { sv: "2 nypa", en: "2 pinch" } });
  });
});

describe("parseQty — qualitative phrases", () => {
  it("recognises every mapped phrase, case-insensitively", () => {
    expect(parseQty("till garnering")).toEqual({ text: { sv: "till garnering", en: "to garnish" } });
    expect(parseQty("Till Servering")).toEqual({ text: { sv: "till servering", en: "to serve" } });
    expect(parseQty("efter smak")).toEqual({ text: { sv: "efter smak", en: "to taste" } });
    expect(parseQty("en nypa")).toEqual({ text: { sv: "en nypa", en: "a pinch" } });
  });
});

describe("parseQty — unparseable input", () => {
  it("returns null for an unknown unit word", () => {
    expect(parseQty("300 xyz")).toBeNull();
  });

  it("returns null for a phrase that isn't in the qualitative dictionary", () => {
    expect(parseQty("some vague amount")).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(parseQty("")).toBeNull();
    expect(parseQty("   ")).toBeNull();
  });

  it("returns null for a non-numeric leading token", () => {
    expect(parseQty("a few g")).toBeNull();
  });
});
