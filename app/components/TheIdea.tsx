'use client';

import { useEffect, useRef, useState } from 'react';
import { WeBake, PickColor, YouDesign } from './Icons';

interface TheIdeaProps {
  lang: 'sv' | 'en';
}

const content = {
  sv: {
    heading: 'Du bakar inte från grunden. Du skapar något eget.',
    pillars: [
      {
        label: 'Vi bakar åt dig',
        body: 'Kakbottnen är klar. Vi har tagit hand om det svåra — smör, mjöl, ugn, timing. Nu börjar den roliga delen.'
      },
      {
        label: 'Du väljer smak och färg',
        body: 'Tre smörkrämssprits med valda färger. Choklad, vanilj eller hallonsmak. Du väljer kombinationen.'
      },
      {
        label: 'Du dekorerar',
        body: 'Spritsa, forma, skapa. Resultatet är ditt. Och det ser ut precis som du tänkte dig — eller bättre.'
      }
    ]
  },
  en: {
    heading: "You don't bake from scratch. You create something yours.",
    pillars: [
      {
        label: 'We bake for you',
        body: 'The cake base is ready. We handled the hard part — butter, flour, oven, timing. Now the fun part begins.'
      },
      {
        label: 'You choose flavour and colour',
        body: 'Three buttercream piping bags in your chosen colours. Chocolate, vanilla or raspberry. You pick the combination.'
      },
      {
        label: 'You decorate',
        body: 'Pipe, shape, create. The result is yours. And it looks exactly how you imagined — or better.'
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
