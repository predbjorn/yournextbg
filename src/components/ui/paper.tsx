import { type CSSProperties, type ReactNode } from "react";

/**
 * Surface tone for the Paper primitive.
 *
 *  - `paper`: default Cardstock surface
 *  - `warm`:  slightly warmer paper (used for inputs, secondary cards)
 *  - `deep`:  the page background tone (darker, behind everything else)
 *  - `felt`:  the heaviest paper tone (used for inset / pressed areas)
 *  - `ink`:   inverted — dark surface with paper-colored text
 */
export type PaperTone = "paper" | "warm" | "deep" | "felt" | "ink";

const TONE_CLASS: Record<PaperTone, string> = {
  paper: "bg-cs-paper text-cs-ink",
  warm: "bg-cs-paper-warm text-cs-ink",
  deep: "bg-cs-paper-deep text-cs-ink",
  felt: "bg-cs-paper-felt text-cs-ink",
  ink: "bg-cs-ink text-cs-paper",
};

export interface PaperProps {
  tone?: PaperTone;
  /** Apply the .cs-grain noise overlay (default true). */
  grain?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

/**
 * Cardstock paper surface. Provides a tone-aware background, the subtle
 * embossed shadow, and an optional grain texture overlay.
 *
 * The grain overlay is rendered by the `.cs-grain::before` pseudo-element
 * (defined in globals.css), which is absolutely positioned across the
 * surface. Because that pseudo has no z-index, children would render
 * at the same stacking level — so we wrap children in `relative z-10`
 * to guarantee they sit above the grain.
 */
export function Paper({
  tone = "paper",
  grain = true,
  className = "",
  style,
  children,
}: PaperProps) {
  const grainClass = grain ? "cs-grain" : "";
  return (
    <div
      className={`relative ${TONE_CLASS[tone]} ${grainClass} ${className}`.trim()}
      style={{
        boxShadow:
          "inset 0 0 0 1px rgba(28,26,20,0.08), 0 2px 0 rgba(28,26,20,0.10)",
        ...style,
      }}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}
