package com.yournextbg.app.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.yournextbg.app.data.auth.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/**
 * State machine for the login screen.
 *
 * The screen has three modes:
 *  - Password — email + password fields, "Sign in" button.
 *  - MagicLink — email field only, "Send magic link" button.
 *  - Loading / Success / Error — transient states.
 *
 * Google Sign-In is its own button; the controller lives separately in
 * [GoogleSignInController] (Task 1.3) and is currently disabled at the UI
 * level until `BuildConfig.GOOGLE_WEB_CLIENT_ID` is populated.
 */
class LoginViewModel(
    private val auth: AuthRepository = AuthRepository.default,
) : ViewModel() {

    data class UiState(
        val mode: Mode = Mode.Password,
        val email: String = "",
        val password: String = "",
        val isSubmitting: Boolean = false,
        val errorMessage: String? = null,
        val infoMessage: String? = null,
    )

    enum class Mode { Password, MagicLink }

    private val _state = MutableStateFlow(UiState())
    val state: StateFlow<UiState> = _state.asStateFlow()

    fun onEmailChange(value: String) {
        _state.update { it.copy(email = value, errorMessage = null) }
    }

    fun onPasswordChange(value: String) {
        _state.update { it.copy(password = value, errorMessage = null) }
    }

    fun setMode(mode: Mode) {
        _state.update {
            it.copy(mode = mode, errorMessage = null, infoMessage = null)
        }
    }

    fun submit() {
        val current = _state.value
        if (current.isSubmitting) return

        val email = current.email.trim()
        if (!isValidEmail(email)) {
            _state.update { it.copy(errorMessage = "Enter a valid email address.") }
            return
        }

        _state.update { it.copy(isSubmitting = true, errorMessage = null, infoMessage = null) }
        viewModelScope.launch {
            try {
                when (current.mode) {
                    Mode.Password -> {
                        if (current.password.length < 8) {
                            _state.update {
                                it.copy(
                                    isSubmitting = false,
                                    errorMessage = "Password must be at least 8 characters.",
                                )
                            }
                            return@launch
                        }
                        auth.signInWithEmail(email, current.password)
                        _state.update { it.copy(isSubmitting = false) }
                    }

                    Mode.MagicLink -> {
                        auth.signInWithMagicLink(email)
                        _state.update {
                            it.copy(
                                isSubmitting = false,
                                infoMessage = "Magic link sent — check your inbox.",
                            )
                        }
                    }
                }
            } catch (e: Exception) {
                _state.update {
                    it.copy(
                        isSubmitting = false,
                        errorMessage = e.message ?: "Sign-in failed. Try again.",
                    )
                }
            }
        }
    }

    private fun isValidEmail(s: String): Boolean =
        s.contains("@") && s.contains(".") && s.length >= 5
}
