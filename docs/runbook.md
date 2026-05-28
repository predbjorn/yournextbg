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
`supabase/functions/bgg-sync/index.ts` is current. The sync writes one row to
`public.bgg_sync_log` per run (migration `0008_bgg_sync_status.sql`); inspecting that
table is the easiest way to see what happened on the last attempt.

## Check 6 — `pg_cron` job is registered

**One-off precondition (must run BEFORE the cron's first tick):** the cron payload
reads two settings via `current_setting(...)`. Set them from the Supabase SQL editor
once per environment:

```sql
alter database postgres set app.supabase_functions_url
  = 'https://gkickjaihbgapowsqwhx.functions.supabase.co/functions/v1';
alter database postgres set app.service_role_key
  = '<paste service-role JWT>';
```

Without these, `cron.job_run_details` will show errors like
`unrecognized configuration parameter "app.supabase_functions_url"` and the bgg-sync
edge function will never be invoked by cron (manual sync from the web app still works,
since it doesn't depend on these settings).

```bash
psql "$DATABASE_URL" -c \
  "select jobname, schedule, active from cron.job where jobname='bgg_autosync_hourly';"
```

**Expected:** 1 row, `active = true`, schedule matching the hourly cadence defined in
migration `supabase/migrations/0009_bgg_autosync_cron.sql`.

Additionally verify the most recent run succeeded:

```bash
psql "$DATABASE_URL" -c \
  "select start_time, status, return_message from cron.job_run_details \
   where jobid = (select jobid from cron.job where jobname='bgg_autosync_hourly') \
   order by start_time desc limit 3;"
```

**Expected:** rows with `status = 'succeeded'`. A status of `failed` with
`unrecognized configuration parameter` means the precondition above wasn't run.

**If it fails:** re-apply migration `0009_bgg_autosync_cron.sql` (idempotent) and
re-run the two `alter database` statements above.

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

## Auth provider setup

The web app uses Supabase Auth via `@supabase/ssr` (server client at
`src/lib/supabase/server.ts`, browser client at `src/lib/supabase/client.ts`,
session refresh in `src/proxy.ts` → `src/lib/supabase/proxy.ts`). The
following providers must be enabled in the Supabase dashboard before the
Plan 02 login screen ships.

Dashboard path: **Supabase project → Authentication → Providers**.

### Email + password

Usually on by default for new projects. Confirm under **Authentication →
Providers → Email** that **Enable Email provider** is on. Leave **Confirm
email** on for production; turn it off only in local/dev projects where you
need to sign up without an inbox.

### Magic link

Under **Authentication → Providers → Email**, toggle **Enable Email link
(magic link)** on. No extra config required beyond the redirect allow-list
below.

### Google OAuth

Under **Authentication → Providers → Google**:

1. Toggle **Enable Sign in with Google** on.
2. Paste the **Client ID** and **Client Secret** from a Google Cloud OAuth
   2.0 Web client (Google Cloud Console → APIs & Services → Credentials).
3. The Google OAuth client's **Authorized redirect URIs** must include the
   Supabase-issued callback shown on the provider page
   (`https://<project-ref>.supabase.co/auth/v1/callback`).
4. In Supabase **Authentication → URL Configuration**, add to
   **Redirect URLs**:
   - `https://yournextbg.com/auth/callback` (production)
   - `http://localhost:3000/auth/callback` (dev)
   - any preview-deploy origins you use (e.g. `https://*.vercel.app/auth/callback`)

### Apple OAuth

Deferred until iOS exists. Apple Sign-In requires a **Services ID** tied to
an App ID — easier to configure once the iOS bundle identifier is locked in
(Plan 03). Until then, the Apple button on the login screen is rendered
disabled with a "Coming soon" tooltip; do **not** enable the Apple provider
in the dashboard yet (turning it on without a Services ID just produces
broken redirects).


## Observability

### PostHog

- `NEXT_PUBLIC_POSTHOG_KEY` — project public key. Init in `src/lib/analytics/posthog.ts`.
- `NEXT_PUBLIC_POSTHOG_HOST` — optional override, defaults to `https://us.i.posthog.com`.
- When unset locally, the `capture()` calls are no-op — no warnings.
- Event taxonomy lives in `src/lib/analytics/posthog.ts` (`EventName`). Keep it in sync with the PostHog dashboard.

### Sentry

Not yet wired. Set up via the official wizard the first time you run it locally:

```bash
pnpm dlx @sentry/wizard@latest -i nextjs
```

The wizard interactively creates `sentry.client.config.ts` / `sentry.server.config.ts` / `next.config.ts` glue and a `.sentryclirc` for source-map uploads. Skip the Vercel integration prompt if the repo↔Vercel link is still broken (see deploy section below).

Required env vars after the wizard runs:

- `NEXT_PUBLIC_SENTRY_DSN` (browser)
- `SENTRY_AUTH_TOKEN` (build-time source-map upload — set in Vercel/GHA, not committed)

Start at `tracesSampleRate: 0.1` for v1; revisit when traffic justifies more.

## Deploy

The GitHub ↔ Vercel link is broken because the repo is private. v1 options:

1. **Make the repo public** (preferred — open-source posture matches the methodology essay). Then re-link in Vercel project settings and pushes to `main` deploy automatically.
2. **Vercel deploy hook**. Generate one from the Vercel project (Settings → Git → Deploy Hooks), store as `VERCEL_DEPLOY_HOOK` repo secret in GitHub, then add `.github/workflows/vercel-deploy.yml` that posts to it on `push: main`. Until either option lands, deploy manually: `pnpm exec vercel --prod`.

---

## Android

Native Compose app living under `android/`. Companion to web (`src/`) and iOS
(`ios/`). Plan: `docs/plans/2026-05-23-04-android-compose.md`.

### Build it locally

```sh
# one-time
cd android
cp local.properties.example local.properties
# fill in real values for SUPABASE_*, SENTRY_DSN, POSTHOG_*, GOOGLE_WEB_CLIENT_ID
# as they become available — empty values are tolerated by the build,
# but the app's auth/data calls won't function until they're real.

# every time
./gradlew :app:assembleDebug      # build a debug APK
./gradlew :app:installDebug       # install on a connected device/emulator
./gradlew :app:testDebugUnitTest  # 34 unit tests incl. Cardstock + scoring parity
./gradlew :app:lintDebug          # Android Lint
```

JDK 17 required. Gradle 8.9 wrapper is checked in; never use a system `gradle`.

### Secrets layout

All app-time secrets live in `android/local.properties` (gitignored). Read by
`app/build.gradle.kts` at configuration time and surfaced as `BuildConfig.*`:

| BuildConfig field      | Source                                | First needed by      |
| ---------------------- | ------------------------------------- | -------------------- |
| `SUPABASE_URL`         | shared with web (same project ref)    | Phase 0.8 (smoke)    |
| `SUPABASE_ANON_KEY`    | shared with web (same project ref)    | Phase 0.8 (smoke)    |
| `SENTRY_DSN`           | sentry.io project settings            | Phase 4.2 (crashes)  |
| `POSTHOG_API_KEY`      | posthog.com project settings          | Phase 4.3 (analytics)|
| `POSTHOG_HOST`         | usually `https://us.i.posthog.com`    | Phase 4.3 (analytics)|
| `GOOGLE_WEB_CLIENT_ID` | GCP OAuth (web type) + Supabase Auth  | Phase 1.3 (Google SI)|

Missing values cause a Gradle build warning, not a build failure — fresh clones
and CI stay green. The Login screen disables "Continue with Google" until
`GOOGLE_WEB_CLIENT_ID` is non-empty. The Supabase singleton throws at first
network call if URL/anon-key are blank, surfaced as a friendly
`SetupRequiredScreen` in MainActivity.

### Cardstock token drift guard

`android/app/src/test/java/.../ui/theme/CardstockColorsTest.kt` reads
`src/app/globals.css` from the monorepo and asserts every Cardstock hex
verbatim matches the Kotlin value in `CardstockColors.kt`. If anyone changes a
token on one side without the other, the test fails. Light + dark variants
both covered.

### Scoring engine parity

`src/lib/scoring/` is mirrored 1:1 in `android/app/.../data/scoring/`:
- `Axes.kt` matches `axes.ts` (12-position order is load-bearing)
- `Lenses.kt` matches `lenses.ts` (5 lenses, exact numeric weights)
- `Similarity.kt` matches `similarity.ts`

`SimilarityTest` carries an inlined reference implementation (a verbatim Kotlin
translation of `similarity.ts`) and asserts the production code agrees within
`1e-9` across every lens × every fixture pair. Touching either side without
mirroring the other will redden the suite immediately.

### Preconditions still pending (as of 2026-05-28)

Plan 04 is paused at end-of-Phase-2 awaiting these human-blocked items:

1. **Google Play Developer account.** The original $25 account was closed for
   non-use; re-enrollment scheduled. Without it: no Play Console app entry, no
   internal-testing track, no fastlane supply uploads.
2. **Upload + production keystore.** Generated only after the Play account is
   re-enrolled. Stored in 1Password per project convention; base64-encoded into
   the `KEYSTORE_BASE64` GitHub secret for CI release builds.
3. **Google Sign-In OAuth web client.** Configure in GCP (web type), paste the
   client ID into `local.properties` as `GOOGLE_WEB_CLIENT_ID`, and link the
   client into Supabase Auth → Providers → Google.

Until those three land, the Android build:
- Compiles green via debug signing (Android ships a debug keystore at
  `~/.android/debug.keystore` automatically).
- Boots the app to login (the disabled Google button + functional email/magic
  link paths).
- Cannot ship to Play Store internal-testing.

### Phase 0 gate

The plan's Task 0.10 (human-blocked gate) is acknowledged here:
**Phase 0 deferred pending the three preconditions above. Phase 1+ work
proceeded on the basis that the preconditions are tracked and will land before
release prep (Phase 5).**

### Cutting a release (future)

When the preconditions land:

```sh
# bump versionCode + versionName in android/app/build.gradle.kts
./gradlew :app:bundleRelease         # produces app-release.aab
bundle exec fastlane play_internal   # uploads to Play Console internal track
```

Release signing config and the fastlane lanes will be added in plan tasks 4.5
and 4.6 once the keystore exists.

### Common debugging commands

```sh
adb logcat -v color *:V YourNextBg:V         # filter to app logs
adb shell pm clear com.yournextbg.app        # nuke app data + signed-out
adb shell am start -W -a android.intent.action.VIEW \
  -d 'yournextbg://auth/callback?token=foo' com.yournextbg.app
                                              # exercise the deep link

# extract the merged AndroidManifest from a debug APK
./gradlew :app:assembleDebug
aapt dump xmltree app/build/outputs/apk/debug/app-debug.apk AndroidManifest.xml
```
