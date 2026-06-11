-- Mjuk Lov — M15: human-readable order numbers + delivered status.
-- Adds order_number (ML-YYYY-NNNN, assigned at insert), delivered_at, backfills
-- existing rows, and migrates the legacy terminal status 'done' → 'delivered'.
-- Run in the Supabase SQL editor. Idempotent (safe to re-run).

-- 1) Sequence backing the human-readable number (global; no yearly reset —
--    simplest and concurrency-safe across the order-request, checkout, and
--    service-role insert paths).
create sequence if not exists public.order_number_seq;

-- 2) New columns.
alter table public.orders add column if not exists order_number text;
alter table public.orders add column if not exists delivered_at  timestamptz;

-- 3) Assign ML-YYYY-NNNN on insert when not already set.
create or replace function public.set_order_number()
returns trigger
language plpgsql
as $$
begin
  if new.order_number is null then
    new.order_number := 'ML-' || to_char(now(), 'YYYY') || '-'
      || lpad(nextval('public.order_number_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists orders_set_order_number on public.orders;
create trigger orders_set_order_number
  before insert on public.orders
  for each row execute function public.set_order_number();

-- 4) Backfill existing rows in creation order; use each row's own year.
do $$
declare r record;
begin
  for r in
    select id, created_at from public.orders
    where order_number is null
    order by created_at asc
  loop
    update public.orders
      set order_number = 'ML-' || to_char(r.created_at, 'YYYY') || '-'
        || lpad(nextval('public.order_number_seq')::text, 4, '0')
      where id = r.id;
  end loop;
end $$;

-- 5) Enforce uniqueness once values exist.
create unique index if not exists orders_order_number_idx
  on public.orders (order_number);

-- 6) Migrate the legacy terminal status 'done' → 'delivered'.
update public.orders
  set status = 'delivered',
      delivered_at = coalesce(delivered_at, created_at)
  where status = 'done';
