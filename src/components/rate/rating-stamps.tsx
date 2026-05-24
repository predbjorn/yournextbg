"use client";

/**
 * Five rating tiles with the semantic anchors from plan 02. Reading order
 * left→right is high→low to match the keyboard row (F=5, D=4, S=3, A=2,
 * Q=1) — same hand position, never reaches across.
 */

import { Stamp } from "@/components/ui";

interface Props {
  onPick: (rating: 1 | 2 | 3 | 4 | 5) => void;
  disabled?: boolean;
}

const TILES: ReadonlyArray<{
  rating: 1 | 2 | 3 | 4 | 5;
  hotkey: string;
  label: string;
  sub: string;
}> = [
  { rating: 5, hotkey: "F", label: "★5", sub: "all-time favorite" },
  { rating: 4, hotkey: "D", label: "★4", sub: "loved" },
  { rating: 3, hotkey: "S", label: "★3", sub: "ok" },
  { rating: 2, hotkey: "A", label: "★2", sub: "disappointing" },
  { rating: 1, hotkey: "Q", label: "★1", sub: "never again" },
];

export function RatingStamps({ onPick, disabled }: Props) {
  return (
    <ul className="grid grid-cols-5 gap-2">
      {TILES.map((t) => (
        <li key={t.rating}>
          <button
            type="button"
            data-rating={t.rating}
            disabled={disabled}
            onClick={() => onPick(t.rating)}
            className="bg-cs-paper-warm hover:bg-cs-paper-edge w-full flex flex-col items-center gap-1 py-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{
              boxShadow: "inset 0 0 0 1px rgba(28,26,20,0.12)",
            }}
          >
            <Stamp color="muted" size={9}>
              {t.hotkey}
            </Stamp>
            <span
              className="font-cs-display text-cs-ink"
              style={{ fontSize: 22, fontWeight: 600 }}
            >
              {t.label}
            </span>
            <Stamp color="muted-soft" size={8}>
              {t.sub}
            </Stamp>
          </button>
        </li>
      ))}
    </ul>
  );
}
