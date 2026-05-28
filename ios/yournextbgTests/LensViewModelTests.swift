import XCTest
@testable import yournextbg

@MainActor
final class LensViewModelTests: XCTestCase {

    func testSetAFetchesSimilarAndRerankIsTopN() async {
        let anchor = Game.sample(id: "anchor", name: "Anchor",
                                 scores: [8, 9, 7, 6, 4, 2, 1, 1, 3, 7, 9, 5])
        let close = Game.sample(id: "close", name: "Close",
                                scores: [8, 9, 7, 6, 4, 2, 1, 1, 3, 7, 9, 5])  // identical
        let far = Game.sample(id: "far", name: "Far",
                              scores: [1, 1, 1, 9, 9, 9, 8, 8, 9, 1, 1, 1])

        let repo = StubGameRepository()
        repo.nextSimilar = [close, far]

        let vm = LensViewModel(repository: repo)
        await vm.setA(anchor)
        XCTAssertEqual(vm.similarToA.first?.id, "close")
        XCTAssertFalse(vm.similarToA.contains { $0.id == "anchor" }, "anchor must be excluded")
    }

    func testLensChangeRecomputesSimilarityScores() async {
        // Pick vectors where standard and feel lenses produce
        // measurably-different similarity scores. The ordering may
        // happen to coincide for small candidate sets, but the
        // per-candidate similarity to the anchor should differ.
        let anchor = Game.sample(id: "a", name: "A",
                                 scores: [9, 9, 8, 5, 3, 1, 1, 1, 2, 5, 9, 4])
        let candidate = Game.sample(id: "b", name: "B",
                                    scores: [3, 4, 3, 8, 7, 7, 3, 3, 3, 9, 4, 9])
        let standardSim = Scoring.similarity(anchor.scores, candidate.scores, lens: .standard)
        let feelSim = Scoring.similarity(anchor.scores, candidate.scores, lens: .feel)
        XCTAssertNotEqual(standardSim, feelSim, accuracy: 1e-9)

        let repo = StubGameRepository()
        repo.nextSimilar = [candidate]
        let vm = LensViewModel(repository: repo)
        await vm.setA(anchor)
        XCTAssertEqual(vm.similarToA.first?.id, "b")
        vm.lens = .feel
        XCTAssertEqual(vm.similarToA.first?.id, "b")  // still in the list
    }

    func testSwapFlipsAandB() async {
        let a = Game.sample(id: "a", name: "A")
        let b = Game.sample(id: "b", name: "B")
        let repo = StubGameRepository()
        let vm = LensViewModel(repository: repo)
        await vm.setA(a)
        vm.setB(b)
        XCTAssertEqual(vm.gameA?.id, "a")
        XCTAssertEqual(vm.gameB?.id, "b")
        vm.swap()
        XCTAssertEqual(vm.gameA?.id, "b")
        XCTAssertEqual(vm.gameB?.id, "a")
    }
}
