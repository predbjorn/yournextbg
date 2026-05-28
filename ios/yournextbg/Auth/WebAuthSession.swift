import Foundation
import AuthenticationServices
import Supabase

/// Wraps `ASWebAuthenticationSession` for the OAuth providers Supabase
/// exposes. Used for Google sign-in and magic-link follow-through.
///
/// Sign in with Apple uses the native button + identity-token exchange
/// instead — see `SignInWithAppleView`.
@MainActor
public final class WebAuthSession: NSObject {

    /// Starts an OAuth handshake against Supabase. Returns when the user
    /// completes auth (or cancels). Supabase parses the redirect URL.
    public func signInWithGoogle(client: SupabaseClient) async throws {
        try await client.auth.signInWithOAuth(
            provider: .google,
            redirectTo: URL(string: "yournextbg://auth-callback"),
            launchFlow: { @Sendable url in
                try await Self.launch(url: url, callbackScheme: "yournextbg")
            }
        )
    }

    /// Sends a magic link to `email`. The link opens via universal
    /// links (associated domain `applinks:yournextbg.com`) into the app,
    /// where the Supabase client recovers the session from the URL.
    public func sendMagicLink(email: String, client: SupabaseClient) async throws {
        try await client.auth.signInWithOTP(
            email: email,
            redirectTo: URL(string: "https://yournextbg.com/auth/callback")
        )
    }

    /// Process an incoming universal link. Call from
    /// `.onOpenURL { ... }` on the app root.
    public static func handle(url: URL, client: SupabaseClient) async {
        do {
            try await client.auth.session(from: url)
        } catch {
            #if DEBUG
            print("[WebAuthSession] failed to apply session from URL: \(error)")
            #endif
        }
    }

    // MARK: launch helper

    private static func launch(url: URL, callbackScheme: String) async throws -> URL {
        try await withCheckedThrowingContinuation { continuation in
            let session = ASWebAuthenticationSession(
                url: url,
                callbackURLScheme: callbackScheme
            ) { callback, error in
                if let error {
                    continuation.resume(throwing: error)
                } else if let callback {
                    continuation.resume(returning: callback)
                } else {
                    continuation.resume(
                        throwing: NSError(domain: "WebAuthSession", code: -1)
                    )
                }
            }
            session.presentationContextProvider = PresentationAnchor.shared
            session.prefersEphemeralWebBrowserSession = false
            if !session.start() {
                continuation.resume(
                    throwing: NSError(
                        domain: "WebAuthSession",
                        code: -2,
                        userInfo: [NSLocalizedDescriptionKey: "ASWebAuthenticationSession failed to start"]
                    )
                )
            }
        }
    }
}

/// Provides a window anchor for `ASWebAuthenticationSession`. We don't
/// own a UIWindow directly in SwiftUI, so we pluck the active key
/// window from the connected scenes.
private final class PresentationAnchor: NSObject, ASWebAuthenticationPresentationContextProviding {
    static let shared = PresentationAnchor()

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        let scenes = UIApplication.shared.connectedScenes
        let windowScene = scenes.first { $0 is UIWindowScene } as? UIWindowScene
        let window = windowScene?.windows.first { $0.isKeyWindow } ?? UIWindow()
        return window
    }
}
