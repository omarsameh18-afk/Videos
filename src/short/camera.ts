import { spring } from 'remotion';

// Camera punch-in level (0 = 100%, 1 = punched in) at a frame, from the zoom keys.
export const punchAt = (zoomKeys: { at: number; scale: number }[], frame: number, fps: number) => {
  let i = -1;
  while (i + 1 < zoomKeys.length && zoomKeys[i + 1].at <= frame) i++;
  if (i < 0) return 0;
  const to = zoomKeys[i].scale > 1 ? 1 : 0;
  const from = i > 0 && zoomKeys[i - 1].scale > 1 ? 1 : 0;
  const t = spring({ frame: frame - zoomKeys[i].at, fps, config: { damping: 14, stiffness: 320 } });
  return from + (to - from) * t;
};

// a quick pulse (0 -> 1 -> 0) on every zoom key, used to "punch" cards that must not grow
export const pulseAt = (zoomKeys: { at: number }[], frame: number, fps: number) => {
  const k = [...zoomKeys].reverse().find((z) => z.at <= frame && z.at > 0);
  if (!k) return 0;
  const d = frame - k.at;
  return d < 0 || d > fps * 0.4 ? 0 : Math.sin((d / (fps * 0.4)) * Math.PI);
};
