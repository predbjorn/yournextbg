/**
 * Server-side shelf queries.
 *
 * The shelf is a denormalized view across the user's collections joined to
 * the catalog. We fetch *both* games-table-backed items (FK `game_id`) and
 * BGG-imported placeholders that don't yet have editorial scores. The UI
 * differentiates the two via `game.score_status`.
 */

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CollectionKind,
  CollectionItemSource,
  CoverStatus,
  ScoreStatus,
} from "@/lib/supabase/types";

/**
 * Just the bgg_username field — what the Shelf header needs to decide
 * whether to send the user to /profile#bgg first or hit the edge function
 * directly. Returns null when the user_prefs row doesn't exist yet (which
 * shouldn't happen post-signup, but defensive).
 */
export async function getBggUsername(): Promise<string | null> {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("user_prefs")
    .select("bgg_username")
    .maybeSingle();
  return data?.bgg_username ?? null;
}

export interface ShelfGameSummary {
  id: string;
  slug: string;
  name: string;
  bgg_id: number | null;
  signature: string | null;
  cover_status: CoverStatus;
  score_status: ScoreStatus;
}

export interface ShelfItem {
  id: string;
  user_rating: number | null;
  added_at: string;
  notes: string | null;
  source: CollectionItemSource;
  collection_kind: CollectionKind;
  /** Null when this is a placeholder BGG row not yet linked to a catalog row. */
  game: ShelfGameSummary | null;
  /** BGG id when the item is a bare placeholder (no game row yet). */
  bgg_id: number | null;
  /** Free-form name for manually-added items with no BGG id and no catalog row. */
  manual_name: string | null;
}

interface RawShelfRow {
  id: string;
  user_rating: number | null;
  added_at: string;
  notes: string | null;
  source: CollectionItemSource;
  bgg_id: number | null;
  manual_name: string | null;
  collections: { kind: CollectionKind } | { kind: CollectionKind }[] | null;
  game:
    | ShelfGameSummary
    | ShelfGameSummary[]
    | null;
}

function pickOne<T>(v: T | T[] | null): T | null {
  if (v == null) return null;
  if (Array.isArray(v)) return v[0] ?? null;
  return v;
}

export async function getShelf(): Promise<ShelfItem[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("collection_items")
    .select(
      `
        id,
        user_rating,
        added_at,
        notes,
        source,
        bgg_id,
        manual_name,
        collections!inner(kind),
        game:games(id, slug, name, bgg_id, signature, cover_status, score_status)
      `,
    )
    .order("added_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as unknown as RawShelfRow[];
  return rows.map((row) => {
    const collection = pickOne(row.collections);
    return {
      id: row.id,
      user_rating: row.user_rating,
      added_at: row.added_at,
      notes: row.notes,
      source: row.source,
      bgg_id: row.bgg_id,
      manual_name: row.manual_name,
      collection_kind: collection?.kind ?? "owned",
      game: pickOne(row.game),
    };
  });
}

/**
 * Deterministic public cover URL builder. No DB roundtrip required.
 *
 * The `resize-cover` edge function writes three sizes under
 * `${bgg_id | _local/${id}}/{thumb,card,hero}.webp`. The bucket is public.
 *
 * Returns null when the cover hasn't been generated yet — callers should
 * fall back to <BoxCover /> in that case.
 */
export function buildCoverUrl(
  game: { id: string; bgg_id: number | null; cover_status: CoverStatus },
  size: "thumb" | "card" | "hero",
): string | null {
  if (game.cover_status !== "ready" && game.cover_status !== "manual") {
    return null;
  }
  const base = game.bgg_id != null ? `${game.bgg_id}` : `_local/${game.id}`;
  const root = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!root) return null;
  return `${root}/storage/v1/object/public/covers/${base}/${size}.webp`;
}
