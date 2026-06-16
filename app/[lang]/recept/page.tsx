import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedRecipes } from "@/lib/recipes";
import { ui, isLang, LANGS, type Lang } from "@/lib/i18n";
import { RecipeShell } from "@/app/components/recipe/RecipeShell";
import { RecipeList } from "@/app/components/recipe/RecipeList";
import { DietFilter } from "@/app/components/personal/DietFilter";
//import { DataControls } from "@/app/components/personal/DataControls";
import { AskAssistant } from "@/app/components/personal/AskAssistant";

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
  const title = lang === "sv" ? "Recept, Mjuk Lov" : "Recipes, Mjuk Lov";
  const description =
    lang === "sv"
      ? "Desserter och bakverk från Mjuk Lov, med teknikvideor och allergeninformation."
      : "Desserts and bakes from Mjuk Lov, with technique videos and allergen information.";
  return {
    title,
    description,
    alternates: {
      canonical: `/${lang}/recept`,
      languages: { sv: "/sv/recept", en: "/en/recept" },
    },
  };
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;
  const t = ui[lang];
  const recipes = getPublishedRecipes();

  return (
    <RecipeShell lang={lang} altPath={`/${lang === "sv" ? "en" : "sv"}/recept`}>
      <section
        className="pt-32 md:pt-40 pb-[clamp(4rem,10vw,9rem)] px-4 md:px-8"
        style={{ backgroundColor: "var(--soft-peach)" }}
      >
        <div className="max-w-[1200px] mx-auto" lang={lang}>
          <div className="text-center mb-16 md:mb-20">
            <div className="type-caps ink-muted mb-4">Mjuk&nbsp;Lov</div>
            <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)" }}>{t.recipes}</h1>
          </div>
          <DietFilter lang={lang} />
          <RecipeList recipes={recipes} lang={lang} />
          <AskAssistant lang={lang} />
          {/* <DataControls lang={lang} /> */}
        </div>
      </section>
    </RecipeShell>
  );
}
