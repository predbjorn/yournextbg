package com.yournextbg.app.data.models

import com.yournextbg.app.data.scoring.AXIS_COUNT
import com.yournextbg.app.data.scoring.ScorableGame
import com.yournextbg.app.data.scoring.ScoreVector
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.doubleOrNull

/**
 * One row of `public.games`. Matches the SQL schema in
 * `supabase/migrations/0000_initial_schema.sql` (id, slug, name, bgg_id,
 * scores jsonb array length 12, solo, fiddly, player_count, signature,
 * description, ...).
 *
 * `scoresJson` is the raw JSON array from Postgrest; [scoreVector] parses
 * and validates it into the 12-double form the scoring engine consumes.
 * [asScorable] adapts a Game for direct use with `rankBySimilarity`.
 */
@Serializable
data class Game(
    val id: String,
    val slug: String,
    val name: String,
    @SerialName("bgg_id") val bggId: Int? = null,
    @SerialName("scores") val scoresJson: JsonElement,
    val solo: Int = 0,
    val fiddly: Int = 0,
    @SerialName("player_count") val playerCount: JsonElement? = null,
    val signature: String? = null,
    val description: String? = null,
) {

    /** Parsed 12-axis ScoreVector. Throws if `scoresJson` is malformed. */
    val scoreVector: ScoreVector by lazy {
        val arr = (scoresJson as? JsonArray)
            ?: error("game $id: scores must be a JSON array, got $scoresJson")
        require(arr.size == AXIS_COUNT) {
            "game $id: scores must have $AXIS_COUNT entries, got ${arr.size}"
        }
        ScoreVector(
            DoubleArray(AXIS_COUNT) { i ->
                (arr[i] as? JsonPrimitive)?.doubleOrNull
                    ?: error("game $id: scores[$i] is not a number")
            },
        )
    }

    /** Adapter so scoring functions can operate directly on a Game. */
    fun asScorable(): ScorableGame = object : ScorableGame {
        override val id: String = this@Game.id
        override val scores: ScoreVector = this@Game.scoreVector
    }
}
