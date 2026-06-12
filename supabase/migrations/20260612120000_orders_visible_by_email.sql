-- Mjuk Lov — M15 follow-up: let a customer see orders by their confirmed email.
-- A customer should see every order placed with their email — whether placed as
-- a guest (user_id null) or under a different login — not only orders tied to
-- the exact account row. Signup confirms the email, so "your email = your
-- orders" is safe. This adds a second SELECT policy (OR'd with orders_select_own)
-- and backfills guest orders to matching accounts.
-- Run in the Supabase SQL editor. Idempotent (safe to re-run).

-- Read any order whose contact_email matches the signed-in user's email.
drop policy if exists orders_select_by_email on public.orders;
create policy orders_select_by_email on public.orders
  for select to authenticated
  using (
    contact_email is not null
    and lower(contact_email) = lower(auth.jwt() ->> 'email')
  );

-- One-time backfill: attach existing guest orders to the matching account, so
-- they also surface via the user_id policy and future per-user queries.
update public.orders o
  set user_id = u.id
  from auth.users u
  where o.user_id is null
    and o.contact_email is not null
    and lower(o.contact_email) = lower(u.email);
