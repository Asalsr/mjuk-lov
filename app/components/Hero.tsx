'use client';

import { useEffect, useState } from 'react';
import { CardamomPod, Magnolia } from './Icons';
import { Logo } from './Logo';
import { useIsTouch } from '../hooks/useIsTouch';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

interface HeroProps {
  lang: 'sv' | 'en';
}

const content = {
  sv: {
    promise: 'Hembakat i Göteborg. För vanliga onsdagar och tillfällen som förtjänar mer.',
    scroll: 'Rulla ner'
  },
  en: {
    promise: 'Home baked in Gothenburg. For ordinary Wednesdays and occasions that deserve more.',
    scroll: 'Scroll down'
  }
};

export const Hero = ({ lang }: HeroProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const isTouch = useIsTouch();
  const reduced = usePrefersReducedMotion();
  const t = content[lang];

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (isTouch || reduced) return;
    let raf = 0;
    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() =>
        setMousePos({
          x: (e.clientX / window.innerWidth - 0.5) * 20,
          y: (e.clientY / window.innerHeight - 0.5) * 20
        })
      );
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isTouch, reduced]);

  return (
    <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">
      {/* The visible wordmark is the Logo image; this gives the page a real,
          screen-reader/SEO-visible <h1> without altering the design. */}
      <h1 className="sr-only">Mjuk Lov — {t.promise}</h1>
      {/* Decorative watercolor corners — raised opacity to 25% because
          full-color illustrations look muddy at the old 10%. Adjust to taste. */}
      <div className="absolute inset-0 hidden md:block pointer-events-none">
        <div
          className="absolute top-12 left-12 opacity-25 transition-transform duration-700 ease-out"
          style={{
            transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px) rotate(${mousePos.x * 0.5}deg)`
          }}
        >
          <CardamomPod className="w-24 h-24 lg:w-32 lg:h-32 xl:w-[9.8rem] xl:h-[9.8rem]" />
        </div>
        <div
          className="absolute bottom-12 right-12 opacity-25 transition-transform duration-700 ease-out"
          style={{
            transform: `translate(${-mousePos.x * 0.3}px, ${-mousePos.y * 0.3}px) rotate(${-mousePos.x * 0.3}deg)`
          }}
        >
          <Magnolia className="w-24 h-24 lg:w-32 lg:h-32 xl:w-[9.8rem] xl:h-[9.8rem]" />
        </div>
      </div>

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        {/* Big logo as the hero wordmark — replaces the old "mjuk lov" text */}
        <div
          className={`flex justify-center mb-10 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <Logo className="h-80 sm:h-80 md:h-96 lg:h-[28rem]" />
        </div>

        <p
          className={`type-body max-w-2xl mx-auto transition-all duration-700 delay-[600ms] ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {t.promise}
        </p>
      </div>

      <button
        onClick={() => {
          const ideaSection = document.getElementById('idea');
          if (ideaSection) ideaSection.scrollIntoView({ behavior: 'smooth' });
        }}
        className="absolute left-1/2 -translate-x-1/2 group cursor-pointer p-2"
        style={{ bottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
      >
        <div className="flex flex-col items-center gap-2 ink-muted group-hover:text-[var(--warm-cocoa)] transition-all duration-300">
          <span className="type-caps">{t.scroll}</span>
          <div className="w-0.5 h-12 bg-current group-hover:h-16 transition-all duration-500" />
        </div>
      </button>
    </section>
  );
};
