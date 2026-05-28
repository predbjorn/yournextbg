package com.yournextbg.app.data.scoring

/**
 * Comparison lenses — each lens re-weights the 12 axes to encode a different
 * comparison philosophy. Standard is research-weighted; the others let the
 * user pick by weight class, experiential feel, or luck profile.
 *
 * Mirror of `src/lib/scoring/lenses.ts`. The numeric weights are identical;
 * the parity test asserts byte-for-byte equality against a Kotlin fixture
 * that was hand-translated from the JS source.
 */

enum class LensKey(val key: String) {
    STANDARD("standard"),
    WEIGHT("weight"),
    FEEL("feel"),
    LUCK("luck"),
    EQUAL("equal");

    companion object {
        fun byKey(key: String): LensKey =
            entries.firstOrNull { it.key == key } ?: error("Unknown lens: $key")
    }
}

data class Lens(
    val key: LensKey,
    val label: String,
    val blurb: String,
    val weights: Map<AxisKey, Double>,
) {
    /** Vector form indexed by AXES position — handy for the inner similarity loop. */
    val weightVector: DoubleArray by lazy {
        DoubleArray(AXIS_COUNT) { i ->
            weights[AXES[i].key] ?: error("Lens $key missing weight for ${AXES[i].key}")
        }
    }
}

val LENSES: Map<LensKey, Lens> = mapOf(
    LensKey.STANDARD to Lens(
        key = LensKey.STANDARD,
        label = "Standard",
        blurb = "Research-weighted — Weight, Interaction and Output-luck are the most predictive splitters of taste.",
        weights = mapOf(
            AxisKey.WEIGHT to 2.0,
            AxisKey.DEPTH to 1.2,
            AxisKey.DENSITY to 1.0,
            AxisKey.INTERACTION to 1.8,
            AxisKey.CONFLICT to 1.2,
            AxisKey.NEGOTIATION to 1.0,
            AxisKey.INPUT to 1.2,
            AxisKey.OUTPUT to 1.4,
            AxisKey.CATCHUP to 0.8,
            AxisKey.THEME to 1.0,
            AxisKey.ENGINE to 1.0,
            AxisKey.NARRATIVE to 1.0,
        ),
    ),
    LensKey.WEIGHT to Lens(
        key = LensKey.WEIGHT,
        label = "Same weight class",
        blurb = "Find games in the same complexity class. A heavy 4X and a push-your-luck filler are never the same experience even if other axes line up.",
        weights = mapOf(
            AxisKey.WEIGHT to 3.0,
            AxisKey.DEPTH to 2.2,
            AxisKey.DENSITY to 1.5,
            AxisKey.INTERACTION to 1.0,
            AxisKey.CONFLICT to 0.5,
            AxisKey.NEGOTIATION to 0.5,
            AxisKey.INPUT to 0.8,
            AxisKey.OUTPUT to 1.0,
            AxisKey.CATCHUP to 0.5,
            AxisKey.THEME to 0.5,
            AxisKey.ENGINE to 1.0,
            AxisKey.NARRATIVE to 0.5,
        ),
    ),
    LensKey.FEEL to Lens(
        key = LensKey.FEEL,
        label = "Same feel",
        blurb = "Weights interaction, theme and narrative heaviest. Cares little about weight — finds games that *feel* similar regardless of rules overhead.",
        weights = mapOf(
            AxisKey.WEIGHT to 0.6,
            AxisKey.DEPTH to 0.8,
            AxisKey.DENSITY to 0.8,
            AxisKey.INTERACTION to 2.5,
            AxisKey.CONFLICT to 1.8,
            AxisKey.NEGOTIATION to 1.5,
            AxisKey.INPUT to 0.8,
            AxisKey.OUTPUT to 0.8,
            AxisKey.CATCHUP to 0.8,
            AxisKey.THEME to 2.2,
            AxisKey.ENGINE to 1.5,
            AxisKey.NARRATIVE to 2.0,
        ),
    ),
    LensKey.LUCK to Lens(
        key = LensKey.LUCK,
        label = "Same luck profile",
        blurb = "Weights input/output luck and catch-up heaviest. For players who know they love (or hate) dice, card draws and chaos.",
        weights = mapOf(
            AxisKey.WEIGHT to 0.8,
            AxisKey.DEPTH to 1.0,
            AxisKey.DENSITY to 0.8,
            AxisKey.INTERACTION to 1.0,
            AxisKey.CONFLICT to 1.0,
            AxisKey.NEGOTIATION to 0.8,
            AxisKey.INPUT to 2.5,
            AxisKey.OUTPUT to 2.5,
            AxisKey.CATCHUP to 1.8,
            AxisKey.THEME to 0.8,
            AxisKey.ENGINE to 1.0,
            AxisKey.NARRATIVE to 0.8,
        ),
    ),
    LensKey.EQUAL to Lens(
        key = LensKey.EQUAL,
        label = "Unweighted",
        blurb = "Raw Euclidean distance in 12-dimensional space. All axes equal — the original v1 engine.",
        weights = mapOf(
            AxisKey.WEIGHT to 1.0,
            AxisKey.DEPTH to 1.0,
            AxisKey.DENSITY to 1.0,
            AxisKey.INTERACTION to 1.0,
            AxisKey.CONFLICT to 1.0,
            AxisKey.NEGOTIATION to 1.0,
            AxisKey.INPUT to 1.0,
            AxisKey.OUTPUT to 1.0,
            AxisKey.CATCHUP to 1.0,
            AxisKey.THEME to 1.0,
            AxisKey.ENGINE to 1.0,
            AxisKey.NARRATIVE to 1.0,
        ),
    ),
)

val DEFAULT_LENS: LensKey = LensKey.STANDARD
