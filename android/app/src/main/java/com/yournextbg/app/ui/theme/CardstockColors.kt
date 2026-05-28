package com.yournextbg.app.ui.theme

import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf

/**
 * Cardstock design tokens (mirrored verbatim from `src/app/globals.css` lines
 * 35–75). Kept as ULongs so the drift test can compare hex strings without
 * triggering Color.Unspecified weirdness; Composables wrap with `Color(...)`.
 *
 * If you change a value here, also change it in globals.css (or vice versa).
 * The drift test in `CardstockColorsTest` will fail loudly otherwise.
 */
@Immutable
data class CardstockColors(
    // Paper / surface variants
    val paper: ULong,
    val paperWarm: ULong,
    val paperDeep: ULong,
    val paperEdge: ULong,
    val paperFelt: ULong,

    // Ink / text variants
    val ink: ULong,
    val inkSoft: ULong,
    val muted: ULong,
    val mutedSoft: ULong,

    // Branch accents
    val branchThinking: ULong,
    val branchInteraction: ULong,
    val branchLuck: ULong,
    val branchExperience: ULong,

    // Semantic
    val positive: ULong,
    val negative: ULong,
)

/** 0xAARRGGBB ULong literal from a `#RRGGBB` string. Opaque alpha. */
private fun hex(rrggbb: String): ULong {
    require(rrggbb.length == 7 && rrggbb.startsWith("#")) {
        "Expected #RRGGBB, got '$rrggbb'"
    }
    val rgb = rrggbb.substring(1).toLong(16)
    return (0xFF000000L or rgb).toULong()
}

/** globals.css `:root` (Cardstock light). */
val CardstockLight: CardstockColors = CardstockColors(
    paper = hex("#efe6d0"),
    paperWarm = hex("#f5ecd6"),
    paperDeep = hex("#dcd0b8"),
    paperEdge = hex("#e6dcc2"),
    paperFelt = hex("#c8baa0"),

    ink = hex("#1c1a14"),
    inkSoft = hex("#3a3527"),
    muted = hex("#776a52"),
    mutedSoft = hex("#a89a7e"),

    branchThinking = hex("#c98a2b"),
    branchInteraction = hex("#b6533a"),
    branchLuck = hex("#5e7a55"),
    branchExperience = hex("#704a82"),

    positive = hex("#5e7a55"),
    negative = hex("#a93b25"),
)

/** globals.css `:root[data-theme="dark"]` (warm aged-leather variant). */
val CardstockDark: CardstockColors = CardstockColors(
    paper = hex("#2a2620"),
    paperWarm = hex("#33301b"),
    paperDeep = hex("#14110b"),
    paperEdge = hex("#3a3428"),
    paperFelt = hex("#0c0a07"),

    ink = hex("#ece2c8"),
    inkSoft = hex("#b9ad93"),
    muted = hex("#8a7e64"),
    mutedSoft = hex("#5e5644"),

    branchThinking = hex("#e8a448"),
    branchInteraction = hex("#dd7a5b"),
    branchLuck = hex("#92ad7a"),
    branchExperience = hex("#ad8acb"),

    positive = hex("#92ad7a"),
    negative = hex("#e08068"),
)

val LocalCardstock = staticCompositionLocalOf<CardstockColors> {
    error("CardstockColors not provided — wrap your composable in CardstockTheme { }")
}
