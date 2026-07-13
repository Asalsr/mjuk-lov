'use client';

import { useEffect, useRef, useState } from 'react';
import { ProductImage } from './ProductImage';
import { ui, type Lang } from '@/lib/i18n';

interface CorporateProps {
  lang: Lang;
}

const content = {
  sv: {
    heading: 'Företagsprenumerationer',
    pitch: 'Bjud teamet på nybakad fika varje vecka: vi kör hem det, ni ordnar bara bordet.',
    footnote: 'Leverans inom Göteborg. Faktura månadsvis.',
  },
  en: {
    heading: 'Corporate Subscriptions',
    pitch: 'Treat the team to fresh-baked fika every week: we bring it, you just clear the table.',
    footnote: 'Delivery within Gothenburg. Monthly invoicing.',
  },
  fa: {
    heading: 'اشتراک‌های شرکتی',
    pitch: 'هر هفته تیم را با فیکای تازه‌پخته مهمان کنید: ما می‌رسانیم، شما فقط میز را آماده کنید.',
    footnote: 'ارسال در محدوده یوتبوری. صورت‌حساب ماهانه.',
  }
};

export const Corporate = ({ lang }: CorporateProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
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
      id="corporate"
      ref={ref}
      className="pt-[clamp(2rem,4.8vw,4rem)] pb-[clamp(2.5rem,6vw,5rem)] px-4 md:px-8"
      style={{ backgroundColor: 'var(--vanilla-cream)' }}
    >
      {/* Compact promo band — tease corporate fika with one selling photo while
          the offering is pre-launch. Photo beside heading + a "Coming soon"
          pill + pitch + footnote. No price and no order CTA until it ships. */}
      <div className="max-w-[1000px] mx-auto">
        <div
          className={`grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <ProductImage
            src="/icons/fika.svg"
            alt={ui[lang].corporatePhotoAlt}
            aspect="1/1"
            sizes="(min-width: 768px) 480px, 100vw"
          />

          <div className="text-center md:text-start">
            {/* Coming-soon pill — solid warm-cocoa border + AAA warm-cocoa text,
                no opacity on text (a11y §3). */}
            <span
              className="type-caps inline-block mb-4 px-4 py-1.5"
              style={{ border: '1px solid var(--warm-cocoa)', color: 'var(--warm-cocoa)' }}
            >
              {ui[lang].comingSoon}
            </span>

            <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>{t.heading}</h2>

            <p className="type-body ink-muted mt-4">{t.pitch}</p>

            <p className="type-body italic ink-muted mt-3">{t.footnote}</p>
          </div>
        </div>
      </div>
    </section>
  );
};
