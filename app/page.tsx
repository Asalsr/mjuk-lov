'use client';

import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { TheIdea } from './components/TheIdea';
import { Kits } from './components/Kits';
import { Corporate } from './components/Corporate';
import { TheCraft } from './components/TheCraft';
import { About } from './components/About';
import { Order } from './components/Order';
import { Footer } from './components/Footer';
import { FloatingElements } from './components/FloatingElements';
import { CustomCursor } from './components/CustomCursor';
import { SectionDivider, WaveDivider } from './components/SectionDivider';
import { LoadingScreen } from './components/LoadingScreen';
import { NoiseTexture } from './components/NoiseTexture';
import { ScrollProgress } from './components/ScrollProgress';
import { BackToTop } from './components/BackToTop';

export default function Page() {
  const [lang, setLang] = useState<'sv' | 'en'>('sv');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedLang = localStorage.getItem('mjuklov_lang');
    if (savedLang === 'en' || savedLang === 'sv') {
      setLang(savedLang);
    } else if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('en')) {
        setLang('en');
      }
    }
  }, []);

  const toggleLang = () => {
    const newLang = lang === 'sv' ? 'en' : 'sv';
    setLang(newLang);
    localStorage.setItem('mjuklov_lang', newLang);
  };

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReducedMotion.matches) {
      document.documentElement.style.setProperty('--animation-duration', '0ms');
    }
  }, []);

  return (
    <>
      {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}
      <div className="min-h-screen relative" style={{ scrollBehavior: 'smooth' }}>
        <ScrollProgress />
        <NoiseTexture />
        <CustomCursor />
        <FloatingElements />
        <BackToTop />
        <Header lang={lang} onLangToggle={toggleLang} />
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
        <Footer lang={lang} />
      </div>
    </>
  );
}
