import SwiftUI

/// Cardstock-styled "this screen is coming" placeholder. Replaced as
/// each Phase 6 task lands.
struct ScreenPlaceholder: View {
    @Environment(\.cardstock) private var tokens
    let title: String

    var body: some View {
        ZStack {
            tokens.paper.ignoresSafeArea()
            VStack(spacing: 16) {
                Stamp("under construction", color: .muted)
                Text(title)
                    .font(CardstockFont.display(size: 32, weight: .heavy))
                    .foregroundStyle(tokens.ink)
            }
        }
        .navigationTitle(title)
    }
}
