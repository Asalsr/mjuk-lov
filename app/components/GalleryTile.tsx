'use client';

import { useState } from 'react';

/** The single source of truth for a gallery tile's shape and size, shared by
 *  the home-page teaser and the full /galleri grid (both render through
 *  <Gallery>) so no surface hand-styles its own tiles.
 *
 *  Every tile is a 1:1 square that fills its grid column, with `object-fit:
 *  cover` so photos of any intrinsic ratio crop to the same frame and read at
 *  the same size. Gallery photos are Adobe-exported SVGs wrapping a raster, and
 *  `next/image` refuses to optimize SVG, so — like `ProductImageCarousel` — this
 *  renders a plain `<img src={encodeURI(...)}>`. A src that 404s falls back to
 *  the --soft-peach + camera-glyph placeholder used by `ProductImage`.
 *
 *  Note: the ~10px corner radius here is a deliberate exception to the site-wide
 *  zero-radius editorial system (globals.css `--radius: 0`), requested for the
 *  gallery grid specifically. */
const TILE_RADIUS = '10px';

export function GalleryTile({
  src,
  alt,
  className = '',
  scale = 1,
}: {
  src: string;
  alt: string;
  className?: string;
  /** Per-image zoom for a loosely-framed source photo — see `GalleryImage.scale`. */
  scale?: number;
}) {
  const [failed, setFailed] = useState(false);
  const boxClass = 'relative w-full overflow-hidden';
  const boxStyle = { aspectRatio: '1 / 1', backgroundColor: 'var(--soft-peach)', borderRadius: TILE_RADIUS };

  if (failed) {
    return (
      <div role="img" aria-label={alt} className={`${boxClass} flex items-center justify-center`} style={boxStyle}>
        <CameraGlyph />
      </div>
    );
  }

  return (
    <div className={boxClass} style={boxStyle}>
      {/* The zoom correction lives on this wrapper, separate from the img's own
          hover-scale transition, so the two transforms compose instead of
          clobbering each other. */}
      <div className="absolute inset-0" style={scale !== 1 ? { transform: `scale(${scale})` } : undefined}>
        {/* eslint-disable-next-line @next/next/no-img-element -- next/image refuses SVG */}
        <img
          src={encodeURI(src)}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className={`absolute inset-0 h-full w-full object-cover ${className}`}
        />
      </div>
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
      style={{ color: 'var(--dusty-terracotta)' }}
    >
      <path d="M3 7h3l1.5-2h9L18 7h3v12H3z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}
