-- Keep-alive v2: register real user database activity
-- On 2026-10-03 Supabase sent a "going to be paused" warning even though the
-- daily keepalive() ping had returned HTTP 200 every day. Supabase's pause
-- heuristic counts "user queries" and expects "a few user requests to the
-- database each day"; one `select now()` a day (no table touched) did not
-- qualify. This version makes each ping a real table write and read, and the
-- workflow now pings every 6 hours.
--
-- keepalive_pings holds only timestamps (no user data), is pruned to 30 days
-- inside the function so it cannot grow without bound, and has RLS enabled
-- with no policies: anon/authenticated cannot touch it directly. The function
-- is SECURITY DEFINER so the anon ping can still write through it.
-- Idempotent per section 6 of the house rules.

create table if not exists public.keepalive_pings (
  id bigint generated always as identity primary key,
  pinged_at timestamptz not null default now()
);

alter table public.keepalive_pings enable row level security;

comment on table public.keepalive_pings is
  'Timestamps written by public.keepalive() so free-tier inactivity checks see real queries. Pruned to 30 days.';

-- Same signature and return type as v1, so create or replace is safe and the
-- workflow needs no change to the call.
create or replace function public.keepalive()
returns timestamptz
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  last_ping timestamptz;
begin
  insert into public.keepalive_pings default values
  returning pinged_at into last_ping;

  delete from public.keepalive_pings
  where pinged_at < now() - interval '30 days';

  return last_ping;
end;
$$;

revoke all on function public.keepalive() from public;
grant execute on function public.keepalive() to anon, authenticated;

comment on function public.keepalive() is
  'Health ping called by the scheduled keep-alive workflow: writes a timestamp row so the project registers user database activity and is not auto-paused.';
