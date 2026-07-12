"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  hydrateCart,
  pushCartNow,
  resolveLoginCart,
  setCartAuthUser,
  type CartItem,
} from "@/lib/cart/store";

/** Mounted globally (next to AutoSync). Keeps the cart in sync with the
 *  customer's account so it follows them across browsers/devices.
 *  - On login: merge the device-local cart with the server cart (union by
 *    lineId, summing qty on identical configs) — but only the first time this
 *    device syncs this account; see `resolveLoginCart` for why a plain
 *    in-memory dedupe isn't enough (it doesn't survive a page reload, which
 *    would otherwise re-sum an already-synced cart and double it every time).
 *  - On any mutation while signed in: the store write-through upserts (debounced).
 *  - On logout: fall back to the local cart. Guests are unaffected.
 *  All server calls are best-effort — a failure leaves the local cart intact. */
export function CartSync() {
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    let running = false;

    const onLogin = async (userId: string) => {
      setCartAuthUser(userId);
      if (running) return;
      running = true;
      try {
        const { data } = await supabase.from("carts").select("items").eq("user_id", userId).maybeSingle();
        const remote = (data?.items as CartItem[] | undefined) ?? [];
        const merged = resolveLoginCart(userId, remote);
        if (merged) {
          hydrateCart(merged); // server is source of truth, merged with local additions
          await pushCartNow(); // converge the account row to the merged cart
        }
      } catch {
        /* offline / not ready — write-through will catch up on the next change */
      } finally {
        running = false;
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) void onLogin(session.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setCartAuthUser(null); // back to local-only; keep the current cart
      } else {
        void onLogin(session.user.id);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return null;
}
