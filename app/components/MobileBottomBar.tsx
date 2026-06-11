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
  const tabs: { key: string; href: string; label: string; active: boolean; icon: React.ReactNode }[] = [
    { key: 'home', href: '/', label: t.home, active: isHome, icon: <HomeIcon /> },
    {
      key: 'recipes',
      href: `/${lang}/recept`,
      label: t.recipes,
      active: pathname.startsWith(`/${lang}/recept`),
      icon: <BookIcon />,
    },
    {
      key: 'shop',
      href: `/${lang}/butik`,
      label: t.shop,
      active:
        pathname.startsWith(`/${lang}/butik`) || pathname.startsWith(`/${lang}/varukorg`),
      icon: <BagIcon />,
    },
    {
      key: 'account',
      href: isLoggedIn ? `/${lang}/min-sida` : `/${lang}/logga-in`,
      label: t.account,
      active:
        pathname.startsWith(`/${lang}/min-sida`) || pathname.startsWith(`/${lang}/logga-in`),
      icon: <UserIcon />,
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
              <span aria-hidden className="inline-flex">
                {tab.icon}
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

const iconProps = {
  viewBox: '0 0 24 24',
  width: 22,
  height: 22,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const HomeIcon = () => (
  <svg {...iconProps} aria-hidden>
    <path d="M3 11 12 3l9 8" />
    <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
  </svg>
);

const BookIcon = () => (
  <svg {...iconProps} aria-hidden>
    <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19v15.5H5.5A1.5 1.5 0 0 1 4 17V4.5Z" />
    <path d="M4 17a1.5 1.5 0 0 1 1.5-1.5H19" />
    <path d="M9 7h6" />
    <path d="M9 10.5h4" />
  </svg>
);

const BagIcon = () => (
  <svg {...iconProps} aria-hidden>
    <path d="M5 7h14l-1 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 7Z" />
    <path d="M9 7a3 3 0 0 1 6 0" />
  </svg>
);

const UserIcon = () => (
  <svg {...iconProps} aria-hidden>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
  </svg>
);
