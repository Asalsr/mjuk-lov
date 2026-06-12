# Changelog

Complete project history for **Mjuk Lov** — a bilingual (sv/en, + Persian/RTL)
AI-powered dessert platform: editorial brand site, 40+ recipe app, customer
accounts, request-to-order shop, and an order-management back office.

Entries are newest-first. Dates are the commit dates (Europe/Stockholm). The
project has no semantic-version tags; releases are grouped by milestone (`M…`)
and phase, mirroring the commit history. Live at
**[mjuklov.se](https://mjuklov.se)** — Vercel auto-deploys from `master`.

---

## 2026-06-12 — Orders UX polish

### Changed
- **My page (profile):** order rows now link straight to their detail page —
  including delivered/past orders, which previously were not clickable. The
  separate "Active" / "Past" sections collapse into a single **Recent orders**
  preview capped at the 3 newest, with a **See all →** link to the full list.
- **Order detail:** the order-number heading now renders in the Inter caps face
  (matching the orders list and receipt) instead of the serif display face used
  for title words.

### Fixed
- **Order detail status badge** now uses the same per-status palette as the
  orders list, profile, and admin (requested = terracotta, confirmed = cocoa,
  delivered = wine, declined = brown) — a delivered order previously showed a
  cocoa badge here but wine everywhere else.
- **Receipt link** falls back to the request origin when `APP_URL` is unset.

## 2026-06-12 — M15 · Orders expansion

### Added
- Human-readable **order numbers** (`ML-YYYY-NNNN`) and a **delivered** status.
- A dedicated **orders page** (`/bestallningar`) with status + date-range
  filtering, an **order detail page**, and a printable **receipt / kvitto**.
- **Bilingual transactional emails** (sv/en) for order status changes.
- Customers see their orders by **confirmed email** (RLS), with guest-order
  backfill so pre-account orders attach to the account on sign-up.

## 2026-06-11 — M14 · Persian locale + RTL

### Added
- **Persian (fa) as a third locale**, full RTL: localized UI copy
  (research-backed, idiomatic), full Persian content, Persian digits, and the
  home landing page.
- A custom **3-language switcher** (brand surface, centered) replacing the
  default dropdown.

### Changed
- The brand name **"Mjuk Lov" stays in Latin script** in every locale (never
  transliterated).

## 2026-06-11 — M13 · Personalized offers & discount codes

### Added
- Consent-gated, server-minted **personalized offers** and discount codes
  surfaced on My page.

## 2026-06-11 — M12 · DIY-kit QR companion

### Added
- **QR companion** for the DIY cake kits (per-kit content + generated QR SVGs).

## 2026-06-11 — M11 · GDPR self-service

### Added
- **Data export** (JSON download) and **account deletion** (password re-auth,
  retained orders anonymised) — self-service, RLS-scoped.

## 2026-06-11 — M10 · Server-side AI memory

### Added
- **Consent-gated, cross-device AI memory** for the assistant (stored per user,
  clearable, off by default).

## 2026-06-11 — Accessibility, unit converter & richer recipes

### Added
- **Ingredient unit converter** (`lib/units/`): structured EU/metric quantities
  with weight↔volume densities, rendering US units + dual °C/°F oven temps on
  demand. Covered by Vitest.

### Changed
- **Accessibility / responsive overhaul:** solid `ink-muted`/`ink-faint` text
  tokens (no opacity on text), reduced-motion hook gating JS motion, visible
  focus ring, non-color status cues, and a `contrast-audit` guardrail script.
- Richer recipe detail pages.

### Infrastructure
- **Verification gate enforced before push** (pre-push hook + `verify-gate`
  skill): typecheck, tests, build, lint, and the contrast audit.

## 2026-06-08 to 06-10 — Legal, navigation & UX

### Added
- **GDPR privacy policy + consumer terms** pages (sv/en), with Gothenburg
  controller/seller details.
- **Vercel Analytics + Speed Insights**.
- Mobile **bottom navigation bar**; Recept + Butik surfaced on desktop.
- **Address book**: saved delivery addresses + profile phone.

### Changed
- Header/nav consolidation; tightened home section spacing; clearer save
  confirmation.

### Fixed
- Recipes not rendering (scroll-reveal observer never fired for the long grid).
- Logout 404 on owner pages; require password confirmation on destructive auth.
- **Places autocomplete moved behind a server-side proxy** — the Maps key never
  reaches the browser.
- All RLS migrations made **idempotent** (`drop policy if exists` before create).

## 2026-06-07 to 06-08 — Shop, back office & recipe library

### Added
- **Kit shop** (unified kits + corporate) with delivery fee and order-date floor,
  and a header basket.
- **Request-to-order flow**: cart → request form (pickup/delivery, desired date,
  Google-validated structured address) → Supabase + email.
- **Order-management back office** (`/admin`): filter tabs with counts,
  accept / decline / mark-done / reopen, price quote + internal note,
  email/call the customer — through an owner-gated service-role route that also
  emails the customer.
- **Recipe library expansion to 40+**: video companion recipes across many
  creators, an **embedded-video gallery** merged into Recipes (retiring
  `/videor`), and a **YouTube Data API** resolver that credits each dish's
  official channel video.
- **AI-drafted allergen labels** approved (human sign-off) across all recipes;
  "check the packaging" note added to every allergen block.
- Contact form wired to **email the owner** (Resend).

### Fixed
- Order requests notify the business inbox; owner reads all orders via service
  role. Stable cart snapshot + correct Maps loader for address autocomplete.
- Per-locale `<html lang>`; password-recovery session cookies on callback.

## 2026-06-03 to 06-04 — Phases 1 & 2 · AI mini-app + accounts

### Added
- **Phase 1 — AI-powered recipe mini-app**: the recipe app, AI baking assistant,
  recipe adapter ("make it vegan/gluten-free"), and the allergen engine
  (LLM + deterministic dictionary, provider-agnostic OpenAI ↔ Claude).
- **Phase 2 — accounts & sync**: Supabase email/password auth (confirm + reset),
  **My page**, offline-first **save/wishlist/notes/made-it** synced to the
  account on login, and **Docker** packaging.
- Structured address + Google autocomplete; profile menu nav; production setup
  runbook.

## 2026-05-02 to 05-22 — Brand site foundation

### Added
- **Initial Next.js 16 scaffold** (App Router, React 19, Turbopack, TypeScript,
  Tailwind v4) with self-hosted fonts.
- The **Mjuk Lov editorial homepage** — brand story ("we bake, you decorate"),
  custom icons (We Bake / Pick Color / You Design), and section layouts.
- **Mobile-first responsive pass** + loading-screen video.
- 28 Claude Code skills adapted for the stack.

### Fixed
- Icon case-sensitive path breakage in production (Craft, Personal, Packing,
  Deluxe).
