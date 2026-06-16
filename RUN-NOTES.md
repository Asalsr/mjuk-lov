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
