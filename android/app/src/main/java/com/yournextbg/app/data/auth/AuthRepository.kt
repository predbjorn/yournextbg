package com.yournextbg.app.data.auth

import com.yournextbg.app.data.supabase.SupabaseService
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.OtpType
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.Google
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.auth.providers.builtin.IDToken
import io.github.jan.supabase.auth.providers.builtin.OTP
import io.github.jan.supabase.auth.status.SessionStatus
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn

/**
 * Wraps supabase-kt's auth surface and projects [SessionStatus] onto the
 * narrower [AuthState] the UI consumes.
 *
 * Methods are suspend (or return Unit and throw) so the calling ViewModel
 * owns error mapping + UI loading state. supabase-kt handles persistence
 * (SettingsSessionManager on Android) so sessions survive process death.
 *
 * For testability, the SupabaseClient is injected; production callers use
 * [companionDefault] which binds to [SupabaseService.client].
 */
class AuthRepository(
    private val client: SupabaseClient,
    scope: CoroutineScope = CoroutineScope(SupervisorJob()),
) {

    val state: StateFlow<AuthState> = client.auth.sessionStatus
        .map(::toAuthState)
        .stateIn(scope, SharingStarted.Eagerly, AuthState.Loading)

    /** Sign in with email + password. Throws supabase-kt's AuthRestException on failure. */
    suspend fun signInWithEmail(email: String, password: String) {
        client.auth.signInWith(Email) {
            this.email = email
            this.password = password
        }
    }

    /** Create a new account with email + password. Sends a confirmation email if the project requires it. */
    suspend fun signUpWithEmail(email: String, password: String) {
        client.auth.signUpWith(Email) {
            this.email = email
            this.password = password
        }
    }

    /**
     * Send a magic-link email. The user clicks the link → app launches via
     * `yournextbg://auth/callback?...` and supabase-kt swaps it for a session.
     */
    suspend fun signInWithMagicLink(email: String) {
        client.auth.signInWith(OTP) {
            this.email = email
            createUser = true
        }
    }

    /**
     * Verify the 6-digit code from an email OTP (alternative to the magic link
     * tap). Used by the fallback "I'd rather type the code" path on the login
     * screen.
     */
    suspend fun verifyEmailOtp(email: String, token: String) {
        client.auth.verifyEmailOtp(type = OtpType.Email.MAGIC_LINK, email = email, token = token)
    }

    /**
     * Complete Google Sign-In with an ID token obtained from Credential Manager.
     * Wiring of the Credential Manager flow lives in [ui.auth.GoogleSignInController]
     * — but that flow stays dormant until `BuildConfig.GOOGLE_WEB_CLIENT_ID` is
     * populated (see local.properties.example).
     */
    suspend fun signInWithGoogle(idToken: String, nonce: String? = null) {
        client.auth.signInWith(IDToken) {
            this.idToken = idToken
            this.nonce = nonce
            this.provider = Google
        }
    }

    /** Drop the current session locally and revoke it server-side. */
    suspend fun signOut() {
        client.auth.signOut()
    }

    /**
     * Delete the account. The web side ships an RPC `delete_self_account`
     * (plan 01); call it here. If the RPC is missing on this Supabase
     * project, the postgrest layer throws and the UI surfaces a "contact
     * support" fallback.
     */
    suspend fun deleteAccount() {
        // TODO(plan-01): confirm RPC name + signature; gate behind a feature flag
        //  until the migration is verified live on the prod project.
        throw NotImplementedError("Account deletion RPC not yet verified on prod; surface a support mailto for now.")
    }

    companion object {
        /** Application-default repository bound to the singleton Supabase client. */
        val default: AuthRepository by lazy { AuthRepository(SupabaseService.client) }

        internal fun toAuthState(status: SessionStatus): AuthState = when (status) {
            is SessionStatus.Initializing -> AuthState.Loading
            is SessionStatus.RefreshFailure -> AuthState.SignedOut
            is SessionStatus.NotAuthenticated -> AuthState.SignedOut
            is SessionStatus.Authenticated -> {
                val user = status.session.user
                AuthState.SignedIn(
                    userId = user?.id.orEmpty(),
                    email = user?.email,
                )
            }
        }
    }
}
