/**
 * Quick health check against Supabase. Verifies env, anon access, and
 * service-role access. Run after setting up .env.local:
 *
 *   pnpm supabase:health
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const sr = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log("ENV CHECK");
  console.log("  NEXT_PUBLIC_SUPABASE_URL       :", url ? "✓" : "✗ MISSING");
  console.log("  NEXT_PUBLIC_SUPABASE_ANON_KEY  :", anon ? "✓ (" + anon.slice(0, 12) + "…)" : "✗ MISSING");
  console.log("  SUPABASE_SERVICE_ROLE_KEY      :", sr ? "✓ (" + sr.slice(0, 12) + "…)" : "✗ MISSING");

  if (!url || !anon) {
    console.error("\nMissing required env vars. Update .env.local.");
    process.exit(1);
  }

  console.log("\nANON CLIENT");
  const anonClient = createClient(url, anon);
  const { count, error: anonErr } = await anonClient
    .from("games")
    .select("*", { count: "exact", head: true });

  if (anonErr) {
    console.log("  ✗ Anon read failed:", anonErr.message);
    if (anonErr.message.includes("relation") && anonErr.message.includes("does not exist")) {
      console.log("    → Migration has not been applied yet.");
      console.log("    → Run the SQL in supabase/migrations/0000_initial_schema.sql");
      console.log("    → via the Supabase dashboard SQL editor.");
    }
  } else {
    console.log(`  ✓ Anon can read games (count = ${count ?? 0})`);
  }

  if (sr) {
    console.log("\nSERVICE-ROLE CLIENT");
    const sr_client = createClient(url, sr, { auth: { persistSession: false } });
    const { error: srErr } = await sr_client.from("games").select("id", { head: true });
    if (srErr) {
      console.log("  ✗ Service-role read failed:", srErr.message);
    } else {
      console.log("  ✓ Service-role can read games");
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
