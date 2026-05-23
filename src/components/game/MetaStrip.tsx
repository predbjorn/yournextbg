/**
 * Compact meta strip: solo / fiddly / player counts.
 * Server component. Cardstock-styled.
 */

import type { Game } from "@/data/types";

interface MetaStripProps {
  game: Game;
}

function PcSlot({
  label,
  kind,
}: {
  label: string;
  kind: "best" | "good" | "bad";
}) {
  const base =
    "inline-block min-w-[46px] px-2 py-1 rounded-sm font-cs-mono text-center";
  if (kind === "best") {
    return (
      <span
        className={`${base} bg-cs-branch-thinking/15 text-cs-branch-thinking`}
        style={{
          fontSize: 10,
          letterSpacing: "0.12em",
          fontWeight: 600,
          border: "1px solid var(--cs-branch-thinking)",
        }}
      >
        {label}
      </span>
    );
  }
  if (kind === "good") {
    return (
      <span
        className={`${base} bg-cs-paper-warm text-cs-ink`}
        style={{
          fontSize: 10,
          letterSpacing: "0.12em",
          border: "1px solid rgba(28,26,20,0.18)",
        }}
      >
        {label}
      </span>
    );
  }
  return (
    <span
      className={`${base} text-cs-muted-soft line-through opacity-50`}
      style={{ fontSize: 10, letterSpacing: "0.12em" }}
    >
      {label}
    </span>
  );
}

export function MetaStrip({ game }: MetaStripProps) {
  const pc = game.playerCount;
  return (
    <div
      className="grid gap-4 md:grid-cols-3 py-5 px-6 bg-cs-paper-warm cs-grain rounded-lg"
      style={{ boxShadow: "inset 0 0 0 1px rgba(28,26,20,0.08)" }}
    >
      <Stat label="Solo" value={game.solo} />
      <Stat label="Fiddly" value={game.fiddly} />
      <div>
        <strong
          className="block font-cs-mono uppercase text-cs-muted mb-2"
          style={{ fontSize: 10, letterSpacing: "0.18em", fontWeight: 600 }}
        >
          Players
        </strong>
        {pc ? (
          <div className="flex flex-wrap gap-1">
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
          <span className="text-cs-muted">—</span>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <strong
        className="block font-cs-mono uppercase text-cs-muted mb-1"
        style={{ fontSize: 10, letterSpacing: "0.18em", fontWeight: 600 }}
      >
        {label}
      </strong>
      <span
        className="font-cs-display text-cs-ink"
        style={{ fontSize: 26, fontWeight: 600 }}
      >
        {value}
        <span
          className="font-cs-mono text-cs-muted ml-1"
          style={{ fontSize: 13 }}
        >
          /10
        </span>
      </span>
    </div>
  );
}
