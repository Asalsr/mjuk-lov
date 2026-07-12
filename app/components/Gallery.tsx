'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ui, isRtl, type Lang } from '@/lib/i18n';
import { GALLERY_IMAGES, type GalleryImage } from '@/lib/gallery';
import { GalleryTile } from '@/app/components/GalleryTile';

interface GalleryProps {
  lang: Lang;
  /** Defaults to the full manifest; pass a subset to scope the grid. */
  images?: GalleryImage[];
  /** Cap the number of tiles shown (used by the home-page teaser). */
  limit?: number;
  /** Teaser mode: when set, tiles link to this route (the full gallery) and a
   *  "See the gallery" CTA is shown, instead of opening the in-page lightbox. */
  seeAllHref?: string;
}

/** Responsive square-tile gallery. In the default (full) mode each tile opens a
 *  lightweight, accessible lightbox built on the native <dialog> element — it
 *  traps focus, closes on Escape and on a backdrop click, and restores focus to
 *  the trigger, with no extra dependencies. In teaser mode (seeAllHref set) the
 *  tiles link straight to the full gallery. Uniform 1:1 GalleryTile + brand tokens. */
export function Gallery({ lang, images = GALLERY_IMAGES, limit, seeAllHref }: GalleryProps) {
  const t = ui[lang];
  const shown = typeof limit === 'number' ? images.slice(0, limit) : images;
  const teaser = !!seeAllHref;

  const dialogRef = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState<number | null>(null);

  const openAt = (i: number) => {
    setActive(i);
    dialogRef.current?.showModal();
  };
  // Calling .close() fires the dialog's `close` event → onClose resets state,
  // so Escape and the close button funnel through the same path.
  const close = () => dialogRef.current?.close();

  if (shown.length === 0) {
    return (
      <p className="type-body ink-muted text-center py-12 md:py-16">{t.galleryEmpty}</p>
    );
  }

  return (
    <div>
      {/* True CSS grid: equal columns (2 mobile/tablet, 3 desktop), each tile a
          1:1 square via GalleryTile, consistent 12/16px gap. No masonry. */}
      <ul className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 list-none p-0 m-0">
        {shown.map((img, i) => (
          <li key={img.src}>
            {teaser ? (
              <Link
                href={seeAllHref!}
                className="group block focus-visible:outline-none"
                aria-label={t.gallery}
              >
                <GalleryTile
                  src={img.src}
                  alt={img.alt[lang]}
                  className="transition-transform duration-500 md:group-hover:scale-105"
                />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => openAt(i)}
                aria-label={t.viewImage}
                className="group block w-full cursor-pointer focus-visible:outline-none"
              >
                <GalleryTile
                  src={img.src}
                  alt={img.alt[lang]}
                  className="transition-transform duration-500 md:group-hover:scale-105"
                />
              </button>
            )}
          </li>
        ))}
      </ul>

      {teaser && (
        <div className="text-center mt-8 md:mt-10">
          <Link
            href={seeAllHref!}
            className="type-caps inline-flex items-center gap-2 transition-colors hover:text-[var(--dusty-terracotta)]"
          >
            {t.viewGallery}
            <span aria-hidden="true">{isRtl(lang) ? '←' : '→'}</span>
          </Link>
        </div>
      )}

      {/* Lightbox — full mode only. Native <dialog> gives focus trap, Escape,
          inert background and focus restore for free. */}
      {!teaser && (
        <dialog
          ref={dialogRef}
          onClose={() => setActive(null)}
          onClick={(e) => {
            // A click whose target is the dialog itself is a backdrop click.
            if (e.target === dialogRef.current) close();
          }}
          className="gallery-dialog m-auto bg-transparent p-0"
          aria-label={t.gallery}
        >
          {active !== null && (
            <figure
              className="relative m-0 p-2 md:p-4"
              style={{ backgroundColor: 'var(--vanilla-cream)' }}
              lang={lang}
            >
              <button
                type="button"
                onClick={close}
                aria-label={t.closeDialog}
                className="absolute top-2 end-2 z-10 tap text-2xl leading-none transition-colors hover:text-[var(--dusty-terracotta)]"
                style={{ color: 'var(--warm-cocoa)' }}
              >
                <span aria-hidden="true">×</span>
              </button>
              <div className="relative w-[90vw] max-w-3xl h-[70vh] max-h-[80vh]">
                {/* eslint-disable-next-line @next/next/no-img-element -- next/image refuses SVG */}
                <img
                  src={encodeURI(shown[active].src)}
                  alt={shown[active].alt[lang]}
                  className="absolute inset-0 h-full w-full object-contain"
                />
              </div>
              <figcaption className="type-caps ink-muted text-center pt-3 px-8">
                {shown[active].alt[lang]}
              </figcaption>
            </figure>
          )}
        </dialog>
      )}
    </div>
  );
}
