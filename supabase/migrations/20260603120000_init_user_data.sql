-- Mjuk Lov — Phase 2 user data (accounts).
-- Run in the Supabase SQL editor, or via `supabase db push` once linked.
-- Mirrors the device-local UserData shape so lib/userdata can sync into it on login.
-- RLS: every table is owner-scoped (TO authenticated + auth.uid() ownership).

-- 1:1 profile per auth user --------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  diet        text[]      not null default '{}',
  allergies   text[]      not null default '{}',
  consent_ai  boolean     not null default false,
  updated_at  timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Saved recipes --------------------------------------------------------------
create table if not exists public.favorites (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  slug       text        not null,
  created_at timestamptz not null default now(),
  primary key (user_id, slug)
);
alter table public.favorites enable row level security;

create policy "favorites_select_own" on public.favorites
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "favorites_insert_own" on public.favorites
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "favorites_delete_own" on public.favorites
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Personal notes per recipe --------------------------------------------------
create table if not exists public.notes (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  slug       text        not null,
  body       text        not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, slug)
);
alter table public.notes enable row level security;

create policy "notes_select_own" on public.notes
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "notes_insert_own" on public.notes
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "notes_update_own" on public.notes
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "notes_delete_own" on public.notes
  for delete to authenticated using ((select auth.uid()) = user_id);

-- "Made it" cooking history --------------------------------------------------
create table if not exists public.cooking_history (
  id        uuid        primary key default gen_random_uuid(),
  user_id   uuid        not null references auth.users (id) on delete cascade,
  slug      text        not null,
  cooked_at timestamptz not null default now()
);
alter table public.cooking_history enable row level security;

create policy "history_select_own" on public.cooking_history
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "history_insert_own" on public.cooking_history
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "history_delete_own" on public.cooking_history
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Auto-create a profile row when a user signs up -----------------------------
-- SECURITY DEFINER is required to insert into public.profiles from the auth
-- trigger; search_path is locked to '' and all names are schema-qualified.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
