import SwiftUI

struct ProfileScreen: View {
    @Environment(\.cardstock) private var tokens
    @Environment(AuthStore.self) private var authStore

    @State private var viewModel: ProfileViewModel?
    @State private var showDeleteAlert = false

    var body: some View {
        Group {
            if let viewModel {
                content(viewModel: viewModel)
            } else {
                ScreenPlaceholder(title: "Profile")
                    .onAppear { boot() }
            }
        }
        .navigationTitle("Profile")
        .navigationBarTitleDisplayMode(.inline)
    }

    @ViewBuilder
    private func content(viewModel: ProfileViewModel) -> some View {
        @Bindable var vm = viewModel

        Form {
            Section {
                Picker("Default lens", selection: $vm.defaultLens) {
                    ForEach(LensKey.allCases, id: \.self) { lens in
                        Text(lens.label).tag(lens)
                    }
                }
                HStack {
                    Text("BGG username")
                    Spacer()
                    TextField("user", text: $vm.bggUsernameDraft)
                        .multilineTextAlignment(.trailing)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                }
                if !vm.bggUsernameDraft.isEmpty {
                    Button { Task { await vm.syncBGG() } } label: {
                        if vm.isSyncing {
                            HStack { ProgressView(); Text("Syncing...") }
                        } else {
                            Text("Sync now")
                        }
                    }
                    .disabled(vm.isSyncing)
                }
                if let result = vm.lastSyncResult {
                    Text("Synced \(result.owned) owned, \(result.wishlist) wishlist, \(result.newUnscored) new pending")
                        .font(CardstockFont.body(size: 12))
                        .foregroundStyle(tokens.muted)
                }
            } header: {
                Stamp("recommendation engine", color: .muted)
            }

            Section {
                Picker("Appearance", selection: $vm.theme) {
                    Text("System").tag(AppearancePreference.auto)
                    Text("Light").tag(AppearancePreference.light)
                    Text("Dark").tag(AppearancePreference.dark)
                }
            } header: {
                Stamp("appearance", color: .muted)
            }

            Section {
                if case .signedIn(_, let email) = authStore.state {
                    HStack {
                        Text("Email")
                        Spacer()
                        Text(email ?? "—")
                            .foregroundStyle(tokens.muted)
                    }
                }
                Button("Save changes") { Task { await vm.save() } }
                    .disabled(vm.isSaving)
                Button("Sign out", role: .destructive) {
                    Task { await authStore.signOut() }
                }
                Button("Delete account") { showDeleteAlert = true }
                    .foregroundStyle(tokens.negative)
            } header: {
                Stamp("account", color: .muted)
            }

            if let err = vm.lastError {
                Stamp(err, color: .negative)
            }
        }
        .scrollContentBackground(.hidden)
        .background(tokens.paper)
        .task { await vm.load() }
        .alert("Delete account", isPresented: $showDeleteAlert) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(AuthStore.deleteAccountSupportMessage)
        }
    }

    private func boot() {
        guard case .signedIn(let userId, _) = authStore.state,
              let client = SupabaseService.client else { return }
        viewModel = ProfileViewModel(
            userId: userId,
            repository: LiveGameRepository(client: client),
            bggSync: LiveBggSyncService(client: client)
        )
    }
}
