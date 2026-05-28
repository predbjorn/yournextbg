package com.yournextbg.app.data.models

import com.yournextbg.app.data.scoring.AXIS_COUNT
import kotlinx.serialization.json.Json
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertThrows
import org.junit.Test

class GameTest {

    private val json = Json { ignoreUnknownKeys = true }

    @Test
    fun parsesGameFromCanonicalJson() {
        val payload = """
            {
              "id": "gloomhaven",
              "slug": "gloomhaven",
              "name": "Gloomhaven",
              "bgg_id": 174430,
              "scores": [9, 9, 7, 4, 6, 1, 3, 4, 2, 9, 5, 9],
              "solo": 8,
              "fiddly": 7,
              "player_count": { "best": [2], "good": [1,2,3,4], "bad": [] },
              "signature": "campaign euro",
              "description": "Branching dungeon-crawl campaign."
            }
        """.trimIndent()

        val game = json.decodeFromString(Game.serializer(), payload)

        assertEquals("gloomhaven", game.id)
        assertEquals("gloomhaven", game.slug)
        assertEquals("Gloomhaven", game.name)
        assertEquals(174430, game.bggId)
        assertEquals(AXIS_COUNT, game.scoreVector.values.size)
        assertEquals(9.0, game.scoreVector[0], 0.0)
        assertEquals(9.0, game.scoreVector[11], 0.0)
    }

    @Test
    fun scoreVectorRejectsWrongLengthFromJson() {
        val payload = """
            {
              "id": "broken",
              "slug": "broken",
              "name": "Broken",
              "scores": [1, 2, 3]
            }
        """.trimIndent()
        val game = json.decodeFromString(Game.serializer(), payload)
        assertThrows(IllegalArgumentException::class.java) { game.scoreVector }
    }

    @Test
    fun asScorableExposesIdAndVector() {
        val payload = """
            {
              "id": "catan",
              "slug": "catan",
              "name": "Catan",
              "scores": [2, 3, 3, 7, 2, 7, 7, 8, 5, 5, 3, 2]
            }
        """.trimIndent()
        val game = json.decodeFromString(Game.serializer(), payload)
        val scorable = game.asScorable()
        assertEquals("catan", scorable.id)
        assertNotNull(scorable.scores)
        assertEquals(2.0, scorable.scores[0], 0.0)
    }
}
