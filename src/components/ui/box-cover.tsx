import { type CSSProperties } from "react";

/**
 * A placeholder game-cover tile. Two-color palette is hashed from the title
 * so the same game always lands on the same palette across renders. Used
 * anywhere we need a cover-shaped tile and don't have (or don't want) the
 * real cover art — e.g., the lens picker, the "similar games" strip.
 *
 * Server-component compatible: palette selection is deterministic from
 * the title string, no theme detection at render time. The light-mode
 * palette set is used for both light and dark themes for now — these
 * are decorative tiles, not load-bearing imagery. (A theme-aware variant
 * can be added later if needed via a `theme` prop or a client wrapper.)
 */

const PALETTES: ReadonlyArray<readonly [bg: string, fg: string]> = [
  ["#7a3d2c", "#f3e0c1"],
  ["#2a4f3e", "#e3eac0"],
  ["#3d3a5c", "#e3d8c0"],
  ["#7a5a2c", "#f3e6c5"],
  ["#5c2c4f", "#e6c5d3"],
  ["#2c4a5c", "#c5d8e3"],
  ["#5c3826", "#f0d8b6"],
  ["#283c2c", "#cfd9b4"],
];

function paletteFor(title: string): readonly [string, string] {
  let sum = 0;
  for (let i = 0; i < title.length; i++) sum += title.charCodeAt(i);
  return PALETTES[sum % PALETTES.length] ?? PALETTES[0];
}

export interface BoxCoverProps {
  title: string;
  /** Year stamped in the top corner. Optional; hidden if omitted. */
  year?: number | null;
  /** Tile height in pixels. Defaults to 100. */
  height?: number;
  /** Border radius in pixels. Defaults to 6. */
  radius?: number;
  className?: string;
  style?: CSSProperties;
}

export function BoxCover({
  title,
  year,
  height = 100,
  radius = 6,
  className = "",
  style,
}: BoxCoverProps) {
  const [bg, fg] = paletteFor(title);
  const fontSize =
    height > 200 ? 28 : height > 130 ? 20 : height > 90 ? 16 : 12;

  return (
    <div
      className={`relative overflow-hidden flex flex-col justify-between ${className}`.trim()}
      style={{
        height,
        borderRadius: radius,
        background: bg,
        color: fg,
        padding: 10,
        backgroundImage:
          "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.12), transparent 60%), radial-gradient(circle at 80% 80%, rgba(0,0,0,0.18), transparent 50%)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
        ...style,
      }}
    >
      {/* Repeating stripe — meant to evoke a printed band on the cover. */}
      <div
        style={{
          position: "absolute",
          top: "35%",
          left: -8,
          right: -8,
          height: 18,
          background:
            "repeating-linear-gradient(90deg, rgba(0,0,0,0.18) 0 5px, transparent 5px 10px)",
          opacity: 0.55,
        }}
      />
      {/* Solid bar accent under the stripe. */}
      <div
        style={{
          position: "absolute",
          top: "45%",
          left: -8,
          right: -8,
          height: 6,
          background: fg,
          opacity: 0.18,
        }}
      />
      {year != null && (
        <div
          className="font-cs-mono uppercase"
          style={{
            fontSize: 8,
            letterSpacing: "0.22em",
            opacity: 0.75,
            position: "relative",
            zIndex: 1,
          }}
        >
          {year}
        </div>
      )}
      <div
        className="font-cs-display uppercase"
        style={{
          fontSize,
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: "-0.01em",
          position: "relative",
          zIndex: 1,
          textShadow: "0 1px 0 rgba(0,0,0,0.3)",
        }}
      >
        {title}
      </div>
    </div>
  );
}
