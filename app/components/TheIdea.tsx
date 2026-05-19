'use client';

import { useEffect, useRef, useState } from 'react';
import { WeBake, PickColor, YouDesign } from './Icons';

interface TheIdeaProps {
  lang: 'sv' | 'en';
}

const content = {
  sv: {
    heading: 'Vi tar det svåra. Du tar äran.',
    pillars: [
      {
        label: 'Vi bakar',
        body: 'Kakbottnen är färdig. Smörkrämen är klar. Du öppnar lådan och det luktar redan gott.'
      },
      {
        label: 'Du väljer',
        body: 'Tre spritspåsar. Dina färger. Din smak. Ingen kan göra det precis som du.'
      },
      {
        label: 'Du skapar',
        body: 'Spritsa, swirla, strö. Det finns inget rätt eller fel. Resultatet är alltid ditt.'
      }
    ]
  },
  en: {
    heading: 'We take the hard part. You take the credit.',
    pillars: [
      {
        label: 'We bake',
        body: 'The base is done. The buttercream is ready. You open the box and it already smells incredible.'
      },
      {
        label: 'You choose',
        body: 'Three piping bags. Your colours. Your flavour. No one can do it quite like you.'
      },
      {
        label: 'You create',
        body: 'Pipe, swirl, scatter. There is no right or wrong. The result is always yours.'
      }
    ]
  }
};

const icons = [WeBake, PickColor, YouDesign];

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
                  <Icon className="w-[5.6rem] h-[5.6rem]" />
                </div>

                <div
                  className="mb-4 opacity-30 group-hover:opacity-60 transition-opacity duration-300"
                  style={{
                    fontFamily: 'var(--font-inter), sans-serif',
                    fontSize: '0.75rem',
                    letterSpacing: '0.18em'
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>

                <h3 className="mb-4 group-hover:text-[var(--dusty-terracotta)] transition-colors duration-300" style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>
                  {pillar.label}
                </h3>

                <p className="opacity-80 group-hover:opacity-100 transition-opacity duration-300" style={{ fontSize: 'clamp(1rem, 2vw, 1.125rem)', lineHeight: '1.6' }}>
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
