/**
 * PostCSS config for Next.js + Tailwind v4.
 * The Figma export uses @tailwindcss/vite — Next.js needs @tailwindcss/postcss instead.
 *
 * Place this file at the ROOT of your Next.js project (same level as package.json).
 */
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
