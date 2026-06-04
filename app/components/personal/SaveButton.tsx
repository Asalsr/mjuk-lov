"use client";

import { useUserData, toggleFavorite } from "@/lib/userdata/store";
import { ui, type Lang } from "@/lib/i18n";
import { IconAction } from "./IconAction";

export function SaveButton({ slug, lang }: { slug: string; lang: Lang }) {
  const data = useUserData();
  const saved = data.favorites.includes(slug);
  const t = ui[lang];

  return (
    <IconAction
      icon={saved ? "♥" : "♡"}
      label={saved ? t.saved : t.save}
      ariaLabel={saved ? t.saved : t.save}
      active={saved}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(slug);
      }}
    />
  );
}
