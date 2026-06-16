import { useSyncExternalStore } from "react";
import { configKey, type LineConfig } from "@/lib/pricing";

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

function write(next: CartItem[]) {
  cache = next;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }
  emit();
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
