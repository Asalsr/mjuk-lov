# Mjuk Lov · *ett mjukt löfte*

A trilingual (Swedish / English / Persian-RTL) website and **AI-powered dessert platform** for a small artisan brand in Gothenburg. It pairs a polished editorial brand site with a 40+ recipe app, customer accounts, an order-management back office, and a no-friction “request to order” shop.

📜 Full release history in [`CHANGELOG.md`](CHANGELOG.md).

<p>
<img alt="Next.js" src="https://img.shields.io/badge/Next.js_16-000?style=flat-square&logo=nextdotjs&logoColor=white">
<img alt="React" src="https://img.shields.io/badge/React_19-20232a?style=flat-square&logo=react">
<img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178c6?style=flat-square&logo=typescript&logoColor=white">
<img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_v4-38bdf8?style=flat-square&logo=tailwindcss&logoColor=white">
<img alt="Supabase" src="https://img.shields.io/badge/Supabase-3ecf8e?style=flat-square&logo=supabase&logoColor=white">
<img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-4169e1?style=flat-square&logo=postgresql&logoColor=white">
<img alt="OpenAI" src="https://img.shields.io/badge/OpenAI_/_Claude-412991?style=flat-square&logo=openai&logoColor=white">
<img alt="Stripe" src="https://img.shields.io/badge/Stripe-635bff?style=flat-square&logo=stripe&logoColor=white">
<img alt="Resend" src="https://img.shields.io/badge/Resend-000?style=flat-square&logo=resend&logoColor=white">
<img alt="Zod" src="https://img.shields.io/badge/Zod-3e67b1?style=flat-square&logo=zod&logoColor=white">
<img alt="Vitest" src="https://img.shields.io/badge/Vitest-6e9f18?style=flat-square&logo=vitest&logoColor=white">
<img alt="Docker" src="https://img.shields.io/badge/Docker-2496ed?style=flat-square&logo=docker&logoColor=white">
<img alt="Vercel" src="https://img.shields.io/badge/Vercel-000?style=flat-square&logo=vercel&logoColor=white">
</p>

> **Portfolio note.** A single repo demonstrating full-stack product work end-to-end: LLM integration *with safety guardrails*, auth + row-level security, an offline-first data layer that syncs to accounts, a real order-management back office with transactional email, third-party API integrations (YouTube Data, Google Places, Stripe, Resend), i18n, SEO, Docker, and CI-free continuous deploy to a custom domain — on a modified **Next.js 16** codebase.

---

## 📸 Screenshots

| Home | Recipes — diet + allergy filter |
|---|---|
| ![Home](docs/screenshots/01-home.png) | ![Recipes](docs/screenshots/02-recipes.png) |
| **Recipe** — embedded video, allergen label, AI adapt | **Shop** — DIY cake kits |
| ![Recipe](docs/screenshots/03-recipe.png) | ![Shop](docs/screenshots/04-shop.png) |

---

## 🧰 Tools & integrations

| Area | Tools | What it does here |
|---|---|---|
| **Framework** | Next.js 16 · React 19 · Turbopack | App Router, RSC, Server Actions, SSG + dynamic routes |
| **Language** | TypeScript 5 | End-to-end typed, strict |
| **Styling** | Tailwind CSS v4 · tw-animate-css | Custom editorial design system, zero-radius brand tokens |
| **Database & Auth** | Supabase · PostgreSQL · `@supabase/ssr` | Accounts, email confirm + reset, Row-Level Security, SSR session refresh |
| **AI / LLM** | OpenAI · Anthropic (provider-agnostic) | Baking assistant, recipe adapter, allergen-label drafting |
| **Email** | Resend (DKIM/SPF domain-verified) | Order notifications to the owner + confirm/decline to the customer |
| **Payments** | Stripe (Checkout + webhooks) | Built and parked behind a flag for a future payments phase |
| **External APIs** | YouTube Data API v3 · Google Places API (New) | Resolve official recipe videos · validate delivery addresses |
| **Validation** | Zod | Recipe schema, API payloads, content gate at build time |
| **Testing** | Vitest | Allergen-engine unit tests |
| **Authoring** | `tsx` scripts · Git-as-CMS | Import / translate / label recipes; resolve video IDs |
| **Infra & deploy** | Docker · docker-compose · Vercel · One.com DNS | Standalone container; auto-deploy from `master` to `mjuklov.se` |

---

## ✨ Features

**Recipes (40+, bilingual, SSG)**
- Every recipe is a full page with **embedded YouTube player + ingredients + method + allergen label**, in sv & en.
- **AI-assisted allergen labels** (EU 1169/2011): a hybrid engine — LLM reasoning **+** a deterministic safety-net dictionary + canonical wording — that **drafts** labels for **human approval** (never auto-published).
- **“Make it vegetarian / vegan / gluten-free”** adapter that re-runs the allergen engine on the adapted recipe.
- A **YouTube Data API resolver** script matches each dish to the creator’s *official* channel video and credits it (“inspired by →”).
- `schema.org/Recipe` JSON-LD, `hreflang`, sitemap & robots.

**Personalization (offline-first)**
- Save / wishlist / notes / “made it”, plus a diet + allergy filter.
- Stored **device-local** for guests, then **synced to the account on login** (write-through + merge) — nothing is lost.

**Accounts & ordering**
- Email + password auth with confirmation and reset; show/hide password; a **“My page”** with profile, likes, wishlist, a 3-order **Recent orders** preview, and self-service **GDPR data export + account deletion**.
- **Request to order** (no online payment): cart → request form (pickup/delivery, desired date, structured + Google-validated address) → saved to Supabase + emailed.
- **Orders** (`/bestallningar`): human-readable order numbers (`ML-YYYY-NNNN`), status + date-range filtering, a per-order detail page, a **delivered** status, and a printable **receipt / kvitto**. Customers see their orders by confirmed email (RLS), with guest-order backfill on sign-up.

**Order-management back office (owner-only)**
- `/admin` panel: filter tabs with counts, **accept / decline / mark-delivered / reopen**, enter a **price quote** + internal note, and **email / call** the customer.
- Status changes flow through an **owner-gated server route** (service role) that also emails the customer (bilingual sv/en) on confirm/decline/deliver.

**Internationalization & accessibility**
- **Three locales** — Swedish, English, and **Persian (RTL)** with Persian digits and idiomatic, research-backed UI copy; per-locale `<html lang>` and `hreflang`.
- **Accessibility-audited**: solid `ink-muted`/`ink-faint` text tokens (no opacity on text), reduced-motion-gated JS animation, a visible focus ring, non-color status cues, and a `contrast-audit` guardrail in CI.

**Extras**
- **Ingredient unit converter**: structured EU/metric quantities → US units + dual °C/°F oven temps on demand (weight↔volume via densities; Vitest-covered).
- **Consent-gated, cross-device AI memory** for the assistant; **personalized offers / discount codes** (opt-in, server-minted); **DIY-kit QR companions**.

---

## 🏗️ Notable engineering decisions

- **AI with guardrails.** The allergen engine combines LLM reasoning (handles “coconut cream ≠ milk”) with a deterministic dictionary (catches what the LLM misses — nuts, gluten) and a human sign-off field — appropriate for a *legal* label. Re-drafting clears the approval.
- **Author-time vs. runtime AI.** Content is generated once at authoring time and served static (≈ zero per-visitor cost); only the personal assistant runs at request time, key server-side, behind a GDPR consent gate.
- **Provider-agnostic AI.** One `chat()` interface; switch OpenAI ↔ Claude with an env var.
- **Offline-first, account-aware data.** A single `lib/userdata` store works for guests (localStorage) and logged-in users (Supabase write-through), with a merge on login.
- **Security model.** Per-user RLS on every table; the **service-role key is used only in server routes** and only after re-verifying the owner — so the back office reads all orders without weakening client-side RLS. `NEXT_PUBLIC_` keys are publishable-only.
- **Resilient by design.** Email is best-effort and never blocks an order; failures are logged, not swallowed. Migrations are idempotent (`add column if not exists`). The app degrades gracefully when an integration’s env var is absent.
- **Structured units, not free text.** Recipe quantities are authored once in EU/metric and converted to US units + dual °C/°F at render time — no hand-written conversions to drift out of sync.
- **Verification gate before every push.** A pre-push hook runs typecheck, Vitest, production build, lint, and the contrast audit — broken work can't reach `master` (and therefore production).

---

## 🚀 Getting started

```bash
npm install
cp .env.example .env   # fill in what you need (all optional — see below)
npm run dev            # http://localhost:3000
```

Or with Docker:

```bash
docker compose up -d --build   # http://localhost:3000
```

### Environment variables
See [`.env.example`](.env.example). All optional — the app degrades gracefully:

| Variable | Enables |
|---|---|
| `OPENAI_API_KEY` | AI assistant, recipe adapter, allergen labelling |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Accounts, My page, orders, sync |
| `SUPABASE_SERVICE_ROLE_KEY` | Guest orders, admin reads, webhooks (server-only) |
| `RESEND_API_KEY` / `RESEND_FROM` / `CONTACT_EMAIL` | Transactional email (orders + status) |
| `OWNER_EMAIL` | The account that can reach `/admin` |
| `GOOGLE_MAPS_SERVER_KEY` | Delivery-address autocomplete (Places API New, via a server-side proxy — key never hits the browser) |
| `YOUTUBE_API_KEY` | The author-time video-ID resolver script |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Real payments (parked) |

Database schema lives in [`supabase/migrations/`](supabase/migrations/) — run them in the Supabase SQL editor.

### Scripts
```bash
npm run dev                  # dev server (Turbopack)
npm run build                # production build
npm test                     # Vitest (allergen engine)
npm run label -- <slug>      # AI-draft an allergen label for a recipe
npm run import -- <url>      # AI-import a recipe from a URL
npm run translate -- <slug>  # fill missing sv/en fields
npm run resolve-videos       # match recipes to official YouTube videos (YouTube Data API)
npm run structure-qty        # auto-assign density keys + structure ingredient quantities
npm run kit-qr               # generate the DIY-kit QR companion SVGs
npm run gate                 # full verification gate (typecheck, test, build, lint, contrast)
```

---

## 📁 Structure

```
app/                 # App Router: [lang] routes (recept, butik, varukorg, bestallningar, min-sida, admin), api/
app/components/      # recipe / personal / shop / auth / admin + brand UI
lib/                 # recipes, allergen engine, units converter, userdata store, cart, ai, offers, supabase, i18n
content/recipes/     # recipe content (JSON, Zod-validated) — git as CMS
content/kits/        # DIY cake-kit definitions
scripts/             # author-time AI + YouTube + QR tooling
supabase/migrations/ # SQL schema + RLS (idempotent)
```

---

## 📌 Status

Live at **[mjuklov.se](https://mjuklov.se)** (Vercel, auto-deploy from `master`). In production: 40+ recipes, personalization, AI assistant + memory, accounts, request-to-order with order numbers / receipts / a delivered status, the admin back office, three locales (incl. Persian RTL), personalized offers, kit QR companions, and GDPR self-service. Roadmap: real payments (Stripe un-parked), corporate subscriptions. See [`CHANGELOG.md`](CHANGELOG.md) for the full history.
