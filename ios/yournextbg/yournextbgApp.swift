import SwiftUI
import Supabase

/// App entry. Owns the AuthStore lifecycle and routes between the
/// LoginScreen and the RootTabView based on `state`.
@main
struct YourNextBGApp: App {
    @State private var authStore: AuthStore?

    init() {
        Observability.configure()
        ImagePipelineConfig.configure()
    }

    var body: some Scene {
        WindowGroup {
            RootView(authStore: authStore)
                .cardstockFollowsColorScheme()
                .onAppear {
                    if authStore == nil {
                        guard let client = SupabaseService.client else { return }
                        let store = AuthStore(backend: LiveAuthBackend(client: client))
                        store.start()
                        authStore = store
                    }
                }
                .onChange(of: authStore?.state) { _, new in
                    if case .signedIn(let userId, let email) = new {
                        Observability.identify(userId: userId, email: email)
                        Observability.capture(.signInSucceeded)
                    }
                }
                .onOpenURL { url in
                    Task {
                        if let client = SupabaseService.client {
                            await WebAuthSession.handle(url: url, client: client)
                        }
                    }
                }
        }
    }
}

/// Top-level router. Renders the login screen, a loading splash, or the
/// signed-in tab view depending on the auth state.
struct RootView: View {
    @Environment(\.cardstock) private var tokens
    let authStore: AuthStore?

    var body: some View {
        Group {
            if let authStore {
                switch authStore.state {
                case .loading:
                    LoadingSplash()
                case .signedOut:
                    LoginScreen()
                case .signedIn:
                    RootTabView()
                        .environment(authStore)
                }
            } else {
                // Supabase config missing — show a clear, Cardstock-styled
                // error rather than crash. Helpful on a freshly cloned
                // checkout where .xcconfig.local hasn't been filled in.
                ConfigErrorView()
            }
        }
    }
}

private struct LoadingSplash: View {
    @Environment(\.cardstock) private var tokens
    var body: some View {
        ZStack {
            tokens.paper.ignoresSafeArea()
            VStack(spacing: 12) {
                Text("yournextbg")
                    .font(CardstockFont.display(size: 32, weight: .heavy))
                    .foregroundStyle(tokens.ink)
                Stamp("loading", color: .muted)
            }
        }
    }
}

private struct ConfigErrorView: View {
    @Environment(\.cardstock) private var tokens
    var body: some View {
        ZStack {
            tokens.paper.ignoresSafeArea()
            VStack(alignment: .leading, spacing: 12) {
                Stamp("configuration error", color: .negative, size: 11)
                Text("Supabase client is not configured.")
                    .font(CardstockFont.display(size: 20, weight: .semibold))
                    .foregroundStyle(tokens.ink)
                Text("Set SUPABASE_URL and SUPABASE_ANON_KEY in ios/yournextbg.xcconfig (or a local override). See docs/runbook.md for setup.")
                    .font(CardstockFont.body(size: 14))
                    .foregroundStyle(tokens.muted)
            }
            .padding(24)
        }
    }
}
