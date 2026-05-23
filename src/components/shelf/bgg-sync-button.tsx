"use client";

/**
 * Manual BGG re-sync trigger. Invokes the `bgg-sync` edge function and
 * reloads on success so the server shelf query re-runs.
 *
 * Visible only when `BGG_SYNC_ENABLED`; the parent decides whether to
 * mount it at all. Falls back to "go set your BGG username first" when
 * `bggUsernameSet` is false — the function would 4xx otherwise.
 */

import { useState } from "react";
import { Btn, Stamp } from "@/components/ui";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface SyncResult {
  owned: number;
  wishlist: number;
  new_unscored: number;
}

interface Props {
  bggUsernameSet: boolean;
}

type State = "idle" | "syncing" | "ok" | "error";

export function BggSyncButton({ bggUsernameSet }: Props) {
  const [state, setState] = useState<State>("idle");
  const [msg, setMsg] = useState<string | null>(null);

  async function go() {
    if (!bggUsernameSet) {
      window.location.href = "/profile#bgg";
      return;
    }
    setState("syncing");
    setMsg("Fetching from BGG…");
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.functions.invoke<SyncResult>(
        "bgg-sync",
        { body: {} },
      );
      if (error) {
        setState("error");
        setMsg(error.message);
        return;
      }
      setState("ok");
      if (data) {
        setMsg(
          `Imported ${data.owned} owned · ${data.wishlist} wishlist · ${data.new_unscored} pending scoring`,
        );
      } else {
        setMsg("Sync complete.");
      }
      window.setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      setState("error");
      setMsg(err instanceof Error ? err.message : "Sync failed.");
    }
  }

  return (
    <div className="flex items-center gap-3">
      {msg && (
        <Stamp
          color={state === "error" ? "negative" : "muted"}
          size={9}
        >
          {msg}
        </Stamp>
      )}
      <Btn tone="primary" onClick={go} disabled={state === "syncing"}>
        {state === "syncing" ? "Syncing…" : "↻ Re-sync BGG"}
      </Btn>
    </div>
  );
}
