import Foundation

/// Pure-functional scoring engine. Mirrors `src/lib/scoring/similarity.ts`
/// function-for-function and name-for-name so cross-platform parity
/// reviews are a straight diff.
///
///     distance² = Σ wᵢ × (aᵢ − bᵢ)²
///     similarity = 1 − distance / maxDistance   (∈ [0, 1])
///
/// where `maxDistance = √(Σ wᵢ × 100)` — the distance produced if every
/// axis differs by the maximum possible 10 points.
public enum Scoring {

    /// Difference of (10 - 0)² — the worst possible per-axis squared diff.
    public static let maxAxisDiffSq: Double = 100.0

    /// Weighted Euclidean distance between two score vectors under `lens`.
    /// Result range: `[0, Scoring.maxDistance(lens)]`.
    public static func weightedDistance(
        _ a: ScoreVector,
        _ b: ScoreVector,
        lens: LensKey
    ) -> Double {
        let weights = lens.weights
        var sum: Double = 0
        for key in AxisKey.allCases {
            let w = weights[key] ?? 0
            let diff = a[key] - b[key]
            sum += w * diff * diff
        }
        return sum.squareRoot()
    }

    /// The maximum possible weighted distance under `lens` — used to
    /// normalize the similarity score into `[0, 1]`.
    public static func maxDistance(lens: LensKey) -> Double {
        let weights = lens.weights
        let wSum = AxisKey.allCases.reduce(0.0) { acc, key in
            acc + (weights[key] ?? 0)
        }
        return (wSum * maxAxisDiffSq).squareRoot()
    }

    /// Similarity in `[0, 1]`. `1` = identical profile, `0` = maximally
    /// different given lens.
    public static func similarity(
        _ a: ScoreVector,
        _ b: ScoreVector,
        lens: LensKey
    ) -> Double {
        max(0, 1 - weightedDistance(a, b, lens: lens) / maxDistance(lens: lens))
    }

    /// Per-axis absolute deltas, sorted largest-first. Used for the "what
    /// differs most" panel. Mirrors `axisDeltas` in
    /// `src/lib/scoring/similarity.ts`.
    public struct AxisDelta: Equatable, Sendable {
        public let axisIndex: Int
        public let a: Double
        public let b: Double
        public let delta: Double
    }

    public static func axisDeltas(_ a: ScoreVector, _ b: ScoreVector) -> [AxisDelta] {
        AxisKey.allCases.enumerated().map { idx, _ in
            AxisDelta(axisIndex: idx, a: a[idx], b: b[idx], delta: abs(a[idx] - b[idx]))
        }
        .sorted { $0.delta > $1.delta }
    }

    /// Ranks `candidates` by similarity to `reference` under `lens`,
    /// descending. Excludes the reference itself. Mirrors the TS
    /// `rankBySimilarity` generic.
    public struct Ranked<G: Identifiable & Sendable>: Sendable where G.ID == String {
        public let game: G
        public let sim: Double
    }

    public static func rankBySimilarity<G: Identifiable & Sendable>(
        reference: G,
        candidates: [G],
        lens: LensKey,
        scores: (G) -> ScoreVector
    ) -> [Ranked<G>] where G.ID == String {
        let refScores = scores(reference)
        return candidates
            .filter { $0.id != reference.id }
            .map { Ranked(game: $0, sim: similarity(refScores, scores($0), lens: lens)) }
            .sorted { $0.sim > $1.sim }
    }

    /// Convenience overload for `Game`. Avoids the closure at call sites
    /// where the entity is the canonical model.
    public static func rankBySimilarity(
        reference: Game,
        candidates: [Game],
        lens: LensKey
    ) -> [Ranked<Game>] {
        rankBySimilarity(reference: reference, candidates: candidates, lens: lens) { $0.scores }
    }
}
