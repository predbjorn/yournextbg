import SwiftUI

/// Five-tab shell with the Cardstock-styled custom tab bar overlay.
/// Each tab owns its own `NavigationStack` so deep links don't bleed
/// between tabs.
struct RootTabView: View {
    @Environment(AuthStore.self) private var authStore
    @Environment(\.cardstock) private var tokens
    @State private var selection: Tab = .shelf

    enum Tab: Hashable {
        case shelf, rate, recs, lens, profile
    }

    private let tabItems: [CardstockTabBar.TabItem] = [
        .init(tab: .shelf,   label: "Shelf",   systemImage: "rectangle.stack"),
        .init(tab: .rate,    label: "Rate",    systemImage: "star"),
        .init(tab: .recs,    label: "Recs",    systemImage: "sparkles"),
        .init(tab: .lens,    label: "Lens",    systemImage: "circle.grid.cross"),
        .init(tab: .profile, label: "Profile", systemImage: "person"),
    ]

    var body: some View {
        VStack(spacing: 0) {
            ZStack {
                screen(for: .shelf, view: ShelfScreen()).opacity(selection == .shelf ? 1 : 0)
                screen(for: .rate, view: RateScreen()).opacity(selection == .rate ? 1 : 0)
                screen(for: .recs, view: RecsScreen()).opacity(selection == .recs ? 1 : 0)
                screen(for: .lens, view: LensScreen()).opacity(selection == .lens ? 1 : 0)
                screen(for: .profile, view: ProfileScreen()).opacity(selection == .profile ? 1 : 0)
            }

            CardstockTabBar(items: tabItems, selection: $selection)
        }
        .background(tokens.paper)
        .ignoresSafeArea(.keyboard)
    }

    @ViewBuilder
    private func screen<Content: View>(for tab: Tab, view: Content) -> some View {
        NavigationStack {
            view
                .navigationDestination(for: Route.self) { route in
                    switch route {
                    case .gameDetail(let id):
                        GameDetailScreen(gameId: id)
                    case .lensWith(let aId, let bId):
                        LensScreen(initialA: aId, initialB: bId)
                    }
                }
        }
    }
}
