import Foundation

/// In-app navigation routes pushed onto a tab's NavigationStack via
/// `navigationDestination(for: Route.self)`. Keep this exhaustive so
/// the compiler catches missing destinations.
public enum Route: Hashable, Sendable {
    case gameDetail(id: String)
    case lensWith(aId: String, bId: String)
}
