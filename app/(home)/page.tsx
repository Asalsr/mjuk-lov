'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/app/components/Header';
import { Hero } from '@/app/components/Hero';
import { TheIdea } from '@/app/components/TheIdea';
import { Kits } from '@/app/components/Kits';
import { Corporate } from '@/app/components/Corporate';
import { TheCraft } from '@/app/components/TheCraft';
import { About } from '@/app/components/About';
import { Order } from '@/app/components/Order';
import { Footer } from '@/app/components/Footer';
import { FloatingElements } from '@/app/components/FloatingElements';
import { CustomCursor } from '@/app/components/CustomCursor';
import { SectionDivider, WaveDivider } from '@/app/components/SectionDivider';
import { LoadingScreen } from '@/app/components/LoadingScreen';
import { NoiseTexture } from '@/app/components/NoiseTexture';
import { ScrollProgress } from '@/app/components/ScrollProgress';
import { BackToTop } from '@/app/components/BackToTop';

export default function Page() {
  const [lang, setLang] = useState<'sv' | 'en'>('sv');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Resolve the visitor's language once on mount from their saved choice,
    // falling back to the browser locale. This must run client-side (localStorage
    // is unavailable during SSR), so the server safely defaults to 'sv'.
    const savedLang = localStorage.getItem('mjuklov_lang');
    let initial: 'sv' | 'en' | null = null;
    if (savedLang === 'en' || savedLang === 'sv') {
      initial = savedLang;
    } else if (typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('en')) {
      initial = 'en';
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client-only hydration of a persisted preference
    if (initial) setLang(initial);

    // Intro loading screen plays once per browser session — on a fresh visit,
    // but not on every internal navigation within the same session. Users who
    // prefer reduced motion skip the animated intro entirely.
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || sessionStorage.getItem('mjuklov_intro_seen')) {
      setIsLoading(false);
    }
  }, []);

  // Keep the document language in sync with the toggle so the browser doesn't
  // treat an English home page as Swedish (and auto-translate it). The root
  // layout renders lang="sv" on the server; this corrects it after hydration.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const toggleLang = () => {
    const newLang = lang === 'sv' ? 'en' : 'sv';
    setLang(newLang);
    localStorage.setItem('mjuklov_lang', newLang);
  };

  return (
    <>
      {isLoading && (
        <LoadingScreen
          onComplete={() => {
            try {
              sessionStorage.setItem('mjuklov_intro_seen', '1');
            } catch {
              /* ignore */
            }
            setIsLoading(false);
          }}
        />
      )}
      <div className="min-h-screen relative" style={{ scrollBehavior: 'smooth' }}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[10001] focus:px-4 focus:py-2 focus:shadow-md type-caps"
          style={{ backgroundColor: 'var(--vanilla-cream)', color: 'var(--warm-cocoa)' }}
        >
          {lang === 'sv' ? 'Hoppa till innehåll' : 'Skip to content'}
        </a>
        <ScrollProgress />
        <NoiseTexture />
        <CustomCursor />
        <FloatingElements />
        <BackToTop />
        <Header lang={lang} onLangToggle={toggleLang} />
        <main id="main-content" tabIndex={-1}>
        <Hero lang={lang} />
        <TheIdea lang={lang} />
        <SectionDivider fromColor="var(--vanilla-cream)" toColor="var(--soft-peach)" />
        <Kits lang={lang} />
        <WaveDivider fromColor="var(--soft-peach)" toColor="var(--vanilla-cream)" />
        <Corporate lang={lang} />
        <SectionDivider fromColor="var(--vanilla-cream)" toColor="rgba(232, 184, 154, 0.2)" />
        <TheCraft lang={lang} />
        <WaveDivider fromColor="rgba(232, 184, 154, 0.2)" toColor="var(--vanilla-cream)" />
        <About lang={lang} />
        <SectionDivider fromColor="var(--vanilla-cream)" toColor="var(--warm-cocoa)" />
        <Order lang={lang} />
        <WaveDivider fromColor="var(--warm-cocoa)" toColor="var(--vanilla-cream)" />
        </main>
        <Footer lang={lang} />
      </div>
    </>
  );
}
