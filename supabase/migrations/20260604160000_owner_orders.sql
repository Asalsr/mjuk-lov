-- Mjuk Lov — let the owner read & manage ALL orders (single-owner shop).
-- Regular users still only see their own (orders_select_own). These add the owner.
-- email is a standard top-level JWT claim (not user_metadata), so it's safe here.
-- Change the email if your owner account differs.

drop policy if exists "orders_owner_select" on public.orders;
create policy "orders_owner_select" on public.orders
  for select to authenticated
  using ( (auth.jwt() ->> 'email') = 'saeedeh.sarmadi@sisp.se' );

drop policy if exists "orders_owner_update" on public.orders;
create policy "orders_owner_update" on public.orders
  for update to authenticated
  using ( (auth.jwt() ->> 'email') = 'saeedeh.sarmadi@sisp.se' )
  with check ( (auth.jwt() ->> 'email') = 'saeedeh.sarmadi@sisp.se' );
