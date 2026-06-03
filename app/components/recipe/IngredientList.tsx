import type { Recipe } from "@/lib/recipes/schema";
import type { Lang } from "@/lib/i18n";

export function IngredientList({
  ingredients,
  lang,
}: {
  ingredients: Recipe["ingredients"];
  lang: Lang;
}) {
  return (
    <ul className="divide-y" style={{ borderColor: "rgba(61, 42, 34, 0.1)" }}>
      {ingredients.map((ing, i) => (
        <li
          key={i}
          className="flex items-baseline justify-between gap-4 py-2.5"
          style={{ borderColor: "rgba(61, 42, 34, 0.1)" }}
        >
          <span className="type-body">{ing.item[lang]}</span>
          <span className="type-caps opacity-50 whitespace-nowrap">{ing.qty}</span>
        </li>
      ))}
    </ul>
  );
}
