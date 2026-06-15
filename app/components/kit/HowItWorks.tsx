import { ui, locNum, type Lang } from '@/lib/i18n';

/** "Så funkar det" — the four-step explainer for the cake kit. Pure
 *  presentational; all copy comes from lib/i18n (ui[lang].kitHowSteps). One
 *  number per step (no doubled numbering). Square corners, brand tokens,
 *  RTL-safe (logical spacing + localized step numbers). */
export function HowItWorks({ lang }: { lang: Lang }) {
  const t = ui[lang];

  return (
    <section aria-labelledby="kit-how-heading">
      <h2
        id="kit-how-heading"
        className="text-center mb-12 md:mb-16"
        style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}
      >
        {t.kitHowHeading}
      </h2>

      <ol className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-10 list-none p-0 m-0">
        {t.kitHowSteps.map((step, i) => (
          <li key={i} className="text-center">
            <div
              className="inline-flex items-center justify-center w-12 h-12 mb-5 type-serif"
              style={{
                border: '1px solid var(--warm-cocoa)',
                color: 'var(--dusty-terracotta)',
                fontSize: '1.25rem',
              }}
              aria-hidden="true"
            >
              {locNum(i + 1, lang)}
            </div>
            <h3 className="mb-2" style={{ fontSize: 'clamp(1.15rem, 2.2vw, 1.4rem)' }}>
              {step.title}
            </h3>
            <p className="type-body ink-muted">{step.body}</p>
          </li>
        ))}
      </ol>

      {/* Pickup is a sub-line, not a fifth numbered step. */}
      <p className="type-body ink-muted text-center mt-10 md:mt-12">{t.kitHowSubline}</p>
    </section>
  );
}
