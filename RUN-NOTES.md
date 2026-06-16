# Product & shop overhaul — run notes

All 8 blocks of the spec landed across 4 stacked PRs, each gated green
(`tsc --noEmit` + 30 vitest tests including 9 new pricing tests + production
`next build` + `eslint` on changed files):

| PR | Branch | Scope |
| -- | ------ | ----- |
| #1 | `claude/practical-faraday-qzxwd0-foundation` | Blocks 1–3 — `lib/products.ts` extension, new `lib/pricing.ts` + tests, cart store refactor to line-IDs + `LineConfig`, order-request route accepts new shape + recomputes server-side + per-product lead time, trilingual i18n keys for the configurator/party/menu/coming-soon UI |
| #2 | `claude/practical-faraday-qzxwd0-configurator` | Block 4 — `KitConfigurator` (kits + party variant) and `MenuLineCard`; shop page reshuffled into Kits / Party / Cakes & bakes / Corporate-coming-soon sections |
| #3 | `claude/practical-faraday-qzxwd0-homepage` | Block 6–7 — `Kits.tsx` headcount language removed, `Corporate.tsx` switched to coming-soon, new `Party.tsx` and `Bakes.tsx`, homepage section order updated |
| #4 | `claude/practical-faraday-qzxwd0` | Block 8 — three kit guide JSONs rewritten for the paint-it-yourself model (decorate-only, three beginner looks, piping optional) |

Designated branch `claude/practical-faraday-qzxwd0` holds the final state
containing all four PR commits.

## Judgement calls

- **Block 5's route changes shipped with PR #1.** The cart's wire format
  changes in Block 2 (top-level `productId` → `{lineId, config}`), so the
  matching route update has to ride with it for the gate to stay green on
  the foundation branch in isolation. PR #2 still owns the cart-page row
  rendering polish.
- **Configurator panel is always inline on configurable cards.** The spec
  asked for a stacked panel with no hidden steps — I read "Configure"
  affordance + "no display:none sections" as compatible with always-visible
  inline steps, which is simpler and accessible.
- **Stripe/checkout path untouched.** `KitBuyButton`, `/api/checkout`, and
  `/api/stripe/*` are still flagged off and were not modified.
- **Database migration not needed.** `orders.items` is JSONB and now
  carries the full `LineConfig` per line — no schema change required.
- **`leadDaysFor` for menu items treats `qty` as the unit count.** A future
  refinement could weight by `box4`/`box9`/`pack6`/`pack12` piece counts to
  trigger the 4-day rule more precisely; for now the simple
  `qty ≥ MENU_BIG_ORDER_QTY` threshold matches the spec.
- **All trilingual strings are real translations** (not placeholders), keeping
  "Mjuk Lov" in Latin script across `fa` per the house rule.

## `NOTE(asal)` items left in code

- `lib/products.ts` — menu prices are estimates pending real COGS.
- `lib/products.ts` — menu items are corporate-reusable (a future bulk
  path can ride the existing qty + lead tiers + pickup/delivery fields).
