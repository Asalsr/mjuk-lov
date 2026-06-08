import "../globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { fontVars } from "@/app/fonts";
import { AutoSync } from "@/app/components/auth/AutoSync";

// The <html>/<body> shell shared by both root layouts. `lang` is set per
// locale (sv for the home root, the route's [lang] for the localized root) so
// the document language always matches its content — without this, an English
// page labelled lang="sv" gets auto-translated by the browser (e.g. "Make
// vegan" → "Vegan husband").
export function RootShell({
  lang,
  children,
}: {
  lang: string;
  children: React.ReactNode;
}) {
  return (
    <html lang={lang} className={fontVars}>
      <head>
        <link rel="preload" as="video" href="/videos/loading-bg.mp4" type="video/mp4" />
      </head>
      <body>
        <AutoSync />
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
