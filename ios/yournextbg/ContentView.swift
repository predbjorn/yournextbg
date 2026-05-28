import SwiftUI
// Imports validate that SPM packages are reachable from the target.
// Replaced by real call-sites in later phases.
import Supabase
import NukeUI

/// Phase 0 placeholder. Replaced by `RootView` in Phase 5 once the auth
/// store and tab shell are in place.
struct ContentView: View {
    var body: some View {
        VStack(spacing: 12) {
            Text("yournextbg")
                .font(.system(size: 28, weight: .heavy, design: .serif))
            Text("iOS scaffold — Phase 0")
                .font(.system(size: 11, design: .monospaced))
                .textCase(.uppercase)
                .tracking(2.0)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(red: 0.937, green: 0.902, blue: 0.816))
    }
}

#Preview {
    ContentView()
}
