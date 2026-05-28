import SwiftUI

public enum BtnTone: Sendable {
    case primary  // ink surface, paper label
    case ghost    // transparent surface, ink label + subtle border
    case accent   // branch-thinking (warm gold) surface
}

public enum BtnSize: Sendable {
    case sm, md, lg
}

/// Cardstock button. Mono uppercase label, wide letter-spacing, 8pt
/// rounded rectangle. Mirrors `Btn` in `src/components/ui/btn.tsx`.
public struct Btn: View {
    @Environment(\.cardstock) private var tokens
    @Environment(\.isEnabled) private var isEnabled

    private let title: String
    private let tone: BtnTone
    private let size: BtnSize
    private let action: () -> Void

    public init(
        _ title: String,
        tone: BtnTone = .primary,
        size: BtnSize = .md,
        action: @escaping () -> Void
    ) {
        self.title = title
        self.tone = tone
        self.size = size
        self.action = action
    }

    public var body: some View {
        Button(action: action) {
            Text(title.uppercased())
                .font(CardstockFont.mono(size: fontSize, weight: .medium))
                .tracking(fontSize * 0.18)
                .foregroundStyle(foreground)
                .padding(.vertical, vPad)
                .padding(.horizontal, hPad)
                .frame(maxWidth: .infinity)
        }
        .background(background)
        .overlay(border)
        .clipShape(.rect(cornerRadius: 8))
        .opacity(isEnabled ? 1 : 0.5)
    }

    // MARK: layout

    private var vPad: CGFloat {
        switch size { case .sm: 7; case .md: 10; case .lg: 13 }
    }
    private var hPad: CGFloat {
        switch size { case .sm: 10; case .md: 14; case .lg: 20 }
    }
    private var fontSize: CGFloat {
        switch size { case .sm: 9.5; case .md: 10; case .lg: 11 }
    }

    // MARK: tones

    @ViewBuilder private var background: some View {
        switch tone {
        case .primary: tokens.ink
        case .ghost:   Color.clear
        case .accent:  tokens.branchThinking
        }
    }

    private var foreground: Color {
        switch tone {
        case .primary: return tokens.paper
        case .ghost:   return tokens.ink
        case .accent:  return tokens.ink
        }
    }

    @ViewBuilder private var border: some View {
        if tone == .ghost {
            RoundedRectangle(cornerRadius: 8)
                .strokeBorder(tokens.ink.opacity(0.3), lineWidth: 1)
        } else {
            EmptyView()
        }
    }
}

#Preview {
    VStack(spacing: 10) {
        Btn("Primary", tone: .primary) {}
        Btn("Ghost", tone: .ghost) {}
        Btn("Accent", tone: .accent) {}
        Btn("Small", tone: .primary, size: .sm) {}
        Btn("Large", tone: .primary, size: .lg) {}
    }
    .padding()
    .cardstockFollowsColorScheme()
}
