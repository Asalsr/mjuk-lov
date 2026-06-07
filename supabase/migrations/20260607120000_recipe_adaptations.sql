-- Mjuk Lov — shared cache of AI recipe adaptations (vegan / vegetarian).
-- Run in the Supabase SQL editor.
--
-- Keyed on (slug, target, lang): an adaptation depends only on the recipe, the
-- target diet and the language — not on who is asking — so one row serves every
-- user. The server (/api/ai) reads and writes this with the service-role key;
-- the first visitor to a given recipe pays the OpenAI call, everyone after that
-- is served from here for free. `model` records which model produced `result`
-- so the server can regenerate when a better model is configured.

create table if not exists public.recipe_adaptations (
  slug       text        not null,
  target     text        not null,            -- 'vegan' | 'vegetarian'
  lang       text        not null,            -- 'sv' | 'en'
  result     jsonb       not null,            -- { summary, swaps, adaptedIngredients, allergens }
  model      text        not null,            -- model id that produced `result`
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (slug, target, lang)
);
alter table public.recipe_adaptations enable row level security;

-- The cache is not user data — anyone may read it. (Reads go through the
-- service-role client today, but a public read policy keeps it safe to expose.)
drop policy if exists "recipe_adaptations_select_all" on public.recipe_adaptations;
create policy "recipe_adaptations_select_all" on public.recipe_adaptations
  for select to anon, authenticated using (true);

-- NOTE: no insert/update/delete policies on purpose — only the server's
-- service-role key (which bypasses RLS) generates and refreshes adaptations,
-- so users can't poison the shared cache.
