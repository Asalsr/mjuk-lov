'use client';

import { useEffect, useRef, useState } from 'react';
import { Leaf, Pour, Packing, YouDesign } from './Icons';

interface TheCraftProps {
  lang: 'sv' | 'en';
}

const content = {
  sv: {
    heading: 'Så enkelt är det faktiskt.',
    steps: [
      {
        label: 'Vi väljer',
        body: 'Säsongens bästa råvaror. Lokalodlat när vi kan.'
      },
      {
        label: 'Vi bakar',
        body: 'Från grunden, med tid. Din kakbotten är klar när du beställer.'
      },
      {
        label: 'Vi paketerar',
        body: 'Spritspåsar, smaksättningar, ljus — allt på plats. Du öppnar och börjar.'
      },
      {
        label: 'Du tar över',
        body: 'Det här är din del. Och det är den bästa delen.'
      }
    ]
  },
  en: {
    heading: 'It really is this simple.',
    steps: [
      {
        label: 'We choose',
        body: 'The best seasonal ingredients. Locally grown when we can.'
      },
      {
        label: 'We bake',
        body: 'From scratch, with time. Your base is ready when you order.'
      },
      {
        label: 'We package',
        body: 'Piping bags, flavours, candles — everything in place. You open and start.'
      },
      {
        label: 'You take over',
        body: 'This is your part. And it is the best part.'
      }
    ]
  }
};

const icons = [Leaf, Pour, Packing, YouDesign];

export const TheCraft = ({ lang }: TheCraftProps) => {
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
      id="craft"
      ref={ref}
      className="py-[clamp(6rem,12vw,12rem)] px-4 md:px-8"
      style={{ backgroundColor: 'rgba(232, 184, 154, 0.2)' }}
    >
      <div className="max-w-[1200px] mx-auto">
        <h2
          className={`text-center mb-16 md:mb-24 transition-all duration-700 ${
            isVisible ? 'opacity-80 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: '#a85d4e', fontWeight: 600 }}
        >
          {t.heading}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 relative">
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px opacity-20">
            <svg className="w-full h-full" preserveAspectRatio="none">
              <line
                x1="12.5%"
                y1="50%"
                x2="87.5%"
                y2="50%"
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            </svg>
          </div>

          {t.steps.map((step, i) => {
            const Icon = icons[i];
            return (
              <div
                key={i}
                className={`text-center relative transition-all duration-700 group ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: `${(i + 1) * 150}ms` }}
              >
                <div
                  className="inline-flex items-center justify-center mb-6 relative z-10 transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-500"
                >
                  <Icon className="w-[10.5rem] h-[10.5rem]" />
                </div>

                <div
                  className="mb-3 opacity-30 group-hover:opacity-60 transition-opacity duration-300"
                  style={{
                    fontFamily: 'var(--font-inter), sans-serif',
                    fontSize: '0.75rem',
                    letterSpacing: '0.18em'
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>

                <h3 className="mb-3 group-hover:text-[var(--dusty-terracotta)] transition-colors duration-300" style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.5rem)' }}>
                  {step.label}
                </h3>

                <p className="opacity-80 group-hover:opacity-100 transition-opacity duration-300" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                  {step.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
