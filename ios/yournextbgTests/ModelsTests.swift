import XCTest
@testable import yournextbg

final class ModelsTests: XCTestCase {

    // MARK: AxisKey + Branch

    func testAxisOrderMatchesContract() {
        // The order is load-bearing. If this test fails, the parity fixture
        // is also wrong and any DB rows decoded into ScoreVector will be
        // misaligned.
        let expected: [AxisKey] = [
            .weight, .depth, .density,
            .interaction, .conflict, .negotiation,
            .input, .output, .catchup,
            .theme, .engine, .narrative,
        ]
        XCTAssertEqual(AxisKey.allCases, expected)
        XCTAssertEqual(AXIS_COUNT, 12)
    }

    func testAxisBranchAssignment() {
        XCTAssertEqual(AxisKey.weight.branch, .thinking)
        XCTAssertEqual(AxisKey.depth.branch, .thinking)
        XCTAssertEqual(AxisKey.density.branch, .thinking)
        XCTAssertEqual(AxisKey.interaction.branch, .interaction)
        XCTAssertEqual(AxisKey.conflict.branch, .interaction)
        XCTAssertEqual(AxisKey.negotiation.branch, .interaction)
        XCTAssertEqual(AxisKey.input.branch, .luck)
        XCTAssertEqual(AxisKey.output.branch, .luck)
        XCTAssertEqual(AxisKey.catchup.branch, .luck)
        XCTAssertEqual(AxisKey.theme.branch, .experience)
        XCTAssertEqual(AxisKey.engine.branch, .experience)
        XCTAssertEqual(AxisKey.narrative.branch, .experience)
    }

    // MARK: ScoreVector

    func testScoreVectorSubscriptByAxis() {
        let v = ScoreVector([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 0.5, 0.25])
        XCTAssertEqual(v[.weight], 1.0)
        XCTAssertEqual(v[.depth], 2.0)
        XCTAssertEqual(v[.narrative], 0.25)
    }

    func testScoreVectorRoundtripJSON() throws {
        let v = ScoreVector([3.1, 4.5, 2.0, 6.7, 1.0, 0.5, 5.5, 4.0, 3.3, 7.7, 8.8, 9.9])
        let data = try JSONEncoder().encode(v)
        let back = try JSONDecoder().decode(ScoreVector.self, from: data)
        XCTAssertEqual(back, v)
    }

    func testScoreVectorRejectsWrongLength() {
        let data = "[1,2,3]".data(using: .utf8)!
        XCTAssertThrowsError(try JSONDecoder().decode(ScoreVector.self, from: data))
    }

    // MARK: Game

    func testGameDecodesFromSupabaseRowFixture() throws {
        // Realistic shape: snake_case keys, score vector as JSON array,
        // optional player_count omitted, optional cover URLs absent.
        let json = #"""
        {
          "id": "brass-birmingham",
          "slug": "brass-birmingham",
          "name": "Brass: Birmingham",
          "bgg_id": 224517,
          "scores": [8.5, 9.0, 7.5, 7.0, 4.0, 2.5, 1.5, 1.0, 3.0, 7.5, 9.0, 6.0],
          "solo": 0,
          "fiddly": 4,
          "year": 2018,
          "designer": "Wallace & Wallace",
          "publisher": "Roxley",
          "signature": "Industrial-revolution canal network builder",
          "score_status": "scored"
        }
        """#.data(using: .utf8)!

        let game = try JSONDecoder().decode(Game.self, from: json)
        XCTAssertEqual(game.id, "brass-birmingham")
        XCTAssertEqual(game.bggId, 224517)
        XCTAssertEqual(game.scores.values.count, AXIS_COUNT)
        XCTAssertEqual(game.scores[.weight], 8.5)
        XCTAssertEqual(game.scores[.narrative], 6.0)
        XCTAssertEqual(game.scoreStatus, "scored")
        XCTAssertNil(game.playerCount)
    }

    // MARK: LensKey

    func testLensKeysCover12Axes() {
        for lens in LensKey.allCases {
            XCTAssertEqual(lens.weights.count, AXIS_COUNT,
                           "Lens \(lens.rawValue) is missing weights")
            for key in AxisKey.allCases {
                XCTAssertNotNil(lens.weights[key],
                                "Lens \(lens.rawValue) missing weight for \(key.rawValue)")
            }
        }
    }
}
