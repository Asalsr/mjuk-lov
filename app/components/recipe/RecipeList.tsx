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
    // threshold 0 = fire as soon as ANY part enters the viewport. (A percentage
    // threshold breaks for a long grid: 10% of 40+ cards never fits on screen at
    // once, so it would never trigger and every card stays at opacity-0.)
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0 },
    );
    if (ref.current) observer.observe(ref.current);
    // Safety net: reveal regardless after a tick, so cards can never get stuck hidden.
    const fallback = setTimeout(() => setIsVisible(true), 800);
    return () => {
      observer.disconnect();
      clearTimeout(fallback);
    };
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
          <RecipeCard key={r.slug} recipe={r} lang={lang} isVisible={isVisible} delay={Math.min(i, 11) * 80} />
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
