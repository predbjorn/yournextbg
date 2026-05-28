import SwiftUI

/// Cardstock typography helpers. Web uses Fraunces (display, serif) and
/// JetBrains Mono (mono). On iOS we map to the closest first-party
/// equivalents — New York (serif) and SF Mono (mono) — until / unless
/// we add the same custom font files to the bundle.
public enum CardstockFont {
    /// Display serif — used for game titles, hero headings.
    public static func display(size: CGFloat, weight: Font.Weight = .heavy) -> Font {
        .system(size: size, weight: weight, design: .serif)
    }

    /// Mono uppercase — used for stamps, axis labels, chips, buttons.
    public static func mono(size: CGFloat, weight: Font.Weight = .medium) -> Font {
        .system(size: size, weight: weight, design: .monospaced)
    }

    /// Body sans — fallback for prose. Web uses system sans; we mirror.
    public static func body(size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .system(size: size, weight: weight)
    }
}
