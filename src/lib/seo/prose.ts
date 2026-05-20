/**
 * Programmatic prose generator for game pages.
 *
 * Each game gets ~200 words of unique, score-aware text without manual
 * editorial input. This is a v1 SEO floor — editorial prose layered on top
 * later will outrank it, but it ensures every page has substantive content.
 */

import { AXES, axisIndex, type AxisKey } from "@/lib/scoring";
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
  const vekt = get(g, "vekt");
  const dybde = get(g, "dybde");
  const density = get(g, "density");

  const weightWord =
    vekt >= 8 ? "heavy" : vekt >= 6 ? "medium-heavy" : vekt >= 4 ? "medium" : vekt >= 2 ? "light" : "very light";
  const depthClause =
    dybde - vekt >= 3
      ? `Despite the modest rules footprint, the decision space is deep (${dybde}/10) — the kind of game that rewards a dozen plays.`
      : dybde >= 9
      ? `The decision tree is among the deepest in the hobby (${dybde}/10), with meaningful long-term planning every turn.`
      : dybde >= 7
      ? `It offers a substantial decision tree (${dybde}/10) — enough to reward repeated study.`
      : `Strategic depth is moderate (${dybde}/10) — pleasant to learn, but not infinitely deep.`;
  const densityClause =
    density >= 8
      ? `Decision density is intense (${density}/10) — expect brain-burn and the occasional bout of AP.`
      : density >= 5
      ? `Decisions come at a steady pace (${density}/10) — engaged without being exhausting.`
      : `It plays at a relaxed pace (${density}/10), with most turns having a clear obvious-best move.`;

  return `${g.name} is a ${weightWord} game (vekt ${vekt}/10). ${depthClause} ${densityClause}`;
}

function interactionParagraph(g: Game): string {
  const inter = get(g, "inter");
  const konflikt = get(g, "konflikt");
  const forhandl = get(g, "forhandl");

  const interClause =
    inter >= 9
      ? `Interaction is maxed (${inter}/10) — every turn shapes what your opponents can do.`
      : inter >= 7
      ? `Players are constantly affecting each other's plans (inter ${inter}/10).`
      : inter >= 5
      ? `There's meaningful but indirect interaction (inter ${inter}/10) — shared resources, catch-up effects, or watch-and-react moments.`
      : inter >= 3
      ? `Interaction is light (${inter}/10); it leans toward parallel play.`
      : `It plays close to multiplayer solitaire (inter ${inter}/10).`;

  const konfliktClause =
    konflikt >= 7
      ? ` Direct conflict is high (${konflikt}/10) — friendships will be tested.`
      : konflikt >= 4
      ? ` Direct conflict exists but is contained (${konflikt}/10).`
      : ` Direct attacks are minimal (${konflikt}/10) — the friction comes from contention, not aggression.`;

  const forhandlClause =
    forhandl >= 8
      ? ` And table-talk diplomacy is essential (forhandl ${forhandl}/10) — winning requires persuasion.`
      : forhandl >= 5
      ? ` Some negotiation matters (forhandl ${forhandl}/10).`
      : "";

  return `${interClause}${konfliktClause}${forhandlClause}`;
}

function lucksParagraph(g: Game): string {
  const input = get(g, "input");
  const output = get(g, "output");
  const innhente = get(g, "innhente");

  const lucksClause =
    output >= 7
      ? `Output randomness is significant (${output}/10) — dice, reveals, or end-of-turn surprises can upend plans.`
      : input >= 7
      ? `Most variance is input randomness (${input}/10): luck arrives before your decision and you plan around it.`
      : input <= 3 && output <= 3
      ? `Variance is low across the board (input ${input}/10, output ${output}/10) — this is a skill game with little to blame the dice for.`
      : `Variance is moderate (input ${input}, output ${output}/10).`;

  const catchupClause =
    innhente >= 7
      ? ` Catch-up effects are strong (${innhente}/10) — runaway leaders are rare.`
      : innhente <= 3
      ? ` Be warned: catch-up is weak (${innhente}/10) — early stumbles can be hard to recover from.`
      : ` Catch-up is moderate (${innhente}/10).`;

  return `${lucksClause}${catchupClause}`;
}

function experienceParagraph(g: Game): string {
  const tema = get(g, "tema");
  const motor = get(g, "motor");
  const narrativ = get(g, "narrativ");

  const temaClause =
    tema >= 9
      ? `The theme is fully baked into the mechanics (${tema}/10) — mechanics and fiction are inseparable.`
      : tema >= 7
      ? `The theme is well-integrated (${tema}/10).`
      : tema >= 4
      ? `The theme provides flavor (${tema}/10) but the experience is mostly mechanical.`
      : `The theme is pasted on (${tema}/10) — you're really there for the systems.`;

  const motorClause =
    motor >= 8
      ? ` The engine-building arc is strong (motor ${motor}/10) — early-game investments pay off in explosive late-game turns.`
      : motor >= 5
      ? ` There's a clear engine-building feel (motor ${motor}/10).`
      : ` Tempo is steady (motor ${motor}/10) — no big-payoff combo turns.`;

  const narrativClause =
    narrativ >= 8
      ? ` And the game tells a story (narrativ ${narrativ}/10) — sessions have arc and consequences.`
      : narrativ >= 5
      ? ` There's some narrative flavor (narrativ ${narrativ}/10).`
      : "";

  return `${temaClause}${motorClause}${narrativClause}`;
}

export interface BranchProse {
  tanke: string;
  interaksjon: string;
  flaks: string;
  opplevelse: string;
}

export function generateBranchProse(g: Game): BranchProse {
  return {
    tanke: thinkingParagraph(g),
    interaksjon: interactionParagraph(g),
    flaks: lucksParagraph(g),
    opplevelse: experienceParagraph(g),
  };
}

/** Short description suitable for `<meta name="description">` (~155 chars). */
export function metaDescription(g: Game): string {
  const sig = g.signature ?? "";
  const vekt = get(g, "vekt");
  const inter = get(g, "inter");
  const intro = `${g.name}: ${sig ? sig + ". " : ""}Vekt ${vekt}/10, Interaksjon ${inter}/10.`;
  const tail = "Compare profiles and find similar games on yournextbg.";
  // Trim to ~155 chars
  const full = `${intro} ${tail}`;
  if (full.length <= 160) return full;
  return full.slice(0, 157) + "...";
}

/** Long description for JSON-LD (~300-400 chars). */
export function longDescription(g: Game): string {
  const prose = generateBranchProse(g);
  return `${prose.tanke} ${prose.interaksjon}`.replace(/\s+/g, " ").slice(0, 500);
}
