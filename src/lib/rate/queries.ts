/**
 * Server-side queue loader for the rate flow.
 *
 * The queue is the next N unrated items the user has on their shelf that
 * we can actually rate — that means a backing `games` row with scores
 * (`score_status = 'editorial'`). BGG placeholders are not in the queue:
 * we can't show branch-impact for them.
 */

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { ScoreVector } from "@/lib/scoring";
import type { CoverStatus } from "@/lib/supabase/types";

export interface RateGame {
  id: string;
  slug: string;
  name: string;
  bgg_id: number | null;
  scores: ScoreVector;
  signature: string | null;
  cover_status: CoverStatus;
}

export interface RateQueueItem {
  id: string;
  game: RateGame;
}

interface Raw {
  id: string;
  game:
    | (Omit<RateGame, "scores"> & { scores: unknown })
    | (Omit<RateGame, "scores"> & { scores: unknown })[]
    | null;
}

function pickOne<T>(v: T | T[] | null): T | null {
  if (v == null) return null;
  if (Array.isArray(v)) return v[0] ?? null;
  return v;
}

export async function getRateQueue(limit = 50): Promise<RateQueueItem[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("collection_items")
    .select(
      `
        id,
        game:games!inner(
          id, slug, name, bgg_id, scores, signature, cover_status, score_status
        )
      `,
    )
    .is("user_rating", null)
    .limit(limit);
  if (error) throw error;

  const rows = (data ?? []) as unknown as Raw[];
  return rows.flatMap((row) => {
    const g = pickOne(row.game);
    if (!g) return [];
    if (!Array.isArray(g.scores) || g.scores.length !== 12) return [];
    const scores = g.scores as unknown as ScoreVector;
    return [
      {
        id: row.id,
        game: {
          id: g.id,
          slug: g.slug,
          name: g.name,
          bgg_id: g.bgg_id,
          signature: g.signature,
          cover_status: g.cover_status,
          scores,
        },
      },
    ];
  });
}

/**
 * Pull the user's already-rated games so the rate flow can compute a
 * running branch-impact preview. We need the score vector + the rating
 * to weight averages.
 */
export interface RatedRow {
  rating: number;
  scores: ScoreVector;
}

export async function getRatedHistory(): Promise<RatedRow[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("collection_items")
    .select(
      `
        user_rating,
        game:games!inner(scores, score_status)
      `,
    )
    .not("user_rating", "is", null);
  if (error) throw error;

  type Raw = {
    user_rating: number | null;
    game: { scores: unknown; score_status: string } | { scores: unknown; score_status: string }[] | null;
  };
  const rows = (data ?? []) as unknown as Raw[];
  return rows.flatMap((row) => {
    const g = pickOne(row.game);
    if (!g) return [];
    if (g.score_status !== "editorial") return [];
    if (!Array.isArray(g.scores) || g.scores.length !== 12) return [];
    if (row.user_rating == null) return [];
    return [
      { rating: row.user_rating, scores: g.scores as unknown as ScoreVector },
    ];
  });
}
