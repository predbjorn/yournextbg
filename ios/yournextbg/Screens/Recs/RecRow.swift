import SwiftUI

struct RecRow: View {
    @Environment(\.cardstock) private var tokens
    let game: Game

    var body: some View {
        HStack(spacing: 12) {
            BoxCover(title: game.name, year: game.year, height: 64, radius: 5)
                .frame(width: 64)
            VStack(alignment: .leading, spacing: 4) {
                Text(game.name)
                    .font(CardstockFont.display(size: 16, weight: .semibold))
                    .foregroundStyle(tokens.ink)
                    .lineLimit(2)
                if let signature = game.signature {
                    Text(signature)
                        .font(CardstockFont.body(size: 12))
                        .foregroundStyle(tokens.muted)
                        .lineLimit(1)
                }
            }
            Spacer()
            Image(systemName: "chevron.right")
                .foregroundStyle(tokens.mutedSoft)
        }
        .padding(.vertical, 8)
    }
}
