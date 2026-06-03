import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/", // the AI endpoint isn't useful to crawlers
    },
    sitemap: "https://mjuklov.se/sitemap.xml",
    host: "https://mjuklov.se",
  };
}
