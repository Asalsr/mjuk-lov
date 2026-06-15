'use client';

import { useState, type ComponentType } from 'react';
import { ProductImage } from '@/app/components/ProductImage';

/** A gallery item: either a brand watercolor illustration (an Icon component)
 *  or a real/placeholder-backed photo. The illustration is normally slide 1. */
export type ProductGalleryItem =
  | { kind: 'illustration'; Icon: ComponentType<{ className?: string }>; alt: string }
  | { kind: 'photo'; src?: string; alt: string };

/**
 * Main image + thumbnail strip. Shows the active item large, with a row of
 * thumbnails beneath; tapping a thumb swaps the main image. Built on
 * <ProductImage> for photos (so missing photos fall back to the placeholder)
 * and renders watercolor illustrations on a --soft-peach field.
 *
 * Square corners (--radius: 0), brand tokens, ≥44px tap targets, RTL-safe,
 * and motion is CSS-only (flattened under prefers-reduced-motion globally).
 */
export function ProductGallery({
  items,
  aspect = '4/5',
  sizes = '100vw',
  className = '',
}: {
  items: ProductGalleryItem[];
  aspect?: string;
  sizes?: string;
  className?: string;
}) {
  const [active, setActive] = useState(0);
  const current = items[active] ?? items[0];
  const hasStrip = items.length > 1;

  return (
    <div className={className}>
      {/* Main image */}
      {current.kind === 'photo' ? (
        <ProductImage src={current.src} alt={current.alt} aspect={aspect} sizes={sizes} />
      ) : (
        <div
          role="img"
          aria-label={current.alt}
          className="relative w-full overflow-hidden flex items-center justify-center"
          style={{ aspectRatio: aspect, backgroundColor: 'var(--soft-peach)' }}
        >
          <current.Icon className="w-full h-full" />
        </div>
      )}

      {/* Thumbnail strip */}
      {hasStrip && (
        <ul className="flex justify-center gap-2 md:gap-3 mt-2 md:mt-3 list-none p-0 m-0">
          {items.map((item, i) => {
            const isActive = i === active;
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={item.alt}
                  aria-pressed={isActive}
                  className="block w-14 h-14 md:w-16 md:h-16 overflow-hidden transition-opacity"
                  style={{
                    border: isActive
                      ? '2px solid var(--dusty-terracotta)'
                      : '1px solid rgba(61, 42, 34, 0.2)',
                    opacity: isActive ? 1 : 0.7,
                  }}
                >
                  {item.kind === 'photo' ? (
                    <ProductImage src={item.src} alt="" aspect="1/1" sizes="64px" />
                  ) : (
                    <span
                      className="flex items-center justify-center w-full h-full"
                      style={{ backgroundColor: 'var(--soft-peach)' }}
                    >
                      <item.Icon className="w-full h-full" />
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
