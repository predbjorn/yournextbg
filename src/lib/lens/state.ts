/**
 * URL state for the Comparison Lens. Anchor A and (optional) B + the
 * active lens are encoded in search params so the comparison is
 * shareable: /lens?a=brass-birmingham&b=concordia&lens=feel.
 */

import { type LensKey } from "@/lib/scoring";

const LENS_KEYS = new Set<LensKey>([
  "standard",
  "weight",
  "feel",
  "luck",
  "equal",
]);

export interface LensState {
  a: string;
  b: string | null;
  lens: LensKey;
}

export function parseLensState(
  sp: URLSearchParams | { [k: string]: string | string[] | undefined },
  fallbackA: string,
): LensState {
  const get = (k: string): string | undefined => {
    if (sp instanceof URLSearchParams) return sp.get(k) ?? undefined;
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const a = get("a") || fallbackA;
  const b = get("b") || null;
  const lensRaw = get("lens");
  const lens: LensKey =
    lensRaw && LENS_KEYS.has(lensRaw as LensKey)
      ? (lensRaw as LensKey)
      : "standard";
  return { a, b, lens };
}

export function serializeLensState(state: LensState): string {
  const params = new URLSearchParams();
  params.set("a", state.a);
  if (state.b) params.set("b", state.b);
  if (state.lens !== "standard") params.set("lens", state.lens);
  return `?${params.toString()}`;
}
