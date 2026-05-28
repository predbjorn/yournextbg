import Foundation
import Observation

/// Recommendations viewmodel. Fetches candidate games from the
/// `profile_candidates` RPC, then client-side re-ranks under the
/// active lens using the ported scoring engine.
///
/// The re-rank lives client-side so changing the lens chip is
/// instantaneous (no network roundtrip).
@Observable
@MainActor
public final class RecsViewModel {
    public private(set) var ranked: [Game] = []
    public private(set) var allCandidates: [Game] = []
    public var lens: LensKey = .standard {
        didSet { rerank() }
    }
    public var isLoading: Bool = false
    public var lastError: String?

    /// Anchor profile used for ranking. Lazily becomes "average of
    /// owned game vectors", but the v2 RPC already returns a sorted
    /// candidate set; we pass through unless the lens differs.
    public var anchorProfile: ScoreVector?

    private let userId: String
    private let repository: GameRepository

    public init(userId: String, repository: GameRepository) {
        self.userId = userId
        self.repository = repository
    }

    public func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            let candidates = try await repository.profileCandidates(userId: userId, limit: 50)
            allCandidates = candidates

            // Build the anchor profile from the user's shelf for re-ranking.
            // For the network-test case we just use the average of all
            // scored shelf items; cheap, deterministic, good enough for v2.
            let shelf = try await repository.fetchShelf(userId: userId)
            anchorProfile = averageVector(
                shelf.map { $0.game }.filter { $0.scoreStatus != "unscored" }
            )

            rerank()
            lastError = nil
        } catch {
            lastError = error.localizedDescription
        }
    }

    public func dismiss(_ game: Game) async {
        do {
            try await repository.dismissRecommendation(userId: userId, gameId: game.id)
            allCandidates.removeAll { $0.id == game.id }
            ranked.removeAll { $0.id == game.id }
        } catch {
            lastError = error.localizedDescription
        }
    }

    /// Recompute the ordering when the lens changes. If we have an
    /// anchor profile, sort by similarity to it under the active lens.
    /// Otherwise fall back to the RPC's order.
    public func rerank() {
        guard let anchor = anchorProfile else {
            ranked = allCandidates
            return
        }
        ranked = allCandidates
            .map { game in
                (game, Scoring.similarity(anchor, game.scores, lens: lens))
            }
            .sorted { $0.1 > $1.1 }
            .map { $0.0 }
    }

    // MARK: helpers

    private func averageVector(_ games: [Game]) -> ScoreVector? {
        guard !games.isEmpty else { return nil }
        var sums = Array(repeating: 0.0, count: AXIS_COUNT)
        for game in games {
            for (i, v) in game.scores.values.enumerated() {
                sums[i] += v
            }
        }
        let n = Double(games.count)
        return ScoreVector(sums.map { $0 / n })
    }
}
