# Backend smoke-test runbook

This runbook validates that everything shipped in Plan 01 (migrations 0000–0009, the
`resize-cover` and `bgg-sync` edge functions, the `bgg_autosync_hourly` pg_cron job,
and RLS policies) is wired up correctly against a live Supabase project. Run it once
after each Supabase deploy — locally before the first push, then again against
production after the GHA workflow (`.github/workflows/supabase-deploy.yml`) has shipped
the migrations and functions.

If any of the seven checks below fails, do **not** ship the frontend changes that depend
on it; fix the referenced migration or function first.

## Pre-conditions

Before running the checklist:

- All migrations under `supabase/migrations/` have been applied to the target project
  (locally via `supabase db reset`, or on remote via the GHA workflow).
- Both edge functions are deployed: `supabase/functions/resize-cover/` and
  `supabase/functions/bgg-sync/`.
- The following are exported in the current shell:
  - `DATABASE_URL` — Postgres connection string for the target project (service-role).
  - `SUPABASE_URL` — e.g. `https://<ref>.supabase.co` (or `http://127.0.0.1:54321` for local).
  - `SUPABASE_SERVICE_ROLE_KEY` — service-role JWT for `resize-cover`.
  - `USER_ACCESS_TOKEN` — a real user's bearer token (grab from devtools after signing
    in locally) for the `bgg-sync` round-trip.
- `BGG_API_KEY` is configured as an edge-function secret on the target project (required
  for check #5).
- At least one game with `slug = 'brass-birmingham'` exists in `public.games` with
  embeddings populated (used by checks #3 and #4).

## Check 1 — Health probe

```bash
pnpm supabase:health
```

**Expected:** the `scripts/supabase-health.ts` probe exits 0 and prints OK lines for
auth, storage, and a representative table read.

**If it fails:** check that `SUPABASE_URL` / keys are pointing at the right project, then
re-run migrations from `supabase/migrations/0000_initial_schema.sql` forward.

## Check 2 — Generated types compile cleanly

> **Run order note:** this check requires `supabase link` to point at the remote project
> with the new migrations applied. On a fresh clone before the first push to `main`, the
> remote schema is still stale — run this check **after** the GHA workflow
> (`.github/workflows/supabase-deploy.yml`) has completed its first successful run on
> `main` (triggered by any push touching `supabase/migrations/**` or
> `supabase/functions/**`).

```bash
pnpm types:db
pnpm exec tsc --noEmit
```

**Expected:** `src/lib/supabase/database.types.ts` is regenerated and `tsc` reports no
errors.

**If it fails:** a migration introduced a column/type the rest of the codebase doesn't
expect. Inspect the diff in `database.types.ts` and reconcile with whichever query files
in `src/` reference the affected table.

## Check 3 — Similarity RPC returns neighbours

```bash
psql "$DATABASE_URL" -c \
  "select name, l2_distance from public.similar_games('brass-birmingham', 5);"
```

**Expected:** 5 rows, each with a non-null `l2_distance`, ordered ascending.

**If it fails:** the `similar_games` function (migration
`supabase/migrations/0006_similar_games_rpc.sql`) is missing, or the seed game has no
embedding. Verify `pgvector` is enabled (migration `0001_pgvector_axes.sql`) and that
the embedding column for `brass-birmingham` is populated.

## Check 4 — `resize-cover` round-trip

```bash
curl -X POST "$SUPABASE_URL/functions/v1/resize-cover" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"game_id":"brass-birmingham"}'
```

**Expected:** HTTP 200 with a JSON body indicating success and the resized object key in
the `covers` bucket (migration `supabase/migrations/0005_covers_bucket.sql`). A
subsequent `select cover_url from games where id='brass-birmingham';` should resolve.

**If it fails:** confirm the function is deployed
(`supabase/functions/resize-cover/index.ts`), the `covers` bucket exists, and the
service-role key in the request matches the project.

## Check 5 — `bgg-sync` round-trip

```bash
# Use your own test account's bearer token (from devtools after signing in locally).
curl -X POST "$SUPABASE_URL/functions/v1/bgg-sync" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" -d '{}'
```

**Expected:**

```json
{ "ok": true, "owned": N, "wishlist": M, "new_unscored": K }
```

where `N`, `M`, `K` are integers reflecting the signed-in user's BGG collection.

**If it fails:** ensure `BGG_API_KEY` is set as a function secret, the user has a BGG
username configured in `user_prefs` (migration
`supabase/migrations/0003_user_prefs.sql`), and the function deployment at
`supabase/functions/bgg-sync/index.ts` is current. The sync writes to
`public.bgg_sync_status` (migration `0008_bgg_sync_status.sql`); a row there is also a
useful health signal.

## Check 6 — `pg_cron` job is registered

```bash
psql "$DATABASE_URL" -c \
  "select jobname, schedule, active from cron.job where jobname='bgg_autosync_hourly';"
```

**Expected:** 1 row, `active = true`, schedule matching the hourly cadence defined in
migration `supabase/migrations/0009_bgg_autosync_cron.sql`.

**If it fails:** re-apply migration `0009_bgg_autosync_cron.sql`. The migration is
idempotent and safe to re-run.

## Check 7 — RLS blocks anonymous writes

```bash
psql "$DATABASE_URL" -c \
  "set role anon; insert into games (id, slug, name, scores, solo, fiddly) values ('x','x','x','[0,0,0,0,0,0,0,0,0,0,0,0]'::jsonb, 0, 0);"
```

**Expected:** `ERROR: new row violates row-level security policy` (or equivalent
permission-denied message). Anonymous role must **not** be able to write to `games`.

Optionally confirm the read side still works:

```bash
psql "$DATABASE_URL" -c "set role anon; select count(*) from games;"
```

**If it fails (i.e., the insert succeeds):** the RLS policy from
`supabase/migrations/0000_initial_schema.sql` was dropped or overridden by a later
migration. Audit `0001`–`0009` for any `alter policy` / `drop policy` statements and
re-establish the read-only-for-anon contract.

## Ship / no-ship gate

All seven checks must pass before the frontend (Plan 02+) consumes this backend:

- [ ] **#1** `pnpm supabase:health` exits 0
- [ ] **#2** `pnpm types:db && pnpm exec tsc --noEmit` clean (after first successful GHA deploy on `main`)
- [ ] **#3** `similar_games('brass-birmingham', 5)` returns 5 rows
- [ ] **#4** `resize-cover` POST returns 200 and writes to the `covers` bucket
- [ ] **#5** `bgg-sync` POST returns `{ ok: true, owned, wishlist, new_unscored }`
- [ ] **#6** `cron.job` has `bgg_autosync_hourly` row with `active = true`
- [ ] **#7** Anonymous `insert into games` errors with RLS violation

If every box is checked, the backend in Plan 01 is ready to ship.
