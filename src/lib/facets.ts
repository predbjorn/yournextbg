/**
 * Derived navigational facets — all computed from a game's existing fields,
 * no per-game manual data. Used by the comparator's filter strip and as the
 * source for breadcrumb / OG subtitles.
 */

import { axisIndex, type AxisKey } from "@/lib/scoring";
import type { Game } from "@/data/types";

export type WeightClass = "filler" | "gateway" | "mid" | "heavy" | "brain-burner";
export type PlayerFit = "solo" | "2p" | "3-4p" | "5+p";
export type StyleTag =
  | "engine-builder"
  | "high-interaction"
  | "negotiation"
  | "dice-luck"
  | "co-op"
  | "two-player-duel";

export const WEIGHT_CLASSES: { key: WeightClass; label: string }[] = [
  { key: "filler", label: "Filler" },
  { key: "gateway", label: "Gateway" },
  { key: "mid", label: "Mid-weight" },
  { key: "heavy", label: "Heavy" },
  { key: "brain-burner", label: "Brain-burner" },
];

export const PLAYER_FITS: { key: PlayerFit; label: string }[] = [
  { key: "solo", label: "Solo" },
  { key: "2p", label: "2P" },
  { key: "3-4p", label: "3–4P" },
  { key: "5+p", label: "5+P" },
];

export const STYLE_TAGS: { key: StyleTag; label: string }[] = [
  { key: "engine-builder", label: "Engine-builder" },
  { key: "high-interaction", label: "High interaction" },
  { key: "negotiation", label: "Negotiation" },
  { key: "dice-luck", label: "Dice / push-your-luck" },
  { key: "co-op", label: "Co-op" },
  { key: "two-player-duel", label: "2-player duel" },
];

function score(g: Game, key: AxisKey): number {
  return g.scores[axisIndex(key)];
}

export function weightClass(g: Game): WeightClass {
  const w = score(g, "weight");
  if (w <= 2) return "filler";
  if (w <= 4) return "gateway";
  if (w <= 6) return "mid";
  if (w <= 8) return "heavy";
  return "brain-burner";
}

export function playerFits(g: Game): PlayerFit[] {
  const best = g.playerCount?.best ?? [];
  const fits = new Set<PlayerFit>();
  for (const pc of best) {
    if (pc === "1P") fits.add("solo");
    else if (pc === "2P") fits.add("2p");
    else if (pc === "3P" || pc === "4P") fits.add("3-4p");
    else if (pc === "5P" || pc === "6P" || pc === "7P" || pc === "8P" || pc === "9P" || pc === "5+P") fits.add("5+p");
  }
  return [...fits];
}

export function styleTags(g: Game): StyleTag[] {
  const tags: StyleTag[] = [];
  const interaction = score(g, "interaction");
  const conflict = score(g, "conflict");
  const negotiation = score(g, "negotiation");
  const output = score(g, "output");
  const engine = score(g, "engine");
  const interBranchAvg = (interaction + conflict + negotiation) / 3;

  // Order matters: gameSubtitle() uses tags[0] as the primary descriptor,
  // so most-defining traits come first.
  // Co-op requires both no conflict AND meaningful interaction — Wingspan
  // and Cascadia have conflict=0 but are parallel-play, not co-op.
  if (conflict <= 1 && interaction >= 6) tags.push("co-op");

  const best = g.playerCount?.best ?? [];
  if (best.length === 1 && best[0] === "2P") tags.push("two-player-duel");

  if (negotiation >= 6) tags.push("negotiation");
  if (interBranchAvg >= 6.5 || interaction >= 8) tags.push("high-interaction");
  if (output >= 6) tags.push("dice-luck");
  if (engine >= 7) tags.push("engine-builder");

  return tags;
}

/** Short subtitle line shown on cards, breadcrumbs, OG footer. */
export function gameSubtitle(g: Game): string {
  const wc = WEIGHT_CLASSES.find((c) => c.key === weightClass(g))!.label;
  const tags = styleTags(g);
  const primary = tags[0];
  if (!primary) return wc;
  const tagLabel = STYLE_TAGS.find((t) => t.key === primary)!.label;
  return `${wc} · ${tagLabel}`;
}
