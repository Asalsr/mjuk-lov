'use client';

interface FooterProps {
  lang: 'sv' | 'en';
}

const content = {
  sv: {
    tagline: 'ett mjukt löfte · a soft promise',
    location: {
      title: 'Plats',
      line1: 'Linnéstaden',
      line2: 'Göteborg'
    },
    contact: {
      title: 'Kontakt',
      email: 'hej@mjuklov.se',
      phone: '+46 31 123 45 67'
    },
    allergen: 'Vi hanterar gluten, mjölk, ägg, mandel och hasselnötter.',
    copyright: '© 2026 Mjuk Lov'
  },
  en: {
    tagline: 'ett mjukt löfte · a soft promise',
    location: {
      title: 'Location',
      line1: 'Linnéstaden',
      line2: 'Gothenburg'
    },
    contact: {
      title: 'Contact',
      email: 'hello@mjuklov.se',
      phone: '+46 31 123 45 67'
    },
    allergen: 'We handle gluten, milk, eggs, almonds and hazelnuts.',
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
          <div className="group cursor-default">
            <div
              className="lowercase italic mb-2 group-hover:tracking-wider transition-all duration-300"
              style={{ fontSize: '1.25rem', letterSpacing: '0.04em' }}
            >
              mjuk lov
            </div>
            <div className="opacity-60 group-hover:opacity-100 transition-opacity duration-300" style={{ fontSize: '0.875rem' }}>
              {t.tagline}
            </div>
          </div>

          <div>
            <div
              className="mb-3 opacity-60"
              style={{
                fontFamily: 'var(--font-inter), sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
                fontSize: '0.7rem'
              }}
            >
              {t.location.title}
            </div>
            <div style={{ fontSize: '0.95rem' }}>
              {t.location.line1}
              <br />
              {t.location.line2}
            </div>
          </div>

          <div>
            <div
              className="mb-3 opacity-60"
              style={{
                fontFamily: 'var(--font-inter), sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
                fontSize: '0.7rem'
              }}
            >
              {t.contact.title}
            </div>
            <div style={{ fontSize: '0.95rem' }}>
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
          className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t opacity-60"
          style={{
            borderColor: 'rgba(61, 42, 34, 0.1)',
            fontSize: '0.85rem'
          }}
        >
          <div>{t.allergen}</div>
          <div>{t.copyright}</div>
        </div>
      </div>
    </footer>
  );
};
