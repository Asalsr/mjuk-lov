import type { Metadata } from "next";
import { RootShell } from "@/app/components/RootShell";
import { siteMetadata } from "@/app/site-meta";

// Root layout for the marketing home page ("/"). The home page is a client-side
// language toggle that defaults to Swedish, so the document starts as sv and is
// updated client-side when the visitor switches to English (see page.tsx).
//
// hreflang note: the home page is a single URL ("/") that switches language in
// the browser — there are no distinct /sv, /en, /fa home routes (the bare locale
// roots 404). So we declare only a self-referencing canonical; per-locale
// hreflang would have to point at URLs that don't exist, which is worse than
// none. Real per-locale home routes are a separate (out-of-scope) IA task.
export const metadata: Metadata = {
  ...siteMetadata,
  alternates: { canonical: "/" },
};

// LocalBusiness (Bakery) structured data — a single instance on the home page.
// Home kitchen with no public street address, so we declare a service area
// (areaServed) rather than a postal address, per Google's service-area-business
// guidance. NAP mirrors the footer so the schema matches the visible page.
const bakeryJsonLd = {
  "@context": "https://schema.org",
  "@type": "Bakery",
  name: "Mjuk Lov",
  url: "https://mjuklov.se",
  email: "mjuklov.se@gmail.com",
  telephone: "+46765761526",
  areaServed: { "@type": "City", name: "Göteborg" },
  sameAs: [
    "https://instagram.com/mjuk.lov",
    "https://tiktok.com/@mjuklov",
    "https://www.facebook.com/profile.php?id=61590793712182",
  ],
};

export default function HomeRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <RootShell lang="sv">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(bakeryJsonLd) }} />
      {children}
    </RootShell>
  );
}
