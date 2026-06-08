import { useSyncExternalStore } from "react";

// Device-local cart. Stays in the browser until the customer submits an order
// request; nothing hits the server before that.
export type CartItem = { productId: string; qty: number; message?: string };

const KEY = "mjuklov_cart";
let cache: CartItem[] | null = null;
// Stable reference for the server/initial snapshot — returning a fresh [] each
// call makes useSyncExternalStore loop ("getServerSnapshot should be cached").
const EMPTY: CartItem[] = [];

function read(): CartItem[] {
  if (cache) return cache;
  if (typeof window === "undefined") return [];
  try {
    cache = JSON.parse(localStorage.getItem(KEY) || "[]");
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

export function addToCart(productId: string) {
  const items = read();
  const existing = items.find((i) => i.productId === productId);
  if (existing) write(items.map((i) => (i.productId === productId ? { ...i, qty: i.qty + 1 } : i)));
  else write([...items, { productId, qty: 1 }]);
}
export function setQty(productId: string, qty: number) {
  const items = read();
  if (qty <= 0) write(items.filter((i) => i.productId !== productId));
  else write(items.map((i) => (i.productId === productId ? { ...i, qty } : i)));
}
export function setItemMessage(productId: string, message: string) {
  write(read().map((i) => (i.productId === productId ? { ...i, message } : i)));
}
export function removeFromCart(productId: string) {
  write(read().filter((i) => i.productId !== productId));
}
export function clearCart() {
  write([]);
}
export function cartCount(items: CartItem[]): number {
  return items.reduce((n, i) => n + i.qty, 0);
}
