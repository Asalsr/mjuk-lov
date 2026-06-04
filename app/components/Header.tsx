'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from './Logo';
import { CartBadge } from './shop/CartBadge';

interface HeaderProps {
  lang: 'sv' | 'en';
  onLangToggle: () => void;
}

const content = {
  sv: {
    nav: ['Idén', 'Tårtkit', 'Företag', 'Hantverket', 'Om', 'Kontakt'],
    recipes: 'Recept',
    myPage: 'Min sida',
    shop: 'Butik',
    account: 'Konto',
  },
  en: {
    nav: ['The Idea', 'Kits', 'Corporate', 'The Craft', 'About', 'Contact'],
    recipes: 'Recipes',
    myPage: 'My page',
    shop: 'Shop',
    account: 'Account',
  },
};

export const Header = ({ lang, onLangToggle }: HeaderProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const router = useRouter();
  const t = content[lang];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (index: number) => {
    const sections = ['idea', 'kits', 'corporate', 'craft', 'about', 'order'];
    const id = sections[index];
    const element = typeof document !== 'undefined' ? document.getElementById(id) : null;
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      router.push(`/#${id}`);
    }
    setIsMobileMenuOpen(false);
  };

  // Recipes / Shop / My page — the app links shown in the profile dropdown.
  const accountLinks = [
    { href: `/${lang}/recept`, label: t.recipes },
    { href: `/${lang}/butik`, label: t.shop },
    { href: `/${lang}/min-sida`, label: t.myPage },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-[var(--vanilla-cream)]/95 backdrop-blur-sm shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-3 md:py-4 flex items-center justify-between">
        <Logo className={isScrolled ? 'h-10 md:h-12 lg:h-14' : 'h-12 md:h-16 lg:h-20'} asButton />

        {/* Marketing section nav (home one-pager) */}
        <nav className="hidden md:flex items-center gap-8">
          {t.nav.map((item, i) => (
            <button
              key={item}
              onClick={() => scrollToSection(i)}
              className="type-caps relative transition-colors hover:text-[var(--dusty-terracotta)] group"
            >
              {item}
              <span className="absolute bottom-0 left-0 w-0 h-px bg-[var(--dusty-terracotta)] group-hover:w-full transition-all duration-300" />
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {/* Profile / account — icon only, opens the app submenu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsAccountOpen((v) => !v)}
              aria-label={t.account}
              aria-expanded={isAccountOpen}
              className="tap transition-colors hover:text-[var(--dusty-terracotta)]"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 4-6 8-6s8 2 8 6" strokeLinecap="round" />
              </svg>
            </button>

            {isAccountOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setIsAccountOpen(false)}
                  className="fixed inset-0 z-[-1] bg-transparent cursor-default"
                />
                <div
                  className="absolute right-0 mt-3 min-w-[180px] flex flex-col bg-[var(--vanilla-cream)] shadow-md"
                  style={{ border: '1px solid rgba(61, 42, 34, 0.15)' }}
                >
                  {accountLinks.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setIsAccountOpen(false)}
                      className="type-caps px-5 py-3 transition-colors hover:bg-[var(--warm-peach)]/40"
                    >
                      {l.label}
                    </Link>
                  ))}
                  <CartBadge
                    lang={lang}
                    onClick={() => setIsAccountOpen(false)}
                    className="px-5 py-3 hover:bg-[var(--warm-peach)]/40"
                  />
                </div>
              </>
            )}
          </div>

          <button
            onClick={onLangToggle}
            className="type-caps tap transition-colors hover:text-[var(--dusty-terracotta)]"
          >
            {lang === 'sv' ? 'EN' : 'SV'}
          </button>

          {/* Mobile hamburger — section nav only */}
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
            </nav>
          </div>
        </>
      )}
    </header>
  );
};
