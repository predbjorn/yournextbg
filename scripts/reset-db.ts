/**
 * Reset the Supabase database: drop all app tables + enums, then re-apply
 * the initial schema migration. Destructive — only intended while the
 * project is pre-launch.
 *
 * Requires DATABASE_URL in .env.local (the Supabase Postgres connection
 * string from Project Settings → Database → Connection string → URI).
 *
 * Usage:
 *   pnpm reset:db
 */

import { config } from "dotenv";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Client } from "pg";

config({ path: ".env.local" });

const MIGRATION_PATH = "supabase/migrations/0000_initial_schema.sql";

const DROP_SQL = `
drop table if exists public.collection_items cascade;
drop table if exists public.collections cascade;
drop table if exists public.games cascade;
drop table if exists public.bgg_cache cascade;
drop type if exists collection_kind;
`;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("✗ Missing DATABASE_URL in .env.local.");
    console.error("  Get it from Supabase dashboard → Project Settings → Database → Connection string (URI).");
    process.exit(1);
  }

  const client = new Client({ connectionString: url });
  await client.connect();
  console.log("→ Connected to Postgres.");

  try {
    console.log("→ Dropping existing tables…");
    await client.query(DROP_SQL);

    const schemaPath = resolve(process.cwd(), MIGRATION_PATH);
    console.log(`→ Applying ${MIGRATION_PATH}…`);
    const sql = await readFile(schemaPath, "utf8");
    await client.query(sql);

    console.log("✓ Schema reset complete.");
  } finally {
    await client.end();
  }
}

main().catch((err: unknown) => {
  console.error("✗ Reset failed:", err);
  process.exit(1);
});
