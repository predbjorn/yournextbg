import SwiftUI

/// Tone of a `Paper` surface. Mirrors `PaperTone` from
/// `src/components/ui/paper.tsx`.
public enum PaperTone: Sendable {
    case paper
    case warm
    case deep
    case felt
    case ink
}

/// The Cardstock paper primitive. Tone-aware background, embossed
/// shadow, optional subtle grain overlay. Children render above the
/// grain layer.
public struct Paper<Content: View>: View {
    @Environment(\.cardstock) private var tokens

    private let tone: PaperTone
    private let grain: Bool
    private let cornerRadius: CGFloat
    private let content: Content

    public init(
        tone: PaperTone = .paper,
        grain: Bool = true,
        cornerRadius: CGFloat = 14,
        @ViewBuilder content: () -> Content
    ) {
        self.tone = tone
        self.grain = grain
        self.cornerRadius = cornerRadius
        self.content = content()
    }

    public var body: some View {
        content
            .foregroundStyle(textColor)
            .background(
                ZStack {
                    backgroundColor
                    if grain {
                        // Subtle paper grain. On web this is a noise PNG;
                        // on iOS we synthesize with a gradient + low-alpha
                        // overlay. Tweak intensity if it reads too strong.
                        LinearGradient(
                            colors: [
                                Color.white.opacity(0.02),
                                Color.black.opacity(0.025),
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    }
                }
            )
            .clipShape(.rect(cornerRadius: cornerRadius))
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .strokeBorder(tokens.ink.opacity(0.08), lineWidth: 1)
            )
            .shadow(color: tokens.ink.opacity(0.10), radius: 0, x: 0, y: 2)
    }

    private var backgroundColor: Color {
        switch tone {
        case .paper: return tokens.paper
        case .warm:  return tokens.paperWarm
        case .deep:  return tokens.paperDeep
        case .felt:  return tokens.paperFelt
        case .ink:   return tokens.ink
        }
    }

    private var textColor: Color {
        switch tone {
        case .ink: return tokens.paper
        default:   return tokens.ink
        }
    }
}

#Preview {
    VStack(spacing: 12) {
        Paper { Text("paper").padding(20) }
        Paper(tone: .warm) { Text("warm").padding(20) }
        Paper(tone: .deep) { Text("deep").padding(20) }
        Paper(tone: .felt) { Text("felt").padding(20) }
        Paper(tone: .ink) { Text("ink").padding(20) }
    }
    .padding()
    .cardstockFollowsColorScheme()
}
