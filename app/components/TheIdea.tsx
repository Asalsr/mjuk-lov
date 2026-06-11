'use client';

import { useEffect, useRef, useState } from 'react';
import { Craft, Season, Personal } from './Icons';

interface TheIdeaProps {
  lang: 'sv' | 'en';
}

const content = {
  sv: {
    heading: 'Två sätt att njuta. Ett löfte.',
    pillars: [
      {
        label: 'Handgjort',
        body: 'Allt bakas från grunden i vårt kök i Göteborg. Inga genvägar.'
      },
      {
        label: 'Säsongsbaserat',
        body: 'Vi följer säsongen. Rabarber på våren, hallon på sommaren, päron på hösten.'
      },
      {
        label: 'Personligt',
        body: 'Varje tårta, varje dessert är just din. Vi lyssnar, anpassar, levererar.'
      }
    ]
  },
  en: {
    heading: 'Two ways to enjoy. One promise.',
    pillars: [
      {
        label: 'Handmade',
        body: 'Everything is baked from scratch in our Gothenburg kitchen. No shortcuts.'
      },
      {
        label: 'Seasonal',
        body: 'We follow the seasons. Rhubarb in spring, raspberries in summer, pears in autumn.'
      },
      {
        label: 'Personal',
        body: 'Every cake, every dessert is uniquely yours. We listen, adapt, deliver.'
      }
    ]
  }
};

const icons = [Craft, Season, Personal];

export const TheIdea = ({ lang }: TheIdeaProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const t = content[lang];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.2 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="idea"
      ref={ref}
      className="py-[clamp(6rem,12vw,12rem)] px-4 md:px-8"
      style={{ backgroundColor: 'var(--vanilla-cream)' }}
    >
      <div className="max-w-[1200px] mx-auto">
        <h2
          className={`text-center mb-16 md:mb-24 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: '1.2' }}
        >
          {t.heading}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
          {t.pillars.map((pillar, i) => {
            const Icon = icons[i];
            return (
              <div
                key={i}
                className={`text-center transition-all duration-700 group cursor-default ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: `${(i + 1) * 150}ms` }}
              >
                <div
                  className="inline-flex items-center justify-center mb-6 transform group-hover:scale-125 group-hover:-rotate-6 transition-all duration-500"
                  style={{ color: 'var(--dusty-terracotta)' }}
                >
                  <Icon className="w-28 h-28 sm:w-36 sm:h-36 md:w-[5.6rem] md:h-[5.6rem]" />
                </div>

                <div className="type-caps mb-4 opacity-30 group-hover:opacity-60 transition-opacity duration-300">
                  {String(i + 1).padStart(2, '0')}
                </div>

                <h3 className="mb-4 group-hover:text-[var(--dusty-terracotta)] transition-colors duration-300" style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>
                  {pillar.label}
                </h3>

                <p className="type-body opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                  {pillar.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
