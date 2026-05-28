package com.yournextbg.app.data.scoring

/**
 * 12-axis scoring rubric. Mirrors `src/lib/scoring/axes.ts` 1:1 — same keys,
 * same labels, same order. The order is LOAD-BEARING: score vectors index by
 * position, so a 0..11 reorder corrupts every comparison.
 */

enum class Branch(val key: String, val label: String, val colorHex: String, val tagline: String) {
    THINKING("thinking", "Thinking", "#58a6ff", "how much brainwork?"),
    INTERACTION("interaction", "Interaction", "#f78166", "how multiplayer is the multiplayer?"),
    LUCK("luck", "Luck", "#d4a458", "where does luck live?"),
    EXPERIENCE("experience", "Experience", "#8957e5", "how does it feel?");

    companion object {
        fun byKey(key: String): Branch =
            entries.firstOrNull { it.key == key } ?: error("Unknown branch: $key")
    }
}

enum class AxisKey(val key: String) {
    WEIGHT("weight"),
    DEPTH("depth"),
    DENSITY("density"),
    INTERACTION("interaction"),
    CONFLICT("conflict"),
    NEGOTIATION("negotiation"),
    INPUT("input"),
    OUTPUT("output"),
    CATCHUP("catchup"),
    THEME("theme"),
    ENGINE("engine"),
    NARRATIVE("narrative");

    companion object {
        fun byKey(key: String): AxisKey =
            entries.firstOrNull { it.key == key } ?: error("Unknown axis: $key")
    }
}

data class Axis(
    val key: AxisKey,
    val label: String,
    val branch: Branch,
    val diffExplanation: String,
)

/**
 * The canonical axis list. Position is identity — do NOT reorder.
 *
 * Order checked against `src/lib/scoring/axes.ts` by [AxesTest].
 */
val AXES: List<Axis> = listOf(
    Axis(AxisKey.WEIGHT, "Weight", Branch.THINKING, "more rules to digest, higher learning curve"),
    Axis(AxisKey.DEPTH, "Depth", Branch.THINKING, "deeper decision tree, higher skill ceiling"),
    Axis(AxisKey.DENSITY, "Density", Branch.THINKING, "more meaningful choices per minute, more brain-burn"),

    Axis(AxisKey.INTERACTION, "Interaction", Branch.INTERACTION, "players affect each other's plans more, less solitaire"),
    Axis(AxisKey.CONFLICT, "Conflict", Branch.INTERACTION, "more direct attacks, friendships tested"),
    Axis(AxisKey.NEGOTIATION, "Negotiation", Branch.INTERACTION, "table talk required, diplomacy is mandatory"),

    Axis(AxisKey.INPUT, "Input", Branch.LUCK, "more card/setup luck to plan around"),
    Axis(AxisKey.OUTPUT, "Output", Branch.LUCK, "more dice/reveal luck, plans can be upended"),
    Axis(AxisKey.CATCHUP, "Catch-up", Branch.LUCK, "stronger catch-up, no runaway leader"),

    Axis(AxisKey.THEME, "Theme", Branch.EXPERIENCE, "theme is baked into the mechanics"),
    Axis(AxisKey.ENGINE, "Engine", Branch.EXPERIENCE, "stronger engine-combo arc, explosive late-game turns"),
    Axis(AxisKey.NARRATIVE, "Narrative", Branch.EXPERIENCE, "tells a story, consequences persist"),
)

const val AXIS_COUNT = 12

/**
 * A complete score vector. Must be length 12, value range [0, 10]. The factory
 * validates length so accidental truncation/expansion fails fast.
 */
@JvmInline
value class ScoreVector(val values: DoubleArray) {
    init {
        require(values.size == AXIS_COUNT) {
            "ScoreVector must have $AXIS_COUNT entries, got ${values.size}"
        }
    }

    operator fun get(index: Int): Double = values[index]

    companion object {
        fun of(vararg v: Number): ScoreVector =
            ScoreVector(DoubleArray(v.size) { v[it].toDouble() })

        fun of(v: List<Number>): ScoreVector =
            ScoreVector(DoubleArray(v.size) { v[it].toDouble() })
    }
}

fun axisIndex(key: AxisKey): Int {
    val i = AXES.indexOfFirst { it.key == key }
    require(i >= 0) { "Unknown axis: $key" }
    return i
}

fun axisByKey(key: AxisKey): Axis = AXES[axisIndex(key)]
