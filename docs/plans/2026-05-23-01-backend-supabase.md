# Backend (Supabase) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Extend the existing Supabase project (`gkickjaihbgapowsqwhx`) so it can power the v1 web app: server-side recommender candidate selection via pgvector, Storage-backed game covers with resize-on-import, a 5-point rating scale, and a minimal edge-function surface that v2 native apps will also consume.

**Architecture:** Postgres schema additions (no destructive changes to existing tables beyond the rating-scale migration, which is safe because there are no real users). pgvector for similarity candidate-selection. Three edge functions: `similar-games` (Postgres RPC, callable from anon), `resize-cover` (covers pipeline), and `bgg-sync` (per-user BGG collection import). `pg_cron` schedules the hourly auto-sync for users with the preference enabled.

**Tech Stack:** Postgres 15, pgvector, Supabase Edge Functions (Deno), Supabase Storage, Supabase CLI for migrations.

---

## Preconditions

- `supabase` CLI installed locally (`brew install supabase/tap/supabase`).
- `.env.local` has `SUPABASE_SERVICE_ROLE_KEY` (do NOT cat it — auto-classifier blocks; use scripted grep extraction per `CLAUDE.md`).
- Existing tables: `games`, `collections`, `collection_items`, `bgg_cache`.
- Existing migration: `supabase/migrations/0000_initial_schema.sql`.
- Local Supabase dev environment runs: `supabase start` (requires Docker).

---

## Task 1: Add pgvector extension + axes_vec column

**Files:**
- Create: `supabase/migrations/0001_pgvector_axes.sql`

**Step 1: Write the migration**

```sql
-- Enable pgvector for 12-dimensional similarity queries.
create extension if not exists vector;

-- Add a generated vector column derived from the existing scores jsonb.
-- This stays in lockstep with scores; no application code writes axes_vec directly.
alter table public.games
  add column if not exists axes_vec vector(12)
    generated always as (
      array[
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
    ) stored;

-- IVFFlat index using L2 distance — fine for 12-D and a few thousand rows.
-- Lists count: rule of thumb sqrt(rows). Start at 16; rebuild later if catalog grows.
create index if not exists games_axes_vec_l2_idx
  on public.games using ivfflat (axes_vec vector_l2_ops)
  with (lists = 16);
```

**Step 2: Apply locally**

Run: `supabase db reset` (locally) and confirm migration applies clean. Then `supabase db push` against the linked remote project after review.

Expected: no errors. `\d public.games` shows `axes_vec` column with `vector(12)`. `\di public.games_axes_vec_l2_idx` shows the index.

**Step 3: Verify via SQL**

```sql
select id, name, axes_vec is not null as has_vec from public.games limit 5;
```
Expected: every row has `has_vec = true`.

**Step 4: Commit**

```bash
git add supabase/migrations/0001_pgvector_axes.sql
git commit -m "feat(db): add pgvector + axes_vec generated column

Enables server-side L2 KNN over the 12-axis profile via an IVFFlat
index. axes_vec is a generated column from scores jsonb so we don't
duplicate writes."
```

---

## Task 2: Rating-scale migration (1..10 → 1..5)

**Files:**
- Create: `supabase/migrations/0002_rating_5point.sql`

**Step 1: Write the migration**

```sql
-- v1 product decision: 5-point rating with semantic anchors, not BGG's 1-10.
-- No production users yet; this is a destructive change to the check constraint
-- that wouldn't be safe at any later point.

alter table public.collection_items
  drop constraint if exists collection_items_user_rating_check;

-- Normalize any pre-existing values (safety even though we expect none).
update public.collection_items
  set user_rating = case
    when user_rating is null then null
    when user_rating >= 9 then 5
    when user_rating = 8   then 4
    when user_rating between 6 and 7 then 3
    when user_rating between 4 and 5 then 2
    else 1
  end
  where user_rating is not null;

alter table public.collection_items
  add constraint collection_items_user_rating_check
  check (user_rating is null or user_rating between 1 and 5);

comment on column public.collection_items.user_rating is
  '5-point scale: 5=all-time favorite, 4=loved, 3=ok, 2=disappointing, 1=never again. Null=not played.';
```

**Step 2: Apply + verify**

Run: `supabase db push` after review.

Verify:
```sql
\d+ public.collection_items
-- Look for: "collection_items_user_rating_check" CHECK (user_rating IS NULL OR (user_rating >= 1 AND user_rating <= 5))
```

**Step 3: Update `src/data/types.ts` consumers**

This task is web-side and lives in plan 02. Note here: any TS reading `user_rating` must clamp 1..5 going forward.

**Step 4: Commit**

```bash
git add supabase/migrations/0002_rating_5point.sql
git commit -m "feat(db): rating scale 1..10 → 1..5

Aligns with v1 product decision and the design's ★1-★5 rating UI.
No real users yet so the data normalization clause is defensive only."
```

---

## Task 3: User preferences table

The Profile / Settings screen needs to persist: theme preference (light/dark/auto), default lens, "hide owned in recommendations," "hide dismissed." None of these belong on `auth.users`.

**Files:**
- Create: `supabase/migrations/0003_user_prefs.sql`

**Step 1: Write the migration**

```sql
create table if not exists public.user_prefs (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  theme            text not null default 'auto' check (theme in ('light','dark','auto')),
  default_lens     text not null default 'standard'
                     check (default_lens in ('standard','weight','feel','luck','equal')),
  hide_owned       boolean not null default true,
  hide_dismissed   boolean not null default true,
  min_similarity   numeric(3,2) not null default 0.70 check (min_similarity between 0 and 1),
  tier             text not null default 'free' check (tier in ('free','pro')),  -- reserved for future
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

drop trigger if exists user_prefs_updated_at on public.user_prefs;
create trigger user_prefs_updated_at
  before update on public.user_prefs
  for each row execute function public.set_updated_at();

alter table public.user_prefs enable row level security;

drop policy if exists user_prefs_self_read on public.user_prefs;
create policy user_prefs_self_read on public.user_prefs
  for select using (auth.uid() = user_id);

drop policy if exists user_prefs_self_write on public.user_prefs;
create policy user_prefs_self_write on public.user_prefs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create a row on signup.
create or replace function public.handle_new_user_prefs()
returns trigger as $$
begin
  insert into public.user_prefs (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user_prefs();
```

**Step 2: Commit**

```bash
git add supabase/migrations/0003_user_prefs.sql
git commit -m "feat(db): user_prefs table + auto-create on signup"
```

---

## Task 4: Dismissals table (Recommendations screen)

The Recommendations screen has a "Dismiss" action per card and a "Hide dismissed" preference. Need durable storage.

**Files:**
- Create: `supabase/migrations/0004_dismissals.sql`

**Step 1: Write the migration**

```sql
create table if not exists public.dismissals (
  user_id     uuid not null references auth.users(id) on delete cascade,
  game_id     text not null references public.games(id) on delete cascade,
  dismissed_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

create index if not exists dismissals_user_idx on public.dismissals (user_id);

alter table public.dismissals enable row level security;

drop policy if exists dismissals_self_all on public.dismissals;
create policy dismissals_self_all on public.dismissals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

**Step 2: Commit**

```bash
git add supabase/migrations/0004_dismissals.sql
git commit -m "feat(db): dismissals table for recommendations 'hide'"
```

---

## Task 5: Game cover storage

**Files:**
- Create: `supabase/migrations/0005_covers_bucket.sql`
- Modify: `supabase/migrations/0000_initial_schema.sql` is untouched; add the `cover_path` column via new migration.

**Step 1: Create the storage bucket via SQL**

```sql
-- 0005_covers_bucket.sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('covers', 'covers', true, 2 * 1024 * 1024, array['image/webp','image/jpeg','image/png'])
  on conflict (id) do nothing;

-- Public read; service-role write only.
drop policy if exists covers_public_read on storage.objects;
create policy covers_public_read on storage.objects
  for select using (bucket_id = 'covers');

-- Cover path columns on games. Three sizes: thumb 80px, card 200px, hero 600px.
-- Stored as a deterministic path so URL can be constructed without a DB lookup.
alter table public.games
  add column if not exists cover_origin_url text,
  add column if not exists cover_status text not null default 'pending'
    check (cover_status in ('pending','ready','failed','manual'));
```

**Path convention (documented in CLAUDE.md update later):**
```
covers/{bgg_id}/{thumb|card|hero}.webp
```
or, when bgg_id is null:
```
covers/_local/{game_id}/{thumb|card|hero}.webp
```

**Step 2: Commit**

```bash
git add supabase/migrations/0005_covers_bucket.sql
git commit -m "feat(db): covers storage bucket + cover_status column on games"
```

---

## Task 6: `similar_games` Postgres function (candidate selection)

This is the server-side half of the hybrid recommender. The client passes an anchor game ID and the server returns the K nearest neighbors with full 12-axis vectors so the client can re-rank under any lens.

**Files:**
- Create: `supabase/migrations/0006_similar_games_rpc.sql`

**Step 1: Write the function**

```sql
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
```

**Step 2: Test from psql**

```sql
-- Assumes 'brass-birmingham' exists in the catalog.
select id, name, l2_distance from public.similar_games('brass-birmingham', 10);
```
Expected: 10 rows, ordered by ascending `l2_distance`, with Brass: Lancashire near the top.

**Step 3: Commit**

```bash
git add supabase/migrations/0006_similar_games_rpc.sql
git commit -m "feat(db): similar_games RPC (server-side KNN via pgvector)"
```

---

## Task 7: `profile_candidates` Postgres function (Recommendations screen)

Profile-mode recommender: takes all of a user's ratings, builds a weighted centroid, returns the K nearest games the user doesn't already own. Same pattern as `similar_games` but with a multi-anchor query vector.

**Files:**
- Create: `supabase/migrations/0007_profile_candidates_rpc.sql`

**Step 1: Write the function**

```sql
create or replace function public.profile_candidates(
  for_user uuid,
  k        int default 50
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
begin
  -- Build weighted centroid: weight = rating - 3 (so 5→+2, 4→+1, 3→0, 2→-1, 1→-2).
  -- 3-rated games contribute nothing. Negative ratings subtract.
  with weighted as (
    select g.axes_vec, (ci.user_rating - 3)::float8 as w
    from public.collection_items ci
    join public.collections c on c.id = ci.collection_id
    join public.games g on g.id = ci.game_id
    where c.user_id = for_user
      and ci.user_rating is not null
      and ci.user_rating <> 3
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
    where c.user_id = for_user and c.kind = 'owned' and ci.game_id is not null
    union
    select d.game_id from public.dismissals d where d.user_id = for_user
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
    select
      cand.id as cand_id,
      anchor.id as anchor_id,
      anchor.name as anchor_name,
      ci.user_rating as anchor_rating,
      row_number() over (
        partition by cand.id
        order by anchor.axes_vec <-> cand.axes_vec
      ) as rn
    from candidates cand
    cross join lateral (
      select g.* from public.games g
      join public.collection_items ci on ci.game_id = g.id
      join public.collections c on c.id = ci.collection_id
      where c.user_id = for_user and ci.user_rating >= 4
    ) anchor
    join public.collection_items ci on ci.game_id = anchor.id
    join public.collections c on c.id = ci.collection_id and c.user_id = for_user
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

grant execute on function public.profile_candidates(uuid, int) to authenticated;
```

**Step 2: Test from psql**

(After plan 02 seeds a test user with ratings, otherwise skip.)
```sql
select name, centroid_distance, nearest_anchor_name, nearest_anchor_rating
  from public.profile_candidates('<test-user-uuid>', 10);
```

**Step 3: Commit**

```bash
git add supabase/migrations/0007_profile_candidates_rpc.sql
git commit -m "feat(db): profile_candidates RPC (weighted centroid + nearest anchor)"
```

---

## Task 8: TypeScript types regen

**Files:**
- Modify: `src/lib/supabase/database.types.ts` (new — generated)
- Modify: `package.json` (add script)

**Step 1: Add the generate script**

```json
// package.json scripts:
"types:db": "supabase gen types typescript --linked > src/lib/supabase/database.types.ts"
```

**Step 2: Run it**

```bash
pnpm types:db
```
Expected: file written with Postgres → TS types for games/collections/collection_items/user_prefs/dismissals, plus function signatures for similar_games/profile_candidates.

**Step 3: Verify TypeScript still passes**

```bash
pnpm exec tsc --noEmit
```
Expected: no new errors.

**Step 4: Commit**

```bash
git add src/lib/supabase/database.types.ts package.json
git commit -m "feat(db): generate DB types from linked Supabase project"
```

---

## Task 9: Edge function — `resize-cover`

When a new game is seeded (or `cover_origin_url` is set), this function fetches the source image, resizes to three WebP variants, uploads to `covers/` and flips `cover_status` to `ready`.

**Files:**
- Create: `supabase/functions/resize-cover/index.ts`
- Create: `supabase/functions/resize-cover/deno.json`

**Step 1: Write the function**

```ts
// supabase/functions/resize-cover/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// imagescript supports WebP encode in pure Deno.
import { decode, Image } from "https://deno.land/x/imagescript@1.2.17/mod.ts";

interface Body { game_id: string }

const SIZES = { thumb: 80, card: 200, hero: 600 } as const;

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("POST only", { status: 405 });

  const { game_id } = (await req.json()) as Body;
  if (!game_id) return new Response("game_id required", { status: 400 });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: game, error } = await admin
    .from("games")
    .select("id, bgg_id, cover_origin_url, cover_status")
    .eq("id", game_id)
    .single();
  if (error || !game) return new Response("game not found", { status: 404 });
  if (!game.cover_origin_url) return new Response("no origin", { status: 400 });

  const res = await fetch(game.cover_origin_url, { headers: { "User-Agent": "yournextbg/1.0" } });
  if (!res.ok) {
    await admin.from("games").update({ cover_status: "failed" }).eq("id", game_id);
    return new Response(`source fetch ${res.status}`, { status: 502 });
  }
  const bytes = new Uint8Array(await res.arrayBuffer());
  const img = await decode(bytes);
  if (!(img instanceof Image)) {
    await admin.from("games").update({ cover_status: "failed" }).eq("id", game_id);
    return new Response("not a still image", { status: 415 });
  }

  const base = game.bgg_id ? `${game.bgg_id}` : `_local/${game.id}`;

  for (const [variant, w] of Object.entries(SIZES) as [keyof typeof SIZES, number][]) {
    const ratio = w / img.width;
    const resized = img.clone().resize(w, Math.round(img.height * ratio));
    const buf = await resized.encode(80); // WebP quality 80
    const { error: upErr } = await admin.storage
      .from("covers")
      .upload(`${base}/${variant}.webp`, buf, {
        contentType: "image/webp",
        upsert: true,
        cacheControl: "public, max-age=31536000, immutable",
      });
    if (upErr) {
      await admin.from("games").update({ cover_status: "failed" }).eq("id", game_id);
      return new Response(`upload ${variant}: ${upErr.message}`, { status: 500 });
    }
  }

  await admin.from("games").update({ cover_status: "ready" }).eq("id", game_id);
  return new Response(JSON.stringify({ ok: true, base }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

**Step 2: deno.json**

```json
// supabase/functions/resize-cover/deno.json
{ "imports": {} }
```

**Step 3: Local test**

```bash
supabase functions serve resize-cover --no-verify-jwt
# in another shell:
curl -X POST http://localhost:54321/functions/v1/resize-cover \
  -H 'Authorization: Bearer SERVICE_ROLE' \
  -H 'Content-Type: application/json' \
  -d '{"game_id":"brass-birmingham"}'
```
Expected: 200, three files appear in `covers/<bgg_id>/`, `cover_status` updates to `ready`.

**Step 4: Deploy**

```bash
supabase functions deploy resize-cover --no-verify-jwt
```

**Step 5: Commit**

```bash
git add supabase/functions/resize-cover/
git commit -m "feat(edge): resize-cover function (3 WebP variants per game)"
```

---

## Task 10: Backfill covers for existing catalog

**Files:**
- Create: `scripts/backfill-covers.ts`

**Step 1: Find cover origins**

Since BGG API is 401-locked, the simplest source of cover URLs is manual: the catalog grows curated, and the curator pastes the URL when scoring. Update `Game` type to optionally carry `coverOriginUrl`, propagate through `pnpm seed:games` into `cover_origin_url`.

This is a two-step task:
1. Plan-02 task adds `coverOriginUrl?: string` to `Game` type in `src/data/types.ts` and updates seed script to upsert it.
2. THIS task script iterates `games` rows with `cover_status='pending'` and `cover_origin_url is not null`, calls `resize-cover` for each.

```ts
// scripts/backfill-covers.ts
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const { data: games, error } = await admin
  .from("games")
  .select("id")
  .eq("cover_status", "pending")
  .not("cover_origin_url", "is", null);

if (error) throw error;
console.log(`Backfilling ${games?.length} covers…`);

for (const g of games ?? []) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/resize-cover`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ game_id: g.id }),
  });
  console.log(`  ${g.id}: ${res.status}`);
  await new Promise((r) => setTimeout(r, 400)); // gentle on source origin + edge fn
}
```

**Step 2: Add script alias**

```json
// package.json
"backfill:covers": "tsx scripts/backfill-covers.ts"
```

**Step 3: Run**

```bash
pnpm backfill:covers
```

**Step 4: Commit**

```bash
git add scripts/backfill-covers.ts package.json
git commit -m "feat(seed): backfill-covers script (calls resize-cover per row)"
```

---

## Task 11: BGG sync — schema + edge function + pg_cron

User's BGG collection imports into their `owned` and `wishlist` collections. Games we don't have scored get inserted into `games` with `score_status = 'unscored'` and a null axes vector; they appear on the shelf with a "pending scoring" badge but don't participate in the recommender.

**Files:**
- Create: `supabase/migrations/0008_bgg_sync_status.sql`
- Create: `supabase/functions/bgg-sync/index.ts`
- Create: `supabase/migrations/0009_bgg_autosync_cron.sql`

**Step 1: score_status + bgg_sync_log + auto_sync pref**

```sql
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
```

**Step 2: bgg-sync edge function**

```ts
// supabase/functions/bgg-sync/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parse as parseXML } from "https://deno.land/x/xml@2.1.3/mod.ts";

interface Body { user_id?: string; triggered_by?: 'manual' | 'cron'; }

const BGG_BASE = "https://boardgamegeek.com/xmlapi2";
const MAX_RETRIES = 6;          // BGG returns 202 while building; back off up to ~30s.
const BACKOFF_MS = [1000, 2000, 3000, 5000, 8000, 13000];

async function fetchCollection(username: string, kind: 'own' | 'wishlist'): Promise<Response> {
  const qs = kind === 'own' ? 'own=1&stats=1' : 'wishlist=1';
  const url = `${BGG_BASE}/collection?username=${encodeURIComponent(username)}&${qs}`;
  const apiKey = Deno.env.get("BGG_API_KEY");
  const headers: HeadersInit = {
    "User-Agent": "yournextbg/1.0 (+https://yournextbg.com)",
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
  };
  for (let i = 0; i < MAX_RETRIES; i++) {
    const res = await fetch(url, { headers });
    if (res.status !== 202) return res;
    await new Promise(r => setTimeout(r, BACKOFF_MS[i] ?? 13000));
  }
  return new Response("BGG still building cache after retries", { status: 504 });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("POST only", { status: 405 });
  const authz = req.headers.get("Authorization");
  if (!authz?.startsWith("Bearer ")) return new Response("auth required", { status: 401 });

  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authz } } },
  );
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return new Response("invalid token", { status: 401 });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Allow service-role caller (cron) to specify a target user_id.
  const body = (await req.json().catch(() => ({}))) as Body;
  const targetUserId = body.user_id ?? user.id;
  const triggeredBy: 'manual' | 'cron' = body.triggered_by ?? 'manual';

  const { data: prefs } = await admin
    .from("user_prefs").select("bgg_username").eq("user_id", targetUserId).single();
  if (!prefs?.bgg_username) return new Response("no bgg_username on profile", { status: 400 });

  const { data: logRow } = await admin
    .from("bgg_sync_log")
    .insert({ user_id: targetUserId, triggered_by: triggeredBy })
    .select("id").single();
  const logId = logRow!.id;

  try {
    const [ownedRes, wishRes] = await Promise.all([
      fetchCollection(prefs.bgg_username, 'own'),
      fetchCollection(prefs.bgg_username, 'wishlist'),
    ]);
    if (!ownedRes.ok || !wishRes.ok) {
      await admin.from("bgg_sync_log").update({
        finished_at: new Date().toISOString(),
        status: 'failed',
        error: `owned=${ownedRes.status} wish=${wishRes.status}`,
      }).eq("id", logId);
      return new Response("BGG fetch failed", { status: 502 });
    }

    const ownedXml = parseXML(await ownedRes.text()) as any;
    const wishXml = parseXML(await wishRes.text()) as any;
    const ownedItems = extractItems(ownedXml);
    const wishItems  = extractItems(wishXml);

    // 1. Upsert games that don't exist yet as unscored placeholders.
    const allBggIds = [...new Set([...ownedItems, ...wishItems].map(i => i.bggId))];
    const { data: existingGames } = await admin
      .from("games").select("bgg_id").in("bgg_id", allBggIds);
    const existing = new Set((existingGames ?? []).map(g => g.bgg_id));
    const newPlaceholders = [...ownedItems, ...wishItems]
      .filter(i => !existing.has(i.bggId))
      .map(i => ({
        id: `bgg-${i.bggId}`,
        slug: `bgg-${i.bggId}`,
        name: i.name,
        bgg_id: i.bggId,
        scores: null,           // axes_vec will be null too via generated column
        solo: 0,
        fiddly: 0,
        score_status: 'unscored' as const,
        cover_origin_url: i.imageUrl ?? null,
      }));
    if (newPlaceholders.length) {
      await admin.from("games").upsert(newPlaceholders, { onConflict: "id" });
    }

    // 2. Find or create the user's owned + wishlist collections.
    const ownedColl = await ensureCollection(admin, targetUserId, 'owned', 'Owned');
    const wishColl  = await ensureCollection(admin, targetUserId, 'wishlist', 'Wishlist');

    // 3. Upsert collection_items.
    await upsertItems(admin, ownedColl, ownedItems, 'bgg');
    await upsertItems(admin, wishColl,  wishItems,  'bgg');

    await admin.from("user_prefs").update({
      last_bgg_sync_at: new Date().toISOString(),
    }).eq("user_id", targetUserId);

    await admin.from("bgg_sync_log").update({
      finished_at: new Date().toISOString(),
      status: 'ok',
      owned_count: ownedItems.length,
      wishlist_count: wishItems.length,
      new_unscored: newPlaceholders.length,
    }).eq("id", logId);

    return new Response(JSON.stringify({
      ok: true,
      owned: ownedItems.length,
      wishlist: wishItems.length,
      new_unscored: newPlaceholders.length,
    }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    await admin.from("bgg_sync_log").update({
      finished_at: new Date().toISOString(),
      status: 'failed',
      error: String(err),
    }).eq("id", logId);
    return new Response(String(err), { status: 500 });
  }
});

// Helper signatures (implementations omitted for brevity in the plan;
// implementer should consult BGG XML schema for exact paths):
function extractItems(_xml: any): { bggId: number; name: string; imageUrl?: string; userRating?: number }[] {
  // Iterate <item objectid="..."> nodes, pull name, image, status, rating.
  return [];
}
async function ensureCollection(_admin: any, _userId: string, _kind: string, _name: string): Promise<string> { return ''; }
async function upsertItems(_admin: any, _collectionId: string, _items: any[], _source: string): Promise<void> {}
```

**Step 3: pg_cron auto-sync**

```sql
-- 0009_bgg_autosync_cron.sql
create extension if not exists pg_cron;
create extension if not exists pg_net;     -- used to call edge functions from cron

-- Runs hourly. Picks up users with auto_sync_bgg=true whose last sync is stale.
select cron.schedule(
  'bgg_autosync_hourly',
  '0 * * * *',
  $$
  with stale_users as (
    select user_id from public.user_prefs
    where auto_sync_bgg = true
      and bgg_username is not null
      and (last_bgg_sync_at is null or last_bgg_sync_at < now() - interval '55 minutes')
    limit 50    -- fairness ceiling: max 50 users per tick
  )
  select net.http_post(
    url := current_setting('app.supabase_functions_url') || '/bgg-sync',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('user_id', user_id, 'triggered_by', 'cron')
  )
  from stale_users;
  $$
);

-- One-off (run from Supabase SQL editor): set the two settings used above.
-- alter database postgres set app.supabase_functions_url = '<your project>.functions.supabase.co/functions/v1';
-- alter database postgres set app.service_role_key = '<service-role-key>';
```

**Step 4: BGG_API_KEY secret**

```bash
supabase secrets set BGG_API_KEY="<your-key>"
```

If the key isn't available yet, deploy the function without it; the function falls back to unauthenticated fetch (which will 401 until the key arrives). The UI feature-flag (plan 02) keeps the button hidden until you flip it.

**Step 5: Deploy**

```bash
supabase db push
supabase functions deploy bgg-sync
```

**Step 6: Commit**

```bash
git add supabase/migrations/0008_bgg_sync_status.sql \
        supabase/migrations/0009_bgg_autosync_cron.sql \
        supabase/functions/bgg-sync/
git commit -m "feat(bgg): score_status + bgg-sync edge fn + hourly pg_cron"
```

---

## Task 12: OpenAPI spec for edge functions

Documents the API surface for v2 native apps. Living source of truth.

**Files:**
- Create: `contract/openapi.yaml`

**Step 1: Write the spec**

```yaml
# contract/openapi.yaml
openapi: 3.1.0
info:
  title: yournextbg edge functions
  version: 0.1.0
servers:
  - url: https://gkickjaihbgapowsqwhx.functions.supabase.co
paths:
  /resize-cover:
    post:
      summary: Fetch + resize a game's cover_origin_url into 3 WebP variants
      operationId: resizeCover
      security: [{ ServiceRole: [] }]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [game_id]
              properties:
                game_id: { type: string }
      responses:
        "200": { description: ok }
        "400": { description: bad request }
        "404": { description: game not found }
  /bgg-sync:
    post:
      summary: Import owned + wishlist from BGG into the user's collections
      operationId: bggSync
      security: [{ BearerAuth: [] }]
      requestBody:
        required: false
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/BggSyncRequest"
      responses:
        "200":
          description: ok
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/BggSyncResponse"
        "400": { description: no bgg_username on profile }
        "401": { description: not authenticated }
        "502": { description: BGG upstream failed }
        "504": { description: BGG still building cache after retries }
components:
  securitySchemes:
    BearerAuth: { type: http, scheme: bearer }
    ServiceRole: { type: http, scheme: bearer, bearerFormat: service-role }
  schemas:
    BggSyncRequest:
      type: object
      description: |
        Body is optional from user calls (the user's own auth token determines who to sync).
        Service-role callers (pg_cron) pass `user_id` + `triggered_by: cron`.
      properties:
        user_id: { type: string, format: uuid }
        triggered_by:
          type: string
          enum: [manual, cron]
          default: manual
    BggSyncResponse:
      type: object
      required: [ok, owned, wishlist, new_unscored]
      properties:
        ok: { type: boolean }
        owned: { type: integer, description: count of owned games imported }
        wishlist: { type: integer, description: count of wishlist games imported }
        new_unscored:
          type: integer
          description: |
            Games inserted into the catalog with score_status='unscored' because
            we don't have editorial scores yet. They appear on the user's shelf
            with a "pending scoring" badge and don't participate in the recommender.
    ScoreVector:
      type: array
      minItems: 12
      maxItems: 12
      items: { type: number, minimum: 0, maximum: 10 }
      description: |
        Order is load-bearing:
        [weight, depth, density, interaction, conflict, negotiation,
         input, output, catchup, theme, engine, narrative]
```

Note: `similar_games` and `profile_candidates` are Postgres functions and reachable via Supabase's PostgREST `/rest/v1/rpc/...` interface — Supabase auto-generates docs for those, not OpenAPI. The native v2 plans (03, 04) explain how Swift/Kotlin clients call them via the Supabase SDK.

**Step 2: Lint**

```bash
npx @redocly/cli lint contract/openapi.yaml
```
Expected: zero errors.

**Step 3: Commit**

```bash
git add contract/openapi.yaml
git commit -m "feat(contract): OpenAPI spec for edge functions"
```

---

## Task 13: GitHub Action — migration deploy on main

**Files:**
- Create: `.github/workflows/supabase-deploy.yml`

**Step 1: Workflow**

```yaml
# .github/workflows/supabase-deploy.yml
name: supabase-deploy
on:
  push:
    branches: [main]
    paths: ["supabase/migrations/**", "supabase/functions/**"]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
        with: { version: latest }
      - name: Link
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
        run: supabase link --project-ref gkickjaihbgapowsqwhx
      - name: Push migrations
        env:
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
        run: supabase db push
      - name: Deploy functions
        run: supabase functions deploy --project-ref gkickjaihbgapowsqwhx
```

**Step 2: Add secrets**

In GitHub repo settings: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`.

**Step 3: Commit**

```bash
git add .github/workflows/supabase-deploy.yml
git commit -m "ci: auto-deploy Supabase migrations + edge functions on main"
```

---

## Task 14: End-to-end smoke test

**Step 1: Smoke commands**

```bash
# 1. health
pnpm supabase:health

# 2. types generated cleanly
pnpm types:db
pnpm exec tsc --noEmit

# 3. similar_games returns results
psql "$DATABASE_URL" -c "select name, l2_distance from public.similar_games('brass-birmingham', 5);"

# 4. resize-cover round-trip (for one game)
curl -X POST "$SUPABASE_URL/functions/v1/resize-cover" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"game_id":"brass-birmingham"}'

# 5. bgg-sync round-trip (needs a real BGG username + the API key configured)
#    Use your own test account's bearer token (from devtools after signing in locally).
curl -X POST "$SUPABASE_URL/functions/v1/bgg-sync" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" -d '{}'
# expected: { ok: true, owned: N, wishlist: M, new_unscored: K }

# 6. pg_cron is registered
psql "$DATABASE_URL" -c "select jobname, schedule, active from cron.job where jobname='bgg_autosync_hourly';"
# expected: 1 row, active=true

# 7. RLS check — anonymous can SELECT games but not write
psql "$DATABASE_URL" -c "set role anon; insert into games (id, slug, name, scores, solo, fiddly) values ('x','x','x','[0,0,0,0,0,0,0,0,0,0,0,0]'::jsonb, 0, 0);"
# expected: ERROR
```

**Step 2: Commit the smoke checklist**

```bash
# Add the smoke commands to docs/runbook.md
git add docs/runbook.md
git commit -m "docs: backend smoke-test checklist"
```

---

## Definition of done

- Nine migrations applied to `gkickjaihbgapowsqwhx` (0001–0009).
- pgvector index `games_axes_vec_l2_idx` exists.
- `similar_games` and `profile_candidates` RPCs callable from anon and authenticated respectively. Both exclude rows where `score_status = 'unscored'` (via `axes_vec IS NOT NULL` filter — confirm in Task 6/7 SQL).
- `games.score_status` column exists; existing seeded rows are `editorial`.
- Storage bucket `covers` exists, public-read.
- `resize-cover` edge function deployed, produces three WebP variants per game.
- `bgg-sync` edge function deployed. With `BGG_API_KEY` set, a real user can sync their owned + wishlist. Without it, function returns 502/504 and the UI keeps the button hidden via feature flag.
- `bgg_autosync_hourly` pg_cron job registered, calls `bgg-sync` for users with `auto_sync_bgg = true`.
- `contract/openapi.yaml` exists and lints clean.
- GitHub Actions workflow runs on push to main and deploys without error.
- `pnpm types:db && pnpm exec tsc --noEmit` passes.
- Smoke test in Task 14 passes end to end.

This unblocks plan 02 task list (web).
