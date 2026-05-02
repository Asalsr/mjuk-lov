'use client';

import { useEffect, useState } from 'react';
import { PipingCurl, CardamomPod } from './Icons';

interface HeroProps {
  lang: 'sv' | 'en';
}

const content = {
  sv: {
    tagline: 'ett mjukt löfte',
    promise: 'Hembakat i Göteborg. För ordinära onsdagar och alldeles speciella tillfällen.',
    scroll: 'Rulla ner'
  },
  en: {
    tagline: 'a soft promise',
    promise: 'Home baked in Gothenburg. For ordinary Wednesdays and very special occasions.',
    scroll: 'Scroll down'
  }
};

export const Hero = ({ lang }: HeroProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const t = content[lang];

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 hidden md:block pointer-events-none">
        <div
          className="absolute top-8 left-8 opacity-10 transition-transform duration-700 ease-out"
          style={{
            transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px) rotate(${mousePos.x * 0.5}deg)`
          }}
        >
          <CardamomPod className="w-24 h-24 text-[var(--dusty-terracotta)]" />
        </div>
        <div
          className="absolute bottom-8 right-8 opacity-10 transition-transform duration-700 ease-out"
          style={{
            transform: `translate(${-mousePos.x * 0.3}px, ${-mousePos.y * 0.3}px) rotate(${-mousePos.x * 0.3}deg)`
          }}
        >
          <PipingCurl className="w-24 h-24 text-[var(--dusty-terracotta)]" />
        </div>
      </div>

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <div
          className={`italic mb-6 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)' }}
        >
          {t.tagline}
        </div>

        <h1
          className={`lowercase mb-8 transition-all duration-700 delay-300 hover:tracking-wider ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{
            fontSize: 'clamp(4rem, 12vw, 9rem)',
            letterSpacing: '0.04em',
            lineHeight: '0.95',
            transition: 'letter-spacing 0.5s ease, opacity 0.7s, transform 0.7s',
            cursor: 'default'
          }}
        >
          mjuk lov
        </h1>

        <p
          className={`max-w-2xl mx-auto transition-all duration-700 delay-[600ms] ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', lineHeight: '1.6' }}
        >
          {t.promise}
        </p>
      </div>

      <button
        onClick={() => {
          const ideaSection = document.getElementById('idea');
          if (ideaSection) ideaSection.scrollIntoView({ behavior: 'smooth' });
        }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 group cursor-pointer"
      >
        <div className="flex flex-col items-center gap-2 opacity-40 group-hover:opacity-100 transition-all duration-300">
          <span style={{ fontSize: '0.75rem', letterSpacing: '0.1em' }}>{t.scroll}</span>
          <div className="w-0.5 h-12 bg-current group-hover:h-16 transition-all duration-500" />
        </div>
      </button>
    </section>
  );
};
