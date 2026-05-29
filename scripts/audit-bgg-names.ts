/**
 * Audit catalog rows by comparing BGG's primary <name> against our `name`.
 *
 * Hydrate-bgg accepts any bggId that returns a boardgame; a wrong-but-valid
 * id (e.g. Trickerion → KLASK) hydrates with the WRONG cover and we never
 * notice. This script flags every row where BGG's primary name doesn't
 * obviously match our catalog name, so we can fix the bggId.
 *
 * Heuristic: lowercase, strip punctuation/diacritics, and check for substring
 * containment in either direction. Anything that fails is reported.
 *
 * Usage:
 *   pnpm bgg:audit-names
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const BGG_BASE = "https://boardgamegeek.com/xmlapi2";
const POLITE_DELAY_MS = 1200;

function envOrThrow(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`✗ Missing env var ${name}.`);
    process.exit(1);
  }
  return v;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .replace(/[^\p{L}\p{N} ]+/gu, " ") // strip punctuation
    .replace(/\s+/g, " ")
    .trim();
}

function matches(catalog: string, bgg: string): boolean {
  const a = normalize(catalog);
  const b = normalize(bgg);
  if (!a || !b) return false;
  if (a === b) return true;
  // Allow either side to be a prefix/substring of the other (handles things
  // like "Catan" vs "Catan: Trade, Build, Settle" or "TFM: Ares Expedition"
  // vs "Terraforming Mars: Ares Expedition").
  return a.includes(b) || b.includes(a);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchBggName(bggId: number, apiKey: string, ua: string): Promise<string | null> {
  const url = `${BGG_BASE}/thing?id=${bggId}`;
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, {
      headers: { "User-Agent": ua, Authorization: `Bearer ${apiKey}` },
    });
    if (res.status === 200) {
      const xml = await res.text();
      const m = xml.match(/<name[^>]*\btype="primary"[^>]*\bvalue="([^"]+)"/i);
      return m ? m[1]!.replace(/&#0?39;/g, "'").replace(/&amp;/g, "&") : null;
    }
    if (res.status === 202) {
      await sleep(1500 * (attempt + 1));
      continue;
    }
    if (res.status === 429) {
      const ra = res.headers.get("Retry-After");
      const waitSec = ra ? Math.min(parseInt(ra, 10) || 60, 300) : 60;
      console.log(`\n  ⚠ 429, waiting ${waitSec}s …`);
      await sleep(waitSec * 1000);
      continue;
    }
    return null;
  }
  return null;
}

async function main() {
  const url = envOrThrow("NEXT_PUBLIC_SUPABASE_URL");
  const key = envOrThrow("SUPABASE_SERVICE_ROLE_KEY");
  const apiKey = envOrThrow("BGG_API_KEY");
  const ua = process.env.BGG_USER_AGENT ?? "yournextbg/0.1 (+https://yournextbg.com)";

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: games, error } = await admin
    .from("games")
    .select("id, name, bgg_id")
    .not("bgg_id", "is", null)
    .order("id");
  if (error) throw error;

  console.log(`→ Auditing ${games?.length ?? 0} hydrated rows…\n`);
  const mismatches: Array<{ id: string; bggId: number; ours: string; bgg: string }> = [];
  const unknown: Array<{ id: string; bggId: number }> = [];

  for (const [i, g] of (games ?? []).entries()) {
    const bggId = g.bgg_id as number;
    process.stdout.write(`[${i + 1}/${games!.length}] ${g.id} (bgg ${bggId}) … `);
    const bggName = await fetchBggName(bggId, apiKey, ua);
    if (!bggName) {
      console.log("(no name returned)");
      unknown.push({ id: g.id, bggId });
    } else if (matches(g.name, bggName)) {
      console.log("ok");
    } else {
      console.log(`MISMATCH — bgg="${bggName}"`);
      mismatches.push({ id: g.id, bggId, ours: g.name, bgg: bggName });
    }
    if (i < games!.length - 1) await sleep(POLITE_DELAY_MS);
  }

  console.log("\n─── Summary ────────────────────────");
  console.log(`Mismatches: ${mismatches.length}`);
  console.log(`Unknown (BGG returned no name): ${unknown.length}`);
  if (mismatches.length > 0) {
    console.log("\nMismatches:");
    for (const m of mismatches) {
      console.log(`  ${m.id.padEnd(35)} bgg=${m.bggId}  ours="${m.ours}"  bgg="${m.bgg}"`);
    }
  }
  if (unknown.length > 0) {
    console.log("\nUnknown:");
    for (const u of unknown) console.log(`  ${u.id.padEnd(35)} bgg=${u.bggId}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
