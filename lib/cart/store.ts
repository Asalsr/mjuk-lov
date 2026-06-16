import { useSyncExternalStore } from "react";
import { configKey, type LineConfig } from "@/lib/pricing";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";

// Device-local cart. Stays in the browser until the customer submits an order
// request; nothing hits the server before that.
//
// A line is keyed by `lineId`: for a configured kit/party that's a hash of the
// configuration (so two Standard kits with different flavours stay separate),
// and for a plain product it's just the productId (so they merge and bump qty).
export type CartItem = {
  lineId: string;
  productId: string;
  qty: number;
  config?: LineConfig; // present for configurable kit/party lines
  date?: string; // reservation date chosen in the configurator (YYYY-MM-DD)
  message?: string;
};

const KEY = "mjuklov_cart";
let cache: CartItem[] | null = null;
// Stable reference for the server/initial snapshot — returning a fresh [] each
// call makes useSyncExternalStore loop ("getServerSnapshot should be cached").
const EMPTY: CartItem[] = [];

// Tolerate carts written by an older build: items used to be keyed by productId
// with no lineId. Backfill lineId so the rest of the app can assume it.
function migrate(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  const out: CartItem[] = [];
  for (const it of raw) {
    if (!it || typeof it !== "object") continue;
    const r = it as Partial<CartItem>;
    const productId = typeof r.productId === "string" ? r.productId : null;
    if (!productId) continue;
    const lineId = typeof r.lineId === "string" && r.lineId ? r.lineId : productId;
    out.push({
      lineId,
      productId,
      qty: Number(r.qty) || 1,
      config: r.config,
      date: r.date,
      message: r.message,
    });
  }
  return out;
}

function read(): CartItem[] {
  if (cache) return cache;
  if (typeof window === "undefined") return [];
  try {
    cache = migrate(JSON.parse(localStorage.getItem(KEY) || "[]"));
  } catch {
    cache = [];
  }
  return cache!;
}

function write(next: CartItem[], { sync = true }: { sync?: boolean } = {}) {
  cache = next;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }
  emit();
  // Mirror to the account (Layer B) for logged-in users. `sync: false` is used
  // when the write *originated* from the server (hydrate) so we don't echo it
  // straight back.
  if (sync) schedulePush();
}

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      emit();
    }
  };
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

export function useCart(): CartItem[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}
export function getCart(): CartItem[] {
  return read();
}

/** Add a configured line (kit/party). Identical configurations on the same
 *  reserved date merge and bump quantity rather than stacking duplicate rows. */
export function addLine(config: LineConfig, opts?: { date?: string; message?: string }) {
  const date = opts?.date;
  const lineId = date ? `${configKey(config)}@${date}` : configKey(config);
  const items = read();
  const existing = items.find((i) => i.lineId === lineId);
  if (existing) {
    write(items.map((i) => (i.lineId === lineId ? { ...i, qty: i.qty + 1 } : i)));
  } else {
    write([...items, { lineId, productId: config.productId, qty: 1, config, date, message: opts?.message }]);
  }
}

/** Add a plain (non-configured) product, keyed by productId. */
export function addToCart(productId: string) {
  const items = read();
  const existing = items.find((i) => i.lineId === productId);
  if (existing) write(items.map((i) => (i.lineId === productId ? { ...i, qty: i.qty + 1 } : i)));
  else write([...items, { lineId: productId, productId, qty: 1 }]);
}
export function setQty(lineId: string, qty: number) {
  const items = read();
  if (qty <= 0) write(items.filter((i) => i.lineId !== lineId));
  else write(items.map((i) => (i.lineId === lineId ? { ...i, qty } : i)));
}
export function setItemMessage(lineId: string, message: string) {
  write(read().map((i) => (i.lineId === lineId ? { ...i, message } : i)));
}
export function removeFromCart(lineId: string) {
  write(read().filter((i) => i.lineId !== lineId));
}
export function clearCart() {
  write([]);
}
export function cartCount(items: CartItem[]): number {
  return items.reduce((n, i) => n + i.qty, 0);
}

// --- Account cart sync (Layer B) ---------------------------------------------
// Logged-in customers see their cart from any browser/device. The CartSync
// component (mounted globally) drives login/logout transitions; mutations made
// while signed in write through here, debounced. Every server call is
// best-effort and wrapped — a failed sync never blocks adding to cart.

let _sb: ReturnType<typeof createClient> | null = null;
function sb() {
  if (!isSupabaseConfigured) return null;
  if (!_sb) _sb = createClient();
  return _sb;
}

let authedUserId: string | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;

/** Set by CartSync on auth changes. Null when logged out (guest = local-only). */
export function setCartAuthUser(userId: string | null) {
  authedUserId = userId;
}

function schedulePush() {
  if (!authedUserId) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void pushCartNow();
  }, 600);
}

/** Upsert the current cart to the account row (last-write-wins via updated_at). */
export async function pushCartNow(): Promise<void> {
  const uid = authedUserId;
  if (!uid) return;
  try {
    const s = sb();
    if (!s) return;
    await s.from("carts").upsert({ user_id: uid, items: read(), updated_at: new Date().toISOString() });
  } catch {
    /* best-effort — local stays the source of truth */
  }
}

/** Replace the local cart from the server without echoing the write back up. */
export function hydrateCart(items: CartItem[]) {
  write(migrate(items), { sync: false });
}

/** Merge two carts by lineId, summing quantity on identical configurations. */
export function mergeCarts(a: CartItem[], b: CartItem[]): CartItem[] {
  const byId = new Map<string, CartItem>();
  for (const it of [...a, ...b]) {
    const existing = byId.get(it.lineId);
    if (existing) byId.set(it.lineId, { ...existing, qty: existing.qty + it.qty });
    else byId.set(it.lineId, { ...it });
  }
  return Array.from(byId.values());
}
