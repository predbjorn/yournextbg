import SwiftUI

/// Cardstock design tokens. Ported byte-for-byte from the `:root` and
/// `:root[data-theme="dark"]` blocks in `src/app/globals.css`. Anything
/// referenced as `--cs-*` on web has a sibling here.
public struct CardstockTokens: Equatable, Sendable {
    // Paper tones
    public let paper: Color
    public let paperWarm: Color
    public let paperDeep: Color
    public let paperEdge: Color
    public let paperFelt: Color

    // Ink + text
    public let ink: Color
    public let inkSoft: Color
    public let muted: Color
    public let mutedSoft: Color

    // Branch colors
    public let branchThinking: Color
    public let branchInteraction: Color
    public let branchLuck: Color
    public let branchExperience: Color

    // Semantic
    public let positive: Color
    public let negative: Color

    public func color(forBranch branch: Branch) -> Color {
        switch branch {
        case .thinking:    return branchThinking
        case .interaction: return branchInteraction
        case .luck:        return branchLuck
        case .experience:  return branchExperience
        }
    }
}

extension CardstockTokens {
    /// Light theme tokens — matches `:root` in `src/app/globals.css`.
    public static let light = CardstockTokens(
        paper:             Color(hex: "#efe6d0"),
        paperWarm:         Color(hex: "#f5ecd6"),
        paperDeep:         Color(hex: "#dcd0b8"),
        paperEdge:         Color(hex: "#e6dcc2"),
        paperFelt:         Color(hex: "#c8baa0"),
        ink:               Color(hex: "#1c1a14"),
        inkSoft:           Color(hex: "#3a3527"),
        muted:             Color(hex: "#776a52"),
        mutedSoft:         Color(hex: "#a89a7e"),
        branchThinking:    Color(hex: "#c98a2b"),
        branchInteraction: Color(hex: "#b6533a"),
        branchLuck:        Color(hex: "#5e7a55"),
        branchExperience:  Color(hex: "#704a82"),
        positive:          Color(hex: "#5e7a55"),
        negative:          Color(hex: "#a93b25")
    )

    /// Dark theme tokens — matches `:root[data-theme="dark"]` in
    /// `src/app/globals.css`.
    public static let dark = CardstockTokens(
        paper:             Color(hex: "#2a2620"),
        paperWarm:         Color(hex: "#33301b"),
        paperDeep:         Color(hex: "#14110b"),
        paperEdge:         Color(hex: "#3a3428"),
        paperFelt:         Color(hex: "#0c0a07"),
        ink:               Color(hex: "#ece2c8"),
        inkSoft:           Color(hex: "#b9ad93"),
        muted:             Color(hex: "#8a7e64"),
        mutedSoft:         Color(hex: "#5e5644"),
        branchThinking:    Color(hex: "#e8a448"),
        branchInteraction: Color(hex: "#dd7a5b"),
        branchLuck:        Color(hex: "#92ad7a"),
        branchExperience:  Color(hex: "#ad8acb"),
        positive:          Color(hex: "#92ad7a"),
        negative:          Color(hex: "#e08068")
    )
}

/// User's appearance preference. Mirrors web's `user_prefs.theme` column.
public enum AppearancePreference: String, Codable, CaseIterable, Hashable, Sendable {
    case light
    case dark
    case auto
}

private struct CardstockTokensKey: EnvironmentKey {
    static let defaultValue: CardstockTokens = .light
}

extension EnvironmentValues {
    /// The active Cardstock token set. Branches off the current
    /// `colorScheme` unless explicitly overridden by `.cardstock(...)`.
    public var cardstock: CardstockTokens {
        get { self[CardstockTokensKey.self] }
        set { self[CardstockTokensKey.self] = newValue }
    }
}

extension View {
    /// Injects a specific token set into the environment. Use this from
    /// the app root or a screen wrapper to force a theme.
    public func cardstock(_ tokens: CardstockTokens) -> some View {
        environment(\.cardstock, tokens)
    }

    /// Auto-binds the cardstock tokens to the current `colorScheme`.
    public func cardstockFollowsColorScheme() -> some View {
        modifier(CardstockFollowsColorScheme())
    }
}

private struct CardstockFollowsColorScheme: ViewModifier {
    @Environment(\.colorScheme) private var colorScheme
    func body(content: Content) -> some View {
        content.environment(\.cardstock, colorScheme == .dark ? .dark : .light)
    }
}
