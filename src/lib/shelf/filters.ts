/**
 * Shelf URL state — pure parsing/serialization, shared by the server
 * page (for the initial filtered/sorted view) and the client filter row
 * (for live updates without a roundtrip).
 *
 * URL contract:
 *   ?filter=all|owned|wishlist|unrated|rated5
 *   &sort=recent|rating|title
 *   &view=grid|list
 *
 * Anything else is ignored; defaults below win.
 */

import type { ShelfItem } from "./queries";

export type ShelfFilter = "all" | "owned" | "wishlist" | "unrated" | "rated5";
export type ShelfSort = "recent" | "rating" | "title";
export type ShelfView = "grid" | "list";

export interface ShelfState {
  filter: ShelfFilter;
  sort: ShelfSort;
  view: ShelfView;
}

const FILTERS = new Set<ShelfFilter>([
  "all",
  "owned",
  "wishlist",
  "unrated",
  "rated5",
]);
const SORTS = new Set<ShelfSort>(["recent", "rating", "title"]);
const VIEWS = new Set<ShelfView>(["grid", "list"]);

export function parseShelfState(
  sp: URLSearchParams | { [k: string]: string | string[] | undefined },
): ShelfState {
  const get = (k: string): string | undefined => {
    if (sp instanceof URLSearchParams) return sp.get(k) ?? undefined;
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const f = get("filter") as ShelfFilter | undefined;
  const s = get("sort") as ShelfSort | undefined;
  const v = get("view") as ShelfView | undefined;
  return {
    filter: f && FILTERS.has(f) ? f : "all",
    sort: s && SORTS.has(s) ? s : "recent",
    view: v && VIEWS.has(v) ? v : "grid",
  };
}

export function serializeShelfState(state: Partial<ShelfState>): string {
  const params = new URLSearchParams();
  if (state.filter && state.filter !== "all") params.set("filter", state.filter);
  if (state.sort && state.sort !== "recent") params.set("sort", state.sort);
  if (state.view && state.view !== "grid") params.set("view", state.view);
  const s = params.toString();
  return s ? `?${s}` : "";
}

export function applyShelfState(
  items: ShelfItem[],
  state: ShelfState,
): ShelfItem[] {
  let out = items;
  switch (state.filter) {
    case "owned":
      out = out.filter((it) => it.collection_kind === "owned");
      break;
    case "wishlist":
      out = out.filter((it) => it.collection_kind === "wishlist");
      break;
    case "unrated":
      out = out.filter((it) => it.user_rating == null);
      break;
    case "rated5":
      out = out.filter((it) => it.user_rating === 5);
      break;
  }
  // sort
  const titleOf = (it: ShelfItem) =>
    (it.game?.name ?? it.manual_name ?? "").toLowerCase();
  switch (state.sort) {
    case "rating":
      out = [...out].sort(
        (a, b) => (b.user_rating ?? -1) - (a.user_rating ?? -1),
      );
      break;
    case "title":
      out = [...out].sort((a, b) => titleOf(a).localeCompare(titleOf(b)));
      break;
    case "recent":
    default:
      out = [...out].sort(
        (a, b) => Date.parse(b.added_at) - Date.parse(a.added_at),
      );
      break;
  }
  return out;
}

export interface FilterCounts {
  all: number;
  owned: number;
  wishlist: number;
  unrated: number;
  rated5: number;
}

export function countShelf(items: ShelfItem[]): FilterCounts {
  return {
    all: items.length,
    owned: items.filter((it) => it.collection_kind === "owned").length,
    wishlist: items.filter((it) => it.collection_kind === "wishlist").length,
    unrated: items.filter((it) => it.user_rating == null).length,
    rated5: items.filter((it) => it.user_rating === 5).length,
  };
}
