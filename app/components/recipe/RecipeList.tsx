'use client';

import { useEffect, useRef, useState } from "react";
import { RecipeCard } from "./RecipeCard";
import type { Recipe } from "@/lib/recipes/schema";
import { useUserData } from "@/lib/userdata/store";
import { ui, type Lang } from "@/lib/i18n";

/** Grid with the home-style scroll reveal, filtered live by the user's
 *  device-local diet/allergy preferences. */
export function RecipeList({ recipes, lang }: { recipes: Recipe[]; lang: Lang }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { profile } = useUserData();
  const t = ui[lang];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const visible = recipes.filter(
    (r) =>
      !r.allergens.codes.some((c) => profile.allergies.includes(c)) &&
      profile.diet.every((tag) => r.diet.includes(tag)),
  );
  const hidden = recipes.length - visible.length;

  return (
    <>
      <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-12">
        {visible.map((r, i) => (
          <RecipeCard key={r.slug} recipe={r} lang={lang} isVisible={isVisible} delay={(i + 1) * 150} />
        ))}
      </div>

      {visible.length === 0 && (
        <p className="type-body opacity-70 text-center">{ui[lang].empty}</p>
      )}
      {hidden > 0 && (
        <p className="type-caps opacity-50 text-center mt-8">{t.hiddenByFilter(hidden)}</p>
      )}
    </>
  );
}
