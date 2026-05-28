package com.yournextbg.app.data.games

import com.yournextbg.app.data.models.Game
import com.yournextbg.app.data.scoring.LensKey
import com.yournextbg.app.data.supabase.SupabaseService
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Columns
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

/**
 * Read-only repository over `public.games`. Postgrest is used for list +
 * point reads; the `similar_games` Postgres RPC (plan 01, migrations
 * 0002+) is used for server-side similarity ranking under the standard
 * pgvector L2 distance (the Kotlin port of the scoring engine handles
 * the four lens-weighted variants client-side for now).
 */
class GamesRepository(
    private val client: SupabaseClient = SupabaseService.client,
) {

    private val columns = Columns.list(
        "id", "slug", "name", "bgg_id",
        "scores", "solo", "fiddly", "player_count",
        "signature", "description",
    )

    /** Full catalog (or up to [limit]). Used to seed local indexes for fast ranking. */
    suspend fun list(limit: Int = 500): List<Game> =
        client.postgrest
            .from("games")
            .select(columns) {
                limit(limit.toLong())
                order("name", io.github.jan.supabase.postgrest.query.Order.ASCENDING)
            }
            .decodeList()

    /** Lookup by slug (URL-stable identifier). */
    suspend fun bySlug(slug: String): Game? =
        client.postgrest
            .from("games")
            .select(columns) {
                filter { eq("slug", slug) }
                limit(1L)
            }
            .decodeList<Game>()
            .firstOrNull()

    /** Lookup by primary key id. */
    suspend fun byId(id: String): Game? =
        client.postgrest
            .from("games")
            .select(columns) {
                filter { eq("id", id) }
                limit(1L)
            }
            .decodeList<Game>()
            .firstOrNull()

    /**
     * Server-side similar-games RPC. The `similar_games` SQL function uses
     * pgvector's L2 distance over `axes_vec` to surface the top-N nearest
     * neighbors of [anchorId]. The [lens] is forwarded as a label; the
     * Postgres function may down-weight axes in v3 — for v2 it's a no-op
     * argument that we still pass so the wire shape is stable.
     */
    suspend fun similar(
        anchorId: String,
        lens: LensKey = LensKey.STANDARD,
        limit: Int = 10,
    ): List<Game> {
        val params: JsonObject = buildJsonObject {
            put("anchor_id", anchorId)
            put("lens", lens.key)
            put("k", limit)
        }
        return client.postgrest.rpc("similar_games", params).decodeList()
    }

    companion object {
        val default: GamesRepository by lazy { GamesRepository() }
    }
}
