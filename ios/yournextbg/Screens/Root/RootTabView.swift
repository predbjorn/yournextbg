import SwiftUI

/// Five-tab shell. Each tab owns its own `NavigationStack` so deep
/// links don't bleed between tabs. Tabs: Shelf · Rate · Recs · Lens ·
/// Profile. Phase 7 swaps the system tab bar for a Cardstock-styled
/// custom one.
struct RootTabView: View {
    @Environment(AuthStore.self) private var authStore
    @State private var selection: Tab = .shelf

    enum Tab: Hashable {
        case shelf, rate, recs, lens, profile
    }

    var body: some View {
        TabView(selection: $selection) {
            tabStack(.shelf) { ShelfScreen() }
                .tabItem { Label("Shelf", systemImage: "rectangle.stack") }
                .tag(Tab.shelf)

            tabStack(.rate) { RateScreen() }
                .tabItem { Label("Rate", systemImage: "star") }
                .tag(Tab.rate)

            tabStack(.recs) { RecsScreen() }
                .tabItem { Label("Recs", systemImage: "sparkles") }
                .tag(Tab.recs)

            tabStack(.lens) { LensScreen() }
                .tabItem { Label("Lens", systemImage: "circle.grid.cross") }
                .tag(Tab.lens)

            tabStack(.profile) { ProfileScreen() }
                .tabItem { Label("Profile", systemImage: "person") }
                .tag(Tab.profile)
        }
    }

    @ViewBuilder
    private func tabStack<Content: View>(_ tab: Tab, @ViewBuilder content: () -> Content) -> some View {
        NavigationStack {
            content()
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
