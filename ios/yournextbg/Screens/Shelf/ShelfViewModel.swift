import Foundation
import Observation

/// Owns shelf data fetching + simple filter/sort UI state.
@Observable
@MainActor
public final class ShelfViewModel {
    public enum Filter: Hashable, CaseIterable {
        case all, owned, wishlist, played, pending
    }

    public enum Sort: Hashable, CaseIterable {
        case name, recentlyAdded
    }

    public var rows: [ShelfRow] = []
    public var filter: Filter = .all
    public var sort: Sort = .name
    public var isLoading: Bool = false
    public var lastError: String?

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
            rows = try await repository.fetchShelf(userId: userId)
            lastError = nil
        } catch {
            lastError = error.localizedDescription
        }
    }

    public var visibleRows: [ShelfRow] {
        let filtered = rows.filter { row in
            switch filter {
            case .all:      return true
            case .owned:    return row.status == "owned"
            case .wishlist: return row.status == "wishlist"
            case .played:   return row.status == "played"
            case .pending:  return row.game.scoreStatus == "unscored"
            }
        }
        switch sort {
        case .name:
            return filtered.sorted { $0.game.name.lowercased() < $1.game.name.lowercased() }
        case .recentlyAdded:
            // collection_items don't expose createdAt in ShelfRow yet;
            // fall back to name sort with a stable reversal so users
            // still see *some* ordering signal.
            return filtered.reversed()
        }
    }
}
