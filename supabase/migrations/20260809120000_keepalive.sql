-- Keep-alive RPC
-- Free-tier Supabase projects auto-pause after 7 days with no database
-- activity. The scheduled workflow in .github/workflows/keepalive.yml calls
-- this trivial function on a daily cadence so the project always registers
-- recent activity and is never paused for inactivity.
--
-- The function is read-only (returns the current timestamp), touches no user
-- data, and is safe to expose to the anon role. Idempotent per §6 of the
-- house rules.

create or replace function public.keepalive()
returns timestamptz
language sql
stable
as $$
  select now();
$$;

-- Only the ping needs execute; lock it down then grant explicitly.
revoke all on function public.keepalive() from public;
grant execute on function public.keepalive() to anon, authenticated;

comment on function public.keepalive() is
  'No-op health ping called by the scheduled keep-alive workflow to prevent free-tier auto-pause.';
