import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { KitGuideSchema, type KitGuide } from "./schema";

// Swappable data layer for kit build guides — Phase 1 reads local JSON, mirroring
// lib/recipes. A kit without a guide file simply has no companion page (404).
const KITS_DIR = path.join(process.cwd(), "content", "kits");

/** Load and validate every kit guide. Throws on invalid data (fails the build). */
export function getKitGuides(): KitGuide[] {
  if (!existsSync(KITS_DIR)) return [];
  const files = readdirSync(KITS_DIR).filter((f) => f.endsWith(".json"));
  return files.map((file) => {
    const raw = JSON.parse(readFileSync(path.join(KITS_DIR, file), "utf8"));
    const result = KitGuideSchema.safeParse(raw);
    if (!result.success) {
      throw new Error(`Invalid kit guide "${file}":\n${result.error.message}`);
    }
    return result.data;
  });
}

export function getKitGuide(id: string): KitGuide | null {
  return getKitGuides().find((g) => g.id === id) ?? null;
}
