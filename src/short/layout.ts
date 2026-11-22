import { SAFE, VIDEO } from '../config';

export const W = VIDEO.width;
export const H = VIDEO.height;

// Max: always big (>= 45% of frame height). Feet stand on MAX_FEET_Y, just above the caption band.
export const MAX_FEET_Y = 1190;
export const MAX_W = 760; // canvas width; canvas is 800x1000 units, figure ~94% of canvas height
export const MAX_CANVAS_H = MAX_W * 1.25;

// Caption band: fixed, ~65% of frame height, below Max's feet.
export const CAPTION_Y = MAX_FEET_Y + 14;
export const CAPTION_H = 160;
export const FOOTER_Y = SAFE.bottomY - 56; // source footer
export const CONTENT = { x: SAFE.x, width: SAFE.width, centerX: SAFE.centerX, top: SAFE.y + 10 };

// Right-hand card column (Max stands on the left when a card is on screen).
export const COLUMN = { x: 566, width: SAFE.x + SAFE.width - 566, top: SAFE.y + 50 };

export interface Placement { cx: number; flip: boolean }
export const MAX_PLACEMENT: Record<string, Placement> = {
  Hook: { cx: SAFE.centerX, flip: false },
  WrongVsRight: { cx: 292, flip: true }, // mirrored so he faces/points at the cards
  StatCard: { cx: 292, flip: true },
  MuscleHighlight: { cx: 292, flip: true },
  Outro: { cx: SAFE.centerX, flip: false },
};
