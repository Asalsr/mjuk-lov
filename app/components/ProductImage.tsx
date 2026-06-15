'use client';

import { useState } from "react";
import Image from "next/image";

/**
 * Brand-correct wrapper over next/image for real product photography.
 *
 * Client Component so it can be dropped into both server pages and the
 * client-rendered home sections (Kits / TheCraft / Corporate). It renders the
 * photo when one is supplied, and falls back to a --soft-peach placeholder at
 * the right aspect ratio with a small --dusty-terracotta camera glyph when the
 * `src` is missing or the file 404s (the photo hasn't been shot yet). That way
 * layouts can be finalised before the photos actually exist.
 *
 * Conventions: square corners only (the site runs --radius: 0rem — never add
 * rounded corners), brand tokens instead of hex, and `alt` is required.
 *
 * Photos live locally in /public/photos/ and /public/gallery/, so `src` is a
 * root-relative path like "/photos/hero.jpg" — no next.config remotePatterns
 * needed (those are only for remote hosts).
 */
export function ProductImage({
  src,
  alt,
  aspect = "4/5",
  priority = false,
  sizes = "100vw",
  className = "",
}: {
  src?: string;
  alt: string;
  aspect?: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  // Flip to the placeholder if the photo file isn't there yet (onError).
  const [failed, setFailed] = useState(false);

  // Shared box: fills the container's width, holds the aspect ratio, clips the
  // photo, and stays square-cornered. `aspect` is dynamic so it's an inline
  // style (Tailwind's JIT can't see runtime class values like aspect-[4/5]).
  const boxClass = `relative w-full overflow-hidden ${className}`;
  const boxStyle = { aspectRatio: aspect };

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`${boxClass} flex items-center justify-center`}
        style={{ ...boxStyle, backgroundColor: "var(--soft-peach)" }}
      >
        <CameraGlyph />
      </div>
    );
  }

  return (
    <div className={boxClass} style={boxStyle}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        onError={() => setFailed(true)}
        className="object-cover"
      />
    </div>
  );
}

/** Small "photo pending" camera mark, drawn in --dusty-terracotta. */
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
