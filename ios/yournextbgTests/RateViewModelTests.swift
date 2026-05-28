import XCTest
@testable import yournextbg

@MainActor
final class RateViewModelTests: XCTestCase {

    func testLoadFiltersToUnratedOwnedScoredGames() async {
        let repo = StubGameRepository()
        let unscored = Game(
            id: "x", slug: "x", name: "X",
            scores: ScoreVector(Array(repeating: 0.0, count: AXIS_COUNT)),
            solo: 0, fiddly: 0, scoreStatus: "unscored"
        )
        repo.nextShelf = [
            ShelfRow(game: .sample(id: "a", name: "Alpha"), status: "owned", userRating: nil),
            ShelfRow(game: .sample(id: "b", name: "Bravo"), status: "owned", userRating: 4),  // already rated
            ShelfRow(game: .sample(id: "c", name: "Charlie"), status: "wishlist", userRating: nil),  // not owned
            ShelfRow(game: unscored, status: "owned", userRating: nil),                       // unscored
        ]
        let vm = RateViewModel(userId: "u", repository: repo)
        await vm.load()
        XCTAssertEqual(vm.queue.map { $0.id }, ["a"])
        XCTAssertEqual(vm.top?.id, "a")
    }

    func testSubmitPopsAndRecords() async {
        let repo = StubGameRepository()
        repo.nextShelf = [
            ShelfRow(game: .sample(id: "a", name: "A"), status: "owned", userRating: nil),
            ShelfRow(game: .sample(id: "b", name: "B"), status: "owned", userRating: nil),
        ]
        let vm = RateViewModel(userId: "u", repository: repo)
        await vm.load()
        await vm.submit(rating: 4)
        XCTAssertEqual(vm.top?.id, "b")
        XCTAssertEqual(repo.recordedRatings.count, 1)
        XCTAssertEqual(repo.recordedRatings.first?.rating, 4)
        XCTAssertEqual(repo.recordedRatings.first?.gameId, "a")
    }

    func testSubmitRollsBackOnError() async {
        let repo = StubGameRepository()
        repo.nextShelf = [
            ShelfRow(game: .sample(id: "a", name: "A"), status: "owned", userRating: nil),
        ]
        let vm = RateViewModel(userId: "u", repository: repo)
        await vm.load()

        // Switch the repo to fail on writes after the load.
        repo.errorToThrow = NSError(domain: "test", code: 1, userInfo: [NSLocalizedDescriptionKey: "fail"])
        await vm.submit(rating: 5)
        XCTAssertEqual(vm.top?.id, "a", "card should be re-inserted after a failed submit")
        XCTAssertEqual(vm.lastError, "fail")
    }

    func testSkipPopsWithoutRecording() async {
        let repo = StubGameRepository()
        repo.nextShelf = [
            ShelfRow(game: .sample(id: "a", name: "A"), status: "owned", userRating: nil),
            ShelfRow(game: .sample(id: "b", name: "B"), status: "owned", userRating: nil),
        ]
        let vm = RateViewModel(userId: "u", repository: repo)
        await vm.load()
        vm.skip()
        XCTAssertEqual(vm.top?.id, "b")
        XCTAssertTrue(repo.recordedRatings.isEmpty)
    }
}
