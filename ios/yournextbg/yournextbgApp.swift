import SwiftUI

/// App entry point.
///
/// The full app graph (auth gate → root tab view) is wired up incrementally
/// across the iOS plan phases. For Phase 0 the entry point boots into a
/// placeholder; subsequent phases replace `ContentView` with the real
/// auth-aware root.
@main
struct YourNextBGApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
