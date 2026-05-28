import SwiftUI

/// Cardstock-styled loading skeleton. Use in place of progress views
/// where a screen-sized placeholder reads better than a spinner.
public struct LoadingPaper: View {
    @Environment(\.cardstock) private var tokens
    private let label: String?

    public init(label: String? = "loading") {
        self.label = label
    }

    public var body: some View {
        Paper(tone: .warm) {
            VStack(spacing: 12) {
                ProgressView()
                    .progressViewStyle(.circular)
                    .tint(tokens.ink)
                if let label {
                    Stamp(label, color: .muted)
                }
            }
            .padding(40)
            .frame(maxWidth: .infinity)
        }
    }
}

#Preview {
    LoadingPaper().padding().cardstockFollowsColorScheme()
}
