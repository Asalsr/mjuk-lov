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
- **Resend** (email the order requests): resend.com → API key → `RESEND_API_KEY`;
  set `OWNER_EMAIL=YOUR_ADMIN_EMAIL`. Verify a sending domain for real "from" addresses.
- **Google Maps** (delivery address autocomplete): Google Cloud → enable
  **Places API (New)** + **Maps JavaScript API** → API key → `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
  (restrict by HTTP referrer to your domain).
- **Stripe** (real payments — currently parked; the live flow is request-to-order):
  `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `APP_URL`. Skip unless enabling payments.

## 4. Vercel (deploy)
1. **Project → Settings → Git:** Production Branch = **`master`**.
2. **Project → Settings → Environment Variables** (scope: **Production** and **Preview**):
   | Variable | From |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase (secret) |
   | `OPENAI_API_KEY` | OpenAI |
   | `OWNER_EMAIL` | YOUR_ADMIN_EMAIL |
   | `RESEND_API_KEY` *(opt)* | Resend |
   | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` *(opt)* | Google |
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
