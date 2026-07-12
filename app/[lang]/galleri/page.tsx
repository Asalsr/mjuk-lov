import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ui, isLang, LANGS, type Lang } from "@/lib/i18n";
import { RecipeShell } from "@/app/components/recipe/RecipeShell";
import { Gallery } from "@/app/components/Gallery";
import { PhotoDisclaimer } from "@/app/components/PhotoDisclaimer";
import { GALLERY_IMAGES } from "@/lib/gallery";

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
  const title =
    l === "sv" ? "Galleri, Mjuk Lov" : l === "fa" ? "گالری، Mjuk Lov" : "Gallery, Mjuk Lov";
  const description = ui[l].galleryIntro;
  return {
    title,
    description,
    alternates: {
      canonical: `/${l}/galleri`,
      languages: { sv: "/sv/galleri", en: "/en/galleri" },
    },
  };
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;
  const t = ui[lang];

  return (
    <RecipeShell lang={lang} altPath={`/${lang === "sv" ? "en" : "sv"}/galleri`}>
      <section
        className="pt-32 md:pt-40 pb-[clamp(4rem,10vw,9rem)] px-4 md:px-8"
        style={{ backgroundColor: "var(--soft-peach)" }}
      >
        <div className="max-w-[1200px] mx-auto" lang={lang}>
          <div className="text-center mb-16 md:mb-20">
            <div className="type-caps ink-muted mb-4">Mjuk&nbsp;Lov</div>
            <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)" }}>{t.gallery}</h1>
            <p className="type-body ink-muted mt-4 max-w-xl mx-auto">{t.galleryIntro}</p>
          </div>
          <Gallery lang={lang} images={GALLERY_IMAGES} />
          <PhotoDisclaimer lang={lang} className="mt-8" />
        </div>
      </section>
    </RecipeShell>
  );
}
