import { useSyncExternalStore } from "react";

// The single source of truth for "when does this order need to be ready."
//
// One order = one pickup date. The date is no longer collected per cart line
// (it used to live on each CartItem and be baked into its lineId, which is what
// let two copies drift out of sync). It's a single order-level value, chosen
// once at checkout, persisted to localStorage so it survives navigation and
// reload — never re-derived from cart contents. Cleared when the order is
// submitted (see CartAndRequest) or when it falls below the current lead-time
// floor (an added party pack can raise that floor past an already-picked date).
const KEY = "mjuklov_order_date";

let cache: string | null = null;
let loaded = false;

function read(): string {
  if (loaded) return cache ?? "";
  if (typeof window === "undefined") return "";
  try {
    cache = localStorage.getItem(KEY);
  } catch {
    cache = null;
  }
  loaded = true;
  return cache ?? "";
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
      loaded = false;
      emit();
    }
  };
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

/** Reactive read of the chosen order date (YYYY-MM-DD, or "" when unset). */
export function useOrderDate(): string {
  return useSyncExternalStore(subscribe, read, () => "");
}

export function getOrderDate(): string {
  return read();
}

/** Set (or clear, with "") the order-level pickup date. Persists and notifies. */
export function setOrderDate(date: string) {
  cache = date || null;
  loaded = true;
  if (typeof window !== "undefined") {
    try {
      if (date) localStorage.setItem(KEY, date);
      else localStorage.removeItem(KEY);
    } catch {
      /* quota / disabled storage — best-effort */
    }
  }
  emit();
}

export function clearOrderDate() {
  setOrderDate("");
}
