import Foundation
import Supabase

/// Read/write surface over the `games`, `collection_items`, `user_prefs`,
/// `dismissals` tables + the `similar_games` / `profile_candidates`
/// RPCs. Kept as a protocol so screens can swap in an in-memory stub for
/// tests + previews.
public protocol GameRepository: Sendable {
    func fetchShelf(userId: String) async throws -> [ShelfRow]
    func fetchGame(id: String) async throws -> Game?
    func searchGames(query: String, limit: Int) async throws -> [Game]

    /// RPC: returns the N most similar games to `anchorId` under `lens`.
    /// Server may pre-rank or just hand the candidate set back.
    func similarGames(anchorId: String, lens: LensKey, limit: Int) async throws -> [Game]

    /// RPC: returns candidate games for the user's profile-based
    /// recommendations. Re-ranked client-side under the active lens.
    func profileCandidates(userId: String, limit: Int) async throws -> [Game]

    /// Upserts a 1-5 user rating for a (user, game) pair.
    func submitRating(userId: String, gameId: String, rating: Int) async throws

    /// Records a dismissal so the game stops appearing in recs.
    func dismissRecommendation(userId: String, gameId: String) async throws

    /// User prefs read + partial update.
    func fetchPrefs(userId: String) async throws -> UserPrefs?
    func updatePrefs(_ prefs: UserPrefs) async throws
}

/// A shelf row joins a `Game` with its `collection_items.status`. The
/// `Identifiable.id` matches the game id since each game is unique on
/// a shelf.
public struct ShelfRow: Identifiable, Hashable, Sendable {
    public var id: String { game.id }
    public let game: Game
    public let status: String
    public let userRating: Int?

    public init(game: Game, status: String, userRating: Int? = nil) {
        self.game = game
        self.status = status
        self.userRating = userRating
    }
}

// MARK: - Live implementation

/// Production repository backed by the Supabase client. RPC parameter
/// names mirror the SQL function signatures defined in plan 01.
public final class LiveGameRepository: GameRepository, @unchecked Sendable {
    private let client: SupabaseClient

    public init(client: SupabaseClient) {
        self.client = client
    }

    public func fetchShelf(userId: String) async throws -> [ShelfRow] {
        // collection_items + nested games via a foreign-table select.
        // PostgREST embedded resource syntax: `games:games(*)`.
        struct ShelfDTO: Decodable {
            let status: String
            let user_rating: Int?
            let game: Game
            enum CodingKeys: String, CodingKey {
                case status
                case user_rating
                case game = "games"
            }
        }
        let rows: [ShelfDTO] = try await client
            .from("collection_items")
            .select("status, user_rating, games(*)")
            .eq("user_id", value: userId)
            .execute()
            .value
        return rows.map { ShelfRow(game: $0.game, status: $0.status, userRating: $0.user_rating) }
    }

    public func fetchGame(id: String) async throws -> Game? {
        let games: [Game] = try await client
            .from("games")
            .select()
            .eq("id", value: id)
            .limit(1)
            .execute()
            .value
        return games.first
    }

    public func searchGames(query: String, limit: Int) async throws -> [Game] {
        let games: [Game] = try await client
            .from("games")
            .select()
            .ilike("name", pattern: "%\(query)%")
            .limit(limit)
            .execute()
            .value
        return games
    }

    public func similarGames(anchorId: String, lens: LensKey, limit: Int) async throws -> [Game] {
        struct Params: Encodable {
            let anchor_id: String
            let lens: String
            let max_results: Int
        }
        let games: [Game] = try await client
            .rpc("similar_games", params: Params(anchor_id: anchorId, lens: lens.rawValue, max_results: limit))
            .execute()
            .value
        return games
    }

    public func profileCandidates(userId: String, limit: Int) async throws -> [Game] {
        struct Params: Encodable {
            let target_user: String
            let max_results: Int
        }
        let games: [Game] = try await client
            .rpc("profile_candidates", params: Params(target_user: userId, max_results: limit))
            .execute()
            .value
        return games
    }

    public func submitRating(userId: String, gameId: String, rating: Int) async throws {
        struct Row: Encodable {
            let user_id: String
            let game_id: String
            let rating: Int
        }
        try await client
            .from("ratings")
            .upsert(Row(user_id: userId, game_id: gameId, rating: rating), onConflict: "user_id,game_id")
            .execute()
    }

    public func dismissRecommendation(userId: String, gameId: String) async throws {
        struct Row: Encodable {
            let user_id: String
            let game_id: String
        }
        try await client
            .from("dismissals")
            .upsert(Row(user_id: userId, game_id: gameId), onConflict: "user_id,game_id")
            .execute()
    }

    public func fetchPrefs(userId: String) async throws -> UserPrefs? {
        let prefs: [UserPrefs] = try await client
            .from("user_prefs")
            .select()
            .eq("user_id", value: userId)
            .limit(1)
            .execute()
            .value
        return prefs.first
    }

    public func updatePrefs(_ prefs: UserPrefs) async throws {
        try await client
            .from("user_prefs")
            .upsert(prefs, onConflict: "user_id")
            .execute()
    }
}
