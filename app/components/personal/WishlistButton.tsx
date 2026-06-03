"use client";

import { useUserData, toggleWishlist } from "@/lib/userdata/store";
import { ui, type Lang } from "@/lib/i18n";

export function WishlistButton({ slug, lang }: { slug: string; lang: Lang }) {
  const data = useUserData();
  const inList = data.wishlist.includes(slug);
  const t = ui[lang];

  return (
    <button
      type="button"
      aria-pressed={inList}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(slug);
      }}
      className="type-caps tap inline-flex items-center gap-2 px-4 transition-colors hover:text-[var(--dusty-terracotta)]"
      style={{
        border: "1px solid rgba(61, 42, 34, 0.2)",
        backgroundColor: inList ? "var(--warm-peach)" : "transparent",
      }}
    >
      <span aria-hidden style={{ color: "var(--dusty-terracotta)" }}>{inList ? "★" : "☆"}</span>
      {inList ? t.inWishlist : t.addToWishlist}
    </button>
  );
}
