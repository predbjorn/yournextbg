-- Returns the K nearest neighbors to a single anchor game under L2 distance
-- on the unweighted vector. The client re-applies lens weights in JS/Swift/Kotlin.
-- We return raw axes so the client has everything it needs for the radar overlay.
--
-- Owned-game exclusion uses auth.uid() directly (security invoker default).
-- - Authenticated callers: their owned games are excluded automatically.
-- - Anon callers (public Lens page): no exclusion, which is correct since
--   anon has no shelf.
-- - A previous version of this function took an `exclude_owned_for uuid` arg.
--   That was inert under RLS for both anon (no auth.uid) and cross-user
--   authenticated callers (RLS blocks the join). Dropped to match reality.
create or replace function public.similar_games(
  anchor_id text,
  k         int default 50
)
returns table (
  id          text,
  slug        text,
  name        text,
  bgg_id      integer,
  scores      jsonb,
  solo        integer,
  fiddly      integer,
  player_count jsonb,
  signature   text,
  cover_status text,
  l2_distance float8
) language sql stable as $$
  with anchor as (
    select axes_vec from public.games where id = anchor_id
  ),
  excluded_ids as (
    -- Empty when caller is anon (auth.uid() is null) — no rows to exclude.
    select ci.game_id
    from public.collection_items ci
    join public.collections c on c.id = ci.collection_id
    where auth.uid() is not null
      and c.user_id = auth.uid()
      and c.kind = 'owned'
      and ci.game_id is not null
  )
  select
    g.id, g.slug, g.name, g.bgg_id, g.scores, g.solo, g.fiddly,
    g.player_count, g.signature, g.cover_status,
    (g.axes_vec <-> (select axes_vec from anchor))::float8 as l2_distance
  from public.games g
  where g.id <> anchor_id
    and g.axes_vec is not null    -- exclude unscored BGG-imported placeholders
    and g.id not in (select game_id from excluded_ids)
  order by g.axes_vec <-> (select axes_vec from anchor)
  limit greatest(1, least(k, 200));  -- hard cap 200
$$;

-- Drop any previously-installed 3-arg signature (defensive — only matters
-- if an earlier dev applied the now-superseded version locally).
drop function if exists public.similar_games(text, int, uuid);

-- Grant execute to the authenticated role; anon can use it too for the public Lens page.
grant execute on function public.similar_games(text, int) to anon, authenticated;
