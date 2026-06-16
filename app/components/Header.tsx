'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from './Logo';
import { MobileBottomBar } from './MobileBottomBar';
import { useCart, cartCount } from '@/lib/cart/store';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import type { Lang } from '@/lib/i18n';

interface HeaderProps {
  lang: Lang;
  onSelectLang: (next: Lang) => void;
}

// Short codes keep the switcher compact and aligned with the rest of the caps
// nav (the old toggle showed "SV"/"EN"); full names would widen the control.
const LANG_LABELS: Record<Lang, string> = { sv: 'SV', en: 'EN', fa: 'فا' };

const content = {
  sv: {
    recipes: 'Recept',
    videos: 'Bakvideor',
    myPage: 'Min sida',
    shop: 'Butik',
    cart: 'Varukorg',
    account: 'Konto',
    logIn: 'Logga in',
    logOut: 'Logga ut',
  },
  en: {
    recipes: 'Recipes',
    videos: 'Baking videos',
    myPage: 'My page',
    shop: 'Shop',
    cart: 'Cart',
    account: 'Account',
    logIn: 'Log in',
    logOut: 'Log out',
  },
  fa: {
    recipes: 'دستورها',
    videos: 'ویدیوهای پخت',
    myPage: 'صفحه من',
    shop: 'فروشگاه',
    cart: 'سبد خرید',
    account: 'حساب کاربری',
    logIn: 'ورود',
    logOut: 'خروج',
  },
};

// Site nav. Two kinds of items:
//   - `id`   → scroll to a section on the home one-pager (or push /#id from a sub-page)
//   - `path` → real route on the localized app (recipes, shop, …)
// The desktop bar shows everything; the mobile hamburger sheet shows only the
// scroll-to-section items (the brand story), because real destinations live in
// the persistent bottom tab bar (see MobileBottomBar).
const NAV: ({ id: string; sv: string; en: string; fa: string } | { path: string; sv: string; en: string; fa: string })[] = [
  { id: 'idea', sv: 'Idén', en: 'The Idea', fa: 'ایده' },
  { path: 'recept', sv: 'Recept', en: 'Recipes', fa: 'دستورها' },
  { path: 'butik', sv: 'Butik', en: 'Shop', fa: 'فروشگاه' },
  { path: 'galleri', sv: 'Galleri', en: 'Gallery', fa: 'گالری' },
  { path: 'kit', sv: 'Tårtkit', en: 'Kits', fa: 'کیت‌های کیک' },
  { id: 'about', sv: 'Om', en: 'About', fa: 'درباره ما' },
  { id: 'order', sv: 'Kontakt', en: 'Contact', fa: 'تماس با ما' },
];

// Tagline shown beneath each marketing section in the mobile hamburger sheet
// so the menu reads as an intentional "about us" gateway, not a duplicate of
// the bottom bar.
const marketingTagline = (id: string, lang: Lang) => {
  const map: Record<string, { sv: string; en: string; fa: string }> = {
    idea: { sv: 'Vår berättelse', en: 'Our story', fa: 'داستان ما' },
    kits: { sv: 'Tårtkit & tillbehör', en: 'Cake kits & extras', fa: 'کیت کیک و لوازم' },
    about: { sv: 'Om Mjuk Lov', en: 'About Mjuk Lov', fa: 'درباره Mjuk Lov' },
    order: { sv: 'Hör av dig', en: 'Get in touch', fa: 'با ما در تماس باشید' },
  };
  return map[id]?.[lang] ?? '';
};

export const Header = ({ lang, onSelectLang }: HeaderProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLangOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setIsLangOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [isLangOpen]);
  const router = useRouter();
  const t = content[lang];
  const cartItems = cartCount(useCart());

  useEffect(() => {
    let raf = 0;
    const handleScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setIsScrolled(window.scrollY > 20));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => setIsLoggedIn(!!session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => setIsLoggedIn(!!session));
    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await createClient().auth.signOut();
    setIsAccountOpen(false);
    // Navigate home rather than refreshing in place: owner-only pages like
    // /admin call notFound() for guests, so a refresh-after-logout would 404.
    router.push('/');
    router.refresh();
  };

  const goToSection = (id: string) => {
    const element = typeof document !== 'undefined' ? document.getElementById(id) : null;
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      router.push(`/#${id}`);
    }
    setIsMobileMenuOpen(false);
  };

  // Profile dropdown — account-only. Recipes/Shop now live in the desktop nav
  // and in the mobile bottom bar, so the profile menu can stay focused on the
  // user's own account (matches IKEA/Etsy/Airbnb convention).
  const accountLinks = [{ href: `/${lang}/min-sida`, label: t.myPage }];

  return (
    <>
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-[var(--vanilla-cream)]/95 backdrop-blur-sm shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-3 md:py-4 flex items-center justify-between">
        <Link
          href="/"
          aria-label="Mjuk Lov"
          onClick={() => setIsMobileMenuOpen(false)}
          className="inline-flex items-center transition-opacity hover:opacity-80"
        >
          <Logo className={isScrolled ? 'h-10 md:h-12 lg:h-14' : 'h-12 md:h-16 lg:h-20'} />
        </Link>

        {/* Desktop nav. Marketing sections (scroll-to) and real destinations
            (Recept / Butik) sit side by side at this breakpoint. */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV.map((item) =>
            'path' in item ? (
              <Link
                key={item.path}
                href={`/${lang}/${item.path}`}
                className="type-caps relative transition-colors hover:text-[var(--dusty-terracotta)] group"
              >
                {item[lang]}
                <span className="absolute bottom-0 left-0 w-0 h-px bg-[var(--dusty-terracotta)] group-hover:w-full transition-all duration-300" />
              </Link>
            ) : (
              <button
                key={item.id}
                onClick={() => goToSection(item.id)}
                className="type-caps relative transition-colors hover:text-[var(--dusty-terracotta)] group"
              >
                {item[lang]}
                <span className="absolute bottom-0 left-0 w-0 h-px bg-[var(--dusty-terracotta)] group-hover:w-full transition-all duration-300" />
              </button>
            ),
          )}
        </nav>

        <div className="flex items-center gap-4">
          {/* Basket — appears beside the profile icon once items are added */}
          {cartItems > 0 && (
            <Link
              href={`/${lang}/varukorg`}
              aria-label={`${t.cart} (${cartItems})`}
              className="relative tap transition-colors hover:text-[var(--dusty-terracotta)]"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span
                className="absolute -top-2 -right-2 min-w-[1.05rem] h-[1.05rem] px-1 flex items-center justify-center rounded-full text-[0.625rem] leading-none"
                style={{ backgroundColor: 'var(--dusty-terracotta)', color: 'var(--vanilla-cream)' }}
              >
                {cartItems}
              </span>
            </Link>
          )}

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
                  className="absolute right-0 mt-3 min-w-[180px] max-w-[calc(100vw-1.5rem)] flex flex-col bg-[var(--vanilla-cream)] shadow-md"
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
                  <div style={{ borderTop: '1px solid rgba(61, 42, 34, 0.12)' }}>
                    {isLoggedIn ? (
                      <button
                        type="button"
                        onClick={signOut}
                        className="type-caps w-full text-left px-5 py-3 transition-colors hover:bg-[var(--warm-peach)]/40"
                      >
                        {t.logOut}
                      </button>
                    ) : (
                      <Link
                        href={`/${lang}/logga-in`}
                        onClick={() => setIsAccountOpen(false)}
                        className="type-caps block px-5 py-3 transition-colors hover:bg-[var(--warm-peach)]/40"
                      >
                        {t.logIn}
                      </Link>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Custom dropdown (not a native <select>, which forces its own white
              bg + border that won't match the brand). Fully transparent trigger;
              the menu uses the cream surface like the account menu. */}
          <div ref={langRef} className="relative">
            <button
              type="button"
              onClick={() => setIsLangOpen((o) => !o)}
              aria-haspopup="listbox"
              aria-expanded={isLangOpen}
              aria-label={lang === 'fa' ? 'انتخاب زبان' : lang === 'sv' ? 'Välj språk' : 'Choose language'}
              className="type-caps tap cursor-pointer transition-colors hover:text-[var(--dusty-terracotta)]"
              style={{ background: 'transparent', border: 'none', color: 'inherit' }}
            >
              {LANG_LABELS[lang]}
            </button>
            {isLangOpen && (
              <ul
                role="listbox"
                className="absolute end-0 mt-1 z-[10002] py-1 overflow-hidden"
                style={{ backgroundColor: 'var(--vanilla-cream)', boxShadow: '0 6px 20px rgba(61, 42, 34, 0.12)', minWidth: '3.25rem' }}
              >
                {(['sv', 'en', 'fa'] as Lang[]).map((l) => (
                  <li key={l}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={l === lang}
                      onClick={() => { setIsLangOpen(false); onSelectLang(l); }}
                      className="type-caps w-full px-4 py-2 text-center cursor-pointer transition-colors hover:bg-[var(--warm-peach)]"
                      style={{ background: 'transparent', border: 'none', color: l === lang ? 'var(--dusty-terracotta)' : 'inherit' }}
                    >
                      {LANG_LABELS[l]}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Hamburger — MOBILE ONLY. Use Tailwind display utils (not .tap, which
              forces display and would override md:hidden, leaking onto desktop). */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden inline-flex items-center justify-center min-w-11 min-h-11"
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
          <div className="md:hidden bg-[var(--vanilla-cream)] border-t border-[var(--warm-cocoa)]/10 max-h-[calc(100svh-4rem)] overflow-y-auto pb-[env(safe-area-inset-bottom)]">
            {/* Mobile hamburger = the brand story. Real destinations live in
                the MobileBottomBar; this sheet stays focused on marketing. */}
            <nav className="px-4 py-6 flex flex-col gap-1">
              {NAV.filter((item): item is { id: string; sv: string; en: string; fa: string } => 'id' in item).map((item) => (
                <button
                  key={item.id}
                  onClick={() => goToSection(item.id)}
                  className="text-left min-h-11 flex flex-col justify-center py-2 transition-colors hover:text-[var(--dusty-terracotta)]"
                >
                  <span className="type-caps">{item[lang]}</span>
                  <span className="type-body ink-muted" style={{ fontSize: '0.875rem' }}>
                    {marketingTagline(item.id, lang)}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </>
      )}

    </header>

      {/* Mobile-only persistent bottom destination bar. Rendered OUTSIDE the
          <header> on purpose: the header gains a backdrop-filter when scrolled,
          and a backdrop-filter makes itself the containing block for any
          position:fixed descendant — which would snap this bar up to the header
          (i.e. to the top of the screen) as soon as you scroll. As a sibling of
          the header it is measured against the viewport and stays pinned to the
          bottom in every scroll state. */}
      <MobileBottomBar lang={lang} isLoggedIn={isLoggedIn} />
    </>
  );
};
