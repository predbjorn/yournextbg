/**
 * Smoke check for SEO generators. Not a unit-test framework — just exercises
 * each helper against two real catalog games and prints output, plus a
 * handful of cheap assertions. Run between tasks:
 *
 *   pnpm tsx scripts/check-seo.ts
 */

import { GAMES } from "../src/data/games";
import type { Game } from "../src/data/types";
import {
  generateBranchProse,
  metaDescription,
  longDescription,
  closestNeighbor,
  closestNeighborSentence,
} from "../src/lib/seo/prose";

function pick(slug: string) {
  const g = GAMES.find((x) => x.slug === slug);
  if (!g) throw new Error(`Sample game not in catalog: ${slug}`);
  return g;
}

const samples: Game[] = [pick("brass-birmingham"), pick("azul")];

let failures = 0;
function check(label: string, cond: boolean, detail?: string) {
  const tag = cond ? "PASS" : "FAIL";
  console.log(`  [${tag}] ${label}${detail ? ` — ${detail}` : ""}`);
  if (!cond) failures++;
}

for (const g of samples) {
  console.log(`\n=== ${g.name} (${g.slug}) ===`);

  const prose = generateBranchProse(g);
  console.log("thinking:    ", prose.thinking);
  console.log("interaction: ", prose.interaction);
  console.log("luck:        ", prose.luck);
  console.log("experience:  ", prose.experience);

  const cn = closestNeighbor(g, GAMES);
  console.log("closest:     ", cn ? `${cn.neighbor.name} (sim ${cn.sim.toFixed(3)}, top axis ${cn.topAxis})` : "(none)");
  console.log("cn sentence: ", closestNeighborSentence(g, GAMES));
  console.log("meta:        ", metaDescription(g));
  console.log("long:        ", longDescription(g));

  check("prose.thinking is non-empty", prose.thinking.length > 20);
  check("metaDescription <= 160 chars", metaDescription(g).length <= 160, `len=${metaDescription(g).length}`);
  if (cn) {
    check("closest neighbor is not self", cn.neighbor.id !== g.id);
    check("similarity in [0,1]", cn.sim >= 0 && cn.sim <= 1);
    const sentence = closestNeighborSentence(g, GAMES);
    check(
      "closestNeighborSentence includes neighbor name when sim >= 0.55",
      cn.sim < 0.55 ? sentence === "" : sentence.includes(cn.neighbor.name),
    );
  }
}

console.log(`\n${failures === 0 ? "OK" : "FAILED"} — ${failures} failure(s)`);
process.exit(failures === 0 ? 0 : 1);
