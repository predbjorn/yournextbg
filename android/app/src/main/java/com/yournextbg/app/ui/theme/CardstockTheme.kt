package com.yournextbg.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.graphics.Color

/**
 * Cardstock theme. Wraps MaterialTheme with a ColorScheme derived from the
 * Cardstock tokens — Material defaults are deliberately overridden so that any
 * stock Material3 component (Button, TextField, NavigationBar) renders in
 * Cardstock palette without per-component plumbing.
 *
 * Components that need more than the Material slots can read [LocalCardstock]
 * directly.
 */
@Composable
fun CardstockTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val cs = if (darkTheme) CardstockDark else CardstockLight

    val colorScheme = if (darkTheme) {
        darkColorScheme(
            background = Color(cs.paperDeep),
            onBackground = Color(cs.ink),
            surface = Color(cs.paper),
            onSurface = Color(cs.ink),
            surfaceVariant = Color(cs.paperWarm),
            onSurfaceVariant = Color(cs.inkSoft),
            primary = Color(cs.branchInteraction),
            onPrimary = Color(cs.paper),
            secondary = Color(cs.branchThinking),
            onSecondary = Color(cs.ink),
            tertiary = Color(cs.branchExperience),
            onTertiary = Color(cs.paper),
            error = Color(cs.negative),
            onError = Color(cs.paper),
            outline = Color(cs.paperEdge),
            outlineVariant = Color(cs.mutedSoft),
        )
    } else {
        lightColorScheme(
            background = Color(cs.paperDeep),
            onBackground = Color(cs.ink),
            surface = Color(cs.paper),
            onSurface = Color(cs.ink),
            surfaceVariant = Color(cs.paperWarm),
            onSurfaceVariant = Color(cs.inkSoft),
            primary = Color(cs.branchInteraction),
            onPrimary = Color(cs.paper),
            secondary = Color(cs.branchThinking),
            onSecondary = Color(cs.ink),
            tertiary = Color(cs.branchExperience),
            onTertiary = Color(cs.paper),
            error = Color(cs.negative),
            onError = Color(cs.paper),
            outline = Color(cs.paperEdge),
            outlineVariant = Color(cs.mutedSoft),
        )
    }

    CompositionLocalProvider(LocalCardstock provides cs) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = CardstockTypography,
            content = content,
        )
    }
}
