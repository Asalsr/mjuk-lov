"use client";

import { useUserData, toggleFavorite } from "@/lib/userdata/store";
import { ui, type Lang } from "@/lib/i18n";

export function SaveButton({ slug, lang }: { slug: string; lang: Lang }) {
  const data = useUserData();
  const saved = data.favorites.includes(slug);
  const t = ui[lang];

  return (
    <button
      type="button"
      aria-pressed={saved}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(slug);
      }}
      className="type-caps tap inline-flex items-center gap-2 px-4 transition-colors hover:text-[var(--dusty-terracotta)]"
      style={{
        border: "1px solid rgba(61, 42, 34, 0.2)",
        backgroundColor: saved ? "var(--warm-peach)" : "transparent",
      }}
    >
      <span aria-hidden style={{ color: "var(--dusty-terracotta)" }}>{saved ? "♥" : "♡"}</span>
      {saved ? t.saved : t.save}
    </button>
  );
}
