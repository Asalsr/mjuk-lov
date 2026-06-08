-- Mjuk Lov — admin order management: price quote + internal note.
-- Run in the Supabase SQL editor.
--
-- quoted_price : the price (in whole SEK / kr) the owner sets when confirming a
--                request. Shown to the customer on My page. Null until confirmed.
-- admin_note   : owner-only internal note. NEVER returned to customers (the
--                customer query in min-sida does not select this column).

alter table public.orders add column if not exists quoted_price integer;
alter table public.orders add column if not exists admin_note   text;
