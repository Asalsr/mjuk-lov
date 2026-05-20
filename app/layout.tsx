import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter, Didact_Gothic } from 'next/font/google';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

const didact = Didact_Gothic({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-didact',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Mjuk Lov — ett mjukt löfte',
  description:
    'Hembakat i Göteborg. Tårtkit och företagsprenumerationer. Hand baked in Gothenburg — DIY cake kits and corporate dessert subscriptions.',
  metadataBase: new URL('https://mjuklov.se'),
  openGraph: {
    title: 'Mjuk Lov',
    description: 'ett mjukt löfte · a soft promise',
    url: 'https://mjuklov.se',
    siteName: 'Mjuk Lov',
    locale: 'sv_SE',
    alternateLocale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mjuk Lov',
    description: 'ett mjukt löfte · a soft promise',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv" className={`${cormorant.variable} ${inter.variable} ${didact.variable}`}>
      <body>{children}</body>
    </html>
  );
}
