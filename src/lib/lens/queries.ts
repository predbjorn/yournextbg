/**
 * Server-side seed loader for the Lens page.
 *
 * Initial anchor priority:
 *   1. The user's most recently added ★5 game.
 *   2. The most recently added rated game.
 *   3. A catalog default (Brass: Birmingham — well-known and central).
 *   4. Whatever the catalog gives us first.
 */

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { ScoreVector } from "@/lib/scoring";

export interface LensSeedGame {
  id: string;
  slug: string;
  name: string;
  bgg_id: number | null;
  scores: ScoreVector;
  signature: string | null;
  cover_status: "pending" | "ready" | "failed" | "manual";
}

interface RawSeed {
  game:
    | {
        id: string;
        slug: string;
        name: string;
        bgg_id: number | null;
        scores: unknown;
        signature: string | null;
        cover_status: string;
        score_status: string;
      }
    | {
        id: string;
        slug: string;
        name: string;
        bgg_id: number | null;
        scores: unknown;
        signature: string | null;
        cover_status: string;
        score_status: string;
      }[]
    | null;
}

function pickOne<T>(v: T | T[] | null): T | null {
  if (v == null) return null;
  if (Array.isArray(v)) return v[0] ?? null;
  return v;
}

function toSeed(g: {
  id: string;
  slug: string;
  name: string;
  bgg_id: number | null;
  scores: unknown;
  signature: string | null;
  cover_status: string;
}): LensSeedGame | null {
  if (!Array.isArray(g.scores) || g.scores.length !== 12) return null;
  return {
    id: g.id,
    slug: g.slug,
    name: g.name,
    bgg_id: g.bgg_id,
    signature: g.signature,
    cover_status: g.cover_status as LensSeedGame["cover_status"],
    scores: g.scores as unknown as ScoreVector,
  };
}

export async function getLensSeed(userId: string | null): Promise<LensSeedGame> {
  const supabase = await getSupabaseServerClient();

  if (userId) {
    const { data } = await supabase
      .from("collection_items")
      .select(
        `
          user_rating,
          added_at,
          game:games!inner(
            id, slug, name, bgg_id, scores, signature, cover_status, score_status
          )
        `,
      )
      .not("user_rating", "is", null)
      .order("user_rating", { ascending: false })
      .order("added_at", { ascending: false })
      .limit(5);
    const rows = (data ?? []) as unknown as RawSeed[];
    for (const row of rows) {
      const g = pickOne(row.game);
      if (g && g.score_status === "editorial") {
        const seed = toSeed(g);
        if (seed) return seed;
      }
    }
  }

  // Catalog default: Brass: Birmingham — broad central baseline.
  const { data: brass } = await supabase
    .from("games")
    .select("id, slug, name, bgg_id, scores, signature, cover_status, score_status")
    .eq("id", "brass-birmingham")
    .maybeSingle();
  if (brass) {
    const seed = toSeed(brass);
    if (seed) return seed;
  }

  // Fallback: any editorial game.
  const { data: anyGame, error } = await supabase
    .from("games")
    .select("id, slug, name, bgg_id, scores, signature, cover_status, score_status")
    .eq("score_status", "editorial")
    .limit(1)
    .single();
  if (error || !anyGame) {
    throw new Error("No editorial games in the catalog to seed the lens.");
  }
  const seed = toSeed(anyGame);
  if (!seed) throw new Error("Seed game has malformed scores.");
  return seed;
}
