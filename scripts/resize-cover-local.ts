/**
 * Local fallback for cover resize when the resize-cover edge function OOMs.
 *
 * BGG ships some covers as 15-20MP source images; imagescript inside the
 * 256MB edge worker can't handle them. This script downloads each pending
 * row's cover_origin_url, resizes via sharp, and uploads the 3 WebP
 * variants directly to the `covers` bucket. Functionally identical output
 * to resize-cover, just executed locally.
 *
 * Targets games with cover_status='pending' AND cover_origin_url IS NOT NULL.
 *
 * Usage:
 *   pnpm cover:resize-local
 *   pnpm cover:resize-local -- --slug=ark-nova    # single row
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

config({ path: ".env.local" });

const SIZES = { thumb: 80, card: 200, hero: 600 } as const;

function envOrThrow(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`✗ Missing env var ${name}.`);
    process.exit(1);
  }
  return v;
}

async function main() {
  const url = envOrThrow("NEXT_PUBLIC_SUPABASE_URL");
  const key = envOrThrow("SUPABASE_SERVICE_ROLE_KEY");

  const slugFlag = process.argv.find((a) => a.startsWith("--slug="))?.split("=")[1];

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let q = admin
    .from("games")
    .select("id, bgg_id, cover_origin_url")
    .eq("cover_status", "pending")
    .not("cover_origin_url", "is", null);
  if (slugFlag) q = q.eq("id", slugFlag);

  const { data: rows, error } = await q;
  if (error) throw error;
  console.log(`→ Resizing ${rows?.length ?? 0} covers locally…`);

  let ok = 0;
  let failed = 0;
  for (const g of rows ?? []) {
    process.stdout.write(`  ${g.id} … `);
    try {
      const res = await fetch(g.cover_origin_url as string, {
        headers: { "User-Agent": "yournextbg/1.0 (+https://yournextbg.com)" },
      });
      if (!res.ok) throw new Error(`source HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const base = g.bgg_id ? `${g.bgg_id}` : `_local/${g.id}`;

      for (const [variant, w] of Object.entries(SIZES) as [keyof typeof SIZES, number][]) {
        const webp = await sharp(buf, { failOn: "none" })
          .resize({ width: w, withoutEnlargement: false })
          .webp({ quality: 80 })
          .toBuffer();
        const { error: upErr } = await admin.storage
          .from("covers")
          .upload(`${base}/${variant}.webp`, webp, {
            contentType: "image/webp",
            upsert: true,
            cacheControl: "public, max-age=31536000, immutable",
          });
        if (upErr) throw upErr;
      }

      await admin.from("games").update({ cover_status: "ready" }).eq("id", g.id);
      console.log("ok");
      ok++;
    } catch (err) {
      console.log(`FAILED: ${err instanceof Error ? err.message : String(err)}`);
      failed++;
    }
  }
  console.log(`\nDone. ok=${ok} failed=${failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
