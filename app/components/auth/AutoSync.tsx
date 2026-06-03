"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getUserData, mergeRemote } from "@/lib/userdata/store";

type Row = { slug: string };
type HistRow = { slug: string; cooked_at: string };

/** Mounted globally. On login it pulls account data into the local store (so
 *  it shows across devices) and pushes any guest data up — additively, never
 *  deleting. After that, the store's write-through keeps the account current. */
export function AutoSync() {
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    let running = false;

    const sync = async (userId: string) => {
      if (running) return;
      running = true;
      try {
        const [f, w, n, h, p] = await Promise.all([
          supabase.from("favorites").select("slug"),
          supabase.from("wishlist").select("slug"),
          supabase.from("notes").select("slug, body"),
          supabase.from("cooking_history").select("slug, cooked_at"),
          supabase
            .from("profiles")
            .select("full_name, address, diet, allergies, consent_ai")
            .eq("id", userId)
            .maybeSingle(),
        ]);

        const remoteHistory = ((h.data as HistRow[]) ?? []).map((r) => ({ slug: r.slug, cookedAt: r.cooked_at }));
        const notesObj: Record<string, string> = {};
        ((n.data as { slug: string; body: string }[]) ?? []).forEach((r) => (notesObj[r.slug] = r.body));
        const prof = p.data as
          | { full_name: string | null; address: string | null; diet: string[]; allergies: string[]; consent_ai: boolean }
          | null;

        mergeRemote({
          favorites: ((f.data as Row[]) ?? []).map((r) => r.slug),
          wishlist: ((w.data as Row[]) ?? []).map((r) => r.slug),
          notes: notesObj,
          history: remoteHistory,
          profile: prof
            ? {
                fullName: prof.full_name ?? "",
                address: prof.address ?? "",
                diet: (prof.diet ?? []) as never,
                allergies: (prof.allergies ?? []) as never,
                consentAi: prof.consent_ai ?? false,
              }
            : undefined,
        });

        // Push guest/local-only data up (additive).
        const d = getUserData();
        const remoteFav = new Set(((f.data as Row[]) ?? []).map((r) => r.slug));
        const remoteWish = new Set(((w.data as Row[]) ?? []).map((r) => r.slug));
        const histSeen = new Set(remoteHistory.map((x) => `${x.slug}|${x.cookedAt}`));
        const newFav = d.favorites.filter((s) => !remoteFav.has(s)).map((slug) => ({ user_id: userId, slug }));
        const newWish = d.wishlist.filter((s) => !remoteWish.has(s)).map((slug) => ({ user_id: userId, slug }));
        const noteRows = Object.entries(d.notes).map(([slug, body]) => ({ user_id: userId, slug, body }));
        const newHist = d.history
          .filter((x) => !histSeen.has(`${x.slug}|${x.cookedAt}`))
          .map((x) => ({ user_id: userId, slug: x.slug, cooked_at: x.cookedAt }));

        await Promise.all([
          newFav.length ? supabase.from("favorites").upsert(newFav, { onConflict: "user_id,slug", ignoreDuplicates: true }) : null,
          newWish.length ? supabase.from("wishlist").upsert(newWish, { onConflict: "user_id,slug", ignoreDuplicates: true }) : null,
          noteRows.length ? supabase.from("notes").upsert(noteRows, { onConflict: "user_id,slug" }) : null,
          newHist.length ? supabase.from("cooking_history").insert(newHist) : null,
          supabase.from("profiles").upsert({
            id: userId,
            full_name: d.profile.fullName,
            address: d.profile.address,
            diet: d.profile.diet,
            allergies: d.profile.allergies,
            consent_ai: d.profile.consentAi,
          }),
        ]);
      } catch {
        /* offline / not ready — write-through will catch up later */
      } finally {
        running = false;
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) void sync(session.user.id);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) void sync(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  return null;
}
