/**
 * Comparison lenses — each lens re-weights the 12 axes to encode a different
 * comparison philosophy. Standard is research-weighted; the others let the
 * user pick by weight class, experiential feel, or luck profile.
 */

import type { AxisKey } from "./axes";

export type LensKey = "standard" | "weight" | "feel" | "luck" | "equal";

export type AxisWeights = Record<AxisKey, number>;

export interface Lens {
  key: LensKey;
  label: string;
  blurb: string;
  weights: AxisWeights;
}

export const LENSES: Record<LensKey, Lens> = {
  standard: {
    key: "standard",
    label: "Standard",
    blurb:
      "Research-weighted — Weight, Interaction and Output-luck are the most predictive splitters of taste.",
    weights: {
      weight: 2.0,
      depth: 1.2,
      density: 1.0,
      interaction: 1.8,
      conflict: 1.2,
      negotiation: 1.0,
      input: 1.2,
      output: 1.4,
      catchup: 0.8,
      theme: 1.0,
      engine: 1.0,
      narrative: 1.0,
    },
  },
  weight: {
    key: "weight",
    label: "Same weight class",
    blurb:
      "Find games in the same complexity class. A heavy 4X and a push-your-luck filler are never the same experience even if other axes line up.",
    weights: {
      weight: 3.0,
      depth: 2.2,
      density: 1.5,
      interaction: 1.0,
      conflict: 0.5,
      negotiation: 0.5,
      input: 0.8,
      output: 1.0,
      catchup: 0.5,
      theme: 0.5,
      engine: 1.0,
      narrative: 0.5,
    },
  },
  feel: {
    key: "feel",
    label: "Same feel",
    blurb:
      "Weights interaction, theme and narrative heaviest. Cares little about weight — finds games that *feel* similar regardless of rules overhead.",
    weights: {
      weight: 0.6,
      depth: 0.8,
      density: 0.8,
      interaction: 2.5,
      conflict: 1.8,
      negotiation: 1.5,
      input: 0.8,
      output: 0.8,
      catchup: 0.8,
      theme: 2.2,
      engine: 1.5,
      narrative: 2.0,
    },
  },
  luck: {
    key: "luck",
    label: "Same luck profile",
    blurb:
      "Weights input/output luck and catch-up heaviest. For players who know they love (or hate) dice, card draws and chaos.",
    weights: {
      weight: 0.8,
      depth: 1.0,
      density: 0.8,
      interaction: 1.0,
      conflict: 1.0,
      negotiation: 0.8,
      input: 2.5,
      output: 2.5,
      catchup: 1.8,
      theme: 0.8,
      engine: 1.0,
      narrative: 0.8,
    },
  },
  equal: {
    key: "equal",
    label: "Unweighted",
    blurb:
      "Raw Euclidean distance in 12-dimensional space. All axes equal — the original v1 engine.",
    weights: {
      weight: 1.0,
      depth: 1.0,
      density: 1.0,
      interaction: 1.0,
      conflict: 1.0,
      negotiation: 1.0,
      input: 1.0,
      output: 1.0,
      catchup: 1.0,
      theme: 1.0,
      engine: 1.0,
      narrative: 1.0,
    },
  },
};

export const DEFAULT_LENS: LensKey = "standard";
