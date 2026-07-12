import { describe, it, expect } from "vitest";
import { formatValue, formatAmount } from "./format";

describe("formatValue — piece", () => {
  it("rounds to the nearest whole piece", () => {
    expect(formatValue(2, "piece", "en")).toBe("2");
    expect(formatValue(2.4, "piece", "en")).toBe("2");
    expect(formatValue(2.6, "piece", "en")).toBe("3");
  });
});

describe("formatValue — spoons/cups snap to fractions below 10", () => {
  it("snaps common fractions", () => {
    expect(formatValue(0.5, "tsp", "en")).toBe("½");
    expect(formatValue(0.75, "cup", "en")).toBe("¾");
    expect(formatValue(0.25, "tbsp", "en")).toBe("¼");
    expect(formatValue(0.125, "tsp", "en")).toBe("⅛");
  });

  it("combines a whole number with a fraction glyph", () => {
    expect(formatValue(1.5, "tbsp", "en")).toBe("1½");
    expect(formatValue(2.75, "cup", "en")).toBe("2¾");
  });

  it("treats a value just above a whole number as whole (within tolerance)", () => {
    expect(formatValue(2.02, "tbsp", "en")).toBe("2");
    expect(formatValue(3.01, "tbsp", "en")).toBe("3");
  });

  it("falls back to a decimal when no fraction is close enough", () => {
    // 0.44 sits between ⅜ (.375, err .065) and ½ (.5, err .06) — both outside
    // the strict-less-than 0.06 tolerance, so neither fraction claims it.
    expect(formatValue(0.44, "tsp", "en")).toBe("0.44");
  });

  it("at/above 10 units, spoons no longer snap to fractions", () => {
    expect(formatValue(10.5, "tbsp", "en")).toBe("10.5");
  });
});

describe("formatValue — weights/metric volumes by magnitude", () => {
  it("rounds to whole numbers at 50 and above", () => {
    expect(formatValue(250, "g", "en")).toBe("250");
    expect(formatValue(50.4, "g", "en")).toBe("50");
  });

  it("rounds to the nearest 0.5 just below the 50 threshold", () => {
    // 49.6 is still in the 10–50 bucket (nearest 0.5), not yet whole-rounded.
    expect(formatValue(49.6, "g", "en")).toBe("49.5");
  });

  it("rounds to the nearest 0.5 between 10 and 50", () => {
    expect(formatValue(12.3, "g", "en")).toBe("12.5");
    expect(formatValue(15, "dl", "en")).toBe("15");
  });

  it("shows one decimal place between 1 and 10", () => {
    expect(formatValue(3.14, "g", "en")).toBe("3.1");
  });

  it("shows two decimal places under 1", () => {
    expect(formatValue(0.125, "g", "en")).toBe("0.13");
  });

  it("strips trailing zeros after the decimal point", () => {
    expect(formatValue(3.0, "g", "en")).toBe("3");
    expect(formatValue(0.5, "g", "en")).toBe("0.5");
  });
});

describe("formatValue — locale decimal separator", () => {
  it("uses a comma for sv, a period for en", () => {
    expect(formatValue(3.5, "g", "sv")).toBe("3,5");
    expect(formatValue(3.5, "g", "en")).toBe("3.5");
  });
});

describe("formatAmount — value + localized unit label", () => {
  it("appends the unit label for the given language", () => {
    expect(formatAmount(0.5, "tsp", "en")).toBe("½ tsp");
    expect(formatAmount(1.5, "tbsp", "sv")).toBe("1½ msk");
    expect(formatAmount(250, "g", "en")).toBe("250 g");
    expect(formatAmount(2, "piece", "en")).toBe("2 pcs");
  });
});
