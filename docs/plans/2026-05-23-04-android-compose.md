# Android (Jetpack Compose, v2) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.
> **Status: OUTLINE.** Like plan 03, this is v2. Re-grain into bite-sized TDD tasks when starting the Android phase. Designed to run in parallel with plan 03 once `contract/openapi.yaml` is stable.

**Goal:** Native Android app that mirrors the seven web screens, consuming the Supabase + edge-function surface. Cardstock design preserved on top of Material 3 components (theme override, not Material defaults).

**Architecture:** Jetpack Compose with single-activity + Navigation Compose. `supabase-kt` for auth + tables + RPCs. Kotlin OpenAPI generator (Kotlin client w/ kotlinx.serialization) consumes `contract/openapi.yaml` for edge-function calls. Theme tokens delivered via `CompositionLocal`.

**Tech Stack:** Kotlin 2.x, Jetpack Compose, Material 3, Android 14 (API 34) target / Android 8 (API 26) min, `supabase-kt`, `kotlinx.coroutines`, `kotlinx.serialization`, `Coil 3` (image loading), `Sentry-Android`, `posthog-android`, fastlane for Play Console delivery.

---

## Preconditions

- Plan 01 complete.
- Plan 02 complete (web v1 live).
- `contract/openapi.yaml` stable.
- Google Play Developer account ($25 one-time) active.
- App entry created in Play Console with package name `com.yournextbg.app`.
- Upload + production keystore generated; backups in 1Password.
- Sign-in with Google configured in Play Console + tied to Supabase OAuth provider.

---

## Phase 0 — Project setup

### Task 1: Gradle module + monorepo layout

- Create `android/` directory at the monorepo root.
- `android/build.gradle.kts`, `android/settings.gradle.kts`, `android/app/`.
- App-level `build.gradle.kts`:
  - `compileSdk = 34`, `minSdk = 26`, `targetSdk = 34`.
  - Compose BOM `2024.12.01` or latest.
  - Dependencies: `io.github.jan-tennert.supabase:gotrue-kt`, `postgrest-kt`, `storage-kt`, `realtime-kt` (auth+db+storage; realtime not used in v2 but free to include).
  - `io.coil-kt.coil3:coil-compose:3.x`.
  - `io.sentry:sentry-android:7.x`.
  - `com.posthog:posthog-android:3.x`.
- Verify build: `./gradlew :app:assembleDebug`.

### Task 2: OpenAPI Kotlin client generation

- Apply `org.openapi.generator` Gradle plugin pointed at `../contract/openapi.yaml`.
- Generator: `kotlin` with `library = jvm-ktor` (or `multiplatform` if you anticipate KMP later — but v2 is JVM-only, so keep simple).
- Generated client lands in `app/build/generated/openapi/`. Wrap in a thin service class so consumers depend on our interface, not the generated one.
- Hand-port table types (`Game`, `UserGame`, `UserPrefs`) into `data/models/` since Kotlin Supabase reads aren't auto-typed.

### Task 3: Theme tokens via CompositionLocal

- `ui/theme/CardstockColors.kt`:

```kotlin
@Immutable
data class CardstockColors(
    val paper: Color,
    val paperWarm: Color,
    val paperDeep: Color,
    val ink: Color,
    val inkSoft: Color,
    val muted: Color,
    val branchThinking: Color,
    val branchInteraction: Color,
    val branchLuck: Color,
    val branchExperience: Color,
)

val LocalCardstock = staticCompositionLocalOf<CardstockColors> {
    error("CardstockColors not provided")
}

val CardstockLight = CardstockColors(
    paper = Color(0xFFEFE6D0),
    paperWarm = Color(0xFFF5ECD6),
    paperDeep = Color(0xFFDCD0B8),
    ink = Color(0xFF1C1A14),
    /* … mirror prod-system.jsx LIGHT_TOKENS */
)
val CardstockDark = CardstockColors(/* mirror DARK_TOKENS */)
```

- `CardstockTheme` composable wraps `MaterialTheme` so Material defaults get Cardstock-flavored colors:

```kotlin
@Composable
fun CardstockTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val cs = if (darkTheme) CardstockDark else CardstockLight
    val materialScheme = if (darkTheme) {
        darkColorScheme(background = cs.paperDeep, onBackground = cs.ink, surface = cs.paper, onSurface = cs.ink, primary = cs.branchInteraction)
    } else {
        lightColorScheme(background = cs.paperDeep, onBackground = cs.ink, surface = cs.paper, onSurface = cs.ink, primary = cs.branchInteraction)
    }
    CompositionLocalProvider(LocalCardstock provides cs) {
        MaterialTheme(colorScheme = materialScheme, typography = CardstockTypography, content = content)
    }
}
```

### Task 4: Supabase client

- `data/supabase/Supabase.kt`:

```kotlin
object SupabaseService {
    val client = createSupabaseClient(
        supabaseUrl = "https://gkickjaihbgapowsqwhx.supabase.co",
        supabaseKey = BuildConfig.SUPABASE_ANON_KEY,
    ) {
        install(Auth)
        install(Postgrest)
        install(Storage)
    }
}
```

- `BuildConfig.SUPABASE_ANON_KEY` injected from `local.properties` (never committed). Service-role key is **never** in the APK.

---

## Phase 1 — Auth

### Task 5: Sign-in with Google (Credential Manager API)

- Use the new `androidx.credentials:credentials` API (replaces the deprecated Google Sign-In SDK).
- On success, exchange Google ID token with Supabase:

```kotlin
SupabaseService.client.auth.signInWith(IDToken) {
    idToken = googleIdToken
    provider = Google
}
```

### Task 6: Email/password + magic link

- Email/password forms.
- Magic link uses deep link `yournextbg://auth/callback`. Register in `AndroidManifest.xml` as an `intent-filter`.

### Task 7: Login screen

- Compose UI mirroring `prod-mobile.jsx` mobile login or `prod-auth.jsx` adapted for narrow viewport.
- `Material3 TextField`s with Cardstock theming applied.
- Apple sign-in: omit on Android (Apple's policy does not require it off-platform; only iOS needs it if Google is offered).

---

## Phase 2 — Navigation shell

### Task 8: Bottom navigation

Five destinations: Shelf · Rate · Recs · Lens · Profile. `NavigationBar` with Cardstock-colored selected indicator.

```kotlin
val nav = rememberNavController()
Scaffold(bottomBar = { CardstockBottomBar(nav) }) { pad ->
    NavHost(nav, startDestination = "shelf", Modifier.padding(pad)) {
        composable("shelf") { ShelfScreen(nav) }
        composable("rate") { RateScreen(nav) }
        composable("recs") { RecsScreen(nav) }
        composable("lens") { LensScreen(nav) }
        composable("profile") { ProfileScreen(nav) }
        composable("game/{slug}") { GameDetailScreen(it.arguments?.getString("slug")!!, nav) }
    }
}
```

---

## Phase 3 — Screens

### Task 9: Shelf

- `LazyVerticalGrid(GridCells.Adaptive(minSize = 140.dp))` of `ShelfCard`.
- `Pull-to-refresh` via Compose Material `PullRefreshIndicator`.
- `+ Add` FAB → modal `BottomSheet` with typeahead search.

### Task 10: Rate flow

- Card stack via `Box` with offsets/rotations. Use `Modifier.draggable` for swipe gestures.
- Haptics: `HapticFeedbackConstants.CONFIRM` via `View.performHapticFeedback`.
- Rating stamps as five large `Button`s.
- Optimistic update.

### Task 11: Recommendations

- `LazyColumn` of `ProfileRecCard` rows.
- "Compare in lens" navigates to `lens?a=user-anchor&b={rec.id}`.
- Dismiss action via swipe (Material 3 `SwipeToDismiss` API).

### Task 12: Lens

- Vertical layout: header → lens chip row (horizontal `LazyRow`) → A picker → swap button → B picker → radar → similar list.
- Radar: custom `Canvas` composable drawing 12 spokes + two polygons. Reuse the scoring engine port (Task 16).
- Lens chip changes re-rank in-memory; verify <16ms on Pixel 6a class device.

### Task 13: Game detail

- Hero image via Coil 3 `AsyncImage`.
- 4 `BranchBlock` composables.
- 5-item horizontal `LazyRow` for "Similar".

### Task 14: Profile / Settings

- `LazyColumn` with section headers.
- Dark mode toggle: `Switch` writing to `user_prefs.theme`. On selection, app re-themes immediately (theme provider observes flow).
- Sign-out button.
- Delete-account confirmation dialog.

---

## Phase 4 — Cross-cutting

### Task 15: Image loading

- Coil 3 `AsyncImage(model = coverUrl, contentScale = ContentScale.Crop)`.
- `ImageLoader` configured with 256MB disk cache.

### Task 16: Scoring engine port

- Port `src/lib/scoring/` to Kotlin in `data/scoring/`. Use the same names + structure.
- Unit tests in `app/src/test/` verifying parity with the web implementation. Run on every PR.

### Task 17: Observability

- `Sentry.init(this) { it.dsn = ... }` in `Application.onCreate`.
- `PostHog.with(this, PostHogAndroidConfig(apiKey, host))`.
- Identify user on login: `PostHog.identify(userId)`.
- Mirror the web's event taxonomy.

### Task 18: CI/CD

- `.github/workflows/android-ci.yml`:
  - Ubuntu runner.
  - Cache Gradle.
  - `./gradlew test lint assembleDebug` on every PR.
  - On push to main with tag `android-vX.Y.Z`, fastlane uploads AAB to Play internal track.
- fastlane stores `keystore.jks` + properties via base64 in secrets.

### Task 19: Play Console internal testing

- Internal testing track: you + close friends via Play Console emails.
- Closed testing (~50 testers) after 1 week.
- Production rollout staged 1% → 10% → 100% over 5 days.

---

## Open decisions to revisit at v2 kickoff

1. **DI: Hilt or manual?** Manual is simpler for the v2 scope; Hilt earns its keep at more screens.
2. **State management: Compose State + ViewModel, or Flow-everywhere?** Default to ViewModel for screens; only reach for Flow when needed.
3. **Tablet layouts?** Material 3 adaptive layouts give us a reasonable default; revisit if tablet usage shows up in analytics.
4. **Wear OS, Android Auto?** Out of scope for v2.

---

## Definition of done

- App builds clean on Android Studio Ladybug+ (or current).
- All seven screens shipped + functionally on par with web.
- Play Internal testing build distributed; smoke tests pass on Pixel 6a (API 34), Samsung Galaxy A54 (API 34), one API-26 device.
- Sentry + PostHog populating data.
- fastlane lane `release` ships AAB from CI.
- Play Store production approval received.
- APK <20MB (with `R8` minification on).
- Cold start <900ms on Pixel 6a.
