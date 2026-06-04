-- Mjuk Lov — "request to order" (no payment). Extends public.orders.
-- Run in the Supabase SQL editor.

alter table public.orders add column if not exists items          jsonb default '[]'::jsonb;
alter table public.orders add column if not exists contact_name   text;
alter table public.orders add column if not exists contact_email  text;
alter table public.orders add column if not exists contact_phone  text;
alter table public.orders add column if not exists desired_date   date;
alter table public.orders add column if not exists fulfilment     text;   -- 'pickup' | 'delivery'
alter table public.orders add column if not exists address        text;
alter table public.orders add column if not exists dietary        text;
alter table public.orders add column if not exists notes          text;

-- Request orders don't use the single-product/amount columns; make them optional.
alter table public.orders alter column product_id   drop not null;
alter table public.orders alter column product_name drop not null;
alter table public.orders alter column amount       drop not null;

-- status default already 'pending'; request flow sets 'requested'.
