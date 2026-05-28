// Root build script for yournextbg Android.
// Concrete plugin versions live in gradle/libs.versions.toml (Task 0.3).
// Plugins are applied here with `apply false` so the version is declared once
// at the root and each module just references the alias.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.kotlin.serialization) apply false
    alias(libs.plugins.openapi.generator) apply false
}
