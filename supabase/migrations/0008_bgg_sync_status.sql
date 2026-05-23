-- 0008_bgg_sync_status.sql
-- score_status tracks whether a game has editorial scores or is a placeholder
-- inserted by BGG sync that hasn't been scored yet.
alter table public.games
  add column if not exists score_status text not null default 'editorial'
    check (score_status in ('editorial', 'unscored'));

-- Existing rows seeded from src/data/games.ts are all editorial. Defensive:
update public.games set score_status = 'editorial' where score_status is null;

-- Make scores nullable so BGG placeholders can be inserted without inventing
-- a fake 12-axis vector. Rebuild axes_vec with a null-safe expression so
-- unscored rows have a NULL vector (IVFFlat skips NULL — they're excluded
-- from `order by axes_vec <-> anchor` queries automatically).
alter table public.games alter column scores drop not null;

drop index if exists games_axes_vec_l2_idx;
alter table public.games drop column if exists axes_vec;
alter table public.games
  add column axes_vec vector(12)
    generated always as (
      case
        when scores is null then null
        else array[
          (scores ->> 0)::float8,
          (scores ->> 1)::float8,
          (scores ->> 2)::float8,
          (scores ->> 3)::float8,
          (scores ->> 4)::float8,
          (scores ->> 5)::float8,
          (scores ->> 6)::float8,
          (scores ->> 7)::float8,
          (scores ->> 8)::float8,
          (scores ->> 9)::float8,
          (scores ->> 10)::float8,
          (scores ->> 11)::float8
        ]::vector(12)
      end
    ) stored;

create index games_axes_vec_l2_idx
  on public.games using ivfflat (axes_vec vector_l2_ops)
  with (lists = 16);

-- Track how each collection_item was added: 'manual' (user added in the UI) or
-- 'bgg' (imported from a BGG collection sync). Used by the UI to show a badge
-- and by future sync logic to decide whether to overwrite user-set fields.
alter table public.collection_items
  add column if not exists source text not null default 'manual'
    check (source in ('manual', 'bgg'));

-- Re-syncs need an idempotent target for the bgg-sync edge function.
-- Partial index because collection_items.game_id is nullable (manual-add games
-- use bgg_id or manual_name instead).
create unique index if not exists collection_items_collection_game_idx
  on public.collection_items (collection_id, game_id)
  where game_id is not null;

-- Per-sync audit row so we can debug 202s, partial failures, and pg_cron runs.
create table if not exists public.bgg_sync_log (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  triggered_by  text not null check (triggered_by in ('manual','cron')),
  started_at    timestamptz not null default now(),
  finished_at   timestamptz,
  owned_count   integer,
  wishlist_count integer,
  new_unscored  integer,
  status        text not null default 'running'
    check (status in ('running','ok','partial','failed')),
  error         text
);
create index if not exists bgg_sync_log_user_idx on public.bgg_sync_log (user_id, started_at desc);

alter table public.bgg_sync_log enable row level security;
drop policy if exists bgg_sync_log_self_read on public.bgg_sync_log;
create policy bgg_sync_log_self_read on public.bgg_sync_log
  for select using (auth.uid() = user_id);

-- Auto-sync preference + BGG username on user_prefs.
alter table public.user_prefs
  add column if not exists bgg_username text,
  add column if not exists auto_sync_bgg boolean not null default false,
  add column if not exists import_bgg_ratings boolean not null default true,
  add column if not exists last_bgg_sync_at timestamptz;
