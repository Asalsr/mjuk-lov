# Mjuk Lov — Phase 3 backlog plan (M9–M12)

> Implementation plan for four captured-but-unbuilt items, verified against the
> codebase on **2026-06-11**. Companion to `RECIPE-APP-PLAN.md` (which this
> extends — see its §17b and §16). Each item is a milestone with a schema/data
> change, a build, and a test gate.

**Recommended order** (by legal risk, then user-requested value, then depth):
**M11 → M9 → M10 → M12**. Rationale per milestone below.

| M | Milestone | Source | Priority | Gating dependency |
|---|---|---|---|---|
| **M11** | GDPR self-service: data export + account deletion + consent records | §16, §11 | **1 — legal** | none (also builds the `consents` table M10 reuses) |
| **M9** | Richer / practical recipe detail pages | §17b | 2 — user-requested | M9b (step photos) gated on photography |
| **M10** | Server-side AI memory | §16 | 3 — depth | consent infra from M11 |
| **M12** | DIY-kit QR companion | §16 | 4 — product | reuses M9 step model |

---

## M11 — GDPR self-service (export + erasure + consent records)

**Why first.** Accounts now store **special-category health data** (allergies) and
the published privacy policy promises data-subject rights that have **no
implementation** — that's a live compliance gap, not a feature. It also
establishes the `consents` table M10 depends on.

### Current state (verified)
- User-owned tables (all `on delete cascade references auth.users`):
  `profiles, favorites, wishlist, notes, cooking_history, orders,
  delivery_addresses`. (`recipe_adaptations` is shared, not per-user.)
- `lib/userdata` `exportAll/importAll` cover **device-local** data only — not the account.
- No `deleteUser` / erasure / export anywhere in code. Admin (service-role)
  client exists: `lib/supabase/admin.ts` (`createAdminClient`, `isAdminConfigured`).
- AI/health-data consent is collected **client-side only** (`consentLabel`) — no server record.

### Build

**1. Consent records** (Art. 9 explicit consent, Art. 7 demonstrability)
- Migration `…_consents.sql`: table `public.consents (user_id, kind, granted bool,
  version text, updated_at)`, PK `(user_id, kind)`, RLS owner-only (mirror the
  `wishlist` policy pattern). `kind ∈ {ai_health, ai_memory, marketing}`.
- Record the AI/health consent server-side when the user toggles it (today it's
  ephemeral). Lays the rail for M10 (`ai_memory`) and the future marketing-consent item.

**2. Data export** (Art. 15 access / Art. 20 portability)
- `app/api/account/export/route.ts` — `POST`, `runtime nodejs`, authenticated via
  `createClient()` (`@/lib/supabase/server`) → `getUser()`. Read every user-owned
  table for that `user_id`, return `application/json` as a download
  (`Content-Disposition: attachment`). Machine-readable = portability.
- UI: "Export my data" button in a new section of `MyPageClient.tsx`.

**3. Account deletion** (Art. 17 erasure) — **with the bookkeeping caveat**
- `app/api/account/delete/route.ts` — `POST`, authenticated, **re-auth required**
  (recent login or password re-entry; Supabase reauthentication). Same-origin only, rate-limited.
- **Orders cannot be hard-deleted**: Swedish *Bokföringslagen* requires retaining
  accounting records ~7 years. GDPR Art. 17(3)(b) (legal obligation) overrides
  erasure for that data. So the flow is:
  1. **Anonymize** `orders` + `delivery_addresses` tied to the user — null/replace
     `user_id`, strip PII (name, address, phone, email) but **keep amounts + order
     ref** for bookkeeping. (Add a nullable `user_id` or a tombstone uuid; today
     it cascades — change to `on delete set null` for `orders`, or anonymize before delete.)
  2. `admin.auth.admin.deleteUser(userId)` — cascades favorites/wishlist/notes/
     history/profiles/consents.
  3. Sign out + redirect to landing.
- UI: clearly-marked "danger zone" in `MyPageClient.tsx` with a typed confirmation.

**4. Docs + i18n**
- New `lib/i18n` strings (sv/en): `exportMyData, deleteAccount, deleteAccountWarning,
  deleteAccountConfirm, accountDeleted, dataExported`.
- Update `integritetspolicy` + `villkor`: document export, erasure, **the
  accounting-retention exception**, and how to exercise rights.

### Tests / gate
- Export returns rows from every user-owned table.
- Deletion: cascade removes personal rows; orders survive but are anonymized (no PII, amounts intact).
- Re-auth required; service-role key never reaches the client.
- Playwright smoke: export downloads; delete logs out + row gone.

### Security notes
- Both endpoints are destructive/outward-facing → require recent-login reauth,
  same-origin POST, rate-limit. Service-role client stays server-only (it already is).

---

## M9 — Richer / practical recipe detail pages

**Why.** Directly user-requested ("more detailed and practical"). Text fields are
cheap and high-visibility; **split off step photos** (M9b) which need original
photography (brand rule §5: original content only — no scraping).

### Current state (verified)
- `RecipeSchema`: `ingredients [{ qty: string, item: Localized }]`, `steps:
  Localized[]`, `time {prepMin, totalMin}`, `servings:int`, `notes: Localized`.
  **Missing**: equipment, per-step time, per-step image, yield note, technique tips.
- 5 recipes in `content/recipes/*.json`, Zod-validated at build, rendered SSG at
  `app/[lang]/recept/[slug]/page.tsx` with JSON-LD.

### Build — M9a (text-only, ships first)

**1. Schema additions — all optional/defaulted so the 5 existing recipes keep validating**
- `equipment: Localized[].default([])` — tools needed.
- `yieldNote: Localized.optional()` — e.g. "one 20 cm cake / 12 cookies" (richer than `servings`).
- `tips: Localized[].default([])` — actionable technique tips (distinct from `notes`).
- **Steps gain optional metadata without rewriting all arrays at once** — accept a
  Zod union and normalize via `.transform()`:
  ```ts
  const Step = z.union([
    Localized,                                   // legacy: bare {sv,en}
    z.object({ text: Localized, durationMin: z.number().int().positive().optional(),
               image: z.string().optional() }),
  ]).transform((s) => "text" in s ? s : { text: s });
  steps: z.array(Step).min(1)
  ```
  → existing JSON validates untouched; new fields are additive.

**2. Content** — enrich the 5 recipes with equipment, per-step timings, yield, tips.
Reuse `scripts/translate.ts` patterns for the bilingual fill; human-review as today.

**3. Rendering** — update detail page + step/ingredient components: equipment block,
per-step time chips, yield line, tips section.

**4. SEO win** — extend JSON-LD: `recipeYield`, `tool`, and `recipeInstructions`
as `HowToStep` with `timeRequired`/`image` per step.

### Build — M9b (step images, gated)
- Add `public/recipes/<slug>/step-N.jpg`; populate the step `image` field.
- **Blocker**: requires shooting original step photos (no scraping). Ship M9a
  first; M9b lands as photos are produced — `log` which recipes still lack images.

### Tests / gate
- **Migration test**: all existing recipes still validate against the new schema (union/transform).
- Vitest over the enriched recipes; build fails on invalid/unapproved as today.

---

## M10 — Server-side AI memory

**Why.** §16 "durable, cross-device history; richer personalization than
per-request context." Depends on M11's consent rail (storing allergy-derived
content server-side is Art. 9 processing → needs **its own** opt-in).

### Current state (verified)
- `/api/ai` is stateless. `mode: "ask"` sends `userContext` per request only if the
  user consented client-side. `mode: "adapt"` caches in **shared** `recipe_adaptations`.
- Auth available via `@/lib/supabase/server`; admin via `@/lib/supabase/admin`.
- Cost model (§15) cares about per-question token cost → memory context must be bounded.

### Build

**1. Storage** — migration `…_ai_memory.sql`:
- `public.ai_messages (id, user_id, role, content, created_at)` — durable transcript, RLS owner-only.
- `public.ai_summary (user_id pk, summary text, updated_at)` — rolling distilled
  memory to cap context size (don't replay the whole transcript every turn).

**2. Consent gate** — a **separate** `ai_memory` consent (`consents` table from M11).
Store nothing unless opted in. Independent of the per-request `ai_health` consent.

**3. Route changes** (`mode: "ask"`, authenticated only):
- `getUser()` → if `ai_memory` consent: load `ai_summary` + last *N* messages, add
  as context (respect the existing 1500-char context cap; summarize older turns).
- Persist question + answer to `ai_messages`; refresh `ai_summary` periodically.
- Unauthenticated / not-opted-in → behaves exactly as today (no regression).

**4. UI** — show recent conversation on `min-sida` or in `AskAssistant`; a
**"clear my AI memory"** control (also gives erasure granularity, complements M11).
Privacy-note + consent toggle; update `integritetspolicy`.

**5. Export/erasure coverage** — `ai_messages`/`ai_summary` must be included in
M11's export and deleted on account deletion (add to those routes).

### Tests / gate
- Opt-in off → zero writes, identical behavior to current.
- Opt-in on → history persists, reloads cross-session, context stays under cap.
- Memory cleared on demand and on account deletion.

---

## M12 — DIY-kit QR companion

**Why.** §16 product feature tied to the kits already sold. Reuses M9's rich step
model (do after M9, or use a simpler step model and adopt M9 later).

### Current state (verified)
- Kits are static in `lib/products.ts` (`KITS`: standard/deluxe/gift; `SUBSCRIPTIONS`).
  No per-kit guide content, no QR, no kit route. Recipes already have steps + video.

### Build

**1. Kit-guide content** — `content/kits/<id>.json`, Zod-validated, **reusing the
M9 step shape** (Localized text + optional `durationMin`/`image` + `youtubeId`).
Keyed by the existing kit `id` (`kit-standard`, …). DRY with the recipe schema.

**2. Companion route** — `app/[lang]/kit/[id]/page.tsx`, **SSG**, **mobile-first**
(used on a phone in the kitchen), **no login** (printed on the physical box).
Reuse recipe step components + `YouTubeEmbed`. Optional device-local "mark step
done" progress (reuse the `lib/userdata` pattern — no account needed).

**3. QR generation — author-time, not runtime.** Script `scripts/kit-qr.ts`
(add dep `qrcode`) renders each kit URL `https://mjuklov.se/sv/kit/<id>` to
`public/kits/<id>-qr.svg` for the packaging/print team. Physical boxes are
offline, so this is an asset hand-off, not a live endpoint.

**4. i18n + SEO** — bilingual content; on-page language switch (QR points to `/sv`
default). Decide index vs `noindex`; if indexed, add `HowTo` JSON-LD.

### Tests / gate
- Route renders for each kit `id`; missing guide → graceful fallback.
- `scripts/kit-qr.ts` emits a valid scannable SVG per kit.

---

## Cross-cutting sequencing notes
- **M11 before M10**: the `consents` table and export/delete routes must exist (or
  be extended) before AI memory introduces a new per-user data store.
- **M9 before M12**: the QR companion reuses the rich step model; building it first
  avoids a second step-schema migration.
- **M9a before M9b**: text enrichment ships immediately; step photography is the
  only true blocker and is isolated to M9b.
- Every schema change stays **additive/optional** so existing content keeps
  validating and the SSG build never breaks mid-migration.
