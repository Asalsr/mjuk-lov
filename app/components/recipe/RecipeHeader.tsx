import Link from "next/link";
import { ui, type Lang } from "@/lib/i18n";

/** Lightweight server-rendered header for the recipe routes (the main site
 *  Header is a client scroll-nav tied to the one-page home, so not reused here). */
export function RecipeHeader({ lang, altHref }: { lang: Lang; altHref: string }) {
  const t = ui[lang];
  return (
    <header className="border-b border-border bg-background/95">
      <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
        <Link href={`/${lang}/recept`} className="type-display text-3xl md:text-4xl leading-none">
          Mjuk&nbsp;Lov
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/" className="type-caps transition-colors hover:text-primary">
            {t.home}
          </Link>
          <Link href={altHref} className="type-caps tap transition-colors hover:text-primary">
            {lang === "sv" ? "EN" : "SV"}
          </Link>
        </nav>
      </div>
    </header>
  );
}
