# Mjuk Lov — "Request to Order" Plan (no payment)

> A real shop *experience* — browse, add to cart, review — that ends in a
> **direct order request to the owner** instead of online payment. Right for the
> pre-payment stage: you confirm availability, lead time and price by hand, the
> way small artisan bakeries actually take custom orders.
> Companion to `RECIPE-APP-PLAN.md`. Created 2026-06-04.

---

## 1. Concept

Customer: **browse kits → add to cart (with options) → review order → fill a short
request form → submit.** No checkout/payment. On submit:
- the request is **saved** (Supabase),
- **you get a direct email** with all the details,
- the **customer gets a confirmation** ("We'll get back to you within 24h"),
- logged-in customers see it under **My page → Orders**.

The Stripe checkout we already built is **parked** (kept in the codebase) for when
you're ready to take real payments — flipping it on later is a small change.

## 2. Why this model (research-backed)

Artisan/custom food orders need a human touch — availability, lead time, delivery,
personalisation and price often can't be fixed at "add to cart". Bakeries widely
use **request/enquiry forms** with manual confirmation. Best practices we'll follow:
- **Guest-friendly, minimal required fields** — no forced sign-up; ask only what's needed.
- **Set expectations** on the form ("we confirm within 24h", lead-time note) to cut no-shows.
- **Conditional fields** — short by default; show address only for delivery, etc.
- **Pickup vs delivery + desired date**, dietary/allergy needs, message, optional photo.

## 3. The flow (user-friendly & simple)

```
Shop (/butik)            Cart (/varukorg)           Request form              Done
 ─ kit cards              ─ items + qty edit          ─ contact (prefilled      ─ confirmation
 ─ "Add to cart"          ─ remove                      if logged in)             "we'll reply
 ─ per item: flavour,     ─ running summary           ─ desired date              within 24h"
   servings note,         ─ "Request order" CTA       ─ pickup | delivery        ─ also emailed
   message                                              (+address if delivery)   ─ saved to
                                                       ─ dietary/allergy            My page
                                                       ─ notes + optional photo
                                                       ─ submit (no payment)
```

**Friendliness principles**
- **No login required** to send a request (lowest friction). Logged-in users get
  their name/email/diet **pre-filled** from their profile, and the order saved to their account.
- **Minimal required fields:** name, email *or* phone, ≥1 item, desired date. Everything else optional.
- **Lead-time hint** near the date picker (e.g. "Please allow at least 3–5 days").
- **Mobile-first**, matches the brand (cream/terracotta, editorial type), like the rest of the site.
- **Cart persists** on the device (localStorage) so it survives navigation/reload.

## 4. Data model

**Cart** — device-local only (a small `lib/cart` store, same pattern as `lib/userdata`),
never hits the server until the request is submitted.

```ts
type CartItem = { productId: string; qty: number; options?: { flavour?: string; message?: string } };
```

**Order request** — reuse/extend the `orders` table into a request header + items JSONB:

```sql
-- additions to public.orders (or a new public.order_requests table)
items            jsonb   not null,         -- [{productId, name, qty, options}]
contact_name     text    not null,
contact_email    text,
contact_phone    text,
desired_date     date,
fulfilment       text,                     -- 'pickup' | 'delivery'
address          text,                     -- only when delivery
dietary          text,
notes            text,
photo_url        text,                     -- optional (Supabase Storage)
status           text default 'requested', -- requested | confirmed | declined | done
-- amount/currency become optional/estimate; no payment fields needed yet
```

Submission goes through a **server route** using the service-role client, so
**guests and logged-in users** can both submit (no RLS loosening). If logged in,
`user_id` is attached so it shows on My page.

## 5. Components & routes

```
lib/cart/store.ts                      # device-local cart (add/remove/qty/clear), useCart() hook
app/[lang]/butik/                      # shop — "Add to cart" instead of "Buy"
app/components/shop/AddToCartButton.tsx
app/components/shop/CartBadge.tsx       # item count in header
app/[lang]/varukorg/page.tsx           # cart + request form (or split cart → /kassa)
app/components/shop/OrderRequestForm.tsx
app/api/order-request/route.ts         # validate → insert (admin) → email owner + customer
app/[lang]/min-sida/                    # add an "Orders" section (status of requests)
```

## 6. How you receive the request

Options (pick one — see §8):
- **A. Email via Resend (recommended):** a serverless call sends you a formatted
  order email + the customer a confirmation. Free tier covers low volume. One API key.
- **B. Store-only + dashboard:** no email; you check requests in My page/an admin view.
  Simplest, but you must remember to look.
- **C. Both:** store + email (A). Recommended end state.

All options **store** the request in Supabase regardless, so nothing is lost.

## 7. What changes vs. what we keep

- **Change:** `/butik` Buy button → **Add to cart**; new cart + request form; the
  checkout route is replaced by `order-request` (no Stripe call).
- **Keep (parked for later):** `lib/products.ts`, the orders table, and the Stripe
  `checkout`/`webhook` routes + `stripe` dep — ready to switch on for real payments.

## 8. Decisions (confirmed 2026-06-04)

1. **Notify:** ✅ **Email + saved.** Email you a formatted request + send the customer a
   confirmation, and store in Supabase. Use **Resend** (free tier) → needs `RESEND_API_KEY`
   + a verified from-address (use Resend's onboarding domain for testing, your domain for prod)
   + `OWNER_EMAIL` (where requests go, e.g. saeedeh.sarmadi@sisp.se).
2. **Login:** ✅ **Guest allowed** — submit via a server route (service-role insert); attach
   `user_id` when logged in; prefill from profile when available.
3. **Fulfilment:** ✅ **Pickup + delivery** — radio choice; address field shows only for delivery.
4. **Photo upload:** ✅ **Skip for v1** — add inspiration-photo upload later.

## 9. Milestones

| M | Step | Done when |
|---|---|---|
| 1 | Cart store + Add-to-cart + header badge | items persist; badge updates |
| 2 | Cart page + edit/remove + summary | review works on mobile |
| 3 | Request form (conditional fields, prefill, validation) | submits a complete request |
| 4 | `api/order-request` + DB save + email (per §8) | you receive the request; customer sees confirmation |
| 5 | My page → Orders (status list) | logged-in users see their requests |
| 6 | Polish (lead-time hints, empty states, brand styling) | feels like the rest of the site |

## 10. Future

Flip on **real payment** (Stripe already built) when ready: the request becomes a
quote → pay link, or "Add to cart → pay now". The cart/data model already supports it.
