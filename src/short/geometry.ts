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
// text at the top of no-card scenes (Max must stay below it)
export const TOP_TEXT_BOTTOM: Record<string, number> = { Outro: 270 };

// VISUAL RULE 2: in visual scenes the visual is the star; Max shrinks to the bottom-right corner.
export const VISUAL_TYPES = ['AnimatedChart', 'Gauge', 'MuscleZoom', 'SplitVersus', 'BigNumber'];
export const VIS_MAIN: Rect = { x: 54, y: 150, w: UI_RIGHT - 54, h: 700 }; // the visual itself (y 150-850)
export const VIS_LOW: Rect = { x: 54, y: 880, w: 560, h: 300 }; // its labels / legend (lower-left)
export const CORNER = { left: 640, top: 860, scale: 0.33 };
// Hook: gauge interrupt on top, Max (medium-big) underneath
export const HOOK_GAUGE = { cx: 502, cy: 600, r: 320 };
export const HOOK_TEXT: Rect = { x: 54, y: 140, w: UI_RIGHT - 54, h: 120 };
export const HOOK = { top: 612, scale: 0.6 };

export const unionBounds = (bs: Bounds[]): Bounds => ({
  minX: Math.min(...bs.map((b) => b.minX)),
  maxX: Math.max(...bs.map((b) => b.maxX)),
  minY: Math.min(...bs.map((b) => b.minY)),
  maxY: Math.max(...bs.map((b) => b.maxY)),
});

/** Screen rect of Max's bounds. Zoom is about his feet (bottom-centre of the canvas). */
export const maxRect = (p: Placement, b: Bounds, zoom = 1): Rect => {
  const s = p.scale * zoom;
  const xs = [b.minX, b.maxX].map((u) => p.cx + (p.flip ? -1 : 1) * (u - 400) * s);
  const feetU = 999;
  return { x: Math.min(...xs), w: Math.abs(xs[1] - xs[0]), y: FEET_Y - (feetU - b.minY) * s, h: (b.maxY - b.minY) * s };
};

const right = (r: Rect) => r.x + r.w;

/** Place Max for a scene: as big as MAX_SCALE allows, flipped toward a card, zoom capped to fit. */
export function placeMax(sceneType: string, b: Bounds): Placement {
  const card = CARD_RECT[sceneType];
  const corner = VISUAL_TYPES.includes(sceneType);
  const hook = sceneType === 'Hook';
  const flip = !!card;
  const regionL = corner ? CORNER.left : MARGIN.x;
  const regionR = card ? card.x - GAP : UI_RIGHT;
  const regionTop = corner ? CORNER.top : hook ? HOOK.top : card ? MARGIN.y : (TOP_TEXT_BOTTOM[sceneType] ?? MARGIN.y) + 10;
  let scale = corner ? CORNER.scale : hook ? HOOK.scale : MAX_SCALE;
  const width = (b.maxX - b.minX) * scale;
  if (width > regionR - regionL) scale = (regionR - regionL) / (b.maxX - b.minX);
  // horizontal: hug the left margin next to a card, else centre in the region
  const probe: Placement = { cx: 0, flip, scale, maxZoom: 1 };
  const r0 = maxRect(probe, b);
  const cx = card ? regionL - r0.x : corner ? regionR - 4 - (r0.x + r0.w) : (regionL + regionR) / 2 - (r0.x + r0.w / 2);
  const p: Placement = { cx, flip, scale, maxZoom: 1 };
  // largest zoom (<= MAX_ZOOM) that keeps every edge inside the region
  let z = MAX_ZOOM;
  for (; z > 1; z -= 0.005) {
    const r = maxRect(p, b, z);
    if (r.x >= regionL && right(r) <= regionR && r.y >= regionTop) break;
  }
  p.maxZoom = Math.max(1, Math.round(z * 1000) / 1000);
  return p;
}

export const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
