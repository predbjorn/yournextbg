"use client";

/**
 * Filter chips + sort dropdown + grid/list view toggle.
 *
 * URL is the source of truth: every interaction calls `router.replace`
 * with the next `?filter=…&sort=…&view=…` so back-button + share-link
 * both work without re-implementing state.
 */

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Stamp } from "@/components/ui";
import {
  parseShelfState,
  serializeShelfState,
  type FilterCounts,
  type ShelfFilter,
  type ShelfSort,
  type ShelfView,
} from "@/lib/shelf/filters";

interface Props {
  counts: FilterCounts;
}

const FILTER_OPTIONS: ReadonlyArray<{ key: ShelfFilter; label: string }> = [
  { key: "all", label: "all" },
  { key: "owned", label: "owned" },
  { key: "wishlist", label: "wishlist" },
  { key: "unrated", label: "unrated" },
  { key: "rated5", label: "★5 only" },
];

const SORT_OPTIONS: ReadonlyArray<{ key: ShelfSort; label: string }> = [
  { key: "recent", label: "recently added" },
  { key: "rating", label: "highest rated" },
  { key: "title", label: "title" },
];

export function ShelfFilters({ counts }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const state = parseShelfState(sp);

  function go(patch: Partial<{ filter: ShelfFilter; sort: ShelfSort; view: ShelfView }>) {
    const next = { ...state, ...patch };
    router.replace(`${pathname}${serializeShelfState(next)}`, { scroll: false });
  }

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div
        role="tablist"
        aria-label="Filter shelf"
        className="flex flex-wrap gap-1.5"
      >
        {FILTER_OPTIONS.map((opt) => {
          const active = state.filter === opt.key;
          return (
            <button
              key={opt.key}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => go({ filter: opt.key })}
              className={`font-cs-mono uppercase rounded-md px-3 py-1.5 transition-colors ${
                active
                  ? "bg-cs-ink text-cs-paper"
                  : "bg-cs-paper-warm text-cs-ink hover:bg-cs-paper-edge"
              }`}
              style={{
                fontSize: 10,
                letterSpacing: "0.16em",
                border: active
                  ? "none"
                  : "1px solid rgba(28,26,20,0.12)",
              }}
            >
              <span>{opt.label}</span>
              <span
                className={`ml-2 ${active ? "opacity-70" : "opacity-50"}`}
              >
                {counts[opt.key]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="ml-auto flex items-center gap-3">
        <label className="flex items-center gap-2">
          <Stamp color="muted" size={9}>
            sort
          </Stamp>
          <select
            value={state.sort}
            onChange={(e) => go({ sort: e.target.value as ShelfSort })}
            className="font-cs-mono uppercase bg-cs-paper-warm text-cs-ink rounded-md px-2 py-1.5"
            style={{
              fontSize: 10,
              letterSpacing: "0.14em",
              border: "1px solid rgba(28,26,20,0.12)",
            }}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <div
          role="radiogroup"
          aria-label="View mode"
          className="flex rounded-md overflow-hidden"
          style={{ border: "1px solid rgba(28,26,20,0.12)" }}
        >
          <ViewBtn
            label="grid"
            active={state.view === "grid"}
            onClick={() => go({ view: "grid" })}
          />
          <ViewBtn
            label="list"
            active={state.view === "list"}
            onClick={() => go({ view: "list" })}
          />
        </div>
      </div>
    </div>
  );
}

function ViewBtn({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      role="radio"
      aria-checked={active}
      type="button"
      onClick={onClick}
      className={`font-cs-mono uppercase px-3 py-1.5 ${
        active
          ? "bg-cs-ink text-cs-paper"
          : "bg-cs-paper-warm text-cs-ink"
      }`}
      style={{
        fontSize: 10,
        letterSpacing: "0.16em",
      }}
    >
      {label}
    </button>
  );
}

