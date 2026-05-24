/**
 * Branch-impact math for the rate flow.
 *
 * Question: "if I rate this game ★N, how does it nudge my taste profile
 * on each of the 4 branches?"
 *
 * Approach: maintain a weighted centroid in axis space (weight = rating).
 * The "impact" of the new rating on a branch is the signed delta between
 * the *post* centroid average across that branch's axes and the *pre*
 * centroid average. Sign convention: positive = this game pulls your
 * taste toward higher-branch games.
 *
 * Returns a record keyed by branch with deltas in score-points (range
 * roughly ±2 in practice). The UI clamps for display.
 */

import { AXES, type Branch, type ScoreVector } from "@/lib/scoring";

export interface RatedSample {
  rating: number;
  scores: ScoreVector;
}

export type BranchDeltas = Record<Branch, number>;

const BRANCH_AXES: Record<Branch, number[]> = (() => {
  const m: Record<Branch, number[]> = {
    thinking: [],
    interaction: [],
    luck: [],
    experience: [],
  };
  AXES.forEach((axis, i) => {
    m[axis.branch].push(i);
  });
  return m;
})();

function weightedCentroid(samples: RatedSample[]): number[] | null {
  if (samples.length === 0) return null;
  const totalWeight = samples.reduce((acc, s) => acc + s.rating, 0);
  if (totalWeight <= 0) return null;
  const centroid = new Array(12).fill(0) as number[];
  for (const s of samples) {
    for (let i = 0; i < 12; i++) {
      centroid[i] += (s.scores[i] ?? 0) * s.rating;
    }
  }
  for (let i = 0; i < 12; i++) centroid[i] /= totalWeight;
  return centroid;
}

function branchAverage(vec: number[], branch: Branch): number {
  const idxs = BRANCH_AXES[branch];
  let sum = 0;
  for (const i of idxs) sum += vec[i] ?? 0;
  return sum / idxs.length;
}

/**
 * `history` is the user's already-rated games (excluding the current).
 * `pending` is the game we're about to rate at `pendingRating` (1-5).
 *
 * If history is empty, the deltas express the absolute branch averages
 * of the new game (capped to keep UI sane).
 */
export function computeBranchImpact(
  history: RatedSample[],
  pending: { scores: ScoreVector; rating: number },
): BranchDeltas {
  const pre = weightedCentroid(history);
  const post = weightedCentroid([...history, pending]);
  const branches: Branch[] = ["thinking", "interaction", "luck", "experience"];
  const out = {} as BranchDeltas;
  if (!post) {
    branches.forEach((b) => (out[b] = 0));
    return out;
  }
  if (!pre) {
    // No history yet — express deltas as the branch averages, mean-centered at 5.
    branches.forEach((b) => {
      out[b] = branchAverage(post, b) - 5;
    });
    return out;
  }
  branches.forEach((b) => {
    out[b] = branchAverage(post, b) - branchAverage(pre, b);
  });
  return out;
}
