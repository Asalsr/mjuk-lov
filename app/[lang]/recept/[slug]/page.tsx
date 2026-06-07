import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedRecipes, getRecipe } from "@/lib/recipes";
import { ui, isLang, LANGS, type Lang } from "@/lib/i18n";
import { RecipeShell } from "@/app/components/recipe/RecipeShell";
import { YouTubeEmbed } from "@/app/components/recipe/YouTubeEmbed";
import { IngredientList } from "@/app/components/recipe/IngredientList";
import { AllergenBlock } from "@/app/components/recipe/AllergenBadge";
import { SaveButton } from "@/app/components/personal/SaveButton";
import { WishlistButton } from "@/app/components/personal/WishlistButton";
import { MadeItButton } from "@/app/components/personal/MadeItButton";
import { NoteEditor } from "@/app/components/personal/NoteEditor";
import { AdaptButton } from "@/app/components/personal/AdaptButton";

export const dynamicParams = false;

export function generateStaticParams() {
  const recipes = getPublishedRecipes();
  return LANGS.flatMap((lang) => recipes.map((r) => ({ lang, slug: r.slug })));
}

/** Minutes → ISO 8601 duration (for schema.org). */
function isoDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `PT${h ? `${h}H` : ""}${m ? `${m}M` : ""}` || "PT0M";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const recipe = getRecipe(slug);
  if (!recipe || !isLang(lang)) return {};
  return {
    title: `${recipe.title[lang]} — Mjuk Lov`,
    description: recipe.headnote[lang],
    alternates: {
      canonical: `/${lang}/recept/${slug}`,
      languages: { sv: `/sv/recept/${slug}`, en: `/en/recept/${slug}` },
    },
    openGraph: {
      title: `${recipe.title[lang]} — Mjuk Lov`,
      description: recipe.headnote[lang],
      locale: lang === "sv" ? "sv_SE" : "en_US",
      type: "article",
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang: raw, slug } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;
  const recipe = getRecipe(slug);
  if (!recipe || !recipe.published || recipe.allergens.approvedBy.trim() === "") notFound();
  const t = ui[lang];
  const other = lang === "sv" ? "en" : "sv";

  // Only offer to adapt to a diet the recipe doesn't already satisfy:
  // vegan implies vegetarian, and gluten-free only makes sense when the recipe
  // currently contains gluten.
  const isVegan = recipe.diet.includes("vegan");
  const adaptTargets: ("vegan" | "vegetarian" | "gluten-free")[] = [];
  if (!isVegan && !recipe.diet.includes("vegetarian")) adaptTargets.push("vegetarian");
  if (!isVegan) adaptTargets.push("vegan");
  if (recipe.allergens.codes.includes("gluten")) adaptTargets.push("gluten-free");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title[lang],
    description: recipe.headnote[lang],
    recipeYield: `${recipe.servings}`,
    totalTime: isoDuration(recipe.time.totalMin),
    prepTime: isoDuration(recipe.time.prepMin),
    recipeIngredient: recipe.ingredients.map((i) => `${i.qty} ${i.item[lang]}`),
    recipeInstructions: recipe.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      text: s[lang],
    })),
    inLanguage: lang,
    ...(recipe.youtubeId
      ? { video: { "@type": "VideoObject", embedUrl: `https://www.youtube.com/embed/${recipe.youtubeId}` } }
      : {}),
  };

  return (
    <RecipeShell lang={lang} altPath={`/${other}/recept/${slug}`}>
      <article
        lang={lang}
        className="pt-32 md:pt-40 pb-[clamp(4rem,10vw,9rem)] px-4 md:px-8"
        style={{ backgroundColor: "var(--vanilla-cream)" }}
      >
        <div className="max-w-[820px] mx-auto">
          <Link
            href={`/${lang}/recept`}
            className="type-caps opacity-60 transition-all hover:opacity-100 hover:text-[var(--dusty-terracotta)]"
          >
            ← {t.allRecipes}
          </Link>

          <h1 className="mt-6" style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)" }}>
            {recipe.title[lang]}
          </h1>
          <p className="type-serif italic opacity-70 mt-4" style={{ fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)" }}>
            {recipe.headnote[lang]}
          </p>
          <div className="type-caps opacity-50 mt-5">
            {t.minutes(recipe.time.totalMin)} · {t.servings(recipe.servings)}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <SaveButton slug={slug} lang={lang} />
            <WishlistButton slug={slug} lang={lang} />
            <MadeItButton slug={slug} lang={lang} />
          </div>

          {recipe.youtubeId && (
            <div className="mt-10">
              <YouTubeEmbed id={recipe.youtubeId} title={recipe.title[lang]} />
            </div>
          )}

          {recipe.inspiredBy && (
            <p className="type-caps opacity-50 mt-4">
              {t.inspiredBy}{" "}
              <a
                href={recipe.inspiredBy.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline transition-colors hover:text-[var(--dusty-terracotta)]"
              >
                {recipe.inspiredBy.channel}
              </a>
            </p>
          )}

          <div className="mt-12 grid gap-10 md:gap-16 md:grid-cols-[1fr_1.4fr]">
            <section>
              <div className="type-caps opacity-50 mb-5">{t.ingredients}</div>
              <IngredientList ingredients={recipe.ingredients} lang={lang} />
            </section>
            <section>
              <div className="type-caps opacity-50 mb-5">{t.method}</div>
              <ol className="space-y-6">
                {recipe.steps.map((s, i) => (
                  <li key={i} className="flex gap-4">
                    <span
                      className="type-display leading-none"
                      style={{ color: "var(--dusty-terracotta)", opacity: 0.4, fontSize: "clamp(1.5rem, 3vw, 2rem)" }}
                    >
                      {i + 1}
                    </span>
                    <p className="type-body opacity-90">{s[lang]}</p>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <div className="mt-14">
            <AllergenBlock declaration={recipe.allergens.declaration} lang={lang} />
          </div>

          {adaptTargets.length > 0 && (
            <section className="mt-12">
              <div className="type-caps opacity-50 mb-4">{t.diet}</div>
              <AdaptButton
                lang={lang}
                slug={recipe.slug}
                title={recipe.title[lang]}
                ingredients={recipe.ingredients.map((i) => ({ qty: i.qty, item: i.item[lang] }))}
                targets={adaptTargets}
              />
            </section>
          )}

          {recipe.notes[lang].trim() !== "" && (
            <section className="mt-12">
              <div className="type-caps opacity-50 mb-3">{t.notes}</div>
              <p className="type-body opacity-80">{recipe.notes[lang]}</p>
            </section>
          )}

          <section className="mt-12">
            <NoteEditor slug={slug} lang={lang} />
          </section>
        </div>
      </article>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </RecipeShell>
  );
}
