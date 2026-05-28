import XCTest
@testable import yournextbg

@MainActor
final class ProfileViewModelTests: XCTestCase {

    final class StubBggSync: BggSyncing, @unchecked Sendable {
        var result: BggSyncResult = BggSyncResult(ok: true, owned: 42, wishlist: 12, newUnscored: 5)
        var errorToThrow: Error?
        func sync() async throws -> BggSyncResult {
            if let errorToThrow { throw errorToThrow }
            return result
        }
    }

    func testLoadPopulatesDraftsFromPrefs() async {
        let repo = StubGameRepository()
        repo.nextPrefs = UserPrefs(
            userId: "u",
            bggUsername: "boardgamer42",
            bggSyncEnabled: true,
            defaultLens: .feel,
            theme: "dark"
        )
        let vm = ProfileViewModel(userId: "u", repository: repo)
        await vm.load()
        XCTAssertEqual(vm.bggUsernameDraft, "boardgamer42")
        XCTAssertEqual(vm.defaultLens, .feel)
        XCTAssertEqual(vm.theme, .dark)
    }

    func testSaveWritesPrefs() async {
        let repo = StubGameRepository()
        let vm = ProfileViewModel(userId: "u", repository: repo)
        vm.bggUsernameDraft = "newuser"
        vm.theme = .light
        vm.defaultLens = .luck
        await vm.save()
        XCTAssertEqual(repo.recordedPrefsUpdates.count, 1)
        let saved = repo.recordedPrefsUpdates.first
        XCTAssertEqual(saved?.bggUsername, "newuser")
        XCTAssertEqual(saved?.theme, "light")
        XCTAssertEqual(saved?.defaultLens, .luck)
    }

    func testSyncBGGStoresResult() async {
        let repo = StubGameRepository()
        let bgg = StubBggSync()
        let vm = ProfileViewModel(userId: "u", repository: repo, bggSync: bgg)
        await vm.syncBGG()
        XCTAssertEqual(vm.lastSyncResult?.owned, 42)
        XCTAssertEqual(vm.lastSyncResult?.wishlist, 12)
        XCTAssertEqual(vm.lastSyncResult?.newUnscored, 5)
    }

    func testSyncBGGCapturesError() async {
        let repo = StubGameRepository()
        let bgg = StubBggSync()
        bgg.errorToThrow = NSError(domain: "test", code: 1, userInfo: [NSLocalizedDescriptionKey: "boom"])
        let vm = ProfileViewModel(userId: "u", repository: repo, bggSync: bgg)
        await vm.syncBGG()
        XCTAssertEqual(vm.lastError, "boom")
    }
}
