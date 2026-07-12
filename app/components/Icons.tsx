'use client';

/**
 * Mjuk Lov illustrated icons.
 *
 * Watercolor illustrations stored as SVG (with embedded raster) in /public/icons/.
 * They have their own baked-in colors, so `style.color` is ignored.
 *
 * Old export names are preserved as aliases so existing imports keep working:
 *   PipingCurl, CardamomPod, Candle, Leaf, HeartOutline,
 *   Flame, Pour, DotsCluster
 */

import type { CSSProperties } from 'react';

interface IconProps {
  className?: string;
  style?: CSSProperties;
}

const Illustration = ({
  src,
  alt,
  className = 'w-12 h-12',
  style,
}: IconProps & { src: string; alt: string }) => {
  const { color: _color, ...safeStyle } = style ?? {};
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={{ objectFit: 'contain', ...safeStyle }}
      draggable={false}
    />
  );
};

// =======================================================================
// Legacy aliases — existing imports continue to work.
// =======================================================================

export const PipingCurl = (p: IconProps) => (
  <Illustration src="/icons/piping-bag.svg" alt="" {...p} />
);

export const CardamomPod = (p: IconProps) => (
  <Illustration src="/icons/spices.svg" alt="" {...p} />
);

export const Candle = (p: IconProps) => (
  <Illustration src="/icons/cake-stand.svg" alt="" {...p} />
);

export const Leaf = (p: IconProps) => (
  <Illustration src="/icons/berries.svg" alt="" {...p} />
);

export const HeartOutline = (p: IconProps) => (
  <Illustration src="/icons/magnolia.svg" alt="" {...p} />
);

export const Flame = (p: IconProps) => (
  <Illustration src="/icons/truffles.svg" alt="" {...p} />
);

export const Pour = (p: IconProps) => (
  <Illustration src="/icons/pour-milk.svg" alt="" {...p} />
);

export const DotsCluster = (p: IconProps) => (
  <Illustration src="/icons/truffles.svg" alt="" {...p} />
);

// =======================================================================
// Descriptive exports — prefer these in new code.
// =======================================================================

export const CakeStand = (p: IconProps) => (
  <Illustration src="/icons/cake-stand.svg" alt="" {...p} />
);
export const CakeSlice = (p: IconProps) => (
  <Illustration src="/icons/cake-slice.svg" alt="" {...p} />
);
export const FlourSack = (p: IconProps) => (
  <Illustration src="/icons/flour-sack.svg" alt="" {...p} />
);
export const Spices = (p: IconProps) => (
  <Illustration src="/icons/spices.svg" alt="" {...p} />
);
export const Truffles = (p: IconProps) => (
  <Illustration src="/icons/truffles.svg" alt="" {...p} />
);
export const PourMilk = (p: IconProps) => (
  <Illustration src="/icons/pour-milk.svg" alt="" {...p} />
);
export const Berries = (p: IconProps) => (
  <Illustration src="/icons/berries.svg" alt="" {...p} />
);
export const Butter = (p: IconProps) => (
  <Illustration src="/icons/butter.svg" alt="" {...p} />
);
export const BowlSpoon = (p: IconProps) => (
  <Illustration src="/icons/bowl-spoon.svg" alt="" {...p} />
);
export const Magnolia = (p: IconProps) => (
  <Illustration src="/icons/magnolia.svg" alt="" {...p} />
);
export const PipingBag = (p: IconProps) => (
  <Illustration src="/icons/piping-bag.svg" alt="" {...p} />
);
export const WhiskBowl = (p: IconProps) => (
  <Illustration src="/icons/whisk-bowl.svg" alt="" {...p} />
);
export const Packing = (p: IconProps) => (
  <Illustration src="/icons/packing.svg" alt="" {...p} />
);
export const Craft = (p: IconProps) => (
  <Illustration src="/icons/CRAFT.svg" alt="" {...p} />
);
export const Season = (p: IconProps) => (
  <Illustration src="/icons/season.svg" alt="" {...p} />
);
export const Personal = (p: IconProps) => (
  <Illustration src="/icons/PERSONAL.svg" alt="" {...p} />
);
// Watercolour marks per cake size (piccolo 10 cm / medio 17 cm / grande 25 cm).
// These depict the finished, decorated cake — used for the ready-made cakes.
export const Piccolo = (p: IconProps) => (
  <Illustration src="/icons/piccolo.svg" alt="" {...p} />
);
export const Medio = (p: IconProps) => (
  <Illustration src="/icons/medio.svg" alt="" {...p} />
);
export const Grande = (p: IconProps) => (
  <Illustration src="/icons/grande.svg" alt="" {...p} />
);

// Watercolour marks per DIY kit — the kit itself (not a finished cake). Used on
// the DIY kit cards. Files live in /public/gallery/ (spaces intentional).
export const KitPiccolo = (p: IconProps) => (
  <Illustration src="/gallery/DIY kit - piccolo.svg" alt="" {...p} />
);
export const KitMedio = (p: IconProps) => (
  <Illustration src="/gallery/DIY kit - medio.svg" alt="" {...p} />
);
export const KitGrande = (p: IconProps) => (
  <Illustration src="/gallery/DIY kit - grande.svg" alt="" {...p} />
);

// The Party Pack scene — one little cake per guest, each decorated by them.
// Meaningful (not decorative), so it takes a real `alt`.
export const DiyParty = ({ alt = "", ...p }: IconProps & { alt?: string }) => (
  <Illustration src="/gallery/dyi party.svg" alt={alt} {...p} />
);
