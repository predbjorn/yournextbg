package com.yournextbg.app.data.scoring

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Pins every lens weight against the JS source of truth in
 * `src/lib/scoring/lenses.ts`. If the JS file changes, mirror here.
 */
class LensesTest {

    @Test
    fun standardLensWeightsMatchJs() {
        val w = LENSES.getValue(LensKey.STANDARD).weights
        assertEquals(2.0, w.getValue(AxisKey.WEIGHT), 0.0)
        assertEquals(1.2, w.getValue(AxisKey.DEPTH), 0.0)
        assertEquals(1.0, w.getValue(AxisKey.DENSITY), 0.0)
        assertEquals(1.8, w.getValue(AxisKey.INTERACTION), 0.0)
        assertEquals(1.2, w.getValue(AxisKey.CONFLICT), 0.0)
        assertEquals(1.0, w.getValue(AxisKey.NEGOTIATION), 0.0)
        assertEquals(1.2, w.getValue(AxisKey.INPUT), 0.0)
        assertEquals(1.4, w.getValue(AxisKey.OUTPUT), 0.0)
        assertEquals(0.8, w.getValue(AxisKey.CATCHUP), 0.0)
        assertEquals(1.0, w.getValue(AxisKey.THEME), 0.0)
        assertEquals(1.0, w.getValue(AxisKey.ENGINE), 0.0)
        assertEquals(1.0, w.getValue(AxisKey.NARRATIVE), 0.0)
    }

    @Test
    fun weightLensWeightsMatchJs() {
        val w = LENSES.getValue(LensKey.WEIGHT).weights
        assertEquals(3.0, w.getValue(AxisKey.WEIGHT), 0.0)
        assertEquals(2.2, w.getValue(AxisKey.DEPTH), 0.0)
        assertEquals(1.5, w.getValue(AxisKey.DENSITY), 0.0)
        assertEquals(1.0, w.getValue(AxisKey.INTERACTION), 0.0)
        assertEquals(0.5, w.getValue(AxisKey.CONFLICT), 0.0)
        assertEquals(0.5, w.getValue(AxisKey.NEGOTIATION), 0.0)
        assertEquals(0.8, w.getValue(AxisKey.INPUT), 0.0)
        assertEquals(1.0, w.getValue(AxisKey.OUTPUT), 0.0)
        assertEquals(0.5, w.getValue(AxisKey.CATCHUP), 0.0)
        assertEquals(0.5, w.getValue(AxisKey.THEME), 0.0)
        assertEquals(1.0, w.getValue(AxisKey.ENGINE), 0.0)
        assertEquals(0.5, w.getValue(AxisKey.NARRATIVE), 0.0)
    }

    @Test
    fun feelLensWeightsMatchJs() {
        val w = LENSES.getValue(LensKey.FEEL).weights
        assertEquals(0.6, w.getValue(AxisKey.WEIGHT), 0.0)
        assertEquals(0.8, w.getValue(AxisKey.DEPTH), 0.0)
        assertEquals(0.8, w.getValue(AxisKey.DENSITY), 0.0)
        assertEquals(2.5, w.getValue(AxisKey.INTERACTION), 0.0)
        assertEquals(1.8, w.getValue(AxisKey.CONFLICT), 0.0)
        assertEquals(1.5, w.getValue(AxisKey.NEGOTIATION), 0.0)
        assertEquals(0.8, w.getValue(AxisKey.INPUT), 0.0)
        assertEquals(0.8, w.getValue(AxisKey.OUTPUT), 0.0)
        assertEquals(0.8, w.getValue(AxisKey.CATCHUP), 0.0)
        assertEquals(2.2, w.getValue(AxisKey.THEME), 0.0)
        assertEquals(1.5, w.getValue(AxisKey.ENGINE), 0.0)
        assertEquals(2.0, w.getValue(AxisKey.NARRATIVE), 0.0)
    }

    @Test
    fun luckLensWeightsMatchJs() {
        val w = LENSES.getValue(LensKey.LUCK).weights
        assertEquals(0.8, w.getValue(AxisKey.WEIGHT), 0.0)
        assertEquals(1.0, w.getValue(AxisKey.DEPTH), 0.0)
        assertEquals(0.8, w.getValue(AxisKey.DENSITY), 0.0)
        assertEquals(1.0, w.getValue(AxisKey.INTERACTION), 0.0)
        assertEquals(1.0, w.getValue(AxisKey.CONFLICT), 0.0)
        assertEquals(0.8, w.getValue(AxisKey.NEGOTIATION), 0.0)
        assertEquals(2.5, w.getValue(AxisKey.INPUT), 0.0)
        assertEquals(2.5, w.getValue(AxisKey.OUTPUT), 0.0)
        assertEquals(1.8, w.getValue(AxisKey.CATCHUP), 0.0)
        assertEquals(0.8, w.getValue(AxisKey.THEME), 0.0)
        assertEquals(1.0, w.getValue(AxisKey.ENGINE), 0.0)
        assertEquals(0.8, w.getValue(AxisKey.NARRATIVE), 0.0)
    }

    @Test
    fun equalLensWeightsAreAllOnes() {
        val w = LENSES.getValue(LensKey.EQUAL).weights
        for (axis in AxisKey.entries) {
            assertEquals("equal lens weight for $axis", 1.0, w.getValue(axis), 0.0)
        }
    }

    @Test
    fun everyLensCoversEveryAxis() {
        for (lens in LENSES.values) {
            assertEquals(
                "Lens ${lens.key} must define a weight for every axis",
                AxisKey.entries.toSet(),
                lens.weights.keys,
            )
        }
    }

    @Test
    fun weightVectorMatchesAxesOrder() {
        for (lens in LENSES.values) {
            val v = lens.weightVector
            assertEquals(AXIS_COUNT, v.size)
            for (i in 0 until AXIS_COUNT) {
                val expected = lens.weights.getValue(AXES[i].key)
                assertEquals(
                    "Lens ${lens.key} weightVector[$i] must equal weight for ${AXES[i].key}",
                    expected,
                    v[i],
                    0.0,
                )
            }
        }
    }

    @Test
    fun defaultLensIsStandard() {
        assertTrue(DEFAULT_LENS == LensKey.STANDARD)
    }
}
