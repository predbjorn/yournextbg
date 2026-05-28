import SwiftUI

struct LensScreen: View {
    @Environment(\.cardstock) private var tokens

    let initialA: String?
    let initialB: String?

    @State private var viewModel: LensViewModel?
    @State private var presenting: PickingSlot?

    enum PickingSlot: Identifiable {
        case a, b
        var id: Int { self == .a ? 0 : 1 }
    }

    init(initialA: String? = nil, initialB: String? = nil) {
        self.initialA = initialA
        self.initialB = initialB
    }

    var body: some View {
        Group {
            if let viewModel {
                content(viewModel: viewModel)
            } else {
                ScreenPlaceholder(title: "Lens")
                    .onAppear { boot() }
            }
        }
        .navigationTitle("Lens")
        .navigationBarTitleDisplayMode(.inline)
    }

    @ViewBuilder
    private func content(viewModel: LensViewModel) -> some View {
        @Bindable var vm = viewModel

        ScrollView {
            VStack(spacing: 16) {
                lensChips(vm: vm)
                gamePickerRow(vm: vm)
                radarPanel(vm: vm)
                similarList(vm: vm)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
        }
        .background(tokens.paper)
        .sheet(item: $presenting) { slot in
            if let client = SupabaseService.client {
                GamePicker(repository: LiveGameRepository(client: client)) { game in
                    Task {
                        switch slot {
                        case .a: await vm.setA(game)
                        case .b: vm.setB(game)
                        }
                    }
                }
                .cardstock(tokens)
            }
        }
    }

    @ViewBuilder
    private func lensChips(vm: LensViewModel) -> some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 6) {
                ForEach(LensKey.allCases, id: \.self) { lens in
                    Chip(lens.label, on: vm.lens == lens) { vm.lens = lens }
                }
            }
        }
    }

    @ViewBuilder
    private func gamePickerRow(vm: LensViewModel) -> some View {
        HStack(spacing: 10) {
            slotButton(label: "GAME A", game: vm.gameA) { presenting = .a }
            Button { vm.swap() } label: {
                Image(systemName: "arrow.left.arrow.right")
                    .foregroundStyle(tokens.ink)
                    .padding(10)
                    .background(tokens.paperWarm)
                    .clipShape(Circle())
            }
            .accessibilityLabel("Swap games")
            slotButton(label: "GAME B", game: vm.gameB) { presenting = .b }
        }
    }

    @ViewBuilder
    private func slotButton(label: String, game: Game?, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 6) {
                Stamp(label, color: .muted)
                Text(game?.name ?? "pick a game")
                    .font(CardstockFont.display(size: 16, weight: .semibold))
                    .foregroundStyle(tokens.ink)
                    .lineLimit(2)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(12)
            .background(tokens.paperWarm)
            .clipShape(.rect(cornerRadius: 10))
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .strokeBorder(tokens.ink.opacity(0.12), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder
    private func radarPanel(vm: LensViewModel) -> some View {
        Paper(tone: .warm) {
            VStack(spacing: 8) {
                if let a = vm.gameA {
                    Radar(
                        values: a.scores.values,
                        valuesB: vm.gameB?.scores.values
                    )
                    .frame(height: 320)
                } else {
                    Stamp("pick a game to see the radar", color: .muted)
                        .padding(60)
                }
            }
            .padding(12)
        }
    }

    @ViewBuilder
    private func similarList(vm: LensViewModel) -> some View {
        if !vm.similarToA.isEmpty, let a = vm.gameA {
            VStack(alignment: .leading, spacing: 8) {
                Stamp("similar to \(a.name) under \(vm.lens.label)", color: .muted)
                ForEach(vm.similarToA) { game in
                    NavigationLink(value: Route.gameDetail(id: game.id)) {
                        RecRow(game: game)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.top, 8)
        } else if vm.isLoading {
            Stamp("computing similars", color: .muted)
        }
    }

    private func boot() {
        guard let client = SupabaseService.client else { return }
        let repo = LiveGameRepository(client: client)
        let vm = LensViewModel(repository: repo)
        viewModel = vm
        // If the caller passed initial ids (deep link from Recs/Shelf),
        // resolve them in the background.
        if let aId = initialA {
            Task {
                if let game = try? await repo.fetchGame(id: aId) {
                    await vm.setA(game)
                }
            }
        }
        if let bId = initialB, !bId.isEmpty {
            Task {
                if let game = try? await repo.fetchGame(id: bId) {
                    vm.setB(game)
                }
            }
        }
    }
}
