import XCTest
@testable import yournextbg

@MainActor
final class ShelfViewModelTests: XCTestCase {

    func testLoadFetchesAndExposesRows() async {
        let repo = StubGameRepository()
        repo.nextShelf = [
            ShelfRow(game: .sample(id: "a", name: "Alpha"), status: "owned"),
            ShelfRow(game: .sample(id: "b", name: "Bravo"), status: "wishlist"),
        ]
        let vm = ShelfViewModel(userId: "user-1", repository: repo)
        await vm.load()
        XCTAssertEqual(vm.rows.count, 2)
        XCTAssertNil(vm.lastError)
    }

    func testFilterRestrictsRows() async {
        let repo = StubGameRepository()
        repo.nextShelf = [
            ShelfRow(game: .sample(id: "a", name: "Alpha"), status: "owned"),
            ShelfRow(game: .sample(id: "b", name: "Bravo"), status: "wishlist"),
            ShelfRow(game: .sample(id: "c", name: "Charlie"), status: "played"),
        ]
        let vm = ShelfViewModel(userId: "user-1", repository: repo)
        await vm.load()

        vm.filter = .owned
        XCTAssertEqual(vm.visibleRows.map { $0.game.id }, ["a"])
        vm.filter = .wishlist
        XCTAssertEqual(vm.visibleRows.map { $0.game.id }, ["b"])
        vm.filter = .all
        XCTAssertEqual(vm.visibleRows.count, 3)
    }

    func testPendingFilterMatchesUnscored() async {
        let pending = Game(
            id: "p", slug: "p", name: "Pending",
            scores: ScoreVector(Array(repeating: 0.0, count: AXIS_COUNT)),
            solo: 0, fiddly: 0, year: 2024, scoreStatus: "unscored"
        )
        let repo = StubGameRepository()
        repo.nextShelf = [
            ShelfRow(game: .sample(id: "a", name: "Alpha"), status: "owned"),
            ShelfRow(game: pending, status: "owned"),
        ]
        let vm = ShelfViewModel(userId: "user-1", repository: repo)
        await vm.load()
        vm.filter = .pending
        XCTAssertEqual(vm.visibleRows.map { $0.game.id }, ["p"])
    }

    func testSortByNameIsCaseInsensitive() async {
        let repo = StubGameRepository()
        repo.nextShelf = [
            ShelfRow(game: .sample(id: "c", name: "charlie"), status: "owned"),
            ShelfRow(game: .sample(id: "a", name: "Alpha"), status: "owned"),
            ShelfRow(game: .sample(id: "b", name: "bravo"), status: "owned"),
        ]
        let vm = ShelfViewModel(userId: "user-1", repository: repo)
        await vm.load()
        XCTAssertEqual(vm.visibleRows.map { $0.game.id }, ["a", "b", "c"])
    }

    func testLoadCapturesError() async {
        let repo = StubGameRepository()
        repo.errorToThrow = NSError(domain: "test", code: 1, userInfo: [NSLocalizedDescriptionKey: "fail"])
        let vm = ShelfViewModel(userId: "user-1", repository: repo)
        await vm.load()
        XCTAssertEqual(vm.lastError, "fail")
    }
}
