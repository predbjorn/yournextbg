/**
 * Backfill covers for existing catalog rows.
 *
 * Iterates `games` rows with `cover_status='pending'` and a non-null
 * `cover_origin_url`, then calls the `resize-cover` edge function for each.
 * Idempotent and gentle on the source origin (400ms between calls).
 *
 * Usage:
 *   pnpm backfill:covers
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

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

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: games, error } = await admin
    .from("games")
    .select("id")
    .eq("cover_status", "pending")
    .not("cover_origin_url", "is", null);

  if (error) throw error;
  console.log(`Backfilling ${games?.length ?? 0} covers…`);

  for (const g of games ?? []) {
    const res = await fetch(`${url}/functions/v1/resize-cover`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ game_id: g.id }),
    });
    console.log(`  ${g.id}: ${res.status}`);
    await new Promise((r) => setTimeout(r, 400)); // gentle on source origin + edge fn
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
