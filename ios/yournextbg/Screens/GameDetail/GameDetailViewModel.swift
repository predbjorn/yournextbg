import Foundation
import Observation

@Observable
@MainActor
public final class GameDetailViewModel {
    public private(set) var game: Game?
    public private(set) var similar: [Game] = []
    public var isLoading = false
    public var lastError: String?

    private let gameId: String
    private let repository: GameRepository

    public init(gameId: String, repository: GameRepository) {
        self.gameId = gameId
        self.repository = repository
    }

    public func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            async let gameTask = repository.fetchGame(id: gameId)
            async let similarTask = repository.similarGames(
                anchorId: gameId, lens: .standard, limit: 5
            )
            game = try await gameTask
            similar = try await similarTask
            lastError = nil
        } catch {
            lastError = error.localizedDescription
        }
    }

    public var branchScores: [(branch: Branch, axes: [(AxisKey, Double)])] {
        guard let game else { return [] }
        return Branch.allCases.map { branch in
            let axes = AxisKey.allCases
                .filter { $0.branch == branch }
                .map { ($0, game.scores[$0]) }
            return (branch, axes)
        }
    }
}
