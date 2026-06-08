-- Mjuk Lov — saved delivery addresses (address book) + profile phone.
-- Run in the Supabase SQL editor (after the earlier migrations).

-- Profile gains a phone — the default receiver number (alongside full_name).
alter table public.profiles add column if not exists phone text;

-- Saved delivery addresses. Per-account, owner-scoped. A saved address may carry
-- its own receiver name/phone; when null we fall back to the profile's.
create table if not exists public.delivery_addresses (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references auth.users (id) on delete cascade,
  label          text        not null,
  street         text        not null,
  postal_code    text,
  city           text,
  receiver_name  text,
  receiver_phone text,
  is_default     boolean     not null default false,
  created_at     timestamptz not null default now()
);
alter table public.delivery_addresses enable row level security;

drop policy if exists "addr_select_own" on public.delivery_addresses;
create policy "addr_select_own" on public.delivery_addresses
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "addr_insert_own" on public.delivery_addresses;
create policy "addr_insert_own" on public.delivery_addresses
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "addr_update_own" on public.delivery_addresses;
create policy "addr_update_own" on public.delivery_addresses
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "addr_delete_own" on public.delivery_addresses;
create policy "addr_delete_own" on public.delivery_addresses
  for delete to authenticated using ((select auth.uid()) = user_id);

create index if not exists delivery_addresses_user_idx
  on public.delivery_addresses (user_id, created_at desc);
