// Opening offer — a launch-wide 30% discount the customer opts into with a
// checkbox in the basket. Unlike the personalized discount codes in lib/offers.ts
// (per-user, minted server-side, redeemed once), this is a single flat promotion
// that applies to every product and needs no code. It runs until a fixed end
// date, after which it disappears everywhere automatically.
//
// One source of truth, imported by both the basket UI (to show the checkbox and
// discounted total) and the server (to recompute the discount — never trust the
// browser's price or its claim that the offer is still live).

/** Percentage off the order total while the offer is live. */
export const OPENING_OFFER_PERCENT = 30;

/** The offer runs through this instant, then stops applying everywhere. End of
 *  day 2026-08-28, Europe/Stockholm (CEST, UTC+2) — one month from launch. */
export const OPENING_OFFER_ENDS_AT = new Date("2026-08-28T23:59:59+02:00");

/** A short tag recorded on orders that used the offer, so the business inbox and
 *  admin view can tell an opening-offer order from a full-price one. */
export const OPENING_OFFER_CODE = "OPENING-30";

/** Is the opening offer still live at `now` (defaults to the current time)? */
export function openingOfferActive(now: Date = new Date()): boolean {
  return now.getTime() <= OPENING_OFFER_ENDS_AT.getTime();
}

/** The amount (kronor) taken off `amountSek` by the offer — rounded to whole
 *  kronor, never negative. Pass an already-summed total; the caller decides what
 *  the offer applies to (here: subtotal + delivery). */
export function openingOfferDiscountSek(amountSek: number): number {
  if (!(amountSek > 0)) return 0;
  return Math.round(amountSek * (OPENING_OFFER_PERCENT / 100));
}
