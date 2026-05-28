import SwiftUI

/// Pill toggle used for lens picks, filter chips, status tags. Mirrors
/// `Chip` in `src/components/ui/chip.tsx`.
public struct Chip: View {
    @Environment(\.cardstock) private var tokens

    private let title: String
    private let on: Bool
    private let asTag: Bool
    private let action: () -> Void

    public init(_ title: String, on: Bool = false, action: @escaping () -> Void = {}) {
        self.title = title
        self.on = on
        self.asTag = false
        self.action = action
    }

    /// Static, non-interactive variant.
    public init(tag title: String, on: Bool = false) {
        self.title = title
        self.on = on
        self.asTag = true
        self.action = {}
    }

    public var body: some View {
        if asTag {
            label
        } else {
            Button(action: action) { label }
                .accessibilityAddTraits(on ? [.isSelected] : [])
        }
    }

    private var label: some View {
        Text(title.uppercased())
            .font(CardstockFont.mono(size: 9.5, weight: .medium))
            .tracking(9.5 * 0.16)
            .foregroundStyle(on ? tokens.paper : tokens.ink)
            .padding(.vertical, 5)
            .padding(.horizontal, 9)
            .background(on ? tokens.ink : Color.clear)
            .overlay(
                Capsule()
                    .strokeBorder(on ? Color.clear : tokens.ink.opacity(0.20), lineWidth: 1)
            )
            .clipShape(Capsule())
    }
}

#Preview {
    HStack(spacing: 6) {
        Chip("standard", on: true) {}
        Chip("feel") {}
        Chip("luck") {}
        Chip(tag: "owned", on: true)
    }
    .padding()
    .cardstockFollowsColorScheme()
}
