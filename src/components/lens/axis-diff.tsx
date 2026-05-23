"use client";

import { AXES, axisDeltas, type ScoreVector } from "@/lib/scoring";
import { Stamp } from "@/components/ui";

interface Props {
  a: ScoreVector;
  b: ScoreVector;
  /** Top N axes by delta — defaults to 4. */
  top?: number;
}

export function AxisDiff({ a, b, top = 4 }: Props) {
  const deltas = axisDeltas(a, b).slice(0, top);
  return (
    <ul className="flex flex-col gap-2">
      {deltas.map((d) => {
        const ax = AXES[d.axisIndex];
        const higher = d.a >= d.b ? "A" : "B";
        return (
          <li
            key={ax.key}
            className="flex items-baseline gap-3"
            style={{
              borderBottom: "1px solid rgba(28,26,20,0.06)",
              padding: "8px 0",
            }}
          >
            <span
              className="font-cs-display text-cs-ink"
              style={{ fontSize: 14, fontWeight: 600, width: 110 }}
            >
              {ax.label}
            </span>
            <span
              className="font-cs-mono text-cs-muted shrink-0"
              style={{ fontSize: 10, letterSpacing: "0.14em" }}
            >
              {d.a.toFixed(1)} vs {d.b.toFixed(1)}
            </span>
            <span className="grow text-cs-ink/80" style={{ fontSize: 13 }}>
              <Stamp color="muted" size={9}>
                {higher}+
              </Stamp>{" "}
              {ax.diffExplanation}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
