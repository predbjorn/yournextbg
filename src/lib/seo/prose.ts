/**
 * Programmatic prose generator for game pages.
 *
 * Each game gets ~200 words of unique, score-aware text without manual
 * editorial input. This is a v1 SEO floor — editorial prose layered on top
 * later will outrank it, but it ensures every page has substantive content.
 */

import { AXES, axisIndex, DEFAULT_LENS, rankBySimilarity, axisDeltas, type AxisKey } from "@/lib/scoring";
import type { Game } from "@/data/types";

function get(g: Game, key: AxisKey): number {
  return g.scores[axisIndex(key)];
}

/** Soft-categorical reading of a 0-10 score. */
function bucket(v: number): "very low" | "low" | "medium" | "high" | "very high" {
  if (v <= 2) return "very low";
  if (v <= 4) return "low";
  if (v <= 6) return "medium";
  if (v <= 8) return "high";
  return "very high";
}

function thinkingParagraph(g: Game): string {
  const weight = get(g, "weight");
  const depth = get(g, "depth");
  const density = get(g, "density");

  const weightWord =
    weight >= 8 ? "heavy" : weight >= 6 ? "medium-heavy" : weight >= 4 ? "medium" : weight >= 2 ? "light" : "very light";
  const depthClause =
    depth - weight >= 3
      ? `Despite the modest rules footprint, the decision space is deep (${depth}/10) — the kind of game that rewards a dozen plays.`
      : depth >= 9
      ? `The decision tree is among the deepest in the hobby (${depth}/10), with meaningful long-term planning every turn.`
      : depth >= 7
      ? `It offers a substantial decision tree (${depth}/10) — enough to reward repeated study.`
      : `Strategic depth is moderate (${depth}/10) — pleasant to learn, but not infinitely deep.`;
  const densityClause =
    density >= 8
      ? `Decision density is intense (${density}/10) — expect brain-burn and the occasional bout of AP.`
      : density >= 5
      ? `Decisions come at a steady pace (${density}/10) — engaged without being exhausting.`
      : `It plays at a relaxed pace (${density}/10), with most turns having a clear obvious-best move.`;

  return `${g.name} is a ${weightWord} game (weight ${weight}/10). ${depthClause} ${densityClause}`;
}

function interactionParagraph(g: Game): string {
  const interaction = get(g, "interaction");
  const conflict = get(g, "conflict");
  const negotiation = get(g, "negotiation");

  const interactionClause =
    interaction >= 9
      ? `Interaction is maxed (${interaction}/10) — every turn shapes what your opponents can do.`
      : interaction >= 7
      ? `Players are constantly affecting each other's plans (interaction ${interaction}/10).`
      : interaction >= 5
      ? `There's meaningful but indirect interaction (interaction ${interaction}/10) — shared resources, catch-up effects, or watch-and-react moments.`
      : interaction >= 3
      ? `Interaction is light (${interaction}/10); it leans toward parallel play.`
      : `It plays close to multiplayer solitaire (interaction ${interaction}/10).`;

  const conflictClause =
    conflict >= 7
      ? ` Direct conflict is high (${conflict}/10) — friendships will be tested.`
      : conflict >= 4
      ? ` Direct conflict exists but is contained (${conflict}/10).`
      : ` Direct attacks are minimal (${conflict}/10) — the friction comes from contention, not aggression.`;

  const negotiationClause =
    negotiation >= 8
      ? ` And table-talk diplomacy is essential (negotiation ${negotiation}/10) — winning requires persuasion.`
      : negotiation >= 5
      ? ` Some negotiation matters (negotiation ${negotiation}/10).`
      : "";

  return `${interactionClause}${conflictClause}${negotiationClause}`;
}

function luckParagraph(g: Game): string {
  const input = get(g, "input");
  const output = get(g, "output");
  const catchup = get(g, "catchup");

  const luckClause =
    output >= 7
      ? `Output randomness is significant (${output}/10) — dice, reveals, or end-of-turn surprises can upend plans.`
      : input >= 7
      ? `Most variance is input randomness (${input}/10): luck arrives before your decision and you plan around it.`
      : input <= 3 && output <= 3
      ? `Variance is low across the board (input ${input}/10, output ${output}/10) — this is a skill game with little to blame the dice for.`
      : `Variance is moderate (input ${input}, output ${output}/10).`;

  const catchupClause =
    catchup >= 7
      ? ` Catch-up effects are strong (${catchup}/10) — runaway leaders are rare.`
      : catchup <= 3
      ? ` Be warned: catch-up is weak (${catchup}/10) — early stumbles can be hard to recover from.`
      : ` Catch-up is moderate (${catchup}/10).`;

  return `${luckClause}${catchupClause}`;
}

function experienceParagraph(g: Game): string {
  const theme = get(g, "theme");
  const engine = get(g, "engine");
  const narrative = get(g, "narrative");

  const themeClause =
    theme >= 9
      ? `The theme is fully baked into the mechanics (${theme}/10) — mechanics and fiction are inseparable.`
      : theme >= 7
      ? `The theme is well-integrated (${theme}/10).`
      : theme >= 4
      ? `The theme provides flavor (${theme}/10) but the experience is mostly mechanical.`
      : `The theme is pasted on (${theme}/10) — you're really there for the systems.`;

  const engineClause =
    engine >= 8
      ? ` The engine-building arc is strong (engine ${engine}/10) — early-game investments pay off in explosive late-game turns.`
      : engine >= 5
      ? ` There's a clear engine-building feel (engine ${engine}/10).`
      : ` Tempo is steady (engine ${engine}/10) — no big-payoff combo turns.`;

  const narrativeClause =
    narrative >= 8
      ? ` And the game tells a story (narrative ${narrative}/10) — sessions have arc and consequences.`
      : narrative >= 5
      ? ` There's some narrative flavor (narrative ${narrative}/10).`
      : "";

  return `${themeClause}${engineClause}${narrativeClause}`;
}

export interface BranchProse {
  thinking: string;
  interaction: string;
  luck: string;
  experience: string;
}

export function generateBranchProse(g: Game): BranchProse {
  return {
    thinking: thinkingParagraph(g),
    interaction: interactionParagraph(g),
    luck: luckParagraph(g),
    experience: experienceParagraph(g),
  };
}

/** Short description suitable for `<meta name="description">` (~155 chars). */
export function metaDescription(g: Game): string {
  const sig = g.signature ?? "";
  const weight = get(g, "weight");
  const interaction = get(g, "interaction");
  const intro = `${g.name}: ${sig ? sig + ". " : ""}Weight ${weight}/10, Interaction ${interaction}/10.`;
  const tail = "Compare profiles and find similar games on yournextbg.";
  // Trim to ~155 chars
  const full = `${intro} ${tail}`;
  if (full.length <= 160) return full;
  return full.slice(0, 157) + "...";
}

/** Long description for JSON-LD (~300-400 chars). */
export function longDescription(g: Game): string {
  const prose = generateBranchProse(g);
  return `${prose.thinking} ${prose.interaction}`.replace(/\s+/g, " ").slice(0, 500);
}

/**
 * Find the most-similar in-catalog game and the single axis where the two
 * profiles differ the most. Used by the closest-neighbor prose sentence and,
 * later, the "vs. X" mini-section.
 */
export interface ClosestNeighbor {
  neighbor: Game;
  sim: number;            // 0..1
  topAxis: AxisKey;       // axis with largest |delta|
  topAxisLabel: string;   // display label for topAxis (avoids axisIndex round-trip)
  refValue: number;
  neighborValue: number;
}

export function closestNeighbor(g: Game, catalog: readonly Game[]): ClosestNeighbor | null {
  const ranked = rankBySimilarity(g, catalog, DEFAULT_LENS);
  if (ranked.length === 0) return null;
  const top = ranked[0];
  const deltas = axisDeltas(g.scores, top.game.scores);
  const biggest = deltas[0];
  return {
    neighbor: top.game,
    sim: top.sim,
    topAxis: AXES[biggest.axisIndex].key,
    topAxisLabel: AXES[biggest.axisIndex].label,
    refValue: biggest.a,
    neighborValue: biggest.b,
  };
}

/**
 * One-sentence editorial hook naming the closest in-catalog neighbor and the
 * axis where the two diverge the most. Returns "" if the catalog has fewer
 * than 2 games or the neighbor's similarity is below 0.55 (too dissimilar to
 * be useful — would generate misleading text).
 */
export function closestNeighborSentence(g: Game, catalog: readonly Game[]): string {
  const cn = closestNeighbor(g, catalog);
  if (!cn) return "";
  if (cn.sim < 0.55) return "";
  const labelLower = cn.topAxisLabel.toLowerCase();
  const direction =
    cn.refValue === cn.neighborValue
      ? `with an identical ${labelLower} score (${cn.refValue})`
      : cn.refValue > cn.neighborValue
      ? `but scores higher on ${labelLower} (${cn.refValue} vs. ${cn.neighborValue})`
      : `but scores lower on ${labelLower} (${cn.refValue} vs. ${cn.neighborValue})`;
  const pct = Math.round(cn.sim * 100);
  return `Of every game in our catalog, ${g.name} is closest to ${cn.neighbor.name} (${pct}% profile match) ${direction}.`;
}
