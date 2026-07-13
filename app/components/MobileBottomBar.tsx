'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Lang } from '@/lib/i18n';

/** Mobile-only persistent bottom navigation. Surfaces the four key destinations
 *  so users on a sub-page can always find their way back to the home one-pager
 *  (marketing), the recipe library, the shop, and their account. Always
 *  visible — page content reserves clearance via --bottom-bar-clearance so
 *  nothing sits beneath it. */
export function MobileBottomBar({
  lang,
  isLoggedIn,
}: {
  lang: Lang;
  isLoggedIn: boolean;
}) {
  const pathname = usePathname() ?? '/';

  const t =
    lang === 'sv'
      ? { home: 'Hem', recipes: 'Recept', shop: 'Butik', account: 'Konto' }
      : { home: 'Home', recipes: 'Recipes', shop: 'Shop', account: 'Account' };

  const isHome = pathname === '/' || pathname === `/${lang}` || pathname === `/${lang}/`;
  const tabs: { key: string; href: string; label: string; active: boolean; icon: string }[] = [
    { key: 'home', href: '/', label: t.home, active: isHome, icon: '/icons/menu icons/Home icon.svg' },
    {
      key: 'recipes',
      href: `/${lang}/recept`,
      label: t.recipes,
      active: pathname.startsWith(`/${lang}/recept`),
      icon: '/icons/menu icons/Recipe icon.svg',
    },
    {
      key: 'shop',
      href: `/${lang}/butik`,
      label: t.shop,
      active:
        pathname.startsWith(`/${lang}/butik`) || pathname.startsWith(`/${lang}/varukorg`),
      icon: '/icons/menu icons/Shop icon.svg',
    },
    {
      key: 'account',
      href: isLoggedIn ? `/${lang}/min-sida` : `/${lang}/logga-in`,
      label: t.account,
      active:
        pathname.startsWith(`/${lang}/min-sida`) || pathname.startsWith(`/${lang}/logga-in`),
      icon: '/icons/menu icons/Account icon.svg',
    },
  ];

  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed left-0 right-0 bottom-0 z-40"
      style={{
        backgroundColor: 'var(--vanilla-cream)',
        borderTop: '1px solid rgba(61, 42, 34, 0.1)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <ul className="flex items-stretch justify-around">
        {tabs.map((tab) => (
          <li key={tab.key} className="flex-1">
            <Link
              href={tab.href}
              aria-current={tab.active ? 'page' : undefined}
              className="flex flex-col items-center justify-center gap-1 py-2 transition-colors"
              style={{ color: tab.active ? 'var(--dusty-terracotta)' : 'var(--warm-cocoa)' }}
            >
              {/* Full-colour raster icons can't recolour for the active tab, so
                  the selected state reads from a warm-peach pill behind the icon
                  (plus the label colour + aria-current), not the icon itself. */}
              <span
                aria-hidden
                className="inline-flex items-center justify-center transition-colors"
                style={{
                  width: '2.25rem',
                  height: '2.25rem',
                  borderRadius: '9999px',
                  backgroundColor: tab.active ? 'var(--warm-peach)' : 'transparent',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- next/image refuses SVG */}
                <img src={encodeURI(tab.icon)} alt="" width={26} height={26} style={{ display: 'block' }} />
              </span>
              <span
                className="type-caps"
                style={{ fontSize: '0.5625rem', letterSpacing: '0.12em', opacity: tab.active ? 1 : 0.75 }}
              >
                {tab.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

