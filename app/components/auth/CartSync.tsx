"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  getCart,
  hydrateCart,
  mergeCarts,
  pushCartNow,
  setCartAuthUser,
  type CartItem,
} from "@/lib/cart/store";

/** Mounted globally (next to AutoSync). Keeps the cart in sync with the
 *  customer's account so it follows them across browsers/devices.
 *  - On login: merge the device-local cart with the server cart (union by
 *    lineId, summing qty on identical configs), adopt the merged result, and
 *    write it back so both sides converge.
 *  - On any mutation while signed in: the store write-through upserts (debounced).
 *  - On logout: fall back to the local cart. Guests are unaffected.
 *  All server calls are best-effort — a failure leaves the local cart intact. */
export function CartSync() {
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    // The merge sums quantities, so it must run at most once per login — auth
    // events fire more than once (getSession + INITIAL_SESSION + refreshes) and
    // a second merge would double the cart. Dedupe by user id.
    let mergedUserId: string | null = null;
    let running = false;

    const onLogin = async (userId: string) => {
      setCartAuthUser(userId);
      if (mergedUserId === userId || running) return;
      running = true;
      try {
        const { data } = await supabase.from("carts").select("items").eq("user_id", userId).maybeSingle();
        const remote = (data?.items as CartItem[] | undefined) ?? [];
        const merged = mergeCarts(getCart(), remote);
        hydrateCart(merged); // server is source of truth, merged with local additions
        mergedUserId = userId;
        await pushCartNow(); // converge the account row to the merged cart
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
        mergedUserId = null;
      } else {
        void onLogin(session.user.id);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return null;
}
