package com.yournextbg.app.data.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * One row of `public.collection_items`. A user's shelf entry — either:
 *  - a scored game in our catalog (gameId set),
 *  - a BGG game not yet scored (bggId set), or
 *  - a fully manual entry (manualName set).
 *
 * Mirrors the SQL constraint in 0000_initial_schema.sql.
 */
@Serializable
data class CollectionItem(
    val id: String,
    @SerialName("collection_id") val collectionId: String,
    @SerialName("game_id") val gameId: String? = null,
    @SerialName("bgg_id") val bggId: Int? = null,
    @SerialName("manual_name") val manualName: String? = null,
    val notes: String? = null,
    @SerialName("user_rating") val userRating: Int? = null,
    @SerialName("added_at") val addedAt: String? = null,
)

/**
 * Logical state of a shelf item for UI consumption. The Web shelf groups by
 * collection kind (owned, wishlist, played); we mirror that.
 */
enum class ShelfState(val key: String) {
    OWNED("owned"),
    WISHLIST("wishlist"),
    PLAYED("played"),
    CUSTOM("custom");

    companion object {
        fun byKey(key: String): ShelfState =
            entries.firstOrNull { it.key == key } ?: CUSTOM
    }
}
