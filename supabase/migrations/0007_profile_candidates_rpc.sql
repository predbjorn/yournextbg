-- profile_candidates: weighted-centroid recommender for the authenticated user.
-- Owned-exclusion, dismissal-exclusion, rating join all use auth.uid() directly
-- (security invoker default). Anon callers get an empty result — they have no
-- taste profile to build a centroid from.
--
-- A previous version of this function took `for_user uuid` as the first param.
-- Under security invoker + RLS, that arg was inert for any caller that wasn't
-- exactly the user being queried (same issue as similar_games). Dropped to
-- match reality.
create or replace function public.profile_candidates(
  k int default 50
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
  centroid_distance float8,
  /* For "anchored on ★5 Brass…" reasoning: nearest top-rated anchor */
  nearest_anchor_id text,
  nearest_anchor_name text,
  nearest_anchor_rating int
) language plpgsql stable as $$
declare
  centroid vector(12);
  uid uuid := auth.uid();
begin
  -- Anon callers (no auth.uid()) get nothing — no taste profile to build on.
  if uid is null then return; end if;

  -- Build weighted centroid: weight = rating - 3 (so 5→+2, 4→+1, 3→0, 2→-1, 1→-2).
  -- 3-rated games contribute nothing. Negative ratings subtract.
  with weighted as (
    select g.axes_vec, (ci.user_rating - 3)::float8 as w
    from public.collection_items ci
    join public.collections c on c.id = ci.collection_id
    join public.games g on g.id = ci.game_id
    where c.user_id = uid
      and ci.user_rating is not null
      and ci.user_rating <> 3
      and g.axes_vec is not null    -- can't centroid a null vector
  ),
  sum_w as (
    select
      sum(w * (axes_vec[1])) as x1, sum(w * (axes_vec[2])) as x2,
      sum(w * (axes_vec[3])) as x3, sum(w * (axes_vec[4])) as x4,
      sum(w * (axes_vec[5])) as x5, sum(w * (axes_vec[6])) as x6,
      sum(w * (axes_vec[7])) as x7, sum(w * (axes_vec[8])) as x8,
      sum(w * (axes_vec[9])) as x9, sum(w * (axes_vec[10])) as x10,
      sum(w * (axes_vec[11])) as x11, sum(w * (axes_vec[12])) as x12,
      sum(abs(w)) as wsum
    from weighted
  )
  select
    array[
      coalesce(x1/nullif(wsum,0), 5),  -- fall back to midpoint if no signal
      coalesce(x2/nullif(wsum,0), 5),
      coalesce(x3/nullif(wsum,0), 5),
      coalesce(x4/nullif(wsum,0), 5),
      coalesce(x5/nullif(wsum,0), 5),
      coalesce(x6/nullif(wsum,0), 5),
      coalesce(x7/nullif(wsum,0), 5),
      coalesce(x8/nullif(wsum,0), 5),
      coalesce(x9/nullif(wsum,0), 5),
      coalesce(x10/nullif(wsum,0), 5),
      coalesce(x11/nullif(wsum,0), 5),
      coalesce(x12/nullif(wsum,0), 5)
    ]::vector(12)
  into centroid
  from sum_w;

  return query
  with owned_or_dismissed as (
    select ci.game_id from public.collection_items ci
    join public.collections c on c.id = ci.collection_id
    where c.user_id = uid and c.kind = 'owned' and ci.game_id is not null
    union
    select d.game_id from public.dismissals d where d.user_id = uid
  ),
  candidates as (
    select g.*, (g.axes_vec <-> centroid)::float8 as d
    from public.games g
    where g.axes_vec is not null    -- exclude unscored BGG-imported placeholders
      and g.id not in (select game_id from owned_or_dismissed where game_id is not null)
    order by g.axes_vec <-> centroid
    limit greatest(1, least(k, 200))
  ),
  anchors as (
    -- For each candidate, find the user's nearest top-rated (≥4) game.
    -- The lateral subquery projects id/name/axes_vec/user_rating directly so
    -- we don't have to re-join collection_items + collections afterwards.
    select
      cand.id as cand_id,
      anc.aid as anchor_id,
      anc.aname as anchor_name,
      anc.arating as anchor_rating,
      row_number() over (
        partition by cand.id
        order by anc.av <-> cand.axes_vec
      ) as rn
    from candidates cand
    cross join lateral (
      select
        g.id as aid,
        g.name as aname,
        g.axes_vec as av,
        ci.user_rating as arating
      from public.games g
      join public.collection_items ci on ci.game_id = g.id
      join public.collections c on c.id = ci.collection_id
      where c.user_id = uid
        and ci.user_rating >= 4
        and g.axes_vec is not null
    ) anc
  )
  select
    cand.id, cand.slug, cand.name, cand.bgg_id, cand.scores,
    cand.solo, cand.fiddly, cand.player_count, cand.signature,
    cand.cover_status, cand.d,
    a.anchor_id, a.anchor_name, a.anchor_rating
  from candidates cand
  left join anchors a on a.cand_id = cand.id and a.rn = 1
  order by cand.d;
end;
$$;

-- Drop any previously-installed 2-arg signature.
drop function if exists public.profile_candidates(uuid, int);

grant execute on function public.profile_candidates(int) to authenticated;
