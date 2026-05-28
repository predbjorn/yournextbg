# Android (Jetpack Compose, v2) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.
> **Status: RE-GRAINED 2026-05-25.** Outline preserved at git ref before commit `docs(plan): re-grain plan 04 for execution`. This file is now the execution-grained version — bite-sized tasks (~30–90 min each), explicit acceptance criteria, TDD-friendly. Runs in parallel with plan 03 (iOS) once `contract/openapi.yaml` is stable.

**Goal:** Native Android app that mirrors the seven web screens, consuming the Supabase + edge-function surface. Cardstock design preserved on top of Material 3 components (theme override, not Material defaults).

**Architecture:** Jetpack Compose with single-activity + Navigation Compose. `supabase-kt` for auth + tables + RPCs. Kotlin OpenAPI generator (kotlinx.serialization + Ktor client) consumes `contract/openapi.yaml` for edge-function calls only. Theme tokens delivered via `CompositionLocal`. State via `ViewModel` + `StateFlow`. DI: manual (constructor-injected) for v2 scope.

**Tech Stack:** Kotlin 2.x, Jetpack Compose, Material 3, Android 14 (API 34) target / Android 8 (API 26) min, `supabase-kt`, `kotlinx.coroutines`, `kotlinx.serialization`, `Coil 3`, `Sentry-Android`, `posthog-android`, fastlane for Play Console delivery.

---

## Preconditions (human-blocked — must verify before Phase 1)

The dispatch agent will pause at the end of Phase 0 to surface any of these that are not in place:

- [ ] Plan 01 complete (merged on `main`).
- [ ] Plan 02 complete (web v1 live).
- [ ] `contract/openapi.yaml` stable — confirmed 2026-05-25: OpenAPI 3.1.0, 2 paths (`/resize-cover`, `/bgg-sync`), 3 schemas. Versioned at `0.1.0`. Treat any change as user-sign-off-required.
- [ ] Google Play Developer account ($25 one-time) active.
- [ ] App entry in Play Console with package name `com.yournextbg.app`.
- [ ] Upload + production keystore generated (1Password backup per project convention).
- [ ] Google Sign-In OAuth client configured, web-client-id + android-client-id captured, linked to Supabase OAuth provider.

---

## Conventions for this plan

- **Lane:** write only inside `android/`, plus this file and the Android section of `docs/runbook.md`. Do NOT touch `src/`, `supabase/`, `ios/`, `contract/`.
- **Commits:** conventional subjects `feat(android): …`, `chore(android): …`, `test(android): …`, etc. Footer `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.
- **TDD bias:** for the scoring port (Task 2.2) and any pure logic, write the test first. For Compose UI, ship the screen with a screenshot test or a `@Preview`-driven manual check; full UI testing infra (Compose UI Test, Robolectric) is set up in Task 5.4 once it earns its keep.
- **Cardstock token source of truth:** `src/app/globals.css` lines 35–75 (Cardstock light + dark). Mirror values exactly into Kotlin; do not read from the untracked `design/` directory.
- **Score vector order (LOAD-BEARING — never reorder):**
  `[weight, depth, density, interaction, conflict, negotiation, input, output, catchup, theme, engine, narrative]`
- **Branch keys:** `thinking | interaction | luck | experience`. **Lens keys:** `standard | weight | feel | luck | equal`.

---

## Phase 0 — Project skeleton + gates

Goal: green Gradle build, theme + Supabase wiring smoke-tested, before any UI. Ends with a human-blocked gate.

### Task 0.1 — Monorepo `android/` directory + `.gitignore`

- Create `android/` at the repo root.
- Add a `.gitignore` inside `android/` covering: `*.iml`, `.idea/`, `.gradle/`, `build/`, `local.properties`, `keystore.jks`, `keystore.properties`, `captures/`, `.cxx/`.
- Acceptance: `git status` from repo root shows `android/.gitignore` only when added; no IDE noise leaks through after running Android Studio later.

### Task 0.2 — Gradle wrapper + root `settings.gradle.kts`

- `android/settings.gradle.kts`: pluginManagement (google, mavenCentral, gradlePluginPortal), dependencyResolutionManagement (`RepositoriesMode.FAIL_ON_PROJECT_REPOS`), `rootProject.name = "yournextbg"`, `include(":app")`.
- `android/gradle/wrapper/gradle-wrapper.properties`: Gradle 8.9 or current LTS.
- `android/gradle.properties`: `org.gradle.jvmargs=-Xmx4g`, `android.useAndroidX=true`, `kotlin.code.style=official`, `org.gradle.parallel=true`, `org.gradle.caching=true`.
- `android/build.gradle.kts`: declare AGP + Kotlin plugin versions via the version catalog (next task).
- Acceptance: `cd android && ./gradlew --version` prints Gradle 8.x and Kotlin.

### Task 0.3 — Version catalog (`gradle/libs.versions.toml`)

- One file pinning every dependency version used across the project. Includes:
  - `agp = "8.7.x"`, `kotlin = "2.0.21"`, `composeBom = "2024.12.01"`, `coil = "3.0.x"`, `supabaseKt = "3.0.x"`, `sentry = "7.x"`, `posthog = "3.x"`, `ktor = "3.x"`, `openapiGenerator = "7.10.x"`.
- Acceptance: `./gradlew :app:dependencies --configuration releaseRuntimeClasspath` resolves without warnings about transitive version conflicts that we own.

### Task 0.4 — `:app` module with empty MainActivity

- `android/app/build.gradle.kts`: applies `com.android.application`, `org.jetbrains.kotlin.android`, `org.jetbrains.kotlin.plugin.compose`, `org.jetbrains.kotlin.plugin.serialization`.
- `compileSdk = 35`, `minSdk = 26`, `targetSdk = 35`, `applicationId = "com.yournextbg.app"`, `versionCode = 1`, `versionName = "0.1.0"`, `buildFeatures { compose = true; buildConfig = true }`, Java 17 toolchain.
- `src/main/AndroidManifest.xml`: single-activity, `android:theme="@style/Theme.YourNextBg"` placeholder.
- `MainActivity.kt`: sets a `Text("yournextbg")` Compose root.
- Acceptance: `./gradlew :app:assembleDebug` succeeds; APK installs and shows "yournextbg" on an emulator.

### Task 0.5 — `local.properties` template + `BuildConfig` injection

- Document required local-only properties in `android/README.md`: `sdk.dir`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SENTRY_DSN`, `POSTHOG_API_KEY`, `POSTHOG_HOST`, `GOOGLE_WEB_CLIENT_ID`.
- App `build.gradle.kts` reads from `local.properties` (or env), emits as `buildConfigField` strings. Missing values fall back to empty + a Gradle warning, not a build failure (so CI can build before secrets are wired).
- Acceptance: `BuildConfig.SUPABASE_URL` is non-empty in debug builds when `local.properties` is populated; build still succeeds when it isn't.

### Task 0.6 — Cardstock token data class + light/dark colors

- `app/src/main/java/com/yournextbg/app/ui/theme/CardstockColors.kt`: `@Immutable data class CardstockColors(...)` with all token slots from `globals.css` lines 35–75 — paper variants, ink variants, branch colors, positive/negative. Two `val CardstockLight` + `val CardstockDark` instances with hex values copy-pasted from `globals.css`.
- `LocalCardstock` = `staticCompositionLocalOf<CardstockColors> { error(...) }`.
- Unit test (`app/src/test/.../CardstockColorsTest.kt`): every field on Light and Dark is non-equal to `Color.Unspecified` and every hex matches the `globals.css` value verbatim (test reads `globals.css` from `../src/app/globals.css` to prevent drift).
- Acceptance: `./gradlew :app:testDebugUnitTest` passes; if anyone updates a token in `globals.css` without mirroring it here, the test fails.

### Task 0.7 — `CardstockTheme` composable wrapping `MaterialTheme`

- `ui/theme/CardstockTheme.kt`: composable accepts `darkTheme: Boolean = isSystemInDarkTheme()`, builds Material `ColorScheme` mapping (`background = cs.paperDeep`, `surface = cs.paper`, `onSurface = cs.ink`, `primary = cs.branchInteraction`), provides `LocalCardstock`, wraps `MaterialTheme(colorScheme, typography, content)`.
- `CardstockTypography.kt`: Material `Typography` with `Fraunces` (display/headline/title) + `JetBrains Mono` (body for numeric/score readout). Fonts added under `app/src/main/res/font/` as `.ttf` (sourced from Google Fonts; commit verbatim).
- `MainActivity` wraps content in `CardstockTheme {}`.
- Acceptance: a `@Preview` of `Text("yournextbg", style = MaterialTheme.typography.displayLarge)` renders on the Cardstock paper background in both light + dark previews.

### Task 0.8 — Supabase client singleton (no auth yet, just smoke)

- `data/supabase/SupabaseService.kt`: `object SupabaseService { val client = createSupabaseClient(BuildConfig.SUPABASE_URL, BuildConfig.SUPABASE_ANON_KEY) { install(Auth); install(Postgrest); install(Storage) } }`.
- Smoke test (instrumented or simple `runBlocking` debug button on a hidden dev screen): `client.from("games").select { limit(1) }.decodeList<JsonElement>()` returns >= 1 row. **Read-only**, no write — confirms RLS lets anon SELECT on `games`.
- Acceptance: smoke returns a non-empty list on a real device against the prod Supabase project.

### Task 0.9 — OpenAPI client generation wired via Gradle

- Apply `org.openapi.generator` plugin in `:app`. Generator config: `generatorName = "kotlin"`, `library = "jvm-ktor"`, `inputSpec = "$rootDir/../contract/openapi.yaml"`, `outputDir = "$buildDir/generated/openapi"`, `serializationLibrary = "kotlinx_serialization"`, `packageName = "com.yournextbg.app.generated.api"`.
- Add the generated sources to the main source set.
- Wrap in `data/api/EdgeFunctions.kt` — a thin interface that exposes only `suspend fun bggSync(...)` and `suspend fun resizeCover(...)` returning typed responses. Consumers depend on the wrapper, never on generated types.
- **Note for executor:** the contract defines only two operations — `resize-cover` (service-role only, will NOT be called from the app) and `bgg-sync`. The recommender's `similar_games` is a Postgres RPC, called via `supabase-kt` postgrest, not through the OpenAPI client. Plan this accordingly in Phase 3.
- Acceptance: `./gradlew :app:assembleDebug` runs `openApiGenerate` as a dependency and produces compiled Kotlin under `build/generated/openapi/`. `EdgeFunctions.bggSync()` is a typed function in the IDE.

### Task 0.10 — Phase 0 gate (human-blocked)

- The executor agent stops here and surfaces the preconditions checklist (top of this file) plus the contract status to the user. Phase 1 does not start until the user confirms every blocked precondition is satisfied OR explicitly waives it.
- Acceptance: an explicit user-acknowledged "Phase 0 gate passed" comment in the runbook (`docs/runbook.md` Android section).

---

## Phase 1 — Auth

Goal: a signed-in session that survives process death.

### Task 1.1 — Deep-link intent filter

- `AndroidManifest.xml`: add `<intent-filter>` on `MainActivity` for scheme `yournextbg`, host `auth`, path `/callback`.
- Acceptance: `adb shell am start -W -a android.intent.action.VIEW -d "yournextbg://auth/callback?token=foo" com.yournextbg.app` launches the app.

### Task 1.2 — `AuthRepository` with `StateFlow<AuthState>`

- `data/auth/AuthState.kt`: `sealed interface AuthState { object Loading; object SignedOut; data class SignedIn(val userId: String, val email: String?): AuthState }`.
- `data/auth/AuthRepository.kt`: wraps `SupabaseService.client.auth`. Exposes `val state: StateFlow<AuthState>` derived from `auth.sessionStatus`. Methods: `signInWithEmail(email, password)`, `signInWithMagicLink(email)`, `signInWithGoogle(idToken)`, `signOut()`, `deleteAccount()` (calls existing RPC if plan 01 shipped one; otherwise stubs + TODO).
- Unit test using fake `Auth` (or `Turbine` on the flow): emitting a `SignedIn` SessionStatus flips `state` to `AuthState.SignedIn`.
- Acceptance: tests green; manual `signInWithEmail` against a test user yields a session that survives `adb shell am force-stop`.

### Task 1.3 — Google Sign-In via Credential Manager

- Add `androidx.credentials:credentials` + `androidx.credentials:credentials-play-services-auth` + `com.google.android.libraries.identity.googleid:googleid`.
- `ui/auth/GoogleSignInController.kt`: builds `GetCredentialRequest` with `GetGoogleIdOption(serverClientId = BuildConfig.GOOGLE_WEB_CLIENT_ID, filterByAuthorizedAccounts = false)`. On success, extracts `googleIdToken`, passes to `AuthRepository.signInWithGoogle(...)`, which calls `auth.signInWith(IDToken) { idToken=...; provider=Google }`.
- Acceptance: on a device with a Google account, tapping "Continue with Google" completes and produces an `AuthState.SignedIn`. Bad-token path is logged but doesn't crash.

### Task 1.4 — Login screen (Compose)

- `ui/auth/LoginScreen.kt`: vertical stack matching `prod-auth.jsx` mobile viewport — logo wordmark, email field, password field, "Sign in" button, "Send magic link" link, "Continue with Google" button. Cardstock-themed Material 3 `TextField` + `Button`.
- `LoginViewModel`: state machine for email/password validity, loading, error toast.
- Apple sign-in omitted (Android does not require it).
- Acceptance: `@Preview` light + dark renders; manual e2e: a real user can sign up + sign in via email/password and via magic link.

### Task 1.5 — Auth-gated nav root

- `MainActivity` observes `AuthRepository.state`. While `Loading`, splash. `SignedOut` → `LoginScreen`. `SignedIn` → main scaffold (Phase 2).
- Sign-out from Profile (Task 3.6) returns to `LoginScreen` immediately.
- Acceptance: cold launch with an existing session lands on the shelf; cold launch without one lands on login.

---

## Phase 2 — Navigation shell + scoring port

These can land in either order; they're independent. Phase 3 screens depend on both.

### Task 2.1 — Bottom-nav scaffold + `NavHost`

- `ui/nav/CardstockBottomBar.kt`: `NavigationBar` with five items: Shelf · Rate · Recs · Lens · Profile. Selected item uses `cs.branchInteraction` as indicator + label color.
- `ui/nav/AppNavHost.kt`: routes `shelf`, `rate`, `recs`, `lens?a={a}&b={b}`, `profile`, `game/{slug}`. Empty placeholder screens per route.
- Acceptance: tapping each tab swaps the placeholder; back stack behaves (back from a tab does NOT pop, exits app from the start destination per Material spec).

### Task 2.2 — Scoring engine port (TDD)

- Port `src/lib/scoring/` to `app/src/main/java/com/yournextbg/app/data/scoring/`. Match file structure + names — `Axes.kt`, `Lenses.kt`, `Similarity.kt`, `Branches.kt`.
- **TDD:** for each pure function (`distance`, `lensWeights`, `branchScore`, `rankSimilar`), write a Kotlin test in `app/src/test/.../scoring/` that mirrors a JS unit-test case from the web side. Use the same fixtures (3–5 hand-picked games' score vectors) — port them verbatim as Kotlin `data class` instances.
- Cross-platform parity check: for each test case, the Kotlin result must be `==` to the JS result (use string-formatted numbers to avoid float drift; tolerance 1e-6).
- Acceptance: >= 30 unit tests; `./gradlew :app:testDebugUnitTest` green; deliberate corruption of the score vector order (swap two indices) makes >= 5 tests fail.

### Task 2.3 — Games repository (read path only)

- `data/games/GamesRepository.kt`: `suspend fun list(): List<Game>`, `suspend fun bySlug(slug: String): Game?`, `suspend fun similar(anchorId: String, lens: Lens): List<Game>` — last one calls the `similar_games` RPC (`client.postgrest.rpc("similar_games", { anchor_id = ...; lens = ... })`).
- `data/models/Game.kt`: data class with `@SerialName` matching DB columns. `axesVec: List<Double>` length 12.
- Acceptance: instrumented test (or a debug-screen button) fetches `list()` and `similar(<known-anchor>, Lens.Standard)` and prints non-empty results.

### Task 2.4 — User collection repository

- `data/collection/CollectionRepository.kt`: `flowOf(userId)` → `Flow<List<UserGame>>` listening to `collection_items` table. Methods: `add(gameId, state)`, `remove(gameId)`, `rate(gameId, rating: Int)`.
- Acceptance: tests stub the postgrest layer and confirm `rate` triggers an upsert; smoke against prod with a test user mutates and re-reads correctly.

---

## Phase 3 — Screens

Each screen task is sized to be deliverable in one sitting. ViewModel + Compose UI + `@Preview`. Behavior parity with the web equivalent.

### Task 3.1 — Shelf screen

- `LazyVerticalGrid(GridCells.Adaptive(minSize = 140.dp))` of `ShelfCard` (cover + title + pending-scoring badge if `score_status == "unscored"`).
- Pull-to-refresh via Compose Material `PullToRefreshBox`.
- "+ Add" FAB → modal `ModalBottomSheet` with typeahead search (debounced `flow` against `GamesRepository.list()` filtered locally for v2 — scale concerns deferred).
- Acceptance: shelf for a test user with >= 5 collection items renders correctly in light + dark; pull-to-refresh re-fetches; adding a game updates the grid.

### Task 3.2 — Rate flow

- Card stack via `Box` with rotated/offset siblings (top 3 cards visible).
- `Modifier.draggable` + `Modifier.pointerInput` for swipe; threshold 30% of width triggers next.
- Five rating stamp buttons (★1–★5) in a horizontal row beneath the card; tap triggers `CollectionRepository.rate(...)`, applies optimistic UI update, advances the stack.
- Haptics: `LocalView.current.performHapticFeedback(HapticFeedbackConstants.CONFIRM)`.
- Acceptance: rating 10 games in a row never blocks the UI > 16ms (verify with Layout Inspector / Macrobenchmark on a Pixel 6a class device).

### Task 3.3 — Recommendations screen

- `LazyColumn` of `ProfileRecCard` rows. Source: a `recommendations` ViewModel that computes profile-mode picks from the user's rated games + the in-memory scoring engine (Task 2.2) + the games repo.
- Each row has "Open in lens" → navigates `lens?a={user-anchor-id}&b={rec-id}`. "Dismiss" via `SwipeToDismissBox` (Material 3).
- Acceptance: a user with >= 3 ratings sees >= 10 recs sorted by computed score; dismiss persists across navigation.

### Task 3.4 — Lens screen

- Layout: header → horizontal `LazyRow` of lens chips → A picker → swap icon button → B picker → radar canvas → similar list.
- Radar: custom `Canvas` composable drawing 12 spokes + two polygons (A in `cs.branchInteraction`, B in `cs.branchThinking`). Reads axes via Task 2.2.
- Lens chip change re-ranks the "similar" list in-memory (no network) — target < 16ms on Pixel 6a.
- Acceptance: change lens, see similar list reorder; swap A↔B, see polygons swap; `@Preview` of radar renders identically light + dark.

### Task 3.5 — Game detail

- Hero image via `coil3.compose.AsyncImage(model = coverUrl, contentScale = ContentScale.Crop)`.
- Four `BranchBlock` composables (one per branch), each showing branch label + 3 axis bars.
- 5-item horizontal `LazyRow` for "Similar" (re-uses Task 2.3 `similar()` with `Lens.Standard`).
- Acceptance: navigate from shelf tile to detail and back; share intent (`Intent.ACTION_SEND` with `https://yournextbg.com/games/{slug}`) works.

### Task 3.6 — Profile / Settings

- `LazyColumn` with section headers: Account · Preferences · About.
- Dark mode toggle: `Switch` writing to `user_prefs.theme` ("light" | "dark" | "system"). App re-themes immediately via a `themeOverride: StateFlow<String?>` observed by `CardstockTheme`.
- BGG sync section: username field + "Sync now" button → calls `EdgeFunctions.bggSync()`. Shows last sync time + counts (owned/wishlist/new_unscored from the typed response).
- Sign-out button.
- Delete-account confirmation dialog (calls plan-01 RPC if it exists; otherwise opens a mailto to the founder).
- Acceptance: theme toggle survives backgrounding; BGG sync against a test user with a public BGG profile returns non-zero counts; sign-out returns to login.

---

## Phase 4 — Cross-cutting

### Task 4.1 — Coil 3 image loader configured

- Application `onCreate`: `SingletonImageLoader.setSafe { ImageLoader.Builder(this).diskCache { DiskCache.Builder().directory(cacheDir.resolve("image_cache")).maxSizeBytes(256L * 1024 * 1024).build() }.build() }`.
- Acceptance: cold-load a shelf of 20 covers, kill the app, re-launch — covers paint from cache (< 50ms median per tile per Layout Inspector).

### Task 4.2 — Sentry init

- `App.kt` (Application subclass): `SentryAndroid.init(this) { it.dsn = BuildConfig.SENTRY_DSN; it.tracesSampleRate = 0.1 }`.
- Crash a test build via a hidden debug button (`throw RuntimeException("sentry test")`); confirm event lands in Sentry.
- Acceptance: a test crash appears in Sentry within 60s with mapped stack traces (ProGuard mapping upload step included in Task 4.4 CI).

### Task 4.3 — PostHog init + identify on login

- `App.onCreate`: `PostHogAndroid.setup(this, PostHogAndroidConfig(apiKey = BuildConfig.POSTHOG_API_KEY, host = BuildConfig.POSTHOG_HOST))`.
- On `AuthState.SignedIn`, call `PostHog.identify(userId)`. On sign-out, `PostHog.reset()`.
- Mirror web event taxonomy: `screen_view`, `game_rated`, `bgg_synced`, `lens_changed`, `recommendation_clicked`.
- Acceptance: events visible in PostHog dashboard within 60s of action.

### Task 4.4 — GitHub Actions CI

- `.github/workflows/android-ci.yml`: Ubuntu runner, JDK 17, Gradle cache, runs `./gradlew test lint assembleDebug` on every PR touching `android/**` or `contract/**`.
- A separate release workflow gated on a tag `android-vX.Y.Z`: runs fastlane lane `play_internal`, requires secrets `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`, `PLAY_JSON_KEY_BASE64`.
- Acceptance: a PR that breaks a unit test fails CI; a green PR ships an artifact (debug APK) downloadable from the run.

### Task 4.5 — fastlane setup

- `android/fastlane/Fastfile`: lanes `play_internal` (uploads AAB to internal track), `play_closed`, `play_production`.
- Uses `supply` action; service account JSON in `PLAY_JSON_KEY_BASE64`.
- `Appfile`: package_name `com.yournextbg.app`.
- Acceptance: locally, `bundle exec fastlane play_internal` succeeds against a real Play Console (or dry-run with `--skip_upload_changelogs --skip_upload_screenshots`).

### Task 4.6 — R8 + ProGuard rules

- `app/build.gradle.kts`: `release { isMinifyEnabled = true; isShrinkResources = true; proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro") }`.
- `proguard-rules.pro`: keep rules for kotlinx.serialization, supabase-kt models, Coil 3 (per their official ProGuard configs).
- Acceptance: release AAB < 20MB; smoke install + sign-in + browse shelf works on release variant.

---

## Phase 5 — Release prep

### Task 5.1 — Play Console listing assets

- 8 phone screenshots (light or dark, your choice — be consistent), 1 feature graphic 1024×500, app icon 512×512, short + long description (mirror web hero copy).
- Privacy policy URL: re-use yournextbg.com/privacy (plan 02 should have shipped this; if not, surface to user).
- Acceptance: listing draft saved in Play Console, all required fields green.

### Task 5.2 — Internal testing track distribution

- Add tester emails (you + close friends) to the internal track.
- Submit an AAB via `fastlane play_internal`. Wait for review (usually < 1h).
- Acceptance: testers receive the Play Store invite link and can install via Play Store.

### Task 5.3 — Smoke test matrix

- Devices: Pixel 6a (API 34) physical or emulator, Samsung Galaxy A54 (API 34) emulator profile, one API-26 device/emulator.
- Per device, walk through: cold launch, sign in, shelf loads, rate a game, change lens, open detail, sign out. Measure cold-start with `adb shell am start -W` → target < 900ms on Pixel 6a.
- Acceptance: all three devices complete the walkthrough without crashes; perf target met or a follow-up issue filed.

### Task 5.4 — Compose UI tests for two critical flows

- `app/src/androidTest/.../AuthFlowTest.kt`: enters email + password → asserts shelf appears.
- `app/src/androidTest/.../RateFlowTest.kt`: opens rate, taps ★4, asserts the next card is shown.
- Acceptance: both run green on the CI emulator job (added as a separate workflow if the basic CI runner is too slow).

### Task 5.5 — Closed testing rollout

- After 1 week of internal-track stability, promote to closed testing (~50 testers).
- Acceptance: closed track live; feedback collection mechanism (email or a Discord channel) live.

### Task 5.6 — Production staged rollout

- 1% → 10% → 100% over 5 days, gated on Sentry crash-free-sessions > 99.5% at each step.
- Acceptance: production listing live at 100%.

---

## Phase 6 — Finishing

### Task 6.1 — Runbook update

- Append an "Android" section to `docs/runbook.md` covering: how to build locally, where keystores live, how to cut a release, how to bump version code/name, common debugging commands (`adb logcat -v color`, `adb shell pm clear com.yournextbg.app`, `bundletool` for sideloading AABs).

### Task 6.2 — `superpowers:finishing-a-development-branch`

- Run the skill against this branch.
- Present merge options to the user (do NOT auto-merge).

---

## Definition of done

- App builds clean on Android Studio Ladybug+ (or current).
- All seven screens shipped + functionally on par with web.
- Scoring port has cross-platform parity tests against the JS engine.
- Play Internal testing build distributed; smoke tests pass on the matrix in Task 5.3.
- Sentry + PostHog populating data.
- fastlane lane `play_internal` ships AAB from CI on a tag.
- Play Store production approval received + 100% rollout achieved.
- AAB < 20MB (release variant with R8).
- Cold start < 900ms on Pixel 6a.

---

## Open decisions

These were "to revisit at v2 kickoff" in the original outline. Resolved here, but flagged so future readers know:

1. **DI: Hilt or manual?** → **Manual** for v2. Single-activity, ~7 screens, ~5 repositories. Hilt earns its keep at larger scopes.
2. **State: Compose State + ViewModel vs. Flow-everywhere?** → **ViewModel + StateFlow** as the default. Compose `mutableStateOf` for purely-local UI state.
3. **Tablet layouts?** → Use Material 3 `WindowSizeClass`; phone-portrait is the only first-class target for v2.
4. **Wear OS, Android Auto?** → Out of scope.
5. **Realtime subscriptions on the shelf?** → Skipped for v2 (Phase 0 includes `realtime-kt` only because supabase-kt bundles it; we don't subscribe). Re-evaluate if multi-device write races surface.

---

## Risks

| # | Risk | Mitigation |
|---|---|---|
| 1 | OpenAPI generator drift breaks build silently when contract changes | Task 4.4 CI re-runs `openApiGenerate` on every push; contract change requires user sign-off (per dispatch instructions). |
| 2 | supabase-kt 3.x API breaks vs. 2.x docs LLM was trained on | Pin exact version in the version catalog; cross-check every API call against the supabase-kt repo before writing. |
| 3 | Cardstock light theme is low-contrast on bright phone screens outdoors | Material's contrast checking via `ColorScheme` + a Lighthouse-equivalent pass in Task 5.3. |
| 4 | Cold start > 900ms target due to Sentry + PostHog init | Defer non-critical init via `DefaultLifecycleObserver` after first frame; baseline + budget in Task 5.3. |
| 5 | Play Console first submission rejected for policy issue (data safety form, sensitive permissions) | Task 5.1 fills the data-safety form carefully; only declare permissions actually used (`INTERNET`, `POST_NOTIFICATIONS` only if push lands later — skipped for v2 per plan 00). |
