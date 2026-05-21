/**
 * The 12-axis scoring rubric. Each axis is scored 0-10 per game.
 * Axes are grouped into 4 "branches" of the skill tree.
 *
 * The order of AXES is load-bearing: score vectors index by position.
 */

export type Branch = "thinking" | "interaction" | "luck" | "experience";

export type AxisKey =
  | "weight"
  | "depth"
  | "density"
  | "interaction"
  | "conflict"
  | "negotiation"
  | "input"
  | "output"
  | "catchup"
  | "theme"
  | "engine"
  | "narrative";

export interface Axis {
  key: AxisKey;
  label: string;
  branch: Branch;
  /** Short experiential implication when this axis is *higher* on game A than on game B. */
  diffExplanation: string;
}

export const AXES: readonly Axis[] = [
  // THINKING — cognition
  { key: "weight",      label: "Weight",      branch: "thinking",    diffExplanation: "more rules to digest, higher learning curve" },
  { key: "depth",       label: "Depth",       branch: "thinking",    diffExplanation: "deeper decision tree, higher skill ceiling" },
  { key: "density",     label: "Density",     branch: "thinking",    diffExplanation: "more meaningful choices per minute, more brain-burn" },

  // INTERACTION — multiplayer effect
  { key: "interaction", label: "Interaction", branch: "interaction", diffExplanation: "players affect each other's plans more, less solitaire" },
  { key: "conflict",    label: "Conflict",    branch: "interaction", diffExplanation: "more direct attacks, friendships tested" },
  { key: "negotiation", label: "Negotiation", branch: "interaction", diffExplanation: "table talk required, diplomacy is mandatory" },

  // LUCK — variance
  { key: "input",       label: "Input",       branch: "luck",        diffExplanation: "more card/setup luck to plan around" },
  { key: "output",      label: "Output",      branch: "luck",        diffExplanation: "more dice/reveal luck, plans can be upended" },
  { key: "catchup",     label: "Catch-up",    branch: "luck",        diffExplanation: "stronger catch-up, no runaway leader" },

  // EXPERIENCE
  { key: "theme",       label: "Theme",       branch: "experience",  diffExplanation: "theme is baked into the mechanics" },
  { key: "engine",      label: "Engine",      branch: "experience",  diffExplanation: "stronger engine-combo arc, explosive late-game turns" },
  { key: "narrative",   label: "Narrative",   branch: "experience",  diffExplanation: "tells a story, consequences persist" },
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
  thinking:    { label: "Thinking",    color: "#58a6ff", tagline: "how much brainwork?" },
  interaction: { label: "Interaction", color: "#f78166", tagline: "how multiplayer is the multiplayer?" },
  luck:        { label: "Luck",        color: "#d4a458", tagline: "where does luck live?" },
  experience:  { label: "Experience",  color: "#8957e5", tagline: "how does it feel?" },
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
