import { SAFE } from '../config';
import { CARD_RECT, COLUMN, FEET_Y } from './geometry';

export { CARD_RECT, COLUMN, FEET_Y };
// Caption band: fixed, just below Max's feet (~63-70% of frame height); never over Max.
export const CAPTION_Y = FEET_Y + 14;
export const CAPTION_H = 160;
export const FOOTER_Y = SAFE.bottomY - 56; // small source line
export const CONTENT = { x: SAFE.x, width: SAFE.width, centerX: SAFE.centerX, top: SAFE.y + 10 };
