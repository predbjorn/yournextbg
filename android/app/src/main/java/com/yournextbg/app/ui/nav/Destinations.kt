package com.yournextbg.app.ui.nav

/**
 * Canonical navigation routes. Strings live here so screens, the NavHost,
 * and tests all reference the same constants.
 */
object Destinations {
    const val SHELF = "shelf"
    const val RATE = "rate"
    const val RECS = "recs"
    const val LENS = "lens"
    const val PROFILE = "profile"
    const val GAME_DETAIL_ROUTE = "game/{slug}"

    fun gameDetail(slug: String): String = "game/$slug"

    fun lensWithArgs(a: String?, b: String?): String = buildString {
        append(LENS)
        val args = listOfNotNull(
            a?.let { "a=$it" },
            b?.let { "b=$it" },
        )
        if (args.isNotEmpty()) append("?").append(args.joinToString("&"))
    }
}
