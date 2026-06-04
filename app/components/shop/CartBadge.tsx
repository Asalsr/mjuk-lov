"use client";

import Link from "next/link";
import { useCart, cartCount } from "@/lib/cart/store";
import { ui, type Lang } from "@/lib/i18n";

export function CartBadge({ lang, className = "" }: { lang: Lang; className?: string }) {
  const count = cartCount(useCart());
  const t = ui[lang];
  return (
    <Link
      href={`/${lang}/varukorg`}
      className={`type-caps relative transition-colors hover:text-[var(--dusty-terracotta)] ${className}`}
    >
      {t.cart}
      {count > 0 && (
        <span
          className="ml-1 inline-flex items-center justify-center text-[0.625rem]"
          style={{ color: "var(--dusty-terracotta)" }}
        >
          ({count})
        </span>
      )}
    </Link>
  );
}
