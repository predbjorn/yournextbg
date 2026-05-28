import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.openapi.generator)
}

// Read local.properties (gitignored). Missing values fall through to "" so the
// build still succeeds on CI / fresh clones before secrets are wired. The real
// values are documented in android/README.md and android/local.properties.example.
val localProperties = Properties().apply {
    val f = rootProject.file("local.properties")
    if (f.exists()) f.inputStream().use { load(it) }
}

fun localOrEnv(key: String): String =
    localProperties.getProperty(key)
        ?: System.getenv(key)
        ?: ""

android {
    namespace = "com.yournextbg.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.yournextbg.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        // BuildConfig values sourced from local.properties (or env). Placeholders
        // ("") are acceptable — Task 0.8+ will assert non-empty before network calls.
        val supabaseUrl = localOrEnv("SUPABASE_URL")
        val supabaseAnonKey = localOrEnv("SUPABASE_ANON_KEY")
        val sentryDsn = localOrEnv("SENTRY_DSN")
        val posthogApiKey = localOrEnv("POSTHOG_API_KEY")
        val posthogHost = localOrEnv("POSTHOG_HOST").ifEmpty { "https://us.i.posthog.com" }
        val googleWebClientId = localOrEnv("GOOGLE_WEB_CLIENT_ID")

        listOf(
            "SUPABASE_URL" to supabaseUrl,
            "SUPABASE_ANON_KEY" to supabaseAnonKey,
            "SENTRY_DSN" to sentryDsn,
            "POSTHOG_API_KEY" to posthogApiKey,
            "POSTHOG_HOST" to posthogHost,
            "GOOGLE_WEB_CLIENT_ID" to googleWebClientId,
        ).forEach { (k, v) ->
            buildConfigField("String", k, "\"${v.replace("\"", "\\\"")}\"")
            if (v.isEmpty()) {
                logger.warn("[yournextbg] BuildConfig.$k is empty — drop a real value into android/local.properties when ready.")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
        }
        debug {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }

    sourceSets {
        getByName("main") {
            kotlin.srcDir(layout.buildDirectory.dir("generated/openapi/src/main/kotlin"))
        }
    }
}

// ─── OpenAPI client generation ─────────────────────────────────────────────
// Reads ../../contract/openapi.yaml (the single source of truth shared with
// the web + iOS apps) and emits a Kotlin + Ktor + kotlinx.serialization
// client under build/generated/openapi/. The wrapper in
// data/api/EdgeFunctions.kt narrows the generated surface to the two
// operations the app actually uses (bggSync; resizeCover is service-role
// only and never called from the device).
openApiGenerate {
    generatorName.set("kotlin")
    library.set("jvm-ktor")
    inputSpec.set("$rootDir/../contract/openapi.yaml")
    outputDir.set(layout.buildDirectory.dir("generated/openapi").get().asFile.path)
    apiPackage.set("com.yournextbg.app.generated.api")
    modelPackage.set("com.yournextbg.app.generated.models")
    invokerPackage.set("com.yournextbg.app.generated.invoker")
    packageName.set("com.yournextbg.app.generated")
    configOptions.set(
        mapOf(
            "serializationLibrary" to "kotlinx_serialization",
            "dateLibrary" to "kotlinx-datetime",
            "useCoroutines" to "true",
            "omitGradleWrapper" to "true",
            "omitGradlePluginVersions" to "true",
        ),
    )
    // Only generate sources; never re-generate gradle files into the build dir.
    generateApiTests.set(false)
    generateApiDocumentation.set(false)
    generateModelTests.set(false)
    generateModelDocumentation.set(false)
    skipOverwrite.set(false)
}

// Ensure generated sources exist before Kotlin compiles.
tasks.named("preBuild") {
    dependsOn("openApiGenerate")
}


dependencies {
    implementation(platform(libs.compose.bom))
    implementation(libs.compose.ui)
    implementation(libs.compose.ui.graphics)
    implementation(libs.compose.ui.tooling.preview)
    implementation(libs.compose.material3)
    implementation(libs.compose.material.icons.extended)

    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.material)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.navigation.compose)
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.androidx.lifecycle.viewmodel.compose)

    implementation(libs.kotlinx.coroutines.core)
    implementation(libs.kotlinx.coroutines.android)
    implementation(libs.kotlinx.serialization.json)
    implementation(libs.kotlinx.datetime)

    // Supabase (BOM aligns auth/postgrest/storage/realtime on one tested version)
    implementation(platform(libs.supabase.bom))
    implementation(libs.supabase.auth)
    implementation(libs.supabase.postgrest)
    implementation(libs.supabase.storage)
    implementation(libs.supabase.realtime)

    // Ktor HTTP engine for supabase-kt (OkHttp on Android)
    implementation(libs.ktor.client.core)
    implementation(libs.ktor.client.okhttp)
    implementation(libs.ktor.client.content.negotiation)
    implementation(libs.ktor.serialization.kotlinx.json)

    debugImplementation(libs.compose.ui.tooling)
    debugImplementation(libs.compose.ui.test.manifest)

    testImplementation(libs.junit)
    testImplementation(libs.kotlinx.coroutines.test)
    testImplementation(libs.turbine)
    testImplementation(libs.mockk)

    androidTestImplementation(platform(libs.compose.bom))
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(libs.compose.ui.test.junit4)
}
