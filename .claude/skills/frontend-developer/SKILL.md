---
name: frontend-developer
description: Use when implementing React components, UI work, styling, layouts, forms, or any work inside the App Router (`/app/`). Also use for design-forward requests like "build a page", "create a dashboard", "design a UI", or "style this component" — this skill handles both implementation AND design direction for new interfaces. Triggers even when the user doesn't say "React" or "frontend" but is clearly describing UI work (layouts, forms, filters, interactive elements).
compatibility: Designed for Claude Code
metadata:
  author: mjuk-lov
  version: "1.0"
---

# Frontend Developer Skill

**Use this skill when:** Building or modifying React components, UI/UX, styling, layouts, forms, designing new pages/interfaces, or anything inside the App Router (`/app/`).

## ⚠️ READ FIRST: This is NOT the Next.js you know

This project is on **Next.js 16** with **React 19** and **Tailwind 4**. The repo's `AGENTS.md` is explicit:

> "This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices."

**Mandatory before writing code:**
1. If you are about to use a Next.js API (routing, metadata, image, font, server actions, caching, headers/cookies, params), read `node_modules/next/dist/docs/<relevant>.md` first.
2. Do not assume Next 13/14/15 patterns work. They may have been renamed, removed, or had their argument shape changed.
3. If `tsc --noEmit` or `next build` fails on a Next API call, the answer is in `node_modules/next/dist/docs/`, not your training data.

## Overview

Frontend skill for `mjuk-lov` — covers implementation and design direction for the App Router. Server Components by default; explicit `'use client'` only when interactivity is needed.

**Boundary rule:** Everything inside `/app/`, `/public/`, and any future `/components/`, `/lib/`, `/styles/` directories the user creates. Does NOT design backends, APIs, or data stores — defer to the user when those are needed.

---

## When to Use

<rules>
**USE this skill for:**
- React Server / Client Component creation and modification
- App Router layouts, pages, route handlers, and metadata
- UI implementation with Tailwind 4
- Form handling (React 19 Server Actions, `useActionState`, `useFormStatus`)
- Image optimization with `next/image`, fonts with `next/font`
- Accessibility, responsive design, performance
- New pages, prototypes, landing pages, and redesigns (see Design Thinking Phase below)

**DO NOT use this skill for:**
- Backend service design, database schema, or data layer choices — defer to the user; this project has no API yet (`package.json` shows only `next`, `react`, `react-dom`)
- Build tooling rewrites (don't swap out PostCSS, ESLint, or TypeScript without the user's explicit ask)
</rules>

---

## Design Thinking Phase (New UI Only)

<rules>
**Activate this phase when:**
- Creating new pages, components, or standalone UIs
- Prototypes, demos, landing pages
- Redesigning interfaces with creative freedom
- Any request where visual quality is the primary goal

**Skip this phase when:**
- Modifying an existing component inside an established design system — follow the system
- Bug fixes to existing UI — match what's there, don't redesign
- Adding a field to an existing form — consistency beats creativity

**Rule of thumb:** If the codebase already has custom CSS tokens or a component library in use, ask the user whether to work **within** the system or **break from** it before proceeding.
</rules>

<instructions>
Before writing a single line of code for new UI, work through this design thinking process:

### 1. Understand the Context
- **Purpose:** What problem does this interface solve? Who uses it?
- **Tone:** What emotional register fits? (professional, playful, urgent, calm, luxurious)
- **Constraints:** Accessibility requirements, performance targets, design tokens, framework limits

### 2. Commit to an Aesthetic Direction

Pick an extreme and own it. Some directions to inspire (but not constrain) your choice:

| Direction | Characteristics |
|-----------|----------------|
| Brutally minimal | Raw whitespace, stark typography, zero decoration |
| Maximalist chaos | Dense information, layered visuals, rich texture |
| Retro-futuristic | Neon accents, dark backgrounds, tech-forward |
| Organic/natural | Earthy tones, soft curves, natural textures |
| Luxury/refined | Generous spacing, serif typography, muted palette |
| Playful/toy-like | Bright colors, rounded shapes, bouncy interactions |
| Editorial/magazine | Strong grid, drop caps, pull quotes, typographic hierarchy |
| Brutalist/raw | Exposed structure, monospace, flat color blocks |
| Industrial/utilitarian | Functional typography, dense data, grey palette |

### 3. Define the Unforgettable Moment

What is the ONE thing someone will remember after using this interface? A surprising color combination, an unexpected layout break, a delightful micro-interaction, an unusually expressive typeface? Lock this in before coding.

### 4. Write a Design Statement

```
Direction: [chosen aesthetic]
Differentiator: [what makes this unforgettable]
Palette: [primary + secondary + accent, with hex values]
Typography: [display font] paired with [body font]
Responsive: [key layout shifts at breakpoints]
```
</instructions>

---

## Core Expertise

<instructions>

### React 19 + Server Components
- **Default to Server Components.** Add `'use client'` only when the component needs state, effects, browser-only APIs, or event handlers.
- React 19 features: `use()` for async data and context, `useActionState` for form mutations, `useFormStatus` for pending UI inside form descendants, `useOptimistic` for optimistic updates.
- Server Actions (`'use server'`) for mutations — invoke directly from `<form action={...}>` or via `startTransition`.
- Refs as props (no `forwardRef` needed in React 19).
- TypeScript strict mode — keep all props and return types explicit.

### App Router (Next.js 16)
- File-based routing under `/app/`: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `route.ts` for handlers.
- Re-read the relevant `node_modules/next/dist/docs/` page before assuming the shape of `params`, `searchParams`, `headers()`, `cookies()`, route segment config, or caching directives — these have shifted between Next versions.
- `next/image` for images, `next/font` for fonts, the metadata API for `<head>`.

### Tailwind 4
- PostCSS-based via `@tailwindcss/postcss` (already in `package.json`). No `tailwind.config.ts` v3-style required — theme tokens live in CSS via `@theme` blocks in your global stylesheet.
- Use utility classes; reach for arbitrary values `[h-[3.25rem]]` only when no token fits.
- Container queries are first-class in Tailwind 4 — prefer them over media queries when component-level responsiveness is the goal.

### State Management
- Local component state with React hooks. Don't reach for global state stores until the use case justifies it.
- URL state (`searchParams`) is excellent for filters, pagination, and tabs — survives navigation and shares trivially.
- Forms: prefer React 19 native form actions over third-party libraries unless the user has already chosen one.

</instructions>

---

## Design & Styling Rules

<rules>

### Typography
- Choose fonts that are **beautiful, unique, and interesting** for new UI.
- NEVER use Inter, Roboto, Arial, Helvetica, or system-ui as primary display fonts in new designs — they are the defaults of "no one made a choice."
- Pair a **characterful display font** with a **readable body font.**
- Load fonts via `next/font` (handles `font-display: swap` and self-hosting automatically).

### Color & Theme
- Commit to a cohesive palette with CSS custom properties in your global stylesheet.
- Use dominant colors with **sharp accents** — not timid, evenly distributed palettes.
- All text/background combinations MUST meet WCAG AA contrast (4.5:1 for body text, 3:1 for large text).

### Design Token Enforcement
When working in a project with established design tokens (CSS custom properties or Tailwind theme tokens):
- ALL colors MUST reference tokens, no hardcoded hex/rgb/hsl in component files.
- Define new tokens in the global stylesheet `@theme` block before using them in components.
- This applies when extending an existing design system, not for standalone/creative projects where full freedom applies.

### Motion & Animation
- Use animations for page load and micro-interactions.
- Prefer CSS-only solutions; reach for the Motion library (`motion/react`) only when CSS hits its limits.
- Hover states should **surprise** — not just change opacity.
- **Performance:** ONLY animate `transform` and `opacity` — these are GPU-composited. Animating `width`, `height`, `margin`, `top`, `left` causes layout thrashing.
- **Always** respect `prefers-reduced-motion`:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```

### Responsive Design
- **Mobile-first by default** — start with the smallest viewport, layer up with `min-width` media queries (or container queries).
- Touch targets: minimum 44x44px for interactive elements on mobile.
- Typography should scale fluidly: use `clamp()` for font sizes.
- Layouts should reflow, not just shrink — a 3-column grid becomes a stack on mobile.

### Accessibility (Non-Negotiable)
- Color contrast: WCAG AA minimum.
- Keyboard navigation: all interactive elements focusable and operable with keyboard.
- Focus indicators: visible, high-contrast focus rings (never `outline: none` without replacement).
- Semantic HTML: proper heading hierarchy, landmark regions, `<button>` for actions.
- Screen reader support: `aria-label` for icon buttons, `alt` text for images, `aria-hidden` for decorative elements.
- Reduced motion: always include `prefers-reduced-motion` media query.

</rules>

---

## Development Workflow

<workflow>

### 1. Analyze Existing Patterns
Before creating new components, read existing code in `/app/` to understand naming, layout structure, styling, and any conventions already in use. This project is small — match what's there.

### 2. Read the Next.js Docs You're About to Use
If your change touches a Next.js API, open `node_modules/next/dist/docs/` and read the page for that API. Do not skip this step — Next 16 has differences from training-data Next.

### 3. Design (New UI Only)
For new pages/components, run the Design Thinking Phase above. Skip this for modifications to existing UI.

### 4. Implement
- Server Components by default; mark `'use client'` only when interactivity demands it.
- Type props with TypeScript interfaces.
- Use `@/` or relative imports consistently with what the codebase already does.
- Every data-fetching component needs three states: loading, error, success. Use `loading.tsx` and `error.tsx` segments for App Router routes.
- Prefer skeleton loaders over spinners for layout stability.

### 5. Validate
ALWAYS run after creating/modifying code:
```bash
npx tsc --noEmit    # TypeScript type checking
npm run lint        # ESLint
npm run build       # next build catches a different class of errors than dev
```

For UI changes, also start the dev server (`npm run dev`) and exercise the change in a browser — type-checks confirm correctness, not feature behavior.

</workflow>

---

## Pre-Delivery Checklist (New UI)

<checklist>

### Design Quality
- [ ] Design statement written and followed (new UI only)
- [ ] No generic/default styling (Inter, purple gradients, default `rounded-lg shadow-md`)
- [ ] Font pairing is intentional and distinctive

### Accessibility
- [ ] All rules in "Accessibility (Non-Negotiable)" followed
- [ ] `prefers-reduced-motion` media query included

### Performance
- [ ] Fonts loaded via `next/font` (or `font-display: swap` if loaded manually)
- [ ] Animations use only `transform` and `opacity`
- [ ] Images use `next/image` with explicit `width`/`height` or `fill`

### Responsive
- [ ] Works at 320px width (small phone)
- [ ] Works at 768px (tablet)
- [ ] Works at 1440px (desktop)
- [ ] Touch targets are 44x44px minimum on mobile

### Server vs Client Boundaries
- [ ] No `'use client'` added unless the component genuinely needs it
- [ ] No hooks or browser APIs in Server Components
- [ ] Server Actions marked `'use server'` and only invoked from forms or transitions

### Build Sanity
- [ ] `npx tsc --noEmit` clean
- [ ] `npm run lint` clean
- [ ] `npm run build` succeeds

</checklist>

---

## Related Skills

- **simplify** — Post-implementation code cleanup
- **design-review** — Independent visual / UX review before delivery
- **debugging** — Use when behavior diverges from expectation
