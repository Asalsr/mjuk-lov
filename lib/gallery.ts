import type { Lang } from "@/lib/i18n";

/** One photo in the product gallery. Image files live in `public/gallery/`;
 *  reference them by their path under /public (e.g. `/gallery/saffran.jpg`).
 *  `alt` is bilingual so every locale — including Persian (RTL) — describes the
 *  image correctly for screen readers. */
export interface GalleryImage {
  /** Path under /public, e.g. "/gallery/saffransbulle.jpg". */
  src: string;
  /** Accessible description per locale (sv / en / fa). */
  alt: Record<Lang, string>;
}

/**
 * The product gallery — single source of truth for both the home-page teaser
 * and the full /galleri route.
 *
 * To add a photo:
 *   1. Drop a roughly-square image into `public/gallery/` (tiles render 1:1).
 *   2. Append an entry below with its path and a short bilingual `alt`.
 *
 * Order here is display order; the home teaser shows the first few (see
 * `galleryTeaser`). While this list is empty the gallery shows its localized
 * "coming soon" empty state.
 *
 * (A client component — the home page — can't read the filesystem, so this
 *  typed manifest is the shared source rather than a directory glob. It also
 *  lets each image carry real alt text, which a bare file listing can't.)
 */
export const GALLERY_IMAGES: GalleryImage[] = [];

/** The first `n` images, for the compact home-page teaser. */
export const galleryTeaser = (n = 6): GalleryImage[] => GALLERY_IMAGES.slice(0, n);
