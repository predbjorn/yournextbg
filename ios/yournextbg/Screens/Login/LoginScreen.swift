import SwiftUI
import Supabase

/// Login screen. Cardstock paper background, three auth options:
/// Sign in with Apple (native button), Continue with Google
/// (ASWebAuthenticationSession), and email magic link (sheet).
public struct LoginScreen: View {
    @Environment(\.cardstock) private var tokens
    @State private var viewModel = LoginViewModel()
    @State private var showMagicLinkSheet = false
    @State private var signInError: String?

    private let client: SupabaseClient?

    public init(client: SupabaseClient? = SupabaseService.client) {
        self.client = client
    }

    public var body: some View {
        ZStack {
            tokens.paper.ignoresSafeArea()

            VStack(spacing: 24) {
                Spacer()

                VStack(spacing: 8) {
                    Text("yournextbg")
                        .font(CardstockFont.display(size: 40, weight: .heavy))
                        .foregroundStyle(tokens.ink)
                    Stamp("a board-game recommender", color: .muted, size: 11)
                }

                Spacer()

                VStack(spacing: 12) {
                    SignInWithAppleView(client: client) { result in
                        if case .failure(let err) = result {
                            signInError = err.localizedDescription
                        }
                    }

                    Btn("Continue with Google", tone: .ghost) {
                        Task { await signInWithGoogle() }
                    }

                    Btn("Email magic link", tone: .ghost) {
                        showMagicLinkSheet = true
                    }
                }
                .padding(.horizontal, 24)

                if let signInError {
                    Stamp(signInError, color: .negative, size: 10)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 24)
                }

                Spacer()

                Stamp("by signing in you agree to our terms", color: .mutedSoft, size: 9)
                    .padding(.bottom, 16)
            }
            .frame(maxWidth: 420)
        }
        .sheet(isPresented: $showMagicLinkSheet) {
            MagicLinkSheet(viewModel: viewModel, client: client)
                .cardstock(tokens)
        }
    }

    private func signInWithGoogle() async {
        guard let client else {
            signInError = "Supabase client is not configured."
            return
        }
        do {
            try await WebAuthSession().signInWithGoogle(client: client)
        } catch {
            signInError = error.localizedDescription
        }
    }
}

private struct MagicLinkSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.cardstock) private var tokens
    @Bindable var viewModel: LoginViewModel

    let client: SupabaseClient?

    var body: some View {
        ZStack {
            tokens.paper.ignoresSafeArea()
            VStack(alignment: .leading, spacing: 16) {
                Stamp("magic link", color: .muted, size: 11)
                Text("We'll email you a one-tap sign-in link.")
                    .font(CardstockFont.display(size: 22, weight: .semibold))
                    .foregroundStyle(tokens.ink)

                TextField("you@example.com", text: $viewModel.email)
                    .textContentType(.emailAddress)
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .padding(12)
                    .background(tokens.paperWarm)
                    .clipShape(.rect(cornerRadius: 8))
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .strokeBorder(tokens.ink.opacity(0.12), lineWidth: 1)
                    )

                switch viewModel.magicLinkState {
                case .sent:
                    Stamp("check your inbox", color: .positive, size: 11)
                case .error(let msg):
                    Stamp(msg, color: .negative, size: 10)
                default:
                    EmptyView()
                }

                Btn(viewModel.magicLinkState == .sending ? "Sending..." : "Send link") {
                    Task { await send() }
                }
                .disabled(!viewModel.isEmailValid || viewModel.magicLinkState == .sending)

                Btn("Cancel", tone: .ghost) { dismiss() }
            }
            .padding(24)
        }
        .presentationDetents([.medium])
    }

    private func send() async {
        guard let client else {
            viewModel.setError("Supabase client is not configured.")
            return
        }
        viewModel.setSending()
        do {
            try await WebAuthSession().sendMagicLink(email: viewModel.email, client: client)
            viewModel.setSent()
        } catch {
            viewModel.setError(error.localizedDescription)
        }
    }
}

#Preview {
    LoginScreen(client: nil)
        .cardstockFollowsColorScheme()
}
