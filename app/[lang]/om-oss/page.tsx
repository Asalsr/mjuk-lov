import { notFound } from "next/navigation";
import { isLang, type Lang } from "@/lib/i18n";
import { RecipeShell } from "@/app/components/recipe/RecipeShell";
import { AboutStory } from "@/app/components/AboutStory";

// "About us" — the brand story. Full sv/en/fa content lives in AboutStory
// (unlike the legal pages, which are sv/en with an fa→en fallback).

export const metadata = { title: "Om oss · Mjuk Lov" };

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
