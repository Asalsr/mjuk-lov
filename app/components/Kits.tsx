'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
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
        description: 'Perfekt för 6-8 personer. Allt du behöver för att skapa din tårta hemma.'
      },
      {
        name: 'Deluxe',
        size: '20 cm',
        price: '445 kr',
        description: 'För 10-12 personer. Extra höjd, extra smak, extra allt.'
      },
      {
        name: 'Presentupplaga',
        size: '15 cm',
        price: '395 kr',
        description: 'Som Standard, men i vacker presentask med dedikation.'
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
        description: 'Perfect for 6-8 people. Everything you need to create your cake at home.'
      },
      {
        name: 'Deluxe',
        size: '20 cm',
        price: '445 kr',
        description: 'For 10-12 people. Extra height, extra flavor, extra everything.'
      },
      {
        name: 'Gift Edition',
        size: '15 cm',
        price: '395 kr',
        description: 'Like Standard, but in a beautiful gift box with dedication.'
      }
    ],
    cta: 'Order'
  }
};

const kitIcons = [Standard, Deluxe, GiftEdition];

export const Kits = ({ lang }: KitsProps) => {
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

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-12">
          {t.kits.map((kit, i) => {
            const Icon = kitIcons[i];
            return (
            <div
              key={i}
              className={`bg-[var(--vanilla-cream)] transition-all duration-700 group md:hover:-translate-y-2 md:hover:shadow-2xl ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{
                transitionDelay: `${(i + 1) * 150}ms`,
                boxShadow: '0 4px 20px rgba(61, 42, 34, 0.05)'
              }}
            >
              <div
                className="relative aspect-[4/3] sm:aspect-[4/5] bg-[var(--warm-peach)]/20 flex items-center justify-center overflow-hidden group-hover:bg-[var(--warm-peach)]/30 transition-colors duration-500"
              >
                <Icon className="w-full h-full transform group-hover:scale-110 transition-transform duration-500" />
              </div>


              <div className="p-6 md:p-8">
                <div className="type-caps mb-2 ink-muted">
                  {kit.size}
                </div>

                <h3 className="mb-3" style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>
                  {kit.name}
                </h3>

                <p className="type-body mb-4 opacity-80">
                  {kit.description}
                </p>

                <div className="type-serif mb-6" style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.5rem)' }}>
                  {kit.price}
                </div>

                <MagneticButton
                  onClick={() => router.push(`/${lang}/butik`)}
                  className="type-caps w-full px-6 py-3 transition-all duration-300 hover:bg-[var(--warm-peach)] hover:shadow-lg relative overflow-hidden"
                  style={{ border: '1px solid var(--warm-cocoa)' }}
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
