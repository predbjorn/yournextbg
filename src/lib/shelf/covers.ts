/**
 * Pure URL builder for the public covers bucket — safe to import from both
 * server and client components. Lives in its own file so importing it from
 * a client component doesn't drag `next/headers` into the bundle through
 * `@/lib/shelf/queries`.
 */

import type { CoverStatus } from "@/lib/supabase/types";

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
