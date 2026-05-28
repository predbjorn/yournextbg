package com.yournextbg.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.tooling.preview.Preview
import com.yournextbg.app.data.auth.AuthRepository
import com.yournextbg.app.data.auth.AuthState
import com.yournextbg.app.ui.auth.LoginScreen
import com.yournextbg.app.ui.nav.AppNavHost
import com.yournextbg.app.ui.theme.CardstockTheme
import com.yournextbg.app.ui.theme.LocalCardstock

/**
 * Single-activity host. CardstockTheme wraps Material3 with the design tokens
 * mirrored from src/app/globals.css. Auth gating happens here: Loading → splash,
 * SignedOut → LoginScreen, SignedIn → AppNavHost.
 */
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            CardstockTheme {
                Root()
            }
        }
    }
}

@Composable
private fun Root() {
    val authRepository = remember {
        // Don't crash the surface if BuildConfig is empty — the lazy SupabaseService
        // throws at first network call, and we surface a friendly setup screen.
        runCatching { AuthRepository.default }.getOrNull()
    }
    if (authRepository == null) {
        SetupRequiredScreen()
        return
    }
    val authState by authRepository.state.collectAsState()
    when (authState) {
        AuthState.Loading -> SplashScreen()
        AuthState.SignedOut -> LoginScreen()
        is AuthState.SignedIn -> AppNavHost()
    }
}

@Composable
private fun SplashScreen() {
    val cs = LocalCardstock.current
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(cs.paperDeep)),
        contentAlignment = Alignment.Center,
    ) {
        CircularProgressIndicator(color = Color(cs.branchInteraction))
    }
}

@Composable
private fun SetupRequiredScreen() {
    val cs = LocalCardstock.current
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(cs.paperDeep)),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = "Supabase not configured.\nPopulate android/local.properties.",
            style = MaterialTheme.typography.titleMedium,
            color = Color(cs.ink),
        )
    }
}

@Preview(name = "Splash", showBackground = true)
@Composable
private fun SplashPreview() {
    CardstockTheme { SplashScreen() }
}
