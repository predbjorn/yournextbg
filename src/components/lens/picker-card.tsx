"use client";

import { BoxCover, Stamp } from "@/components/ui";
import { buildCoverUrl } from "@/lib/shelf/covers";
import type { LensSeedGame } from "@/lib/lens/queries";

interface Props {
  /** A/B label shown in the corner. */
  side: "A" | "B";
  game: LensSeedGame | null;
  /** When set, clicking the card calls this — used for B's "clear" pill. */
  onClear?: () => void;
}

export function PickerCard({ side, game, onClear }: Props) {
  if (!game) {
    return (
      <div
        className="bg-cs-paper-warm rounded-lg flex flex-col items-center justify-center gap-2 p-6"
        style={{
          minHeight: 260,
          border: "2px dashed rgba(28,26,20,0.18)",
        }}
      >
        <Stamp color="muted">{side === "B" ? "pick game B" : "no game"}</Stamp>
        <p
          className="font-cs-display italic text-cs-ink/60 text-center"
          style={{ fontSize: 13 }}
        >
          {side === "B"
            ? "Click any game on the right to overlay it here."
            : "Pick an anchor to start."}
        </p>
      </div>
    );
  }

  const coverUrl = buildCoverUrl(
    { id: game.id, bgg_id: game.bgg_id, cover_status: game.cover_status },
    "card",
  );

  return (
    <div
      className="bg-cs-paper-warm rounded-lg overflow-hidden relative"
      style={{
        boxShadow:
          "inset 0 0 0 1px rgba(28,26,20,0.1), 0 4px 0 rgba(28,26,20,0.06)",
      }}
    >
      <span
        className="absolute top-2 left-2 z-10 font-cs-mono uppercase bg-cs-paper-deep/85 text-cs-ink rounded px-2 py-0.5"
        style={{ fontSize: 9, letterSpacing: "0.18em" }}
      >
        {side}
      </span>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear game B"
          className="absolute top-2 right-2 z-10 font-cs-mono uppercase bg-cs-paper-deep/85 text-cs-muted hover:text-cs-ink rounded px-2 py-0.5"
          style={{ fontSize: 9, letterSpacing: "0.18em" }}
        >
          ✕
        </button>
      )}
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverUrl}
          alt={game.name}
          className="block w-full aspect-[3/4] object-cover"
        />
      ) : (
        <BoxCover title={game.name} height={260} radius={0} />
      )}
      <div className="p-4 flex flex-col gap-1">
        <h3
          className="font-cs-display text-cs-ink"
          style={{ fontSize: 18, fontWeight: 600 }}
        >
          {game.name}
        </h3>
        {game.signature && (
          <p
            className="font-cs-display italic text-cs-ink/70"
            style={{ fontSize: 12 }}
          >
            {game.signature}
          </p>
        )}
      </div>
    </div>
  );
}
