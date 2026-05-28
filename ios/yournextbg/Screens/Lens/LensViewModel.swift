import Foundation
import Observation

/// State for the comparison lens screen. Owns the chosen lens + A/B
/// game ids, fetches the underlying Game rows on demand, and computes
/// the "similar to A under this lens" list client-side after a single
/// `similar_games` RPC call.
@Observable
@MainActor
public final class LensViewModel {
    public var lens: LensKey = .standard {
        didSet { rerank() }
    }
    public private(set) var gameA: Game?
    public private(set) var gameB: Game?
    public private(set) var similarToA: [Game] = []
    public private(set) var similarCandidates: [Game] = []
    public var isLoading: Bool = false
    public var lastError: String?

    private let repository: GameRepository

    public init(repository: GameRepository) {
        self.repository = repository
    }

    public func setA(_ game: Game) async {
        gameA = game
        await loadSimilar()
    }

    public func setB(_ game: Game) {
        gameB = game
    }

    public func swap() {
        let tmp = gameA
        gameA = gameB
        gameB = tmp
        Task { await loadSimilar() }
    }

    private func loadSimilar() async {
        guard let a = gameA else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            similarCandidates = try await repository.similarGames(
                anchorId: a.id,
                lens: lens,
                limit: 25
            )
            rerank()
            lastError = nil
        } catch {
            lastError = error.localizedDescription
        }
    }

    public func rerank() {
        guard let a = gameA else { similarToA = []; return }
        similarToA = similarCandidates
            .filter { $0.id != a.id }
            .map { game in
                (game, Scoring.similarity(a.scores, game.scores, lens: lens))
            }
            .sorted { $0.1 > $1.1 }
            .prefix(5)
            .map { $0.0 }
    }
}
