package com.yournextbg.app.ui.theme

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Test
import java.io.File

/**
 * Drift guard. Reads `src/app/globals.css` from the parent monorepo and asserts
 * every Cardstock token in [CardstockLight] / [CardstockDark] matches the hex
 * value in CSS verbatim. If any token diverges, this test fails — the build
 * stays honest and the iOS / web / Android designs stay locked.
 *
 * Test working dir is `android/app/`, so globals.css is two levels up.
 */
class CardstockColorsTest {

    private val globalsCss: String by lazy {
        // Walk up until we find globals.css, in case the test runner changes cwd.
        val candidates = listOf(
            File("../../src/app/globals.css"),
            File("../src/app/globals.css"),
            File("src/app/globals.css"),
        )
        val found = candidates.firstOrNull { it.exists() }
            ?: error(
                "Cannot find src/app/globals.css from CWD=${File(".").absolutePath}; " +
                    "tested ${candidates.map { it.absolutePath }}",
            )
        found.readText()
    }

    private fun hexFor(cssVarName: String, scope: CssScope): String {
        val block = when (scope) {
            CssScope.ROOT -> Regex(""":root\s*\{([^}]*)}""").find(globalsCss)?.groupValues?.get(1)
            CssScope.DARK -> Regex(""":root\[data-theme="dark"]\s*\{([^}]*)}""")
                .find(globalsCss)?.groupValues?.get(1)
        } ?: error("Cannot find $scope block in globals.css")

        val match = Regex("""--$cssVarName\s*:\s*(#[0-9a-fA-F]{6})""").find(block)
        return requireNotNull(match) { "Missing --$cssVarName in $scope block" }
            .groupValues[1].lowercase()
    }

    private fun ULong.toHexString(): String =
        "#%06x".format((this.toLong() and 0xFFFFFFL))

    @Test
    fun lightTokensMatchGlobalsCssVerbatim() {
        val expected = mapOf(
            "cs-paper" to CardstockLight.paper,
            "cs-paper-warm" to CardstockLight.paperWarm,
            "cs-paper-deep" to CardstockLight.paperDeep,
            "cs-paper-edge" to CardstockLight.paperEdge,
            "cs-paper-felt" to CardstockLight.paperFelt,
            "cs-ink" to CardstockLight.ink,
            "cs-ink-soft" to CardstockLight.inkSoft,
            "cs-muted" to CardstockLight.muted,
            "cs-muted-soft" to CardstockLight.mutedSoft,
            "cs-branch-thinking" to CardstockLight.branchThinking,
            "cs-branch-interaction" to CardstockLight.branchInteraction,
            "cs-branch-luck" to CardstockLight.branchLuck,
            "cs-branch-experience" to CardstockLight.branchExperience,
            "cs-positive" to CardstockLight.positive,
            "cs-negative" to CardstockLight.negative,
        )
        for ((cssVar, kotlinColor) in expected) {
            assertEquals(
                "Light token --$cssVar drift between globals.css and CardstockLight",
                hexFor(cssVar, CssScope.ROOT),
                kotlinColor.toHexString(),
            )
        }
    }

    @Test
    fun darkTokensMatchGlobalsCssVerbatim() {
        val expected = mapOf(
            "cs-paper" to CardstockDark.paper,
            "cs-paper-warm" to CardstockDark.paperWarm,
            "cs-paper-deep" to CardstockDark.paperDeep,
            "cs-paper-edge" to CardstockDark.paperEdge,
            "cs-paper-felt" to CardstockDark.paperFelt,
            "cs-ink" to CardstockDark.ink,
            "cs-ink-soft" to CardstockDark.inkSoft,
            "cs-muted" to CardstockDark.muted,
            "cs-muted-soft" to CardstockDark.mutedSoft,
            "cs-branch-thinking" to CardstockDark.branchThinking,
            "cs-branch-interaction" to CardstockDark.branchInteraction,
            "cs-branch-luck" to CardstockDark.branchLuck,
            "cs-branch-experience" to CardstockDark.branchExperience,
            "cs-positive" to CardstockDark.positive,
            "cs-negative" to CardstockDark.negative,
        )
        for ((cssVar, kotlinColor) in expected) {
            assertEquals(
                "Dark token --$cssVar drift between globals.css and CardstockDark",
                hexFor(cssVar, CssScope.DARK),
                kotlinColor.toHexString(),
            )
        }
    }

    @Test
    fun everyTokenIsOpaque() {
        // 0xFFxxxxxx — opaque alpha. Catches accidental Color.Unspecified.
        listOf(
            CardstockLight.paper, CardstockLight.paperWarm, CardstockLight.paperDeep,
            CardstockLight.paperEdge, CardstockLight.paperFelt,
            CardstockLight.ink, CardstockLight.inkSoft,
            CardstockLight.muted, CardstockLight.mutedSoft,
            CardstockLight.branchThinking, CardstockLight.branchInteraction,
            CardstockLight.branchLuck, CardstockLight.branchExperience,
            CardstockLight.positive, CardstockLight.negative,
            CardstockDark.paper, CardstockDark.paperWarm, CardstockDark.paperDeep,
            CardstockDark.paperEdge, CardstockDark.paperFelt,
            CardstockDark.ink, CardstockDark.inkSoft,
            CardstockDark.muted, CardstockDark.mutedSoft,
            CardstockDark.branchThinking, CardstockDark.branchInteraction,
            CardstockDark.branchLuck, CardstockDark.branchExperience,
            CardstockDark.positive, CardstockDark.negative,
        ).forEach { color ->
            assertNotNull(color)
            // High byte = 0xFF
            assertEquals(
                "Color must be opaque (0xFF alpha): 0x%08x".format(color.toLong()),
                0xFFL,
                (color.toLong() ushr 24) and 0xFFL,
            )
        }
    }

    private enum class CssScope { ROOT, DARK }
}
