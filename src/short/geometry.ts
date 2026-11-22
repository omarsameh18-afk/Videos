// Pure layout geometry (no imports) shared by the renderer (React) and scripts/ (Node checks).
// ANIMATION RULE 5: Max on the left, cards in a right column, nothing overlaps Max,
// Max's full body (shaker included) stays inside a 5% margin at every zoom.

export interface Bounds { minX: number; maxX: number; minY: number; maxY: number } // Max canvas units (800x1000)
export interface Rect { x: number; y: number; w: number; h: number }
export interface Placement { cx: number; flip: boolean; scale: number; maxZoom: number }

export const FRAME = { w: 1080, h: 1920 };
export const MARGIN = { x: 54, y: 96 }; // 5%
export const UI_RIGHT = 950; // Shorts action column starts here (right 12%)
export const FEET_Y = 1190; // Max stands here; caption band starts just below
export const MAX_SCALE = 0.903; // px per canvas unit -> ~45% of frame height
export const MAX_ZOOM = 1.15;
export const GAP = 16; // min distance between Max and a card

export const COLUMN = { x: 650, right: UI_RIGHT, top: 200 };
export const CARD_RECT: Record<string, Rect> = {
  WrongVsRight: { x: COLUMN.x, y: COLUMN.top, w: COLUMN.right - COLUMN.x, h: 420 },
  StatCard: { x: COLUMN.x, y: COLUMN.top, w: COLUMN.right - COLUMN.x, h: 560 },
  MuscleHighlight: { x: COLUMN.x, y: COLUMN.top, w: COLUMN.right - COLUMN.x, h: 560 },
};

// VISUAL RULE 2 / COMPOSITION: in visual scenes (and the hook) the visual is big and fills the top of the
// frame; Max is a ~30%-tall reactor bottom-left (mirrored, so he faces/points up at the visual); captions sit
// in a column beside his head at ~65% height; the source line goes under them. No empty bottom.
export const VISUAL_TYPES = ['AnimatedChart', 'Gauge', 'MuscleZoom', 'SplitVersus', 'BigNumber'];
export const VIS_MAIN: Rect = { x: 54, y: 150, w: 1026 - 54, h: 1000 }; // y 150-1150
export const REACTOR = { left: MARGIN.x, top: 1162, feetY: 1760, scale: 0.595, right: 440 };
export const SIDE_CAPTION: Rect = { x: 460, y: 1180, w: UI_RIGHT - 460, h: 190 };
export const SIDE_FOOTER_Y = 1392;
// Hook: big gauge inside VIS_MAIN, the question above it
export const HOOK_TEXT: Rect = { x: 54, y: 330, w: 1026 - 54, h: 130 };
export const HOOK_GAUGE = { cx: 540, cy: 1040, r: 430 };
// Ending: the loop line is the hero; Max flexing below it; handle small at the bottom
export const END_TEXT: Rect = { x: 54, y: 190, w: 1026 - 54, h: 520 };
export const END = { feetY: 1450, scale: 0.7, top: 730 };
export const END_HANDLE_Y = 1478;

export const unionBounds = (bs: Bounds[]): Bounds => ({
  minX: Math.min(...bs.map((b) => b.minX)),
  maxX: Math.max(...bs.map((b) => b.maxX)),
  minY: Math.min(...bs.map((b) => b.minY)),
  maxY: Math.max(...bs.map((b) => b.maxY)),
});

/** (side/big modes) Screen rect of Max's bounds with feet on FEET_Y. */
export const maxRect = (p: Placement, b: Bounds, zoom = 1): Rect => {
  const s = p.scale * zoom;
  const xs = [b.minX, b.maxX].map((u) => p.cx + (p.flip ? -1 : 1) * (u - 400) * s);
  const feetU = 999;
  return { x: Math.min(...xs), w: Math.abs(xs[1] - xs[0]), y: FEET_Y - (feetU - b.minY) * s, h: (b.maxY - b.minY) * s };
};

const right = (r: Rect) => r.x + r.w;

/** Place Max for a scene: as big as MAX_SCALE allows, flipped toward a card, zoom capped to fit. */
export type MaxMode = 'reactor' | 'end' | 'side' | 'big' | 'none';
export const EXPERIMENT_SCENES = ['SplitClone', 'GymSet', 'DayCounter', 'Reveal', 'ClipScene'];
// AI-clip scenes: clips sit in framed panels; captions in a band below them (~64-72%)
export const CLIP = {
  full: { x: 260, y: 200, w: 560, h: 1000 }, // 0.56 ratio (clips are 768x1376)
  split: [{ x: 54, y: 330, w: 480, h: 860 }, { x: 546, y: 330, w: 480, h: 860 }],
  topText: { x: 54, y: 70, w: 972, h: 150 },
  labelY: 250,
  captionY: 1220,
  footerY: 1480,
};
// experiment scenes: subjects stand on y 1290; captions just below their feet (~68-75% height), source under them
export const EXP_CAPTION_Y = 1300;
export const captionYFor = (t: string) => (t === 'ClipScene' ? 1505 : 1300);
// versus layout: each Max fills his half edge-to-edge, y 10%..78%; captions ~80%
export const VERSUS = { top: 192, bottom: 1498, half: 540, captionY: 1505, footerY: 1650 };
export const EXP_FOOTER_Y = 1470;
export const maxMode = (sceneType: string): MaxMode =>
  EXPERIMENT_SCENES.includes(sceneType) ? 'none' : VISUAL_TYPES.includes(sceneType) || sceneType === 'Hook' ? 'reactor' : sceneType === 'Outro' ? 'end' : CARD_RECT[sceneType] ? 'side' : 'big';
export const feetYFor = (sceneType: string) => {
  const m = maxMode(sceneType);
  return m === 'reactor' ? REACTOR.feetY : m === 'end' ? END.feetY : FEET_Y;
};

/** Screen rect of Max's bounds. Zoom is about his feet (bottom-centre of the canvas). */
export const maxRectAt = (p: Placement, b: Bounds, feetY: number, zoom = 1): Rect => {
  const s = p.scale * zoom;
  const xs = [b.minX, b.maxX].map((u) => p.cx + (p.flip ? -1 : 1) * (u - 400) * s);
  return { x: Math.min(...xs), w: Math.abs(xs[1] - xs[0]), y: feetY - (999 - b.minY) * s, h: (b.maxY - b.minY) * s };
};

/** Place Max for a scene: size per mode, flipped toward the card/visual, zoom capped so he always fits. */
export function placeMax(sceneType: string, b: Bounds): Placement {
  const mode = maxMode(sceneType);
  const card = CARD_RECT[sceneType];
  const feetY = feetYFor(sceneType);
  const flip = mode === 'reactor' || mode === 'side';
  const regionL = MARGIN.x;
  const regionR = mode === 'reactor' ? REACTOR.right : card ? card.x - GAP : UI_RIGHT;
  const regionTop = mode === 'reactor' ? REACTOR.top : mode === 'end' ? END.top : card ? MARGIN.y : MARGIN.y + 10;
  let scale = mode === 'reactor' ? REACTOR.scale : mode === 'end' ? END.scale : MAX_SCALE;
  if ((b.maxX - b.minX) * scale > regionR - regionL) scale = (regionR - regionL) / (b.maxX - b.minX);
  if ((999 - b.minY) * scale > feetY - regionTop) scale = (feetY - regionTop) / (999 - b.minY);
  const r0 = maxRectAt({ cx: 0, flip, scale, maxZoom: 1 }, b, feetY);
  const cx = mode === 'reactor' || mode === 'side' ? regionL - r0.x : (regionL + regionR) / 2 - (r0.x + r0.w / 2);
  const p: Placement = { cx, flip, scale, maxZoom: 1 };
  let z = MAX_ZOOM;
  for (; z > 1; z -= 0.005) {
    const r = maxRectAt(p, b, feetY, z);
    if (r.x >= regionL && r.x + r.w <= regionR && r.y >= regionTop && feetY <= FRAME.h - MARGIN.y) break;
  }
  p.maxZoom = Math.max(1, Math.round(z * 1000) / 1000);
  return p;
}

export const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
