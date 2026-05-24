import { type CSSProperties } from "react";
import { AXES, type Branch } from "@/lib/scoring/axes";

/**
 * Branch → CSS variable. We can't read theme tokens at render time on the
 * server, but emitting `var(--cs-branch-*)` lets the SVG pick up whatever
 * the current theme has set. This avoids duplicating the branch palette
 * outside the design-token source of truth (globals.css).
 */
const BRANCH_CSS_VAR: Record<Branch, string> = {
  thinking: "var(--cs-branch-thinking)",
  interaction: "var(--cs-branch-interaction)",
  luck: "var(--cs-branch-luck)",
  experience: "var(--cs-branch-experience)",
};

/** Length of the radar values array — one per axis. */
export type RadarValues = readonly number[];

export interface RadarProps {
  /** Pixel width/height of the SVG (square). Defaults to 320. */
  size?: number;
  /** Primary polygon values (Game A) — one number per axis (0–10). */
  values: RadarValues;
  /** Optional overlay polygon (Game B). */
  valuesB?: RadarValues;
  /** Whether to render Game B's polygon. Defaults to `valuesB != null`. */
  showB?: boolean;
  /** Axis label font-size. Defaults to 11. */
  labelSize?: number;
  /** Whether to render axis labels. Defaults to true. */
  showLabels?: boolean;
  /** Number of background grid rings. Defaults to 5. */
  rings?: number;
  /** Opacity of the grid ring polygons (0..1). Defaults to 0.18. */
  ringOpacity?: number;
  /** Opacity of the branch-colored spokes (0..1). Defaults to 0.32. */
  spokeOpacity?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * The 12-axis radar — Cardstock's hero visualization. Spokes and vertex
 * dots are colored per axis branch (thinking, interaction, luck, experience).
 * Game A fills with a translucent ochre. Game B (optional) overlays as a
 * dashed ink outline.
 *
 * Axis order is sourced directly from `AXES` in `@/lib/scoring/axes` —
 * never duplicated here.
 *
 * Server-component compatible. If interactive hover/tooltips are wanted
 * later, wrap this in a `"use client"` component.
 */
export function Radar({
  size = 320,
  values,
  valuesB,
  showB,
  labelSize = 11,
  showLabels = true,
  rings = 5,
  ringOpacity = 0.18,
  spokeOpacity = 0.32,
  className = "",
  style,
}: RadarProps) {
  const n = AXES.length;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const shouldShowB = showB ?? valuesB != null;

  // Validate lengths in dev. Doing this defensively because a wrong-length
  // vector would silently mis-plot — better to surface it loudly.
  if (process.env.NODE_ENV !== "production") {
    if (values.length !== n) {
      console.warn(
        `Radar: expected ${n} values, got ${values.length}. Plot will be wrong.`,
      );
    }
    if (valuesB && valuesB.length !== n) {
      console.warn(
        `Radar: expected ${n} valuesB, got ${valuesB.length}. Plot will be wrong.`,
      );
    }
  }

  const angle = (i: number): number => -Math.PI / 2 + (i * 2 * Math.PI) / n;

  const point = (i: number, v: number): [number, number] => {
    const a = angle(i);
    const radius = (v / 10) * r;
    return [cx + Math.cos(a) * radius, cy + Math.sin(a) * radius];
  };

  const polyPoints = (vals: RadarValues): string =>
    vals.map((v, i) => point(i, v).join(",")).join(" ");

  // Pre-compute ring polygons (concentric polygons, not circles, to match
  // the spoke count visually).
  const ringPolys: string[] = [];
  for (let k = 1; k <= rings; k++) {
    const rr = (k / rings) * r;
    const pts: string[] = [];
    for (let i = 0; i < n; i++) {
      const a = angle(i);
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr].join(","));
    }
    ringPolys.push(pts.join(" "));
  }

  const fillA = "rgba(201,138,43,0.22)"; // tuned for light; close enough in dark
  const strokeA = "var(--cs-branch-thinking)";
  const strokeB = "var(--cs-ink)";
  const gridColor = "var(--cs-ink)";
  const labelColor = "var(--cs-ink)";

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`block ${className}`.trim()}
      style={style}
      role="img"
      aria-label="12-axis game score radar"
    >
      {/* Background rings */}
      {ringPolys.map((p, k) => (
        <polygon
          key={`ring-${k}`}
          points={p}
          fill="none"
          stroke={gridColor}
          strokeWidth={0.6}
          opacity={ringOpacity}
        />
      ))}

      {/* Branch-colored spokes */}
      {AXES.map((ax, i) => {
        const [x, y] = point(i, 10);
        return (
          <line
            key={`spoke-${ax.key}`}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke={BRANCH_CSS_VAR[ax.branch]}
            strokeWidth={0.8}
            opacity={spokeOpacity}
          />
        );
      })}

      {/* Game B polygon (dashed outline, behind A) */}
      {shouldShowB && valuesB && (
        <polygon
          points={polyPoints(valuesB)}
          fill="transparent"
          stroke={strokeB}
          strokeWidth={1.4}
          strokeDasharray="3 3"
        />
      )}

      {/* Game A polygon (filled) */}
      <polygon
        points={polyPoints(values)}
        fill={fillA}
        stroke={strokeA}
        strokeWidth={1.6}
      />

      {/* Branch-colored vertex dots */}
      {AXES.map((ax, i) => {
        const [x, y] = point(i, 10);
        return (
          <circle
            key={`vertex-${ax.key}`}
            cx={x}
            cy={y}
            r={2.4}
            fill={BRANCH_CSS_VAR[ax.branch]}
            opacity={0.9}
          />
        );
      })}

      {/* Axis labels */}
      {showLabels &&
        AXES.map((ax, i) => {
          const a = angle(i);
          const lx = cx + Math.cos(a) * (r + 16);
          const ly = cy + Math.sin(a) * (r + 16);
          const anchor: "middle" | "start" | "end" =
            Math.abs(Math.cos(a)) < 0.2
              ? "middle"
              : Math.cos(a) > 0
                ? "start"
                : "end";
          return (
            <text
              key={`label-${ax.key}`}
              x={lx}
              y={ly}
              fontSize={labelSize}
              fill={labelColor}
              textAnchor={anchor}
              dominantBaseline="middle"
              className="font-cs-mono uppercase"
              style={{ letterSpacing: "0.06em" }}
            >
              {ax.label}
            </text>
          );
        })}
    </svg>
  );
}
