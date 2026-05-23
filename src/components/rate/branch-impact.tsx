"use client";

/**
 * Four branch chips that preview the *direction* a rating would nudge the
 * user's taste profile per branch (Thinking / Interaction / Luck /
 * Experience). The deltas are recomputed live as the user mouses over /
 * focuses a rating tile (the parent passes `previewRating`).
 *
 * Sign convention: positive = this rating pulls your centroid toward
 * higher-axis games in that branch. We use a tiny ▲/▼ glyph + branch
 * color so the chip reads at a glance.
 */

import { BRANCHES, type Branch } from "@/lib/scoring";
import type { BranchDeltas } from "@/lib/rate/branch-impact";

const ORDER: ReadonlyArray<Branch> = [
  "thinking",
  "interaction",
  "luck",
  "experience",
];

const BRANCH_COLOR: Record<Branch, string> = {
  thinking: "var(--cs-branch-thinking)",
  interaction: "var(--cs-branch-interaction)",
  luck: "var(--cs-branch-luck)",
  experience: "var(--cs-branch-experience)",
};

export function BranchImpactChips({
  deltas,
}: {
  deltas: BranchDeltas | null;
}) {
  return (
    <ul className="flex flex-wrap gap-2" aria-label="branch impact preview">
      {ORDER.map((branch) => {
        const delta = deltas ? deltas[branch] : 0;
        const abs = Math.min(Math.abs(delta), 2);
        const glyph = delta > 0.05 ? "▲" : delta < -0.05 ? "▼" : "·";
        const tone = delta > 0.05 ? "positive" : delta < -0.05 ? "negative" : "neutral";
        return (
          <li
            key={branch}
            className="font-cs-mono uppercase rounded px-2 py-1 flex items-center gap-1.5"
            style={{
              fontSize: 9,
              letterSpacing: "0.14em",
              border: `1px solid ${BRANCH_COLOR[branch]}`,
              color: BRANCH_COLOR[branch],
              opacity: deltas ? Math.max(0.35, abs / 2) : 0.35,
            }}
            aria-label={`${BRANCHES[branch].label} ${tone} ${abs.toFixed(2)}`}
          >
            <span aria-hidden="true">{glyph}</span>
            <span>{BRANCHES[branch].label}</span>
          </li>
        );
      })}
    </ul>
  );
}
