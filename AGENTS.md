<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# House rules

Before substantive work in this repo — and again before committing or merging —
consult the **`mjuk-lov-rules`** skill. It's the maintained checklist of enforced
conventions (bilingual strings, structured recipe data, the accessibility tokens,
data-layer seams, the AI route, idempotent RLS migrations, the verification gate).
The sections below are the most-touched rules, kept here for convenience; the
skill is the fuller source.

# Recipes

When adding or editing recipes in `content/recipes/`, follow `content/recipes/AUTHORING.md`: ingredient `qty` is structured (`{value,unit}` | `{text}`, authored in EU/metric), set `densityKey` for weight↔volume conversion (run `npm run structure-qty` to auto-assign), and write oven temperatures as `215°C` in step text (both °C/°F render automatically — never hardcode the conversion). The unit converter lives in `lib/units/`.

# Product photos

Photos are illustrative, and cakes are baked to the size (cm) and weight (kg) ordered — so a real order can differ from the photo in height, layer count, and finish (e.g. a three-layer birthday cake in the picture versus a smaller two-layer 17 cm order). Whenever you add product photography, render the `<PhotoDisclaimer lang={lang} />` component (`app/components/PhotoDisclaimer.tsx`) once beneath the photo or gallery — not on every thumbnail. The bilingual copy lives in `lib/i18n.ts` as `photoDisclaimer` (`sv`/`en`/`fa`); edit it there, keeping all three locales in sync and free of em dashes.
