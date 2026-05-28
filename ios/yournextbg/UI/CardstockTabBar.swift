import SwiftUI

/// Cardstock-styled custom tab bar overlay. Used by `RootTabView`
/// after hiding the system bar. Each item is a paper "stamp" tab —
/// label all-caps, active tab uses ink background.
struct CardstockTabBar: View {
    @Environment(\.cardstock) private var tokens

    let items: [TabItem]
    @Binding var selection: RootTabView.Tab

    struct TabItem: Hashable {
        let tab: RootTabView.Tab
        let label: String
        let systemImage: String
    }

    var body: some View {
        HStack(spacing: 0) {
            ForEach(items, id: \.self) { item in
                Button {
                    selection = item.tab
                } label: {
                    VStack(spacing: 4) {
                        Image(systemName: item.systemImage)
                            .font(.system(size: 18, weight: .medium))
                        Text(item.label.uppercased())
                            .font(CardstockFont.mono(size: 8.5, weight: .medium))
                            .tracking(8.5 * 0.18)
                    }
                    .foregroundStyle(selection == item.tab ? tokens.paper : tokens.ink)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(selection == item.tab ? tokens.ink : Color.clear)
                    .clipShape(.rect(cornerRadius: 8))
                    .accessibilityLabel(item.label)
                    .accessibilityAddTraits(selection == item.tab ? [.isSelected] : [])
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 6)
        .padding(.vertical, 6)
        .background(tokens.paperWarm)
        .overlay(
            Rectangle()
                .frame(height: 1)
                .foregroundStyle(tokens.ink.opacity(0.08)),
            alignment: .top
        )
    }
}
