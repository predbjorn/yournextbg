import SwiftUI

struct RecsScreen: View {
    @Environment(\.cardstock) private var tokens
    @Environment(AuthStore.self) private var authStore

    @State private var viewModel: RecsViewModel?

    var body: some View {
        Group {
            if let viewModel {
                content(viewModel: viewModel)
            } else {
                ScreenPlaceholder(title: "Recs")
                    .onAppear { boot() }
            }
        }
        .navigationTitle("Recommendations")
        .navigationBarTitleDisplayMode(.inline)
    }

    @ViewBuilder
    private func content(viewModel: RecsViewModel) -> some View {
        @Bindable var vm = viewModel

        VStack(spacing: 0) {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 6) {
                    ForEach(LensKey.allCases, id: \.self) { lens in
                        Chip(lens.label, on: vm.lens == lens) { vm.lens = lens }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
            }

            List {
                ForEach(vm.ranked) { game in
                    NavigationLink(value: Route.gameDetail(id: game.id)) {
                        RecRow(game: game)
                    }
                    .swipeActions(edge: .trailing) {
                        Button("Dismiss", role: .destructive) {
                            Task { await vm.dismiss(game) }
                        }
                        NavigationLink("Compare", value: Route.lensWith(aId: game.id, bId: ""))
                    }
                    .listRowBackground(tokens.paper)
                }

                if let err = vm.lastError {
                    Stamp(err, color: .negative)
                }
            }
            .scrollContentBackground(.hidden)
            .background(tokens.paper)
            .refreshable { await vm.load() }
        }
        .background(tokens.paper)
        .task { await vm.load() }
    }

    private func boot() {
        guard case .signedIn(let userId, _) = authStore.state,
              let client = SupabaseService.client else { return }
        viewModel = RecsViewModel(
            userId: userId,
            repository: LiveGameRepository(client: client)
        )
    }
}
