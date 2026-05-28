import XCTest
@testable import yournextbg

@MainActor
final class LoginViewModelTests: XCTestCase {

    func testEmailValidationAcceptsBasicShape() {
        let vm = LoginViewModel()
        vm.email = "u@example.com"
        XCTAssertTrue(vm.isEmailValid)
    }

    func testEmailValidationRejectsObviousJunk() {
        let vm = LoginViewModel()
        for bad in ["", " ", "no-at", "no-at.example", "@nope.com", "u@nope"] {
            vm.email = bad
            XCTAssertFalse(vm.isEmailValid, "\(bad) should be invalid")
        }
    }

    func testStateTransitions() {
        let vm = LoginViewModel()
        XCTAssertEqual(vm.magicLinkState, .idle)
        vm.setSending()
        XCTAssertEqual(vm.magicLinkState, .sending)
        vm.setSent()
        XCTAssertEqual(vm.magicLinkState, .sent)
        vm.setError("boom")
        XCTAssertEqual(vm.magicLinkState, .error("boom"))
        XCTAssertEqual(vm.lastError, "boom")
    }
}
