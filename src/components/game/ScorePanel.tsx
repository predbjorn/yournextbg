/**
 * Full 12-axis score panel for the game detail page.
 * Server component — no interactivity, fully SSR-friendly.
 */

import { AXES, BRANCHES, type Branch } from "@/lib/scoring";
import type { Game } from "@/data/types";
import type { BranchProse } from "@/lib/seo/prose";

const BRANCH_ORDER: Branch[] = ["thinking", "interaction", "luck", "experience"];

const BRANCH_EMOJI: Record<Branch, string> = {
  thinking: "🧠",
  interaction: "⚔️",
  luck: "🎲",
  experience: "🎭",
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
        const axes = AXES.map((ax, i) => ({ ax, i })).filter(
          (x) => x.ax.branch === branchKey,
        );
        const proseText = prose[branchKey];
        return (
          <article
            key={branchKey}
            className="bg-[var(--bg-card)] border border-[var(--border)] border-l-[3px] p-6"
            style={{ borderLeftColor: branch.color }}
          >
            <header className="flex items-baseline justify-between mb-4 gap-2 flex-wrap">
              <h3
                className="font-mono text-[11px] uppercase tracking-[0.2em] flex items-center gap-2"
                style={{ color: branch.color }}
              >
                <span aria-hidden>{BRANCH_EMOJI[branchKey]}</span>
                {branch.label}
              </h3>
              <span className="font-mono text-[10px] text-[var(--ink-mute)] italic">
                {branch.tagline}
              </span>
            </header>

            <div className="space-y-2 mb-5">
              {axes.map(({ ax, i }) => {
                const value = game.scores[i];
                return (
                  <div
                    key={ax.key}
                    className="grid grid-cols-[80px_1fr_24px] gap-3 items-center font-mono text-[12px]"
                  >
                    <span className="text-[var(--ink-dim)] text-[11px]">
                      {ax.label}
                    </span>
                    <div className="relative h-1.5 bg-white/5 rounded-sm overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 rounded-sm"
                        style={{
                          width: `${value * 10}%`,
                          backgroundColor: branch.color,
                        }}
                      />
                    </div>
                    <span className="text-right text-[var(--ink)] font-bold text-[12px]">
                      {value}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="text-[14px] leading-relaxed text-[var(--ink-dim)] italic font-serif">
              {proseText}
            </p>
          </article>
        );
      })}
    </div>
  );
}
