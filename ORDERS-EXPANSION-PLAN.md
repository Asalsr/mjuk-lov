# Orders expansion plan (M15)

Status: SPEC — awaiting approval before implementation.
Author decisions (2026-06-11): printable receipt page (not generated PDF);
Mjuk Lov is **not VAT-registered** → simple kvitto, seller fields config-driven;
write this spec before coding. Emails must be bilingual (Swedish then English).

> ⚠️ The `orders` code is being actively edited by another session (discount
> codes, offers, GDPR). Coordinate / rebase before and during implementation,
> and keep every schema change additive + idempotent (house-rules §6).

---

## 1. Goal

Turn the cramped "orders" section on `/min-sida` into a proper, filterable
**orders experience** with human-readable **order numbers**, a clear **status
lifecycle** that ends in **delivered**, a downloadable **receipt (kvitto)** once
delivered, **date filters** for both customer and admin, and **bilingual
order emails**.

## 2. Current state (verified in code)

One `orders` table, two flows:
- **Request-to-order** (`/api/order-request`): `requested → confirmed → done | declined`; owner sets `quoted_price`; no online payment.
- **Kit checkout** (`/api/checkout` + `/api/stripe/webhook`): `pending → paid`; Stripe.

Gaps: no `order_number` (UUID only, shown as 8 chars), no receipt, no
`delivered` state, no date filters (admin = status tabs only), orders rendered
inline on `/min-sida` (not their own route), no receipt email.

Relevant files: `supabase/migrations/20260604120000_orders.sql` (+ `..140000`,
`..160000`, `20260608120000`, `20260611140000_discount_codes.sql`),
`app/api/order-request/route.ts`, `app/api/checkout/route.ts`,
`app/api/stripe/webhook/route.ts`, `app/api/admin/order-status/route.ts`,
`app/components/admin/AdminOrders.tsx`, `app/[lang]/admin/page.tsx`,
`app/components/auth/MyPageClient.tsx`, `app/[lang]/min-sida/page.tsx`,
`lib/i18n.ts`, `lib/offers.ts`.

## 3. Status model (unified, adds `delivered`)

| Status | Meaning | Set by | Receipt |
|---|---|---|---|
| `requested` | Custom request awaiting owner ("Waiting") | customer | – |
| `pending` | Kit order awaiting Stripe payment | system | – |
| `confirmed` | Accepted (request) or paid (kit) — being prepared | owner / Stripe | – |
| `delivered` | Picked up / delivered (terminal success) | **owner** | ✅ |
| `declined` | Rejected / cancelled | owner | – |

- **Migrate** existing `done` → `delivered`. Kit `paid` orders show on the same
  board as a confirmed-equivalent; the owner marks them `delivered` after handover.
- Allowed transitions (enforced in `app/api/admin/order-status/route.ts`):
  `requested → confirmed | declined`; `confirmed → delivered | declined | requested`;
  `paid → delivered`; `delivered | declined → requested` (reopen).
- Add `STATUSES` value `delivered`; keep request/kit creation statuses unchanged.

## 4. Order numbers

- New column `order_number text unique`. Format **`ML-YYYY-NNNN`**
  (e.g. `ML-2026-0042`).
- Generation: a Postgres `bigint` sequence `order_number_seq` + a `BEFORE INSERT`
  trigger that sets `order_number` when null:
  `'ML-' || to_char(now(),'YYYY') || '-' || lpad(nextval('order_number_seq')::text, 4, '0')`.
  Concurrency-safe across both API routes and guest/service-role inserts.
  (Global sequence, no yearly reset — simplest and gap-tolerant; sequence gaps
  are fine for receipts to private individuals, who don't require an unbroken
  VAT-invoice series. Yearly reset would need a counter table; skip unless asked.)
- **Backfill** existing rows: assign numbers in `created_at` order in the migration.
- Surface the number in: admin list, customer orders page + detail, all emails,
  and the receipt. Replace the `id.slice(0,8)` display.

## 5. Separate orders page (customer)

- New route **`/[lang]/bestallningar`** (slug language-neutral, like `recept`/
  `butik`). Linked from `/min-sida` ("My orders →"); My Page keeps a 2–3 row
  recent-orders teaser, not the full list.
- **Filters** (Baymard-backed): a status filter (All / Waiting / Confirmed /
  Delivered / Declined) + date filter with quick-selects (This month / Last
  month / This year / All) and separate **From / To** inputs for a custom range.
  Filtering is client-side over the user's fetched orders (small N).
- **Order detail**: route `/[lang]/bestallningar/[orderNumber]` — items, totals,
  status with a short timeline (requested → confirmed → delivered dates),
  fulfilment + address, and a **Download receipt** button when `delivered`.
- Data: extend the customer query (`min-sida` currently selects
  `id,status,created_at,desired_date,fulfilment,quoted_price,items`) to also
  select `order_number, amount, original_amount, discount_code, address,
  delivered_at`. Still **never** select `admin_note`/internal fields.

## 6. Receipt (kvitto) — printable page

- Route **`/[lang]/bestallningar/[orderNumber]/kvitto`**, owner-scoped via RLS
  (the signed-in user can only open their own order). Available only when
  `delivered` (and for kits, `paid`+`delivered`). 404/redirect otherwise.
- Printable layout (the brand chrome hidden via `@media print`); the browser's
  **Save as PDF / Print** produces the download. No new dependency. (Can upgrade
  to a generated PDF later if needed.)
- **Bilingual** (Swedish block then English block).
- Content (simple kvitto — **not** a VAT invoice, since not VAT-registered):
  - Seller: name + address from a config (`lib/seller.ts`, e.g. `SELLER_NAME`,
    `SELLER_ADDRESS`, optional `ORG_NUMBER`/`VAT_NUMBER` — **left blank/off by
    default**; business supplies real values later).
  - Receipt heading "Kvitto / Receipt", **order number**, date (delivered/paid).
  - Customer name.
  - Line items: qty × name, unit price, line total.
  - Subtotal, delivery fee, **total in SEK**.
  - Payment line: kits → "Betald med kort / Paid by card"; requests →
    `quoted_price` + "Betalas vid leverans/upphämtning / Paid on
    delivery/pickup" (adjust to real flow).
  - Footnote: "Detta är ett kvitto, inte en momsfaktura. / This is a receipt,
    not a VAT invoice." (Drop this + add VAT breakdown if/when VAT-registered —
    the template reads `VAT_NUMBER` from config and switches automatically.)
- ⚠️ Stripe already emails its own card receipt for kit payments; our kvitto is
  the **order receipt** (complementary, not a duplicate).

## 7. Admin

- **"Mark delivered"** action on `confirmed`/`paid` orders → sets
  `status='delivered'`, `delivered_at=now()`; unlocks the customer receipt and
  triggers the bilingual "delivered + receipt" email.
- **Date-range filter** alongside the existing status tabs (same quick-selects +
  From/To). Server query already orders by `created_at`; filter client-side or
  pass range params.
- Show `order_number` in the list and the email-customer mailto subject.

## 8. Bilingual emails (new requirement)

- Add `lib/email/bilingual.ts` → `bilingual({ sv, en })` returning one body:
  Swedish block, a divider, then the same in English. Subjects also bilingual
  ("Mjuk Lov — Orderbekräftelse / Order confirmation").
- Apply to: request received (to customer), confirmed (with price), declined,
  and the new **delivered + receipt link**. Owner-notification email can stay
  Swedish-only (internal) — confirm.
- Replace the current single-language customer emails in
  `app/api/order-request/route.ts` and add the delivered email where the admin
  status route sets `delivered`.

## 9. Data model / migration (one idempotent migration)

`supabase/migrations/2026XXXXXXXXXX_orders_numbers_receipts.sql`:
- `create sequence if not exists order_number_seq;`
- `alter table orders add column if not exists order_number text;`
- `alter table orders add column if not exists delivered_at timestamptz;`
- unique index `if not exists` on `order_number`.
- `BEFORE INSERT` trigger (function `set_order_number`) — `create or replace` +
  `drop trigger if exists ... ; create trigger ...`.
- Backfill: numbers for existing rows by `created_at`; `update ... set
  status='delivered', delivered_at=created_at where status='done'`.
- No RLS change needed for receipt (reuse `orders_select_own`); the receipt page
  reads the order via the user's own client (RLS-scoped).

## 10. i18n (sv / en / fa — all three, per house-rules §1)

New keys: `statusDelivered`, `myOrders`, `viewAllOrders`, `orderNumber`,
`filterAll/Waiting/.../`, `dateThisMonth/lastMonth/thisYear/all`, `dateFrom`,
`dateTo`, `downloadReceipt`, `receipt`, `receiptNotVatInvoice`, `paidByCard`,
`paidOnDelivery`, `markDelivered`, `orderTimeline` labels. Persian (`fa`) gets
real strings (the other session added the `fa` locale).

## 11. Phases (each ends with `npm run gate`)

1. **Migration** — order_number + sequence/trigger + `delivered_at` + `done→delivered` backfill. Verify build re-validates.
2. **Order numbers surfaced** — admin list, my-page, emails.
3. **Status `delivered`** — order-status route transition + admin "Mark delivered" + AdminOrders UI.
4. **Orders page** — `/[lang]/bestallningar` + filters + detail route; My Page teaser + link.
5. **Receipt page** — `/[lang]/bestallningar/[orderNumber]/kvitto`, print CSS, seller config, bilingual; "Download receipt" gated on delivered.
6. **Bilingual emails** — helper + apply to all customer emails + delivered email.
7. **Admin date filters** + **customer date filters**.
8. **i18n sweep** (sv/en/fa) + full gate + build.

## 12. Risks / open business inputs

- **Concurrent session** edits the same files — rebase often; this migration is
  additive so it should merge cleanly.
- **Seller details for the kvitto** (real name, address, and org/VAT number when
  registered) — business input; until then the receipt shows the placeholder
  seller and the "not a VAT invoice" note.
- **Numbering**: global sequence (gaps possible on rollback) — acceptable for
  non-VAT receipts; revisit if VAT registration later requires a gap-free series.
- **Two flows**: confirm kit orders should also be marked `delivered` by the
  owner after handover (assumed yes).
