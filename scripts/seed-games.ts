/**
 * Seed the games table from the canonical TypeScript catalog.
 *
 * Idempotent: upserts by id. Safe to run repeatedly.
 *
 * Usage:
 *   pnpm seed:games
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { GAMES } from "../src/data/games";

config({ path: ".env.local" });

function envOrThrow(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`✗ Missing env var ${name}.`);
    console.error("  Make sure .env.local exists with NEXT_PUBLIC_SUPABASE_URL");
    console.error("  and SUPABASE_SERVICE_ROLE_KEY filled in.");
    process.exit(1);
  }
  return v;
}

async function main() {
  const url = envOrThrow("NEXT_PUBLIC_SUPABASE_URL");
  const key = envOrThrow("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`→ Seeding ${GAMES.length} games into ${url}…`);

  const rows = GAMES.map((g) => ({
    id: g.id,
    slug: g.slug,
    name: g.name,
    bgg_id: g.bggId ?? null,
    scores: g.scores,
    solo: g.solo,
    fiddly: g.fiddly,
    player_count: g.playerCount ?? null,
    signature: g.signature ?? null,
    description: g.description ?? null,
  }));

  const { error, count } = await supabase
    .from("games")
    .upsert(rows, { onConflict: "id", count: "exact" });

  if (error) {
    console.error("✗ Seed failed:", error.message);
    process.exit(1);
  }

  console.log(`✓ Upserted ${count ?? rows.length} game rows.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
