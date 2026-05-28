import Foundation

/// Per-user prefs row in Supabase. Mirrors `user_prefs`. All fields are
/// optional so partial updates round-trip cleanly via PATCH semantics.
public struct UserPrefs: Codable, Hashable, Sendable {
    public let userId: String
    public let bggUsername: String?
    public let bggSyncEnabled: Bool?
    public let defaultLens: LensKey?
    /// `"light"`, `"dark"`, or `"auto"`. Optional — `nil` means follow
    /// system color scheme.
    public let theme: String?

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case bggUsername = "bgg_username"
        case bggSyncEnabled = "bgg_sync_enabled"
        case defaultLens = "default_lens"
        case theme
    }

    public init(
        userId: String,
        bggUsername: String? = nil,
        bggSyncEnabled: Bool? = nil,
        defaultLens: LensKey? = nil,
        theme: String? = nil
    ) {
        self.userId = userId
        self.bggUsername = bggUsername
        self.bggSyncEnabled = bggSyncEnabled
        self.defaultLens = defaultLens
        self.theme = theme
    }
}
