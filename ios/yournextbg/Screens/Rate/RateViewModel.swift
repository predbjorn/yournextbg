import Foundation
import Observation

/// Card-stack rating viewmodel. Holds a FIFO queue of unrated owned
/// games and pops the top card after each submit (optimistic) or skip.
///
/// Submission is fire-and-forget into the repository; if it fails, the
/// card is pushed back on the front so the user can retry.
@Observable
@MainActor
public final class RateViewModel {
    public private(set) var queue: [Game] = []
    public private(set) var isLoading: Bool = false
    public var lastError: String?

    private let userId: String
    private let repository: GameRepository

    public init(userId: String, repository: GameRepository) {
        self.userId = userId
        self.repository = repository
    }

    /// Pulls the unrated subset of the user's shelf. Same query as
    /// Shelf but post-filters to `status == "owned"` AND missing rating.
    public func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            let rows = try await repository.fetchShelf(userId: userId)
            queue = rows
                .filter { $0.status == "owned" && $0.userRating == nil && $0.game.scoreStatus != "unscored" }
                .map { $0.game }
            lastError = nil
        } catch {
            lastError = error.localizedDescription
        }
    }

    public var top: Game? { queue.first }
    public var next: Game? { queue.dropFirst().first }

    /// Pop the top card without submitting. Used by the swipe-left skip
    /// gesture.
    public func skip() {
        guard !queue.isEmpty else { return }
        queue.removeFirst()
    }

    /// Submit a 1–5 rating for the top card. Pops immediately
    /// (optimistic); on failure, the card is re-inserted at front.
    public func submit(rating: Int) async {
        guard let game = top else { return }
        queue.removeFirst()
        do {
            try await repository.submitRating(userId: userId, gameId: game.id, rating: rating)
        } catch {
            // Roll back.
            queue.insert(game, at: 0)
            lastError = error.localizedDescription
        }
    }
}
