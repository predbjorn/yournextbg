package com.yournextbg.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.tooling.preview.Preview
import com.yournextbg.app.ui.theme.CardstockTheme
import com.yournextbg.app.ui.theme.LocalCardstock

/**
 * Single-activity host. CardstockTheme wraps Material3 with the design tokens
 * mirrored from src/app/globals.css. Navigation will land in Phase 2.
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
    val cs = LocalCardstock.current
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(cs.paperDeep)),
        contentAlignment = Alignment.Center,
    ) {
        Text(text = "yournextbg", color = Color(cs.ink))
    }
}

@Preview(name = "Light", showBackground = true)
@Composable
private fun RootPreviewLight() {
    CardstockTheme(darkTheme = false) { Root() }
}

@Preview(name = "Dark", showBackground = true)
@Composable
private fun RootPreviewDark() {
    CardstockTheme(darkTheme = true) { Root() }
}
