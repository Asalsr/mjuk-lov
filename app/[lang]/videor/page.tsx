import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLang, ui, LANGS, type Lang } from "@/lib/i18n";
import { recipeVideos } from "@/lib/recipeVideos";
import { RecipeShell } from "@/app/components/recipe/RecipeShell";
import { RecipeVideoCard } from "@/app/components/recipe/RecipeVideoCard";

export const dynamicParams = false;
export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const title = lang === "sv" ? "Bakvideor — Mjuk Lov" : "Baking videos — Mjuk Lov";
  return { title, alternates: { canonical: `/${lang}/videor`, languages: { sv: "/sv/videor", en: "/en/videor" } } };
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;
  const t = ui[lang];

  // Group by category, preserving first-seen order.
  const categories: string[] = [];
  for (const v of recipeVideos) if (!categories.includes(v.category)) categories.push(v.category);

  return (
    <RecipeShell lang={lang} altPath={`/${lang === "sv" ? "en" : "sv"}/videor`}>
      <section
        className="pt-32 md:pt-40 pb-[clamp(4rem,10vw,9rem)] px-4 md:px-8"
        style={{ backgroundColor: "var(--soft-peach)" }}
      >
        <div className="max-w-[1200px] mx-auto" lang={lang}>
          <div className="text-center mb-16 md:mb-20">
            <div className="type-caps opacity-50 mb-4">Mjuk&nbsp;Lov</div>
            <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)" }}>{t.videos}</h1>
            <p className="type-body opacity-70 mt-4 max-w-[640px] mx-auto">{t.videosIntro}</p>
          </div>

          {categories.map((cat) => (
            <div key={cat} className="mb-16">
              <h2 className="type-caps opacity-50 mb-6">{cat}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {recipeVideos
                  .filter((v) => v.category === cat)
                  .map((v) => (
                    <RecipeVideoCard key={v.id} video={v} lang={lang} />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </RecipeShell>
  );
}
