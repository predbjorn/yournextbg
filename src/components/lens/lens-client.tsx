"use client";

/**
 * The interactive Comparison Lens.
 *
 * Layout (desktop):
 *   ┌──────────┬───────────────────────────┬──────────────┐
 *   │ Card A   │  Radar A ⊕ B + lens chips │  Similar list│
 *   │ Card B   │  Axis diff (A vs B)       │  (50 items)  │
 *   └──────────┴───────────────────────────┴──────────────┘
 *
 * Network behavior:
 *   - On mount and whenever `a` changes, call `similar_games(anchor_id,
 *     k=50)`. The RPC returns axes-only nearest neighbors under L2 on the
 *     unweighted vector. Owned-exclusion is handled server-side (security
 *     invoker + RLS).
 *   - Re-ranking under the active lens happens client-side via
 *     `rankBySimilarity`. Changing the lens chip is *zero network*.
 *
 * URL state is the source of truth — back/forward + share both work.
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Radar, Stamp } from "@/components/ui";
import {
  LENSES,
  rankBySimilarity,
  type LensKey,
  type ScoreVector,
} from "@/lib/scoring";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { parseLensState, serializeLensState } from "@/lib/lens/state";
import type { LensSeedGame } from "@/lib/lens/queries";
import { PickerCard } from "./picker-card";
import { SimilarRow } from "./similar-row";
import { LensChips } from "./lens-chips";
import { AxisDiff } from "./axis-diff";

interface Props {
  seed: LensSeedGame;
}

interface Candidate {
  id: string;
  slug: string;
  name: string;
  bgg_id: number | null;
  signature: string | null;
  cover_status: "pending" | "ready" | "failed" | "manual";
  scores: ScoreVector;
}

interface CandidateRow {
  id: string;
  slug: string;
  name: string;
  bgg_id: number | null;
  signature: string | null;
  cover_status: string;
  scores: unknown;
}

function toCandidate(r: CandidateRow): Candidate | null {
  if (!Array.isArray(r.scores) || r.scores.length !== 12) return null;
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    bgg_id: r.bgg_id,
    signature: r.signature,
    cover_status: r.cover_status as Candidate["cover_status"],
    scores: r.scores as unknown as ScoreVector,
  };
}

export function LensClient({ seed }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const state = parseLensState(sp, seed.id);

  const [anchorGame, setAnchorGame] = useState<Candidate>({
    id: seed.id,
    slug: seed.slug,
    name: seed.name,
    bgg_id: seed.bgg_id,
    signature: seed.signature,
    cover_status: seed.cover_status,
    scores: seed.scores,
  });
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Fetch candidates whenever the anchor changes.
  useEffect(() => {
    let cancelled = false;
    async function fetchSimilar() {
      setLoading(true);
      setErr(null);
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.rpc("similar_games", {
          anchor_id: state.a,
          k: 50,
        });
        if (cancelled) return;
        if (error) {
          setErr(error.message);
          setCandidates([]);
          return;
        }
        const rows = (data ?? []) as unknown as CandidateRow[];
        const next = rows.flatMap((r) => {
          const c = toCandidate(r);
          return c ? [c] : [];
        });
        setCandidates(next);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchSimilar();
    return () => {
      cancelled = true;
    };
  }, [state.a]);

  // If the anchor in URL state ever drifts from anchorGame (e.g., user
  // pinned a similar row and we re-anchored), keep them in sync.
  useEffect(() => {
    if (state.a === anchorGame.id) return;
    const next = candidates.find((c) => c.id === state.a);
    if (next) setAnchorGame(next);
  }, [state.a, anchorGame.id, candidates]);

  const gameB = useMemo<Candidate | null>(() => {
    if (!state.b) return null;
    return candidates.find((c) => c.id === state.b) ?? null;
  }, [state.b, candidates]);

  // Client-side re-rank under the active lens. Sub-5ms for 50 candidates
  // — no need to memo deeper than this.
  const ranked = useMemo(() => {
    if (candidates.length === 0) return [];
    return rankBySimilarity(anchorGame, candidates, state.lens).slice(0, 12);
  }, [candidates, anchorGame, state.lens]);

  function setLens(lens: LensKey) {
    router.replace(
      `${pathname}${serializeLensState({ ...state, lens })}`,
      { scroll: false },
    );
  }
  function pinB(id: string | null) {
    router.replace(
      `${pathname}${serializeLensState({ ...state, b: id })}`,
      { scroll: false },
    );
  }
  function reanchor(id: string) {
    // Promote a similar row to anchor A. Clear B because the basis changed.
    router.replace(
      `${pathname}${serializeLensState({ a: id, b: null, lens: state.lens })}`,
      { scroll: false },
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr_320px] items-start">
      {/* Left rail — Game A / B cards */}
      <div className="flex flex-col gap-4">
        <PickerCard side="A" game={anchorGame} />
        <PickerCard side="B" game={gameB} onClear={() => pinB(null)} />
      </div>

      {/* Center — Radar + lens + axis diff */}
      <div className="flex flex-col gap-6">
        <div className="flex justify-center">
          <Radar
            size={360}
            values={anchorGame.scores}
            valuesB={gameB?.scores}
          />
        </div>
        <div className="flex flex-col items-center gap-2">
          <Stamp color="muted">lens</Stamp>
          <LensChips active={state.lens} onChange={setLens} />
          <p
            className="font-cs-display italic text-cs-ink/70 text-center mt-1 max-w-md"
            style={{ fontSize: 13 }}
          >
            {LENSES[state.lens].blurb}
          </p>
        </div>
        {gameB && (
          <section className="mt-2">
            <Stamp color="muted">what differs most</Stamp>
            <div className="mt-3">
              <AxisDiff a={anchorGame.scores} b={gameB.scores} />
            </div>
          </section>
        )}
      </div>

      {/* Right rail — Similar list */}
      <aside
        className="bg-cs-paper-warm rounded-lg overflow-hidden"
        style={{ boxShadow: "inset 0 0 0 1px rgba(28,26,20,0.08)" }}
      >
        <header className="flex items-baseline justify-between p-4">
          <Stamp color="muted">similar via {LENSES[state.lens].label.toLowerCase()}</Stamp>
          {loading && <Stamp color="muted-soft" size={9}>loading…</Stamp>}
        </header>
        {err && (
          <p
            role="alert"
            className="font-cs-mono px-4 pb-3"
            style={{
              fontSize: 11,
              color: "var(--cs-negative)",
              letterSpacing: "0.06em",
            }}
          >
            {err}
          </p>
        )}
        <ul style={{ borderTop: "1px solid rgba(28,26,20,0.08)" }}>
          {ranked.map((r, i) => (
            <SimilarRow
              key={r.game.id}
              rank={i + 1}
              name={r.game.name}
              signature={r.game.signature}
              sim={r.sim}
              pinned={r.game.id === state.b}
              onClick={() =>
                state.b === r.game.id ? reanchor(r.game.id) : pinB(r.game.id)
              }
            />
          ))}
          {!loading && ranked.length === 0 && (
            <li className="p-4">
              <Stamp color="muted">no neighbors</Stamp>
            </li>
          )}
        </ul>
      </aside>
    </div>
  );
}
