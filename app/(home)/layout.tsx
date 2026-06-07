import { RootShell } from "@/app/components/RootShell";
import { siteMetadata } from "@/app/site-meta";

// Root layout for the marketing home page ("/"). The home page is a client-side
// language toggle that defaults to Swedish, so the document starts as sv and is
// updated client-side when the visitor switches to English (see page.tsx).
export const metadata = siteMetadata;

export default function HomeRootLayout({ children }: { children: React.ReactNode }) {
  return <RootShell lang="sv">{children}</RootShell>;
}
