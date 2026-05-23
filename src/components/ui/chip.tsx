import {
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ReactNode,
} from "react";

export interface ChipProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Whether the chip is in the "on" / selected state. */
  on?: boolean;
  /** If true, render as a non-interactive <span> instead of a <button>. */
  asTag?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

const BASE = "font-cs-mono uppercase rounded-full inline-flex items-center";
const ON_CLASS = "bg-cs-ink text-cs-paper border-0";
const OFF_CLASS = "bg-transparent text-cs-ink border border-cs-ink/20";

const INLINE_STYLE: CSSProperties = {
  fontSize: 9.5,
  letterSpacing: "0.16em",
  padding: "5px 9px",
};

/**
 * Cardstock chip — pill toggle used for filters, lens picks, and status
 * tags. By default renders as a button (clickable toggle); pass `asTag`
 * to render as a static <span> for inline tag-style use.
 */
export function Chip({
  on = false,
  asTag = false,
  className = "",
  style,
  children,
  type,
  ...rest
}: ChipProps) {
  const tone = on ? ON_CLASS : OFF_CLASS;
  const merged: CSSProperties = { ...INLINE_STYLE, ...style };

  if (asTag) {
    // Static tag. Strip button-only props to avoid leaking onto a span.
    return (
      <span
        className={`${BASE} ${tone} ${className}`.trim()}
        style={merged}
      >
        {children}
      </span>
    );
  }

  return (
    <button
      type={type ?? "button"}
      aria-pressed={on}
      className={`${BASE} ${tone} cursor-pointer transition-opacity hover:opacity-80 ${className}`.trim()}
      style={merged}
      {...rest}
    >
      {children}
    </button>
  );
}
