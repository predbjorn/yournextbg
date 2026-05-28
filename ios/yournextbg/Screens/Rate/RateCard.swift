import SwiftUI

/// Single rating card. Box cover at top, name + signature in the
/// middle, 5-stamp row at the bottom. Drag offset + rotation are owned
/// by the parent so the card can be reset cleanly on swap.
struct RateCard: View {
    @Environment(\.cardstock) private var tokens
    let game: Game
    let onRate: (Int) -> Void

    var body: some View {
        Paper(tone: .warm, cornerRadius: 18) {
            VStack(alignment: .leading, spacing: 12) {
                BoxCover(title: game.name, year: game.year, height: 180, radius: 12)
                VStack(alignment: .leading, spacing: 4) {
                    Text(game.name)
                        .font(CardstockFont.display(size: 22, weight: .heavy))
                        .foregroundStyle(tokens.ink)
                        .lineLimit(2)
                    if let signature = game.signature {
                        Text(signature)
                            .font(CardstockFont.body(size: 13))
                            .foregroundStyle(tokens.muted)
                            .lineLimit(2)
                    }
                }
                HStack(spacing: 12) {
                    ForEach(1...5, id: \.self) { rating in
                        Button { onRate(rating) } label: {
                            Image(systemName: "star.fill")
                                .font(.system(size: 22))
                                .foregroundStyle(tokens.branchThinking)
                                .accessibilityLabel("Rate \(rating) stars")
                        }
                        .buttonStyle(.plain)
                    }
                }
                .frame(maxWidth: .infinity)
            }
            .padding(20)
        }
    }
}
