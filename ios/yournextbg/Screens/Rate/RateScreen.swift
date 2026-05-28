import SwiftUI
import UIKit

/// The Rate flow. Two-card ZStack (next behind, current on top), swipe
/// gestures (left to skip, tap a star to submit). Haptic feedback on
/// submit.
struct RateScreen: View {
    @Environment(\.cardstock) private var tokens
    @Environment(AuthStore.self) private var authStore

    @State private var viewModel: RateViewModel?
    @State private var dragOffset: CGSize = .zero

    var body: some View {
        Group {
            if let viewModel {
                content(viewModel: viewModel)
            } else {
                ScreenPlaceholder(title: "Rate")
                    .onAppear { boot() }
            }
        }
        .navigationTitle("Rate")
        .navigationBarTitleDisplayMode(.inline)
    }

    @ViewBuilder
    private func content(viewModel: RateViewModel) -> some View {
        ZStack {
            tokens.paper.ignoresSafeArea()
            if let top = viewModel.top {
                ZStack {
                    if let nextGame = viewModel.next {
                        RateCard(game: nextGame, onRate: { _ in })
                            .scaleEffect(0.96)
                            .opacity(0.6)
                            .offset(y: 12)
                    }
                    RateCard(game: top) { rating in
                        Task { await rate(rating, on: viewModel) }
                    }
                    .offset(dragOffset)
                    .rotationEffect(.degrees(Double(dragOffset.width / 20)))
                    .gesture(
                        DragGesture()
                            .onChanged { dragOffset = $0.translation }
                            .onEnded { value in
                                if value.translation.width < -100 {
                                    skip(viewModel)
                                } else {
                                    withAnimation(.spring) { dragOffset = .zero }
                                }
                            }
                    )
                }
                .padding(.horizontal, 24)
            } else if viewModel.isLoading {
                Stamp("loading", color: .muted)
            } else {
                emptyState
            }

            if let err = viewModel.lastError {
                VStack {
                    Spacer()
                    Stamp(err, color: .negative).padding(.bottom, 24)
                }
            }
        }
        .task { await viewModel.load() }
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Stamp("all caught up", color: .muted, size: 11)
            Text("No more unrated games on your shelf.")
                .font(CardstockFont.display(size: 22, weight: .semibold))
                .foregroundStyle(tokens.ink)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
    }

    private func rate(_ value: Int, on viewModel: RateViewModel) async {
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        withAnimation(.spring) { dragOffset = .zero }
        await viewModel.submit(rating: value)
    }

    private func skip(_ viewModel: RateViewModel) {
        withAnimation(.spring) { dragOffset = CGSize(width: -500, height: 0) }
        viewModel.skip()
        // Reset position for the new top card after the swipe-out animation.
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
            dragOffset = .zero
        }
    }

    private func boot() {
        guard case .signedIn(let userId, _) = authStore.state,
              let client = SupabaseService.client else { return }
        viewModel = RateViewModel(
            userId: userId,
            repository: LiveGameRepository(client: client)
        )
    }
}
