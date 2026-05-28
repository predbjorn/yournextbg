# yournextbg — Android

Native Android app (Jetpack Compose) mirroring the seven web screens. Companion
to the web app at `../src` and the iOS app at `../ios`. Lives in a monorepo;
this module is fully self-contained under `android/`.

> Plan: `docs/plans/2026-05-23-04-android-compose.md` is the source of truth
> for scope, sequencing, and acceptance criteria. Read it before changing
> anything structural.

---

## Prerequisites

- **JDK 17** (Zulu, Temurin, or Azul). `./gradlew --version` must report
  `Daemon JVM: 17.x`.
- **Android SDK** — easiest path is to install Android Studio Ladybug (2024.2.1)
  or later, which manages the SDK. CLI-only is fine too; set `sdk.dir` in
  `local.properties` to your SDK install.
- **Gradle wrapper** is checked in. Use `./gradlew`, never a system `gradle`.

## First-time setup

```sh
cd android
cp local.properties.example local.properties
# fill in SUPABASE_*, SENTRY_DSN, POSTHOG_*, GOOGLE_WEB_CLIENT_ID as available.
# Empty values are tolerated by the build — see "Secrets" below.
./gradlew :app:assembleDebug
```

The Cardstock token drift test runs every build via `./gradlew test` — it
guards against the Android theme drifting from `src/app/globals.css`.

## Common commands

```sh
# Build everything (debug variant)
./gradlew :app:assembleDebug

# Run unit tests (includes Cardstock drift guard)
./gradlew :app:testDebugUnitTest

# Lint (Android Lint + Compose lint rules)
./gradlew :app:lintDebug

# Install on a connected device/emulator
./gradlew :app:installDebug
adb shell am start -n com.yournextbg.app/.MainActivity
```

## Secrets

All app-time secrets live in `local.properties` (gitignored). Read by
`app/build.gradle.kts` at configuration time and surfaced as `BuildConfig.*`:

| BuildConfig field         | Source                          | Required by  |
| ------------------------- | ------------------------------- | ------------ |
| `SUPABASE_URL`            | shared with web (`.env.local`)  | Phase 0.8+   |
| `SUPABASE_ANON_KEY`       | shared with web (`.env.local`)  | Phase 0.8+   |
| `SENTRY_DSN`              | sentry.io project settings      | Phase 4.2    |
| `POSTHOG_API_KEY`         | posthog.com project settings    | Phase 4.3    |
| `POSTHOG_HOST`            | usually `https://us.i.posthog.com` | Phase 4.3 |
| `GOOGLE_WEB_CLIENT_ID`    | GCP OAuth client (web type)     | Phase 1.3    |

Missing values cause a Gradle build warning, not a failure — fresh clones and
CI can build before secrets are wired. The app gates network calls behind a
non-empty check at runtime; Phase 1+ will refuse to start without the secrets
it actually needs.

**Never commit `local.properties` or any `*.keystore` / `*.jks` file.** The
gitignore at `android/.gitignore` already blocks them.

## Project layout

```
android/
  app/                     # the only Gradle module (single-activity app)
    src/main/
      java/com/yournextbg/app/
        MainActivity.kt
        YourNextBgApp.kt
        ui/theme/          # CardstockColors, CardstockTheme, CardstockTypography
        # … data/, ui/auth/, ui/nav/, etc. land in Phase 1+
      res/                 # XML themes, launcher icons, strings
      AndroidManifest.xml
    src/test/              # JVM unit tests (CardstockColorsTest is the drift guard)
    src/androidTest/       # Compose UI tests (Phase 5.4)
    build.gradle.kts
  gradle/
    libs.versions.toml     # single version catalog for the module
    wrapper/               # Gradle 8.9 wrapper
  build.gradle.kts         # root build script (plugins applied at module level)
  settings.gradle.kts
  gradle.properties
  local.properties.example # template — copy to local.properties
  README.md                # you are here
```

## Architecture (target — see plan for full detail)

- **Compose + Material 3**, theme-overridden to Cardstock. Stock Material
  components inherit the Cardstock palette via `CardstockTheme` so you rarely
  need bespoke styling.
- **Single activity + Navigation Compose**. Bottom-nav scaffold lands in
  Phase 2.1.
- **`supabase-kt`** for Auth, Postgrest, Storage, Realtime (Realtime unused in
  v2 — only bundled because `supabase-kt` includes it via BOM).
- **Edge functions** consumed through the OpenAPI generator (Kotlin + Ktor +
  kotlinx.serialization). The Recommender's `similar_games` is a Postgres
  RPC, not an edge function, so it goes through `supabase-kt postgrest` instead.
- **Scoring engine** is ported from `src/lib/scoring/` (Phase 2.2) with
  parity tests against the JS fixtures.
- **DI: manual constructor injection** for v2. Hilt earns its keep at larger
  scopes.

## Cardstock theme tokens

The Compose theme is the **shadow** of the web design system. Every color in
`ui/theme/CardstockColors.kt` mirrors a CSS custom property in
`src/app/globals.css` (lines 35–75). `CardstockColorsTest` asserts every hex
verbatim; if anyone changes a value in one place without the other, the test
fails.

If you intentionally change a token: update both, run
`./gradlew :app:testDebugUnitTest`, then verify the test passes.
