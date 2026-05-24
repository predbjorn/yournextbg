/**
 * Full 12-axis score panel for the game detail page.
 * Server component — no interactivity, fully SSR-friendly.
 *
 * Cardstock styling: each branch becomes its own paper block with a
 * left edge in the branch's color. Axis rows are sparkbar + numeral
 * + label. Per-branch prose hangs below the bars.
 */

import { AXES, BRANCHES, type Branch } from "@/lib/scoring";
import type { Game } from "@/data/types";
import type { BranchProse } from "@/lib/seo/prose";

const BRANCH_ORDER: Branch[] = ["thinking", "interaction", "luck", "experience"];

const BRANCH_CSS_VAR: Record<Branch, string> = {
  thinking: "var(--cs-branch-thinking)",
  interaction: "var(--cs-branch-interaction)",
  luck: "var(--cs-branch-luck)",
  experience: "var(--cs-branch-experience)",
};

interface ScorePanelProps {
  game: Game;
  prose: BranchProse;
}

export function ScorePanel({ game, prose }: ScorePanelProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {BRANCH_ORDER.map((branchKey) => {
        const branch = BRANCHES[branchKey];
        const color = BRANCH_CSS_VAR[branchKey];
        const axes = AXES.map((ax, i) => ({ ax, i })).filter(
          (x) => x.ax.branch === branchKey,
        );
        const proseText = prose[branchKey];
        return (
          <article
            key={branchKey}
            className="bg-cs-paper-warm cs-grain rounded-lg p-6"
            style={{
              borderLeft: `3px solid ${color}`,
              boxShadow: "inset 0 0 0 1px rgba(28,26,20,0.08)",
            }}
          >
            <header className="flex items-baseline justify-between mb-4 gap-2 flex-wrap">
              <h3
                className="font-cs-mono uppercase"
                style={{
                  color,
                  fontSize: 11,
                  letterSpacing: "0.2em",
                }}
              >
                {branch.label}
              </h3>
              <span
                className="font-cs-display italic text-cs-muted"
                style={{ fontSize: 12 }}
              >
                {branch.tagline}
              </span>
            </header>

            <div className="flex flex-col gap-2 mb-5">
              {axes.map(({ ax, i }) => {
                const value = game.scores[i];
                return (
                  <div
                    key={ax.key}
                    className="grid grid-cols-[88px_1fr_28px] gap-3 items-center"
                  >
                    <span
                      className="font-cs-mono uppercase text-cs-muted"
                      style={{ fontSize: 10, letterSpacing: "0.14em" }}
                    >
                      {ax.label}
                    </span>
                    <div
                      className="relative bg-cs-ink/10 rounded-sm overflow-hidden"
                      style={{ height: 6 }}
                    >
                      <div
                        className="absolute inset-y-0 left-0 rounded-sm"
                        style={{
                          width: `${value * 10}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                    <span
                      className="text-right font-cs-mono text-cs-ink"
                      style={{ fontSize: 12, fontWeight: 600 }}
                    >
                      {value}
                    </span>
                  </div>
                );
              })}
            </div>

            <p
              className="font-cs-display italic text-cs-ink/75"
              style={{ fontSize: 14, lineHeight: 1.55 }}
            >
              {proseText}
            </p>
          </article>
        );
      })}
    </div>
  );
}
