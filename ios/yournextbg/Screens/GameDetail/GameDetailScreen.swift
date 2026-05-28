import SwiftUI
import NukeUI

struct GameDetailScreen: View {
    @Environment(\.cardstock) private var tokens
    let gameId: String

    @State private var viewModel: GameDetailViewModel?

    var body: some View {
        Group {
            if let viewModel {
                content(viewModel: viewModel)
            } else {
                ScreenPlaceholder(title: "Game")
                    .onAppear { boot() }
            }
        }
        .navigationBarTitleDisplayMode(.inline)
    }

    @ViewBuilder
    private func content(viewModel: GameDetailViewModel) -> some View {
        ScrollView {
            VStack(spacing: 16) {
                hero(viewModel: viewModel)
                if let game = viewModel.game {
                    branches(viewModel: viewModel)
                    Radar(values: game.scores.values)
                        .frame(height: 320)
                        .padding(.horizontal, 16)
                    similarRail(viewModel: viewModel)
                } else if viewModel.isLoading {
                    Stamp("loading", color: .muted)
                        .padding(40)
                } else if let err = viewModel.lastError {
                    Stamp(err, color: .negative).padding(20)
                }
            }
            .padding(.vertical, 16)
        }
        .background(tokens.paper)
        .navigationTitle(viewModel.game?.name ?? "Game")
        .task { await viewModel.load() }
    }

    @ViewBuilder
    private func hero(viewModel: GameDetailViewModel) -> some View {
        if let game = viewModel.game {
            VStack(alignment: .leading, spacing: 8) {
                heroImage(game: game)
                VStack(alignment: .leading, spacing: 4) {
                    Text(game.name)
                        .font(CardstockFont.display(size: 28, weight: .heavy))
                        .foregroundStyle(tokens.ink)
                    if let signature = game.signature {
                        Text(signature)
                            .font(CardstockFont.body(size: 14))
                            .foregroundStyle(tokens.muted)
                    }
                    HStack(spacing: 6) {
                        if let year = game.year { Chip(tag: String(year)) }
                        if let designer = game.designer { Chip(tag: designer) }
                    }
                    .padding(.top, 6)
                }
                .padding(.horizontal, 16)
            }
        }
    }

    @ViewBuilder
    private func heroImage(game: Game) -> some View {
        if let urlString = game.coverMdUrl ?? game.coverOriginUrl, let url = URL(string: urlString) {
            LazyImage(url: url) { state in
                if let image = state.image {
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } else {
                    BoxCover(title: game.name, year: game.year, height: 240)
                }
            }
            .frame(height: 240)
            .clipShape(.rect(cornerRadius: 12))
            .padding(.horizontal, 16)
        } else {
            BoxCover(title: game.name, year: game.year, height: 240)
                .padding(.horizontal, 16)
        }
    }

    @ViewBuilder
    private func branches(viewModel: GameDetailViewModel) -> some View {
        VStack(spacing: 12) {
            ForEach(viewModel.branchScores, id: \.branch) { entry in
                BranchBlock(branch: entry.branch, axes: entry.axes)
            }
        }
        .padding(.horizontal, 16)
    }

    @ViewBuilder
    private func similarRail(viewModel: GameDetailViewModel) -> some View {
        if !viewModel.similar.isEmpty {
            VStack(alignment: .leading, spacing: 8) {
                Stamp("if you like this", color: .muted)
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 10) {
                        ForEach(viewModel.similar) { game in
                            NavigationLink(value: Route.gameDetail(id: game.id)) {
                                VStack(alignment: .leading, spacing: 4) {
                                    BoxCover(title: game.name, year: game.year, height: 90, radius: 6)
                                        .frame(width: 130)
                                    Text(game.name)
                                        .font(CardstockFont.body(size: 11))
                                        .foregroundStyle(tokens.ink)
                                        .lineLimit(2)
                                        .frame(width: 130, alignment: .leading)
                                }
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }
            .padding(.horizontal, 16)
        }
    }

    private func boot() {
        guard let client = SupabaseService.client else { return }
        viewModel = GameDetailViewModel(
            gameId: gameId,
            repository: LiveGameRepository(client: client)
        )
    }
}
