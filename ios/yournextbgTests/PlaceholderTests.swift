import XCTest
@testable import yournextbg

/// Sanity test so the test target compiles and runs from Phase 0 onward.
/// Real tests land in Phase 1+ (scoring parity, viewmodels, etc.).
final class PlaceholderTests: XCTestCase {
    func testPhaseZeroSanity() {
        XCTAssertEqual(1 + 1, 2)
    }
}
