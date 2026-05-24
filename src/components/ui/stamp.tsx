import { type CSSProperties, type ReactNode } from "react";

/**
 * Stamp color tone. Maps to a Cardstock CSS variable. `current` inherits
 * the surrounding text color (useful when nesting inside an inverted
 * Paper, for example).
 */
export type StampColor =
  | "ink"
  | "muted"
  | "muted-soft"
  | "paper"
  | "thinking"
  | "interaction"
  | "luck"
  | "experience"
  | "positive"
  | "negative"
  | "current";

const COLOR_CLASS: Record<StampColor, string> = {
  ink: "text-cs-ink",
  muted: "text-cs-muted",
  "muted-soft": "text-cs-muted-soft",
  paper: "text-cs-paper",
  thinking: "text-cs-branch-thinking",
  interaction: "text-cs-branch-interaction",
  luck: "text-cs-branch-luck",
  experience: "text-cs-branch-experience",
  positive: "text-cs-positive",
  negative: "text-cs-negative",
  current: "",
};

export interface StampProps {
  /** Label color. Defaults to ink. */
  color?: StampColor;
  /** Pixel font-size. Defaults to 10. */
  size?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

/**
 * Small-caps mono label used for stamps, axis labels, tag chips, etc.
 * Wide letter-spacing, uppercase, slightly dimmed by default.
 */
export function Stamp({
  color = "ink",
  size = 10,
  className = "",
  style,
  children,
}: StampProps) {
  return (
    <span
      className={`font-cs-mono uppercase opacity-85 ${COLOR_CLASS[color]} ${className}`.trim()}
      style={{
        fontSize: size,
        letterSpacing: "0.22em",
        ...style,
      }}
    >
      {children}
    </span>
  );
}
