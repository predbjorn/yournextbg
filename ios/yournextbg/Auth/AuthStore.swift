import Foundation
import Supabase
import Observation

/// High-level auth state surfaced to the UI. The full Supabase Session
/// is wrapped in `.signedIn` so the AuthStore can stay independent of
/// the SDK type for tests.
public enum AuthState: Equatable, Sendable {
    case loading
    case signedOut
    case signedIn(userId: String, email: String?)

    public var isSignedIn: Bool {
        if case .signedIn = self { return true }
        return false
    }
}

/// Minimal protocol over Supabase's `auth` so tests can inject a stub.
/// Only covers the surface the iOS app currently uses.
public protocol AuthBackend: AnyObject, Sendable {
    func currentSession() async -> AuthSnapshot?
    func authStateUpdates() -> AsyncStream<AuthSnapshot?>
    func signOut() async throws
}

/// Sub-set of Supabase's `Session` we care about. Sendable across actors.
public struct AuthSnapshot: Equatable, Sendable {
    public let userId: String
    public let email: String?

    public init(userId: String, email: String?) {
        self.userId = userId
        self.email = email
    }
}

/// Observable auth store. Owns the canonical `AuthState` for the UI.
@Observable
@MainActor
public final class AuthStore {
    public private(set) var state: AuthState = .loading

    private let backend: AuthBackend
    private var subscription: Task<Void, Never>?

    public init(backend: AuthBackend) {
        self.backend = backend
    }

    /// Boots the store: restores the cached session, then subscribes to
    /// future auth-state changes. Idempotent.
    public func start() {
        if subscription != nil { return }
        Task { @MainActor in
            // Initial snapshot.
            let snap = await backend.currentSession()
            apply(snap)
            // Then stream future events.
            subscription = Task { [weak self] in
                guard let self else { return }
                for await snap in backend.authStateUpdates() {
                    await MainActor.run { self.apply(snap) }
                }
            }
        }
    }

    public func signOut() async {
        do {
            try await backend.signOut()
            state = .signedOut
        } catch {
            // We're best-effort here — Supabase signOut clearing local
            // tokens shouldn't fail in practice. If it does, force the
            // UI to signed-out so the user can recover.
            #if DEBUG
            print("[AuthStore] signOut failed: \(error)")
            #endif
            state = .signedOut
        }
    }

    private func apply(_ snap: AuthSnapshot?) {
        if let snap {
            state = .signedIn(userId: snap.userId, email: snap.email)
        } else {
            state = .signedOut
        }
    }
}

// MARK: - Live backend backed by Supabase SDK

/// Production `AuthBackend` implementation using the real Supabase
/// client. Held off of `AuthStore` so it can be swapped in tests.
public final class LiveAuthBackend: AuthBackend, @unchecked Sendable {
    private let client: SupabaseClient

    public init(client: SupabaseClient) {
        self.client = client
    }

    public func currentSession() async -> AuthSnapshot? {
        // The Supabase SDK throws if there is no session — that's our
        // signed-out signal.
        do {
            let session = try await client.auth.session
            return snapshot(from: session)
        } catch {
            return nil
        }
    }

    public func authStateUpdates() -> AsyncStream<AuthSnapshot?> {
        AsyncStream { continuation in
            let task = Task {
                for await (event, session) in await client.auth.authStateChanges {
                    _ = event  // unused; we project the session
                    continuation.yield(session.map { self.snapshot(from: $0) })
                }
                continuation.finish()
            }
            continuation.onTermination = { _ in task.cancel() }
        }
    }

    public func signOut() async throws {
        try await client.auth.signOut()
    }

    private func snapshot(from session: Session) -> AuthSnapshot {
        AuthSnapshot(userId: session.user.id.uuidString, email: session.user.email)
    }
}
