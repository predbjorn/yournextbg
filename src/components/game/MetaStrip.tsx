/**
 * Compact meta strip: solo / fiddly / player counts / BGG link.
 * Server component.
 */

import type { Game } from "@/data/types";

interface MetaStripProps {
  game: Game;
}

function PcSlot({ label, kind }: { label: string; kind: "best" | "good" | "bad" }) {
  const cls =
    kind === "best"
      ? "text-[var(--accent)] border-[var(--accent)] bg-[rgba(247,129,102,0.1)]"
      : kind === "good"
      ? "text-[var(--ink)] border-[var(--ink-mute)]"
      : "text-[var(--ink-mute)] opacity-30 line-through";
  return (
    <span
      className={`inline-block min-w-[44px] px-1.5 py-0.5 border text-center font-mono text-[10px] font-semibold rounded-sm ${cls}`}
    >
      {label}
    </span>
  );
}

export function MetaStrip({ game }: MetaStripProps) {
  const pc = game.playerCount;
  return (
    <div className="grid gap-4 md:grid-cols-3 py-5 px-6 bg-[var(--bg)] border border-[var(--border)] font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-mute)]">
      <div>
        <strong className="block text-[var(--ink)] font-bold mb-1 tracking-[0.15em]">
          Solo
        </strong>
        <span className="font-serif text-2xl font-bold not-italic text-[var(--steel)]">
          {game.solo}
          <span className="text-base text-[var(--ink-mute)]">/10</span>
        </span>
      </div>
      <div>
        <strong className="block text-[var(--ink)] font-bold mb-1 tracking-[0.15em]">
          Fiddly
        </strong>
        <span className="font-serif text-2xl font-bold not-italic text-[var(--gold)]">
          {game.fiddly}
          <span className="text-base text-[var(--ink-mute)]">/10</span>
        </span>
      </div>
      <div>
        <strong className="block text-[var(--ink)] font-bold mb-1 tracking-[0.15em]">
          Players
        </strong>
        {pc ? (
          <div className="flex flex-wrap gap-1 mt-1">
            {pc.best.map((s) => (
              <PcSlot key={`b-${s}`} label={s} kind="best" />
            ))}
            {pc.good.map((s) => (
              <PcSlot key={`g-${s}`} label={s} kind="good" />
            ))}
            {pc.bad.map((s) => (
              <PcSlot key={`x-${s}`} label={s} kind="bad" />
            ))}
          </div>
        ) : (
          <span>—</span>
        )}
      </div>
    </div>
  );
}
