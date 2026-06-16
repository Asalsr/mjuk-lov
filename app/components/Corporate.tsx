'use client';

import { useEffect, useRef, useState } from 'react';
import type { Lang } from '@/lib/i18n';

interface CorporateProps {
  lang: Lang;
}

// Subscriptions are being rethought — keep the three tiers visible but hide the
// price and disable the CTA until the new model lands. Copy comes from the
// localized note + comingSoon labels.
const content = {
  sv: {
    heading: 'Företagsprenumerationer',
    comingSoonNote: 'Vi planerar en ny modell — mer snart.',
    comingSoonLabel: 'Kommer snart',
    tiers: [
      {
        name: 'Liten',
        portions: '12 portioner/månad',
        description: 'Fredagsfika för teamet. Varje vecka.',
      },
      {
        name: 'Medium',
        portions: '24 portioner/månad',
        description: 'Veckomöten, kundbesök, spontana fikapauser.',
        popular: true,
      },
      {
        name: 'Stor',
        portions: '40 portioner/månad',
        description: 'För kontoret som tar fika på allvar.',
      },
    ],
  },
  en: {
    heading: 'Corporate Subscriptions',
    comingSoonNote: "We're rethinking the model — more soon.",
    comingSoonLabel: 'Coming soon',
    tiers: [
      {
        name: 'Small',
        portions: '12 portions/month',
        description: 'Friday fika for the team. Every week.',
      },
      {
        name: 'Medium',
        portions: '24 portions/month',
        description: 'Weekly meetings, client visits, spontaneous breaks.',
        popular: true,
      },
      {
        name: 'Large',
        portions: '40 portions/month',
        description: 'For the office that takes fika seriously.',
      },
    ],
  },
  fa: {
    heading: 'اشتراک‌های شرکتی',
    comingSoonNote: 'در حال طراحی مدل جدید هستیم — به‌زودی.',
    comingSoonLabel: 'به‌زودی',
    tiers: [
      {
        name: 'کوچک',
        portions: '۱۲ پرس در ماه',
        description: 'فیکای جمعه برای تیم. هر هفته.',
      },
      {
        name: 'متوسط',
        portions: '۲۴ پرس در ماه',
        description: 'جلسه‌های هفتگی، دیدار با مشتری، استراحت‌های فی‌البداهه.',
        popular: true,
      },
      {
        name: 'بزرگ',
        portions: '۴۰ پرس در ماه',
        description: 'برای دفتری که فیکا را جدی می‌گیرد.',
      },
    ],
  },
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
      className="py-[clamp(3.5rem,8vw,8rem)] px-4 md:px-8"
      style={{ backgroundColor: 'var(--vanilla-cream)' }}
    >
      <div className="max-w-[1200px] mx-auto">
        <h2
          className={`text-center mb-4 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
        >
          {t.heading}
        </h2>
        <p className="text-center type-body italic ink-muted mb-16 md:mb-20">
          {t.comingSoonNote}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {t.tiers.map((tier, i) => (
            <div
              key={i}
              className={`p-8 md:p-10 transition-all duration-700 group cursor-default ${
                tier.popular ? 'md:-translate-y-4' : ''
              } ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{
                backgroundColor: tier.popular ? 'var(--warm-cocoa)' : 'var(--soft-peach)',
                color: tier.popular ? 'var(--vanilla-cream)' : 'var(--warm-cocoa)',
                transitionDelay: `${(i + 1) * 150}ms`,
                boxShadow: tier.popular ? '0 10px 40px rgba(61, 42, 34, 0.15)' : 'none',
              }}
            >
              <h3 className="text-center mb-3" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)' }}>
                {tier.name}
              </h3>

              <div className="type-body text-center mb-6">
                {tier.portions}
              </div>

              <p className="type-body text-center mb-8">
                {tier.description}
              </p>

              <div
                className="type-caps text-center px-6 py-3"
                style={{
                  border: tier.popular
                    ? '1px solid var(--vanilla-cream)'
                    : '1px solid var(--warm-cocoa)',
                  opacity: 0.7,
                }}
                aria-disabled="true"
              >
                {t.comingSoonLabel}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
