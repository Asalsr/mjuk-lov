'use client';

import { useState, useEffect } from 'react';
import { MagneticButton } from './MagneticButton';

interface HeaderProps {
  lang: 'sv' | 'en';
  onLangToggle: () => void;
}

const content = {
  sv: {
    nav: ['Idén', 'Tårtkit', 'Företag', 'Hantverket', 'Om', 'Kontakt'],
    order: 'Beställ'
  },
  en: {
    nav: ['The Idea', 'Kits', 'Corporate', 'The Craft', 'About', 'Contact'],
    order: 'Order'
  }
};

export const Header = ({ lang, onLangToggle }: HeaderProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const t = content[lang];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (index: number) => {
    const sections = ['idea', 'kits', 'corporate', 'craft', 'about', 'order'];
    const element = document.getElementById(sections[index]);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-[var(--vanilla-cream)]/95 backdrop-blur-sm shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4 md:py-6 flex items-center justify-between">
        <div
          className="lowercase italic cursor-pointer"
          style={{ letterSpacing: '0.04em', fontSize: 'clamp(1.25rem, 3vw, 1.5rem)' }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          mjuk lov
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {t.nav.map((item, i) => (
            <button
              key={item}
              onClick={() => scrollToSection(i)}
              className="relative transition-colors hover:text-[var(--dusty-terracotta)] group"
              style={{ fontSize: '0.95rem' }}
            >
              {item}
              <span
                className="absolute bottom-0 left-0 w-0 h-px bg-[var(--dusty-terracotta)] group-hover:w-full transition-all duration-300"
              />
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <MagneticButton
            onClick={() => scrollToSection(5)}
            className="hidden md:block px-6 py-2 transition-all duration-300 hover:bg-[var(--warm-peach)] hover:shadow-md"
            style={{
              fontFamily: 'var(--font-inter), sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              fontSize: '0.75rem',
              border: '1px solid var(--warm-cocoa)'
            }}
          >
            {t.order}
          </MagneticButton>

          <button
            onClick={onLangToggle}
            className="px-3 py-1 transition-colors hover:text-[var(--dusty-terracotta)]"
            style={{
              fontFamily: 'var(--font-inter), sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontSize: '0.75rem'
            }}
          >
            {lang === 'sv' ? 'EN' : 'SV'}
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden flex flex-col gap-1.5 w-6"
            aria-label="Menu"
          >
            <span className={`h-0.5 bg-current transition-transform ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`h-0.5 bg-current transition-opacity ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`h-0.5 bg-current transition-transform ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-[var(--vanilla-cream)] border-t border-[var(--warm-cocoa)]/10">
          <nav className="px-4 py-6 flex flex-col gap-4">
            {t.nav.map((item, i) => (
              <button
                key={item}
                onClick={() => scrollToSection(i)}
                className="text-left py-2 transition-colors hover:text-[var(--dusty-terracotta)]"
              >
                {item}
              </button>
            ))}
            <button
              onClick={() => scrollToSection(5)}
              className="mt-2 px-6 py-3 text-center transition-all duration-300 hover:bg-[var(--warm-peach)]"
              style={{
                fontFamily: 'var(--font-inter), sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
                fontSize: '0.75rem',
                border: '1px solid var(--warm-cocoa)'
              }}
            >
              {t.order}
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};
