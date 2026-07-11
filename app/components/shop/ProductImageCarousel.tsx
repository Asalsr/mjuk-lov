"use client";

import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import { ui, locNum, type Lang } from "@/lib/i18n";

/**
 * Photo carousel for the Cakes & Bakes cards. It mirrors `ProductImage`'s frame
 * — full width, a fixed aspect ratio, `object-cover`, square corners (the site
 * runs `--radius: 0`), and a `--soft-peach` backdrop — so the menu cards match
 * the rest of the shop. Unlike `ProductImage` it uses a plain `<img>`, because
 * our gallery files are SVG and `next/image` refuses SVG without
 * `dangerouslyAllowSVG`; and it holds several photos.
 *
 * One photo → a single framed image. Several → a cross-fading slideshow with
 * prev/next controls and dot indicators. Autoplay is JS-driven motion, so it is
 * gated by `usePrefersReducedMotion` and paused while the card is hovered or
 * focused (§3). The active dot carries `aria-current` (a non-colour cue).
 */
export function ProductImageCarousel({
  images,
  alt,
  lang,
  aspect = "4/5",
}: {
  images: string[];
  alt: string;
  lang: Lang;
  aspect?: string;
}) {
  const t = ui[lang];
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  // Files whose src 404'd (the gallery filenames drift). A failed slide falls
  // back to the --soft-peach placeholder + camera glyph, never a broken icon.
  const [failed, setFailed] = useState<Record<number, true>>({});
  const n = images.length;

  const go = (next: number) => setIndex(((next % n) + n) % n);

  // Autoplay only with multiple photos, when motion is allowed, and while the
  // card isn't being hovered or focused.
  useEffect(() => {
    if (n < 2 || reduced || paused) return;
    const id = window.setInterval(() => setIndex((c) => (c + 1) % n), 5000);
    return () => window.clearInterval(id);
  }, [n, reduced, paused]);

  const boxStyle: React.CSSProperties = { aspectRatio: aspect, backgroundColor: "var(--soft-peach)" };
  const navBtn =
    "absolute top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center type-serif " +
    "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity";
  const navStyle: React.CSSProperties = {
    backgroundColor: "var(--vanilla-cream)",
    border: "1px solid var(--warm-cocoa)",
    lineHeight: 1,
  };

  return (
    <div
      className="relative w-full overflow-hidden mb-4 group"
      style={boxStyle}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      {...(n > 1 ? { role: "group", "aria-roledescription": "carousel", "aria-label": alt } : {})}
    >
      {/* Placeholder base layer — shows through when the active slide is missing. */}
      <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <CameraGlyph />
      </div>

      {images.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={encodeURI(src)}
          alt={n > 1 ? `${alt} · ${t.photo} ${locNum(i + 1, lang)}/${locNum(n, lang)}` : alt}
          loading="lazy"
          aria-hidden={i !== index}
          onError={() => setFailed((f) => ({ ...f, [i]: true }))}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
          style={{ opacity: i === index && !failed[i] ? 1 : 0 }}
        />
      ))}

      {n > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label={t.prevPhoto}
            className={`${navBtn} start-2`}
            style={navStyle}
          >
            {/* RTL-safe chevrons: flip with the writing direction */}
            <span className="rtl:hidden">‹</span>
            <span className="hidden rtl:inline">›</span>
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label={t.nextPhoto}
            className={`${navBtn} end-2`}
            style={navStyle}
          >
            <span className="rtl:hidden">›</span>
            <span className="hidden rtl:inline">‹</span>
          </button>

          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`${t.photo} ${locNum(i + 1, lang)}`}
                aria-current={i === index}
                className="w-2 h-2 transition-opacity"
                style={{
                  backgroundColor: "var(--vanilla-cream)",
                  border: "1px solid var(--warm-cocoa)",
                  opacity: i === index ? 1 : 0.5,
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** "Photo pending" mark in --dusty-terracotta, matching ProductImage's fallback. */
function CameraGlyph() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-8 w-8"
      style={{ color: "var(--dusty-terracotta)" }}
    >
      <path d="M3 7h3l1.5-2h9L18 7h3v12H3z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}
