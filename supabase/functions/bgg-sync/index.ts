// supabase/functions/bgg-sync/index.ts
//
// Imports a user's BGG `owned` + `wishlist` collections into their local
// collections. Games we don't have scored yet are inserted as placeholders
// with score_status='unscored' (axes_vec is NULL, so they're skipped by the
// recommender — they only show up on the shelf with a "pending scoring" badge).
//
// Triggered two ways:
//   - manual: user clicks "Sync from BGG" in the web UI (Bearer = user JWT)
//   - cron:   pg_cron hourly job (Bearer = service-role key, body.user_id set)
//
// BGG's collection API returns 202 while it's building the response — we
// retry with exponential backoff up to ~32s before giving up with a 504.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parse as parseXML } from "https://deno.land/x/xml@2.1.3/mod.ts";

interface Body { user_id?: string; triggered_by?: 'manual' | 'cron'; }

interface SyncItem {
  bggId: number;
  name: string;
  imageUrl?: string;
  userRating?: number;
}

const BGG_BASE = "https://boardgamegeek.com/xmlapi2";
const MAX_RETRIES = 6;          // BGG returns 202 while building; back off up to ~32s.
const BACKOFF_MS = [1000, 2000, 3000, 5000, 8000, 13000];

async function fetchCollection(username: string, kind: 'own' | 'wishlist'): Promise<Response> {
  const qs = kind === 'own' ? 'own=1&stats=1' : 'wishlist=1';
  const url = `${BGG_BASE}/collection?username=${encodeURIComponent(username)}&${qs}`;
  const apiKey = Deno.env.get("BGG_API_KEY");
  const headers: HeadersInit = {
    "User-Agent": "yournextbg/1.0 (+https://yournextbg.com)",
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
  };
  for (let i = 0; i < MAX_RETRIES; i++) {
    const res = await fetch(url, { headers });
    if (res.status !== 202) return res;
    await new Promise(r => setTimeout(r, BACKOFF_MS[i] ?? 13000));
  }
  return new Response("BGG still building cache after retries", { status: 504 });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("POST only", { status: 405 });
  const authz = req.headers.get("Authorization") ?? "";
  if (!authz.startsWith("Bearer ")) return new Response("auth required", { status: 401 });

  // Detect service-role caller (pg_cron). The service-role JWT is not an end-
  // user token, so auth.getUser() would return null and we'd 401 before any
  // body.user_id processing — that path is reserved for cron.
  const bearer = authz.slice(7);
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const isServiceRole = bearer === serviceRoleKey;

  let callerUserId: string | null = null;
  if (!isServiceRole) {
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authz } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response("invalid token", { status: 401 });
    callerUserId = user.id;
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    serviceRoleKey,
  );

  const body = (await req.json().catch(() => ({}))) as Body;

  // Only service-role (cron) may target an arbitrary user_id. End-users are
  // pinned to their own id, otherwise an authenticated attacker could sync
  // into another user's collections by passing body.user_id.
  let targetUserId: string;
  if (isServiceRole) {
    if (!body.user_id) {
      return new Response("user_id required for service-role calls", { status: 400 });
    }
    targetUserId = body.user_id;
  } else {
    targetUserId = callerUserId!;
  }
  const triggeredBy: 'manual' | 'cron' = body.triggered_by ?? 'manual';

  const { data: prefs } = await admin
    .from("user_prefs")
    .select("bgg_username, import_bgg_ratings")
    .eq("user_id", targetUserId)
    .single();
  if (!prefs?.bgg_username) return new Response("no bgg_username on profile", { status: 400 });
  const importRatings = prefs.import_bgg_ratings !== false; // default true if column null

  const { data: logRow } = await admin
    .from("bgg_sync_log")
    .insert({ user_id: targetUserId, triggered_by: triggeredBy })
    .select("id").single();
  const logId = logRow!.id;

  try {
    const [ownedRes, wishRes] = await Promise.all([
      fetchCollection(prefs.bgg_username, 'own'),
      fetchCollection(prefs.bgg_username, 'wishlist'),
    ]);
    if (!ownedRes.ok || !wishRes.ok) {
      await admin.from("bgg_sync_log").update({
        finished_at: new Date().toISOString(),
        status: 'failed',
        error: `owned=${ownedRes.status} wish=${wishRes.status}`,
      }).eq("id", logId);
      return new Response("BGG fetch failed", { status: 502 });
    }

    const ownedXml = parseXML(await ownedRes.text()) as any;
    const wishXml = parseXML(await wishRes.text()) as any;
    const ownedItems = extractItems(ownedXml);
    const wishItems  = extractItems(wishXml);

    // 1. Upsert games that don't exist yet as unscored placeholders.
    const allBggIds = [...new Set([...ownedItems, ...wishItems].map(i => i.bggId))];
    const { data: existingGames } = allBggIds.length
      ? await admin.from("games").select("bgg_id").in("bgg_id", allBggIds)
      : { data: [] as { bgg_id: number }[] };
    const existing = new Set((existingGames ?? []).map(g => g.bgg_id));
    const newPlaceholders = [...ownedItems, ...wishItems]
      .filter(i => !existing.has(i.bggId))
      // Dedupe across owned + wishlist (same game may appear in both).
      .filter((item, idx, arr) => arr.findIndex(x => x.bggId === item.bggId) === idx)
      .map(i => ({
        id: `bgg-${i.bggId}`,
        slug: `bgg-${i.bggId}`,
        name: i.name,
        bgg_id: i.bggId,
        scores: null,           // axes_vec will be null too via generated column
        solo: 0,
        fiddly: 0,
        score_status: 'unscored' as const,
        cover_origin_url: i.imageUrl ?? null,
      }));
    if (newPlaceholders.length) {
      await admin.from("games").upsert(newPlaceholders, { onConflict: "id" });
    }

    // 2. Find or create the user's owned + wishlist collections.
    const ownedColl = await ensureCollection(admin, targetUserId, 'owned', 'Owned');
    const wishColl  = await ensureCollection(admin, targetUserId, 'wishlist', 'Wishlist');

    // 3. Upsert collection_items.
    await upsertItems(admin, ownedColl, ownedItems, 'bgg', importRatings);
    await upsertItems(admin, wishColl,  wishItems,  'bgg', importRatings);

    await admin.from("user_prefs").update({
      last_bgg_sync_at: new Date().toISOString(),
    }).eq("user_id", targetUserId);

    await admin.from("bgg_sync_log").update({
      finished_at: new Date().toISOString(),
      status: 'ok',
      owned_count: ownedItems.length,
      wishlist_count: wishItems.length,
      new_unscored: newPlaceholders.length,
    }).eq("id", logId);

    return new Response(JSON.stringify({
      ok: true,
      owned: ownedItems.length,
      wishlist: wishItems.length,
      new_unscored: newPlaceholders.length,
    }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    await admin.from("bgg_sync_log").update({
      finished_at: new Date().toISOString(),
      status: 'failed',
      error: String(err),
    }).eq("id", logId);
    return new Response(String(err), { status: 500 });
  }
});

// ─── Helpers ────────────────────────────────────────────────────────────

// deno.land/x/xml@2.1.3 conventions:
//   - element children appear as keys; repeated children become arrays
//   - attributes appear under keys prefixed with "@" (e.g. @objectid)
//   - leaf text content is the string itself when there are no attrs/children,
//     or under "#text" when the element also has attributes
// The library returns `undefined` for missing keys, so we guard with `??`.
function extractItems(xml: any): SyncItem[] {
  const items = xml?.items?.item;
  if (!items) return [];
  const arr = Array.isArray(items) ? items : [items];

  const out: SyncItem[] = [];
  for (const it of arr) {
    if (!it) continue;
    const objectId = it["@objectid"];
    const bggId = typeof objectId === "number" ? objectId : parseInt(String(objectId), 10);
    if (!Number.isFinite(bggId)) continue;

    // <name>...</name> may have a sortindex attribute, in which case the text
    // is under "#text"; without attributes, the value is the text directly.
    const nameNode = it.name;
    let name = "";
    if (typeof nameNode === "string") {
      name = nameNode;
    } else if (nameNode && typeof nameNode === "object") {
      name = String(nameNode["#text"] ?? "");
    }
    if (!name) name = `BGG ${bggId}`;

    const imgNode = it.image;
    let imageUrl: string | undefined;
    if (typeof imgNode === "string" && imgNode.length > 0) {
      imageUrl = imgNode;
    } else if (imgNode && typeof imgNode === "object") {
      const t = imgNode["#text"];
      if (typeof t === "string" && t.length > 0) imageUrl = t;
    }

    // <stats ...><rating value="N|N/A" /> ... </rating></stats>
    let userRating: number | undefined;
    const stats = it.stats;
    const rating = stats?.rating;
    if (rating && typeof rating === "object") {
      const v = rating["@value"];
      if (v !== undefined && v !== null && String(v) !== "N/A") {
        const n = typeof v === "number" ? v : parseFloat(String(v));
        if (Number.isFinite(n)) userRating = n;
      }
    }

    out.push({ bggId, name, imageUrl, userRating });
  }
  return out;
}

async function ensureCollection(
  admin: SupabaseClient,
  userId: string,
  kind: 'owned' | 'wishlist',
  name: string,
): Promise<string> {
  const { data: existing } = await admin
    .from("collections")
    .select("id")
    .eq("user_id", userId)
    .eq("kind", kind)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await admin
    .from("collections")
    .insert({ user_id: userId, kind, name })
    .select("id")
    .single();
  if (error) throw error;
  return created.id;
}

// BGG uses 1-10; yournextbg uses 1-5. Map per the design's anchors.
function normalizeBggRating(bgg: number): number {
  if (bgg >= 9) return 5;
  if (bgg >= 8) return 4;
  if (bgg >= 6) return 3;
  if (bgg >= 4) return 2;
  return 1;
}

async function upsertItems(
  admin: SupabaseClient,
  collectionId: string,
  items: SyncItem[],
  source: 'bgg',
  importRatings: boolean,
): Promise<void> {
  if (!items.length) return;

  // Read-modify-write per row so we never clobber user-set fields:
  //   - source='manual' must survive a BGG sync (don't flip to 'bgg')
  //   - user-set user_rating in our UI must survive (don't overwrite with BGG's)
  // O(n) DB calls is fine for v1 collection sizes (<1k games); batch later.
  const { data: existing } = await admin
    .from("collection_items")
    .select("id, game_id, bgg_id, source, user_rating")
    .eq("collection_id", collectionId);
  const byGameId = new Map<string, { id: string; bgg_id: number | null; source: string; user_rating: number | null }>(
    (existing ?? [])
      .filter((r): r is typeof r & { game_id: string } => r.game_id != null)
      .map(r => [r.game_id, { id: r.id, bgg_id: r.bgg_id, source: r.source, user_rating: r.user_rating }])
  );

  // Resolve all bgg_id → game.id in a single round-trip.
  const bggIds = [...new Set(items.map(i => i.bggId))];
  const { data: games } = await admin
    .from("games")
    .select("id, bgg_id")
    .in("bgg_id", bggIds);
  const gameIdByBgg = new Map<number, string>(
    (games ?? [])
      .filter((g): g is typeof g & { bgg_id: number } => g.bgg_id != null)
      .map(g => [g.bgg_id, g.id])
  );

  for (const item of items) {
    const gameId = gameIdByBgg.get(item.bggId);
    if (!gameId) continue; // shouldn't happen after placeholder upsert, but guard

    const incomingRating =
      importRatings && typeof item.userRating === "number"
        ? normalizeBggRating(item.userRating)
        : null;

    const existingRow = byGameId.get(gameId);
    if (existingRow) {
      // UPDATE — preserve source='manual' and any user-set rating.
      const patch: Record<string, unknown> = {};
      if (existingRow.bgg_id !== item.bggId) patch.bgg_id = item.bggId;
      // Only adopt BGG's rating if user hasn't set one locally.
      if (existingRow.user_rating === null && incomingRating !== null) {
        patch.user_rating = incomingRating;
      }
      // Don't overwrite source='manual' with 'bgg'. Only flip when source was something else.
      if (existingRow.source !== 'manual' && existingRow.source !== source) {
        patch.source = source;
      }
      if (Object.keys(patch).length > 0) {
        const { error } = await admin
          .from("collection_items")
          .update(patch)
          .eq("id", existingRow.id);
        if (error) throw error;
      }
    } else {
      // INSERT new row.
      const { error } = await admin.from("collection_items").insert({
        collection_id: collectionId,
        game_id: gameId,
        bgg_id: item.bggId,
        source,
        user_rating: incomingRating,
      });
      if (error) throw error;
    }
  }
}
