import { useSyncExternalStore } from "react";
import type { LineConfig } from "@/lib/pricing";

// Device-local cart. Stays in the browser until the customer submits an order
// request; nothing hits the server before that. Each line carries a full
// `LineConfig` (flavour/fillings/tools for kits, variant for menu, cake count
// for party) so two Standard kits with different choices stay as separate lines.
export type CartItem = { lineId: string; config: LineConfig; message?: string };

const KEY = "mjuklov_cart";
let cache: CartItem[] | null = null;
// Stable reference for the server/initial snapshot — returning a fresh [] each
// call makes useSyncExternalStore loop ("getServerSnapshot should be cached").
const EMPTY: CartItem[] = [];

// True when the stored value matches the current shape (lineId + config).
function isFreshShape(x: unknown): x is CartItem {
  return !!x && typeof x === "object" && typeof (x as { lineId?: unknown }).lineId === "string" &&
    !!(x as { config?: { productId?: unknown } }).config &&
    typeof (x as { config: { productId?: unknown } }).config.productId === "string";
}

function read(): CartItem[] {
  if (cache) return cache;
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (Array.isArray(raw) && raw.every(isFreshShape)) {
      cache = raw as CartItem[];
    } else {
      // Pre-config shape (productId at top level) — discard rather than crash.
      cache = [];
      try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    }
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

// Deep-equal two configs to decide whether a new add should merge into an
// existing line. Stringify is fine here — keys/values are primitive + arrays.
function sameConfig(a: LineConfig, b: LineConfig): boolean {
  const { qty: _qa, ...ra } = a;
  const { qty: _qb, ...rb } = b;
  void _qa; void _qb;
  return JSON.stringify(ra) === JSON.stringify(rb);
}

function newLineId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function addToCart(config: LineConfig): void {
  const items = read();
  const qty = Math.max(1, config.qty | 0);
  const incoming: LineConfig = { ...config, qty };
  const existing = items.find((i) => sameConfig(i.config, incoming));
  if (existing) {
    write(items.map((i) => (i.lineId === existing.lineId ? { ...i, config: { ...i.config, qty: i.config.qty + qty } } : i)));
  } else {
    write([...items, { lineId: newLineId(), config: incoming }]);
  }
}

export function setQty(lineId: string, qty: number): void {
  const items = read();
  if (qty <= 0) write(items.filter((i) => i.lineId !== lineId));
  else write(items.map((i) => (i.lineId === lineId ? { ...i, config: { ...i.config, qty } } : i)));
}

export function setItemMessage(lineId: string, message: string): void {
  write(read().map((i) => (i.lineId === lineId ? { ...i, message } : i)));
}

export function removeFromCart(lineId: string): void {
  write(read().filter((i) => i.lineId !== lineId));
}

export function clearCart(): void {
  write([]);
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((n, i) => n + i.config.qty, 0);
}
