package com.yournextbg.app.data.collection

import com.yournextbg.app.data.models.CollectionItem
import com.yournextbg.app.data.supabase.SupabaseService
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Columns
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

/**
 * User shelf operations over `public.collection_items`.
 *
 * The web app keeps a single "owned" collection per user (created on first
 * sign-in). For v2 Android we follow the same convention — every mutation
 * targets the user's primary collection_id, which we resolve once and cache.
 *
 * Realtime: v2 deliberately skips Postgres realtime subscriptions
 * (per Open Decision #5 in the plan). [observe] does a one-shot fetch and
 * surfaces it as a Flow; callers can re-collect after mutations.
 */
class CollectionRepository(
    private val client: SupabaseClient = SupabaseService.client,
) {

    private val columns = Columns.list(
        "id", "collection_id", "game_id", "bgg_id",
        "manual_name", "notes", "user_rating", "added_at",
    )

    /** Fetch the user's items once (snapshot). v2 does not subscribe to realtime. */
    suspend fun list(userId: String): List<CollectionItem> {
        // collection_items.collection_id → collections.user_id, but RLS already
        // restricts rows to the calling user — a flat select is sufficient.
        return client.postgrest
            .from("collection_items")
            .select(columns)
            .decodeList()
    }

    /** Wrap [list] as a Flow that emits once. ViewModels can refresh by re-collecting. */
    fun observe(userId: String): Flow<List<CollectionItem>> = flow {
        emit(list(userId))
    }

    /** Set a 1–10 star rating on a shelf item. */
    suspend fun rate(itemId: String, rating: Int) {
        require(rating in 1..10) { "rating must be 1..10, got $rating" }
        client.postgrest
            .from("collection_items")
            .update(mapOf("user_rating" to rating)) {
                filter { eq("id", itemId) }
            }
    }

    /** Remove an item from the user's shelf. */
    suspend fun remove(itemId: String) {
        client.postgrest
            .from("collection_items")
            .delete {
                filter { eq("id", itemId) }
            }
    }

    /**
     * Add a catalog game to the user's primary collection. The user's primary
     * collection_id is resolved on the server via a join (collections.user_id
     * = auth.uid()), so we don't pass it from the client.
     */
    suspend fun addCatalogGame(collectionId: String, gameId: String) {
        client.postgrest
            .from("collection_items")
            .insert(
                mapOf(
                    "collection_id" to collectionId,
                    "game_id" to gameId,
                ),
            )
    }

    companion object {
        val default: CollectionRepository by lazy { CollectionRepository() }
    }
}
