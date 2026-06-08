import type { Lang } from "@/lib/i18n";

// Shared layout for long-form legal documents (privacy policy, terms).
export type LegalSection = { h: string; p?: string[]; bullets?: string[] };

export function LegalDoc({
  lang,
  title,
  updated,
  intro,
  sections,
}: {
  lang: Lang;
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <section
      className="pt-32 md:pt-40 pb-[clamp(4rem,10vw,9rem)] px-4 md:px-8"
      style={{ backgroundColor: "var(--vanilla-cream)" }}
    >
      <div className="max-w-[760px] mx-auto" lang={lang}>
        <h1 className="mb-3" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>{title}</h1>
        <p className="type-caps opacity-50 mb-10">{updated}</p>
        <p className="type-body mb-12 opacity-90">{intro}</p>

        <div className="flex flex-col gap-10">
          {sections.map((s) => (
            <div key={s.h}>
              <h2 className="mb-4" style={{ fontSize: "clamp(1.25rem, 2.5vw, 1.6rem)" }}>{s.h}</h2>
              {s.p?.map((para, i) => (
                <p key={i} className="type-body opacity-90 mb-3">{para}</p>
              ))}
              {s.bullets && (
                <ul className="flex flex-col gap-2 mt-1 pl-5" style={{ listStyle: "disc" }}>
                  {s.bullets.map((b, i) => (
                    <li key={i} className="type-body opacity-90">{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
