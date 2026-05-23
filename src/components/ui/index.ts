/**
 * Cardstock UI primitives.
 *
 * Re-exports the six base components used across every Cardstock screen.
 * Import sites can do `import { Paper, Btn, Radar } from "@/components/ui"`.
 */

export { Paper, type PaperProps, type PaperTone } from "./paper";
export { Stamp, type StampProps, type StampColor } from "./stamp";
export { Btn, type BtnProps, type BtnTone, type BtnSize } from "./btn";
export { Chip, type ChipProps } from "./chip";
export { BoxCover, type BoxCoverProps } from "./box-cover";
export { Radar, type RadarProps, type RadarValues } from "./radar";
