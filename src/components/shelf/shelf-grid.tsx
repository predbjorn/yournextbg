import { ShelfCard } from "./shelf-card";
import { Stamp } from "@/components/ui";
import type { ShelfItem } from "@/lib/shelf/queries";

export function ShelfGrid({ items }: { items: ShelfItem[] }) {
  if (items.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 py-24 text-center"
      >
        <Stamp color="muted">your shelf is empty</Stamp>
        <p
          className="font-cs-display italic text-cs-ink/70"
          style={{ fontSize: 16, maxWidth: 380 }}
        >
          Add a game from the catalog, or connect your BoardGameGeek
          account to import your collection.
        </p>
      </div>
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
