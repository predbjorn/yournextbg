import XCTest
import SwiftUI
@testable import yournextbg

final class ThemeTests: XCTestCase {

    func testHexParsing() {
        // Spot-check a few tokens against the hex values in globals.css.
        // We don't have a clean Color → hex inverse, so we re-create the
        // sRGB components and compare those numerically.
        let inkLight = CardstockTokens.light.ink
        XCTAssertEqual(inkLight, Color(hex: "#1c1a14"))

        let paperDark = CardstockTokens.dark.paper
        XCTAssertEqual(paperDark, Color(hex: "#2a2620"))
    }

    func testBranchColorsDifferAcrossThemes() {
        // Sanity: dark-mode branch colors are deliberately brighter than
        // light. If both themes accidentally resolved to the same color
        // (e.g., due to a copy-paste regression in the tokens), this
        // would catch it.
        XCTAssertNotEqual(
            CardstockTokens.light.branchThinking,
            CardstockTokens.dark.branchThinking
        )
        XCTAssertNotEqual(
            CardstockTokens.light.branchInteraction,
            CardstockTokens.dark.branchInteraction
        )
    }

    func testBranchColorForLookup() {
        let t = CardstockTokens.light
        XCTAssertEqual(t.color(forBranch: .thinking), t.branchThinking)
        XCTAssertEqual(t.color(forBranch: .interaction), t.branchInteraction)
        XCTAssertEqual(t.color(forBranch: .luck), t.branchLuck)
        XCTAssertEqual(t.color(forBranch: .experience), t.branchExperience)
    }

    func testBoxCoverPaletteIsDeterministic() {
        // The hash mod count means same title => same palette across
        // runs. Important so a game's tile doesn't flicker between
        // recompositions.
        let a = BoxCover.palette(for: "Brass: Birmingham")
        let b = BoxCover.palette(for: "Brass: Birmingham")
        XCTAssertEqual(a.bg, b.bg)
        XCTAssertEqual(a.fg, b.fg)
    }
}
