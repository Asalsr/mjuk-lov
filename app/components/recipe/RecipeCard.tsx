import Link from "next/link";
import Image from "next/image";
import { ui, type Lang } from "@/lib/i18n";
import { AllergenChips } from "./AllergenBadge";
import { SaveButton } from "@/app/components/personal/SaveButton";
import type { Recipe } from "@/lib/recipes/schema";

/** Mirrors the Kits card idiom: cream card, warm-peach image well, soft shadow,
 *  hover-lift, staggered fade-in. The Save button overlays as a sibling of the
 *  link (not nested) to keep the markup valid. */
export function RecipeCard({
  recipe,
  lang,
  isVisible = true,
  delay = 0,
}: {
  recipe: Recipe;
  lang: Lang;
  isVisible?: boolean;
  delay?: number;
}) {
  const t = ui[lang];
  const thumb =
    recipe.image ||
    (recipe.youtubeId ? `https://i.ytimg.com/vi/${recipe.youtubeId}/hqdefault.jpg` : null);
  // next/image (optimized, lazy, CDN-cached) for YouTube thumbnails; plain <img>
  // only if a recipe ever sets a custom image on an unconfigured host.
  const optimizable = !!thumb && thumb.includes("i.ytimg.com");

  return (
    <div
      className={`relative group transition-all duration-700 md:hover:-translate-y-2 md:hover:shadow-2xl ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
      style={{
        backgroundColor: "var(--vanilla-cream)",
        boxShadow: "0 4px 20px rgba(61, 42, 34, 0.05)",
        transitionDelay: `${delay}ms`,
      }}
    >
      <div className="absolute top-3 right-3 z-10">
        <SaveButton slug={recipe.slug} lang={lang} />
      </div>

      <Link href={`/${lang}/recept/${recipe.slug}`} className="block">
        <div
          className="relative aspect-[4/3] sm:aspect-[4/5] overflow-hidden flex items-center justify-center transition-colors duration-500"
          style={{ backgroundColor: "rgba(217, 183, 168, 0.2)" }}
        >
          {thumb && optimizable ? (
            <Image
              src={thumb}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transform transition-transform duration-500 group-hover:scale-110"
            />
          ) : thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumb}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transform transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <span
              className="type-display opacity-20"
              style={{ color: "var(--dusty-terracotta)", fontSize: "clamp(2rem, 6vw, 3.5rem)" }}
            >
              Mjuk&nbsp;Lov
            </span>
          )}
        </div>

        <div className="p-6 md:p-8">
          <div className="type-caps mb-2 opacity-50">
            {t.minutes(recipe.time.totalMin)} · {t.servings(recipe.servings)}
          </div>
          <h3
            className="mb-3 transition-colors duration-300 group-hover:text-[var(--dusty-terracotta)]"
            style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}
          >
            {recipe.title[lang]}
          </h3>
          <p className="type-body mb-4 opacity-80">{recipe.headnote[lang]}</p>
          <AllergenChips codes={recipe.allergens.codes} lang={lang} />
        </div>
      </Link>
    </div>
  );
}
