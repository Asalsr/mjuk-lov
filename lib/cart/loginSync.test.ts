import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { addLine, addToCart, clearCart, getCart, resolveLoginCart, mergeCarts } from "./store";
import { defaultKitConfig } from "@/lib/pricing";

// Regression test for a real production bug: a signed-in customer who simply
// reloaded the page (no clicks, nothing re-added) saw their cart quantity
// multiply — 1 → 4 → 16. Root cause: CartSync's old "merge at most once per
// login" guard was an in-memory variable local to the component's effect
// closure. That guard resets on every fresh mount, i.e. on every full page
// reload, and every fresh mount re-ran `mergeCarts(local, remote)` — which
// SUMS quantities. Once local and remote already agree (post-sync), summing
// them again doubles the cart; React Strict Mode's double effect-invocation
// (dev) doubled it a second time on top of that, giving the observed ×4 per
// reload. `resolveLoginCart` fixes this by persisting the "already synced"
// flag in localStorage — outside any component closure — so it survives both
// a reload and a Strict Mode double-mount.
//
// `resolveLoginCart` checks `typeof window === "undefined"` (mirroring the
// rest of lib/cart/store.ts), so it needs a minimal localStorage stub to
// exercise the persisted path here in vitest's node environment.
function installLocalStorageStub() {
  const data = new Map<string, string>();
  (globalThis as unknown as { window: unknown }).window = {};
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (k: string) => (data.has(k) ? data.get(k)! : null),
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    clear: () => data.clear(),
    key: () => null,
    get length() {
      return data.size;
    },
  } as Storage;
}
function removeLocalStorageStub() {
  delete (globalThis as unknown as { window?: unknown }).window;
  delete (globalThis as unknown as { localStorage?: unknown }).localStorage;
}

describe("resolveLoginCart — merges local+remote at most once per account per device", () => {
  beforeEach(() => {
    clearCart();
    installLocalStorageStub();
  });
  afterEach(() => {
    removeLocalStorageStub();
  });

  it("demonstrates the bug in isolation: summing an already-synced cart with itself doubles it", () => {
    // This is exactly what the old CartSync did on every fresh mount: local
    // and remote already agree post-sync, so summing them is not a no-op.
    const cfg = defaultKitConfig("kit-medio");
    addLine(cfg);
    const alreadySynced = getCart(); // qty 1, and remote (hypothetically) also qty 1
    const reSummed = mergeCarts(alreadySynced, alreadySynced);
    expect(reSummed[0].qty).toBe(2); // <- the doubling, if nothing guards against re-merging
  });

  it("merges local into remote on the first sync for an account", () => {
    addLine(defaultKitConfig("kit-medio")); // guest added 1 before logging in
    const remote: ReturnType<typeof getCart> = []; // brand-new account, empty server cart
    const merged = resolveLoginCart("user-1", remote);
    expect(merged).not.toBeNull();
    expect(merged![0].qty).toBe(1);
  });

  it("skips the merge on a second call for the same account (simulates a page reload)", () => {
    addLine(defaultKitConfig("kit-medio"));
    const firstMerge = resolveLoginCart("user-1", []);
    expect(firstMerge).not.toBeNull();

    // Simulate what happens after login: the merged cart got pushed to the
    // server, so "remote" now equals local. A reload re-mounts CartSync with a
    // fresh in-memory closure but the SAME persisted synced-uid marker.
    const remoteAfterFirstSync = getCart();
    const secondCall = resolveLoginCart("user-1", remoteAfterFirstSync);

    expect(secondCall).toBeNull(); // no merge → no doubling
    expect(getCart()[0].qty).toBe(1); // cart is untouched, still qty 1
  });

  it("stays at qty 1 across many repeated reload-simulations for the same account", () => {
    addLine(defaultKitConfig("kit-medio"));
    resolveLoginCart("user-1", []); // first real sync

    for (let i = 0; i < 10; i++) {
      const remote = getCart();
      const result = resolveLoginCart("user-1", remote); // simulates the 2nd..11th reload
      expect(result).toBeNull();
    }
    expect(getCart()[0].qty).toBe(1);
  });

  it("still merges (once) for a different account on the same device", () => {
    addToCart("kit-medio"); // plain product → lineId is just the productId
    resolveLoginCart("user-1", []);
    expect(getCart()[0].qty).toBe(1);

    // A second account signs in on this device with its own server cart.
    const secondAccountRemote = [{ lineId: "kit-medio", productId: "kit-medio", qty: 3 }];
    const merged = resolveLoginCart("user-2", secondAccountRemote);
    expect(merged).not.toBeNull();
    // user-2's remote (qty 3) sums with whatever local now holds (qty 1) —
    // this is the intended one-time union-merge behavior for a fresh account.
    expect(merged!.find((i) => i.lineId === "kit-medio")?.qty).toBe(4);
  });

  it("claims the sync marker before merging, so a concurrent duplicate call backs off", () => {
    // Models React Strict Mode's double effect-invocation: two "logins" for
    // the same account, back-to-back, before either has pushed to the server.
    addLine(defaultKitConfig("kit-medio"));
    const call1 = resolveLoginCart("user-1", []);
    const call2 = resolveLoginCart("user-1", []); // concurrent duplicate, same stale remote
    expect(call1).not.toBeNull();
    expect(call2).toBeNull(); // backs off — doesn't re-sum
  });
});
