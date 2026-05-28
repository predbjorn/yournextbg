/**
 * Hydrate catalog games with BGG XML API data.
 *
 * For every games row with a non-null bgg_id and a null cover_origin_url,
 * fetch `xmlapi2/thing?id={bgg_id}&stats=1` and write back the cover image
 * URL. Optionally emits a CSV diff of our `weight` axis vs BGG's
 * averageweight as an editorial sanity check.
 *
 * Idempotent — re-running will skip rows that already have cover_origin_url
 * unless --force is passed.
 *
 * Usage:
 *   pnpm bgg:hydrate                    # do the work
 *   pnpm bgg:hydrate -- --dry-run       # just print what would change
 *   pnpm bgg:hydrate -- --force         # re-fetch even if cover_origin_url set
 *   pnpm bgg:hydrate -- --weight-report # also write tmp/bgg-weight-diff.csv
 *   pnpm bgg:hydrate -- --limit=10      # cap to N rows (handy for smoke-tests)
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

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

interface CliFlags {
  dryRun: boolean;
  force: boolean;
  weightReport: boolean;
  limit: number | null;
}

function parseFlags(argv: string[]): CliFlags {
  const flags: CliFlags = { dryRun: false, force: false, weightReport: false, limit: null };
  for (const a of argv) {
    if (a === "--dry-run") flags.dryRun = true;
    else if (a === "--force") flags.force = true;
    else if (a === "--weight-report") flags.weightReport = true;
    else if (a.startsWith("--limit=")) flags.limit = parseInt(a.split("=")[1]!, 10);
  }
  return flags;
}

interface BggThing {
  bggId: number;
  image: string | null;
  thumbnail: string | null;
  yearPublished: number | null;
  averageWeight: number | null;
}

function attrValue(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}\\b[^>]*\\bvalue="([^"]*)"`, "i");
  const m = xml.match(re);
  return m ? m[1]! : null;
}

function textValue(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i");
  const m = xml.match(re);
  if (!m) return null;
  const raw = m[1]!.trim();
  const cdata = raw.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  return cdata ? cdata[1]! : raw;
}

function parseThing(xml: string, bggId: number): BggThing {
  const image = textValue(xml, "image");
  const thumbnail = textValue(xml, "thumbnail");
  const year = attrValue(xml, "yearpublished");
  const weight = attrValue(xml, "averageweight");
  return {
    bggId,
    image: image && image.length > 0 ? image : null,
    thumbnail: thumbnail && thumbnail.length > 0 ? thumbnail : null,
    yearPublished: year ? parseInt(year, 10) : null,
    averageWeight: weight ? parseFloat(weight) : null,
  };
}

async function fetchThing(bggId: number, apiKey: string, userAgent: string): Promise<BggThing> {
  const url = `${BGG_BASE}/thing?id=${bggId}&stats=1`;
  const headers: HeadersInit = {
    "User-Agent": userAgent,
    Authorization: `Bearer ${apiKey}`,
  };
  // BGG returns 202 while warming, and 429 once we trip the rate limit.
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url, { headers });
    if (res.status === 200) {
      const xml = await res.text();
      return parseThing(xml, bggId);
    }
    if (res.status === 202) {
      await sleep(1500 * (attempt + 1));
      continue;
    }
    if (res.status === 429) {
      const ra = res.headers.get("Retry-After");
      const waitSec = ra ? Math.min(parseInt(ra, 10) || 60, 300) : Math.min(30 + attempt * 30, 180);
      console.log(`\n  ⚠ 429 rate-limited, waiting ${waitSec}s …`);
      await sleep(waitSec * 1000);
      continue;
    }
    throw new Error(`BGG ${bggId}: HTTP ${res.status}`);
  }
  throw new Error(`BGG ${bggId}: still throttled/202 after retries`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const url = envOrThrow("NEXT_PUBLIC_SUPABASE_URL");
  const key = envOrThrow("SUPABASE_SERVICE_ROLE_KEY");
  const apiKey = envOrThrow("BGG_API_KEY");
  const userAgent = process.env.BGG_USER_AGENT ?? "yournextbg/0.1 (+https://yournextbg.com)";

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let query = admin
    .from("games")
    .select("id, slug, bgg_id, cover_origin_url, scores")
    .not("bgg_id", "is", null);
  if (!flags.force) query = query.is("cover_origin_url", null);
  if (flags.limit) query = query.limit(flags.limit);

  const { data: games, error } = await query;
  if (error) throw error;
  const todo = games ?? [];
  console.log(
    `→ Hydrating ${todo.length} games from BGG${flags.dryRun ? " (DRY RUN)" : ""}${
      flags.force ? " (FORCE)" : ""
    }.`,
  );
  if (todo.length === 0) return;

  const weightRows: Array<{
    slug: string;
    bgg_id: number;
    our_weight_0_10: number | null;
    bgg_weight_0_5: number | null;
    bgg_weight_rescaled_0_10: number | null;
    diff_abs: number | null;
  }> = [];

  let ok = 0;
  let skipped = 0;
  let failed = 0;
  for (const [i, g] of todo.entries()) {
    const bggId = g.bgg_id as number;
    process.stdout.write(`[${i + 1}/${todo.length}] ${g.slug} (bgg ${bggId}) … `);
    try {
      const thing = await fetchThing(bggId, apiKey, userAgent);
      const newCover = thing.image ?? thing.thumbnail;
      if (!newCover) {
        console.log("no image in response — skipped");
        skipped++;
      } else if (flags.dryRun) {
        console.log(`would set cover_origin_url=${newCover}`);
        ok++;
      } else {
        const { error: upErr } = await admin
          .from("games")
          .update({ cover_origin_url: newCover })
          .eq("id", g.id);
        if (upErr) throw upErr;
        console.log("ok");
        ok++;
      }

      if (flags.weightReport) {
        const ourScores = g.scores as number[] | null;
        const ourWeight = ourScores && ourScores.length > 0 ? ourScores[0] ?? null : null;
        const bggW = thing.averageWeight;
        const rescaled = bggW != null ? bggW * 2 : null;
        const diff = ourWeight != null && rescaled != null ? Math.abs(ourWeight - rescaled) : null;
        weightRows.push({
          slug: g.slug as string,
          bgg_id: bggId,
          our_weight_0_10: ourWeight,
          bgg_weight_0_5: bggW,
          bgg_weight_rescaled_0_10: rescaled,
          diff_abs: diff,
        });
      }
    } catch (err) {
      console.log(`FAILED: ${err instanceof Error ? err.message : String(err)}`);
      failed++;
    }
    if (i < todo.length - 1) await sleep(POLITE_DELAY_MS);
  }

  console.log(`\nDone. ok=${ok} skipped=${skipped} failed=${failed}`);

  if (flags.weightReport && weightRows.length > 0) {
    weightRows.sort((a, b) => (b.diff_abs ?? -1) - (a.diff_abs ?? -1));
    const csvPath = "tmp/bgg-weight-diff.csv";
    mkdirSync(dirname(csvPath), { recursive: true });
    const header = "slug,bgg_id,our_weight_0_10,bgg_weight_0_5,bgg_weight_rescaled_0_10,diff_abs\n";
    const body = weightRows
      .map((r) =>
        [r.slug, r.bgg_id, r.our_weight_0_10 ?? "", r.bgg_weight_0_5 ?? "", r.bgg_weight_rescaled_0_10 ?? "", r.diff_abs ?? ""].join(","),
      )
      .join("\n");
    writeFileSync(csvPath, header + body + "\n");
    console.log(`Weight diff report written to ${csvPath} (${weightRows.length} rows).`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
