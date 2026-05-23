"use client";

import { LENSES, type LensKey } from "@/lib/scoring";

interface Props {
  active: LensKey;
  onChange: (lens: LensKey) => void;
}

const ORDER: LensKey[] = ["standard", "weight", "feel", "luck", "equal"];

export function LensChips({ active, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Comparison lens"
      className="flex flex-wrap gap-1.5"
    >
      {ORDER.map((key) => {
        const lens = LENSES[key];
        const isActive = key === active;
        return (
          <button
            key={key}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(key)}
            title={lens.blurb}
            className={`font-cs-mono uppercase rounded-md px-3 py-1.5 transition-colors ${
              isActive
                ? "bg-cs-ink text-cs-paper"
                : "bg-cs-paper-warm text-cs-ink hover:bg-cs-paper-edge"
            }`}
            style={{
              fontSize: 10,
              letterSpacing: "0.16em",
              border: isActive ? "none" : "1px solid rgba(28,26,20,0.12)",
            }}
          >
            {lens.label}
          </button>
        );
      })}
    </div>
  );
}
