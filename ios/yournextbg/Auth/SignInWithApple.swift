import SwiftUI
import AuthenticationServices
import CryptoKit
import Supabase

/// Wraps Apple's `SignInWithAppleButton` and exchanges the resulting
/// identity token for a Supabase session via
/// `auth.signInWithIdToken(provider: .apple)`. Supabase already holds
/// the SIWA private key, so we only need the identity token + nonce.
///
/// Cardstock styling is applied by sizing + wrapping; we let Apple
/// render the button itself per their HIG requirement.
public struct SignInWithAppleView: View {
    @Environment(\.colorScheme) private var colorScheme

    private let onResult: (Result<Void, Error>) -> Void
    private let client: SupabaseClient?
    @State private var currentNonce: String?

    public init(
        client: SupabaseClient?,
        onResult: @escaping (Result<Void, Error>) -> Void
    ) {
        self.client = client
        self.onResult = onResult
    }

    public var body: some View {
        SignInWithAppleButton(.signIn) { request in
            let nonce = Self.randomNonce()
            currentNonce = nonce
            request.requestedScopes = [.fullName, .email]
            request.nonce = Self.sha256(nonce)
        } onCompletion: { result in
            Task { await handle(result) }
        }
        .signInWithAppleButtonStyle(colorScheme == .dark ? .white : .black)
        .frame(height: 48)
        .clipShape(.rect(cornerRadius: 8))
    }

    @MainActor
    private func handle(_ result: Result<ASAuthorization, Error>) async {
        switch result {
        case .failure(let err):
            onResult(.failure(err))

        case .success(let auth):
            guard
                let credential = auth.credential as? ASAuthorizationAppleIDCredential,
                let tokenData = credential.identityToken,
                let token = String(data: tokenData, encoding: .utf8),
                let nonce = currentNonce
            else {
                onResult(.failure(SignInWithAppleError.missingIdentityToken))
                return
            }
            guard let client else {
                onResult(.failure(SignInWithAppleError.supabaseUnavailable))
                return
            }
            do {
                try await client.auth.signInWithIdToken(
                    credentials: OpenIDConnectCredentials(
                        provider: .apple,
                        idToken: token,
                        nonce: nonce
                    )
                )
                onResult(.success(()))
            } catch {
                onResult(.failure(error))
            }
        }
    }

    // MARK: nonce helpers
    // Standard Apple-recommended nonce flow.

    static func randomNonce(length: Int = 32) -> String {
        let charset: [Character] =
            Array("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-._")
        var result = ""
        var remaining = length
        while remaining > 0 {
            var bytes = [UInt8](repeating: 0, count: 16)
            let status = SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes)
            precondition(status == errSecSuccess, "SecRandomCopyBytes failed")
            for byte in bytes where remaining > 0 {
                if byte < charset.count {
                    result.append(charset[Int(byte)])
                    remaining -= 1
                }
            }
        }
        return result
    }

    static func sha256(_ input: String) -> String {
        let digest = SHA256.hash(data: Data(input.utf8))
        return digest.map { String(format: "%02x", $0) }.joined()
    }
}

public enum SignInWithAppleError: Error, LocalizedError {
    case missingIdentityToken
    case supabaseUnavailable

    public var errorDescription: String? {
        switch self {
        case .missingIdentityToken:
            return "Apple did not return an identity token."
        case .supabaseUnavailable:
            return "Supabase client is not configured. Check yournextbg.xcconfig."
        }
    }
}
