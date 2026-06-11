// Seller identity for receipts (kvitto). Config-driven so the business can fill
// in real details — and so the day Mjuk Lov registers for VAT, setting
// SELLER_VAT_NUMBER flips the receipt from a plain kvitto to a VAT invoice
// without code changes.
//
// Defaults are placeholders (matches the legal pages' "Mjuk Lov, Gothenburg").
// Override via env in production.

export interface Seller {
  name: string;
  address: string;
  email: string;
  /** Organisationsnummer — empty until the business provides it. */
  orgNumber: string;
  /** VAT (moms) number — empty = NOT VAT-registered → receipt is a kvitto, not a VAT invoice. */
  vatNumber: string;
}

export const SELLER: Seller = {
  name: process.env.SELLER_NAME || "Mjuk Lov",
  address: process.env.SELLER_ADDRESS || "Göteborg, Sverige",
  email: process.env.SELLER_EMAIL || process.env.OWNER_EMAIL || "",
  orgNumber: process.env.SELLER_ORG_NUMBER || "",
  vatNumber: process.env.SELLER_VAT_NUMBER || "",
};

/** True once a VAT number is configured — switches the receipt to a VAT invoice. */
export function isVatRegistered(seller: Seller = SELLER): boolean {
  return seller.vatNumber.trim().length > 0;
}
