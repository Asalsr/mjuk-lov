# Production setup — step by step

Set up every service and connect it to the Vercel deployment. Replace
`YOUR_ADMIN_EMAIL` with the real email you'll log in with as the owner
(use the **same** email in all three places it appears).

---

## 1. Supabase (database + auth)

1. **Run the migrations.** Supabase → **SQL Editor** → run each file from
   `supabase/migrations/` in order (paste & Run):
   - `..._init_user_data.sql` (profiles, favorites, notes, cooking_history + RLS)
   - `..._profile_and_wishlist.sql` (name/address + wishlist)
   - `..._orders.sql` (orders table)
   - `..._order_requests.sql` (request fields on orders)
   - `..._owner_orders.sql` (owner can manage all orders) — **edit the email first** (see step 3)
2. **Auth → Providers → Email:** keep **"Confirm email" ON**.
3. **Owner policy email.** In the owner migration (or run directly), set your admin email:
   ```sql
   drop policy if exists "orders_owner_select" on public.orders;
   create policy "orders_owner_select" on public.orders for select to authenticated
     using ( (auth.jwt() ->> 'email') = 'YOUR_ADMIN_EMAIL' );
   drop policy if exists "orders_owner_update" on public.orders;
   create policy "orders_owner_update" on public.orders for update to authenticated
     using ( (auth.jwt() ->> 'email') = 'YOUR_ADMIN_EMAIL' )
     with check ( (auth.jwt() ->> 'email') = 'YOUR_ADMIN_EMAIL' );
   ```
4. **Auth → URL Configuration:**
   - **Site URL:** `https://YOUR-PROD-DOMAIN`
   - **Redirect URLs:** `https://YOUR-PROD-DOMAIN/**` (add `http://localhost:3000/**` for local,
     and `https://*.vercel.app/**` to cover preview deploys)
5. **Settings → API** — copy for Vercel:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Publishable / anon key → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - **service_role / secret key → `SUPABASE_SERVICE_ROLE_KEY`** (server-only, never public)

## 2. OpenAI (AI assistant + recipe adapter + allergen labels)
- platform.openai.com → API keys → create → `OPENAI_API_KEY`.

## 3. Optional services
- **Resend** (emails: order requests → your inbox, and confirm/decline → the customer).
  Needs a **verified sender** or order emails won't arrive — see **§3b** below for the full setup.
- **Google Maps** (delivery address autocomplete): Google Cloud → enable
  **Places API (New)** + **billing** → API key → `GOOGLE_MAPS_SERVER_KEY` (server-side proxy
  at `/api/places/*`, so the key never reaches the browser). Restrict the key by **API**
  (Places API New); leave **application restriction = None** (server calls have no referrer).
- **Stripe** (real payments — currently parked; the live flow is request-to-order):
  `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `APP_URL`. Skip unless enabling payments.

## 3b. Resend email delivery (so order emails actually arrive)

**Why it fails by default:** if `RESEND_FROM` is unset, the app sends from
`onboarding@resend.dev`. Resend's shared test sender **only delivers to your own
Resend account email** — so customer emails and your `mjuklov.se@gmail.com` inbox
get nothing. Fix = verify your own domain and send from it.

**Recommended — verify the `mjuklov.se` domain (send to anyone):**
1. Resend → **Domains** → **Add Domain** → enter `mjuklov.se`.
2. Resend shows ~3 DNS records (a **TXT** for verification, **DKIM** TXT/CNAME, and a
   **MX**/return-path on a `send.` subdomain). Copy them.
3. Go to wherever `mjuklov.se` DNS is managed (your domain registrar's DNS panel)
   and add each record **exactly** (host/name + value). Save.
4. Back in Resend → **Verify**. Propagation is usually minutes, up to a few hours.
5. Once it shows **Verified**, set in Vercel (Production + Preview):
   - `RESEND_FROM = Mjuk Lov <orders@mjuklov.se>`  *(any address @ the verified domain)*
   - `RESEND_API_KEY = ` your Resend API key
   - `CONTACT_EMAIL = mjuklov.se@gmail.com`  *(where order + contact emails land)*
6. **Redeploy** (env changes need a redeploy).

**Quick test without a domain (temporary):** leave `RESEND_FROM` unset and set
`CONTACT_EMAIL` to the **exact email you signed up to Resend with**. Order emails
will then reach *that* address only (not customers). Good for a smoke test; switch
to the verified domain for real use.

**Verify it works:** place a test order request → check `mjuklov.se@gmail.com`
(and spam) → and Resend → **Logs** shows the send with status `delivered`. If a send
fails, the reason is now logged in **Vercel → your project → Logs** (the routes no
longer swallow errors).

## 4. Vercel (deploy)
1. **Project → Settings → Git:** Production Branch = **`master`**.
2. **Project → Settings → Environment Variables** (scope: **Production** and **Preview**):
   | Variable | From |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase (secret) |
   | `OPENAI_API_KEY` | OpenAI |
   | `OWNER_EMAIL` | YOUR_ADMIN_EMAIL (the account you log in to `/admin` with) |
   | `RESEND_API_KEY` *(opt)* | Resend |
   | `RESEND_FROM` *(opt)* | `Mjuk Lov <orders@mjuklov.se>` — a verified sender (see §3b) |
   | `CONTACT_EMAIL` *(opt)* | `mjuklov.se@gmail.com` — inbox for order + contact emails |
   | `GOOGLE_MAPS_SERVER_KEY` *(opt)* | Google (server-only; Places API New) |
   | `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` *(opt)* | Stripe |
   > `NEXT_PUBLIC_*` are baked in at build time — after adding/changing them, **Redeploy**.
3. **Redeploy** (Deployments → ⋯ → Redeploy) so the new env vars take effect.
4. *(Optional)* **Settings → Domains:** add `mjuklov.se` and set Supabase Site URL to it.

## 5. Create the admin account
1. On the live site → `/sv/logga-in` → **Skapa konto** → `YOUR_ADMIN_EMAIL` + a password.
2. Click the **confirmation email** (works once step 1.4 is configured).
3. Log in → **My page** shows **"Hantera beställningar"** → `/admin`.

## 6. Verify
- Recipes load · save/wishlist/made persist to the account
- AI "Gör vegansk/vegetarisk" returns swaps (needs `OPENAI_API_KEY`)
- Place an order request → appears in `/admin` (and emails you if Resend set)
- Reset-password link lands on `/aterstall`
