// Shared SEO primitives: the canonical origin, the BCP-47 tag per locale, and
// the hreflang alternate set.
//
// Why this file exists: the alternate map used to be written out by hand in
// every route's generateMetadata and again in the sitemap. Several of those
// copies listed only sv and en, so the entire Persian locale was emitted as
// <loc> entries that nothing ever declared as an alternate. Building the map
// from LANGS means a fourth locale (or a fixed fa) lands everywhere at once and
// a locale cannot be silently dropped from one route.
import { LANGS, type Lang } from "@/lib/i18n";

export const SITE_URL = "https://mjuklov.se";

/** BCP-47 language tag per locale. Swedish is unambiguously Sweden (sv-SE);
 *  en and fa stay region-neutral because the audience for both is diaspora and
 *  international, not one country. */
export const LOCALE_TAG: Record<Lang, string> = { sv: "sv-SE", en: "en", fa: "fa" };

/** The locale a bare, unmatched request should land on. */
export const DEFAULT_LANG: Lang = "sv";

/**
 * hreflang alternates for one locale-agnostic path, e.g. "/kit" or
 * "/recept/rabarberpaj". Returns every locale keyed by its BCP-47 tag, plus
 * `x-default` pointing at the Swedish page.
 *
 * Pass `origin` (SITE_URL) for the sitemap, which needs absolute URLs. Route
 * metadata omits it and lets `metadataBase` resolve the root-relative paths.
 */
export function localeAlternates(path: string, origin = ""): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const lang of LANGS) languages[LOCALE_TAG[lang]] = `${origin}/${lang}${path}`;
  languages["x-default"] = `${origin}/${DEFAULT_LANG}${path}`;
  return languages;
}

/**
 * The `alternates` block for a route's generateMetadata: a self-referencing
 * canonical plus the full hreflang set.
 */
export function pageAlternates(lang: Lang, path: string) {
  return { canonical: `/${lang}${path}`, languages: localeAlternates(path) };
}
