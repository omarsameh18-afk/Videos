import React from 'react';
import {easeIn, easeOut, popIn, popOut, wobble} from './anim';

export const INK = '#2d1c14'; // dark-brown outline, matches the generated art

// scale for an element shown during [t0, t1): pops in at t0, pops out at t1
export const showScale = (t: number, t0: number, t1: number, inDur = 0.28, outDur = 0.16) =>
  t < t0 ? 0 : t < t1 ? popIn(t - t0, inDur) : popOut(t - t1, outDur);

export const Star: React.FC<{x: number; y: number; r: number; fill?: string; rot?: number}> = ({x, y, r, fill = '#ffe066', rot = 0}) => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + (rot * Math.PI) / 180 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r;
    pts.push(`${x + rr * Math.cos(a)},${y + rr * Math.sin(a)}`);
  }
  return <polygon points={pts.join(' ')} fill={fill} stroke={INK} strokeWidth={r * 0.14} strokeLinejoin="round" />;
};

export const Sparkle: React.FC<{x: number; y: number; dt: number; r?: number}> = ({x, y, dt, r = 40}) => {
  if (dt < 0 || dt > 0.7) return null;
  const s = dt < 0.15 ? easeOut(dt / 0.15) : 1 - easeIn((dt - 0.15) / 0.55);
  return (
    <g transform={`translate(${x} ${y}) rotate(${dt * 120}) scale(${s})`}>
      <path d={`M0 ${-r} Q ${r * 0.15} ${-r * 0.15} ${r} 0 Q ${r * 0.15} ${r * 0.15} 0 ${r} Q ${-r * 0.15} ${r * 0.15} ${-r} 0 Q ${-r * 0.15} ${-r * 0.15} 0 ${-r} Z`}
        fill="#fff6c2" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    </g>
  );
};

export const SweatDrop: React.FC<{x: number; y: number; dt: number; s?: number}> = ({x, y, dt, s = 1}) => {
  if (dt < 0 || dt > 1.1) return null;
  const sc = dt < 0.85 ? popIn(dt, 0.2) : popOut(dt - 0.85);
  const yy = y + easeIn(Math.min(1, Math.max(0, (dt - 0.2) / 0.7))) * 60;
  return (
    <g transform={`translate(${x} ${yy}) scale(${sc * s})`}>
      <path d="M 0 -60 C 25 -20 42 5 42 28 C 42 54 22 70 0 70 C -22 70 -42 54 -42 28 C -42 5 -25 -20 0 -60 Z" fill="#8fd6ff" stroke={INK} strokeWidth={8} />
      <ellipse cx={-14} cy={30} rx={9} ry={15} fill="#ffffff" />
    </g>
  );
};

// cubic-bezier path helper with arc-length lookup (for characters walking along a path)
export type P = [number, number];
export const bezierPath = (segs: [P, P, P, P][]) => {
  const pts: P[] = [];
  for (const [a, b, c, d] of segs)
    for (let i = 0; i <= 60; i++) {
      const u = i / 60, v = 1 - u;
      pts.push([v * v * v * a[0] + 3 * v * v * u * b[0] + 3 * v * u * u * c[0] + u * u * u * d[0],
        v * v * v * a[1] + 3 * v * v * u * b[1] + 3 * v * u * u * c[1] + u * u * u * d[1]]);
    }
  const acc = [0];
  for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = acc[acc.length - 1];
  const at = (u: number) => {
    const L = Math.max(0, Math.min(1, u)) * total;
    let i = acc.findIndex((x) => x >= L); if (i <= 0) i = 1;
    const f = (L - acc[i - 1]) / (acc[i] - acc[i - 1] || 1);
    const x = pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, y = pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f;
    const ang = (Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]) * 180) / Math.PI;
    return {x, y, ang};
  };
  const d = segs.map(([a, b, c, dd], i) => `${i === 0 ? `M ${a[0]} ${a[1]} ` : ''}C ${b[0]} ${b[1]} ${c[0]} ${c[1]} ${dd[0]} ${dd[1]}`).join(' ');
  return {at, d, total};
};

export {wobble};
