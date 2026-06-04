# Mjuk Lov · *ett mjukt löfte*

A bilingual (Swedish / English) website and **AI-powered dessert mini-app** for a small artisan dessert brand in Gothenburg. It pairs a polished editorial brand site with a recipe app, customer accounts, and a no-friction “request to order” shop — built on **Next.js 16 (App Router)**, **Supabase**, and an LLM (OpenAI / Claude, swappable).

> Portfolio note: this repo demonstrates full-stack product work — AI integration with safety guardrails, auth + row-level security, an offline-first data layer that syncs to accounts, i18n, SEO, and Docker — on a modified Next.js 16 codebase.

---

## ✨ Features

**Recipes**
- Bilingual recipe pages (SSG) with embedded technique videos
- **AI-assisted allergen labels** (EU 1169/2011): a hybrid engine — LLM reasoning **+** a deterministic safety-net + canonical wording — that **drafts** labels for **human approval** (never auto-published)
- `schema.org/Recipe` JSON-LD, `hreflang`, sitemap & robots
- Author-time AI scripts: import a recipe from a URL, translate sv↔en

**Personalization (offline-first)**
- Save / wishlist / notes / “made it”, and a diet + allergy filter
- Stored **device-local** for guests, then **synced to the account on login** (write-through + merge), so nothing is lost

**AI assistant**
- A baking assistant and a **“make this vegetarian / vegan”** adapter that re-runs the allergen engine on the adapted recipe
- Runs through a stateless server route (key stays server-side), with a GDPR consent gate for diet/allergy data

**Accounts & ordering**
- Email + password auth with email confirmation and password reset (Supabase)
- A “**My page**” (profile, likes, wishlist, orders)
- **Request to order** (no online payment): cart → request form (pickup/delivery, desired date, structured + Google-validated address) → saved to Supabase and emailed to the owner
- **Owner/admin view** to manage incoming requests (owner-only, enforced by RLS)
- Stripe checkout/webhook included but parked behind a flag for a future payments phase

---

## 🧱 Tech stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack, React 19) |
| Styling | Tailwind CSS v4, custom editorial design system |
| Backend | Supabase (Postgres, Auth, Row-Level Security) |
| AI | OpenAI / Anthropic (provider-agnostic) |
| Payments | Stripe (Checkout + webhook, parked) |
| Validation | Zod · Tests: Vitest |
| Tooling | TypeScript, tsx, Docker |

---

## 🏗️ Notable engineering decisions

- **AI with guardrails:** the allergen engine combines LLM reasoning (handles “coconut cream ≠ milk”) with a deterministic dictionary (catches what the LLM misses, e.g. nuts/gluten) and human sign-off — appropriate for a *legal* label.
- **Provider-agnostic AI:** one `chat()` interface; switch OpenAI ↔ Claude with an env var.
- **Author-time vs. runtime AI:** content is generated once at authoring time and served static (≈ zero per-visitor cost); only the personal assistant runs at request time.
- **Offline-first, account-aware data:** a single `lib/userdata` store works for guests (localStorage) and logged-in users (Supabase write-through), with a migration/merge on login.
- **Security:** per-user RLS on every table; the service-role key is used only server-side (e.g. the Stripe webhook); `NEXT_PUBLIC_` keys are publishable-only.

---

## 🚀 Getting started

```bash
npm install
cp .env.example .env   # fill in the values you need (see below)
npm run dev            # http://localhost:3000
```

Or with Docker:

```bash
docker compose up -d --build   # http://localhost:3000
```

### Environment variables
See [`.env.example`](.env.example). All are optional — the app degrades gracefully:

| Variable | Enables |
|---|---|
| `OPENAI_API_KEY` | AI assistant, recipe adapter, allergen labelling |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Accounts, My page, orders, sync |
| `SUPABASE_SERVICE_ROLE_KEY` | Guest orders + order webhooks (server-only) |
| `RESEND_API_KEY` / `OWNER_EMAIL` | Emailing order requests |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Delivery-address autocomplete/validation |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Real payments (parked) |

Database schema lives in [`supabase/migrations/`](supabase/migrations/) — run them in the Supabase SQL editor.

### Scripts
```bash
npm run dev        # dev server
npm run build      # production build
npm test           # Vitest (allergen engine)
npm run label -- <slug>      # AI-draft an allergen label for a recipe
npm run import -- <url>      # AI-import a recipe from a URL
npm run translate -- <slug>  # fill missing sv/en fields
```

---

## 📁 Structure

```
app/                 # App Router: [lang] routes (recept, butik, varukorg, min-sida, admin), api/
app/components/      # recipe / personal / shop / auth / admin + brand UI
lib/                 # recipes, allergen engine, userdata store, cart, ai, supabase, i18n
content/recipes/     # recipe content (JSON, Zod-validated) — git as CMS
scripts/             # author-time AI tooling
supabase/migrations/ # SQL schema + RLS
```

---

## 📌 Status

Active build. Core product (recipes, personalization, AI, accounts, request-to-order, admin) works in dev. Roadmap: real payments, corporate subscriptions, personalized offers, Persian (RTL) locale.

*Built with [Claude Code](https://claude.com/claude-code).*
