import { redirect } from "next/navigation";
import { isLang, LANGS } from "@/lib/i18n";

// The videos page has been merged into Recipes — every video is now a full
// recipe on /recept (with the player embedded on its detail page). This route
// stays only to redirect old links there.
export const dynamicParams = false;
export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  redirect(`/${isLang(lang) ? lang : "sv"}/recept`);
}
