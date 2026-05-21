import type { ScoreVector } from "@/lib/scoring";

export interface PlayerCount {
  best: string[];   // e.g. ["3P", "4P"]
  good: string[];   // e.g. ["2P", "5P"]
  bad: string[];    // e.g. ["1P"]
}

export interface Game {
  id: string;
  slug: string;           // URL-friendly, used for /games/[slug]
  name: string;
  bggId?: number;         // BGG numeric id when known
  scores: ScoreVector;
  /** Meta-axes not part of the 12 scored axes */
  solo: number;     // 0-10
  fiddly: number;   // 0-10
  playerCount?: PlayerCount;
  /** Short signature line shown on comparator cards. */
  signature?: string;
  /** Designer/publisher/year for SEO meta. */
  designer?: string;
  publisher?: string;
  year?: number;
  /** Long-form prose for the SEO game page. Filled in later. */
  description?: string;
}

export interface BggRefItem {
  rank: number;
  bggId: number;
  name: string;
  /** Manual mapping to our catalog game id, or null if not in catalog. */
  ourId: string | null;
  note?: string;
}

export interface BggRef {
  /** Anchor game id (matches Game.id). */
  anchorId: string;
  bggId: number;
  fetchedAt: string;  // ISO date
  source: string;     // e.g. "recommend.games"
  cfQuality?: "clean" | "noisy";
  cfNote?: string;
  list: BggRefItem[];
}
