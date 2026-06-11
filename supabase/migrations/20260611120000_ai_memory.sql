-- Mjuk Lov — Phase 3 (M10): server-side AI memory + consent records.
-- Durable, cross-device assistant memory for logged-in users who opt in.
-- Run in the Supabase SQL editor. Idempotent (safe to re-run).

-- ── Consent records (also reused by M11) ─────────────────────────────────────
-- Art. 9 health-data + Art. 7 demonstrable consent. kind ∈ ai_memory|ai_health|marketing.
create table if not exists public.consents (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  kind       text        not null,
  granted    boolean     not null default false,
  version    text        not null default 'v1',
  updated_at timestamptz not null default now(),
  primary key (user_id, kind)
);
alter table public.consents enable row level security;

drop policy if exists "consents_select_own" on public.consents;
create policy "consents_select_own" on public.consents
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "consents_insert_own" on public.consents;
create policy "consents_insert_own" on public.consents
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "consents_update_own" on public.consents;
create policy "consents_update_own" on public.consents
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "consents_delete_own" on public.consents;
create policy "consents_delete_own" on public.consents
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ── Conversation transcript ──────────────────────────────────────────────────
create table if not exists public.ai_messages (
  id         bigint generated always as identity primary key,
  user_id    uuid        not null references auth.users (id) on delete cascade,
  role       text        not null check (role in ('user','assistant')),
  content    text        not null,
  created_at timestamptz not null default now()
);
create index if not exists ai_messages_user_time on public.ai_messages (user_id, created_at);
alter table public.ai_messages enable row level security;

drop policy if exists "ai_messages_select_own" on public.ai_messages;
create policy "ai_messages_select_own" on public.ai_messages
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "ai_messages_insert_own" on public.ai_messages;
create policy "ai_messages_insert_own" on public.ai_messages
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "ai_messages_delete_own" on public.ai_messages;
create policy "ai_messages_delete_own" on public.ai_messages
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ── Rolling distilled memory (caps context size / token cost) ────────────────
create table if not exists public.ai_summary (
  user_id    uuid        primary key references auth.users (id) on delete cascade,
  summary    text        not null default '',
  updated_at timestamptz not null default now()
);
alter table public.ai_summary enable row level security;

drop policy if exists "ai_summary_select_own" on public.ai_summary;
create policy "ai_summary_select_own" on public.ai_summary
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "ai_summary_insert_own" on public.ai_summary;
create policy "ai_summary_insert_own" on public.ai_summary
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "ai_summary_update_own" on public.ai_summary;
create policy "ai_summary_update_own" on public.ai_summary
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
