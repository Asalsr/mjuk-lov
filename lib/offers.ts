import type { createAdminClient } from "@/lib/supabase/admin";
import type { Product } from "@/lib/products";

// Personalized offers & discount codes (M13). All minting and redemption runs
// server-side through the service-role client (RLS lets users only READ their
// own personal codes). Targeting is deliberately simple and rule-based — it
// reads engagement signals and never exposes how the rule was chosen beyond a
// friendly reason key the UI localizes.

type Admin = ReturnType<typeof createAdminClient>;

export type Offer = {
  code: string;
  kind: "percent" | "fixed";
  value: number;
  productId: string | null;
  reasonKey: string | null;
  expiresAt: string | null;
};

export type Signals = { orders: number; favorites: number; history: number };

type Rule = { kind: "percent" | "fixed"; value: number; reasonKey: string };

const PERSONAL_TTL_DAYS = 30;

/** Pick a personalized offer from a user's engagement, or null if none fits. */
export function deriveOffer(s: Signals): Rule | null {
  if (s.orders > 0) return { kind: "percent", value: 10, reasonKey: "returning" };
  if (s.favorites + s.history > 0) return { kind: "percent", value: 15, reasonKey: "firstKit" };
  return null;
}

type Row = {
  code: string;
  kind: "percent" | "fixed";
  value: number;
  product_id: string | null;
  user_id: string | null;
  reason: string | null;
  active: boolean;
  expires_at: string | null;
  max_redemptions: number | null;
  times_redeemed: number;
};

/** A code is usable if active, unexpired, and has redemptions left. */
function isLive(c: Row, nowMs: number): boolean {
  if (!c.active) return false;
  if (c.expires_at && new Date(c.expires_at).getTime() < nowMs) return false;
  if (c.max_redemptions != null && c.times_redeemed >= c.max_redemptions) return false;
  return true;
}

const toOffer = (c: Row): Offer => ({
  code: c.code,
  kind: c.kind,
  value: c.value,
  productId: c.product_id,
  reasonKey: c.reason,
  expiresAt: c.expires_at,
});

function newCode(): string {
  return `MJUK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

/**
 * Return the user's live personal offers, minting one from their signals if they
 * have none. Call only when the user has granted marketing consent.
 */
export async function ensurePersonalOffer(admin: Admin, userId: string, signals: Signals): Promise<Offer[]> {
  const now = Date.now();
  const { data } = await admin
    .from("discount_codes")
    .select("code, kind, value, product_id, user_id, reason, active, expires_at, max_redemptions, times_redeemed")
    .eq("user_id", userId)
    .eq("active", true);
  const live = ((data as Row[] | null) ?? []).filter((c) => isLive(c, now));
  if (live.length) return live.map(toOffer);

  const rule = deriveOffer(signals);
  if (!rule) return [];

  const expires = new Date(now + PERSONAL_TTL_DAYS * 86_400_000).toISOString();
  // A couple of attempts in case of the (tiny) chance of a code collision.
  for (let i = 0; i < 3; i++) {
    const code = newCode();
    const { data: inserted, error } = await admin
      .from("discount_codes")
      .insert({
        code,
        kind: rule.kind,
        value: rule.value,
        user_id: userId,
        reason: rule.reasonKey,
        max_redemptions: 1,
        expires_at: expires,
      })
      .select("code, kind, value, product_id, user_id, reason, active, expires_at, max_redemptions, times_redeemed")
      .single();
    if (!error && inserted) return [toOffer(inserted as Row)];
  }
  return [];
}

/** The discounted amount in öre, never below zero. */
export function discountedAmount(amountOre: number, kind: "percent" | "fixed", value: number): number {
  const out = kind === "percent" ? Math.round(amountOre * (1 - value / 100)) : amountOre - value;
  return Math.max(0, out);
}

/**
 * Validate a typed/assigned code for this user + product WITHOUT consuming it
 * (a redemption is only counted once payment succeeds — see the webhook).
 * Returns the discounted amount in öre, or null if the code can't be applied.
 */
export async function validateOffer(
  admin: Admin,
  code: string,
  userId: string,
  product: Product,
): Promise<{ code: string; amount: number } | null> {
  const clean = code.trim().toUpperCase();
  if (!clean) return null;
  const { data } = await admin
    .from("discount_codes")
    .select("code, kind, value, product_id, user_id, reason, active, expires_at, max_redemptions, times_redeemed")
    .eq("code", clean)
    .maybeSingle();
  const c = data as Row | null;
  if (!c || !isLive(c, Date.now())) return null;
  if (c.user_id && c.user_id !== userId) return null; // personal code, wrong user
  if (c.product_id && c.product_id !== product.id) return null; // product-scoped
  return { code: c.code, amount: discountedAmount(product.priceSek * 100, c.kind, c.value) };
}

/** Count one redemption — call only after a successful payment. Best-effort. */
export async function consumeRedemption(admin: Admin, code: string): Promise<void> {
  const { data } = await admin.from("discount_codes").select("times_redeemed").eq("code", code).maybeSingle();
  const current = (data as { times_redeemed: number } | null)?.times_redeemed;
  if (current == null) return;
  await admin.from("discount_codes").update({ times_redeemed: current + 1 }).eq("code", code);
}
