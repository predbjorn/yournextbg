import SwiftUI

/// Placeholder game-cover tile. Two-color palette is hashed from the
/// title so the same game lands on the same palette across renders.
/// Mirrors `BoxCover` from `src/components/ui/box-cover.tsx`.
public struct BoxCover: View {
    private let title: String
    private let year: Int?
    private let height: CGFloat
    private let radius: CGFloat

    public init(title: String, year: Int? = nil, height: CGFloat = 100, radius: CGFloat = 6) {
        self.title = title
        self.year = year
        self.height = height
        self.radius = radius
    }

    public var body: some View {
        let palette = Self.palette(for: title)
        let bg = Color(hex: palette.bg)
        let fg = Color(hex: palette.fg)
        let titleSize: CGFloat = height > 200 ? 28 : height > 130 ? 20 : height > 90 ? 16 : 12

        ZStack(alignment: .topLeading) {
            // Background fill.
            Rectangle().fill(bg)
            // Subtle radial light/shadow.
            LinearGradient(
                colors: [Color.white.opacity(0.12), Color.clear, Color.black.opacity(0.18)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            // Stripe band — evokes a printed cover.
            Rectangle()
                .fill(
                    LinearGradient(
                        colors: [Color.black.opacity(0.18), Color.clear],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .frame(height: 18)
                .opacity(0.55)
                .offset(y: height * 0.35)
            // Solid bar accent.
            Rectangle()
                .fill(fg.opacity(0.18))
                .frame(height: 6)
                .offset(y: height * 0.45)

            VStack(alignment: .leading) {
                if let year {
                    Text(String(year))
                        .font(CardstockFont.mono(size: 8))
                        .tracking(8 * 0.22)
                        .foregroundStyle(fg.opacity(0.75))
                }
                Spacer(minLength: 0)
                Text(title.uppercased())
                    .font(CardstockFont.display(size: titleSize, weight: .heavy))
                    .tracking(-0.01 * titleSize)
                    .lineLimit(2)
                    .foregroundStyle(fg)
                    .shadow(color: .black.opacity(0.3), radius: 0, x: 0, y: 1)
            }
            .padding(10)
        }
        .frame(height: height)
        .clipShape(.rect(cornerRadius: radius))
        .overlay(
            RoundedRectangle(cornerRadius: radius)
                .strokeBorder(Color.white.opacity(0.06), lineWidth: 1)
        )
    }

    // MARK: palette
    // Mirrors the PALETTES + paletteFor() logic from box-cover.tsx.

    struct Palette: Equatable {
        let bg: String
        let fg: String
    }

    static let palettes: [Palette] = [
        .init(bg: "#7a3d2c", fg: "#f3e0c1"),
        .init(bg: "#2a4f3e", fg: "#e3eac0"),
        .init(bg: "#3d3a5c", fg: "#e3d8c0"),
        .init(bg: "#7a5a2c", fg: "#f3e6c5"),
        .init(bg: "#5c2c4f", fg: "#e6c5d3"),
        .init(bg: "#2c4a5c", fg: "#c5d8e3"),
        .init(bg: "#5c3826", fg: "#f0d8b6"),
        .init(bg: "#283c2c", fg: "#cfd9b4"),
    ]

    static func palette(for title: String) -> Palette {
        // Sum of code units, modulo palette count. Matches JS
        // `charCodeAt` exactly because Swift String unicodeScalars give
        // the same values for ASCII titles. The web app's titles are
        // ASCII-only, so cross-platform parity holds.
        var sum: UInt32 = 0
        for scalar in title.unicodeScalars { sum &+= scalar.value }
        return palettes[Int(sum % UInt32(palettes.count))]
    }
}

#Preview {
    HStack {
        BoxCover(title: "Brass: Birmingham", year: 2018, height: 140)
        BoxCover(title: "Gloomhaven", year: 2017, height: 140)
        BoxCover(title: "Wingspan", year: 2019, height: 140)
    }
    .padding()
    .cardstockFollowsColorScheme()
}
