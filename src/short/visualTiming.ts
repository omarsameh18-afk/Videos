// Pure timing helpers shared by visuals (React) and the pacing engine (Node), so SFX land on visual beats.
export const CHART = { drawStart: 6, drawFrac: 0.78 }; // lines draw from frame 6 over 78% of the scene
export const chartMarkerFrame = (duration: number, ticks: number, at: number) =>
  Math.round(CHART.drawStart + (duration - CHART.drawStart) * CHART.drawFrac * (at / Math.max(1, ticks - 1)));
export const GAUGE_SLAM = 6; // frame the needle hits its target (< 0.4 s)
export const NUMBER_LAND = 18;
