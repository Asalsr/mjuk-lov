import { describe, it, expect } from "vitest";
import {
  OPENING_OFFER_ENDS_AT,
  OPENING_OFFER_PERCENT,
  openingOfferActive,
  openingOfferDiscountSek,
  openingOfferPriceSek,
} from "./opening-offer";

describe("opening offer", () => {
  it("is live before the end date and dead after it", () => {
    const before = new Date(OPENING_OFFER_ENDS_AT.getTime() - 60_000);
    const after = new Date(OPENING_OFFER_ENDS_AT.getTime() + 60_000);
    expect(openingOfferActive(before)).toBe(true);
    expect(openingOfferActive(after)).toBe(false);
    // The boundary instant itself still counts as live.
    expect(openingOfferActive(new Date(OPENING_OFFER_ENDS_AT))).toBe(true);
  });

  it("ends one month from the 2026-07-28 launch", () => {
    // Guard against an accidental edit to the date: 28 Aug 2026.
    expect(OPENING_OFFER_ENDS_AT.getUTCFullYear()).toBe(2026);
    expect(OPENING_OFFER_ENDS_AT.getUTCMonth()).toBe(7); // August (0-indexed)
    expect(OPENING_OFFER_ENDS_AT.getUTCDate()).toBe(28);
  });

  it("takes 30% off, rounded to whole kronor", () => {
    expect(OPENING_OFFER_PERCENT).toBe(30);
    expect(openingOfferDiscountSek(590)).toBe(177); // exact
    expect(openingOfferDiscountSek(349)).toBe(105); // 104.7 rounds up
    expect(openingOfferDiscountSek(690)).toBe(207);
  });

  it("never returns a negative or nonsense discount", () => {
    expect(openingOfferDiscountSek(0)).toBe(0);
    expect(openingOfferDiscountSek(-100)).toBe(0);
    expect(openingOfferDiscountSek(Number.NaN)).toBe(0);
  });

  it("the offer price is the original minus the discount, exactly", () => {
    for (const n of [349, 390, 449, 590, 690, 849, 890, 1590]) {
      expect(openingOfferPriceSek(n)).toBe(n - openingOfferDiscountSek(n));
    }
    expect(openingOfferPriceSek(590)).toBe(413); // 590 − 177
    expect(openingOfferPriceSek(0)).toBe(0);
    expect(openingOfferPriceSek(-5)).toBe(0);
  });
});
