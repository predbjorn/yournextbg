import SwiftUI

/// Stamp color tone. Mirrors `StampColor` from
/// `src/components/ui/stamp.tsx`.
public enum StampColor: Sendable {
    case ink
    case muted
    case mutedSoft
    case paper
    case branch(Branch)
    case positive
    case negative
    case current  // inherits surrounding text color
}

/// Small-caps mono label. Wide tracking, uppercase, slightly dimmed by
/// default. Used for stamps, axis labels, status tags.
public struct Stamp: View {
    @Environment(\.cardstock) private var tokens

    private let text: String
    private let color: StampColor
    private let size: CGFloat

    public init(_ text: String, color: StampColor = .ink, size: CGFloat = 10) {
        self.text = text
        self.color = color
        self.size = size
    }

    public var body: some View {
        Text(text.uppercased())
            .font(CardstockFont.mono(size: size, weight: .medium))
            .tracking(size * 0.22)
            .opacity(0.85)
            .foregroundStyle(resolvedColor)
    }

    private var resolvedColor: Color {
        switch color {
        case .ink:        return tokens.ink
        case .muted:      return tokens.muted
        case .mutedSoft:  return tokens.mutedSoft
        case .paper:      return tokens.paper
        case .branch(let b): return tokens.color(forBranch: b)
        case .positive:   return tokens.positive
        case .negative:   return tokens.negative
        case .current:    return .primary
        }
    }
}

#Preview {
    VStack(alignment: .leading, spacing: 8) {
        Stamp("default ink")
        Stamp("muted", color: .muted)
        Stamp("interaction", color: .branch(.interaction))
        Stamp("positive", color: .positive)
        Stamp("negative", color: .negative)
    }
    .padding()
    .cardstockFollowsColorScheme()
}
