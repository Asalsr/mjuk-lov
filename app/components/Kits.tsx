'use client';

import { useEffect, useRef, useState } from 'react';
import { Standard, Deluxe, GiftEdition } from './Icons';
import { MagneticButton } from './MagneticButton';

interface KitsProps {
  lang: 'sv' | 'en';
}

const content = {
  sv: {
    heading: 'Tårtkit',
    kits: [
      {
        name: 'Standard',
        size: '15 cm',
        price: '345 kr',
        description: 'Allt du behöver för att imponera. Ingen vet att det var enkelt.'
      },
      {
        name: 'Deluxe',
        size: '20 cm',
        price: '445 kr',
        description: 'När det ska vara lite mer. Mer tårta, mer smörkräm, mer av det där ögonblicket.'
      },
      {
        name: 'Presentupplaga',
        size: '15 cm',
        price: '395 kr',
        description: 'Du ger dem en upplevelse, inte bara en tårta. De kommer minnas att de gjorde det själva.'
      }
    ],
    cta: 'Beställ'
  },
  en: {
    heading: 'Cake Kits',
    kits: [
      {
        name: 'Standard',
        size: '15 cm',
        price: '345 kr',
        description: 'Everything you need to impress. No one needs to know it was easy.'
      },
      {
        name: 'Deluxe',
        size: '20 cm',
        price: '445 kr',
        description: 'For when it needs to be a little more. More cake, more buttercream, more of that moment.'
      },
      {
        name: 'Gift Edition',
        size: '15 cm',
        price: '395 kr',
        description: 'You give them an experience, not just a cake. They will remember that they made it themselves.'
      }
    ],
    cta: 'Order'
  }
};

const kitIcons = [Standard, Deluxe, GiftEdition];

export const Kits = ({ lang }: KitsProps) => {
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
      id="kits"
      ref={ref}
      className="py-[clamp(6rem,12vw,12rem)] px-4 md:px-8"
      style={{ backgroundColor: 'var(--soft-peach)' }}
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {t.kits.map((kit, i) => {
            const Icon = kitIcons[i];
            return (
            <div
              key={i}
              className={`bg-[var(--vanilla-cream)] transition-all duration-700 group hover:-translate-y-2 hover:shadow-2xl ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{
                transitionDelay: `${(i + 1) * 150}ms`,
                boxShadow: '0 4px 20px rgba(61, 42, 34, 0.05)'
              }}
            >
              <div
                className="relative aspect-[4/5] bg-[var(--warm-peach)]/20 flex items-center justify-center overflow-hidden group-hover:bg-[var(--warm-peach)]/30 transition-colors duration-500"
              >
                <Icon className="w-full h-full transform group-hover:scale-110 transition-transform duration-500" />
              </div>


              <div className="p-6 md:p-8">
                <div
                  className="mb-2 opacity-50"
                  style={{ fontSize: '0.875rem' }}
                >
                  {kit.size}
                </div>

                <h3 className="mb-3" style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>
                  {kit.name}
                </h3>

                <p className="mb-4 opacity-80" style={{ fontSize: '1rem', lineHeight: '1.6' }}>
                  {kit.description}
                </p>

                <div className="mb-6" style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.5rem)' }}>
                  {kit.price}
                </div>

                <MagneticButton
                  onClick={() => {
                    const orderSection = document.getElementById('order');
                    if (orderSection) orderSection.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full px-6 py-3 transition-all duration-300 hover:bg-[var(--warm-peach)] hover:shadow-lg relative overflow-hidden"
                  style={{
                    fontFamily: 'var(--font-inter), sans-serif',
                    textTransform: 'uppercase',
                    letterSpacing: '0.18em',
                    fontSize: '0.75rem',
                    border: '1px solid var(--warm-cocoa)'
                  }}
                >
                  <span className="relative z-10">{t.cta}</span>
                </MagneticButton>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
