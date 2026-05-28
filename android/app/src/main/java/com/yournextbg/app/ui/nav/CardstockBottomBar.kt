package com.yournextbg.app.ui.nav

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material.icons.outlined.Compare
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Star
import androidx.compose.material.icons.outlined.ViewModule
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.NavController
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.currentBackStackEntryAsState
import com.yournextbg.app.ui.theme.LocalCardstock

data class BottomTab(
    val route: String,
    val label: String,
    val icon: ImageVector,
)

val BottomTabs: List<BottomTab> = listOf(
    BottomTab(Destinations.SHELF, "Shelf", Icons.Outlined.ViewModule),
    BottomTab(Destinations.RATE, "Rate", Icons.Outlined.Star),
    BottomTab(Destinations.RECS, "Recs", Icons.Outlined.AutoAwesome),
    BottomTab(Destinations.LENS, "Lens", Icons.Outlined.Compare),
    BottomTab(Destinations.PROFILE, "Profile", Icons.Outlined.Person),
)

@Composable
fun CardstockBottomBar(navController: NavController) {
    val cs = LocalCardstock.current
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route

    NavigationBar(
        containerColor = Color(cs.paper),
        contentColor = Color(cs.ink),
    ) {
        BottomTabs.forEach { tab ->
            val selected = currentRoute?.startsWith(tab.route) == true
            NavigationBarItem(
                selected = selected,
                onClick = {
                    navController.navigate(tab.route) {
                        popUpTo(navController.graph.findStartDestination().id) {
                            saveState = true
                        }
                        launchSingleTop = true
                        restoreState = true
                    }
                },
                icon = { Icon(imageVector = tab.icon, contentDescription = tab.label) },
                label = { Text(tab.label) },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = Color(cs.branchInteraction),
                    selectedTextColor = Color(cs.branchInteraction),
                    indicatorColor = Color(cs.paperWarm),
                    unselectedIconColor = Color(cs.muted),
                    unselectedTextColor = Color(cs.muted),
                ),
            )
        }
    }
}
