import Foundation
@testable import yournextbg

/// In-process test fake for GameRepository. Each method returns its
/// `next*` field so tests can stage responses; writes accumulate in the
/// `recorded*` arrays so tests can assert side-effects.
final class StubGameRepository: GameRepository, @unchecked Sendable {
    var nextShelf: [ShelfRow] = []
    var nextGames: [Game] = []
    var nextGame: Game?
    var nextSearchResults: [Game] = []
    var nextSimilar: [Game] = []
    var nextProfileCandidates: [Game] = []
    var nextPrefs: UserPrefs?
    var errorToThrow: Error?

    private(set) var recordedRatings: [(userId: String, gameId: String, rating: Int)] = []
    private(set) var recordedDismissals: [(userId: String, gameId: String)] = []
    private(set) var recordedPrefsUpdates: [UserPrefs] = []

    func fetchShelf(userId: String) async throws -> [ShelfRow] {
        if let errorToThrow { throw errorToThrow }
        return nextShelf
    }

    func fetchGame(id: String) async throws -> Game? {
        if let errorToThrow { throw errorToThrow }
        return nextGame
    }

    func searchGames(query: String, limit: Int) async throws -> [Game] {
        if let errorToThrow { throw errorToThrow }
        return nextSearchResults
    }

    func similarGames(anchorId: String, lens: LensKey, limit: Int) async throws -> [Game] {
        if let errorToThrow { throw errorToThrow }
        return nextSimilar
    }

    func profileCandidates(userId: String, limit: Int) async throws -> [Game] {
        if let errorToThrow { throw errorToThrow }
        return nextProfileCandidates
    }

    func submitRating(userId: String, gameId: String, rating: Int) async throws {
        if let errorToThrow { throw errorToThrow }
        recordedRatings.append((userId, gameId, rating))
    }

    func dismissRecommendation(userId: String, gameId: String) async throws {
        if let errorToThrow { throw errorToThrow }
        recordedDismissals.append((userId, gameId))
    }

    func fetchPrefs(userId: String) async throws -> UserPrefs? {
        if let errorToThrow { throw errorToThrow }
        return nextPrefs
    }

    func updatePrefs(_ prefs: UserPrefs) async throws {
        if let errorToThrow { throw errorToThrow }
        recordedPrefsUpdates.append(prefs)
    }
}

// MARK: helpers

extension Game {
    /// Quick factory for tests + previews. Defaults the score vector to
    /// mid-axis 5s so tests don't have to spell out 12 floats.
    static func sample(id: String, name: String, scores: [Double]? = nil, year: Int? = 2020) -> Game {
        Game(
            id: id,
            slug: id,
            name: name,
            scores: ScoreVector(scores ?? Array(repeating: 5.0, count: AXIS_COUNT)),
            solo: 0,
            fiddly: 5,
            year: year,
            scoreStatus: "scored"
        )
    }
}
