/**
 * Print derived facets for every game in the catalog.
 * Used to sanity-check that gameSubtitle / styleTags produce sensible
 * output across the full catalog.
 *
 * Usage: pnpm tsx scripts/check-facets.ts
 */

import { GAMES } from "../src/data/games";
import {
  weightClass,
  playerFits,
  styleTags,
  gameSubtitle,
} from "../src/lib/facets";

const rows = GAMES.map((g) => ({
  name: g.name,
  weight: weightClass(g),
  players: playerFits(g).join("/") || "—",
  tags: styleTags(g).join(", ") || "(none)",
  subtitle: gameSubtitle(g),
}));

console.log(`\n${rows.length} games\n`);
const nameW = Math.max(...rows.map((r) => r.name.length));
const weightW = Math.max(...rows.map((r) => r.weight.length));
const playerW = Math.max(...rows.map((r) => r.players.length));
for (const r of rows) {
  console.log(
    `${r.name.padEnd(nameW)}  ${r.weight.padEnd(weightW)}  ${r.players.padEnd(playerW)}  ${r.subtitle.padEnd(28)}  [${r.tags}]`,
  );
}

const noTags = rows.filter((r) => r.tags === "(none)");
const noPlayers = rows.filter((r) => r.players === "—");
console.log(`\nGames with no style tags (fall back to weight-only subtitle): ${noTags.length}`);
if (noTags.length) console.log("  " + noTags.map((r) => r.name).join(", "));
console.log(`Games with no playerCount data: ${noPlayers.length}`);
if (noPlayers.length) console.log("  " + noPlayers.map((r) => r.name).join(", "));

const byClass = rows.reduce<Record<string, number>>((acc, r) => {
  acc[r.weight] = (acc[r.weight] ?? 0) + 1;
  return acc;
}, {});
console.log(`\nWeight class distribution: ${JSON.stringify(byClass)}`);
