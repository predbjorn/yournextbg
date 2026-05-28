#!/usr/bin/env node
//
// Regenerates `ios/yournextbgTests/Fixtures/scoring-parity.json`.
// Hand-mirrors `src/lib/scoring/` so this script is fully self-contained
// (no TS compile step, no node_modules). If `src/lib/scoring/` changes,
// update the AXES/LENSES blocks below to match and re-run.
//
//   node ios/scripts/generate-scoring-fixtures.mjs > ios/yournextbgTests/Fixtures/scoring-parity.json
//
// The fixture serves as the cross-platform contract for iOS + Android
// scoring engine ports.

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Mirror of src/lib/scoring/axes.ts AXES order (LOAD-BEARING) ---
const AXES = [
  "weight","depth","density",
  "interaction","conflict","negotiation",
  "input","output","catchup",
  "theme","engine","narrative",
];

// --- Mirror of src/lib/scoring/lenses.ts LENSES ---
const LENSES = {
  standard: {
    weight:2.0,depth:1.2,density:1.0,
    interaction:1.8,conflict:1.2,negotiation:1.0,
    input:1.2,output:1.4,catchup:0.8,
    theme:1.0,engine:1.0,narrative:1.0,
  },
  weight: {
    weight:3.0,depth:2.2,density:1.5,
    interaction:1.0,conflict:0.5,negotiation:0.5,
    input:0.8,output:1.0,catchup:0.5,
    theme:0.5,engine:1.0,narrative:0.5,
  },
  feel: {
    weight:0.6,depth:0.8,density:0.8,
    interaction:2.5,conflict:1.8,negotiation:1.5,
    input:0.8,output:0.8,catchup:0.8,
    theme:2.2,engine:1.5,narrative:2.0,
  },
  luck: {
    weight:0.8,depth:1.0,density:0.8,
    interaction:1.0,conflict:1.0,negotiation:0.8,
    input:2.5,output:2.5,catchup:1.8,
    theme:0.8,engine:1.0,narrative:0.8,
  },
  equal: {
    weight:1.0,depth:1.0,density:1.0,
    interaction:1.0,conflict:1.0,negotiation:1.0,
    input:1.0,output:1.0,catchup:1.0,
    theme:1.0,engine:1.0,narrative:1.0,
  },
};

const MAX_AXIS_DIFF_SQ = 100;

function weightedDistance(a, b, lens) {
  const w = LENSES[lens];
  let s = 0;
  for (let i = 0; i < AXES.length; i++) {
    const wi = w[AXES[i]];
    const d = a[i] - b[i];
    s += wi * d * d;
  }
  return Math.sqrt(s);
}

function maxDistance(lens) {
  const w = LENSES[lens];
  const sum = AXES.reduce((s, k) => s + w[k], 0);
  return Math.sqrt(sum * MAX_AXIS_DIFF_SQ);
}

function similarity(a, b, lens) {
  return Math.max(0, 1 - weightedDistance(a, b, lens) / maxDistance(lens));
}

// --- Fixture pairs ---
// 8 vectors chosen to cover:
//   - identical (sanity)
//   - maximally distant (all 0 vs all 10)
//   - heavy strategy vs heavy strategy
//   - heavy vs filler
//   - dice-heavy vs dice-light
//   - thematic vs abstract
//   - close neighbors (real game-like vectors)
//   - asymmetric (most differ on one branch)

const fixtureGames = [
  { id: "identical-a", scores: [5,5,5,5,5,5,5,5,5,5,5,5] },
  { id: "identical-b", scores: [5,5,5,5,5,5,5,5,5,5,5,5] },
  { id: "all-low",     scores: [0,0,0,0,0,0,0,0,0,0,0,0] },
  { id: "all-high",    scores: [10,10,10,10,10,10,10,10,10,10,10,10] },
  // Brass: Birmingham-ish heavy euro
  { id: "heavy-euro-a", scores: [8.5,9.0,7.5,7.0,4.0,2.5,1.5,1.0,3.0,7.5,9.0,6.0] },
  // Gaia Project-ish heavy euro
  { id: "heavy-euro-b", scores: [9.0,9.0,8.0,5.5,3.0,1.5,2.0,1.0,2.5,5.0,9.5,4.0] },
  // Coup-ish filler
  { id: "filler",       scores: [1.0,2.0,2.0,7.0,8.0,7.0,4.0,4.0,2.0,5.0,1.0,2.0] },
  // Catan-ish dice-mid
  { id: "dice-mid",     scores: [2.0,3.0,3.0,6.5,4.0,7.0,3.0,7.0,4.0,5.0,3.0,3.0] },
];

const pairs = [
  ["identical-a", "identical-b"],
  ["all-low", "all-high"],
  ["heavy-euro-a", "heavy-euro-b"],
  ["heavy-euro-a", "filler"],
  ["heavy-euro-a", "dice-mid"],
  ["filler", "dice-mid"],
  ["heavy-euro-b", "filler"],
  ["heavy-euro-b", "dice-mid"],
];

const lenses = ["standard","weight","feel","luck","equal"];

function vec(id) {
  const g = fixtureGames.find(g => g.id === id);
  if (!g) throw new Error("no fixture: " + id);
  return g.scores;
}

const cases = [];
for (const [aId, bId] of pairs) {
  const a = vec(aId);
  const b = vec(bId);
  for (const lens of lenses) {
    cases.push({
      a: aId,
      b: bId,
      lens,
      distance: weightedDistance(a, b, lens),
      similarity: similarity(a, b, lens),
    });
  }
}

const out = {
  generatedAt: new Date().toISOString(),
  generator: "ios/scripts/generate-scoring-fixtures.mjs",
  axisOrder: AXES,
  lenses,
  games: fixtureGames,
  cases,
};

const target = resolve(__dirname, "..", "yournextbgTests", "Fixtures", "scoring-parity.json");
writeFileSync(target, JSON.stringify(out, null, 2) + "\n");
console.error("wrote " + target);
