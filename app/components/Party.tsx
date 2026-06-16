'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MagneticButton } from './MagneticButton';
import { PARTY_BASE_SEK } from '@/lib/pricing';
import type { Lang } from '@/lib/i18n';

interface PartyProps {
  lang: Lang;
}

// Warm, gather-round framing. No headcount, no exclamation marks. "Mjuk Lov"
// stays in Latin script across all locales (house rule).
const content = {
  sv: {
    eyebrow: 'samlas',
    heading: 'Tårtan är inte färdig än',
    body: 'Födelsedagar, jubileum, en söndag med människor du älskar. Varje gäst får en egen liten tårta att dekorera — inte bara dessert, en stund att skapa något tillsammans.',
    fromPrice: (kr: number) => `Från ${kr} kr`,
    leadNote: 'Minst 7 dagars framförhållning.',
    cta: 'Boka festpaket',
  },
  en: {
    eyebrow: 'gather round',
    heading: "The cake isn't finished yet",
    body: 'Birthdays, anniversaries, a Sunday with people you love. Everyone gets their own little cake to decorate — not just dessert, an hour of making something together.',
    fromPrice: (kr: number) => `From ${kr} kr`,
    leadNote: "At least 7 days' notice.",
    cta: 'Book a party pack',
  },
  fa: {
    eyebrow: 'دور هم',
    heading: 'کیک هنوز تمام نشده است',
    body: 'تولدها، سالگردها، یک یک‌شنبه با کسانی که دوست‌شان دارید. هر مهمان یک کیک کوچک خودش را تزیین می‌کند — فقط دسر نیست، ساعتی برای ساختن چیزی در کنار هم است.',
    fromPrice: (kr: number) => `از ${kr.toLocaleString('fa-IR').replace(/,/g, '٬')} کرون`,
    leadNote: 'دست‌کم ۷ روز پیش‌اطلاع.',
    cta: 'رزرو بسته جشن',
  },
};

export const Party = ({ lang }: PartyProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();
  const t = content[lang];

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
      id="party"
      ref={ref}
      className="py-[clamp(3.5rem,8vw,8rem)] px-4 md:px-8"
      style={{ backgroundColor: 'var(--vanilla-cream)' }}
    >
      <div className="max-w-[820px] mx-auto text-center">
        <div
          className={`type-caps italic ink-muted mb-4 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {t.eyebrow}
        </div>
        <h2
          className={`mb-8 md:mb-10 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', transitionDelay: '120ms' }}
        >
          {t.heading}
        </h2>
        <p
          className={`type-body mb-10 transition-all duration-700 max-w-[640px] mx-auto ink-muted ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ fontSize: 'clamp(1rem, 1.5vw, 1.125rem)', transitionDelay: '240ms' }}
        >
          {t.body}
        </p>

        <div
          className={`flex flex-col items-center gap-3 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: '360ms' }}
        >
          <div className="type-serif" style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.5rem)' }}>
            {t.fromPrice(PARTY_BASE_SEK)}
          </div>
          <div className="type-caps ink-muted" style={{ fontSize: '0.875rem' }}>
            {t.leadNote}
          </div>
          <MagneticButton
            onClick={() => router.push(`/${lang}/butik#party`)}
            className="type-caps px-8 py-3 mt-4 transition-all duration-300 hover:bg-[var(--warm-peach)] hover:shadow-lg"
            style={{ border: '1px solid var(--warm-cocoa)' }}
          >
            {t.cta}
          </MagneticButton>
        </div>
      </div>
    </section>
  );
};
