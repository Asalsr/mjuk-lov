-- Mjuk Lov — account cart sync (Layer B).
-- A logged-in customer's cart follows them across browsers/devices. Guests stay
-- local-only (the client never calls this table when signed out).
-- Idempotent + owner-scoped, matching the rest of supabase/migrations/.

create table if not exists public.carts (
  user_id    uuid        primary key references auth.users (id) on delete cascade,
  items      jsonb       not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.carts enable row level security;

-- Owner-only: a user can read and write only their own cart row.
drop policy if exists "carts_select_own" on public.carts;
create policy "carts_select_own" on public.carts
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "carts_insert_own" on public.carts;
create policy "carts_insert_own" on public.carts
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "carts_update_own" on public.carts;
create policy "carts_update_own" on public.carts
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "carts_delete_own" on public.carts;
create policy "carts_delete_own" on public.carts
  for delete to authenticated using ((select auth.uid()) = user_id);
