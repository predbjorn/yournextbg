import SwiftUI

/// Sheet that lets the user pick a game by typeahead.
struct GamePicker: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.cardstock) private var tokens

    let repository: GameRepository
    let onSelect: (Game) -> Void

    @State private var query: String = ""
    @State private var results: [Game] = []
    @State private var searching: Bool = false

    var body: some View {
        ZStack {
            tokens.paper.ignoresSafeArea()
            VStack(spacing: 12) {
                Stamp("choose a game", color: .muted)
                    .frame(maxWidth: .infinity, alignment: .leading)
                TextField("Search games...", text: $query)
                    .textInputAutocapitalization(.never)
                    .padding(12)
                    .background(tokens.paperWarm)
                    .clipShape(.rect(cornerRadius: 8))
                    .onChange(of: query) { _, new in Task { await search(new) } }

                if searching {
                    Stamp("searching", color: .muted)
                }

                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 4) {
                        ForEach(results) { game in
                            Button {
                                onSelect(game)
                                dismiss()
                            } label: {
                                HStack(spacing: 10) {
                                    BoxCover(title: game.name, year: game.year, height: 44, radius: 4)
                                        .frame(width: 44)
                                    VStack(alignment: .leading) {
                                        Text(game.name).foregroundStyle(tokens.ink)
                                        if let year = game.year {
                                            Stamp(String(year), color: .muted, size: 9)
                                        }
                                    }
                                    Spacer()
                                }
                                .padding(.vertical, 4)
                                .contentShape(Rectangle())
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }
            .padding(20)
        }
    }

    private func search(_ text: String) async {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmed.count >= 2 else { results = []; return }
        searching = true
        defer { searching = false }
        do {
            results = try await repository.searchGames(query: trimmed, limit: 25)
        } catch {
            results = []
        }
    }
}
