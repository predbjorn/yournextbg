"use client";

import { useMemo, useState } from "react";
import {
  AXES,
  BRANCHES,
  LENSES,
  DEFAULT_LENS,
  similarity,
  axisDeltas,
  rankBySimilarity,
  type LensKey,
} from "@/lib/scoring";
import { GAMES, getGame } from "@/data/games";
import { getBggRef } from "@/data/bgg-refs";
import type { Category, Game } from "@/data/types";
import { Radar } from "./Radar";

const CATEGORIES: { key: Category; label: string }[] = [
  { key: "owned", label: "Owned" },
  { key: "heavy-euro", label: "Heavy Euros" },
  { key: "geek", label: "Geek-gjengen" },
  { key: "social", label: "Social" },
  { key: "filler", label: "Filler & dice" },
  { key: "2p-epic", label: "Long 2P epics" },
  { key: "solo", label: "Solo" },
];

const TOP_N = 10;

function clsxJoin(...xs: (string | false | null | undefined)[]): string {
  return xs.filter(Boolean).join(" ");
}

function classifyPct(pct: number): "high" | "mid" | "low" {
  if (pct >= 80) return "high";
  if (pct >= 65) return "mid";
  return "low";
}

const PCT_COLOR: Record<"high" | "mid" | "low", string> = {
  high: "text-[var(--success)]",
  mid: "text-[var(--gold)]",
  low: "text-[var(--ink-mute)]",
};

function GameSelect({
  id,
  label,
  value,
  onChange,
  accent,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  accent: "accent" | "steel";
}) {
  const accentColor = accent === "accent" ? "text-[var(--accent)]" : "text-[var(--steel)]";
  const focusBorder = accent === "accent" ? "focus:border-[var(--accent)]" : "focus:border-[var(--steel)]";
  return (
    <div>
      <label
        htmlFor={id}
        className={clsxJoin(
          "block font-mono text-[10px] uppercase tracking-[0.18em] mb-2",
          accentColor,
        )}
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={clsxJoin(
          "w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--ink)]",
          "px-4 py-3 font-mono text-[13px] rounded-sm cursor-pointer outline-none",
          "appearance-none transition-colors hover:border-[var(--ink-mute)]",
          focusBorder,
        )}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3e%3cpath fill='%238b949e' d='M2 4l4 4 4-4z'/%3e%3c/svg%3e\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 14px center",
          backgroundSize: "10px",
          paddingRight: 36,
        }}
      >
        <option value="">— select —</option>
        {CATEGORIES.map((c) => {
          const games = GAMES.filter((g) => g.category === c.key);
          if (games.length === 0) return null;
          return (
            <optgroup key={c.key} label={c.label}>
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>
    </div>
  );
}

function LensPicker({
  value,
  onChange,
}: {
  value: LensKey;
  onChange: (v: LensKey) => void;
}) {
  const lens = LENSES[value];
  const ranked = AXES
    .map((ax) => ({ ax, w: lens.weights[ax.key] }))
    .sort((a, b) => b.w - a.w);
  const top = ranked.slice(0, 3);
  const allEqual = ranked.every((r) => r.w === ranked[0].w);

  return (
    <div className="bg-[var(--bg)] border border-[var(--border)] p-5 mb-7">
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ink-mute)]">
          Comparison lens
        </span>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(LENSES) as LensKey[]).map((k) => {
            const active = k === value;
            return (
              <button
                key={k}
                type="button"
                onClick={() => onChange(k)}
                className={clsxJoin(
                  "border rounded-sm px-3.5 py-1.5",
                  "font-mono text-[11px] uppercase tracking-[0.08em]",
                  "transition-colors cursor-pointer",
                  active
                    ? "bg-[rgba(88,166,255,0.08)] border-[var(--steel)] text-[var(--steel)]"
                    : "bg-transparent border-[var(--border)] text-[var(--ink-dim)] hover:border-[var(--ink-mute)] hover:text-[var(--ink)]",
                )}
              >
                {LENSES[k].label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="pt-3 border-t border-dashed border-[var(--border)] text-sm italic text-[var(--ink-dim)] leading-snug">
        <strong className="not-italic font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink)] font-bold mr-2">
          {lens.label}
        </strong>
        {lens.blurb}
        {!allEqual && (
          <div className="mt-2 inline-flex flex-wrap gap-1.5">
            <span className="font-mono not-italic text-[10px] text-[var(--ink-mute)] mr-1">
              Weighted highest:
            </span>
            {top.map((r) => (
              <span
                key={r.ax.key}
                className="font-mono not-italic text-[10px] px-1.5 py-0.5 border border-[rgba(88,166,255,0.4)] rounded-sm text-[var(--steel)] tracking-wide"
              >
                {r.ax.label} ×{r.w.toFixed(1)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SimilarityReadout({
  gameA,
  gameB,
  lens,
}: {
  gameA: Game | null;
  gameB: Game | null;
  lens: LensKey;
}) {
  if (!gameA || !gameB) {
    return (
      <div className="bg-[var(--bg)] border border-[var(--border)] py-5 px-6 text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ink-mute)] mb-2">
          Profile similarity A ↔ B
        </div>
        <div className="font-serif text-3xl text-[var(--ink-mute)] font-light">
          pick B
        </div>
      </div>
    );
  }
  const pct = Math.round(similarity(gameA.scores, gameB.scores, lens) * 100);
  const cls = classifyPct(pct);
  return (
    <div className="bg-[var(--bg)] border border-[var(--border)] py-5 px-6 text-center">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ink-mute)] mb-2">
        Profile similarity A ↔ B
      </div>
      <div className={clsxJoin("font-serif text-[56px] font-bold tracking-[-0.03em] leading-none flex items-baseline justify-center gap-1", PCT_COLOR[cls])}>
        {pct}
        <span className="font-mono text-base text-[var(--ink-mute)] tracking-wider">%</span>
      </div>
    </div>
  );
}

function DiffHighlights({
  gameA,
  gameB,
}: {
  gameA: Game | null;
  gameB: Game | null;
}) {
  if (!gameA || !gameB) {
    return (
      <div className="text-sm italic text-[var(--ink-mute)] py-3.5 px-4 border border-dashed border-[var(--border)] text-center">
        Pick game B to see where the 12-axis profile diverges.
      </div>
    );
  }
  const diffs = axisDeltas(gameA.scores, gameB.scores)
    .slice(0, 4)
    .filter((d) => d.delta >= 2);

  if (diffs.length === 0) {
    return (
      <div className="text-sm italic text-[var(--ink-mute)] py-3.5 px-4 border border-dashed border-[var(--border)] text-center">
        Profile is near-identical. If you love one, you&apos;ll probably like the other.
      </div>
    );
  }

  const branchColor: Record<string, string> = {
    tanke: "border-l-[var(--branch-tanke)]",
    interaksjon: "border-l-[var(--branch-interaksjon)]",
    flaks: "border-l-[var(--branch-flaks)]",
    opplevelse: "border-l-[var(--branch-opplevelse)]",
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ink-mute)] mb-1">
        Where they differ most
      </div>
      {diffs.map((d) => {
        const ax = AXES[d.axisIndex];
        const higherName = d.a > d.b ? gameA.name : gameB.name;
        return (
          <div
            key={ax.key}
            className={clsxJoin(
              "bg-[var(--bg)] border border-[var(--border)] border-l-[3px] py-3 px-3.5",
              "grid grid-cols-[70px_1fr] gap-3 items-center text-sm leading-snug",
              branchColor[ax.branch],
            )}
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-dim)]">
              {ax.label}
            </div>
            <div className="text-[var(--ink)] text-[13px]">
              <span className="font-mono font-bold text-xs text-[var(--accent)]">A {d.a}</span>
              {" · "}
              <span className="font-mono font-bold text-xs text-[var(--steel)]">B {d.b}</span>
              {" — "}
              <strong>{higherName}</strong> has {ax.diffExplanation}.
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SimilarList({
  gameA,
  lens,
  onPick,
}: {
  gameA: Game | null;
  lens: LensKey;
  onPick: (id: string) => void;
}) {
  const ranked = useMemo(() => {
    if (!gameA) return [];
    return rankBySimilarity(gameA, GAMES, lens).slice(0, 8);
  }, [gameA, lens]);

  if (!gameA) return null;

  return (
    <div className="pt-8 border-t border-dashed border-[var(--border)]">
      <h3 className="font-serif text-2xl font-bold tracking-tight leading-tight mb-1.5">
        Games with the same profile as{" "}
        <em className="italic font-light text-[var(--accent)]">{gameA.name}</em>
      </h3>
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--ink-mute)] mb-5">
        Click a game to overlay it as Spill B
      </p>
      <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
        {ranked.map((r, i) => {
          const pct = Math.round(r.sim * 100);
          const cls = classifyPct(pct);
          return (
            <button
              key={r.game.id}
              type="button"
              onClick={() => onPick(r.game.id)}
              className={clsxJoin(
                "bg-[var(--bg)] border border-[var(--border)] py-3.5 px-4",
                "grid grid-cols-[32px_1fr_auto] gap-3 items-center font-serif",
                "transition-all hover:border-[var(--steel)] hover:bg-[var(--bg-elev)] hover:translate-x-0.5",
                "text-left cursor-pointer",
              )}
            >
              <div className="text-2xl font-light italic text-[var(--steel)] text-center leading-none">
                {i + 1}
              </div>
              <div className="min-w-0">
                <div className="text-base font-semibold tracking-tight leading-tight mb-1">
                  {r.game.name}
                </div>
                <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--ink-mute)]">
                  {r.game.categoryLabel}
                </div>
              </div>
              <div className={clsxJoin("font-mono text-[15px] font-bold text-right leading-none", PCT_COLOR[cls])}>
                {pct}%
                <span className="block text-[8px] uppercase tracking-[0.1em] font-normal text-[var(--ink-mute)] mt-1">
                  similar
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BggPanel({
  gameA,
  lens,
}: {
  gameA: Game | null;
  lens: LensKey;
}) {
  const refs = gameA ? getBggRef(gameA.id) : undefined;

  // Compute our engine's rank for any given target id
  const ourRankOf = useMemo(() => {
    if (!gameA) return null;
    const ranked = rankBySimilarity(gameA, GAMES, lens);
    return (targetId: string): number | null => {
      const idx = ranked.findIndex((r) => r.game.id === targetId);
      return idx >= 0 ? idx + 1 : null;
    };
  }, [gameA, lens]);

  if (!gameA || !refs || !ourRankOf) return null;

  const enriched = refs.list.map((r) => {
    if (!r.ourId) return { ...r, status: "absent" as const, ourRank: null };
    const rank = ourRankOf(r.ourId);
    const status = rank !== null && rank <= TOP_N ? "agree" as const : "disagree" as const;
    return { ...r, status, ourRank: rank };
  });

  const mappable = enriched.filter((r) => r.ourId);
  const agreeCount = enriched.filter((r) => r.status === "agree").length;

  const branchBorder = {
    agree: "border-l-[var(--success)]",
    disagree: "border-l-[var(--gold)]",
    absent: "border-l-[var(--ink-mute)] opacity-70",
  };

  return (
    <div className="mt-8 pt-8 border-t border-dashed border-[var(--border)]">
      <div className="flex flex-wrap justify-between items-baseline gap-3 mb-2">
        <h3 className="font-serif text-2xl font-bold tracking-tight leading-tight">
          BGG says about{" "}
          <em className="italic font-light text-[var(--ink-dim)]">{gameA.name}</em>
        </h3>
        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-mute)]">
          Source:{" "}
          <a
            href="https://recommend.games/"
            target="_blank"
            rel="noopener"
            className="text-[var(--steel)] hover:underline"
          >
            recommend.games
          </a>{" "}
          · Fetched {refs.fetchedAt}
        </div>
      </div>

      {/* Banner */}
      <div
        className={clsxJoin(
          "my-4 py-3 px-4.5 bg-[var(--bg)] border-l-[3px] text-sm leading-snug text-[var(--ink)]",
          refs.cfQuality === "noisy"
            ? "border-l-[var(--gold)]"
            : "border-l-[var(--steel)]",
        )}
      >
        {refs.cfQuality === "noisy" ? (
          <>
            <strong className="font-mono text-xs tracking-wide text-[var(--gold)]">⚠ CF noise:</strong>{" "}
            {refs.cfNote}
          </>
        ) : mappable.length === 0 ? (
          <>
            <strong className="font-mono text-xs tracking-wide text-[var(--steel)]">No overlap possible:</strong>{" "}
            None of BGG&apos;s top 10 are in your 34-game catalog. Candidates to score and add.
          </>
        ) : (
          <>
            <strong className="font-mono text-xs tracking-wide text-[var(--steel)]">
              Overlap@{TOP_N}: {agreeCount} of {mappable.length} mappable.
            </strong>{" "}
            Of BGG&apos;s picks that exist in your catalog, our engine (lens: <em>{LENSES[lens].label}</em>) has {agreeCount} in top {TOP_N}.
          </>
        )}
      </div>

      <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))" }}>
        {enriched.map((r) => {
          const bggLink = `https://boardgamegeek.com/boardgame/${r.bggId}`;
          return (
            <div
              key={r.bggId}
              className={clsxJoin(
                "grid grid-cols-[28px_1fr_auto] gap-3 items-center py-3 px-3.5",
                "bg-[var(--bg)] border border-[var(--border)] border-l-[3px] font-serif text-sm",
                branchBorder[r.status],
              )}
            >
              <div className="font-mono text-[11px] text-[var(--ink-mute)] text-right">{r.rank}</div>
              <div className="min-w-0">
                <div className="font-semibold tracking-tight leading-tight">
                  <a
                    href={bggLink}
                    target="_blank"
                    rel="noopener"
                    className="text-[var(--ink)] hover:text-[var(--steel)] no-underline"
                  >
                    {r.name}
                  </a>
                </div>
                <div
                  className={clsxJoin(
                    "font-mono text-[9px] uppercase tracking-[0.08em] mt-1",
                    r.status === "agree" && "text-[var(--success)]",
                    r.status === "disagree" && "text-[var(--gold)]",
                    r.status === "absent" && "text-[var(--ink-mute)]",
                  )}
                >
                  {r.status === "agree" && "✓ Our engine ranks it highly too"}
                  {r.status === "disagree" && "⚠ We rank it lower — investigate"}
                  {r.status === "absent" && (
                    <>
                      ⊘ Not scored · candidate to add
                      {r.note ? ` · ${r.note}` : ""}
                    </>
                  )}
                </div>
              </div>
              <div
                className={clsxJoin(
                  "font-mono text-[11px] font-bold text-right leading-tight",
                  r.status === "agree" && "text-[var(--success)]",
                  r.status === "disagree" && "text-[var(--gold)]",
                  r.status === "absent" && "text-[var(--ink-mute)]",
                )}
              >
                {r.ourRank !== null ? `#${r.ourRank}` : "—"}
                <span className="block text-[8px] uppercase tracking-[0.1em] font-normal text-[var(--ink-mute)] mt-0.5">
                  {r.ourRank !== null ? "our rank" : "not in catalog"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Comparator() {
  const [gameAId, setGameAId] = useState<string>("brass-birmingham");
  const [gameBId, setGameBId] = useState<string>("");
  const [lens, setLens] = useState<LensKey>(DEFAULT_LENS);

  const gameA = gameAId ? getGame(gameAId) ?? null : null;
  const gameB = gameBId ? getGame(gameBId) ?? null : null;

  function swap() {
    const t = gameAId;
    setGameAId(gameBId);
    setGameBId(t);
  }

  return (
    <section className="bg-gradient-to-br from-[var(--bg-elev)] to-[var(--bg-card)] border border-[var(--border)] p-12 my-10 relative">
      <span
        aria-hidden
        className="absolute top-9 right-11 text-3xl text-[rgba(88,166,255,0.25)]"
      >
        ⊙
      </span>

      <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--steel)] mb-3">
        <span className="w-7 h-px bg-[var(--steel)]" />
        Recommender · v1
      </div>
      <h2 className="font-serif text-3xl font-bold tracking-tight mb-3.5 leading-tight">
        Like <em className="italic font-light text-[var(--steel)]">this</em>? Then you&apos;ll probably also like…
      </h2>
      <p className="font-serif text-[17px] italic text-[var(--ink-dim)] max-w-2xl leading-snug mb-8">
        Pick a game you know and love as <strong className="not-italic">Spill A</strong>. The engine computes
        profile distance in 12-dimensional space and finds the nearest neighbors. Overlay a candidate as{" "}
        <strong className="not-italic">Spill B</strong> to see exactly where they diverge.
      </p>

      <LensPicker value={lens} onChange={setLens} />

      <div className="grid grid-cols-[1fr_auto_1fr] gap-5 items-end mb-9 max-md:grid-cols-1">
        <GameSelect
          id="game-a"
          label="Game A · reference"
          value={gameAId}
          onChange={setGameAId}
          accent="accent"
        />
        <button
          type="button"
          onClick={swap}
          title="Swap A and B"
          className="bg-[var(--bg)] border border-[var(--border)] text-[var(--ink-dim)] w-11 h-11 text-lg rounded-sm transition-all hover:border-[var(--accent)] hover:text-[var(--accent)] mb-px max-md:rotate-90 max-md:mx-auto"
        >
          ⇄
        </button>
        <GameSelect
          id="game-b"
          label="Game B · overlay (optional)"
          value={gameBId}
          onChange={setGameBId}
          accent="steel"
        />
      </div>

      <div className="grid grid-cols-[1.15fr_1fr] gap-10 items-start mb-10 max-md:grid-cols-1 max-md:gap-6">
        <div>
          <Radar gameA={gameA} gameB={gameB} className="w-full h-auto block" />
          <div className="flex justify-center gap-7 mt-3 font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--ink-mute)]">
            <span className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-[var(--accent)] border-2 border-[var(--accent)]" />
              Game A
            </span>
            <span className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-full bg-transparent border-2 border-dashed border-[var(--steel)]"
              />
              Game B
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <SimilarityReadout gameA={gameA} gameB={gameB} lens={lens} />
          <DiffHighlights gameA={gameA} gameB={gameB} />
        </div>
      </div>

      <SimilarList gameA={gameA} lens={lens} onPick={setGameBId} />
      <BggPanel gameA={gameA} lens={lens} />
    </section>
  );
}
