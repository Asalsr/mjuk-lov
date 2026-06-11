-- Mjuk Lov — Phase 3 (M13): personalized offers & discount codes.
-- Codes are minted and redeemed ONLY server-side (service-role). Users may read
-- the personal codes assigned to them, so the "Your offers" surface can list
-- them — but never the public codes, so unadvertised promos don't leak.
-- Run in the Supabase SQL editor. Idempotent (safe to re-run).

create table if not exists public.discount_codes (
  code            text        primary key,
  kind            text        not null check (kind in ('percent','fixed')),
  value           integer     not null check (value > 0),   -- percent 1..100, or öre for 'fixed'
  product_id      text,                                     -- null = any product
  user_id         uuid        references auth.users (id) on delete cascade, -- null = public code
  reason          text,                                     -- shown to the user ("you've baked a lot lately")
  active          boolean     not null default true,
  expires_at      timestamptz,
  max_redemptions integer,                                  -- null = unlimited
  times_redeemed  integer     not null default 0,
  created_at      timestamptz not null default now()
);
create index if not exists discount_codes_user_idx on public.discount_codes (user_id) where user_id is not null;
alter table public.discount_codes enable row level security;

-- Users can read ONLY their own personal, active codes (for the offers surface).
drop policy if exists "discount_select_own" on public.discount_codes;
create policy "discount_select_own" on public.discount_codes
  for select to authenticated using ((select auth.uid()) = user_id);
-- No insert/update/delete policies on purpose: minting and redeeming happen via
-- the service-role key (server-only), which bypasses RLS. Users can't create or
-- alter codes, or redeem one more times than allowed.

-- Record which code was applied to an order, and the pre-discount amount.
alter table public.orders add column if not exists discount_code   text;
alter table public.orders add column if not exists original_amount integer;
