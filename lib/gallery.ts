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
 *
 * The files themselves are Adobe-exported SVGs wrapping one embedded raster
 * photo, with filenames that may contain spaces — `<Gallery>` renders them
 * through a plain `<img src={encodeURI(...)}>`, not `next/image` (which
 * refuses to optimize SVG), matching the `ProductImageCarousel` convention
 * used for the shop's menu photos.
 */
export const GALLERY_IMAGES: GalleryImage[] = [
  {
    src: "/gallery/DIY kit - piccolo.svg",
    alt: { sv: "DIY Piccolo, ett litet tårtkit att dekorera själv", en: "DIY Piccolo, a little cake kit to decorate yourself", fa: "کیت DIY Piccolo، کیک کوچکی برای تزیین توسط خودتان" },
  },
  {
    src: "/gallery/DIY kit - medio.svg",
    alt: { sv: "DIY Medio, tårtkitet för sex till åtta", en: "DIY Medio, the cake kit for six to eight", fa: "کیت DIY Medio، برای شش تا هشت نفر" },
  },
  {
    src: "/gallery/DIY kit - grande.svg",
    alt: { sv: "DIY Grande, det stora tårtkitet", en: "DIY Grande, the big cake kit", fa: "کیت DIY Grande، کیت بزرگ کیک" },
  },
  {
    src: "/gallery/dyi party.svg",
    alt: { sv: "DIY-festpaket, en liten tårta per gäst", en: "DIY party pack, one little cake per guest", fa: "بسته جشن DIY، یک کیک کوچک برای هر مهمان" },
  },
  {
    src: "/gallery/lotus cake (1).svg",
    alt: { sv: "Lotustårta, hel", en: "Lotus cake, whole", fa: "کیک لوتوس، کامل" },
  },
  {
    src: "/gallery/lotus cake (2) (1).svg",
    alt: { sv: "Lotustårta, närbild", en: "Lotus cake, close-up", fa: "کیک لوتوس، نمای نزدیک" },
  },
  {
    src: "/gallery/lotus cake slice (1).svg",
    alt: { sv: "Lotustårta, uppskuren skiva", en: "Lotus cake, cut slice", fa: "کیک لوتوس، برش" },
  },
  {
    src: "/gallery/blue berry tiramisu - blumisu.svg",
    alt: { sv: "Blusmisu, blåbärstiramisu på burk", en: "Blusmisu, blueberry tiramisu in a jar", fa: "Blusmisu، تیرامیسوی بلوبری در شیشه" },
  },
  {
    src: "/gallery/blue berry tiramisu - blumisu (1).svg",
    alt: { sv: "Blusmisu, blåbärstiramisu på burk", en: "Blusmisu, blueberry tiramisu in a jar", fa: "Blusmisu، تیرامیسوی بلوبری در شیشه" },
  },
  {
    src: "/gallery/blue berry tiramisu - blumisu (2) (1).svg",
    alt: { sv: "Blusmisu, blåbärstiramisu på burk", en: "Blusmisu, blueberry tiramisu in a jar", fa: "Blusmisu، تیرامیسوی بلوبری در شیشه" },
  },
  {
    src: "/gallery/lemon tiramisu - lemomisu (1).svg",
    alt: { sv: "Lemomisu, citrontiramisu på burk", en: "Lemomisu, lemon tiramisu in a jar", fa: "Lemomisu، تیرامیسوی لیمو در شیشه" },
  },
  {
    src: "/gallery/lemon tiramisu - lemomisu (2).svg",
    alt: { sv: "Lemomisu, citrontiramisu på burk", en: "Lemomisu, lemon tiramisu in a jar", fa: "Lemomisu، تیرامیسوی لیمو در شیشه" },
  },
  {
    src: "/gallery/lemon cake (2).svg",
    alt: { sv: "Citronkaka, toppad med blåbär och citron", en: "Lemon cake, finished with blueberry and lemon", fa: "کیک لیمو با تزیین بلوبری و لیمو" },
  },
  {
    src: "/gallery/lemon cake (3).svg",
    alt: { sv: "Citronkaka, hel kaka", en: "Lemon cake, whole", fa: "کیک لیمو، کامل" },
  },
  {
    src: "/gallery/brownies.svg",
    alt: { sv: "Brownie, toppad med grädde och chokladbitar", en: "Brownie, finished with cream and chocolate pieces", fa: "براونی با تزیین خامه و تکه‌های شکلات" },
  },
  {
    src: "/gallery/brownies (2).svg",
    alt: { sv: "Brownie, hel kaka", en: "Brownie, whole", fa: "براونی، کامل" },
  },
  {
    src: "/gallery/brownies cut.svg",
    alt: { sv: "Brownie, uppskuren", en: "Brownie, cut into pieces", fa: "براونی، برش‌خورده" },
  },
  {
    src: "/gallery/apple blondie.svg",
    alt: { sv: "Äppelblondie, hel kaka", en: "Apple blondie, whole", fa: "بلوندی سیب، کامل" },
  },
  {
    src: "/gallery/apple blondie slice.svg",
    alt: { sv: "Äppelblondie, uppskuren skiva", en: "Apple blondie, cut slice", fa: "بلوندی سیب، برش" },
  },
  {
    src: "/gallery/chocolate cake.svg",
    alt: { sv: "Chokladtårta", en: "Chocolate cake", fa: "کیک شکلاتی" },
  },
  {
    src: "/gallery/chocolate cake (1).svg",
    alt: { sv: "Chokladtårta, närbild", en: "Chocolate cake, close-up", fa: "کیک شکلاتی، نمای نزدیک" },
  },
  {
    src: "/gallery/chocolate cake (2) (1).svg",
    alt: { sv: "Chokladtårta, hel", en: "Chocolate cake, whole", fa: "کیک شکلاتی، کامل" },
  },
  {
    src: "/gallery/chocolate cake (3) (1).svg",
    alt: { sv: "Chokladtårta, dekorerad", en: "Chocolate cake, decorated", fa: "کیک شکلاتی، تزیین‌شده" },
  },
  {
    src: "/gallery/chocolate cake (4).svg",
    alt: { sv: "Chokladtårta, uppskuren bit", en: "Chocolate cake, cut slice", fa: "کیک شکلاتی، برش" },
  },
  {
    src: "/gallery/chocolate cake (4) (1).svg",
    alt: { sv: "Chokladtårta, uppskuren bit", en: "Chocolate cake, cut slice", fa: "کیک شکلاتی، برش" },
  },
];

/** The first `n` images, for the compact home-page teaser. */
export const galleryTeaser = (n = 6): GalleryImage[] => GALLERY_IMAGES.slice(0, n);
