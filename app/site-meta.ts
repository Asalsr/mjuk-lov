import type { Metadata } from "next";

// Shared default metadata for both root layouts. Per-page titles/descriptions
// are set by each route's generateMetadata.
export const siteMetadata: Metadata = {
  title: "Mjuk Lov: ett mjukt löfte",
  description:
    "Hembakat i Göteborg. Tårtkit och företagsprenumerationer. Hand baked in Gothenburg: DIY cake kits and corporate dessert subscriptions.",
  metadataBase: new URL("https://mjuklov.se"),
  openGraph: {
    title: "Mjuk Lov",
    description: "ett mjukt löfte · a soft promise",
    url: "https://mjuklov.se",
    siteName: "Mjuk Lov",
    locale: "sv_SE",
    alternateLocale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mjuk Lov",
    description: "ett mjukt löfte · a soft promise",
  },
};
