"use client";

/**
 * Add a game to the user's "owned" collection via a typeahead modal.
 *
 * On submit:
 *  1. Ensure the user has an `owned` collection — insert one if missing.
 *  2. Upsert a `collection_items` row keyed on (collection_id, game_id).
 *     The unique partial index from migration 0008 makes the upsert idempotent.
 *
 * Search hits the catalog (`games.score_status = 'editorial'`) and limits
 * to 20. We omit unscored placeholders here — manually adding a BGG-only
 * game without scores would just create a "pending scoring" tile, which
 * is what the BGG sync flow is for.
 */

import { useEffect, useRef, useState } from "react";
import { Btn, Stamp } from "@/components/ui";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { capture } from "@/lib/analytics/posthog";

interface CatalogHit {
  id: string;
  slug: string;
  name: string;
}

export function AddGameButton() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<CatalogHit[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    } else {
      setQuery("");
      setHits([]);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const supabase = getSupabaseBrowserClient();
      const { data, error: searchErr } = await supabase
        .from("games")
        .select("id, slug, name")
        .eq("score_status", "editorial")
        .ilike("name", `%${q}%`)
        .order("name")
        .limit(20);
      if (cancelled) return;
      if (searchErr) {
        setError(searchErr.message);
        setHits([]);
      } else {
        setError(null);
        setHits((data as CatalogHit[]) ?? []);
      }
    }, 150);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, query]);

  async function add(game: CatalogHit) {
    setPending(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Signed out — refresh and sign in again.");
        return;
      }

      // Find or create the user's "owned" collection.
      const { data: owned, error: ownedErr } = await supabase
        .from("collections")
        .select("id")
        .eq("user_id", user.id)
        .eq("kind", "owned")
        .maybeSingle();
      if (ownedErr) {
        setError(ownedErr.message);
        return;
      }
      let collectionId = owned?.id;
      if (!collectionId) {
        const { data: created, error: createErr } = await supabase
          .from("collections")
          .insert({
            user_id: user.id,
            name: "Owned",
            kind: "owned",
          })
          .select("id")
          .single();
        if (createErr || !created) {
          setError(createErr?.message ?? "Could not create collection.");
          return;
        }
        collectionId = created.id;
      }

      const { error: upsertErr } = await supabase
        .from("collection_items")
        .upsert(
          {
            collection_id: collectionId,
            game_id: game.id,
            source: "manual",
          },
          { onConflict: "collection_id,game_id" },
        );
      if (upsertErr) {
        setError(upsertErr.message);
        return;
      }
      capture("shelf_add_manual", { game_id: game.id });
      setOpen(false);
      // Hard refresh so the new row hydrates from the server query.
      window.location.reload();
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Btn tone="primary" onClick={() => setOpen(true)}>
        + Add game
      </Btn>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Add a game"
          className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-24"
          style={{ background: "rgba(20,17,11,0.55)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            className="bg-cs-paper-warm cs-grain rounded-lg w-full max-w-lg shadow-xl"
            style={{
              boxShadow:
                "inset 0 0 0 1px rgba(28,26,20,0.1), 0 12px 28px rgba(20,17,11,0.35)",
            }}
          >
            <div className="p-5">
              <Stamp color="muted">add to shelf</Stamp>
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the catalog…"
                className="font-cs-display block w-full bg-cs-paper text-cs-ink rounded-lg mt-2 outline-none focus:ring-2 focus:ring-cs-ink/30"
                style={{
                  padding: "12px 14px",
                  border: "1px solid rgba(28,26,20,0.2)",
                  fontSize: 15,
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setOpen(false);
                }}
              />
              {error && (
                <p
                  role="alert"
                  className="font-cs-mono mt-2"
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.06em",
                    color: "var(--cs-negative)",
                  }}
                >
                  {error}
                </p>
              )}
            </div>
            <ul
              className="max-h-[40vh] overflow-y-auto"
              style={{ borderTop: "1px solid rgba(28,26,20,0.08)" }}
            >
              {hits.length === 0 && query.trim().length >= 2 && !error && (
                <li className="px-5 py-4">
                  <Stamp color="muted">no matches</Stamp>
                </li>
              )}
              {hits.map((g) => (
                <li
                  key={g.id}
                  style={{
                    borderBottom: "1px solid rgba(28,26,20,0.06)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => add(g)}
                    disabled={pending}
                    className="w-full text-left px-5 py-3 hover:bg-cs-paper-deep/40 disabled:opacity-50 font-cs-display text-cs-ink"
                    style={{ fontSize: 15 }}
                  >
                    {g.name}
                  </button>
                </li>
              ))}
            </ul>
            <div className="p-3 flex justify-end gap-2">
              <Btn tone="ghost" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Btn>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
