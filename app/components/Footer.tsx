'use client';

import { Logo } from './Logo';

interface FooterProps {
  lang: 'sv' | 'en';
}

// NOTE: Replace placeholder values before launch:
//  - phone: real number once registered
//  - email: confirm hej@mjuklov.se / hello@mjuklov.se inboxes are live
//  - location.line1: neighborhood (Linnéstaden is a placeholder)
//  - allergen: confirm full list once recipe range is fixed
const content = {
  sv: {
    location: {
      title: 'Plats',
      line1: 'Linnéstaden',
      line2: 'Göteborg'
    },
    contact: {
      title: 'Kontakt',
      email: 'hej@mjuklov.se',
      phone: '+46 324 082 4383' // PLACEHOLDER
    },
    allergen: 'Vårt kök hanterar gluten, mjölk, ägg, mandel och hasselnötter. Fråga gärna om annat.',
    copyright: '© 2026 Mjuk Lov'
  },
  en: {
    location: {
      title: 'Location',
      line1: 'Linnéstaden',
      line2: 'Gothenburg'
    },
    contact: {
      title: 'Contact',
      email: 'hello@mjuklov.se',
      phone: '+46 324 082 4383' // PLACEHOLDER
    },
    allergen: 'Our kitchen handles gluten, milk, eggs, almonds and hazelnuts. Ask us about anything else.',
    copyright: '© 2026 Mjuk Lov'
  }
};

export const Footer = ({ lang }: FooterProps) => {
  const t = content[lang];

  return (
    <footer
      className="py-12 md:py-16 px-4 md:px-8 border-t"
      style={{
        backgroundColor: 'var(--vanilla-cream)',
        borderColor: 'rgba(61, 42, 34, 0.1)'
      }}
    >
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div>
            {/* Logo replaces the old text wordmark + tagline. Logo already includes "A SOFT PROMISE". */}
            <Logo className="h-20 md:h-24 lg:h-28" />
          </div>

          <div>
            <div className="type-caps mb-3 opacity-60">
              {t.location.title}
            </div>
            <div className="type-body">
              {t.location.line1}
              <br />
              {t.location.line2}
            </div>
          </div>

          <div>
            <div className="type-caps mb-3 opacity-60">
              {t.contact.title}
            </div>
            <div className="type-body">
              <a
                href={`mailto:${t.contact.email}`}
                className="block mb-1 transition-all duration-300 hover:text-[var(--dusty-terracotta)] hover:translate-x-1"
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
          className="type-body flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t opacity-60"
          style={{ borderColor: 'rgba(61, 42, 34, 0.1)' }}
        >
          <div>{t.allergen}</div>
          <div>{t.copyright}</div>
        </div>
      </div>
    </footer>
  );
};
