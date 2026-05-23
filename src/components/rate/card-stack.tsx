"use client";

/**
 * The rate-flow card stack. Renders the next unrated game's cover, title,
 * signature, and the five rating tiles. Hotkeys map to ratings without
 * leaving the home row:
 *
 *   F=5 · D=4 · S=3 · A=2 · Q=1 · N=not played · →=skip · Space=details
 *
 * Persisting:
 *   - Rating: optimistic — drop the card from the queue, write in the
 *     background. On error, requeue (rare; collection_items.user_rating
 *     accepts 1–5 by check constraint).
 *   - Not played: set user_rating=null (already null) but also write a
 *     marker into `notes` so we don't loop forever; we treat any notes
 *     row as out-of-rotation in a future query.
 *   - Skip: dequeue locally only — no DB write, so it'll come back.
 */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Btn, Stamp, BoxCover } from "@/components/ui";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  computeBranchImpact,
  type RatedSample,
} from "@/lib/rate/branch-impact";
import type { RateQueueItem } from "@/lib/rate/queries";
import { buildCoverUrl } from "@/lib/shelf/covers";
import { BranchImpactChips } from "./branch-impact";
import { RatingStamps } from "./rating-stamps";

interface Props {
  initialQueue: RateQueueItem[];
  initialHistory: RatedSample[];
}

type Rating = 1 | 2 | 3 | 4 | 5;

export function CardStack({ initialQueue, initialHistory }: Props) {
  const [queue, setQueue] = useState<RateQueueItem[]>(initialQueue);
  const [history, setHistory] = useState<RatedSample[]>(initialHistory);
  const [preview, setPreview] = useState<Rating | null>(null);
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const current = queue[0];

  const deltas = useMemo(() => {
    if (!current || preview == null) return null;
    return computeBranchImpact(history, {
      scores: current.game.scores,
      rating: preview,
    });
  }, [current, preview, history]);

  async function submitRating(rating: Rating) {
    if (!current || pending) return;
    setErr(null);
    const item = current;
    // Optimistic dequeue + history update.
    setQueue((q) => q.slice(1));
    setHistory((h) => [...h, { rating, scores: item.game.scores }]);
    setPending(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("collection_items")
        .update({ user_rating: rating })
        .eq("id", item.id);
      if (error) {
        // Roll back optimistic UI.
        setQueue((q) => [item, ...q]);
        setHistory((h) => h.slice(0, -1));
        setErr(error.message);
      }
    } finally {
      setPending(false);
      setPreview(null);
    }
  }

  async function markNotPlayed() {
    if (!current || pending) return;
    const item = current;
    setQueue((q) => q.slice(1));
    setPending(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("collection_items")
        .update({ notes: "not-played" })
        .eq("id", item.id);
      if (error) {
        setQueue((q) => [item, ...q]);
        setErr(error.message);
      }
    } finally {
      setPending(false);
    }
  }

  function skip() {
    if (!current) return;
    setQueue((q) => q.slice(1));
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!current || pending) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
      ) {
        return;
      }
      const map: Record<string, Rating> = {
        f: 5,
        d: 4,
        s: 3,
        a: 2,
        q: 1,
      };
      const k = e.key.toLowerCase();
      if (map[k]) {
        e.preventDefault();
        submitRating(map[k]);
      } else if (k === "n") {
        e.preventDefault();
        markNotPlayed();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        skip();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, pending]);

  if (!current) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <Stamp color="muted">all caught up</Stamp>
        <p
          className="font-cs-display italic text-cs-ink/70"
          style={{ fontSize: 18, maxWidth: 420 }}
        >
          You&apos;ve rated everything in your queue. Add more from the
          catalog or import from BGG to keep going.
        </p>
        <Link
          href="/shelf"
          className="font-cs-mono uppercase text-cs-ink"
          style={{ fontSize: 11, letterSpacing: "0.18em", borderBottom: "1px dotted rgba(28,26,20,0.4)" }}
        >
          ← back to shelf
        </Link>
      </div>
    );
  }

  const coverUrl = buildCoverUrl(
    {
      id: current.game.id,
      bgg_id: current.game.bgg_id,
      cover_status: current.game.cover_status,
    },
    "hero",
  );

  return (
    <div className="grid gap-8 md:grid-cols-[260px_1fr] items-start">
      <div>
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt={current.game.name}
            className="block w-full aspect-[3/4] object-cover rounded-md"
          />
        ) : (
          <BoxCover title={current.game.name} height={340} />
        )}
      </div>
      <div className="flex flex-col gap-5">
        <div>
          <Stamp color="muted">rate</Stamp>
          <h2
            className="font-cs-display text-cs-ink mt-1"
            style={{
              fontSize: 36,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
            }}
          >
            {current.game.name}
          </h2>
          {current.game.signature && (
            <p
              className="font-cs-display italic text-cs-ink/70 mt-2"
              style={{ fontSize: 15 }}
            >
              {current.game.signature}
            </p>
          )}
        </div>

        <BranchImpactChips deltas={deltas} />

        <div
          onMouseLeave={() => setPreview(null)}
          // Hover/focus inside the tile group seeds the preview. We bind on
          // pointer events at the wrapper level so each tile can stay
          // unaware of preview state.
          onPointerMove={(e) => {
            const target = e.target as HTMLElement | null;
            const btn = target?.closest<HTMLElement>("button[data-rating]");
            if (btn) {
              const r = Number(btn.dataset.rating) as Rating;
              setPreview(r);
            }
          }}
        >
          <RatingStamps onPick={submitRating} disabled={pending} />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Btn tone="ghost" size="sm" onClick={markNotPlayed} disabled={pending}>
            N · Not played
          </Btn>
          <Btn tone="ghost" size="sm" onClick={skip} disabled={pending}>
            → Skip for now
          </Btn>
          <Link
            href={`/games/${current.game.slug}`}
            className="font-cs-mono uppercase text-cs-muted hover:text-cs-ink"
            style={{ fontSize: 10, letterSpacing: "0.18em" }}
          >
            Space · Details
          </Link>
          <span className="ml-auto">
            <Stamp color="muted" size={9}>
              {queue.length - 1} left in queue
            </Stamp>
          </span>
        </div>

        {err && (
          <p
            role="alert"
            className="font-cs-mono"
            style={{
              fontSize: 11,
              letterSpacing: "0.06em",
              color: "var(--cs-negative)",
            }}
          >
            {err}
          </p>
        )}
      </div>
    </div>
  );
}
