import { describe, it, expect, beforeEach } from "vitest";
import {
  toggleFavorite,
  toggleWishlist,
  saveNote,
  isMade,
  toggleMade,
  setProfile,
  toggleAllergy,
  toggleDiet,
  clearFilters,
  mergeRemote,
  exportAll,
  importAll,
  getUserData,
  type UserData,
} from "./store";

// Like the cart store, this module keeps state in a module-level `cache` when
// `window` is undefined (vitest's node environment), so it's testable without
// jsdom. importAll("{}") resets to the exported DEFAULT shape between tests.
beforeEach(() => {
  importAll("{}");
});

describe("toggleFavorite / toggleWishlist", () => {
  it("adds on first toggle, removes on second", () => {
    toggleFavorite("lotus-tarta");
    expect(getUserData().favorites).toEqual(["lotus-tarta"]);
    toggleFavorite("lotus-tarta");
    expect(getUserData().favorites).toEqual([]);
  });

  it("wishlist toggles independently of favorites", () => {
    toggleWishlist("lotus-tarta");
    expect(getUserData().wishlist).toEqual(["lotus-tarta"]);
    expect(getUserData().favorites).toEqual([]);
  });
});

describe("saveNote", () => {
  it("stores a note keyed by slug", () => {
    saveNote("lotus-tarta", "Extra vanilj nästa gång");
    expect(getUserData().notes["lotus-tarta"]).toBe("Extra vanilj nästa gång");
  });

  it("deletes the note when saved as blank/whitespace", () => {
    saveNote("lotus-tarta", "note");
    saveNote("lotus-tarta", "   ");
    expect(getUserData().notes["lotus-tarta"]).toBeUndefined();
  });
});

describe("isMade / toggleMade", () => {
  it("is false until toggled on", () => {
    expect(isMade(getUserData(), "lotus-tarta")).toBe(false);
    toggleMade("lotus-tarta");
    expect(isMade(getUserData(), "lotus-tarta")).toBe(true);
  });

  it("toggling again clears it (binary, not a growing log)", () => {
    toggleMade("lotus-tarta");
    toggleMade("lotus-tarta");
    expect(isMade(getUserData(), "lotus-tarta")).toBe(false);
    expect(getUserData().history).toEqual([]);
  });
});

describe("setProfile / toggleAllergy / toggleDiet / clearFilters", () => {
  it("setProfile patches only the given fields", () => {
    setProfile({ fullName: "Asal" });
    expect(getUserData().profile.fullName).toBe("Asal");
    expect(getUserData().profile.phone).toBe("");
  });

  it("toggleAllergy adds then removes a code", () => {
    toggleAllergy("gluten");
    expect(getUserData().profile.allergies).toEqual(["gluten"]);
    toggleAllergy("gluten");
    expect(getUserData().profile.allergies).toEqual([]);
  });

  it("toggleDiet adds then removes a tag", () => {
    toggleDiet("vegan");
    expect(getUserData().profile.diet).toEqual(["vegan"]);
    toggleDiet("vegan");
    expect(getUserData().profile.diet).toEqual([]);
  });

  it("clearFilters resets both diet and allergies but leaves the rest of the profile", () => {
    setProfile({ fullName: "Asal" });
    toggleDiet("vegan");
    toggleAllergy("milk");
    clearFilters();
    expect(getUserData().profile.diet).toEqual([]);
    expect(getUserData().profile.allergies).toEqual([]);
    expect(getUserData().profile.fullName).toBe("Asal");
  });
});

describe("mergeRemote — additive union, never deletes local state", () => {
  it("unions favorites/wishlist without duplicating", () => {
    toggleFavorite("a");
    mergeRemote({ favorites: ["a", "b"] });
    expect(getUserData().favorites.sort()).toEqual(["a", "b"]);
  });

  it("unions diet/allergy tags from both sides", () => {
    toggleDiet("vegan");
    mergeRemote({ profile: { diet: ["vegetarian"] } as unknown as UserData["profile"] });
    expect(getUserData().profile.diet.sort()).toEqual(["vegan", "vegetarian"]);
  });

  it("local notes win over remote notes on the same slug", () => {
    saveNote("lotus-tarta", "local note");
    mergeRemote({ notes: { "lotus-tarta": "remote note", "other-slug": "remote only" } });
    expect(getUserData().notes["lotus-tarta"]).toBe("local note");
    expect(getUserData().notes["other-slug"]).toBe("remote only");
  });

  it("dedupes history entries by slug+cookedAt", () => {
    mergeRemote({ history: [{ slug: "a", cookedAt: "2026-01-01" }] });
    mergeRemote({ history: [{ slug: "a", cookedAt: "2026-01-01" }, { slug: "b", cookedAt: "2026-01-02" }] });
    expect(getUserData().history).toEqual([
      { slug: "a", cookedAt: "2026-01-01" },
      { slug: "b", cookedAt: "2026-01-02" },
    ]);
  });
});

describe("exportAll / importAll", () => {
  it("round-trips the current state", () => {
    setProfile({ fullName: "Asal" });
    toggleFavorite("lotus-tarta");
    const json = exportAll();
    importAll("{}"); // reset
    expect(getUserData().favorites).toEqual([]);
    const ok = importAll(json);
    expect(ok).toBe(true);
    expect(getUserData().profile.fullName).toBe("Asal");
    expect(getUserData().favorites).toEqual(["lotus-tarta"]);
  });

  it("returns false and leaves state untouched on malformed JSON", () => {
    setProfile({ fullName: "Asal" });
    const ok = importAll("{not valid json");
    expect(ok).toBe(false);
    expect(getUserData().profile.fullName).toBe("Asal");
  });

  it("fills in missing top-level fields from the default shape", () => {
    const ok = importAll(JSON.stringify({ favorites: ["x"] }));
    expect(ok).toBe(true);
    expect(getUserData().favorites).toEqual(["x"]);
    expect(getUserData().wishlist).toEqual([]);
    expect(getUserData().profile.fullName).toBe("");
  });
});
