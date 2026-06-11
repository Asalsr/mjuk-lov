'use client';

import { useRouter } from 'next/navigation';
import { Header } from '../Header';
import { Footer } from '../Footer';
import { NoiseTexture } from '../NoiseTexture';
import { CustomCursor } from '../CustomCursor';
import { FloatingElements } from '../FloatingElements';
import { BackToTop } from '../BackToTop';
import { ScrollProgress } from '../ScrollProgress';
import type { Lang } from '@/lib/i18n';

/** Wraps recipe routes in the exact same chrome as the home page so the look
 *  is identical: noise texture, custom cursor, floating motifs, real Header +
 *  Footer. Recipe content (server-rendered) is passed as children. */
export function RecipeShell({
  lang,
  altPath,
  children,
}: {
  lang: Lang;
  altPath: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  const toggleLang = () => {
    const next = lang === 'sv' ? 'en' : 'sv';
    try {
      localStorage.setItem('mjuklov_lang', next);
    } catch {
      /* ignore */
    }
    router.push(altPath);
  };

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: 'var(--vanilla-cream)' }}>
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
        {children}
      </main>
      <Footer lang={lang} />
    </div>
  );
}
