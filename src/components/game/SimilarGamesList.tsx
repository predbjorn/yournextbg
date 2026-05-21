/**
 * Top-N similar games for a given reference game, precomputed server-side
 * using the default lens. Renders as link cards — no client state needed.
 */

import Link from "next/link";
import { DEFAULT_LENS, rankBySimilarity } from "@/lib/scoring";
import { GAMES } from "@/data/games";
import { gameSubtitle } from "@/lib/facets";
import type { Game } from "@/data/types";

interface SimilarGamesListProps {
  game: Game;
  limit?: number;
}

export function SimilarGamesList({ game, limit = 6 }: SimilarGamesListProps) {
  const ranked = rankBySimilarity(game, GAMES, DEFAULT_LENS).slice(0, limit);

  return (
    <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
      {ranked.map((r, i) => {
        const pct = Math.round(r.sim * 100);
        const cls =
          pct >= 80 ? "text-[var(--success)]" : pct >= 65 ? "text-[var(--gold)]" : "text-[var(--ink-mute)]";
        return (
          <Link
            key={r.game.id}
            href={`/games/${r.game.slug}`}
            className="group bg-[var(--bg)] border border-[var(--border)] py-3.5 px-4 grid grid-cols-[28px_1fr_auto] gap-3 items-center font-serif transition-all hover:border-[var(--steel)] hover:bg-[var(--bg-elev)] hover:translate-x-0.5 no-underline"
          >
            <span className="text-2xl font-light italic text-[var(--steel)] text-center leading-none">
              {i + 1}
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-semibold tracking-tight leading-tight text-[var(--ink)] group-hover:text-[var(--steel)]">
                {r.game.name}
              </span>
              <span className="block font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--ink-mute)] mt-0.5">
                {gameSubtitle(r.game)}
              </span>
            </span>
            <span className={`font-mono text-[14px] font-bold text-right leading-none ${cls}`}>
              {pct}%
              <span className="block text-[8px] uppercase tracking-[0.1em] font-normal text-[var(--ink-mute)] mt-1">
                similar
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
