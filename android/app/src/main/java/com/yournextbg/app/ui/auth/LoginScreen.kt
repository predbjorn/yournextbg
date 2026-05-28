package com.yournextbg.app.ui.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.yournextbg.app.BuildConfig
import com.yournextbg.app.ui.theme.CardstockTheme
import com.yournextbg.app.ui.theme.LocalCardstock

/**
 * Login screen — mirrors the web /login page on a mobile viewport.
 *
 * Layout: wordmark → email field → (password field if Password mode) →
 * primary CTA → mode toggle ("Send magic link" ↔ "Use password") →
 * divider → Google Sign-In button (disabled until GOOGLE_WEB_CLIENT_ID
 * is configured).
 */
@Composable
fun LoginScreen(
    viewModel: LoginViewModel = viewModel(),
) {
    val state by viewModel.state.collectAsState()
    LoginScreenContent(
        state = state,
        onEmailChange = viewModel::onEmailChange,
        onPasswordChange = viewModel::onPasswordChange,
        onSubmit = viewModel::submit,
        onModeChange = viewModel::setMode,
    )
}

@Composable
private fun LoginScreenContent(
    state: LoginViewModel.UiState,
    onEmailChange: (String) -> Unit,
    onPasswordChange: (String) -> Unit,
    onSubmit: () -> Unit,
    onModeChange: (LoginViewModel.Mode) -> Unit,
) {
    val cs = LocalCardstock.current
    val googleConfigured = BuildConfig.GOOGLE_WEB_CLIENT_ID.isNotBlank()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(cs.paperDeep))
            .padding(PaddingValues(horizontal = 24.dp, vertical = 32.dp)),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            modifier = Modifier.widthIn(max = 420.dp),
            horizontalAlignment = Alignment.Start,
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Text(
                text = "yournextbg",
                style = MaterialTheme.typography.displayMedium,
                color = Color(cs.ink),
            )
            Text(
                text = when (state.mode) {
                    LoginViewModel.Mode.Password -> "Sign in to your shelf."
                    LoginViewModel.Mode.MagicLink -> "Get a one-tap sign-in link by email."
                },
                style = MaterialTheme.typography.bodyMedium,
                color = Color(cs.muted),
            )

            Spacer(Modifier.height(8.dp))

            OutlinedTextField(
                value = state.email,
                onValueChange = onEmailChange,
                label = { Text("Email") },
                singleLine = true,
                enabled = !state.isSubmitting,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                modifier = Modifier.fillMaxSize().height(64.dp),
            )

            if (state.mode == LoginViewModel.Mode.Password) {
                OutlinedTextField(
                    value = state.password,
                    onValueChange = onPasswordChange,
                    label = { Text("Password") },
                    singleLine = true,
                    enabled = !state.isSubmitting,
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    modifier = Modifier.fillMaxSize().height(64.dp),
                )
            }

            state.errorMessage?.let {
                Text(text = it, color = Color(cs.negative), style = MaterialTheme.typography.bodyMedium)
            }
            state.infoMessage?.let {
                Text(text = it, color = Color(cs.positive), style = MaterialTheme.typography.bodyMedium)
            }

            Button(
                onClick = onSubmit,
                enabled = !state.isSubmitting,
                modifier = Modifier.fillMaxSize().height(56.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(cs.branchInteraction),
                    contentColor = Color(cs.paper),
                ),
            ) {
                if (state.isSubmitting) {
                    CircularProgressIndicator(
                        color = Color(cs.paper),
                        strokeWidth = 2.dp,
                        modifier = Modifier.height(20.dp),
                    )
                } else {
                    Text(
                        text = when (state.mode) {
                            LoginViewModel.Mode.Password -> "Sign in"
                            LoginViewModel.Mode.MagicLink -> "Send magic link"
                        },
                    )
                }
            }

            TextButton(
                onClick = {
                    onModeChange(
                        if (state.mode == LoginViewModel.Mode.Password) LoginViewModel.Mode.MagicLink
                        else LoginViewModel.Mode.Password,
                    )
                },
                modifier = Modifier.fillMaxSize().height(40.dp),
            ) {
                Text(
                    text = when (state.mode) {
                        LoginViewModel.Mode.Password -> "Send magic link instead"
                        LoginViewModel.Mode.MagicLink -> "Use password instead"
                    },
                    color = Color(cs.muted),
                    style = MaterialTheme.typography.bodyMedium,
                )
            }

            Spacer(Modifier.height(8.dp))

            OutlinedButton(
                onClick = { /* Wired in Task 1.3 once GOOGLE_WEB_CLIENT_ID lands */ },
                enabled = googleConfigured,
                modifier = Modifier.fillMaxSize().height(56.dp),
            ) {
                Text(
                    text = if (googleConfigured) "Continue with Google"
                    else "Continue with Google (coming soon)",
                    color = Color(if (googleConfigured) cs.ink else cs.muted),
                )
            }
        }
    }
}

@Preview(name = "Login — light", showBackground = true)
@Composable
private fun LoginScreenLightPreview() {
    CardstockTheme(darkTheme = false) {
        LoginScreenContent(
            state = LoginViewModel.UiState(email = "preben@norscare.com"),
            onEmailChange = {},
            onPasswordChange = {},
            onSubmit = {},
            onModeChange = {},
        )
    }
}

@Preview(name = "Login — dark", showBackground = true)
@Composable
private fun LoginScreenDarkPreview() {
    CardstockTheme(darkTheme = true) {
        LoginScreenContent(
            state = LoginViewModel.UiState(
                mode = LoginViewModel.Mode.MagicLink,
                email = "preben@norscare.com",
                infoMessage = "Magic link sent — check your inbox.",
            ),
            onEmailChange = {},
            onPasswordChange = {},
            onSubmit = {},
            onModeChange = {},
        )
    }
}
