'use client';

export const NoiseTexture = () => {
  return (
    <div className="fixed inset-0 pointer-events-none opacity-[0.015] mix-blend-overlay z-50 hidden md:block">
      <svg width="100%" height="100%">
        <filter id="noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="4"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>
    </div>
  );
};
