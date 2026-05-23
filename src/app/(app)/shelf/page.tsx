import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-session";
import { getShelf } from "@/lib/shelf/queries";
import {
  applyShelfState,
  countShelf,
  parseShelfState,
} from "@/lib/shelf/filters";
import { ShelfGrid } from "@/components/shelf/shelf-grid";
import { StatsStrip } from "@/components/shelf/stats-strip";
import { ShelfFilters } from "@/components/shelf/shelf-filters";
import { AddGameButton } from "@/components/shelf/add-game-button";
import { Stamp } from "@/components/ui";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}

export default async function ShelfPage({ searchParams }: PageProps) {
  const user = await getUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const state = parseShelfState(sp);
  const items = await getShelf();
  const counts = countShelf(items);
  const visible = applyShelfState(items, state);

  return (
    <main className="min-h-screen bg-cs-paper-deep cs-grain">
      <div className="container mx-auto px-6 py-10 max-w-6xl">
        <header className="flex items-end justify-between gap-4 mb-8">
          <div>
            <Stamp color="muted">your shelf</Stamp>
            <h1
              className="font-cs-display text-cs-ink mt-1"
              style={{
                fontSize: 40,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
              }}
            >
              {items.length} {items.length === 1 ? "game" : "games"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <AddGameButton />
          </div>
        </header>

        <StatsStrip items={items} />
        <ShelfFilters counts={counts} />
        <ShelfGrid items={visible} view={state.view} />
      </div>
    </main>
  );
}
