import SwiftUI

/// Cardstock-styled error state. Surface from screens via:
///
///     if let err = vm.lastError { ErrorPaper(message: err) { vm.retry() } }
public struct ErrorPaper: View {
    @Environment(\.cardstock) private var tokens
    private let message: String
    private let retry: (() -> Void)?

    public init(message: String, retry: (() -> Void)? = nil) {
        self.message = message
        self.retry = retry
    }

    public var body: some View {
        Paper(tone: .warm) {
            VStack(alignment: .leading, spacing: 8) {
                Stamp("error", color: .negative)
                Text(message)
                    .font(CardstockFont.body(size: 14))
                    .foregroundStyle(tokens.ink)
                if let retry {
                    Btn("Try again", tone: .ghost, action: retry)
                        .padding(.top, 4)
                }
            }
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

#Preview {
    ErrorPaper(message: "Could not reach the recommender. Check your connection.") {}
        .padding()
        .cardstockFollowsColorScheme()
}
