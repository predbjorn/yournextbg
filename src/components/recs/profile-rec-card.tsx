"use client";

import Link from "next/link";
import { useState } from "react";
import { Btn, BoxCover, Stamp } from "@/components/ui";
import { buildCoverUrl } from "@/lib/shelf/covers";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ProfileCandidate } from "@/lib/recs/queries";

interface Props {
  rec: ProfileCandidate;
  rank: number;
  /** Called optimistically when the user dismisses, so the parent can drop the card. */
  onDismiss: (gameId: string) => void;
}

export function ProfileRecCard({ rec, rank, onDismiss }: Props) {
  const [err, setErr] = useState<string | null>(null);
  const coverUrl = buildCoverUrl(
    { id: rec.id, bgg_id: rec.bgg_id, cover_status: rec.cover_status },
    "card",
  );

  async function dismiss() {
    onDismiss(rec.id);
    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setErr("Signed out.");
        return;
      }
      const { error } = await supabase
        .from("dismissals")
        .upsert({ user_id: user.id, game_id: rec.id });
      if (error) setErr(error.message);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Dismiss failed.");
    }
  }

  return (
    <article className="flex flex-col gap-3">
      <div className="relative">
        <Link href={`/games/${rec.slug}`} aria-label={rec.name}>
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt={rec.name}
              className="block w-full aspect-[3/4] object-cover rounded-md"
              loading="lazy"
            />
          ) : (
            <BoxCover title={rec.name} height={260} />
          )}
        </Link>
        <span
          className="absolute top-2 right-2 font-cs-mono uppercase bg-cs-paper-deep/85 text-cs-muted rounded px-2 py-0.5"
          style={{ fontSize: 9, letterSpacing: "0.18em" }}
        >
          #{rank}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <Link
          href={`/games/${rec.slug}`}
          className="font-cs-display text-cs-ink hover:underline"
          style={{ fontSize: 16, fontWeight: 600 }}
        >
          {rec.name}
        </Link>
        {rec.signature && (
          <p
            className="font-cs-display italic text-cs-ink/70"
            style={{ fontSize: 12 }}
          >
            {rec.signature}
          </p>
        )}
      </div>

      {rec.nearest_anchor_name && rec.nearest_anchor_rating != null && (
        <p
          className="font-cs-mono text-cs-muted"
          style={{ fontSize: 10, letterSpacing: "0.06em" }}
        >
          ↳ anchored on ★{rec.nearest_anchor_rating} {rec.nearest_anchor_name}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Btn
          tone="ghost"
          size="sm"
          onClick={dismiss}
          aria-label={`Dismiss ${rec.name}`}
        >
          ✕ Dismiss
        </Btn>
        <Stamp color="muted-soft" size={9}>
          d={rec.centroid_distance.toFixed(2)}
        </Stamp>
      </div>

      {err && (
        <p
          role="alert"
          className="font-cs-mono"
          style={{
            fontSize: 10,
            letterSpacing: "0.06em",
            color: "var(--cs-negative)",
          }}
        >
          {err}
        </p>
      )}
    </article>
  );
}
