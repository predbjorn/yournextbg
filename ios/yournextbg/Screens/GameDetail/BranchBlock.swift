import SwiftUI

/// One branch's per-axis bars. Used three or four times on the detail
/// screen to visualize a game's score breakdown.
struct BranchBlock: View {
    @Environment(\.cardstock) private var tokens
    let branch: Branch
    let axes: [(AxisKey, Double)]

    var body: some View {
        Paper(tone: .warm) {
            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 6) {
                    Circle()
                        .fill(tokens.color(forBranch: branch))
                        .frame(width: 8, height: 8)
                    Stamp(branch.label, color: .branch(branch), size: 10)
                }
                ForEach(axes, id: \.0) { axis, value in
                    AxisBar(label: axis.label, value: value, color: tokens.color(forBranch: branch))
                }
            }
            .padding(14)
        }
    }
}

private struct AxisBar: View {
    @Environment(\.cardstock) private var tokens
    let label: String
    let value: Double
    let color: Color

    var body: some View {
        HStack(spacing: 8) {
            Text(label)
                .font(CardstockFont.mono(size: 10))
                .tracking(0.18 * 10)
                .foregroundStyle(tokens.muted)
                .frame(width: 92, alignment: .leading)
                .lineLimit(1)
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 2)
                        .fill(tokens.ink.opacity(0.08))
                    RoundedRectangle(cornerRadius: 2)
                        .fill(color)
                        .frame(width: geo.size.width * CGFloat(value / 10.0))
                }
            }
            .frame(height: 6)
            Text(String(format: "%.1f", value))
                .font(CardstockFont.mono(size: 10))
                .foregroundStyle(tokens.ink)
                .frame(width: 32, alignment: .trailing)
        }
    }
}
