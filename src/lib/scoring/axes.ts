/**
 * The 12-axis scoring rubric. Each axis is scored 0-10 per game.
 * Axes are grouped into 4 "branches" of the skill tree.
 *
 * The order of AXES is load-bearing: score vectors index by position.
 */

export type Branch = "tanke" | "interaksjon" | "flaks" | "opplevelse";

export type AxisKey =
  | "vekt"
  | "dybde"
  | "density"
  | "inter"
  | "konflikt"
  | "forhandl"
  | "input"
  | "output"
  | "innhente"
  | "tema"
  | "motor"
  | "narrativ";

export interface Axis {
  key: AxisKey;
  label: string;
  branch: Branch;
  /** Short experiential implication when this axis is *higher* on game A than on game B. */
  diffExplanation: string;
}

export const AXES: readonly Axis[] = [
  // TANKE — cognition
  { key: "vekt",     label: "Vekt",     branch: "tanke",       diffExplanation: "more rules to digest, higher learning curve" },
  { key: "dybde",    label: "Dybde",    branch: "tanke",       diffExplanation: "deeper decision tree, higher skill ceiling" },
  { key: "density",  label: "Density",  branch: "tanke",       diffExplanation: "more meaningful choices per minute, more brain-burn" },

  // INTERAKSJON — multiplayer effect
  { key: "inter",    label: "Inter",    branch: "interaksjon", diffExplanation: "players affect each other's plans more, less solitaire" },
  { key: "konflikt", label: "Konflikt", branch: "interaksjon", diffExplanation: "more direct attacks, friendships tested" },
  { key: "forhandl", label: "Forhandl", branch: "interaksjon", diffExplanation: "table talk required, diplomacy is mandatory" },

  // FLAKS — variance
  { key: "input",    label: "Input",    branch: "flaks",       diffExplanation: "more card/setup luck to plan around" },
  { key: "output",   label: "Output",   branch: "flaks",       diffExplanation: "more dice/reveal luck, plans can be upended" },
  { key: "innhente", label: "Innhente", branch: "flaks",       diffExplanation: "stronger catch-up, no runaway leader" },

  // OPPLEVELSE — experience
  { key: "tema",     label: "Tema",     branch: "opplevelse",  diffExplanation: "theme is baked into the mechanics" },
  { key: "motor",    label: "Motor",    branch: "opplevelse",  diffExplanation: "stronger engine-combo arc, explosive late-game turns" },
  { key: "narrativ", label: "Narrativ", branch: "opplevelse",  diffExplanation: "tells a story, consequences persist" },
] as const;

export const AXIS_COUNT = AXES.length;

/** A complete score for a game — one number per axis, in AXES order. */
export type ScoreVector = readonly [
  number, number, number,
  number, number, number,
  number, number, number,
  number, number, number,
];

export const BRANCHES: Record<Branch, { label: string; color: string; tagline: string }> = {
  tanke:       { label: "Tanke",       color: "#58a6ff", tagline: "how much brainwork?" },
  interaksjon: { label: "Interaksjon", color: "#f78166", tagline: "how multiplayer is the multiplayer?" },
  flaks:       { label: "Flaks",       color: "#d4a458", tagline: "where does luck live?" },
  opplevelse:  { label: "Opplevelse",  color: "#8957e5", tagline: "how does it feel?" },
};

export function axisByKey(key: AxisKey): Axis {
  const found = AXES.find((a) => a.key === key);
  if (!found) throw new Error(`Unknown axis: ${key}`);
  return found;
}

export function axisIndex(key: AxisKey): number {
  const idx = AXES.findIndex((a) => a.key === key);
  if (idx < 0) throw new Error(`Unknown axis: ${key}`);
  return idx;
}
