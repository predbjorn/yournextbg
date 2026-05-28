import SwiftUI

/// A single shelf tile: cover, name, status chip, optional pending-
/// scoring stamp.
struct ShelfCard: View {
    @Environment(\.cardstock) private var tokens
    let row: ShelfRow

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            BoxCover(title: row.game.name, year: row.game.year, height: 120)
            HStack(spacing: 6) {
                Stamp(row.status, color: .muted, size: 9)
                if row.game.scoreStatus == "unscored" {
                    Stamp("pending", color: .branch(.luck), size: 9)
                }
            }
            Text(row.game.name)
                .font(CardstockFont.display(size: 14, weight: .semibold))
                .foregroundStyle(tokens.ink)
                .lineLimit(2)
        }
    }
}
