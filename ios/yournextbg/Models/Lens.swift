import Foundation

/// Comparison lens. Mirrors the `LensKey` type + `LENSES` table in
/// `src/lib/scoring/lenses.ts`. Each lens re-weights the 12 axes to encode
/// a different comparison philosophy. Raw values are the canonical
/// identifiers used in the DB and prefs — do not rename.
public enum LensKey: String, Codable, CaseIterable, Hashable, Sendable {
    case standard
    case weight
    case feel
    case luck
    case equal

    public static let defaultLens: LensKey = .standard

    public var label: String {
        switch self {
        case .standard: return "Standard"
        case .weight:   return "Same weight class"
        case .feel:     return "Same feel"
        case .luck:     return "Same luck profile"
        case .equal:    return "Unweighted"
        }
    }

    public var blurb: String {
        switch self {
        case .standard:
            return "Research-weighted — Weight, Interaction and Output-luck are the most predictive splitters of taste."
        case .weight:
            return "Find games in the same complexity class. A heavy 4X and a push-your-luck filler are never the same experience even if other axes line up."
        case .feel:
            return "Weights interaction, theme and narrative heaviest. Cares little about weight — finds games that feel similar regardless of rules overhead."
        case .luck:
            return "Weights input/output luck and catch-up heaviest. For players who know they love (or hate) dice, card draws and chaos."
        case .equal:
            return "Raw Euclidean distance in 12-dimensional space. All axes equal — the original v1 engine."
        }
    }

    /// Weights table for this lens, keyed by `AxisKey`. Mirrors the
    /// `weights` field of the matching TS `Lens` object byte-for-byte.
    public var weights: [AxisKey: Double] {
        switch self {
        case .standard:
            return [
                .weight: 2.0, .depth: 1.2, .density: 1.0,
                .interaction: 1.8, .conflict: 1.2, .negotiation: 1.0,
                .input: 1.2, .output: 1.4, .catchup: 0.8,
                .theme: 1.0, .engine: 1.0, .narrative: 1.0,
            ]
        case .weight:
            return [
                .weight: 3.0, .depth: 2.2, .density: 1.5,
                .interaction: 1.0, .conflict: 0.5, .negotiation: 0.5,
                .input: 0.8, .output: 1.0, .catchup: 0.5,
                .theme: 0.5, .engine: 1.0, .narrative: 0.5,
            ]
        case .feel:
            return [
                .weight: 0.6, .depth: 0.8, .density: 0.8,
                .interaction: 2.5, .conflict: 1.8, .negotiation: 1.5,
                .input: 0.8, .output: 0.8, .catchup: 0.8,
                .theme: 2.2, .engine: 1.5, .narrative: 2.0,
            ]
        case .luck:
            return [
                .weight: 0.8, .depth: 1.0, .density: 0.8,
                .interaction: 1.0, .conflict: 1.0, .negotiation: 0.8,
                .input: 2.5, .output: 2.5, .catchup: 1.8,
                .theme: 0.8, .engine: 1.0, .narrative: 0.8,
            ]
        case .equal:
            return [
                .weight: 1.0, .depth: 1.0, .density: 1.0,
                .interaction: 1.0, .conflict: 1.0, .negotiation: 1.0,
                .input: 1.0, .output: 1.0, .catchup: 1.0,
                .theme: 1.0, .engine: 1.0, .narrative: 1.0,
            ]
        }
    }
}
