/**
 * Database schema types — hand-authored for V1 to match the SQL migration
 * in /supabase/migrations/. Once the schema stabilizes, regenerate via:
 *
 *   pnpm dlx supabase gen types typescript --project-id gkickjaihbgapowsqwhx > src/lib/supabase/database.types.ts
 *
 * and replace this with the generated file.
 */

import type { ScoreVector } from "@/lib/scoring";
import type { Category, PlayerCount } from "@/data/types";

export interface DbGame {
  id: string;
  slug: string;
  name: string;
  category: Category;
  category_label: string;
  bgg_id: number | null;
  scores: ScoreVector;
  solo: number;
  fiddly: number;
  player_count: PlayerCount | null;
  signature: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export type CollectionKind = "owned" | "wishlist" | "played" | "custom";

export interface DbCollection {
  id: string;
  user_id: string;
  name: string;
  kind: CollectionKind;
  created_at: string;
}

export interface DbCollectionItem {
  id: string;
  collection_id: string;
  game_id: string | null;       // FK to games.id if scored in our catalog
  bgg_id: number | null;        // BGG ID if not yet scored
  manual_name: string | null;   // free-form name if neither id nor BGG available
  notes: string | null;
  user_rating: number | null;
  added_at: string;
}

export interface DbBggCache {
  bgg_id: number;
  payload: unknown;
  fetched_at: string;
}

export interface Database {
  public: {
    Tables: {
      games:            { Row: DbGame;           Insert: Omit<DbGame, "created_at" | "updated_at">;           Update: Partial<DbGame> };
      collections:      { Row: DbCollection;     Insert: Omit<DbCollection, "id" | "created_at">;             Update: Partial<DbCollection> };
      collection_items: { Row: DbCollectionItem; Insert: Omit<DbCollectionItem, "id" | "added_at">;           Update: Partial<DbCollectionItem> };
      bgg_cache:        { Row: DbBggCache;       Insert: DbBggCache;                                          Update: Partial<DbBggCache> };
    };
  };
}
