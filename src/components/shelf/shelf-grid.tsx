import Link from "next/link";
import { ShelfCard } from "./shelf-card";
import { Stamp } from "@/components/ui";
import { buildCoverUrl, type ShelfItem } from "@/lib/shelf/queries";
import type { ShelfView } from "@/lib/shelf/filters";

export function ShelfGrid({
  items,
  view = "grid",
}: {
  items: ShelfItem[];
  view?: ShelfView;
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <Stamp color="muted">nothing here</Stamp>
        <p
          className="font-cs-display italic text-cs-ink/70"
          style={{ fontSize: 16, maxWidth: 380 }}
        >
          Try a different filter, add a game from the catalog, or connect
          your BoardGameGeek account to import your collection.
        </p>
      </div>
    );
  }

  if (view === "list") {
    return (
      <ul
        className="flex flex-col"
        style={{ borderTop: "1px solid rgba(28,26,20,0.08)" }}
      >
        {items.map((item) => (
          <ShelfListRow key={item.id} item={item} />
        ))}
      </ul>
    );
  }

  return (
    <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-5 gap-y-8">
      {items.map((item) => (
        <li key={item.id}>
          <ShelfCard item={item} />
        </li>
      ))}
    </ul>
  );
}

const RATING_DOTS: ReadonlyArray<1 | 2 | 3 | 4 | 5> = [1, 2, 3, 4, 5];

function ShelfListRow({ item }: { item: ShelfItem }) {
  const game = item.game;
  const name = game?.name ?? item.manual_name ?? "Untitled game";
  const isUnscored = !game || game.score_status === "unscored";
  const coverUrl = game ? buildCoverUrl(game, "thumb") : null;
  const href = game ? `/games/${game.slug}` : null;

  const titleEl = href ? (
    <Link
      href={href}
      className="font-cs-display text-cs-ink truncate hover:underline"
      style={{ fontSize: 16, fontWeight: 600 }}
    >
      {name}
    </Link>
  ) : (
    <span
      className="font-cs-display text-cs-ink truncate"
      style={{ fontSize: 16, fontWeight: 600 }}
    >
      {name}
    </span>
  );

  return (
    <li
      className="flex items-center gap-4 py-3"
      style={{ borderBottom: "1px solid rgba(28,26,20,0.08)" }}
    >
      <div
        className="shrink-0 rounded overflow-hidden bg-cs-paper-deep"
        style={{ width: 44, height: 56 }}
      >
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt=""
            className="block w-full h-full object-cover"
            loading="lazy"
          />
        ) : null}
      </div>
      <div className="flex flex-col min-w-0 grow">
        <div className="flex items-baseline gap-2">
          {titleEl}
          {isUnscored && (
            <Stamp color="muted" size={9}>
              pending
            </Stamp>
          )}
          {item.collection_kind === "wishlist" && (
            <Stamp color="muted" size={9}>
              wishlist
            </Stamp>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {RATING_DOTS.map((dot) => {
          const filled =
            item.user_rating != null && dot <= item.user_rating;
          return (
            <span
              key={dot}
              aria-hidden="true"
              className={filled ? "bg-cs-ink" : "bg-cs-ink/15"}
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
    </li>
  );
}
