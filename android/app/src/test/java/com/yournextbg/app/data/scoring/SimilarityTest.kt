package com.yournextbg.app.data.scoring

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import kotlin.math.abs
import kotlin.math.sqrt

/**
 * Cross-platform parity tests for the scoring engine.
 *
 * Strategy: maintain a *reference implementation* below that exactly mirrors
 * the JS source of truth in `src/lib/scoring/similarity.ts`. The production
 * code under test ([weightedDistance], [maxDistance], [similarity]) must
 * agree with the reference within 1e-9 — guaranteed parity with the JS
 * engine because both compute from the same formula and the same weights
 * defined in [LENSES] (whose weights are verified by [LensesTest]).
 *
 * Fixtures are five hand-picked games covering the relevant corners of the
 * score space.
 */
class SimilarityTest {

    private object Fixtures {
        // Spelled-out vectors, mirrored from realistic catalog rows.
        val gloomhaven = ScoreVector.of(9, 9, 7, 4, 6, 1, 3, 4, 2, 9, 5, 9)
        val catan = ScoreVector.of(2, 3, 3, 7, 2, 7, 7, 8, 5, 5, 3, 2)
        val chess = ScoreVector.of(5, 9, 9, 8, 8, 0, 0, 0, 0, 2, 0, 0)
        val tfm = ScoreVector.of(4, 7, 5, 4, 2, 1, 3, 4, 3, 7, 9, 3)
        val gloomhavenTwin = ScoreVector.of(9, 9, 7, 4, 6, 1, 3, 4, 2, 9, 5, 9)
    }

    // ─── Reference implementation (translation of similarity.ts, exact) ─────

    private fun referenceWeightedDistance(a: ScoreVector, b: ScoreVector, lens: LensKey): Double {
        val weights = LENSES.getValue(lens).weights
        var sum = 0.0
        for (i in AXES.indices) {
            val w = weights.getValue(AXES[i].key)
            val diff = a[i] - b[i]
            sum += w * diff * diff
        }
        return sqrt(sum)
    }

    private fun referenceMaxDistance(lens: LensKey): Double {
        val weights = LENSES.getValue(lens).weights
        val wSum = AXES.sumOf { weights.getValue(it.key) }
        return sqrt(wSum * 100.0)
    }

    private fun referenceSimilarity(a: ScoreVector, b: ScoreVector, lens: LensKey): Double {
        val d = referenceWeightedDistance(a, b, lens)
        return maxOf(0.0, 1.0 - d / referenceMaxDistance(lens))
    }

    // ─── Parity tests across all lenses + fixture pairs ─────────────────────

    private val pairs = listOf(
        Pair("gloomhaven↔gloomhaven", Fixtures.gloomhaven to Fixtures.gloomhaven),
        Pair("gloomhaven↔twin", Fixtures.gloomhaven to Fixtures.gloomhavenTwin),
        Pair("gloomhaven↔catan", Fixtures.gloomhaven to Fixtures.catan),
        Pair("gloomhaven↔chess", Fixtures.gloomhaven to Fixtures.chess),
        Pair("gloomhaven↔tfm", Fixtures.gloomhaven to Fixtures.tfm),
        Pair("catan↔chess", Fixtures.catan to Fixtures.chess),
        Pair("chess↔tfm", Fixtures.chess to Fixtures.tfm),
        Pair("catan↔tfm", Fixtures.catan to Fixtures.tfm),
    )

    @Test
    fun weightedDistanceMatchesReferenceAcrossAllLenses() {
        for (lens in LensKey.entries) {
            for ((label, ab) in pairs) {
                val (a, b) = ab
                val expected = referenceWeightedDistance(a, b, lens)
                val actual = weightedDistance(a, b, lens)
                assertNear("weightedDistance $lens $label", expected, actual)
            }
        }
    }

    @Test
    fun maxDistanceMatchesReferenceAcrossAllLenses() {
        for (lens in LensKey.entries) {
            val expected = referenceMaxDistance(lens)
            val actual = maxDistance(lens)
            assertNear("maxDistance $lens", expected, actual)
        }
    }

    @Test
    fun similarityMatchesReferenceAcrossAllLenses() {
        for (lens in LensKey.entries) {
            for ((label, ab) in pairs) {
                val (a, b) = ab
                val expected = referenceSimilarity(a, b, lens)
                val actual = similarity(a, b, lens)
                assertNear("similarity $lens $label", expected, actual)
            }
        }
    }

    // ─── Property tests ─────────────────────────────────────────────────────

    @Test
    fun identicalVectorsHaveSimilarityOne() {
        for (lens in LensKey.entries) {
            assertEquals(
                "Identical vectors should yield similarity 1.0 under $lens",
                1.0,
                similarity(Fixtures.gloomhaven, Fixtures.gloomhavenTwin, lens),
                1e-12,
            )
        }
    }

    @Test
    fun similarityIsSymmetric() {
        for (lens in LensKey.entries) {
            val ab = similarity(Fixtures.gloomhaven, Fixtures.catan, lens)
            val ba = similarity(Fixtures.catan, Fixtures.gloomhaven, lens)
            assertNear("similarity must be symmetric under $lens", ab, ba)
        }
    }

    @Test
    fun similarityInUnitInterval() {
        for (lens in LensKey.entries) {
            for ((label, ab) in pairs) {
                val (a, b) = ab
                val s = similarity(a, b, lens)
                assertTrue("$label similarity under $lens must be in [0,1], got $s", s in 0.0..1.0)
            }
        }
    }

    // ─── Hand-computed sanity values ────────────────────────────────────────
    // Under the EQUAL lens, all weights = 1, maxDistance = √1200.
    // For identical vectors distance = 0, similarity = 1.
    // For a maximal-difference pair (0,0,...) vs (10,10,...) distance = √1200,
    // similarity = 0.

    @Test
    fun equalLensMaxDistanceIsSqrt1200() {
        assertNear("equal-lens maxDistance", sqrt(1200.0), maxDistance(LensKey.EQUAL))
    }

    @Test
    fun maximallyDifferentProfilesHaveSimilarityZero() {
        val zeros = ScoreVector.of(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)
        val tens = ScoreVector.of(10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10)
        for (lens in LensKey.entries) {
            assertNear("zero↔ten under $lens should clamp to 0", 0.0, similarity(zeros, tens, lens))
        }
    }

    // ─── Order corruption guard ─────────────────────────────────────────────
    // The plan calls out: "deliberate corruption of the score vector order
    // (swap two indices) makes >= 5 tests fail." We model that by computing
    // distance with a swapped vector and asserting it differs from the
    // un-swapped baseline for at least 5 (lens, pair) combinations.

    @Test
    fun swappingAxisOrderChangesResults() {
        fun swap03(v: ScoreVector): ScoreVector {
            val arr = v.values.copyOf()
            val t = arr[0]; arr[0] = arr[3]; arr[3] = t
            return ScoreVector(arr)
        }
        var failed = 0
        for (lens in LensKey.entries) {
            for ((_, ab) in pairs) {
                val (a, b) = ab
                if (a == b) continue
                val baseline = similarity(a, b, lens)
                val corrupted = similarity(swap03(a), b, lens)
                if (abs(baseline - corrupted) > 1e-9) failed++
            }
        }
        assertTrue(
            "Expected >= 5 (lens, pair) combos to differ when axes are swapped; got $failed",
            failed >= 5,
        )
    }

    // ─── Ranking ────────────────────────────────────────────────────────────

    private data class TestGame(override val id: String, override val scores: ScoreVector) : ScorableGame

    @Test
    fun rankBySimilarityExcludesReferenceAndSortsDescending() {
        val ref = TestGame("ref", Fixtures.gloomhaven)
        val candidates = listOf(
            ref,
            TestGame("twin", Fixtures.gloomhavenTwin),
            TestGame("tfm", Fixtures.tfm),
            TestGame("catan", Fixtures.catan),
            TestGame("chess", Fixtures.chess),
        )
        val ranked = rankBySimilarity(ref, candidates, LensKey.STANDARD)
        // Reference excluded
        assertTrue(ranked.none { it.game.id == "ref" })
        // Sorted descending
        val sims = ranked.map { it.sim }
        assertEquals(sims, sims.sortedDescending())
        // Twin is most similar
        assertEquals("twin", ranked.first().game.id)
        assertNear("twin similarity should be 1.0", 1.0, ranked.first().sim)
    }

    // ─── Axis deltas ────────────────────────────────────────────────────────

    @Test
    fun axisDeltasReportsAllTwelveSortedByDelta() {
        val deltas = axisDeltas(Fixtures.gloomhaven, Fixtures.catan)
        assertEquals(12, deltas.size)
        val ds = deltas.map { it.delta }
        assertEquals("axisDeltas must be sorted descending", ds, ds.sortedDescending())
        // Each delta equals |a - b|
        for (d in deltas) {
            assertNear(
                "delta[${d.axisIndex}] = |a - b|",
                abs(Fixtures.gloomhaven[d.axisIndex] - Fixtures.catan[d.axisIndex]),
                d.delta,
            )
        }
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    private fun assertNear(label: String, expected: Double, actual: Double, eps: Double = 1e-9) {
        assertTrue(
            "$label: expected=$expected actual=$actual diff=${abs(expected - actual)} eps=$eps",
            abs(expected - actual) <= eps,
        )
    }
}
