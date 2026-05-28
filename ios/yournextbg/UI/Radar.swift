import SwiftUI

/// The 12-axis radar. Ported from `src/components/ui/radar.tsx`. Spoke
/// + vertex dots colored per axis branch. Game A fills with a
/// translucent ochre; optional Game B overlays as a dashed ink outline.
///
/// Axis order is sourced from `AxisKey.allCases` — never duplicated.
public struct Radar: View {
    @Environment(\.cardstock) private var tokens

    private let values: [Double]
    private let valuesB: [Double]?
    private let showB: Bool
    private let showLabels: Bool
    private let labelSize: CGFloat
    private let rings: Int
    private let ringOpacity: Double
    private let spokeOpacity: Double

    public init(
        values: [Double],
        valuesB: [Double]? = nil,
        showB: Bool? = nil,
        showLabels: Bool = true,
        labelSize: CGFloat = 11,
        rings: Int = 5,
        ringOpacity: Double = 0.18,
        spokeOpacity: Double = 0.32
    ) {
        self.values = values
        self.valuesB = valuesB
        self.showB = showB ?? (valuesB != nil)
        self.showLabels = showLabels
        self.labelSize = labelSize
        self.rings = rings
        self.ringOpacity = ringOpacity
        self.spokeOpacity = spokeOpacity
    }

    public var body: some View {
        GeometryReader { geo in
            let size = min(geo.size.width, geo.size.height)
            ZStack {
                Canvas { ctx, _ in
                    drawRadar(ctx: ctx, size: size)
                }
                .frame(width: size, height: size)

                if showLabels {
                    ForEach(Array(AxisKey.allCases.enumerated()), id: \.element) { idx, axis in
                        labelView(for: axis, idx: idx, size: size)
                    }
                }
            }
            .frame(width: geo.size.width, height: geo.size.height)
            .accessibilityElement()
            .accessibilityLabel("12-axis game score radar")
        }
        .aspectRatio(1, contentMode: .fit)
    }

    // MARK: drawing

    private func drawRadar(ctx: GraphicsContext, size: CGFloat) {
        let cx = size / 2
        let cy = size / 2
        let r = size * 0.38
        let count = AxisKey.allCases.count

        // Rings (concentric polygons matching the spoke count).
        for k in 1...rings {
            let rr = (CGFloat(k) / CGFloat(rings)) * r
            var path = Path()
            for i in 0..<count {
                let a = angle(i: i, count: count)
                let p = CGPoint(x: cx + cos(a) * rr, y: cy + sin(a) * rr)
                if i == 0 { path.move(to: p) } else { path.addLine(to: p) }
            }
            path.closeSubpath()
            ctx.stroke(
                path,
                with: .color(tokens.ink.opacity(ringOpacity)),
                lineWidth: 0.6
            )
        }

        // Branch-colored spokes.
        for (i, axis) in AxisKey.allCases.enumerated() {
            let a = angle(i: i, count: count)
            let endPoint = CGPoint(x: cx + cos(a) * r, y: cy + sin(a) * r)
            var path = Path()
            path.move(to: CGPoint(x: cx, y: cy))
            path.addLine(to: endPoint)
            ctx.stroke(
                path,
                with: .color(tokens.color(forBranch: axis.branch).opacity(spokeOpacity)),
                lineWidth: 0.8
            )
        }

        // Game B polygon (dashed outline, behind A).
        if showB, let valuesB {
            let path = polygonPath(values: valuesB, cx: cx, cy: cy, r: r, count: count)
            ctx.stroke(
                path,
                with: .color(tokens.ink),
                style: StrokeStyle(lineWidth: 1.4, dash: [3, 3])
            )
        }

        // Game A polygon (filled).
        let aPath = polygonPath(values: values, cx: cx, cy: cy, r: r, count: count)
        ctx.fill(
            aPath,
            with: .color(Color(red: 0.79, green: 0.54, blue: 0.17, opacity: 0.22))
        )
        ctx.stroke(
            aPath,
            with: .color(tokens.branchThinking),
            lineWidth: 1.6
        )

        // Vertex dots.
        for (i, axis) in AxisKey.allCases.enumerated() {
            let a = angle(i: i, count: count)
            let dot = CGRect(
                x: cx + cos(a) * r - 2.4,
                y: cy + sin(a) * r - 2.4,
                width: 4.8,
                height: 4.8
            )
            ctx.fill(
                Path(ellipseIn: dot),
                with: .color(tokens.color(forBranch: axis.branch).opacity(0.9))
            )
        }
    }

    private func polygonPath(values: [Double], cx: CGFloat, cy: CGFloat, r: CGFloat, count: Int) -> Path {
        var path = Path()
        for i in 0..<min(values.count, count) {
            let a = angle(i: i, count: count)
            let rr = CGFloat(values[i] / 10.0) * r
            let p = CGPoint(x: cx + cos(a) * rr, y: cy + sin(a) * rr)
            if i == 0 { path.move(to: p) } else { path.addLine(to: p) }
        }
        path.closeSubpath()
        return path
    }

    private func angle(i: Int, count: Int) -> CGFloat {
        -.pi / 2 + (CGFloat(i) * 2 * .pi) / CGFloat(count)
    }

    // MARK: labels

    @ViewBuilder
    private func labelView(for axis: AxisKey, idx: Int, size: CGFloat) -> some View {
        let cx = size / 2
        let cy = size / 2
        let r = size * 0.38
        let a = angle(i: idx, count: AxisKey.allCases.count)
        let lx = cx + cos(a) * (r + 16)
        let ly = cy + sin(a) * (r + 16)

        Text(axis.label.uppercased())
            .font(CardstockFont.mono(size: labelSize))
            .tracking(labelSize * 0.06)
            .foregroundStyle(tokens.ink)
            .position(x: lx, y: ly)
    }
}

#Preview {
    let a: [Double] = [8.5, 9.0, 7.5, 7.0, 4.0, 2.5, 1.5, 1.0, 3.0, 7.5, 9.0, 6.0]
    let b: [Double] = [1.0, 2.0, 2.0, 7.0, 8.0, 7.0, 4.0, 4.0, 2.0, 5.0, 1.0, 2.0]
    return VStack {
        Radar(values: a, valuesB: b)
            .frame(width: 320, height: 320)
    }
    .padding()
    .cardstockFollowsColorScheme()
}
