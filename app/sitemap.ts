import type { MetadataRoute } from "next";
import { getPublishedRecipes } from "@/lib/recipes";
import { getKitGuides } from "@/lib/kits";
import { LANGS } from "@/lib/i18n";
import { SITE_URL as BASE, localeAlternates } from "@/lib/seo";

// Locale-agnostic paths for the pages that sell something or tell the story.
// These render and carry their own metadata, but until now none of them was
// listed here: the sitemap only ever looped over recipes, so the shop, the kit
// pages, the gallery and the about page were absent from the one file that
// tells a crawler they exist.
//
// Deliberately NOT listed: "/videor" (a redirect to /recept, so it must not be
// offered as a destination), and the account/checkout routes (varukorg,
// logga-in, min-sida, bestallningar, admin, aterstall) which are private or
// transactional and have no business in the index.
const CONTENT_PATHS = ["/butik", "/kit", "/galleri", "/om-oss"] as const;
const LEGAL_PATHS = ["/villkor", "/integritetspolicy"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const recipes = getPublishedRecipes();
  const guides = getKitGuides();
  const entries: MetadataRoute.Sitemap = [{ url: BASE, changeFrequency: "monthly", priority: 1 }];

  /** One entry per locale for a shared path, each carrying the full alternate set. */
  const addForEveryLocale = (
    path: string,
    priority: number,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
    lastModified?: string,
  ) => {
    for (const lang of LANGS) {
      entries.push({
        url: `${BASE}/${lang}${path}`,
        lastModified,
        changeFrequency,
        priority,
        alternates: { languages: localeAlternates(path, BASE) },
      });
    }
  };

  // The commercial and story pages. Highest priority after the home page:
  // these are the pages that take an order.
  for (const path of CONTENT_PATHS) addForEveryLocale(path, 0.9, "weekly");

  // Per-kit guide pages (/kit/kit-piccolo, and so on).
  for (const g of guides) addForEveryLocale(`/kit/${g.id}`, 0.8, "monthly");

  // Recipe index and details.
  addForEveryLocale("/recept", 0.8, "weekly");
  for (const r of recipes) {
    addForEveryLocale(`/recept/${r.slug}`, 0.7, "monthly", r.allergens.approvedAt || undefined);
  }

  // Real pages, and worth indexing, but never the reason someone arrives.
  for (const path of LEGAL_PATHS) addForEveryLocale(path, 0.2, "yearly");

  return entries;
}
