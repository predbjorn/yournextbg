/**
 * Comparison lenses — each lens re-weights the 12 axes to encode a different
 * comparison philosophy. Standard is research-weighted; the others let the
 * user pick by weight class, experiential feel, or luck profile.
 */

import type { AxisKey } from "./axes";

export type LensKey = "standard" | "vekt" | "folelse" | "flaks" | "equal";

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
      "Research-weighted — Vekt, Interaksjon and Output-flaks are the most predictive splitters of taste.",
    weights: {
      vekt: 2.0,
      dybde: 1.2,
      density: 1.0,
      inter: 1.8,
      konflikt: 1.2,
      forhandl: 1.0,
      input: 1.2,
      output: 1.4,
      innhente: 0.8,
      tema: 1.0,
      motor: 1.0,
      narrativ: 1.0,
    },
  },
  vekt: {
    key: "vekt",
    label: "Tilsvarende vekt",
    blurb:
      "Find games in the same complexity class. A heavy 4X and a push-your-luck filler are never the same experience even if other axes line up.",
    weights: {
      vekt: 3.0,
      dybde: 2.2,
      density: 1.5,
      inter: 1.0,
      konflikt: 0.5,
      forhandl: 0.5,
      input: 0.8,
      output: 1.0,
      innhente: 0.5,
      tema: 0.5,
      motor: 1.0,
      narrativ: 0.5,
    },
  },
  folelse: {
    key: "folelse",
    label: "Samme opplevelse",
    blurb:
      "Weights interaction, theme and narrative heaviest. Cares little about weight — finds games that *feel* similar regardless of rules overhead.",
    weights: {
      vekt: 0.6,
      dybde: 0.8,
      density: 0.8,
      inter: 2.5,
      konflikt: 1.8,
      forhandl: 1.5,
      input: 0.8,
      output: 0.8,
      innhente: 0.8,
      tema: 2.2,
      motor: 1.5,
      narrativ: 2.0,
    },
  },
  flaks: {
    key: "flaks",
    label: "Samme flaks-profil",
    blurb:
      "Weights input/output luck and catch-up heaviest. For players who know they love (or hate) dice, card draws and chaos.",
    weights: {
      vekt: 0.8,
      dybde: 1.0,
      density: 0.8,
      inter: 1.0,
      konflikt: 1.0,
      forhandl: 0.8,
      input: 2.5,
      output: 2.5,
      innhente: 1.8,
      tema: 0.8,
      motor: 1.0,
      narrativ: 0.8,
    },
  },
  equal: {
    key: "equal",
    label: "Uvektet",
    blurb:
      "Raw Euclidean distance in 12-dimensional space. All axes equal — the original v1 engine.",
    weights: {
      vekt: 1.0,
      dybde: 1.0,
      density: 1.0,
      inter: 1.0,
      konflikt: 1.0,
      forhandl: 1.0,
      input: 1.0,
      output: 1.0,
      innhente: 1.0,
      tema: 1.0,
      motor: 1.0,
      narrativ: 1.0,
    },
  },
};

export const DEFAULT_LENS: LensKey = "standard";
