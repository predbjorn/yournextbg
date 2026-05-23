import Link from "next/link";
import { BoxCover, Stamp } from "@/components/ui";
import { buildCoverUrl, type ShelfItem } from "@/lib/shelf/queries";

/**
 * A single tile in the shelf grid. Renders the cover (or a `<BoxCover />`
 * placeholder when the resize pipeline hasn't produced a webp yet), the
 * title, and a 5-dot rating row.
 *
 * "Pending scoring" variant: when the game came in via BGG sync but doesn't
 * yet have editorial scores (`score_status === "unscored"`), we dim the tile,
 * stamp a corner badge, and block the rate/compare affordances. The title
 * link is still active.
 */

const RATING_DOTS: ReadonlyArray<1 | 2 | 3 | 4 | 5> = [1, 2, 3, 4, 5];

export function ShelfCard({ item }: { item: ShelfItem }) {
  const game = item.game;
  const name = game?.name ?? item.manual_name ?? "Untitled game";
  const isUnscored = !game || game.score_status === "unscored";

  const coverUrl = game ? buildCoverUrl(game, "card") : null;
  const href = game ? `/games/${game.slug}` : null;

  const tile = coverUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={coverUrl}
      alt={name}
      className="block w-full aspect-[3/4] object-cover rounded-md"
      loading="lazy"
    />
  ) : (
    <BoxCover title={name} height={220} />
  );

  return (
    <article
      className={`flex flex-col gap-2 ${isUnscored ? "opacity-75" : ""}`.trim()}
    >
      <div className="relative">
        {href ? (
          <Link href={href} aria-label={name}>
            {tile}
          </Link>
        ) : (
          tile
        )}
        {isUnscored && (
          <span
            className="absolute top-2 left-2 font-cs-mono uppercase bg-cs-paper-deep/85 text-cs-muted rounded px-2 py-0.5"
            style={{
              fontSize: 9,
              letterSpacing: "0.18em",
            }}
            title="Not yet scored — recommendations will skip this game until it's been hand-scored."
          >
            pending scoring
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        {href ? (
          <Link
            href={href}
            className="font-cs-display text-cs-ink truncate hover:underline"
            style={{ fontSize: 14, fontWeight: 600 }}
          >
            {name}
          </Link>
        ) : (
          <span
            className="font-cs-display text-cs-ink truncate"
            style={{ fontSize: 14, fontWeight: 600 }}
          >
            {name}
          </span>
        )}
        {item.collection_kind === "wishlist" && (
          <Stamp color="muted" size={8}>
            wishlist
          </Stamp>
        )}
      </div>

      <div
        className="flex items-center gap-1"
        aria-label={
          item.user_rating == null
            ? "unrated"
            : `rated ${item.user_rating} of 5`
        }
      >
        {RATING_DOTS.map((dot) => {
          const filled =
            item.user_rating != null && dot <= item.user_rating;
          return (
            <span
              key={dot}
              aria-hidden="true"
              className={
                filled ? "bg-cs-ink" : "bg-cs-ink/15"
              }
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                display: "inline-block",
              }}
            />
          );
        })}
      </div>
    </article>
  );
}
