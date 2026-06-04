"use client";

import { useUserData, toggleWishlist } from "@/lib/userdata/store";
import { ui, type Lang } from "@/lib/i18n";
import { IconAction } from "./IconAction";

export function WishlistButton({ slug, lang }: { slug: string; lang: Lang }) {
  const data = useUserData();
  const inList = data.wishlist.includes(slug);
  const t = ui[lang];

  return (
    <IconAction
      icon={inList ? "★" : "☆"}
      label={inList ? t.inWishlist : t.addToWishlist}
      ariaLabel={inList ? t.inWishlist : t.addToWishlist}
      active={inList}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(slug);
      }}
    />
  );
}
