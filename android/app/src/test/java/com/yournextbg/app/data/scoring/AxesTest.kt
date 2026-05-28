package com.yournextbg.app.data.scoring

import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Test

/**
 * AXES order is LOAD-BEARING. The score vector indexes into it by position, so
 * swapping any two axes silently corrupts every comparison in the app.
 *
 * This test pins the exact 12-position order against the JS source of truth.
 * If the JS side reorders, mirror here; if Kotlin diverges, this fails.
 */
class AxesTest {

    @Test
    fun axisCountIsTwelve() {
        assertEquals(12, AXES.size)
        assertEquals(12, AXIS_COUNT)
    }

    @Test
    fun axisOrderMatchesJsSourceOfTruth() {
        val expected = listOf(
            AxisKey.WEIGHT, AxisKey.DEPTH, AxisKey.DENSITY,
            AxisKey.INTERACTION, AxisKey.CONFLICT, AxisKey.NEGOTIATION,
            AxisKey.INPUT, AxisKey.OUTPUT, AxisKey.CATCHUP,
            AxisKey.THEME, AxisKey.ENGINE, AxisKey.NARRATIVE,
        )
        assertEquals(expected, AXES.map { it.key })
    }

    @Test
    fun branchAssignmentsMatchJsSourceOfTruth() {
        val expectedBranchByAxis = mapOf(
            AxisKey.WEIGHT to Branch.THINKING,
            AxisKey.DEPTH to Branch.THINKING,
            AxisKey.DENSITY to Branch.THINKING,
            AxisKey.INTERACTION to Branch.INTERACTION,
            AxisKey.CONFLICT to Branch.INTERACTION,
            AxisKey.NEGOTIATION to Branch.INTERACTION,
            AxisKey.INPUT to Branch.LUCK,
            AxisKey.OUTPUT to Branch.LUCK,
            AxisKey.CATCHUP to Branch.LUCK,
            AxisKey.THEME to Branch.EXPERIENCE,
            AxisKey.ENGINE to Branch.EXPERIENCE,
            AxisKey.NARRATIVE to Branch.EXPERIENCE,
        )
        for (axis in AXES) {
            assertEquals(
                "Branch mismatch for ${axis.key}",
                expectedBranchByAxis[axis.key],
                axis.branch,
            )
        }
    }

    @Test
    fun axisIndexResolvesToPosition() {
        assertEquals(0, axisIndex(AxisKey.WEIGHT))
        assertEquals(3, axisIndex(AxisKey.INTERACTION))
        assertEquals(7, axisIndex(AxisKey.OUTPUT))
        assertEquals(11, axisIndex(AxisKey.NARRATIVE))
    }

    @Test
    fun branchColorsMatchWebSourceOfTruth() {
        // Source: src/lib/scoring/axes.ts BRANCHES — these colors flow into the
        // Lens radar overlays and any Cardstock chart with a branch swatch.
        assertEquals("#58a6ff", Branch.THINKING.colorHex)
        assertEquals("#f78166", Branch.INTERACTION.colorHex)
        assertEquals("#d4a458", Branch.LUCK.colorHex)
        assertEquals("#8957e5", Branch.EXPERIENCE.colorHex)
    }

    @Test
    fun scoreVectorRejectsWrongLength() {
        assertThrows(IllegalArgumentException::class.java) {
            ScoreVector(DoubleArray(11))
        }
        assertThrows(IllegalArgumentException::class.java) {
            ScoreVector(DoubleArray(13))
        }
    }

    @Test
    fun axisByKeyResolvesToAxis() {
        assertEquals(AxisKey.WEIGHT, axisByKey(AxisKey.WEIGHT).key)
        assertEquals(Branch.LUCK, axisByKey(AxisKey.OUTPUT).branch)
        assertEquals("Narrative", axisByKey(AxisKey.NARRATIVE).label)
    }

    @Test
    fun branchByKeyRoundTrips() {
        for (branch in Branch.entries) {
            assertEquals(branch, Branch.byKey(branch.key))
        }
    }

    @Test
    fun axisKeyByKeyRoundTrips() {
        for (key in AxisKey.entries) {
            assertEquals(key, AxisKey.byKey(key.key))
        }
    }
}
