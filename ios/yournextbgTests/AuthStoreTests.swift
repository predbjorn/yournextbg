import XCTest
@testable import yournextbg

@MainActor
final class AuthStoreTests: XCTestCase {

    func testInitialStateIsLoading() {
        let backend = StubAuthBackend(initial: nil)
        let store = AuthStore(backend: backend)
        XCTAssertEqual(store.state, .loading)
    }

    func testStartRestoresSignedOut() async {
        let backend = StubAuthBackend(initial: nil)
        let store = AuthStore(backend: backend)
        store.start()
        await fulfill(after: 0.05)
        XCTAssertEqual(store.state, .signedOut)
    }

    func testStartRestoresSignedIn() async {
        let snap = AuthSnapshot(userId: "uid-1", email: "user@example.com")
        let backend = StubAuthBackend(initial: snap)
        let store = AuthStore(backend: backend)
        store.start()
        await fulfill(after: 0.05)
        XCTAssertEqual(store.state, .signedIn(userId: "uid-1", email: "user@example.com"))
        XCTAssertTrue(store.state.isSignedIn)
    }

    func testSignOutFlipsState() async {
        let snap = AuthSnapshot(userId: "uid-1", email: nil)
        let backend = StubAuthBackend(initial: snap)
        let store = AuthStore(backend: backend)
        store.start()
        await fulfill(after: 0.05)
        XCTAssertTrue(store.state.isSignedIn)

        await store.signOut()
        XCTAssertEqual(store.state, .signedOut)
        XCTAssertEqual(backend.signOutCount, 1)
    }

    // Test helper: lets the bootstrap Task and any continuation runs
    // settle before assertions.
    private func fulfill(after seconds: TimeInterval) async {
        try? await Task.sleep(nanoseconds: UInt64(seconds * 1_000_000_000))
    }
}

/// In-process stub backend. Records side-effects for assertions.
final class StubAuthBackend: AuthBackend, @unchecked Sendable {
    private let initial: AuthSnapshot?
    var signOutCount = 0

    init(initial: AuthSnapshot?) {
        self.initial = initial
    }

    func currentSession() async -> AuthSnapshot? { initial }

    func authStateUpdates() -> AsyncStream<AuthSnapshot?> {
        AsyncStream { continuation in
            // No-op stream; AuthStore should already have applied
            // currentSession() before tests assert.
            continuation.onTermination = { _ in }
        }
    }

    func signOut() async throws {
        signOutCount += 1
    }
}
