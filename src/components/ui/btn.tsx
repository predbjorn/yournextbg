import {
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ReactNode,
} from "react";

/**
 * Button tone.
 *
 *  - `primary`: ink surface, paper label (default action)
 *  - `ghost`:   transparent surface, ink label with subtle border
 *  - `accent`:  branch-thinking (warm gold/ochre) surface
 */
export type BtnTone = "primary" | "ghost" | "accent";

/** Button size — picks padding + font-size. */
export type BtnSize = "sm" | "md" | "lg";

const TONE_CLASS: Record<BtnTone, string> = {
  primary: "bg-cs-ink text-cs-paper border-0",
  ghost: "bg-transparent text-cs-ink border border-cs-ink/30",
  // Use inline style for the accent text-color so it flips with theme
  // (gold on light ink, gold on deep paper in dark mode).
  accent: "bg-cs-branch-thinking border-0 text-cs-ink",
};

const SIZE: Record<BtnSize, { padding: string; fontSize: number }> = {
  sm: { padding: "7px 10px", fontSize: 9.5 },
  md: { padding: "10px 14px", fontSize: 10 },
  lg: { padding: "13px 20px", fontSize: 11 },
};

export interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: BtnTone;
  size?: BtnSize;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

/**
 * Cardstock button. Mono uppercase label, wide letter-spacing, 8px radius.
 * Defaults to `type="button"` to avoid accidental form submissions when
 * used outside a `<form>`.
 */
export function Btn({
  tone = "primary",
  size = "md",
  className = "",
  style,
  type,
  children,
  ...rest
}: BtnProps) {
  const s = SIZE[size];
  return (
    <button
      // Default to type="button". If consumer explicitly passes `type` (e.g.,
      // "submit" inside a form), that wins.
      type={type ?? "button"}
      className={`font-cs-mono font-medium uppercase rounded-lg cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed ${TONE_CLASS[tone]} ${className}`.trim()}
      style={{
        padding: s.padding,
        fontSize: s.fontSize,
        letterSpacing: "0.18em",
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
