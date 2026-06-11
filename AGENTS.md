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
