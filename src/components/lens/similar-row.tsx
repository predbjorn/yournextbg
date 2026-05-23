"use client";

interface Props {
  rank: number;
  name: string;
  signature: string | null;
  sim: number; // 0..1
  pinned: boolean;
  onClick: () => void;
}

export function SimilarRow({ rank, name, signature, sim, pinned, onClick }: Props) {
  const pct = Math.round(sim * 100);
  return (
    <li
      style={{
        borderBottom: "1px solid rgba(28,26,20,0.08)",
      }}
    >
      <button
        type="button"
        onClick={onClick}
        aria-pressed={pinned}
        className={`w-full text-left flex items-center gap-3 px-4 py-3 transition-colors ${
          pinned ? "bg-cs-paper-deep/40" : "hover:bg-cs-paper-deep/20"
        }`}
      >
        <span
          className="font-cs-mono text-cs-muted shrink-0"
          style={{
            fontSize: 11,
            letterSpacing: "0.14em",
            width: 26,
          }}
        >
          {String(rank).padStart(2, "0")}
        </span>
        <div className="flex flex-col min-w-0 grow">
          <span
            className="font-cs-display text-cs-ink truncate"
            style={{ fontSize: 15, fontWeight: 600 }}
          >
            {name}
          </span>
          {signature && (
            <span
              className="font-cs-display italic text-cs-ink/60 truncate"
              style={{ fontSize: 12 }}
            >
              {signature}
            </span>
          )}
        </div>
        <span
          className="font-cs-mono shrink-0"
          style={{
            fontSize: 11,
            letterSpacing: "0.06em",
            color: pinned ? "var(--cs-ink)" : "var(--cs-muted)",
          }}
        >
          {pct}%
        </span>
      </button>
    </li>
  );
}
