import { useSyncExternalStore } from "react";
import type { AllergenCode, DietTag, Recipe } from "@/lib/recipes/schema";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";

// Device-local user data with write-through to Supabase when logged in.
// Guests use localStorage only; on login the AutoSync component pulls/merges the
// account data, and from then on every action persists to the account too.

export type UserData = {
  profile: {
    fullName: string;
    phone: string; // default receiver number
    address: string; // legacy free-text address (superseded by the address book)
    diet: DietTag[];
    allergies: AllergenCode[]; // allergens to avoid
    consentAi: boolean; // GDPR: may we send diet/allergy data to the AI
  };
  favorites: string[]; // "likes" — recipe slugs
  wishlist: string[]; // recipes to try later
  notes: Record<string, string>; // slug -> personal note
  history: { slug: string; cookedAt: string }[];
  myRecipes: Recipe[];
};

const KEY = "mjuklov_userdata";

const DEFAULT: UserData = {
  profile: { fullName: "", phone: "", address: "", diet: [], allergies: [], consentAi: false },
  favorites: [],
  wishlist: [],
  notes: {},
  history: [],
  myRecipes: [],
};

// --- cached snapshot for useSyncExternalStore --------------------------------
let cache: UserData | null = null;

function read(): UserData {
  if (cache) return cache;
  if (typeof window === "undefined") return DEFAULT;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "{}");
    cache = {
      ...DEFAULT,
      ...parsed,
      profile: { ...DEFAULT.profile, ...(parsed.profile ?? {}) },
    };
  } catch {
    cache = DEFAULT;
  }
  return cache!;
}

function write(next: UserData) {
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

export function useUserData(): UserData {
  return useSyncExternalStore(subscribe, read, () => DEFAULT);
}

export function getUserData(): UserData {
  return read();
}

/** Subscribe to local changes (used by AutoSync). */
export function subscribeUserData(cb: () => void): () => void {
  return subscribe(cb);
}

// --- Supabase write-through (fire-and-forget; no-ops for guests) -------------
let _sb: ReturnType<typeof createClient> | null = null;
function sb() {
  if (!isSupabaseConfigured) return null;
  if (!_sb) _sb = createClient();
  return _sb;
}

async function withUser<T>(fn: (supabase: NonNullable<ReturnType<typeof sb>>, userId: string) => Promise<T>) {
  try {
    const supabase = sb();
    if (!supabase) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    await fn(supabase, session.user.id);
  } catch {
    /* offline / RLS / not-logged-in — local stays the source of truth */
  }
}

function persistFavorite(slug: string, on: boolean) {
  void withUser(async (s, uid) => {
    if (on) await s.from("favorites").upsert({ user_id: uid, slug }, { onConflict: "user_id,slug", ignoreDuplicates: true });
    else await s.from("favorites").delete().eq("user_id", uid).eq("slug", slug);
  });
}
function persistWishlist(slug: string, on: boolean) {
  void withUser(async (s, uid) => {
    if (on) await s.from("wishlist").upsert({ user_id: uid, slug }, { onConflict: "user_id,slug", ignoreDuplicates: true });
    else await s.from("wishlist").delete().eq("user_id", uid).eq("slug", slug);
  });
}
function persistNote(slug: string, body: string) {
  void withUser(async (s, uid) => {
    if (body.trim() === "") await s.from("notes").delete().eq("user_id", uid).eq("slug", slug);
    else await s.from("notes").upsert({ user_id: uid, slug, body }, { onConflict: "user_id,slug" });
  });
}
function persistMade(slug: string, made: boolean) {
  void withUser(async (s, uid) => {
    // "Made it" is binary: at most one row per recipe.
    await s.from("cooking_history").delete().eq("user_id", uid).eq("slug", slug);
    if (made) await s.from("cooking_history").insert({ user_id: uid, slug, cooked_at: new Date().toISOString() });
  });
}
function persistProfile(p: UserData["profile"]) {
  void withUser(async (s, uid) => {
    await s.from("profiles").upsert({
      id: uid,
      full_name: p.fullName,
      phone: p.phone,
      address: p.address,
      diet: p.diet,
      allergies: p.allergies,
      consent_ai: p.consentAi,
    });
  });
}

// --- actions (local write + write-through) -----------------------------------
export function toggleFavorite(slug: string) {
  const d = read();
  const has = d.favorites.includes(slug);
  write({ ...d, favorites: has ? d.favorites.filter((s) => s !== slug) : [...d.favorites, slug] });
  persistFavorite(slug, !has);
}

export function toggleWishlist(slug: string) {
  const d = read();
  const has = d.wishlist.includes(slug);
  write({ ...d, wishlist: has ? d.wishlist.filter((s) => s !== slug) : [...d.wishlist, slug] });
  persistWishlist(slug, !has);
}

export function saveNote(slug: string, text: string) {
  const d = read();
  const notes = { ...d.notes };
  if (text.trim() === "") delete notes[slug];
  else notes[slug] = text;
  write({ ...d, notes });
  persistNote(slug, text);
}

export function isMade(d: UserData, slug: string): boolean {
  return d.history.some((h) => h.slug === slug);
}

/** Binary "made it" toggle — marks the recipe made, or clears it. */
export function toggleMade(slug: string) {
  const d = read();
  const made = isMade(d, slug);
  const history = made
    ? d.history.filter((h) => h.slug !== slug)
    : [...d.history, { slug, cookedAt: new Date().toISOString() }];
  write({ ...d, history });
  persistMade(slug, !made);
}

export function setProfile(patch: Partial<UserData["profile"]>) {
  const d = read();
  const profile = { ...d.profile, ...patch };
  write({ ...d, profile });
  persistProfile(profile);
}

export function toggleAllergy(code: AllergenCode) {
  const d = read();
  setProfile({
    allergies: d.profile.allergies.includes(code)
      ? d.profile.allergies.filter((c) => c !== code)
      : [...d.profile.allergies, code],
  });
}

export function toggleDiet(tag: DietTag) {
  const d = read();
  setProfile({
    diet: d.profile.diet.includes(tag) ? d.profile.diet.filter((t) => t !== tag) : [...d.profile.diet, tag],
  });
}

export function clearFilters() {
  setProfile({ diet: [], allergies: [] });
}

/** Merge account data (pulled on login) into the local store — additive, no deletes. */
export function mergeRemote(remote: Partial<UserData>) {
  const d = read();
  const union = (a: string[], b: string[] = []) => Array.from(new Set([...a, ...b]));
  const seen = new Set(d.history.map((h) => `${h.slug}|${h.cookedAt}`));
  const mergedHistory = [
    ...d.history,
    ...(remote.history ?? []).filter((h) => !seen.has(`${h.slug}|${h.cookedAt}`)),
  ];
  write({
    ...d,
    profile: {
      ...d.profile,
      ...remote.profile,
      // keep local sets as a union so nothing the guest set is lost
      diet: union(d.profile.diet, remote.profile?.diet) as DietTag[],
      allergies: union(d.profile.allergies, remote.profile?.allergies) as AllergenCode[],
    },
    favorites: union(d.favorites, remote.favorites),
    wishlist: union(d.wishlist, remote.wishlist),
    notes: { ...remote.notes, ...d.notes },
    history: mergedHistory,
  });
}

// --- backup / migration ------------------------------------------------------
export function exportAll(): string {
  return JSON.stringify(read(), null, 2);
}
export function importAll(json: string): boolean {
  try {
    const parsed = JSON.parse(json);
    write({ ...DEFAULT, ...parsed, profile: { ...DEFAULT.profile, ...(parsed.profile ?? {}) } });
    return true;
  } catch {
    return false;
  }
}
