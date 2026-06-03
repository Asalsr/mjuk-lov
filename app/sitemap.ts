import type { MetadataRoute } from "next";
import { getPublishedRecipes } from "@/lib/recipes";
import { LANGS } from "@/lib/i18n";

const BASE = "https://mjuklov.se";

export default function sitemap(): MetadataRoute.Sitemap {
  const recipes = getPublishedRecipes();
  const entries: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: "monthly", priority: 1 },
  ];

  // Recipe index, one canonical entry per language with hreflang alternates.
  for (const lang of LANGS) {
    entries.push({
      url: `${BASE}/${lang}/recept`,
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: { languages: { sv: `${BASE}/sv/recept`, en: `${BASE}/en/recept` } },
    });
  }

  // Recipe detail pages.
  for (const lang of LANGS) {
    for (const r of recipes) {
      entries.push({
        url: `${BASE}/${lang}/recept/${r.slug}`,
        lastModified: r.allergens.approvedAt || undefined,
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: {
          languages: {
            sv: `${BASE}/sv/recept/${r.slug}`,
            en: `${BASE}/en/recept/${r.slug}`,
          },
        },
      });
    }
  }

  return entries;
}
