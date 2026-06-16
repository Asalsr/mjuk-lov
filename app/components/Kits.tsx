'use client';

import { useEffect, useRef, useState } from 'react';
import { Standard, Deluxe } from './Icons';
import { ProductGallery } from './media/ProductGallery';
import { MakeItYoursButton } from './shop/MakeItYoursButton';
import { Party } from './Party';
import { ui, locNum, type Lang } from '@/lib/i18n';
import { KITS } from '@/lib/products';

interface KitsProps {
  lang: Lang;
}

// Watercolour illustration per kit id. Gift reuses the Standard mark (same cake,
// different box); Deluxe has its own.
const kitIcon = (id: string) => (id === 'kit-deluxe' ? Deluxe : Standard);

export const Kits = ({ lang }: KitsProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const t = ui[lang];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="kits"
      ref={ref}
      className="pt-[clamp(3.5rem,8vw,8rem)] pb-[clamp(2.8rem,6.4vw,6.4rem)] px-4 md:px-8"
      style={{ backgroundColor: 'var(--soft-peach)' }}
    >
      <div className="max-w-[1200px] mx-auto">
        <h2
          className={`text-center mb-16 md:mb-20 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
        >
          {t.kits}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-12">
          {KITS.map((p, i) => {
            const Icon = kitIcon(p.id);
            const name = p.name[lang];
            return (
              <div
                key={p.id}
                className={`bg-[var(--vanilla-cream)] flex flex-col transition-all duration-700 group md:hover:-translate-y-2 md:hover:shadow-2xl ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{
                  transitionDelay: `${(i + 1) * 150}ms`,
                  boxShadow: '0 4px 20px rgba(61, 42, 34, 0.05)',
                }}
              >
                <ProductGallery
                  items={[
                    { kind: 'illustration', Icon, alt: t.kitIllustrationAlt(name) },
                    { kind: 'photo', src: `/photos/${p.id}.jpg`, alt: t.kitPhotoAlt(name) },
                  ]}
                  aspect="4/5"
                  sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                />

                <div className="p-6 md:p-8 flex flex-col flex-1">
                  <div className="type-caps mb-2 ink-muted">{p.size}</div>

                  <h3 className="type-product mb-3" style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>
                    {name}
                  </h3>

                  <p className="type-body mb-4 ink-muted">{t.kitOccasions[p.id] ?? p.description[lang]}</p>

                  {/* mt-auto pins price + CTA to the bottom so they line up across cards. */}
                  <div className="type-price mt-auto mb-2" style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.5rem)' }}>
                    {t.kitFrom} {locNum(p.priceSek, lang)} kr
                  </div>

                  <MakeItYoursButton product={p} lang={lang} />
                  <p className="type-caps ink-muted mt-3">{t.cardPromise}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* The Party Pack, sold by occasion — a first-class option here. */}
        <div className="mt-16 md:mt-20">
          <Party lang={lang} />
        </div>
      </div>
    </section>
  );
};
