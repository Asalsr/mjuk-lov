---
name: mjuk-lov-rules
description: >-
  The non-obvious house rules for the Mjuk Lov codebase (bilingual Next.js
  dessert-brand site: recipe mini-app + Supabase commerce). Read this at the
  START of any substantive work in this repo and again before committing or
  merging. Use it whenever you touch recipes/content, UI/styling, i18n, the
  AI route, Supabase migrations, or App Router pages — these conventions are
  enforced and easy to violate by accident. If you're about to write code in
  this project and haven't consulted these rules, do so first.
---

# Mjuk Lov — house rules

A scannable checklist of conventions that are **already enforced** here and
costly to relearn per agent. Each rule points at the canonical source — read
that file when you're actually working in its area; don't duplicate it.

> **Why this exists:** several of these (the modified Next.js, the structured
> recipe quantities, the no-opacity-on-text accessibility rule) contradict
> common defaults. Following them up front avoids rework and broken builds.

## 0. Next.js is NOT the version you know
This build has breaking API/convention changes. **Before** writing any App
Router / routing / `generateMetadata` / `generateStaticParams` / params code,
read the relevant guide in `node_modules/next/dist/docs/` and heed deprecation
notices. `params`/`searchParams` are Promises here — `await` them. Source:
`AGENTS.md`.

## 1. Everything user-facing is bilingual `{ sv, en }` (+ optional `fa`)
`sv` is the default; `en` is required too — never ship a one-sided string. `fa`
(Persian, RTL) is the third locale; `Localized` falls back `fa → en`.
- UI chrome strings → `lib/i18n.ts` (add to the `sv`, `en` **and** `fa` blocks).
- Recipe content → `content/recipes/*.json` (both languages on every field).
- **Translate idiomatically, never word-by-word** — match how real native
  sites phrase UI microcopy (e.g. Persian nav "Contact" is "تماس با ما", not the
  bare "تماس"). When unsure, research native conventions rather than guessing.
- **Never translate or transliterate the brand name "Mjuk Lov"** — keep it in
  Latin script in every language, including Persian/RTL text.

## 2. Recipes: structured data, not free text
Full rules in **`content/recipes/AUTHORING.md`** — read it before editing any
recipe. The essentials:
- Ingredient `qty` is **structured**: `{ value, unit }` or `{ text: {sv,en} }`,
  authored in **EU/metric**. The converter (`lib/units/`) produces US units on
  demand — never hand-write conversions.
- Set `densityKey` for weight↔volume; run `npm run structure-qty` to auto-assign
  from ingredient names. Add new keys to `lib/units/densities.ts` when needed.
- **Oven temps:** write `215°C` in step text. Both °C/°F render automatically via
  `annotateTemps` (`lib/units/temps.ts`) — **never** type the `(°F)` yourself.
- Optional richer fields: steps may carry `durationMin`/`image`; a recipe may
  carry `equipment[]`, `yieldNote`, `tips[]`. All optional — omit freely.
- **Allergen labels are legal drafts.** A recipe only publishes when
  `allergens.approvedBy` is set (human-approved) **and** `published: true`.
  Don't flip `published` on an unapproved label.

## 2a. Product photos carry the illustrative-photo notice
Photos are illustrative and cakes are baked to the **size (cm) and weight (kg)**
ordered, so a real order can differ from the photo in height, layer count, and
finish (the classic case: a three-layer birthday cake in the picture versus a
smaller two-layer 17 cm order). Whenever you add product photography, render
`<PhotoDisclaimer lang={lang} />` (`app/components/PhotoDisclaimer.tsx`) **once**
beneath the photo or gallery — not per thumbnail. Copy lives in `lib/i18n.ts` as
`photoDisclaimer` (`sv`/`en`/`fa`); keep all three locales in sync, no em dashes
(§1, guarded by `lib/i18n.test.ts`). The kit detail page
(`app/[lang]/kit/[id]/page.tsx`) is the reference usage.

## 2b. Product sizes are a fixed vocabulary with serving counts
Sizes and minimum orders are **fixed** — don't invent new diameters, tray sizes,
or minimums. Every size must display with its **serving count** (customers buy by
servings, not cm); the dimension is the secondary sub-label. DIY kits are the one
exception to all of this (they have their own size system — already implemented).

- **Round cakes** (e.g. Lotus): only **17 cm** or **25 cm** — no other diameters.
  - `17 cm = 8 slices` (this is the reference slice: a 17 cm pan cut into 8).
  - `25 cm ≈ 17 slices` — derived by **equal slice area**:
    `8 × (25/17)² = 17.3 → 17`. If a new round size is ever added, compute its
    slice count the same way; never hand-pick a number.
  - **Minimum = 8 portions (one whole 17 cm)**; order by portion in units of
    **8** (each 8 = another 17 cm's worth), or step up to a single 25 cm. The
    atomic unit is 8 portions — never fewer than a whole 17 cm.
  - The 25 cm must be priced **cheaper per slice** than 2× 17 cm, or no one picks
    it (economy of size).
- **Tray / square cakes** (Brownie, Lime cake): sizes **18×28 cm** and
  **30×28 cm**. Yields `18×28 = 9 pcs`, `30×28 = 15 pcs`. **Minimum 9 pieces**,
  then **+6** per step (9 → 15 → 21 …). Portion cut is **6×9 cm**.
- **Jars** (Blusmisu, Limemisu): sold single, **minimum 6**.
- Customer-facing figures may show a **range** (café/patisserie convention: 17 cm
  → *serves 6–8*, 25 cm → *serves 15–18*) where the low number is a generous
  slice and the high number the counter/dessert-table slice — but the atomic
  math above (8 / 17) stays the source of truth.
- Garnish is part of the product spec: **Lime cake → blueberry + lime**;
  **Brownie → cream + chocolate pieces**.

## 3. Accessibility is enforced — don't regress it
Full rationale in the `ui-accessibility-conventions` memory; guardrail script is
`scripts/contrast-audit.ts` (`npx tsx scripts/contrast-audit.ts`).
- **NEVER put Tailwind `opacity-*` on TEXT.** On the cream background it fails
  WCAG. Use the solid tokens in `app/globals.css`: `.ink-muted` (secondary
  copy/labels/meta), `.ink-faint` (large decorative text ≥1.5rem only).
  `opacity-*` is fine on non-text (images, dividers) and on
  `hover:`/`group-hover:`/`disabled:` states.
- Sizes: body ≥16px; `.type-caps` is 14px; avoid inline `fontSize` < `0.75rem`.
- **JS-driven motion** (parallax, magnetic button, custom cursor, intros) must be
  gated by `usePrefersReducedMotion()` (`app/hooks/`). CSS motion is already
  flattened globally under `prefers-reduced-motion`.
- Keep the global `:focus-visible` ring — don't strip outlines.
- `scroll`/`mousemove` listeners: rAF-batched + `{ passive: true }`.
- Non-color cues: status badges show the word; filter chips use `✓` + border +
  `aria-pressed`; content links are underlined.
- Errors use `role="alert"` / `aria-live`. AI fetches use a 30s
  `AbortSignal.timeout`.

## 4. Go through the data-layer seams
Personalization/recipe reads go through the storage-agnostic interfaces
`lib/recipes` and `lib/userdata` (device-local now, Supabase later). Don't read
storage directly in components — that seam is what keeps the Phase 2 Supabase
swap a backend change, not a rewrite.

## 5. AI: one runtime feature, key stays server-side
Exactly one runtime AI feature, the **stateless** route `app/api/ai/route.ts`:
provider key server-only, rate-limited, stores nothing per-user (unless a future
memory feature adds explicit consent). Provider-agnostic (OpenAI↔Claude via env).
Author-time AI lives in `scripts/` (`label`, `import`, `translate`).

## 6. Supabase migrations are idempotent + owner-scoped
- Make migrations **re-runnable**: `drop policy if exists …` before `create
  policy …`; `create table if not exists`; `add column if not exists`.
- User-owned tables: **owner-only RLS** (`(select auth.uid()) = user_id`) and
  `on delete cascade` from `auth.users`. Mirror an existing migration in
  `supabase/migrations/` for the exact policy shape.

## 7. Verify before claiming done / committing
Run these and confirm they pass — don't assert success without output:
- `npx tsc --noEmit`
- `npm test` (vitest — the allergen engine + unit converter are the legal/
  correctness-critical paths)
- `npm run build` (SSG re-validates every recipe; a bad recipe fails the build)
- `eslint` on the files you changed (`npx eslint <files>`)
- For UI work, also run the contrast audit (§3).

## 8. Branch & commit etiquette
Default branch is `master`; feature work lives on branches (e.g.
`recipe-mini-app`). Commit/push only when the user asks. End commit messages with
the project's `Co-Authored-By` trailer. The working tree may contain **other
agents' in-progress changes** — scope your commits to your own files; don't sweep
unrelated modifications into a commit.
