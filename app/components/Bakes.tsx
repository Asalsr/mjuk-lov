'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MagneticButton } from './MagneticButton';
import { MENU } from '@/lib/products';
import { MENU_BIG_ORDER_QTY } from '@/lib/pricing';
import type { Lang } from '@/lib/i18n';

interface BakesProps {
  lang: Lang;
}

// Warm "fika" framing for the menu line. No exclamation marks, no emoji.
// "Mjuk Lov" stays Latin across locales (house rule).
const content = {
  sv: {
    eyebrow: 'fika',
    heading: 'Kakor & bakverk',
    body: 'En liten meny vid sidan av tårtorna — något att ta med till fikat eller helgen. Bakas på beställning, hämtas eller levereras.',
    bigOrder: (n: number) => `Beställningar på ${n}+ stycken behöver lite längre framförhållning.`,
    cta: 'Se hela menyn',
  },
  en: {
    eyebrow: 'fika',
    heading: 'Cakes & bakes',
    body: 'A small menu alongside the cakes — something to take to fika or the weekend. Made to order, picked up or delivered.',
    bigOrder: (n: number) => `Orders of ${n}+ need a little more notice.`,
    cta: 'See the full menu',
  },
  fa: {
    eyebrow: 'فیکا',
    heading: 'کیک و شیرینی',
    body: 'منویی کوچک در کنار کیک‌ها — چیزی برای فیکا یا آخر هفته. به‌سفارش پخته می‌شود، تحویل حضوری یا ارسال.',
    bigOrder: (n: number) => `سفارش‌های ${n.toLocaleString('fa-IR')} تایی و بیشتر نیاز به زمان بیشتری دارند.`,
    cta: 'مشاهده منوی کامل',
  },
};

export const Bakes = ({ lang }: BakesProps) => {
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
      id="bakes"
      ref={ref}
      className="py-[clamp(3.5rem,8vw,8rem)] px-4 md:px-8"
      style={{ backgroundColor: 'var(--soft-peach)' }}
    >
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <div
            className={`type-caps italic ink-muted mb-3 transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            {t.eyebrow}
          </div>
          <h2
            className={`mb-6 transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', transitionDelay: '120ms' }}
          >
            {t.heading}
          </h2>
          <p
            className={`type-body max-w-[640px] mx-auto ink-muted transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: '240ms' }}
          >
            {t.body}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 md:gap-8 mb-10">
          {MENU.map((m, i) => (
            <div
              key={m.id}
              className={`p-5 md:p-6 text-center transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{
                backgroundColor: 'var(--vanilla-cream)',
                transitionDelay: `${360 + i * 100}ms`,
                boxShadow: '0 4px 20px rgba(61, 42, 34, 0.05)',
              }}
            >
              <h3 className="type-serif mb-2" style={{ fontSize: 'clamp(1.125rem, 2vw, 1.375rem)' }}>
                {m.name[lang]}
              </h3>
              {m.rotating && (
                <p className="type-caps italic ink-muted" style={{ fontSize: '0.75rem' }}>
                  {lang === 'sv' ? 'säsong' : lang === 'fa' ? 'فصلی' : 'seasonal'}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="type-caps ink-muted mb-6" style={{ fontSize: '0.875rem' }}>
            {t.bigOrder(MENU_BIG_ORDER_QTY)}
          </p>
          <MagneticButton
            onClick={() => router.push(`/${lang}/butik#bakes`)}
            className="type-caps px-8 py-3 transition-all duration-300 hover:bg-[var(--warm-peach)] hover:shadow-lg"
            style={{ border: '1px solid var(--warm-cocoa)' }}
          >
            {t.cta}
          </MagneticButton>
        </div>
      </div>
    </section>
  );
};
