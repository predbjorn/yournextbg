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

export type ThemeChoice = "light" | "dark" | "auto";
export type DefaultLens = "standard" | "weight" | "feel" | "luck" | "equal";
export type UserTier = "free" | "pro";

export interface DbDismissal {
  user_id: string;
  game_id: string;
  dismissed_at: string;
}

export type BggSyncTrigger = "manual" | "cron";
export type BggSyncStatus = "running" | "ok" | "partial" | "failed";

export interface DbBggSyncLog {
  id: string;
  user_id: string;
  triggered_by: BggSyncTrigger;
  started_at: string;
  finished_at: string | null;
  owned_count: number | null;
  wishlist_count: number | null;
  new_unscored: number | null;
  status: BggSyncStatus;
  error: string | null;
}

export interface DbUserPrefs {
  user_id: string;
  theme: ThemeChoice;
  default_lens: DefaultLens;
  hide_owned: boolean;
  hide_dismissed: boolean;
  min_similarity: number;
  tier: UserTier;
  bgg_username: string | null;
  auto_sync_bgg: boolean;
  import_bgg_ratings: boolean;
  last_bgg_sync_at: string | null;
  created_at: string;
  updated_at: string;
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
      user_prefs: DbTable<
        DbUserPrefs,
        Pick<DbUserPrefs, "user_id"> &
          Partial<
            Omit<DbUserPrefs, "user_id" | "created_at" | "updated_at">
          >
      >;
      dismissals: DbTable<
        DbDismissal,
        Pick<DbDismissal, "user_id" | "game_id"> &
          Partial<Pick<DbDismissal, "dismissed_at">>
      >;
      bgg_sync_log: DbTable<DbBggSyncLog>;
    };
    Views: Record<string, never>;
    Functions: {
      similar_games: {
        Args: { anchor_id: string; k?: number };
        Returns: {
          id: string;
          slug: string;
          name: string;
          bgg_id: number | null;
          scores: ScoreVector | null;
          solo: number;
          fiddly: number;
          player_count: PlayerCount | null;
          signature: string | null;
          cover_status: CoverStatus;
          l2_distance: number;
        }[];
      };
      profile_candidates: {
        Args: { k?: number };
        Returns: {
          id: string;
          slug: string;
          name: string;
          bgg_id: number | null;
          scores: ScoreVector | null;
          solo: number;
          fiddly: number;
          player_count: PlayerCount | null;
          signature: string | null;
          cover_status: CoverStatus;
          centroid_distance: number;
          nearest_anchor_id: string | null;
          nearest_anchor_name: string | null;
          nearest_anchor_rating: number | null;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
