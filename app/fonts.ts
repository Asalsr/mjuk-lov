import { Cormorant_Garamond, Inter, Didact_Gothic } from "next/font/google";

// Shared across the two root layouts (home + localized). next/font must be
// called at module scope, so we define the fonts once here and reuse the
// combined class string in both.

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const didact = Didact_Gothic({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-didact",
  display: "swap",
});

export const fontVars = `${cormorant.variable} ${inter.variable} ${didact.variable}`;
