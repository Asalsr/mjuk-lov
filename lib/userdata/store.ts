import { useSyncExternalStore } from "react";
import type { AllergenCode, DietTag, Recipe } from "@/lib/recipes/schema";

// Device-local user data. This is the swappable layer: Phase 2 replaces read/
// write with Supabase calls keyed to the logged-in user, and exportAll/importAll
// become the migration path (push local data into the account on first login).

export type UserData = {
  profile: {
    diet: DietTag[];
    allergies: AllergenCode[]; // allergens to avoid
    consentAi: boolean; // GDPR: may we send diet/allergy data to the AI (M4)
  };
  favorites: string[]; // recipe slugs
  notes: Record<string, string>; // slug -> personal note
  history: { slug: string; cookedAt: string }[];
  myRecipes: Recipe[]; // reserved for the user's own recipes (future)
};

const KEY = "mjuklov_userdata";

const DEFAULT: UserData = {
  profile: { diet: [], allergies: [], consentAi: false },
  favorites: [],
  notes: {},
  history: [],
  myRecipes: [],
};

// --- cached snapshot so useSyncExternalStore stays referentially stable -------
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
      /* quota / private mode — ignore */
    }
  }
  emit();
}

// --- subscription (in-app + cross-tab) ---------------------------------------
const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null; // another tab changed it — re-read on next snapshot
      emit();
    }
  };
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

/** Reactive read of the whole user-data object. */
export function useUserData(): UserData {
  return useSyncExternalStore(subscribe, read, () => DEFAULT);
}

// --- actions (immutable updates → new reference → re-render) -----------------
export function toggleFavorite(slug: string) {
  const d = read();
  const favorites = d.favorites.includes(slug)
    ? d.favorites.filter((s) => s !== slug)
    : [...d.favorites, slug];
  write({ ...d, favorites });
}

export function saveNote(slug: string, text: string) {
  const d = read();
  const notes = { ...d.notes };
  if (text.trim() === "") delete notes[slug];
  else notes[slug] = text;
  write({ ...d, notes });
}

export function logCooked(slug: string, cookedAt: string) {
  const d = read();
  write({ ...d, history: [...d.history, { slug, cookedAt }] });
}

export function cookedCount(d: UserData, slug: string): number {
  return d.history.filter((h) => h.slug === slug).length;
}

export function setProfile(patch: Partial<UserData["profile"]>) {
  const d = read();
  write({ ...d, profile: { ...d.profile, ...patch } });
}

export function toggleAllergy(code: AllergenCode) {
  const d = read();
  const allergies = d.profile.allergies.includes(code)
    ? d.profile.allergies.filter((c) => c !== code)
    : [...d.profile.allergies, code];
  setProfile({ allergies });
}

export function toggleDiet(tag: DietTag) {
  const d = read();
  const diet = d.profile.diet.includes(tag)
    ? d.profile.diet.filter((t) => t !== tag)
    : [...d.profile.diet, tag];
  setProfile({ diet });
}

export function clearFilters() {
  setProfile({ diet: [], allergies: [] });
}

// --- backup / migration ------------------------------------------------------
export function exportAll(): string {
  return JSON.stringify(read(), null, 2);
}

export function importAll(json: string): boolean {
  try {
    const parsed = JSON.parse(json);
    write({
      ...DEFAULT,
      ...parsed,
      profile: { ...DEFAULT.profile, ...(parsed.profile ?? {}) },
    });
    return true;
  } catch {
    return false;
  }
}
