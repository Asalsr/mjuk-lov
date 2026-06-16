# Run notes

## Revision — minimalist configurator + aligned kit/party copy

Built the "promise, don't expose" shop experience and aligned all kit copy to the
real product (a finished white cake the customer decorates). Trilingual sv/en/fa.

**New foundation**
- `lib/pricing.ts` — `LineConfig` (kit | party) types, option sets
  (flavours/fillings/tools), trilingual labels, tunable constants, and
  `priceLineSek` / `leadDaysFor` / `describeLine` / `configKey` /
  `defaultKitConfig` / `defaultPartyConfig`. Extras are 29 kr each; party is
  390 kr (2 cakes) + 185 kr/extra cake. Kit lead 3 days, party 7.
- `lib/pricing.test.ts` — 13 vitest cases (base prices, extras, lead times,
  config keys, describe lines).
- `lib/products.ts` — `Product` gained `kind` / `configurable` / `leadDays`;
  kits marked configurable; added the `party-pack` product (`PARTY` / `PARTY_PACK`).
- `lib/cart/store.ts` — cart lines are now keyed by `lineId` (a hash of the
  config + reserved date) carrying `config` and `date`; identical configs merge.
  Backward-compat migration backfills `lineId` for old productId-keyed carts.
  `addLine(config, { date })` is the configured-line entry point.

**Configurator (one decision per screen)**
- `app/components/shop/Configurator.tsx` — sequential modal flow with a single
  persistent price in the footer, progress dots, quiet Back/Next, and a
  plain-language "what's included" line per step. "Included vs +29 kr" is stated
  in words and the price only moves (with a reason) on extras.
  - Kit steps: Flavour → Filling (1–2) → Tools (steppers, "2 of 2 included" →
    "+29 kr · 1 extra"; colours always 3, with a quiet optional 4th) → Date
    (3-day floor) → Review & add.
  - Party steps: How many cakes (2–10, 11+ → "Contact us") → Flavour split
    (auto-balancing pair, always sums to the cake count) → Filling → Tools →
    Date (7-day floor) → Review & add.
- `app/components/shop/MakeItYoursButton.tsx` — the single CTA that opens the
  flow (solid on cards, `link` variant for the Party block).

**Shop cards + Party, sold by occasion**
- `app/[lang]/butik/page.tsx` — configurable cards now show only name, size,
  "from <price> kr", one "Make it yours" button, and a quiet promise line — no
  exposed options. Added a Party section (occasions block + configurable card).
- `app/components/Party.tsx` — first-class Party Pack block with named occasions
  (birthdays, anniversaries, baby showers, möhippor…), meta line and CTA.
- `app/components/Kits.tsx` — rebuilt from product data (drops the old "6–8
  people" headcount copy), uses the configurator CTA + promise line, and renders
  the Party block. Description text moved from `opacity-80` to `ink-muted`.
- `app/[lang]/kit/page.tsx` — variant cards + sticky CTA use the configurator;
  added a Party section after the variants grid.

**Copy aligned to the real product (sv/en/fa)**
- `kitIncludes` rewritten as the "It's all in the box" / "Allt finns i lådan"
  list (finished white cake, ready-coloured buttercream pots, your choice of
  tools, looks to copy, step-by-step guide, candles).
- Removed the discontinued "Three piping bags, ready-tinted" line and the
  "we're with you the whole table" typo (→ "the whole way").
- `kitHowSubline` is now reservation language ("Reserve your day — collect it in
  Gothenburg when it suits you. Kits need 3 days' notice, party packs 7.").
- `kitReassureBody`, `kitHeroLede` and the How-it-works steps no longer imply
  stacking layers or piping as the only method — the cake arrives finished and
  white; the customer decorates it with whatever tool they chose.

**Cart + order request**
- `CartAndRequest.tsx` — rows show `describeLine`, prices use `priceLineSek`,
  qty/remove key on `lineId`, the date floor is the longest lead time in the
  cart, and the configurator's date prefills the order date.
- `app/api/order-request/route.ts` — accepts per-line `config`/`date`, recomputes
  prices server-side (never trusts the client), enforces the longest lead time,
  and stores/echoes the configured line description.

**Gate:** `tsc --noEmit` ✓ · `vitest` 34/34 ✓ · `npm run build` ✓ · eslint on
changed files ✓ · contrast audit ✓.

## Follow-up — ported the "Cakes & Bakes" menu line onto this branch

The Cakes & Bakes section lived on `master` (commit `d2a2d8b`) but never on
`recipe-mini-app`, so it was missing from the home page here. Rather than merge
master (which carries a *parallel* configurator and would clobber this branch's
work), the menu line was ported onto this branch's model:
- `lib/products.ts` — `Product` gained `kind: "menu"`, `variants`, `rotating`;
  added the `MENU` line (brownie, lemon, cookies, seasonal) and a flattened
  `MENU_VARIANT_PRODUCTS` so each box size is an orderable line that prices and
  labels through `getProduct` — no change to the cart/order pipeline.
- `lib/pricing.ts` — `MENU_BIG_ORDER_QTY`.
- `lib/i18n.ts` — `menuHeading` / `menuTagline` / `seasonalNote` (sv/en/fa).
- `app/components/Bakes.tsx` — the homepage "Cakes & bakes" section, rendered
  after Kits; CTA links to `/[lang]/butik#bakes`.
- `app/components/shop/MenuLineCard.tsx` — shop card; each variant adds to cart.
- `app/(home)/page.tsx` + `app/[lang]/butik/page.tsx` — wired in the section.

## Revision — configurator fixes, colour picker + cart persistence

**One configurator only.** This branch already had a single configurator — the
step wizard (`app/components/shop/Configurator.tsx`), opened everywhere via
`MakeItYoursButton`. No stacked-form remnant exists here; nothing to delete.
**Note for the future merge:** when this branch lands on `master`, the wizard
*supersedes* master's older single-screen `KitConfigurator` entirely — replace
it, don't merge master's configurator in.

**Flavour split → one auto-balancing slider.** The party "Flavour split" step's
two steppers are replaced by a single brand-styled range slider
(`.flavour-slider` in `globals.css`: zero radius, warm-cocoa track, terracotta
44px-tall handle). Live label "Vanilla {n} · Chocolate {m}" always sums to the
cake count — no second control, no wrong total, no error state. Keyboard/touch
operable with `aria-label` + `aria-valuetext`. Changing the cake count now
**rescales the split proportionally** and re-clamps so it still sums.
- Data model: the split is already carried end-to-end via `PartyConfig.vanilla`
  (chocolate = cakes − vanilla) — through `configKey`, `describeLine`, the cart
  line, the `orders.items` JSONB and the owner email. **Deviation from the
  brief:** I did *not* add a redundant `flavourSplit?: {vanilla,chocolate}` field
  — `vanilla` is the single source of truth and a parallel object would risk
  desync. The acceptance ("split appears in cart line, order record and owner
  email") holds via `describeLine` ("… 5 vanilla / 5 chocolate …").

**Open/close = click only.** Already click-to-open; verified there is no
hover-driven open/close anywhere in the flow. Added a real **focus trap** (Tab
cycles inside the dialog), **focus restore** to the trigger on close, and
`aria-labelledby` pointing at the step heading. Closes only via ✕ / backdrop /
Esc.

**Responsiveness.** Modal is a full-width bottom sheet under `sm`; stepper
buttons bumped to 44px, colour tiles ≥44px, ✕ given a 44px hit area; slider and
footer stack cleanly at ~360px. RTL (fa) mirrors via the dialog `dir`.

**Colour CHOICE (replaces the colour count stepper).** New **Colours** step with
named swatches. `lib/pricing.ts` defines `COLOURS` (8 curated gels, trilingual
label + decorative hex) and `KitConfig.colours` is now a `ColourKey[]` (was a
number). 3 included free; 4th+ adds 29 kr each with the same "+29 kr · 1 extra"
reason label; min 3, cap 9. Swatches are tiles with a colour chip **plus the
name** (never colour alone), `role="checkbox"`/`aria-checked`, check + terracotta
ring when selected, zero radius. `describeLine` lists chosen shades; `configKey`
and pricing updated; vitest cases updated (3 = no fee, 4 = +29).

**Persistence — two layers.**
- *Layer A (drafts, everyone incl. guests):* `lib/cart/draft.ts` saves the
  working `LineConfig` + date to `localStorage` (`mjuklov_draft_<productId>`),
  debounced; the configurator hydrates from it on open and clears it on add.
- *Layer B (account cart sync, logged-in):* migration
  `supabase/migrations/20260616120000_carts.sql` adds `public.carts`
  (`user_id` PK → `auth.users` on delete cascade, `items jsonb`, `updated_at`),
  **RLS on, owner-only** select/insert/update/delete (idempotent, mirrors the
  wishlist migration). `lib/cart/store.ts` write-through upserts (debounced) when
  authed; `app/components/auth/CartSync.tsx` (mounted in `RootShell` beside
  `AutoSync`) merges device-local + server carts **once per login** (union by
  `lineId`, summing qty), adopts the merged cart and writes it back; logout falls
  back to local. All server calls best-effort/wrapped — a sync failure never
  blocks add-to-cart. Guests unchanged.

**i18n:** added `cfgSplitAria`, `cfgColoursTitle`, `cfgColoursPick` (sv/en/fa);
removed the now-unused colour-count strings.

**Gate:** `tsc --noEmit` ✓ · `vitest` 35/35 ✓ · `npm run build` ✓ · eslint on
changed files ✓ · contrast audit unchanged (baseline; no text-opacity added).
