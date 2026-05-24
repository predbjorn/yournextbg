"use client";

/**
 * BGG sync settings. Hidden behind BGG_SYNC_ENABLED; when off, renders a
 * static "coming soon" notice instead of the controls.
 *
 * Each control persists to user_prefs on blur/toggle. There's no save
 * button — the optimistic write happens immediately and surface any
 * error inline. Reloads aren't required; only the manual "Re-sync now"
 * button triggers data ingestion.
 */

import { useState } from "react";
import { Btn, SettingsRow, Stamp, Toggle } from "@/components/ui";
import { BGG_SYNC_ENABLED } from "@/lib/flags";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface SyncResult {
  owned: number;
  wishlist: number;
  new_unscored: number;
}

export interface BggSectionInitial {
  bgg_username: string | null;
  auto_sync_bgg: boolean;
  import_bgg_ratings: boolean;
  last_bgg_sync_at: string | null;
}

export function BggSection({ initial }: { initial: BggSectionInitial }) {
  const [username, setUsername] = useState(initial.bgg_username ?? "");
  const [autoSync, setAutoSync] = useState(initial.auto_sync_bgg);
  const [importRatings, setImportRatings] = useState(
    initial.import_bgg_ratings,
  );
  const [lastSyncAt, setLastSyncAt] = useState(initial.last_bgg_sync_at);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!BGG_SYNC_ENABLED) {
    return (
      <section id="bgg" className="opacity-75">
        <h2
          className="font-cs-display text-cs-ink mb-2"
          style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.01em" }}
        >
          BGG sync
        </h2>
        <p
          className="font-cs-display italic text-cs-ink/70"
          style={{ fontSize: 15 }}
        >
          BGG sync is coming soon — we&apos;re finalising API access. Once
          live you&apos;ll be able to point this at your BoardGameGeek
          username and pull your owned + wishlist collections into your
          shelf.
        </p>
      </section>
    );
  }

  async function persist<K extends keyof BggSectionInitial>(
    field: K,
    value: BggSectionInitial[K],
  ) {
    setErr(null);
    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setErr("Signed out — refresh and sign in again.");
      return;
    }
    const patch = { [field]: value } as Partial<BggSectionInitial>;
    const { error } = await supabase
      .from("user_prefs")
      .update(patch)
      .eq("user_id", user.id);
    if (error) setErr(error.message);
  }

  async function resync() {
    setErr(null);
    setInfo(null);
    setPending(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.functions.invoke<SyncResult>(
        "bgg-sync",
        { body: {} },
      );
      if (error) {
        setErr(error.message);
        return;
      }
      if (data) {
        setInfo(
          `Imported ${data.owned} owned · ${data.wishlist} wishlist · ${data.new_unscored} pending scoring`,
        );
        setLastSyncAt(new Date().toISOString());
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <section id="bgg" className="flex flex-col">
      <h2
        className="font-cs-display text-cs-ink mb-2"
        style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.01em" }}
      >
        BGG sync
      </h2>

      <SettingsRow
        title="BGG username"
        sub="Used to fetch your owned and wishlist collections from boardgamegeek.com."
        control={
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onBlur={() => persist("bgg_username", username.trim() || null)}
            placeholder="username"
            className="font-cs-display bg-cs-paper text-cs-ink rounded-md px-3 py-1.5 outline-none focus:ring-2 focus:ring-cs-ink/30"
            style={{
              fontSize: 14,
              border: "1px solid rgba(28,26,20,0.18)",
              minWidth: 200,
            }}
          />
        }
      />

      <SettingsRow
        title="Last sync"
        sub={lastSyncAt ? new Date(lastSyncAt).toLocaleString() : "never"}
        control={
          <Btn
            tone="primary"
            size="sm"
            onClick={resync}
            disabled={!username || pending}
          >
            {pending ? "Syncing…" : "↻ Re-sync now"}
          </Btn>
        }
      />

      <SettingsRow
        title="Auto-sync hourly"
        sub="Pulls fresh data from BGG once an hour while this is on."
        control={
          <Toggle
            on={autoSync}
            onChange={(v) => {
              setAutoSync(v);
              persist("auto_sync_bgg", v);
            }}
            label="Auto-sync hourly"
          />
        }
      />

      <SettingsRow
        title="Import BGG ratings"
        sub="Maps your BGG 1–10 → our 5-point scale (9-10→★5, 8→★4, 6-7→★3, 4-5→★2, 1-3→★1). You can always override per game."
        control={
          <Toggle
            on={importRatings}
            onChange={(v) => {
              setImportRatings(v);
              persist("import_bgg_ratings", v);
            }}
            label="Import BGG ratings"
          />
        }
      />

      {info && (
        <Stamp color="positive" size={10}>
          {info}
        </Stamp>
      )}
      {err && (
        <Stamp color="negative" size={10}>
          {err}
        </Stamp>
      )}
    </section>
  );
}
