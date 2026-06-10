'use client';

import { useRouter } from 'next/navigation';
import { Header } from '../Header';
import { Footer } from '../Footer';
import { NoiseTexture } from '../NoiseTexture';
import { CustomCursor } from '../CustomCursor';
import { FloatingElements } from '../FloatingElements';
import { BackToTop } from '../BackToTop';
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
      <NoiseTexture />
      <CustomCursor />
      <FloatingElements />
      <BackToTop />
      <Header lang={lang} onLangToggle={toggleLang} />
      {children}
      <Footer lang={lang} />
    </div>
  );
}
