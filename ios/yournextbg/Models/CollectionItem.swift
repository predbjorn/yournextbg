import Foundation

/// One row of the user's shelf. Mirrors the `collection_items` Supabase
/// table. `userRating` is the user's 1–5 rating; nil if not yet rated.
public struct CollectionItem: Codable, Hashable, Identifiable, Sendable {
    public let id: String
    public let userId: String
    public let gameId: String
    /// One of `"owned"`, `"wishlist"`, `"played"`, etc. Kept as String
    /// for forward-compat; the canonical enum lives in the DB.
    public let status: String
    public let source: String?
    public let userRating: Int?
    public let createdAt: Date?

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case gameId = "game_id"
        case status
        case source
        case userRating = "user_rating"
        case createdAt = "created_at"
    }

    public init(
        id: String,
        userId: String,
        gameId: String,
        status: String,
        source: String? = nil,
        userRating: Int? = nil,
        createdAt: Date? = nil
    ) {
        self.id = id
        self.userId = userId
        self.gameId = gameId
        self.status = status
        self.source = source
        self.userRating = userRating
        self.createdAt = createdAt
    }
}
