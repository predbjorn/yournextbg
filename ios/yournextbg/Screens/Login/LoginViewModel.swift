import Foundation
import Observation

/// State for the login screen. Owns the magic-link email field +
/// surfaces flow status (idle / submitting / sent / error).
@Observable
@MainActor
public final class LoginViewModel {
    public var email: String = ""
    public var magicLinkState: MagicLinkState = .idle
    public var lastError: String?

    public enum MagicLinkState: Equatable {
        case idle
        case sending
        case sent
        case error(String)
    }

    public var isEmailValid: Bool {
        // Pragmatic email check — full RFC 5322 is overkill for a soft
        // validator. Server still rejects bad addresses.
        let trimmed = email.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmed.contains("@"),
              let at = trimmed.firstIndex(of: "@"),
              at != trimmed.startIndex,
              at < trimmed.index(before: trimmed.endIndex) else { return false }
        let domain = trimmed[trimmed.index(after: at)...]
        return domain.contains(".")
    }

    public init() {}

    public func setSending() {
        magicLinkState = .sending
        lastError = nil
    }

    public func setSent() {
        magicLinkState = .sent
    }

    public func setError(_ message: String) {
        magicLinkState = .error(message)
        lastError = message
    }
}
