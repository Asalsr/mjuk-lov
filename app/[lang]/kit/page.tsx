import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ui, locNum, isLang, isRtl, LANGS, type Lang } from "@/lib/i18n";
import { KITS } from "@/lib/products";
import { RecipeShell } from "@/app/components/recipe/RecipeShell";
import { ProductImage } from "@/app/components/ProductImage";
import { HowItWorks } from "@/app/components/kit/HowItWorks";
import { Gallery } from "@/app/components/Gallery";
import { GALLERY_IMAGES } from "@/lib/gallery";
import { AddToCartButton } from "@/app/components/shop/AddToCartButton";

export const dynamicParams = false;

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const l: Lang = isLang(lang) ? lang : "sv";
  const t = ui[l];
  return {
    title: `${t.kits} — Mjuk Lov`,
    description: t.kitHeroLede,
    alternates: {
      canonical: `/${l}/kit`,
      languages: { sv: "/sv/kit", en: "/en/kit" },
    },
  };
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;
  const t = ui[lang];
  const arrow = isRtl(lang) ? "←" : "→";

  // Sticky CTA promotes the entry-level kit; falls back gracefully if data shifts.
  const leadKit = KITS.find((k) => k.id === "kit-standard") ?? KITS[0];

  return (
    <RecipeShell lang={lang} altPath={`/${lang === "sv" ? "en" : "sv"}/kit`}>
      <div lang={lang} style={{ backgroundColor: "var(--vanilla-cream)" }}>
        {/* 1 · Hero */}
        <section className="pt-32 md:pt-40 pb-[clamp(3rem,7vw,6rem)] px-4 md:px-8">
          <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div>
              <div className="type-caps ink-muted mb-4">{t.kitHeroKicker}</div>
              <h1 className="type-display" style={{ marginBottom: "1.25rem" }}>
                {t.kitHeroTitle}
              </h1>
              <p className="type-body ink-muted mb-6 max-w-md">{t.kitHeroLede}</p>
              <p className="type-caps ink-muted mb-8">{t.kitHeroMeta}</p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
                <a
                  href="#kit-variants"
                  className="type-caps inline-flex items-center gap-2 px-8 py-3 tap transition-all hover:bg-[var(--warm-peach)]"
                  style={{ border: "1px solid var(--warm-cocoa)" }}
                >
                  {t.kitHeroCta}
                  <span aria-hidden="true">{arrow}</span>
                </a>
                <a
                  href="#kit-how"
                  className="type-caps inline-flex items-center gap-2 tap transition-colors hover:text-[var(--dusty-terracotta)]"
                >
                  {t.kitHeroCtaSecondary}
                  <span aria-hidden="true">{arrow}</span>
                </a>
              </div>
            </div>
            <ProductImage
              src="/photos/kit-hero.jpg"
              alt={t.kitHeroPhotoAlt}
              aspect="4/5"
              priority
              sizes="(min-width: 768px) 50vw, 100vw"
            />
          </div>
        </section>

        {/* 2 · Why we leave the best part to you — the psychology, told once. */}
        <section className="py-[clamp(3.5rem,8vw,7rem)] px-4 md:px-8">
          <div className="max-w-[46rem] mx-auto">
            <h2 className="mb-8" style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}>
              {t.kitWhyHeading}
            </h2>
            <p className="type-body mb-10 md:mb-12">{t.kitWhyBody}</p>
            <blockquote
              className="type-serif"
              style={{
                borderInlineStart: "2px solid var(--dusty-terracotta)",
                paddingInlineStart: "1.25rem",
                fontSize: "clamp(1.35rem, 3vw, 1.85rem)",
                lineHeight: 1.4,
              }}
            >
              {t.kitWhyQuote}
            </blockquote>
          </div>
        </section>

        {/* 3 · Så funkar det */}
        <section
          id="kit-how"
          className="py-[clamp(3.5rem,8vw,7rem)] px-4 md:px-8 scroll-mt-24"
          style={{ backgroundColor: "var(--soft-peach)" }}
        >
          <div className="max-w-[1100px] mx-auto">
            <HowItWorks lang={lang} />
          </div>
        </section>

        {/* 4 · Reassurance — removes the fear of getting it wrong. */}
        <section className="py-[clamp(3.5rem,8vw,7rem)] px-4 md:px-8">
          <div className="max-w-[720px] mx-auto text-center">
            <h2 className="mb-6" style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}>
              {t.kitReassureHeading}
            </h2>
            <p className="type-body ink-muted">{t.kitReassureBody}</p>
          </div>
        </section>

        {/* 5 · Varianter */}
        <section id="kit-variants" className="py-[clamp(3.5rem,8vw,7rem)] px-4 md:px-8 scroll-mt-24">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="text-center mb-3" style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}>
              {t.kitVariantsHeading}
            </h2>
            <p className="type-body ink-muted text-center max-w-[40rem] mx-auto mb-12 md:mb-16">
              {t.kitVariantsIntro}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-12">
              {KITS.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col"
                  style={{ backgroundColor: "var(--vanilla-cream)", boxShadow: "0 4px 20px rgba(61, 42, 34, 0.05)" }}
                >
                  <Link href={`/${lang}/kit/${p.id}`} className="block focus-visible:outline-none group">
                    <ProductImage
                      src={`/photos/${p.id}.jpg`}
                      alt={t.kitPhotoAlt(p.name[lang])}
                      aspect="4/5"
                      sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="transition-transform duration-500 md:group-hover:scale-105"
                    />
                  </Link>
                  <div className="p-6 md:p-8 flex flex-col flex-1">
                    {p.popular && (
                      <div className="type-caps mb-2" style={{ color: "var(--dusty-wine)" }}>
                        {t.kitRecommended}
                      </div>
                    )}
                    <div className="type-caps ink-muted mb-2">{p.size}</div>
                    <Link
                      href={`/${lang}/kit/${p.id}`}
                      className="transition-colors hover:text-[var(--dusty-terracotta)]"
                    >
                      <h3 className="mb-3" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}>
                        {p.name[lang]}
                      </h3>
                    </Link>
                    <p className="type-body ink-muted mb-4">{t.kitOccasions[p.id] ?? p.description[lang]}</p>
                    <div className="type-serif mb-5" style={{ fontSize: "clamp(1.25rem, 2.5vw, 1.5rem)" }}>
                      {locNum(p.priceSek, lang)} kr
                    </div>
                    <Link
                      href={`/${lang}/kit/${p.id}`}
                      className="type-caps inline-flex items-center gap-2 mb-5 transition-colors hover:text-[var(--dusty-terracotta)]"
                    >
                      {t.kitViewGuide}
                      <span aria-hidden="true">{arrow}</span>
                    </Link>
                    <div className="mt-auto">
                      <AddToCartButton productId={p.id} lang={lang} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5 · Vad ingår */}
        <section
          className="py-[clamp(3.5rem,8vw,7rem)] px-4 md:px-8"
          style={{ backgroundColor: "var(--soft-peach)" }}
        >
          <div className="max-w-[1000px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
            <ProductImage
              src="/photos/kit-includes.jpg"
              alt={t.kitIncludesPhotoAlt}
              aspect="4/3"
              sizes="(min-width: 768px) 50vw, 100vw"
            />
            <div>
              <h2 className="mb-8" style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}>
                {t.kitIncludesHeading}
              </h2>
              <ul className="list-none p-0 m-0 flex flex-col gap-4">
                {t.kitIncludes.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span aria-hidden="true" className="type-serif leading-none" style={{ color: "var(--dusty-terracotta)" }}>
                      ✓
                    </span>
                    <span className="type-body">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 7 · The Moment — the experience you're really buying. */}
        <section
          className="py-[clamp(3.5rem,8vw,7rem)] px-4 md:px-8"
          style={{ backgroundColor: "var(--soft-peach)" }}
        >
          <div className="max-w-[720px] mx-auto text-center">
            <h2 className="mb-6" style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}>
              {t.kitMomentHeading}
            </h2>
            <p className="type-body ink-muted">{t.kitMomentBody}</p>
          </div>
        </section>

        {/* 8 · Made by you */}
        <section className="py-[clamp(3.5rem,8vw,7rem)] px-4 md:px-8">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="text-center mb-12 md:mb-16" style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}>
              {t.kitGalleryHeading}
            </h2>
            {GALLERY_IMAGES.length > 0 ? (
              <Gallery lang={lang} />
            ) : (
              <p
                className="type-serif text-center ink-muted"
                style={{ fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)" }}
              >
                {t.kitGalleryEmpty}
              </p>
            )}
            <p className="type-body ink-muted text-center mt-10 md:mt-12">{t.kitGalleryInvite}</p>
          </div>
        </section>

        {/* 9 · Vanliga frågor */}
        <section className="py-[clamp(3.5rem,8vw,7rem)] px-4 md:px-8">
          <div className="max-w-[720px] mx-auto">
            <h2 className="text-center mb-12 md:mb-16" style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}>
              {t.kitFaqHeading}
            </h2>
            <div>
              {t.kitFaq.map((item, i) => (
                <details
                  key={i}
                  open={i === 0}
                  className="group"
                  style={{ borderTop: "1px solid rgba(61, 42, 34, 0.15)" }}
                >
                  <summary className="flex items-center justify-between gap-4 py-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    <span className="type-serif" style={{ fontSize: "clamp(1.15rem, 2.2vw, 1.4rem)" }}>
                      {item.q}
                    </span>
                    <span
                      aria-hidden="true"
                      className="type-serif leading-none transition-transform duration-300 group-open:rotate-45"
                      style={{ color: "var(--dusty-terracotta)", fontSize: "1.5rem" }}
                    >
                      +
                    </span>
                  </summary>
                  <p className="type-body ink-muted pb-5 -mt-1">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 10 · Avslutande CTA */}
        <section
          className="py-[clamp(3.5rem,8vw,7rem)] px-4 md:px-8 text-center"
          style={{ backgroundColor: "var(--soft-peach)" }}
        >
          <a
            href="#kit-variants"
            className="type-caps inline-flex items-center gap-2 px-10 py-4 tap transition-all hover:bg-[var(--warm-peach)]"
            style={{ border: "1px solid var(--warm-cocoa)" }}
          >
            {t.kitFinalCta}
            <span aria-hidden="true">{arrow}</span>
          </a>
        </section>

        {/* Clearance so the mobile sticky CTA never hides the footer. */}
        <div className="md:hidden" style={{ height: "4.5rem" }} aria-hidden="true" />
      </div>

      {/* 8 · Mobile sticky CTA — sits above the persistent MobileBottomBar. */}
      <div
        className="md:hidden fixed left-0 right-0 z-40 px-4 py-3 flex items-center justify-between gap-4"
        style={{
          bottom: "calc(var(--bottom-bar-clearance) + env(safe-area-inset-bottom))",
          backgroundColor: "var(--vanilla-cream)",
          borderTop: "1px solid rgba(61, 42, 34, 0.12)",
          boxShadow: "0 -4px 20px rgba(61, 42, 34, 0.08)",
        }}
      >
        <div className="leading-tight">
          <div className="type-caps">{leadKit.name[lang]}</div>
          <div className="type-serif" style={{ fontSize: "1.1rem" }}>
            {t.kitFrom} {locNum(leadKit.priceSek, lang)} kr
          </div>
        </div>
        <div className="min-w-[8.5rem]">
          <AddToCartButton productId={leadKit.id} lang={lang} />
        </div>
      </div>
    </RecipeShell>
  );
}
