-- Mjuk Lov — Phase 2: richer profile + wishlist.
-- Run in the Supabase SQL editor (after the first migration).

-- Profile gets name + address.
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists address   text;

-- Wishlist: recipes to try later (separate from favorites/"likes").
create table if not exists public.wishlist (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  slug       text        not null,
  created_at timestamptz not null default now(),
  primary key (user_id, slug)
);
alter table public.wishlist enable row level security;

create policy "wishlist_select_own" on public.wishlist
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "wishlist_insert_own" on public.wishlist
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "wishlist_delete_own" on public.wishlist
  for delete to authenticated using ((select auth.uid()) = user_id);
