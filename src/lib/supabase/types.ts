/**
 * Database schema types — hand-authored for V1 to match the SQL migration
 * in /supabase/migrations/. Once the schema stabilizes, regenerate via:
 *
 *   pnpm dlx supabase gen types typescript --project-id gkickjaihbgapowsqwhx > src/lib/supabase/database.types.ts
 *
 * and replace this with the generated file.
 */

import type { ScoreVector } from "@/lib/scoring";
import type { PlayerCount } from "@/data/types";

export type CoverStatus = "pending" | "ready" | "failed" | "manual";
export type ScoreStatus = "editorial" | "unscored";

export interface DbGame {
  id: string;
  slug: string;
  name: string;
  bgg_id: number | null;
  scores: ScoreVector | null;
  solo: number;
  fiddly: number;
  player_count: PlayerCount | null;
  signature: string | null;
  description: string | null;
  cover_origin_url: string | null;
  cover_status: CoverStatus;
  score_status: ScoreStatus;
  created_at: string;
  updated_at: string;
}

export type CollectionKind = "owned" | "wishlist" | "played" | "custom";
export type CollectionItemSource = "manual" | "bgg";

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
  source: CollectionItemSource;
  added_at: string;
}

export interface DbBggCache {
  bgg_id: number;
  payload: unknown;
  fetched_at: string;
}

/**
 * @supabase/postgrest-js v2 enforces `GenericTable`: each table must declare
 * `Row`, `Insert`, `Update` (all `Record<string, unknown>`) and `Relationships:
 * GenericRelationship[]`. Mapped types like `Partial<T>` don't structurally
 * extend `Record<string, unknown>` in strict mode, which silently resolves
 * builder generics to `never`. We intersect with `Record<string, unknown>` to
 * satisfy the constraint without giving up the strong row type for reads.
 */
type Idx = Record<string, unknown>;
type DbTable<Row, Insert = Row> = {
  Row: Row & Idx;
  Insert: Insert & Idx;
  Update: Partial<Row> & Idx;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      games: DbTable<
        DbGame,
        Omit<DbGame, "created_at" | "updated_at"> &
          Partial<Pick<DbGame, "cover_status" | "score_status" | "cover_origin_url">>
      >;
      collections: DbTable<DbCollection, Omit<DbCollection, "id" | "created_at">>;
      collection_items: DbTable<
        DbCollectionItem,
        Pick<DbCollectionItem, "collection_id"> &
          Partial<
            Pick<
              DbCollectionItem,
              | "game_id"
              | "bgg_id"
              | "manual_name"
              | "notes"
              | "user_rating"
              | "source"
            >
          >
      >;
      bgg_cache: DbTable<DbBggCache, DbBggCache>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
