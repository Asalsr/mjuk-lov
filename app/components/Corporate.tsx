'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MagneticButton } from './MagneticButton';
import { ProductImage } from './ProductImage';
import { ui, type Lang } from '@/lib/i18n';

interface CorporateProps {
  lang: Lang;
}

const content = {
  sv: {
    heading: 'Företagsprenumerationer',
    footnote: 'Leverans inom Göteborg. Faktura månadsvis.',
    cta: 'Till butiken',
    tiers: [
      {
        name: 'Liten',
        portions: '12 portioner/månad',
        price: '890 kr',
        description: 'Fredagsfika för teamet. Varje vecka.'
      },
      {
        name: 'Medium',
        portions: '24 portioner/månad',
        price: '1 590 kr',
        description: 'Veckomöten, kundbesök, spontana fikapauser.',
        popular: true
      },
      {
        name: 'Stor',
        portions: '40 portioner/månad',
        price: '2 390 kr',
        description: 'För kontoret som tar fika på allvar.'
      }
    ]
  },
  en: {
    heading: 'Corporate Subscriptions',
    footnote: 'Delivery within Gothenburg. Monthly invoicing.',
    cta: 'Visit the shop',
    tiers: [
      {
        name: 'Small',
        portions: '12 portions/month',
        price: '890 kr',
        description: 'Friday fika for the team. Every week.'
      },
      {
        name: 'Medium',
        portions: '24 portions/month',
        price: '1,590 kr',
        description: 'Weekly meetings, client visits, spontaneous breaks.',
        popular: true
      },
      {
        name: 'Large',
        portions: '40 portions/month',
        price: '2,390 kr',
        description: 'For the office that takes fika seriously.'
      }
    ]
  },
  fa: {
    heading: 'اشتراک‌های شرکتی',
    footnote: 'ارسال در محدوده یوتبوری. صورت‌حساب ماهانه.',
    cta: 'به فروشگاه',
    tiers: [
      {
        name: 'کوچک',
        portions: '۱۲ پرس در ماه',
        price: '۸۹۰ kr',
        description: 'فیکای جمعه برای تیم. هر هفته.'
      },
      {
        name: 'متوسط',
        portions: '۲۴ پرس در ماه',
        price: '۱٬۵۹۰ kr',
        description: 'جلسه‌های هفتگی، دیدار با مشتری، استراحت‌های فی‌البداهه.',
        popular: true
      },
      {
        name: 'بزرگ',
        portions: '۴۰ پرس در ماه',
        price: '۲٬۳۹۰ kr',
        description: 'برای دفتری که فیکا را جدی می‌گیرد.'
      }
    ]
  }
};

export const Corporate = ({ lang }: CorporateProps) => {
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
      id="corporate"
      ref={ref}
      className="py-[clamp(3.5rem,8vw,8rem)] px-4 md:px-8"
      style={{ backgroundColor: 'var(--vanilla-cream)' }}
    >
      <div className="max-w-[1200px] mx-auto">
        <h2
          className={`text-center mb-16 md:mb-20 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
        >
          {t.heading}
        </h2>

        <div
          className={`max-w-[800px] mx-auto mb-16 md:mb-20 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: '100ms' }}
        >
          <ProductImage
            src="/photos/corporate-office-box.jpg"
            alt={ui[lang].corporatePhotoAlt}
            aspect="16/9"
            sizes="(min-width: 832px) 800px, 100vw"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {t.tiers.map((tier, i) => (
            <div
              key={i}
              className={`p-8 md:p-10 transition-all duration-700 group cursor-default md:hover:scale-105 ${
                tier.popular
                  ? 'md:-translate-y-4 md:hover:shadow-2xl'
                  : 'md:hover:shadow-xl'
              } ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{
                backgroundColor: tier.popular ? 'var(--warm-cocoa)' : 'var(--soft-peach)',
                color: tier.popular ? 'var(--vanilla-cream)' : 'var(--warm-cocoa)',
                transitionDelay: `${(i + 1) * 150}ms`,
                boxShadow: tier.popular ? '0 10px 40px rgba(61, 42, 34, 0.15)' : 'none'
              }}
            >
              {tier.popular && (
                <div className="type-caps italic mb-6 text-center opacity-70 group-hover:opacity-100 transition-opacity duration-300">
                  — populärast —
                </div>
              )}

              <h3 className="text-center mb-3 group-hover:scale-110 transition-transform duration-300" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)' }}>
                {tier.name}
              </h3>

              <div className="type-body text-center mb-2 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                {tier.portions}
              </div>

              <div
                className="type-serif text-center mb-6"
                style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}
              >
                {tier.price}
              </div>

              <p
                className={`type-body text-center mb-8 ${tier.popular ? 'opacity-90' : 'opacity-80'} group-hover:opacity-100 transition-opacity duration-300`}
              >
                {tier.description}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="type-body italic mb-8 ink-muted">
            {t.footnote}
          </p>

          <MagneticButton
            onClick={() => router.push(`/${lang}/butik`)}
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
