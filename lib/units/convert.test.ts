import { describe, it, expect } from "vitest";
import { convert, canConvert, convertTemp } from "./convert";
import { parseQty } from "./parse";
import { formatAmount } from "./format";
import { annotateTemps } from "./temps";

const near = (a: number, b: number, tol = 0.02) => Math.abs(a - b) <= tol;

describe("convert — same dimension", () => {
  it("mass ↔ mass (g ↔ oz)", () => {
    expect(near(convert(100, "g", "oz"), 3.5274)).toBe(true);
    expect(near(convert(1, "kg", "g"), 1000)).toBe(true);
    expect(near(convert(1, "lb", "g"), 453.592)).toBe(true);
  });

  it("volume ↔ volume respects the system for spoons/cups", () => {
    // metric: 1 tbsp = 15 ml; us: 1 tbsp ≈ 14.79 ml
    expect(near(convert(1, "tbsp", "ml", { system: "metric" }), 15)).toBe(true);
    expect(near(convert(1, "tbsp", "ml", { system: "us" }), 14.7868)).toBe(true);
    // metric cup = 250 ml, US cup ≈ 236.59 ml
    expect(near(convert(1, "cup", "ml", { system: "metric" }), 250)).toBe(true);
    expect(near(convert(1, "cup", "ml", { system: "us" }), 236.588)).toBe(true);
    expect(near(convert(1, "dl", "ml"), 100)).toBe(true);
  });
});

describe("convert — mass ↔ volume needs density", () => {
  it("converts grams of flour to teaspoons via density", () => {
    // flour ≈ 0.53 g/ml; 250 g → ~471.7 ml → /5 ml ≈ 94.3 tsp (metric)
    const tsp = convert(250, "g", "tsp", { system: "metric", density: 0.53 });
    expect(near(tsp, 94.34, 0.5)).toBe(true);
  });

  it("converts water volume to grams (density 1.0)", () => {
    expect(near(convert(1, "tsp", "g", { system: "metric", density: 1.0 }), 5)).toBe(true);
  });

  it("throws without a density", () => {
    expect(() => convert(250, "g", "tsp", { system: "metric" })).toThrow();
  });
});

describe("canConvert", () => {
  it("allows same-dimension without density, blocks mass↔volume without it", () => {
    expect(canConvert("g", "oz", false)).toBe(true);
    expect(canConvert("ml", "cup", false)).toBe(true);
    expect(canConvert("g", "cup", false)).toBe(false);
    expect(canConvert("g", "cup", true)).toBe(true);
    expect(canConvert("piece", "g", true)).toBe(false);
  });
});

describe("convertTemp", () => {
  it("converts C ↔ F", () => {
    expect(convertTemp(175, "C", "F")).toBe(347);
    expect(near(convertTemp(350, "F", "C"), 176.667)).toBe(true);
    expect(convertTemp(20, "C", "C")).toBe(20);
  });
});

describe("parseQty — legacy Swedish strings", () => {
  it("parses metric mass/volume and Swedish spoons", () => {
    expect(parseQty("300 g")).toEqual({ value: 300, unit: "g" });
    expect(parseQty("3 dl")).toEqual({ value: 3, unit: "dl" });
    expect(parseQty("60 ml")).toEqual({ value: 60, unit: "ml" });
    expect(parseQty("1 tsk")).toEqual({ value: 1, unit: "tsp" });
    expect(parseQty("4 msk")).toEqual({ value: 4, unit: "tbsp" });
  });

  it("parses fractions and comma decimals", () => {
    expect(parseQty("1/2 tsk")).toEqual({ value: 0.5, unit: "tsp" });
    expect(parseQty("3/4 tsk")).toEqual({ value: 0.75, unit: "tsp" });
    expect(parseQty("1,5 tsk")).toEqual({ value: 1.5, unit: "tsp" });
  });

  it("treats a bare number as a count and krm as 1 ml", () => {
    expect(parseQty("4")).toEqual({ value: 4, unit: "piece" });
    expect(parseQty("1 krm")).toEqual({ value: 1, unit: "ml" });
  });

  it("returns qualitative text for pinches and garnish", () => {
    expect(parseQty("1 nypa")).toEqual({ text: { sv: "1 nypa", en: "1 pinch" } });
    expect(parseQty("till garnering")).toEqual({ text: { sv: "till garnering", en: "to garnish" } });
  });
});

describe("annotateTemps — show both scales inline", () => {
  it("annotates °C temperatures with °F and leaves non-temps alone", () => {
    expect(annotateTemps("Bake 5 min at 215°C, drop to 190°C and bake 15–18 min more.")).toBe(
      "Bake 5 min at 215°C (419°F), drop to 190°C (374°F) and bake 15–18 min more.",
    );
  });
  it("annotates °F with °C", () => {
    expect(annotateTemps("Preheat to 350°F.")).toBe("Preheat to 350°F (177°C).");
  });
});

describe("formatAmount — kitchen-friendly", () => {
  it("shows fractions for spoons/cups and rounds weights", () => {
    expect(formatAmount(0.5, "tsp", "en")).toBe("½ tsp");
    expect(formatAmount(0.75, "cup", "en")).toBe("¾ cup");
    expect(formatAmount(1.5, "tbsp", "sv")).toBe("1½ msk");
    expect(formatAmount(250, "g", "en")).toBe("250 g");
  });
});
