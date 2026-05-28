package com.yournextbg.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.yournextbg.app.ui.theme.LocalCardstock

/**
 * One-room placeholders for the seven screens. Phase 3 fleshes each out into a
 * real screen with a ViewModel. Until then, navigation, theme, and the
 * bottom-bar plumbing have something to point at.
 */
@Composable
fun ShelfPlaceholder() = PlaceholderScaffold("Shelf", "Your collection lands here. Phase 3.1.")

@Composable
fun RatePlaceholder() = PlaceholderScaffold("Rate", "Card-stack rate flow. Phase 3.2.")

@Composable
fun RecsPlaceholder() = PlaceholderScaffold("Recs", "Profile-mode recommendations. Phase 3.3.")

@Composable
fun LensPlaceholder(a: String? = null, b: String? = null) = PlaceholderScaffold(
    title = "Lens",
    body = "Pairwise comparison. Phase 3.4." +
        (a?.let { " A=$it" }.orEmpty()) +
        (b?.let { " B=$it" }.orEmpty()),
)

@Composable
fun ProfilePlaceholder() = PlaceholderScaffold(
    "Profile",
    "Account · Preferences · About. Phase 3.6.",
)

@Composable
fun GameDetailPlaceholder(slug: String) = PlaceholderScaffold(
    "Game",
    "Detail for: $slug. Phase 3.5.",
)

@Composable
private fun PlaceholderScaffold(title: String, body: String) {
    val cs = LocalCardstock.current
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(cs.paperDeep))
            .padding(24.dp),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = title,
                style = MaterialTheme.typography.displayMedium,
                color = Color(cs.ink),
                modifier = Modifier.size(width = 360.dp, height = 64.dp),
            )
            Text(
                text = body,
                style = MaterialTheme.typography.bodyLarge,
                color = Color(cs.muted),
            )
        }
    }
}
