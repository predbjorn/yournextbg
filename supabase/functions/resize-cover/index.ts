// supabase/functions/resize-cover/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// imagescript supports WebP encode in pure Deno.
import { decode, Image } from "https://deno.land/x/imagescript@1.2.17/mod.ts";

interface Body { game_id: string }

const SIZES = { thumb: 80, card: 200, hero: 600 } as const;

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("POST only", { status: 405 });

  const { game_id } = (await req.json()) as Body;
  if (!game_id) return new Response("game_id required", { status: 400 });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: game, error } = await admin
    .from("games")
    .select("id, bgg_id, cover_origin_url, cover_status")
    .eq("id", game_id)
    .single();
  if (error || !game) return new Response("game not found", { status: 404 });
  if (!game.cover_origin_url) return new Response("no origin", { status: 400 });

  const res = await fetch(game.cover_origin_url, { headers: { "User-Agent": "yournextbg/1.0" } });
  if (!res.ok) {
    await admin.from("games").update({ cover_status: "failed" }).eq("id", game_id);
    return new Response(`source fetch ${res.status}`, { status: 502 });
  }
  const bytes = new Uint8Array(await res.arrayBuffer());
  const img = await decode(bytes);
  if (!(img instanceof Image)) {
    await admin.from("games").update({ cover_status: "failed" }).eq("id", game_id);
    return new Response("not a still image", { status: 415 });
  }

  const base = game.bgg_id ? `${game.bgg_id}` : `_local/${game.id}`;

  for (const [variant, w] of Object.entries(SIZES) as [keyof typeof SIZES, number][]) {
    const ratio = w / img.width;
    const resized = img.clone().resize(w, Math.round(img.height * ratio));
    const buf = await resized.encode(80); // WebP quality 80
    const { error: upErr } = await admin.storage
      .from("covers")
      .upload(`${base}/${variant}.webp`, buf, {
        contentType: "image/webp",
        upsert: true,
        cacheControl: "public, max-age=31536000, immutable",
      });
    if (upErr) {
      await admin.from("games").update({ cover_status: "failed" }).eq("id", game_id);
      return new Response(`upload ${variant}: ${upErr.message}`, { status: 500 });
    }
  }

  await admin.from("games").update({ cover_status: "ready" }).eq("id", game_id);
  return new Response(JSON.stringify({ ok: true, base }), {
    headers: { "Content-Type": "application/json" },
  });
});
