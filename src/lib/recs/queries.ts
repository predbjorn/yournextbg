/**
 * Server-side recommendations queries.
 *
 * `getProfileRecs` calls the `profile_candidates(k)` RPC, which builds a
 * weighted centroid in axis space (weight = rating - 3, so ★5→+2 …
 * ★1→-2) and returns the K games nearest to it under L2 distance, with
 * owned + dismissed already excluded. The reasoning line in the UI uses
 * `nearest_anchor_name` + `nearest_anchor_rating`.
 *
 * `getRatingsCount` is a small helper for the empty-state copy on the
 * recommendations page ("rate at least 5 games to unlock recommendations").
 */

import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface ProfileCandidate {
  id: string;
  slug: string;
  name: string;
  bgg_id: number | null;
  signature: string | null;
  cover_status: "pending" | "ready" | "failed" | "manual";
  centroid_distance: number;
  nearest_anchor_id: string | null;
  nearest_anchor_name: string | null;
  nearest_anchor_rating: number | null;
}

export async function getProfileRecs(k = 30): Promise<ProfileCandidate[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("profile_candidates", { k });
  if (error) throw error;
  // Trim to the shape our UI uses — the RPC returns the full game row but
  // the strip+card only need the listed fields.
  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    bgg_id: row.bgg_id,
    signature: row.signature,
    cover_status: row.cover_status as ProfileCandidate["cover_status"],
    centroid_distance: row.centroid_distance,
    nearest_anchor_id: row.nearest_anchor_id,
    nearest_anchor_name: row.nearest_anchor_name,
    nearest_anchor_rating: row.nearest_anchor_rating,
  }));
}

export async function getRatingsCount(): Promise<number> {
  const supabase = await getSupabaseServerClient();
  const { count, error } = await supabase
    .from("collection_items")
    .select("id", { head: true, count: "exact" })
    .not("user_rating", "is", null);
  if (error) throw error;
  return count ?? 0;
}
