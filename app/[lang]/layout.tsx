import { notFound } from "next/navigation";
import { RootShell } from "@/app/components/RootShell";
import { siteMetadata } from "@/app/site-meta";
import { isLang } from "@/lib/i18n";

// Root layout for the localized site (/sv, /en). Rendering <html lang={lang}>
// here — where the [lang] param is available — is what keeps the document
// language correct on every localized page, so the browser no longer
// mislabels English pages as Swedish.
export const metadata = siteMetadata;

export default async function LocalizedRootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return <RootShell lang={lang}>{children}</RootShell>;
}
