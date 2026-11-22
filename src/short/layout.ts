import { SAFE, VIDEO } from '../config';

// Fixed regions inside the Shorts safe zone.
export const CAPTION_H = 180;
export const CAPTION_Y = SAFE.bottomY - 64 - CAPTION_H; // caption block sits just above the source footer
export const FOOTER_Y = SAFE.bottomY - 56; // source footer top
export const CONTENT = { x: SAFE.x, width: SAFE.width, centerX: SAFE.centerX, top: SAFE.y + 40 };

// Where Max stands in each scene type (centre x, top y, width of his 800x1000 canvas).
export interface Placement { cx: number; top: number; width: number }
export const MAX_PLACEMENT: Record<string, Placement> = {
  Hook: { cx: SAFE.centerX, top: 620, width: 820 },
  WrongVsRight: { cx: 290, top: 1010, width: 600 },
  StatCard: { cx: 290, top: 1010, width: 600 },
  MuscleHighlight: { cx: 290, top: 1010, width: 600 },
  Outro: { cx: SAFE.centerX, top: 600, width: 860 },
};
export const W = VIDEO.width;
export const H = VIDEO.height;
