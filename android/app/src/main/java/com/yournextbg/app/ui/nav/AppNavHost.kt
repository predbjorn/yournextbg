package com.yournextbg.app.ui.nav

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.yournextbg.app.ui.screens.GameDetailPlaceholder
import com.yournextbg.app.ui.screens.LensPlaceholder
import com.yournextbg.app.ui.screens.ProfilePlaceholder
import com.yournextbg.app.ui.screens.RatePlaceholder
import com.yournextbg.app.ui.screens.RecsPlaceholder
import com.yournextbg.app.ui.screens.ShelfPlaceholder

/**
 * Single-activity NavHost. Five top-level routes get a bottom-nav tab,
 * `game/{slug}` is a nested detail route, and `lens?a=&b=` accepts optional
 * anchor IDs for deep-linking from Recs.
 *
 * The Scaffold's bottom bar is mounted unconditionally — placeholder screens
 * in Phase 0/1 fill the body until Phase 3 ships the real ones.
 */
@Composable
fun AppNavHost(
    navController: NavHostController = rememberNavController(),
    startDestination: String = Destinations.SHELF,
) {
    Scaffold(
        bottomBar = { CardstockBottomBar(navController) },
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = startDestination,
            modifier = Modifier.padding(innerPadding),
        ) {
            composable(Destinations.SHELF) { ShelfPlaceholder() }
            composable(Destinations.RATE) { RatePlaceholder() }
            composable(Destinations.RECS) { RecsPlaceholder() }
            composable(
                route = "${Destinations.LENS}?a={a}&b={b}",
                arguments = listOf(
                    navArgument("a") { type = NavType.StringType; nullable = true; defaultValue = null },
                    navArgument("b") { type = NavType.StringType; nullable = true; defaultValue = null },
                ),
            ) { entry ->
                LensPlaceholder(
                    a = entry.arguments?.getString("a"),
                    b = entry.arguments?.getString("b"),
                )
            }
            composable(Destinations.PROFILE) { ProfilePlaceholder() }
            composable(
                route = Destinations.GAME_DETAIL_ROUTE,
                arguments = listOf(navArgument("slug") { type = NavType.StringType }),
            ) { entry ->
                GameDetailPlaceholder(slug = entry.arguments?.getString("slug").orEmpty())
            }
        }
    }
}
