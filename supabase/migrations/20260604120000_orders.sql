-- Mjuk Lov — Phase 2 commerce: DIY cake kit orders.
-- Run in the Supabase SQL editor.

create table if not exists public.orders (
  id                      uuid        primary key default gen_random_uuid(),
  user_id                 uuid        references auth.users (id) on delete set null,
  product_id              text        not null,
  product_name            text        not null,
  amount                  integer     not null,            -- in öre (SEK cents)
  currency                text        not null default 'sek',
  status                      text        not null default 'pending', -- pending | paid
  stripe_checkout_session_id  text,
  stripe_payment_intent       text,
  created_at              timestamptz not null default now()
);
alter table public.orders enable row level security;

-- Buyers can see and create their own orders.
drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own" on public.orders
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- NOTE: no UPDATE policy on purpose — the Stripe webhook marks orders paid using
-- the service-role key (server-only), which bypasses RLS. Users can't flip status.
