import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLang, ui, type Lang } from "@/lib/i18n";
import { pageAlternates } from "@/lib/seo";
import { RecipeShell } from "@/app/components/recipe/RecipeShell";
import { AboutStory } from "@/app/components/AboutStory";

// "About us" — the brand story. Full sv/en/fa content lives in AboutStory
// (unlike the legal pages, which are sv/en with an fa→en fallback).

// Was a hardcoded Swedish title with no description, served unchanged on the
// English and Persian pages too.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const l: Lang = isLang(lang) ? lang : "sv";
  const t = ui[l];
  return {
    title: `${t.aboutMetaTitle}, Mjuk Lov`,
    description: t.aboutMetaDescription,
    alternates: pageAlternates(l, "/om-oss"),
  };
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;

  return (
    <RecipeShell lang={lang} altPath={`/${lang === "sv" ? "en" : "sv"}/om-oss`}>
      <AboutStory lang={lang} />
    </RecipeShell>
  );
}
