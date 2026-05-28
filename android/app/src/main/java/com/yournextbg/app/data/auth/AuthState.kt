package com.yournextbg.app.data.auth

/**
 * App-facing snapshot of the current Supabase session. Derived from
 * supabase-kt's [io.github.jan.supabase.auth.status.SessionStatus] but
 * exposes only the fields the UI cares about so screens don't have to
 * import supabase-kt types.
 */
sealed interface AuthState {
    /** Initial state before supabase-kt has restored a session from disk. */
    data object Loading : AuthState

    /** No session, or session refresh failed irrecoverably. */
    data object SignedOut : AuthState

    /** Authenticated session in hand. */
    data class SignedIn(
        val userId: String,
        val email: String?,
    ) : AuthState
}
