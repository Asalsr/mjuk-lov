# Mjuk Lov — product & shop overhaul (agent run spec)

**For:** Claude Code, running unattended against `github.com/Asalsr/mjuk-lov`.
**Goal:** Turn the kits into configurable products (flavour → fillings → tools), add a party line and a baked-goods menu line, park corporate, and rewrite the kit guides — all trilingual (sv/en/fa, fa is RTL), zero-radius, accessibility-clean.

---

## BLOCK 0 — Runner protocol (read first, do not skip)

You will execute Blocks 1–8 **in order**. They have dependencies; do not reorder.

For **every** block:

1. **Before editing**, read the `mjuk-lov-rules` skill (`.claude/skills/mjuk-lov-rules/SKILL.md`) and follow it — bilingual/trilingual strings, the accessibility text tokens (`ink-muted` / `ink-faint`, never opacity on text), zero-radius, structured data seams, idempotent migrations, the verification gate. Read the files the block names before changing them; the spec gives intent and exact values, the repo is the source of truth for current contents.
2. **Implement** exactly the block. Do not add scope. If something is genuinely ambiguous, prefer the simplest correct option and leave a `// NOTE(asal):` comment rather than inventing features.
3. **After editing**, run `npm run gate` (tsc + Vitest + `next build`). Also run `npm run lint` and the contrast audit if the gate doesn't already cover it.
4. **If green:** commit with a clear message (`feat: …` / `refactor: …`) scoped to that block, then continue to the next block.
5. **If red:** fix forward up to two attempts. If still red, **stop**, leave the working tree as-is, and write what failed to `RUN-NOTES.md` at the repo root. Do not push broken work; the pre-push hook will block it anyway.
6. Do **not** touch the Stripe/checkout path (`KitBuyButton`, `/api/checkout`, `/api/stripe/*`). It stays parked behind its flag. The configurator targets the existing **order-request** flow only.
7. No database migration is required anywhere in this spec — order data rides inside the existing `orders.items` JSONB column. Do not create a migration.

When all 8 blocks are committed and green, append a one-paragraph summary to `RUN-NOTES.md` and stop.

---

## Tunable constants (Asal sets these; defaults are usable as-is)

All money is SEK and **VAT-inclusive** (12 % livsmedelsmoms sits inside the price — never add it on top). These live in `lib/pricing.ts` (Block 1) so they change in one place.

```
EXTRA_ITEM_SEK        = 29     // flat price for ANY extra colour or tool beyond the included count
FILLING_FREE_COUNT    = 1      // fillings included free; extras cost EXTRA_ITEM_SEK each
                               //   ← ADJUST to 2 if the second filling should also be free
PARTY_BASE_SEK        = 390    // party pack base price, covers 2 cakes
PARTY_BASE_CAKES      = 2
PARTY_PER_CAKE_SEK    = 185    // each additional cake (3rd … 10th)
PARTY_MAX_SELF_SERVE  = 10     // 11+ routes to "contact us", no buy button
LEAD_DAYS_KIT         = 3      // DIY kit minimum lead time
LEAD_DAYS_PARTY       = 7      // party line — HARD rule, enforced in the date picker AND the route
LEAD_DAYS_MENU        = 2      // baked-goods menu, normal order
LEAD_DAYS_MENU_BIG    = 4      // baked-goods menu, large order
MENU_BIG_ORDER_QTY    = 30     // total pieces at/above which the longer menu lead time applies
```

**Three numbers worth eyeballing before launch** (defaults will run fine if ignored): `FILLING_FREE_COUNT`, the party `PARTY_BASE_SEK` / `PARTY_PER_CAKE_SEK`, and the menu prices in Block 1. All are estimates pending real COGS.

Fixed option sets (used across blocks):

```
FLAVOURS = ["vanilla", "chocolate"]                                  // radio, free, pick exactly 1
FILLINGS = ["berries", "chocolate-berry", "nuts-fruits", "biscoff", "caramel"]  // pick 1–2
TOOLS    = ["piping", "brush", "knife"]                              // pick a mix up to the kit's included count
```

---

## BLOCK 1 — Product model + pricing foundation

**Why first:** every later block imports from these two files.

**Files:** `lib/products.ts` (edit), `lib/pricing.ts` (new), `lib/pricing.test.ts` (new, Vitest).

### 1a. `lib/products.ts`

Extend the `Product` type and data. Keep existing IDs and prices unless stated.

- Add optional fields to `Product`:
  - `kind?: "kit" | "subscription" | "party" | "menu"` (default existing kits = `"kit"`, subscriptions = `"subscription"`).
  - `configurable?: boolean` — true for the three kits.
  - `included?: { colours: number; tools: number }` — only on configurable kits.
  - `comingSoon?: boolean`.
  - `leadDays?: number`.
  - `variants?: { id: string; label: { sv: string; en: string; fa: string }; priceSek: number }[]` — for menu items sold by format.
  - `rotating?: boolean` — for the seasonal menu slot.
- **Kits:** remove every "6–8 personer / 10–12 people / ۶ تا ۸" headcount phrase from all three kits' `description` (sv/en/fa). Replace with experience-led copy (one short sentence each; warm, no headcount). Set on each kit: `kind: "kit"`, `configurable: true`, `leadDays: 3`, and:
  - `kit-standard` → `included: { colours: 3, tools: 2 }`
  - `kit-gift` → `included: { colours: 3, tools: 2 }`
  - `kit-deluxe` → `included: { colours: 3, tools: 3 }`
- **Subscriptions:** set `comingSoon: true` on all three. Leave prices in the data but they will be hidden in the UI (Block 6 / shop). Do not delete them.
- **New `PARTY` array** with one product `party-pack`: `kind: "party"`, `leadDays: 7`, trilingual name (sv `Festpaket`, en `Party Pack`, fa `بسته جشن`) and description (each guest decorates their own mini cake). `priceSek: PARTY_BASE_SEK` as the displayed-from price.
- **New `MENU` array** ("Kakor & bakverk"), each `kind: "menu"`, `leadDays: 2`, with `variants`:
  - `menu-brownie` — variants: `box4` (120), `box9` (230). Names: sv `Brownie`, en `Brownie`, fa `براونی`.
  - `menu-lemon` — variant: `loaf` (200). sv `Citronkaka`, en `Lemon cake`, fa `کیک لیمو`.
  - `menu-cookie` — variants: `pack6` (100), `pack12` (180). sv `Kakor`, en `Cookies`, fa `کوکی`.
  - `menu-seasonal` — `rotating: true`, variants `box4` (120), `box9` (230). sv `Säsongens bakverk`, en `Seasonal bake`, fa `شیرینی فصلی`.
  - (Prices are estimates — flag with a top-of-array comment.)
- Update `PRODUCTS` to spread all five arrays: `[...KITS, ...SUBSCRIPTIONS, ...PARTY, ...MENU]`. `getProduct` keeps working unchanged.

### 1b. `lib/pricing.ts` (new — single source of truth, pure functions)

Export the constants block above. Define the line-config type and pure functions used by **both** the client configurator and the server route:

```ts
export type LineConfig = {
  productId: string;
  qty: number;
  flavour?: string;                                  // kit
  fillings?: string[];                               // kit, length 1–2
  colours?: number;                                  // kit, chosen colour count (≥ included)
  tools?: { piping: number; brush: number; knife: number }; // kit
  variantId?: string;                                // menu
  partyCakes?: number;                               // party, 2..PARTY_MAX_SELF_SERVE
};
```

- `priceLineSek(cfg): number` — kit: `base + max(0, fillings.length - FILLING_FREE_COUNT)*EXTRA + max(0, chosenTools - included.tools)*EXTRA + max(0, colours - included.colours)*EXTRA`, then `* qty`. party: `PARTY_BASE_SEK + max(0, partyCakes - PARTY_BASE_CAKES)*PARTY_PER_CAKE_SEK`. menu: `variant.priceSek * qty`. Round to integer kr.
- `leadDaysFor(cfg): number` — party → `LEAD_DAYS_PARTY`; menu → total pieces `≥ MENU_BIG_ORDER_QTY ? LEAD_DAYS_MENU_BIG : LEAD_DAYS_MENU`; kit → `LEAD_DAYS_KIT`; else 3.
- `describeLine(cfg, lang): string` — human-readable, localized, for cart rows and the owner email, e.g. `"Standard — vanilj, bär + hallon · 2 penslar (1 extra)"`. Use the option label maps below.
- Export label maps for `FLAVOURS`, `FILLINGS`, `TOOLS` (trilingual) so UI and `describeLine` share them.

### 1c. `lib/pricing.test.ts` (Vitest)

Cover: kit with 1 filling + included tools = base price; kit with 2 fillings + 1 extra tool = base + 2×EXTRA; party 2 cakes = base; party 10 cakes = base + 8×per-cake; menu variant price × qty; `leadDaysFor` returns 7/4/2/3 correctly.

**Acceptance:** `npm run gate` green; new tests pass; no headcount phrases remain in `lib/products.ts` (`grep -i "6–8\|10–12\|personer\|people\|نفر" lib/products.ts` returns nothing in kit descriptions).

---

## BLOCK 2 — Cart store refactor (line IDs + config)

**Why:** `lib/cart/store.ts` keys and merges items by `productId` alone, so two Standard kits with different flavours would collapse into one line. The configurator makes that wrong.

**File:** `lib/cart/store.ts` (edit). Also grep for every consumer of `addToCart` / `CartItem` and update call sites.

- Change `CartItem` to: `{ lineId: string; config: LineConfig; message?: string }` (import `LineConfig` from `lib/pricing`). Keep `qty` inside `config`.
- `addToCart(config: LineConfig)`: generate a stable `lineId` (e.g. `crypto.randomUUID()`), **merge only when an existing line's `config` is deeply equal** (same product, flavour, fillings, tools, colours, variant, partyCakes); on match bump `config.qty`, else push a new line.
- Replace `setQty(productId, …)` etc. with `lineId`-based equivalents: `setQty(lineId, qty)`, `removeFromCart(lineId)`, `setItemMessage(lineId, msg)`.
- `cartCount` sums `config.qty`.
- Keep the `localStorage` key `mjuklov_cart`, the `useSyncExternalStore` wiring, and the cross-tab `storage` listener intact. **Migration-safety:** if a stored cart has the old shape (objects with `productId` at top level), discard it (reset to `[]`) on read rather than crashing.

**Acceptance:** gate green; adding the same kit with two different flavours yields two cart lines; identical configs merge and increment qty.

---

## BLOCK 3 — i18n keys (trilingual)

**File:** `lib/i18n.ts` (edit the `ui` object — add keys to **all three** locales sv/en/fa; reuse existing keys, only add missing ones).

Add the chrome the configurator and new sections need. Follow existing naming/casing. At minimum:

- Configurator: `configure`, `flavourLabel`, `fillingLabel`, `fillingHint` ("välj 1–2"), `toolsLabel`, `toolsHint` (e.g. "X ingår — välj din mix"), `coloursLabel`, `extraItemNote` (fn: `(n) => "${n} kr per extra"`), `addToCartWithPrice` (fn: `(kr) => "Lägg i varukorg · ${kr} kr"`), `chooseDate`, `dateTooSoon`.
- Party: `partyHeading`, `partyTagline`, `partyDescription`, `partyCakesLabel`, `partyContactOver` (fn: `(n) => "Fler än ${n}? Kontakta oss"`), `partyLeadNote` ("Minst 7 dagars framförhållning").
- Menu: `menuHeading` (sv `Kakor & bakverk`, en `Cakes & bakes`, fa `کیک و شیرینی`), `menuTagline`, `formatLabel`, `seasonalNote`.
- Corporate coming-soon: `comingSoon`, `corporateComingSoonNote` ("Vi planerar en ny modell — mer snart").

Option labels (flavours, fillings, tools) live in `lib/pricing.ts` (Block 1) — import, don't duplicate.

**Acceptance:** gate green; every new key exists in sv, en, **and** fa.

---

## BLOCK 4 — Configurator component + shop wiring

**Files:** `app/components/shop/KitConfigurator.tsx` (new client component), `app/components/shop/AddToCartButton.tsx` (edit), `app/[lang]/butik/page.tsx` (edit).

**The flow** (single inline panel, not a multi-page wizard — show all steps stacked; the design system forbids hidden/`display:none` sections):

1. **Flavour** — radio, `FLAVOURS`, pick exactly 1, free.
2. **Fillings** — checkboxes, `FILLINGS`, enforce 1–2 selected; show `extraItemNote` once a 2nd is picked (if `FILLING_FREE_COUNT` is 1).
3. **Tools** — stepper per `TOOLS` type (piping / brush / knife); the included count is free, total chosen above `included.tools` costs `EXTRA_ITEM_SEK` each; show running "X included, Y extra". Same pattern for **colours** above `included.colours`.
4. **Live price** — recompute via `priceLineSek` on every change; the add button shows `addToCartWithPrice(price)`.
5. **Add** — calls the Block-2 `addToCart(config)` and confirms.

For **party** products the configurator variant shows a **cake-count stepper (2 … `PARTY_MAX_SELF_SERVE`)**, live price via `priceLineSek`, the `partyLeadNote`, and at the max a `partyContactOver` link to the contact route instead of letting them exceed it. (The 7-day date enforcement is global, applied at order time in Block 5; the party stepper does not collect a date itself.)

For **menu** products: a small **format selector** (variants) + qty; no flavour/filling/tools.

**Wiring:** in `butik/page.tsx`, configurable kits and party render a **"Configure"** affordance that reveals/opens `KitConfigurator` instead of the bare `AddToCartButton`. Non-configurable, non-coming-soon products (menu) keep a lightweight add (format + qty). `AddToCartButton` is updated to accept a full `config` (since Block 2 changed the store) — keep it for menu/simple adds, route kits/party through the configurator.

**Constraints:** zero radius, `ink-muted`/`ink-faint` text tokens (no opacity on text), keyboard-operable steppers with `aria-label`s, RTL-safe layout for fa. Reuse existing button styling from `AddToCartButton` (1px `--warm-cocoa` border, `--warm-peach` hover).

**Acceptance:** gate green; configuring a kit produces a correctly-priced cart line; party stepper prices match `priceLineSek`; menu format selector works.

---

## BLOCK 5 — Cart page + order-request route

**Files:** `app/[lang]/varukorg/page.tsx` and/or `app/components/shop/CartAndRequest.tsx` (edit), `app/api/order-request/route.ts` (edit).

### Cart display

Each row shows `describeLine(config, lang)` + qty + line price (`priceLineSek`). Subtotal sums line prices. Qty/remove operate on `lineId`.

### Route — three changes

1. **Accept config.** The POST body's `items` now carry `{ lineId, config, message }`. Map each to a stored record. **Recompute price server-side** with `priceLineSek(config)` — do **not** trust any client price. Build `items` for the JSONB insert as `{ productId, name, nameSv, nameFa, qty, config, priceSek: <recomputed>, message }`. (No schema change — `orders.items` is already JSONB.)
2. **Per-product lead time.** Replace the global `minDesiredDate()` (+3) with: required minimum = today + **max(`leadDaysFor(cfg)` across all cart items)**. Reject with `date_too_soon` if `desiredDate` is earlier. So a cart containing a party item demands ≥7 days; a menu-only big order ≥4; etc.
3. **Email summary.** Update the owner notification + customer confirmation to render `describeLine` per item and the recomputed subtotal. Keep the existing best-effort send (never block the insert) and the bilingual helper.

**Acceptance:** gate green; submitting a configured cart stores the config in `orders.items`; a party item forces the 7-day minimum at the route; owner email shows flavour/fillings/tools per line.

---

## BLOCK 6 — Homepage: kits reframe, party section, corporate coming-soon

**Files:** `app/components/Kits.tsx`, `app/components/Corporate.tsx`, `app/(home)/page.tsx`, and a new `app/components/Party.tsx`. All inline content dicts must have sv/en/fa.

- **Kits.tsx:** remove all headcount language; rewrite descriptions to the experience/customisation frame; keep prices as "Kommer snart / Coming soon / به‌زودی" (current pre-launch state) unless Asal has set real prices. Heading stays `Tårtkit` / `Cake kits`.
- **New Party.tsx:** a section using `partyHeading` / `partyTagline` / `partyDescription`. Lead copy (sv + en + fa):
  - en headline: **"Gather round — the cake isn't finished yet."**
  - en support: *Birthdays, anniversaries, a Sunday with people you love. Everyone gets their own little cake to decorate — not just dessert, an hour of making something together.*
  - eyebrow: *samlas · gather round*
  - Mention "from `PARTY_BASE_SEK` kr" and the 7-day note; CTA into the shop/party configurator.
- **Corporate.tsx:** all three tiers show `comingSoon` state — hide the price, show "Kommer snart", disable the CTA, and add `corporateComingSoonNote` under the heading. Keep the tiers visible.
- **page.tsx:** insert `<Party/>` after `<Kits/>` (before `<Corporate/>`), with the existing `SectionDivider`/`WaveDivider` pattern and consistent section background colours.

**Constraints:** brand voice (warm, slightly playful, no exclamation marks, no emoji); Cormorant for display, Inter for UI; zero radius; text tokens not opacity; RTL for fa.

**Acceptance:** gate green; homepage renders Hero → TheIdea → Kits → **Party** → Corporate(coming-soon) → TheCraft → … ; no headcount copy; fa renders RTL.

---

## BLOCK 7 — Cakes & bakes (menu line UI)

**Files:** `app/[lang]/butik/page.tsx` (edit — add a third category section), new `app/components/Bakes.tsx` (homepage section), `app/(home)/page.tsx` (insert it).

- **Shop:** add a **"Kakor & bakverk / Cakes & bakes"** section under the existing Kits and Subscriptions blocks, mapping the `MENU` array. Each card shows the format selector (`variants`) + qty + simple add. The seasonal item shows `seasonalNote`.
- **Homepage `Bakes.tsx`:** a section introducing the menu line (made-to-order, 2-day, fika/weekend framing) with the four items; CTA into the shop. Trilingual. Note in copy that big orders need more notice (ties to `LEAD_DAYS_MENU_BIG`).
- Leave room to **merge into the corporate offer later**: don't hardcode menu items as "consumer only" — they already support qty + lead tiers + the standard pickup/delivery fields, so a future bulk path can reuse them. Add a short `// NOTE(asal): menu items are corporate-reusable` comment near the `MENU` array.

**Acceptance:** gate green; menu items appear in shop + homepage; format selector and qty work; 2-day lead enforced via Block 5's `leadDaysFor`.

---

## BLOCK 8 — Rewrite kit guides (paint-it-yourself)

**Files:** `content/kits/kit-standard.json`, `kit-deluxe.json`, `kit-gift.json` (edit). Validate against `lib/kits/schema.ts` (do not change the schema).

Replace the old "stack sponges, smooth frosting with a palette knife" content with the confirmed model: the cake arrives **white and finished**; the customer **decorates** it. Three beginner looks, no skill assumed, piping is optional (snip the tip), not the default.

- `intro`: remove headcount; lead with the experience ("You decorate — we made the rest easy. There's no wrong way.").
- `steps` (keep them few and functional — this is the in-hand companion, distinct from `TheCraft` brand philosophy):
  1. Open the kit, let the cake and colours sit at room temperature a few minutes.
  2. Pick your tools — brush, spoon/spreader, or snip the corner off a piping bag.
  3. Decorate: choose a look or play — **Swirl it** (drag a spoon through the colour), **Brush it** (sweep colour round the sides), or **Pile it on** (sprinkles, berries on top).
  4. Add candles, light, and celebrate.
- `tips`: one reassurance ("Worst case it's delicious; best case you surprise yourself"), one allergen line (keep the existing `checkPackaging`-style note).
- All three languages. Keep `youtubeId: null` unless a video exists.

**Acceptance:** gate green (the kit JSON is Zod-validated at build, so a malformed file fails `next build`); `/sv/kit/kit-standard` etc. render the new steps; no sponge-stacking copy remains.

---

## After all blocks

Append to `RUN-NOTES.md`: which blocks committed, any `NOTE(asal)` items left, and anything that needed a judgment call. Stop. Do not push if any gate is red.
