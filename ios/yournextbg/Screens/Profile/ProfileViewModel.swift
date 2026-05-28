import Foundation
import Observation

/// Owns the editable copy of `UserPrefs` + drives the manual BGG sync
/// button. Writes through to the repository on save.
@Observable
@MainActor
public final class ProfileViewModel {
    public var prefs: UserPrefs
    public var bggUsernameDraft: String = ""
    public var theme: AppearancePreference = .auto
    public var defaultLens: LensKey = .standard

    public var isSaving = false
    public var isSyncing = false
    public var lastError: String?
    public var lastSyncResult: BggSyncResult?

    private let userId: String
    private let repository: GameRepository
    private let bggSync: BggSyncing?

    public init(userId: String, repository: GameRepository, bggSync: BggSyncing? = nil) {
        self.userId = userId
        self.repository = repository
        self.bggSync = bggSync
        self.prefs = UserPrefs(userId: userId)
    }

    public func load() async {
        do {
            if let loaded = try await repository.fetchPrefs(userId: userId) {
                prefs = loaded
                bggUsernameDraft = loaded.bggUsername ?? ""
                if let raw = loaded.theme, let parsed = AppearancePreference(rawValue: raw) {
                    theme = parsed
                }
                defaultLens = loaded.defaultLens ?? .standard
            }
        } catch {
            lastError = error.localizedDescription
        }
    }

    public func save() async {
        isSaving = true
        defer { isSaving = false }
        let updated = UserPrefs(
            userId: userId,
            bggUsername: bggUsernameDraft.isEmpty ? nil : bggUsernameDraft,
            bggSyncEnabled: prefs.bggSyncEnabled,
            defaultLens: defaultLens,
            theme: theme.rawValue
        )
        do {
            try await repository.updatePrefs(updated)
            prefs = updated
            lastError = nil
        } catch {
            lastError = error.localizedDescription
        }
    }

    public func syncBGG() async {
        guard let bggSync else {
            lastError = "BGG sync is not configured."
            return
        }
        isSyncing = true
        defer { isSyncing = false }
        do {
            lastSyncResult = try await bggSync.sync()
            lastError = nil
        } catch {
            lastError = error.localizedDescription
        }
    }
}
