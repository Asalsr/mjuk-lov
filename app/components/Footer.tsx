'use client';

import Link from 'next/link';
import { Logo } from './Logo';
import type { Lang } from '@/lib/i18n';

interface FooterProps {
  lang: Lang;
}

// NOTE: Replace placeholder values before launch:
//  - phone: real number once registered
//  - email: confirm mjuklov.se@gmail.com / mjuklov.se@gmail.com inboxes are live
//  - location.line1: neighborhood (Hissingen is a placeholder)
//  - allergen: confirm full list once recipe range is fixed
//  - social hrefs: Instagram/TikTok/Facebook are the real handles Asal
//    provided (@mjuk.lov / mjuklov / fb profile 61590793712182). Confirm
//    they're the intended public accounts before launch.
//  - follow.title (fa) + all three fa aria-labels: machine-drafted Persian,
//    needs a native-speaker check before shipping.
const social = {
  instagram: 'https://instagram.com/mjuk.lov', // handle: @mjuk.lov
  tiktok: 'https://tiktok.com/@mjuklov', // handle: mjuklov
  facebook: 'https://www.facebook.com/profile.php?id=61590793712182'
};

const content = {
  sv: {
    location: {
      title: 'Plats',
      line1: 'Hissingen',
      line2: 'Göteborg'
    },
    contact: {
      title: 'Kontakt',
      email: 'mjuklov.se@gmail.com',
      phone: '+46 76 576 1526' // PLACEHOLDER
    },
    follow: {
      title: 'Följ oss',
      instagram: 'Följ Mjuk Lov på Instagram',
      tiktok: 'Följ Mjuk Lov på TikTok',
      facebook: 'Följ Mjuk Lov på Facebook'
    },
    allergen: 'Vårt kök hanterar gluten, mjölk, ägg, mandel och hasselnötter. Fråga gärna om annat.',
    copyright: '© 2026 Mjuk Lov',
    privacy: 'Integritetspolicy',
    terms: 'Villkor'
  },
  en: {
    location: {
      title: 'Location',
      line1: 'Hissingen',
      line2: 'Gothenburg'
    },
    contact: {
      title: 'Contact',
      email: 'mjuklov.se@gmail.com',
      phone: '+46 76 576 1526' // PLACEHOLDER
    },
    follow: {
      title: 'Follow',
      instagram: 'Follow Mjuk Lov on Instagram',
      tiktok: 'Follow Mjuk Lov on TikTok',
      facebook: 'Follow Mjuk Lov on Facebook'
    },
    allergen: 'Our kitchen handles gluten, milk, eggs, almonds and hazelnuts. Ask us about anything else.',
    copyright: '© 2026 Mjuk Lov',
    privacy: 'Privacy Policy',
    terms: 'Terms'
  },
  fa: {
    location: {
      title: 'مکان',
      line1: 'هیسینگن',
      line2: 'یوتبوری'
    },
    contact: {
      title: 'تماس با ما',
      email: 'mjuklov.se@gmail.com',
      phone: '+46 76 576 1526' // PLACEHOLDER
    },
    follow: {
      // TODO(fa): native-speaker check — machine-drafted Persian
      title: 'ما را دنبال کنید',
      instagram: 'دنبال کردن Mjuk Lov در اینستاگرام',
      tiktok: 'دنبال کردن Mjuk Lov در تیک‌تاک',
      facebook: 'دنبال کردن Mjuk Lov در فیس‌بوک'
    },
    allergen: 'آشپزخانه ما با گلوتن، شیر، تخم‌مرغ، بادام و فندق کار می‌کند. درباره موارد دیگر از ما بپرسید.',
    copyright: '© 2026 Mjuk Lov',
    privacy: 'سیاست حریم خصوصی',
    terms: 'شرایط'
  }
};

// Monoline glyphs, stroke-only, currentColor. No background/container — bare
// glyphs, matching the site's unboxed-icon convention. ~24px visual size.
const iconProps = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true
};

const InstagramIcon = () => (
  <svg {...iconProps}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const TikTokIcon = () => (
  <svg {...iconProps}>
    <path d="M14 4c0 2.5 2 4.2 4.5 4.2" />
    <path d="M14 4v11a3.5 3.5 0 1 1-3.5-3.5" />
  </svg>
);

const FacebookIcon = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="12" r="9" />
    <path d="M13.6 6.8h-1a2 2 0 0 0-2 2v8.4" />
    <path d="M8.7 11.3h5" />
  </svg>
);

export const Footer = ({ lang }: FooterProps) => {
  const t = content[lang];

  const links = [
    { key: 'instagram', href: social.instagram, label: t.follow.instagram, Icon: InstagramIcon },
    { key: 'tiktok', href: social.tiktok, label: t.follow.tiktok, Icon: TikTokIcon },
    { key: 'facebook', href: social.facebook, label: t.follow.facebook, Icon: FacebookIcon }
  ];

  return (
    <footer
      className="py-12 md:py-16 px-4 md:px-8 border-t"
      style={{
        backgroundColor: 'var(--vanilla-cream)',
        borderColor: 'rgba(61, 42, 34, 0.1)'
      }}
    >
      <div className="max-w-[1200px] mx-auto">
        {/* 2-col base (Logo | Follow, then Location | Contact) so the mobile
            footer reads as two composed rows, not four disconnected full-width
            blocks. Expands to the 4-across row at lg. */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 mb-12">
          <div>
            {/* Logo replaces the old text wordmark + tagline. Logo already includes "A SOFT PROMISE". */}
            <Logo className="h-28 md:h-36 lg:h-42" />
          </div>

          <div>
            <div className="type-caps mb-3 ink-muted">
              {t.follow.title}
            </div>
            <div className="flex items-center gap-2">
              {links.map(({ key, href, label, Icon }) => (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="inline-flex items-center justify-center w-11 h-11 text-[var(--warm-cocoa)] transition-all duration-300 hover:text-[var(--dusty-terracotta)] hover:-translate-y-0.5"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          <div>
            <div className="type-caps mb-3 ink-muted">
              {t.location.title}
            </div>
            <div className="type-body">
              {t.location.line1}
              <br />
              {t.location.line2}
            </div>
          </div>

          <div>
            <div className="type-caps mb-3 ink-muted">
              {t.contact.title}
            </div>
            <div className="type-body">
              <a
                href={`mailto:${t.contact.email}`}
                className="block mb-1 break-words transition-all duration-300 hover:text-[var(--dusty-terracotta)] hover:translate-x-1"
              >
                {t.contact.email}
              </a>
              <a
                href={`tel:${t.contact.phone.replace(/\s/g, '')}`}
                className="block transition-all duration-300 hover:text-[var(--dusty-terracotta)] hover:translate-x-1"
              >
                {t.contact.phone}
              </a>
            </div>
          </div>
        </div>

        <div
          className="type-body flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-8 border-t ink-muted"
          style={{ borderColor: 'rgba(61, 42, 34, 0.1)' }}
        >
          <div>{t.allergen}</div>
          <div className="flex items-center gap-6">
            <Link href={`/${lang}/integritetspolicy`} className="type-caps transition-colors hover:text-[var(--dusty-terracotta)]">
              {t.privacy}
            </Link>
            <Link href={`/${lang}/villkor`} className="type-caps transition-colors hover:text-[var(--dusty-terracotta)]">
              {t.terms}
            </Link>
            <span>{t.copyright}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
