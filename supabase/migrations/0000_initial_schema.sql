-- ╭─────────────────────────────────────────────────────────────╮
-- │ yournextbg — initial schema                                  │
-- │ Run via Supabase dashboard SQL editor OR `supabase db push`. │
-- ╰─────────────────────────────────────────────────────────────╯

-- Extensions ----------------------------------------------------------
create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- ─── Enums ──────────────────────────────────────────────────────────
do $$ begin
  create type collection_kind as enum ('owned', 'wishlist', 'played', 'custom');
exception
  when duplicate_object then null;
end $$;

-- ─── games ──────────────────────────────────────────────────────────
-- The canonical game catalog. Score vector is stored as jsonb (array of 12).
create table if not exists public.games (
  id              text primary key,
  slug            text not null unique,
  name            text not null,
  category        text not null,
  category_label  text not null,
  bgg_id          integer unique,
  scores          jsonb not null,                 -- ScoreVector = [n,n,...] length 12
  solo            integer not null check (solo between 0 and 10),
  fiddly          integer not null check (fiddly between 0 and 10),
  player_count    jsonb,                          -- { best, good, bad }
  signature       text,
  description     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists games_category_idx on public.games (category);
create index if not exists games_bgg_id_idx   on public.games (bgg_id);

comment on column public.games.scores is
  'Length-12 jsonb array, axis order: vekt,dybde,density,inter,konflikt,forhandl,input,output,innhente,tema,motor,narrativ';

-- ─── collections ────────────────────────────────────────────────────
-- A user can have multiple named lists. Default kinds: owned, wishlist, played.
create table if not exists public.collections (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  kind        collection_kind not null default 'custom',
  created_at  timestamptz not null default now(),
  unique (user_id, name)
);

create index if not exists collections_user_id_idx on public.collections (user_id);

-- ─── collection_items ───────────────────────────────────────────────
-- A game in a user's collection. Three possible references:
--   game_id      → game in our scored catalog
--   bgg_id       → game on BGG but not yet scored
--   manual_name  → game not on BGG at all
create table if not exists public.collection_items (
  id              uuid primary key default gen_random_uuid(),
  collection_id   uuid not null references public.collections(id) on delete cascade,
  game_id         text references public.games(id) on delete set null,
  bgg_id          integer,
  manual_name     text,
  notes           text,
  user_rating     integer check (user_rating is null or user_rating between 1 and 10),
  added_at        timestamptz not null default now(),
  check (
    game_id is not null
    or bgg_id is not null
    or manual_name is not null
  )
);

create index if not exists ci_collection_id_idx on public.collection_items (collection_id);
create index if not exists ci_game_id_idx       on public.collection_items (game_id);

-- ─── bgg_cache ──────────────────────────────────────────────────────
-- Local cache of BGG XML API responses to respect rate limits.
create table if not exists public.bgg_cache (
  bgg_id      integer primary key,
  payload     jsonb not null,
  fetched_at  timestamptz not null default now()
);

-- ─── updated_at trigger for games ───────────────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists games_updated_at on public.games;
create trigger games_updated_at
  before update on public.games
  for each row execute function public.set_updated_at();

-- ─── Row Level Security ─────────────────────────────────────────────
-- games: public read, no public write (admin/service role only)
alter table public.games enable row level security;

drop policy if exists games_public_read on public.games;
create policy games_public_read on public.games
  for select using (true);

-- collections: user can CRUD their own
alter table public.collections enable row level security;

drop policy if exists collections_user_read on public.collections;
create policy collections_user_read on public.collections
  for select using (auth.uid() = user_id);

drop policy if exists collections_user_insert on public.collections;
create policy collections_user_insert on public.collections
  for insert with check (auth.uid() = user_id);

drop policy if exists collections_user_update on public.collections;
create policy collections_user_update on public.collections
  for update using (auth.uid() = user_id);

drop policy if exists collections_user_delete on public.collections;
create policy collections_user_delete on public.collections
  for delete using (auth.uid() = user_id);

-- collection_items: user can CRUD items in their own collections
alter table public.collection_items enable row level security;

drop policy if exists ci_user_read on public.collection_items;
create policy ci_user_read on public.collection_items
  for select using (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

drop policy if exists ci_user_insert on public.collection_items;
create policy ci_user_insert on public.collection_items
  for insert with check (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

drop policy if exists ci_user_update on public.collection_items;
create policy ci_user_update on public.collection_items
  for update using (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

drop policy if exists ci_user_delete on public.collection_items;
create policy ci_user_delete on public.collection_items
  for delete using (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

-- bgg_cache: public read, server-role write only (RLS denies non-service writes by default)
alter table public.bgg_cache enable row level security;

drop policy if exists bgg_cache_public_read on public.bgg_cache;
create policy bgg_cache_public_read on public.bgg_cache
  for select using (true);
