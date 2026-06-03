'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MagneticButton } from './MagneticButton';
import { Logo } from './Logo';

interface HeaderProps {
  lang: 'sv' | 'en';
  onLangToggle: () => void;
}

const content = {
  sv: {
    nav: ['Idén', 'Tårtkit', 'Företag', 'Hantverket', 'Om', 'Kontakt'],
    order: 'Beställ',
    recipes: 'Recept'
  },
  en: {
    nav: ['The Idea', 'Kits', 'Corporate', 'The Craft', 'About', 'Contact'],
    order: 'Order',
    recipes: 'Recipes'
  }
};

export const Header = ({ lang, onLangToggle }: HeaderProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
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
    const id = sections[index];
    const element = typeof document !== 'undefined' ? document.getElementById(id) : null;
    if (element) {
      // On the home page the section exists — smooth-scroll to it.
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      // On other routes (e.g. /recept) navigate home to that section.
      router.push(`/#${id}`);
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-[var(--vanilla-cream)]/95 backdrop-blur-sm shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-3 md:py-4 flex items-center justify-between">
        {/* Logo — replaces the old text wordmark */}
        <Logo
          className={isScrolled
            ? 'h-10 md:h-12 lg:h-14'
            : 'h-12 md:h-16 lg:h-20'}
          asButton
        />

        <nav className="hidden md:flex items-center gap-8">
          {t.nav.map((item, i) => (
            <button
              key={item}
              onClick={() => scrollToSection(i)}
              className="type-caps relative transition-colors hover:text-[var(--dusty-terracotta)] group"
            >
              {item}
              <span
                className="absolute bottom-0 left-0 w-0 h-px bg-[var(--dusty-terracotta)] group-hover:w-full transition-all duration-300"
              />
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href={`/${lang}/recept`}
            className="type-caps hidden md:block relative transition-colors hover:text-[var(--dusty-terracotta)]"
          >
            {t.recipes}
          </Link>

          <MagneticButton
            onClick={() => scrollToSection(5)}
            className="type-caps hidden md:block px-6 py-2 transition-all duration-300 hover:bg-[var(--warm-peach)] hover:shadow-md"
            style={{ border: '1px solid var(--warm-cocoa)' }}
          >
            {t.order}
          </MagneticButton>

          <button
            onClick={onLangToggle}
            className="type-caps tap transition-colors hover:text-[var(--dusty-terracotta)]"
          >
            {lang === 'sv' ? 'EN' : 'SV'}
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden tap"
            aria-label="Menu"
            aria-expanded={isMobileMenuOpen}
          >
            <span className="flex flex-col gap-1.5 w-6" aria-hidden="true">
              <span className={`h-0.5 bg-current transition-transform ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`h-0.5 bg-current transition-opacity ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`h-0.5 bg-current transition-transform ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </span>
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden fixed inset-0 z-[-1] bg-transparent cursor-default"
          />
          <div className="md:hidden bg-[var(--vanilla-cream)] border-t border-[var(--warm-cocoa)]/10 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <nav className="px-4 py-6 flex flex-col gap-2">
              {t.nav.map((item, i) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(i)}
                  className="type-caps text-left min-h-11 flex items-center transition-colors hover:text-[var(--dusty-terracotta)]"
                >
                  {item}
                </button>
              ))}
              <Link
                href={`/${lang}/recept`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="type-caps text-left min-h-11 flex items-center transition-colors hover:text-[var(--dusty-terracotta)]"
              >
                {t.recipes}
              </Link>
              <button
                onClick={() => scrollToSection(5)}
                className="type-caps mt-2 px-6 min-h-11 text-center transition-all duration-300 hover:bg-[var(--warm-peach)]"
                style={{ border: '1px solid var(--warm-cocoa)' }}
              >
                {t.order}
              </button>
            </nav>
          </div>
        </>
      )}
    </header>
  );
};
