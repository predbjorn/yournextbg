package com.yournextbg.app.data.supabase

import com.yournextbg.app.BuildConfig
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.realtime.Realtime
import io.github.jan.supabase.storage.Storage

/**
 * App-wide [SupabaseClient] singleton. Wired against the same Supabase project
 * as the web app (project ref gkickjaihbgapowsqwhx) — same RLS, same tables,
 * same anon key. The session lives in supabase-kt's SettingsSessionManager,
 * which persists across process death once `Auth` is installed.
 *
 * URL + anon key come from BuildConfig (sourced from android/local.properties).
 * If either is blank we throw early — the app cannot function without a real
 * project. The Gradle layer is tolerant of empty values so CI compiles; this
 * runtime guard is the actual gate.
 */
object SupabaseService {

    val client: SupabaseClient by lazy {
        check(BuildConfig.SUPABASE_URL.isNotBlank()) {
            "BuildConfig.SUPABASE_URL is empty — populate android/local.properties before launching."
        }
        check(BuildConfig.SUPABASE_ANON_KEY.isNotBlank()) {
            "BuildConfig.SUPABASE_ANON_KEY is empty — populate android/local.properties before launching."
        }
        createSupabaseClient(
            supabaseUrl = BuildConfig.SUPABASE_URL,
            supabaseKey = BuildConfig.SUPABASE_ANON_KEY,
        ) {
            install(Auth)
            install(Postgrest)
            install(Storage)
            install(Realtime)
        }
    }
}
