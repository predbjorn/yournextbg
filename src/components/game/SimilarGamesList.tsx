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
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
    >
      {ranked.map((r, i) => {
        const pct = Math.round(r.sim * 100);
        const pctColor =
          pct >= 80
            ? "var(--cs-positive)"
            : pct >= 65
              ? "var(--cs-branch-thinking)"
              : "var(--cs-muted)";
        return (
          <Link
            key={r.game.id}
            href={`/games/${r.game.slug}`}
            className="group bg-cs-paper-warm rounded-lg py-3.5 px-4 grid grid-cols-[28px_1fr_auto] gap-3 items-center transition-all hover:bg-cs-paper-edge no-underline"
            style={{
              boxShadow: "inset 0 0 0 1px rgba(28,26,20,0.08)",
            }}
          >
            <span
              className="font-cs-display italic text-cs-muted text-center leading-none"
              style={{ fontSize: 22, fontWeight: 400 }}
            >
              {i + 1}
            </span>
            <span className="min-w-0">
              <span
                className="block font-cs-display text-cs-ink leading-tight"
                style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}
              >
                {r.game.name}
              </span>
              <span
                className="block font-cs-mono uppercase text-cs-muted mt-0.5"
                style={{ fontSize: 9, letterSpacing: "0.14em" }}
              >
                {gameSubtitle(r.game)}
              </span>
            </span>
            <span
              className="font-cs-mono text-right leading-none"
              style={{ fontSize: 14, fontWeight: 600, color: pctColor }}
            >
              {pct}%
              <span
                className="block font-cs-mono uppercase text-cs-muted mt-1"
                style={{
                  fontSize: 8,
                  letterSpacing: "0.14em",
                  fontWeight: 400,
                }}
              >
                similar
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
