package com.yournextbg.app.data.scoring

import kotlin.math.abs
import kotlin.math.max
import kotlin.math.sqrt

/**
 * Weighted-Euclidean similarity between two game profiles.
 *
 *   distance² = Σ wᵢ × (aᵢ − bᵢ)²
 *   similarity = 1 − distance / maxDistance     (∈ [0, 1])
 *
 * where maxDistance = √(Σ wᵢ × 10²) — the distance produced if every axis
 * differs by the maximum possible 10 points.
 *
 * Mirror of `src/lib/scoring/similarity.ts`. Cross-platform parity tests
 * pin the Kotlin outputs to the JS outputs within 1e-9 tolerance.
 */

private const val MAX_AXIS_DIFF_SQ = 100.0 // (10 - 0)²

fun weightedDistance(a: ScoreVector, b: ScoreVector, lens: LensKey): Double {
    val w = LENSES.getValue(lens).weightVector
    var sum = 0.0
    for (i in 0 until AXIS_COUNT) {
        val diff = a[i] - b[i]
        sum += w[i] * diff * diff
    }
    return sqrt(sum)
}

fun maxDistance(lens: LensKey): Double {
    val w = LENSES.getValue(lens).weightVector
    var wSum = 0.0
    for (i in 0 until AXIS_COUNT) wSum += w[i]
    return sqrt(wSum * MAX_AXIS_DIFF_SQ)
}

/** Similarity ∈ [0, 1]. 1 = identical profile, 0 = maximally different given lens. */
fun similarity(a: ScoreVector, b: ScoreVector, lens: LensKey): Double =
    max(0.0, 1.0 - weightedDistance(a, b, lens) / maxDistance(lens))

/** Per-axis absolute deltas, sorted largest-first. */
data class AxisDelta(
    val axisIndex: Int,
    val a: Double,
    val b: Double,
    val delta: Double,
)

fun axisDeltas(a: ScoreVector, b: ScoreVector): List<AxisDelta> =
    (0 until AXIS_COUNT)
        .map { i -> AxisDelta(axisIndex = i, a = a[i], b = b[i], delta = abs(a[i] - b[i])) }
        .sortedByDescending { it.delta }

interface ScorableGame {
    val id: String
    val scores: ScoreVector
}

data class RankedGame<G : ScorableGame>(val game: G, val sim: Double)

/** Ranks all games by similarity to a reference. Excludes the reference itself. */
fun <G : ScorableGame> rankBySimilarity(
    reference: G,
    candidates: List<G>,
    lens: LensKey,
): List<RankedGame<G>> =
    candidates
        .filter { it.id != reference.id }
        .map { RankedGame(it, similarity(reference.scores, it.scores, lens)) }
        .sortedByDescending { it.sim }
