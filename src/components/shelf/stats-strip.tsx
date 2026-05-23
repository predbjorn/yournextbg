import { Stamp } from "@/components/ui";
import type { ShelfItem } from "@/lib/shelf/queries";

/**
 * Four pill stats above the grid:
 *  · On shelf       — total items.
 *  · Rated          — items with user_rating set.
 *  · Pending        — bgg imports with no editorial score yet.
 *  · Rate-more hint — surfaces when unrated > 5; nudges into /rate.
 *
 * Computed from the server-fetched list so the numbers always match the
 * grid below. Keep this pure / server-rendered.
 */
export function StatsStrip({ items }: { items: ShelfItem[] }) {
  const total = items.length;
  const rated = items.filter((it) => it.user_rating != null).length;
  const pending = items.filter(
    (it) => !it.game || it.game.score_status === "unscored",
  ).length;
  const unrated = total - rated;

  return (
    <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
      <Stat label="on shelf" value={total} />
      <Stat label="rated" value={rated} />
      <Stat label="pending scoring" value={pending} />
      <Stat
        label={unrated > 5 ? "rate more →" : "unrated"}
        value={unrated}
        href={unrated > 0 ? "/rate" : undefined}
      />
    </dl>
  );
}

function Stat({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href?: string;
}) {
  const inner = (
    <div
      className="bg-cs-paper-warm cs-grain rounded-lg flex flex-col gap-1 p-4"
      style={{
        boxShadow: "inset 0 0 0 1px rgba(28,26,20,0.08)",
      }}
    >
      <Stamp color="muted" size={9}>
        {label}
      </Stamp>
      <span
        className="font-cs-display text-cs-ink"
        style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em" }}
      >
        {value}
      </span>
    </div>
  );
  if (href) {
    return (
      <dt className="contents">
        <a href={href} className="block hover:opacity-90">
          {inner}
        </a>
      </dt>
    );
  }
  return <dt className="contents">{inner}</dt>;
}
