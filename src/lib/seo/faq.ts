/**
 * Score-aware FAQ generator. Five fixed questions, each answered from the
 * game's score vector and meta-axes. Used both as visible page content and
 * as FAQPage JSON-LD (eligible for Google rich results).
 */

import { axisIndex } from "@/lib/scoring";
import type { Game } from "@/data/types";

export interface FaqItem {
  q: string;
  a: string;
}

function score(g: Game, key: Parameters<typeof axisIndex>[0]): number {
  return g.scores[axisIndex(key)];
}

function isSoloGood(g: Game): string {
  if (g.solo >= 8) return `Yes — ${g.name} has an excellent solo mode (solo ${g.solo}/10). Many players consider it a top-tier solo experience.`;
  if (g.solo >= 6) return `${g.name} works well solo (solo ${g.solo}/10), though the multiplayer is where the design shines.`;
  if (g.solo >= 4) return `${g.name} is playable solo (solo ${g.solo}/10), but the experience is noticeably thinner without other players.`;
  if (g.solo >= 2) return `${g.name} is technically solo-able (solo ${g.solo}/10), but it isn't designed for it — pick something else for solo nights.`;
  return `No — ${g.name} is a strictly multiplayer experience (solo ${g.solo}/10).`;
}

function bestPlayerCount(g: Game): string {
  const best = g.playerCount?.best ?? [];
  const good = g.playerCount?.good ?? [];
  const bad = g.playerCount?.bad ?? [];
  if (best.length === 0 && good.length === 0) {
    return `${g.name} doesn't have a strong player-count preference in our rubric — it plays similarly across its full range.`;
  }
  const bestStr = best.join(", ");
  const parts: string[] = [];
  if (best.length > 0) parts.push(`${g.name} is at its best at ${bestStr}`);
  if (good.length > 0) parts.push(`with ${good.join(", ")} also strong`);
  if (bad.length > 0) {
    const verb = bad.length > 1 ? "are the weakest counts" : "is the weakest count";
    parts.push(`${bad.join(", ")} ${verb}`);
  }
  return parts.join("; ") + ".";
}

function isHeavy(g: Game): string {
  const w = score(g, "weight");
  if (w >= 8) return `Yes — ${g.name} is a heavy game (weight ${w}/10). Expect a serious rules teach and a multi-hour first session.`;
  if (w >= 6) return `${g.name} is medium-heavy (weight ${w}/10) — substantial but learnable in one sitting with an experienced teacher.`;
  if (w >= 4) return `${g.name} sits in the medium-weight range (weight ${w}/10). New players can pick it up in a single explanation.`;
  if (w >= 2) return `${g.name} is on the lighter side (weight ${w}/10) — easy to teach, friendly to new players.`;
  return `${g.name} is very light (weight ${w}/10). Rules explained in minutes.`;
}

function howLucky(g: Game): string {
  const input = score(g, "input");
  const output = score(g, "output");
  if (output >= 7) return `${g.name} has significant output randomness (${output}/10) — dice, reveals, or end-of-turn surprises can swing the outcome after your decisions.`;
  if (input >= 7) return `${g.name} has high input luck (${input}/10) and output luck of ${output}/10 — most variance arrives before you choose, so good play means adapting to what you're dealt.`;
  if (input <= 3 && output <= 3) return `${g.name} is a near-skill game (input ${input}/10, output ${output}/10) — very little blame to lay on the dice.`;
  return `${g.name} has moderate variance (input ${input}/10, output ${output}/10).`;
}

function howConfrontational(g: Game): string {
  const interaction = score(g, "interaction");
  const conflict = score(g, "conflict");
  if (conflict >= 7) return `Highly confrontational — ${g.name} scores ${conflict}/10 on direct conflict. Friendships will be tested.`;
  if (conflict >= 4) return `${g.name} has meaningful but contained conflict (${conflict}/10) — friction without table-flipping.`;
  if (interaction >= 6) return `${g.name} is interactive (${interaction}/10) but not aggressive (conflict ${conflict}/10) — the contention is over shared resources, not direct attacks.`;
  return `${g.name} is largely non-confrontational (interaction ${interaction}/10, conflict ${conflict}/10) — leans toward parallel play.`;
}

export function generateFaq(g: Game): FaqItem[] {
  return [
    { q: `Is ${g.name} good solo?`,              a: isSoloGood(g) },
    { q: `What player count is ${g.name} best at?`, a: bestPlayerCount(g) },
    { q: `Is ${g.name} a heavy game?`,           a: isHeavy(g) },
    { q: `How much luck is there in ${g.name}?`, a: howLucky(g) },
    { q: `Is ${g.name} confrontational?`,        a: howConfrontational(g) },
  ];
}
