/**
 * Weighted-Euclidean similarity between two game profiles.
 *
 *   distance² = Σ wᵢ × (aᵢ − bᵢ)²
 *   similarity = 1 − distance / maxDistance     (∈ [0, 1])
 *
 * where maxDistance = √(Σ wᵢ × 10²) — the distance produced if every axis
 * differs by the maximum possible 10 points.
 */

import { AXES, type ScoreVector } from "./axes";
import { LENSES, type LensKey } from "./lenses";

const MAX_AXIS_DIFF_SQ = 100; // (10 - 0)²

export function weightedDistance(
  a: ScoreVector,
  b: ScoreVector,
  lens: LensKey,
): number {
  const weights = LENSES[lens].weights;
  let sum = 0;
  for (let i = 0; i < AXES.length; i++) {
    const w = weights[AXES[i].key];
    const diff = a[i] - b[i];
    sum += w * diff * diff;
  }
  return Math.sqrt(sum);
}

export function maxDistance(lens: LensKey): number {
  const weights = LENSES[lens].weights;
  const wSum = AXES.reduce((s, ax) => s + weights[ax.key], 0);
  return Math.sqrt(wSum * MAX_AXIS_DIFF_SQ);
}

/** Similarity ∈ [0, 1]. 1 = identical profile, 0 = maximally different given lens. */
export function similarity(
  a: ScoreVector,
  b: ScoreVector,
  lens: LensKey,
): number {
  return Math.max(0, 1 - weightedDistance(a, b, lens) / maxDistance(lens));
}

/** Per-axis squared deltas, sorted largest-first. Used for "what differs most" panels. */
export interface AxisDelta {
  axisIndex: number;
  a: number;
  b: number;
  delta: number; // absolute difference
}

export function axisDeltas(a: ScoreVector, b: ScoreVector): AxisDelta[] {
  return AXES.map((_, i) => ({
    axisIndex: i,
    a: a[i],
    b: b[i],
    delta: Math.abs(a[i] - b[i]),
  })).sort((x, y) => y.delta - x.delta);
}

/** Ranks all games by similarity to a reference. Excludes the reference itself. */
export function rankBySimilarity<G extends { id: string; scores: ScoreVector }>(
  reference: G,
  candidates: readonly G[],
  lens: LensKey,
): Array<{ game: G; sim: number }> {
  return candidates
    .filter((g) => g.id !== reference.id)
    .map((g) => ({ game: g, sim: similarity(reference.scores, g.scores, lens) }))
    .sort((x, y) => y.sim - x.sim);
}
