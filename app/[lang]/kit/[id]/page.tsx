import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getKitGuide, getKitGuides } from "@/lib/kits";
import { annotateTemps } from "@/lib/units/temps";
import { ui, isLang, LANGS, type Lang } from "@/lib/i18n";
import { RecipeShell } from "@/app/components/recipe/RecipeShell";
import { YouTubeEmbed } from "@/app/components/recipe/YouTubeEmbed";
import { ProductImage } from "@/app/components/ProductImage";
import { PhotoDisclaimer } from "@/app/components/PhotoDisclaimer";

export const dynamicParams = false;

export function generateStaticParams() {
  const guides = getKitGuides();
  return LANGS.flatMap((lang) => guides.map((g) => ({ lang, id: g.id })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}): Promise<Metadata> {
  const { lang, id } = await params;
  const guide = getKitGuide(id);
  if (!guide || !isLang(lang)) return {};
  return {
    title: `${guide.title[lang]}, Mjuk Lov`,
    description: guide.intro[lang],
    alternates: {
      canonical: `/${lang}/kit/${id}`,
      languages: { sv: `/sv/kit/${id}`, en: `/en/kit/${id}` },
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang: raw, id } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;
  const guide = getKitGuide(id);
  if (!guide) notFound();
  const t = ui[lang];
  const other = lang === "sv" ? "en" : "sv";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: guide.title[lang],
    description: guide.intro[lang],
    step: guide.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      text: s.text[lang],
      ...(s.durationMin ? { totalTime: `PT${s.durationMin}M` } : {}),
      ...(s.image ? { image: s.image } : {}),
    })),
    inLanguage: lang,
    ...(guide.youtubeId
      ? { video: { "@type": "VideoObject", embedUrl: `https://www.youtube.com/embed/${guide.youtubeId}` } }
      : {}),
  };

  return (
    <RecipeShell lang={lang} altPath={`/${other}/kit/${id}`}>
      <article
        lang={lang}
        className="pt-32 md:pt-40 pb-[clamp(4rem,10vw,9rem)] px-4 md:px-8"
        style={{ backgroundColor: "var(--vanilla-cream)" }}
      >
        {/* Narrow column — this is a phone-in-the-kitchen companion. */}
        <div className="max-w-[560px] mx-auto">
          <Link
            href={`/${lang}/butik`}
            className="type-caps ink-muted transition-all hover:text-[var(--dusty-terracotta)]"
          >
            ← {t.kits}
          </Link>

          <h1 className="mt-6" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>
            {guide.title[lang]}
          </h1>
          <p className="type-serif italic ink-muted mt-4" style={{ fontSize: "clamp(1.15rem, 2.5vw, 1.5rem)" }}>
            {guide.intro[lang]}
          </p>

          <div className="mt-8">
            <ProductImage
              src={`/photos/kits/${id}.jpg`}
              alt={t.kitHeroAlt(guide.title[lang])}
              aspect="4/3"
              priority
              sizes="(min-width: 560px) 560px, 100vw"
            />
          </div>

          {/* Secondary detail shots — the narrow column comfortably holds a pair. */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <ProductImage
              src={`/photos/kits/${id}-1.jpg`}
              alt={t.kitDetailAlt(guide.title[lang])}
              aspect="1/1"
              sizes="(min-width: 560px) 272px, 50vw"
            />
            <ProductImage
              src={`/photos/kits/${id}-2.jpg`}
              alt={t.kitDetailAlt(guide.title[lang])}
              aspect="1/1"
              sizes="(min-width: 560px) 272px, 50vw"
            />
          </div>

          {/* House rule: product photos carry the illustrative-photo notice. */}
          <PhotoDisclaimer lang={lang} className="mt-3" />

          {guide.youtubeId && (
            <div className="mt-8">
              <YouTubeEmbed id={guide.youtubeId} title={guide.title[lang]} />
            </div>
          )}

          <section className="mt-10">
            <div className="type-caps ink-muted mb-5">{t.method}</div>
            <ol className="space-y-6">
              {guide.steps.map((s, i) => (
                <li key={i} className="flex gap-4">
                  <span
                    className="type-display leading-none ink-faint"
                    style={{ color: "var(--dusty-terracotta)", fontSize: "clamp(1.5rem, 3vw, 2rem)" }}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="type-body opacity-90">{annotateTemps(s.text[lang])}</p>
                    {s.durationMin ? (
                      <span className="type-caps ink-faint inline-block mt-1" style={{ fontSize: "0.7rem" }}>
                        {t.minutes(s.durationMin)}
                      </span>
                    ) : null}
                    {s.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.image}
                        alt=""
                        loading="lazy"
                        className="mt-3 w-full"
                        style={{ border: "1px solid rgba(61, 42, 34, 0.1)" }}
                      />
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {guide.tips.length > 0 && (
            <section className="mt-12">
              <div className="type-caps ink-muted mb-3">{t.tips}</div>
              <ul className="type-body opacity-80 list-disc pl-5 space-y-1.5">
                {guide.tips.map((tip, i) => (
                  <li key={i}>{annotateTemps(tip[lang])}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </article>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </RecipeShell>
  );
}
