import SwiftUI

/// The user's collection. Filter chips, sort menu, LazyVGrid of
/// `ShelfCard` tiles, pull-to-refresh, and an `AddGameSheet` toolbar
/// item. BGG re-sync button hidden unless the user has bgg_username
/// set + bgg_sync_enabled.
struct ShelfScreen: View {
    @Environment(\.cardstock) private var tokens
    @Environment(AuthStore.self) private var authStore

    @State private var viewModel: ShelfViewModel?
    @State private var showAddSheet = false
    @State private var showBGGSync = false
    @State private var bggSyncStatus: String?

    var body: some View {
        Group {
            if let viewModel {
                content(viewModel: viewModel)
            } else {
                ScreenPlaceholder(title: "Shelf")
                    .onAppear { boot() }
            }
        }
        .navigationTitle("Shelf")
        .navigationBarTitleDisplayMode(.inline)
    }

    @ViewBuilder
    private func content(viewModel: ShelfViewModel) -> some View {
        @Bindable var vm = viewModel

        let columns = [
            GridItem(.adaptive(minimum: 140), spacing: 16),
        ]

        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                // Stats strip
                HStack(spacing: 8) {
                    Stamp("\(vm.rows.count) total", color: .muted)
                    if !vm.rows.isEmpty {
                        let unscored = vm.rows.filter { $0.game.scoreStatus == "unscored" }.count
                        if unscored > 0 {
                            Stamp("\(unscored) pending", color: .branch(.luck))
                        }
                    }
                }
                .padding(.horizontal, 16)

                // Filter chips
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 6) {
                        ForEach(Array(ShelfViewModel.Filter.allCases), id: \.self) { f in
                            Chip(label(for: f), on: vm.filter == f) { vm.filter = f }
                        }
                    }
                    .padding(.horizontal, 16)
                }

                if let err = vm.lastError {
                    Stamp(err, color: .negative).padding(.horizontal, 16)
                }

                LazyVGrid(columns: columns, spacing: 16) {
                    ForEach(vm.visibleRows) { row in
                        NavigationLink(value: Route.gameDetail(id: row.game.id)) {
                            ShelfCard(row: row)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 16)
            }
            .padding(.vertical, 12)
        }
        .background(tokens.paper)
        .refreshable { await vm.load() }
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                Menu {
                    Picker("Sort", selection: $vm.sort) {
                        Text("Name").tag(ShelfViewModel.Sort.name)
                        Text("Recently added").tag(ShelfViewModel.Sort.recentlyAdded)
                    }
                } label: {
                    Image(systemName: "arrow.up.arrow.down")
                }
            }
            ToolbarItem(placement: .topBarTrailing) {
                Button { showAddSheet = true } label: {
                    Image(systemName: "plus")
                }
            }
        }
        .sheet(isPresented: $showAddSheet) {
            if let client = SupabaseService.client {
                AddGameSheet(repository: LiveGameRepository(client: client)) { _ in
                    Task { await vm.load() }
                }
                .cardstock(tokens)
            }
        }
        .task { await vm.load() }
    }

    private func label(for filter: ShelfViewModel.Filter) -> String {
        switch filter {
        case .all:      return "all"
        case .owned:    return "owned"
        case .wishlist: return "wishlist"
        case .played:   return "played"
        case .pending:  return "pending"
        }
    }

    private func boot() {
        guard case .signedIn(let userId, _) = authStore.state,
              let client = SupabaseService.client else { return }
        viewModel = ShelfViewModel(
            userId: userId,
            repository: LiveGameRepository(client: client)
        )
    }
}
