import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FPS, INK, clamp, easeIn, easeInOut, easeOut, lerp, popIn, popOut, rand, seg, wobble} from './lib';

export const DURATION_S = 25.0;
const f = (p: string) => staticFile(`woodpecker/${p}`);

// ---------------------------------------------------------------- beats (comp seconds; voice placed at 0.1 s)
const VO_AT = 0.1;
const T = {
  turn1: 4.3, bubble: 4.95, qmark: 5.45, turn2: 6.35, spring: 7.95, bust: 9.6,
  rec: 9.75, xray: 9.85, leanBack0: 9.95, leanBack1: 11.2, slowHit: 11.8, unit: 12.45, release: 13.25,
  hammerIn: 13.7, hammerHit: 14.25, recOff: 14.6,
  pillow: 14.85, pillowPecks: [15.55, 16.05, 16.55, 17.05], sweat: 17.15, pillowOff: 17.9,
  zoom0: 17.92, zoom1: 19.2, xray2: 18.85, size: 19.3,
  cut: 20.05, back0: 21.9, go: 22.45, impact: 23.3, smug: 23.75,
};
const FAST_HITS: number[] = [];
for (const [start, n] of [[0.3, 8], [1.75, 8], [3.0, 6]] as const) for (let k = 0; k < n; k++) FAST_HITS.push(start + k * 0.13);

// ---------------------------------------------------------------- sprite geometry (trimmed sprite px, from prep.py)
const SPR = {w: 1447, h: 2450};
const S = 0.42; // sprite px -> world px
const BX = 70, BY = 640; // sprite top-left in the world
const PIV = {x: 1414, y: 1178}; // between the two claws: pecks rotate about the grip
const BEAK = {x: 1257, y: 139};
const HEAD = {x: 500, y: 330}; // x-ray circle centre (sprite px)
const TRUNK_L = 650, TRUNK_R = 1010;
const REST = -2, HIT = 8.5, PILLOW_REST = -8, PILLOW_HIT = 1.2;

const toWorld = (lx: number, ly: number, angDeg: number) => {
  const a = (angDeg * Math.PI) / 180, dx = (lx - PIV.x) * S, dy = (ly - PIV.y) * S;
  return {x: BX + PIV.x * S + dx * Math.cos(a) - dy * Math.sin(a), y: BY + PIV.y * S + dx * Math.sin(a) + dy * Math.cos(a)};
};
const HOLE = (() => { const p = toWorld(BEAK.x, BEAK.y, HIT); return {x: TRUNK_L + 12, y: p.y}; })();
const HAMMER = {w: 1305, h: 1781, s: 0.19, pivX: 928, pivY: 1768, tilt: 10.5, at: {x: 362, y: 455}};

// ---------------------------------------------------------------- peck motion
const pulse = (dt: number, a = 0.065, b = 0.07) => {
  if (dt < -a || dt > b) return 0;
  if (dt <= 0) { const u = (dt + a) / a; return u * u; }
  const u = dt / b; return (1 - u) * (1 - u);
};
const pillowPulse = (t: number) => Math.max(0, ...T.pillowPecks.map((h) => pulse(t - h, 0.16, 0.2)));
const birdAngle = (t: number) => {
  let ang = REST;
  for (const h of FAST_HITS) ang = Math.max(ang, REST + (HIT - REST) * pulse(t - h));
  // slow-motion peck: lean back, slow swing, sudden stop, held
  if (t >= T.leanBack0 && t < T.release + 0.35) {
    if (t < T.leanBack1) ang = lerp(REST, -7, easeInOut(seg(t, T.leanBack0, T.leanBack1)));
    else if (t < T.slowHit) ang = lerp(-7, HIT, easeIn(seg(t, T.leanBack1, T.slowHit)));
    else if (t < T.release) ang = HIT;
    else ang = lerp(HIT, REST, easeInOut(seg(t, T.release, T.release + 0.35)));
  }
  // hammer-synced peck
  if (t >= T.hammerIn + 0.05 && t < T.hammerHit + 0.35) {
    if (t < T.hammerIn + 0.35) ang = lerp(REST, -6, easeOut(seg(t, T.hammerIn + 0.05, T.hammerIn + 0.35)));
    else if (t < T.hammerHit) ang = lerp(-6, HIT, easeIn(seg(t, T.hammerIn + 0.35, T.hammerHit)));
    else ang = lerp(HIT, REST, easeOut(seg(t, T.hammerHit, T.hammerHit + 0.35)));
  }
  if (t > T.pillow - 0.3 && t < T.pillowOff + 0.5) {
    const lean = t < T.pillowOff ? easeInOut(seg(t, T.pillow - 0.3, T.pillow)) : 1 - easeInOut(seg(t, T.pillowOff, T.pillowOff + 0.5));
    const base = lerp(REST, PILLOW_REST, lean);
    ang = base + (PILLOW_HIT - PILLOW_REST) * pillowPulse(t);
  }
  return ang;
};
const REAL_HITS = [...FAST_HITS, T.slowHit, T.hammerHit];

// ---------------------------------------------------------------- camera
type Cam = {x: number; y: number; z: number};
const CAM_KEYS: [number, number, Cam][] = [
  // [t0, t1, target]  glide from previous value to target during [t0, t1]
  [0, 3.9, {x: 535, y: 1000, z: 150}],
  [4.35, 5.2, {x: 500, y: 860, z: 0}],
  [9.7, 10.6, {x: 480, y: 830, z: 230}],
  [13.45, 13.95, {x: 470, y: 800, z: 60}],
  [14.7, 15.25, {x: 500, y: 880, z: 210}],
  [T.zoom0, T.zoom1, {x: 330, y: 790, z: 580}],
];
const CAM0: Cam = {x: 530, y: 1000, z: 90};
const camAt = (t: number): Cam => {
  let c = CAM0;
  for (const [t0, t1, to] of CAM_KEYS) {
    if (t <= t0) break;
    const u = easeInOut(seg(t, t0, t1));
    const k0 = 1000 / (1000 - c.z), k1 = 1000 / (1000 - to.z);
    const k = Math.exp(lerp(Math.log(k0), Math.log(k1), u)); // even zoom
    c = {x: lerp(c.x, to.x, u), y: lerp(c.y, to.y, u), z: 1000 - 1000 / k};
  }
  return c;
};
const shake = (t: number) => {
  let amp = 0;
  for (const h of FAST_HITS) if (t >= h) amp += 2.5 * Math.exp(-22 * (t - h));
  for (const [h, a, d] of [[T.slowHit, 16, 7], [T.hammerHit, 11, 8], [T.impact, 24, 6]]) if (t >= h) amp += a * Math.exp(-d * (t - h));
  return {
    x: (amp * (Math.sin(2 * Math.PI * 13.3 * t) + 0.6 * Math.sin(2 * Math.PI * 7.1 * t + 1))) / 1.6,
    y: (amp * (Math.sin(2 * Math.PI * 11.7 * t + 2) + 0.5 * Math.sin(2 * Math.PI * 5.3 * t))) / 1.5,
  };
};

const Layer: React.FC<{cam: Cam; z: number; blur?: number; minDepth?: number; children: React.ReactNode}> = ({cam, z, blur = 0, minDepth = 300, children}) => {
  const d = z - cam.z;
  if (d < minDepth) return null;
  const k = 1000 / d;
  return (
    <AbsoluteFill style={{filter: blur > 0.05 ? `blur(${blur}px)` : undefined}}>
      <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0',
        transform: `translate(540px, 960px) scale(${k}) translate(${-cam.x}px, ${-cam.y}px)`}}>{children}</div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- scenery (flat shapes, black outlines)
const Sky: React.FC = () => <AbsoluteFill style={{background: 'linear-gradient(180deg, #7cc8f7 0%, #b9e3fb 55%, #e4f6ff 100%)'}} />;

const Cloud: React.FC<{x: number; y: number; s: number; sw: number}> = ({x, y, s, sw}) => {
  const c = [[0, 0, 120], [-130, 30, 90], [130, 25, 95], [-60, -50, 85], [70, -55, 80]];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {c.map(([cx, cy, r], i) => <circle key={`o${i}`} cx={cx} cy={cy} r={r + sw} fill={INK} />)}
      {c.map(([cx, cy, r], i) => <circle key={`f${i}`} cx={cx} cy={cy} r={r} fill="#ffffff" />)}
      <ellipse cx={0} cy={40} rx={200} ry={40} fill="#e3f1fb" />
    </g>
  );
};

const FarHills: React.FC = () => (
  <svg width={6000} height={7000} viewBox="-2500 -2500 6000 7000" style={{position: 'absolute', left: -2500, top: -2500, overflow: 'visible'}}>
    <Cloud x={-500} y={-350} s={1.6} sw={14} />
    <Cloud x={1700} y={150} s={1.3} sw={16} />
    <Cloud x={500} y={-1300} s={1.1} sw={18} />
    <path d="M -2500 2700 C -1700 2150 -900 2250 -300 2550 C 300 2150 1200 2050 1900 2450 C 2500 2150 3100 2250 3500 2450 L 3500 4500 L -2500 4500 Z"
      fill="#a6dd8f" stroke={INK} strokeWidth={18} />
    <path d="M -2500 3000 C -1500 2700 -500 2850 300 3050 C 1100 2750 2200 2700 3500 2950 L 3500 4500 L -2500 4500 Z"
      fill="#84cc6f" stroke={INK} strokeWidth={18} />
  </svg>
);

const MidTrees: React.FC = () => {
  const trees = [-900, -480, -60, 360, 780, 1200, 1620, 2040];
  return (
    <svg width={4000} height={2400} viewBox="-1200 1500 4000 2400" style={{position: 'absolute', left: -1200, top: 1500, overflow: 'visible'}}>
      {trees.map((x, i) => {
        const y = 2330 + (i % 2) * 110, r = 250 + (i % 3) * 40;
        return (
          <g key={i}>
            <rect x={x - 38} y={y} width={76} height={900} fill="#8a5a33" stroke={INK} strokeWidth={13} />
            <circle cx={x} cy={y} r={r} fill="#57ab4f" stroke={INK} strokeWidth={13} />
            <circle cx={x + r * 0.28} cy={y + r * 0.22} r={r * 0.55} fill="#4b9a45" />
          </g>
        );
      })}
      <rect x={-1200} y={2700} width={4000} height={1300} fill="#57ab4f" />
    </svg>
  );
};

const Trunk: React.FC<{x0: number; x1: number; y0: number; y1: number; hole?: number}> = ({x0, x1, y0, y1, hole = 0}) => {
  const w = x1 - x0;
  const bark = [[0.25, 0.1], [0.6, 0.22], [0.35, 0.38], [0.7, 0.5], [0.22, 0.63], [0.55, 0.78], [0.4, 0.92]];
  return (
    <svg width={w + 40} height={y1 - y0} viewBox={`${x0 - 20} ${y0} ${w + 40} ${y1 - y0}`} style={{position: 'absolute', left: x0 - 20, top: y0, overflow: 'visible'}}>
      <rect x={x0} y={y0 - 20} width={w} height={y1 - y0 + 40} fill="#a0703f" stroke={INK} strokeWidth={8} />
      <rect x={x0 + w * 0.68} y={y0 - 16} width={w * 0.32 - 4} height={y1 - y0 + 32} fill="#87592f" />
      {bark.map(([bx, by], i) => {
        const yy = y0 + (y1 - y0) * by;
        return <path key={i} d={`M ${x0 + w * bx} ${yy} q 18 70 0 150`} fill="none" stroke="#6b4423" strokeWidth={9} strokeLinecap="round" />;
      })}
      {hole > 0 && (
        <g>
          <ellipse cx={HOLE.x + 4} cy={HOLE.y} rx={28 * hole} ry={36 * hole} fill={INK} />
          <ellipse cx={HOLE.x + 7} cy={HOLE.y + 3} rx={20 * hole} ry={27 * hole} fill="#3a2414" />
        </g>
      )}
    </svg>
  );
};

const ForeLeaves: React.FC = () => {
  const leaves = [[260, 380, 20], [330, 470, -30], [180, 470, 60], [420, 410, 5], [110, 400, 35]];
  return (
    <svg width={700} height={600} viewBox="0 150 700 600" style={{position: 'absolute', left: 1240, top: 120, overflow: 'visible', transform: 'scaleX(-1)'}}>
      <path d="M -40 300 C 120 360 280 400 460 420" fill="none" stroke={INK} strokeWidth={22} strokeLinecap="round" />
      <path d="M -40 300 C 120 360 280 400 460 420" fill="none" stroke="#7a4d2a" strokeWidth={12} strokeLinecap="round" />
      {leaves.map(([x, y, r], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
          <ellipse rx={78} ry={36} fill="#4fa34a" stroke={INK} strokeWidth={6} />
          <path d="M -70 0 L 70 0" stroke="#3b8137" strokeWidth={5} />
        </g>
      ))}
    </svg>
  );
};

// ---------------------------------------------------------------- effects
const Chips: React.FC<{t: number}> = ({t}) => {
  const out: React.ReactNode[] = [];
  REAL_HITS.forEach((h, hi) => {
    const slow = h === T.slowHit ? 0.35 : 1;
    const dt = (t - h) * slow;
    const n = h === T.slowHit ? 9 : 4;
    if (dt < 0 || dt > 0.6) return;
    const origins = h === T.hammerHit ? [HOLE, {x: TRUNK_L + 5, y: HAMMER.at.y}] : [HOLE];
    origins.forEach((o, oi) => {
      for (let i = 0; i < n; i++) {
        const r = rand(hi * 31 + i * 7 + oi * 101), r2 = rand(hi * 13 + i * 3 + 5 + oi * 57);
        const vx = -(180 + 280 * r), vy = -(150 + 420 * r2), g = 2000;
        const x = o.x + vx * dt, y = o.y + vy * dt + 0.5 * g * dt * dt;
        const s = dt > 0.45 ? 1 - (dt - 0.45) / 0.15 : 1;
        out.push(
          <rect key={`${hi}-${oi}-${i}`} x={-9} y={-6} width={18} height={12} rx={3} fill="#d39a5c" stroke={INK} strokeWidth={3.5}
            transform={`translate(${x} ${y}) rotate(${(r - 0.5) * 900 * dt}) scale(${s})`} />,
        );
      }
    });
  });
  return <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>{out}</svg>;
};

const Star: React.FC<{x: number; y: number; r: number; fill?: string; sw?: number; rot?: number}> = ({x, y, r, fill = '#ffe066', sw = 6, rot = 0}) => {
  const pts: string[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + (rot * Math.PI) / 180, rr = i % 2 ? r * 0.48 : r;
    pts.push(`${x + rr * Math.cos(a)},${y + rr * Math.sin(a)}`);
  }
  return <polygon points={pts.join(' ')} fill={fill} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />;
};

const QMark: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -38 -50 C -38 -112 62 -112 62 -52 C 62 -12 8 -6 8 32" fill="none" stroke={INK} strokeWidth={30} strokeLinecap="round" />
    <circle cx={8} cy={84} r={18} fill={INK} />
  </g>
);

const Spring: React.FC<{x: number; top: number; bottom: number}> = ({x, top, bottom}) => {
  const n = 7, w = 46;
  let d = `M ${x} ${bottom}`;
  for (let i = 1; i <= n; i++) d += ` L ${x + (i % 2 ? w : -w)} ${bottom - ((bottom - top) * (i - 0.5)) / n}`;
  d += ` L ${x} ${top}`;
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={20} strokeLinejoin="round" strokeLinecap="round" />
      <path d={d} fill="none" stroke="#b8c4cf" strokeWidth={9} strokeLinejoin="round" strokeLinecap="round" />
      <rect x={x - 70} y={bottom} width={140} height={22} rx={8} fill="#8d99a6" stroke={INK} strokeWidth={6} />
    </g>
  );
};

const ThoughtBubble: React.FC<{t: number}> = ({t}) => {
  if (t < T.bubble || t > T.bust + 0.25) return null;
  const sc = t < T.bust ? popIn(t - T.bubble) : popOut(t - T.bust, 0.14);
  const cx = 380, cy = 330;
  const qs = t < T.spring ? popIn(t - T.qmark) : popOut(t - T.spring, 0.14);
  const springOn = t >= T.spring;
  const lift = springOn ? easeOut(seg(t, T.spring, T.spring + 0.2)) * 60 : 0;
  const bob = springOn ? -46 * wobble(t - T.spring - 0.1, 1.9, 1.3) - 30 * wobble(t - 8.7, 2.2, 2.5) : 0;
  const brainY = cy + 10 - lift + bob;
  const springS = popIn(t - T.spring, 0.2);
  return (
    <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <g transform={`translate(${cx} ${cy}) scale(${sc}) translate(${-cx} ${-cy})`}>
        <circle cx={290} cy={600} r={18} fill="#fff" stroke={INK} strokeWidth={7} />
        <circle cx={318} cy={540} r={28} fill="#fff" stroke={INK} strokeWidth={7} />
        <ellipse cx={cx} cy={cy} rx={255} ry={190} fill="#fff" stroke={INK} strokeWidth={8} />
        {springOn && <g transform={`translate(${cx} 455) scale(${springS}) translate(${-cx} -455)`}><Spring x={cx - 20} top={brainY + 40} bottom={455} /></g>}
        <image href={f('brain.png')} x={cx - 20 - 125} y={brainY - 90} width={250} height={180} />
        {qs > 0.01 && <QMark x={cx + 160} y={cy - 40} s={qs * 0.9} />}
      </g>
    </svg>
  );
};

// x-ray window drawn in the bird's own (sprite px) coordinates so it moves rigidly with the head
const XRay: React.FC<{t: number}> = ({t}) => {
  let sc = 0;
  if (t >= T.xray && t < T.recOff + 0.2) sc = t < T.recOff ? popIn(t - T.xray) : popOut(t - T.recOff);
  if (t >= T.xray2 && t < T.cut) sc = popIn(t - T.xray2);
  if (sc <= 0.01) return null;
  const unit = t >= T.unit && t < T.release ? 1 : 0;
  const bump = t >= T.size ? 1 + 0.28 * wobble(t - T.size, 2.6, 4) : 1;
  const ring2 = t >= T.size && t < T.cut ? popIn(t - T.size) : 0;
  const bw = 270 * bump, bh = bw * 0.72;
  return (
    <g transform={`translate(${HEAD.x} ${HEAD.y}) scale(${sc})`}>
      <circle r={300} fill="#1e2d4c" stroke={INK} strokeWidth={18} />
      <ellipse cx={-10} cy={10} rx={235} ry={215} fill="none" stroke="#d9ecff" strokeWidth={22} />
      <path d="M 225 -40 L 480 -170 L 250 40" fill="none" stroke="#d9ecff" strokeWidth={18} strokeLinejoin="round" opacity={0.0} />
      <image href={f('brain.png')} x={-30 - bw / 2} y={-10 - bh / 2} width={bw} height={bh} />
      {unit > 0 && <circle r={330 + 10 * Math.sin((t - T.unit) * 14)} fill="none" stroke="#ffd23f" strokeWidth={26} />}
      {unit > 0 && <circle r={330 + 10 * Math.sin((t - T.unit) * 14)} fill="none" stroke={INK} strokeWidth={6} strokeDasharray="0" opacity={0} />}
      {ring2 > 0 && <circle cx={-30} cy={-10} r={(bw / 2 + 40) * ring2} fill="none" stroke="#ffd23f" strokeWidth={16} />}
    </g>
  );
};

const Pillow: React.FC<{t: number}> = ({t}) => {
  if (t < T.pillow || t > T.pillowOff + 0.2) return null;
  const sc = t < T.pillowOff ? popIn(t - T.pillow) : popOut(t - T.pillowOff);
  const cx = BEAK.x + 90, cy = BEAK.y + 10, w = 300, h = 220;
  const left = cx - w / 2;
  const overlap = (toWorld(cx + w / 2, cy, birdAngle(t)).x - TRUNK_L) / (w * S);
  const squash = clamp(overlap, 0, 0.45);
  const right = left;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${sc}) translate(${-cx} ${-cy})`}>
      <g transform={`translate(${right} ${cy}) scale(${1 - squash} ${1 + squash * 0.5}) translate(${-right} ${-cy})`}>
        <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={70} fill="#fbf6ec" stroke={INK} strokeWidth={14} />
        <path d={`M ${cx - w / 2 + 20} ${cy + 30} q ${w / 2 - 20} 40 ${w - 40} 0`} fill="none" stroke="#d9cfbd" strokeWidth={14} strokeLinecap="round" />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy], i) => (
          <path key={i} d={`M ${cx + sx * (w / 2 - 22)} ${cy + sy * (h / 2 - 22)} l ${sx * 34} ${sy * 30}`} stroke={INK} strokeWidth={14} strokeLinecap="round" />
        ))}
      </g>
      <path d={`M ${cx - w / 2 - 10} ${cy - 30} L ${cx - w / 2 - 120} ${cy - 40}`} stroke="#c0392b" strokeWidth={14} strokeLinecap="round" />
    </g>
  );
};

const Sweat: React.FC<{t: number}> = ({t}) => {
  if (t < T.sweat || t > T.sweat + 0.8) return null;
  const dt = t - T.sweat;
  const sc = dt < 0.62 ? popIn(dt, 0.2) : popOut(dt - 0.62);
  const y = 110 + easeInOut(seg(dt, 0.15, 0.62)) * 120, x = 200;
  return (
    <g transform={`translate(${x} ${y}) scale(${sc * 1.9})`}>
      <path d="M 0 -60 C 25 -20 42 5 42 28 C 42 54 22 70 0 70 C -22 70 -42 54 -42 28 C -42 5 -25 -20 0 -60 Z" fill="#8fd6ff" stroke={INK} strokeWidth={9} />
      <ellipse cx={-14} cy={30} rx={9} ry={15} fill="#ffffff" />
    </g>
  );
};

// ---------------------------------------------------------------- the bird
const Bird: React.FC<{t: number}> = ({t}) => {
  const ang = birdAngle(t);
  const front = t >= T.turn1 && t < T.turn2;
  let sx = 1;
  for (const tt of [T.turn1, T.turn2]) {
    const d = Math.abs(t - tt);
    if (d < 0.09) sx = Math.min(sx, 1 - 0.2 * (1 - d / 0.09));
  }
  const breath = 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * t);
  const tilt = front ? 4 * easeOut(seg(t, T.qmark - 0.1, T.qmark + 0.2)) : 0;
  return (
    <div style={{position: 'absolute', left: BX, top: BY, width: SPR.w * S, height: SPR.h * S,
      transformOrigin: `${PIV.x * S}px ${PIV.y * S}px`,
      transform: `rotate(${ang - tilt}deg) scale(${sx * (2 - breath)}, ${breath * (sx < 1 ? 1.03 : 1)})`}}>
      <Img src={f(front ? 'bird_front.png' : 'bird_side.png')} style={{width: '100%', height: '100%'}} />
      <svg width={SPR.w} height={SPR.h} viewBox={`0 0 ${SPR.w} ${SPR.h}`}
        style={{position: 'absolute', left: 0, top: 0, width: SPR.w * S, height: SPR.h * S, overflow: 'visible'}}>
        <XRay t={t} />
        <Pillow t={t} />
        <Sweat t={t} />
      </svg>
    </div>
  );
};

const Hammer: React.FC<{t: number}> = ({t}) => {
  if (t < T.hammerIn || t > T.recOff + 0.2) return null;
  const sc = t < T.recOff ? popIn(t - T.hammerIn) : popOut(t - T.recOff);
  let a: number;
  if (t < T.hammerIn + 0.35) a = lerp(0, -30, easeOut(seg(t, T.hammerIn + 0.05, T.hammerIn + 0.35)));
  else if (t < T.hammerHit) a = lerp(-30, 90, easeIn(seg(t, T.hammerIn + 0.35, T.hammerHit)));
  else a = 90 - 8 * Math.exp(-6 * (t - T.hammerHit)) * Math.abs(Math.sin(10 * (t - T.hammerHit)));
  const H = HAMMER;
  return (
    <div style={{position: 'absolute', left: H.at.x - H.pivX * H.s, top: H.at.y - H.pivY * H.s, width: H.w * H.s, height: H.h * H.s,
      transformOrigin: `${H.pivX * H.s}px ${H.pivY * H.s}px`, transform: `rotate(${a + H.tilt}deg) scale(${sc})`}}>
      <Img src={f('hammer.png')} style={{width: '100%', height: '100%'}} />
    </div>
  );
};

const ImpactStar: React.FC<{t: number}> = ({t}) => {
  const items: React.ReactNode[] = [];
  const add = (h: number, x: number, y: number, r: number, hold: number, key: string) => {
    if (t < h || t > h + hold + 0.16) return;
    const s = t < h + hold ? popIn(t - h, 0.12) : popOut(t - h - hold);
    items.push(<g key={key} transform={`translate(${x} ${y}) scale(${s}) translate(${-x} ${-y})`}><Star x={x} y={y} r={r} rot={(t - h) * 40} /></g>);
  };
  add(T.slowHit, HOLE.x - 10, HOLE.y, 70, 0.45, 'slow');
  add(T.hammerHit, HOLE.x - 10, HOLE.y, 50, 0.12, 'hb');
  add(T.hammerHit, TRUNK_L - 5, HAMMER.at.y, 55, 0.12, 'hh');
  return <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>{items}</svg>;
};

// screen-space slow-motion camera overlay
const Viewfinder: React.FC<{t: number}> = ({t}) => {
  if (t < T.rec || t > T.recOff) return null;
  const s = popIn(t - T.rec, 0.2);
  const m = 70, L = 120;
  const corner = (x: number, y: number, dx: number, dy: number, k: number) => (
    <path key={k} d={`M ${x} ${y + dy * L} L ${x} ${y} L ${x + dx * L} ${y}`} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  );
  const cs = [corner(m, m, 1, 1, 0), corner(1080 - m, m, -1, 1, 1), corner(m, 1920 - m, 1, -1, 2), corner(1080 - m, 1920 - m, -1, -1, 3)];
  const blink = Math.floor((t - T.rec) * 2) % 2 === 0;
  return (
    <AbsoluteFill style={{transform: `scale(${2 - s})`, opacity: s > 0.02 ? 1 : 0}}>
      <svg width={1080} height={1920}>
        <g stroke={INK} strokeWidth={22}>{cs}</g>
        <g stroke="#ffffff" strokeWidth={10}>{cs}</g>
        {blink && <circle cx={m + 70} cy={m + 70} r={22} fill="#ff3b30" stroke={INK} strokeWidth={6} />}
      </svg>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- final shot: same sudden stop, big brain vs tiny brain
const BrainChar: React.FC<{t: number; cx: number; cy: number; w: number; big: boolean}> = ({t, cx, cy, w, big}) => {
  const h = (w * 1209) / 1677;
  const hit = t >= T.impact;
  const dt = t - T.impact;
  const sq = hit ? (big ? 0.3 : 0.07) * Math.exp(-4.5 * dt) * Math.cos(2 * Math.PI * 2.4 * dt) : 0;
  const right = cx + w / 2;
  const blinkU = Math.abs(t - 21.0) < 0.07 ? 1 - Math.abs(t - 21.0) / 0.07 : 0;
  const ey = cy - h * 0.05, er = w * 0.085, ex = [cx - w * 0.12, cx + w * 0.1];
  const look = hit ? 0 : 1;
  const squeezed = big && hit && dt < 1.6;
  const smug = !big && t >= T.smug;
  const sw = big ? 7 : 4;
  return (
    <g transform={`translate(${right} ${cy}) scale(${1 - sq} ${1 + sq * 0.6}) translate(${-right} ${-cy})`}>
      <image href={f('brain.png')} x={cx - w / 2} y={cy - h / 2} width={w} height={h} />
      {!big && (
        <g>
          <path d={`M ${cx - w * 0.36} ${cy - h * 0.3} C ${cx - w * 0.3} ${cy - h * 0.75} ${cx + w * 0.3} ${cy - h * 0.78} ${cx + w * 0.34} ${cy - h * 0.32} Z`} fill="#e8322b" stroke={INK} strokeWidth={4} />
          <path d={`M ${cx - w * 0.3} ${cy - h * 0.55} L ${cx - w * 0.58} ${cy - h * 0.62} L ${cx - w * 0.28} ${cy - h * 0.4} Z`} fill="#e8322b" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        </g>
      )}
      {ex.map((x, i) => (squeezed ? (
        <path key={i} d={i === 0 ? `M ${x - er} ${ey - er} L ${x + er * 0.7} ${ey} L ${x - er} ${ey + er}` : `M ${x + er} ${ey - er} L ${x - er * 0.7} ${ey} L ${x + er} ${ey + er}`}
          fill="none" stroke={INK} strokeWidth={sw * 1.3} strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <g key={i}>
          <ellipse cx={x} cy={ey} rx={er} ry={er * 1.15 * (1 - blinkU * 0.9)} fill="#fff" stroke={INK} strokeWidth={sw} />
          {blinkU < 0.5 && <circle cx={x + er * 0.35 * look} cy={ey + er * 0.1} r={er * 0.45} fill={INK} />}
          {blinkU < 0.5 && <circle cx={x + er * 0.35 * look - er * 0.15} cy={ey - er * 0.1} r={er * 0.14} fill="#fff" />}
          {smug && <path d={`M ${x - er * 1.15} ${ey - er * 1.25} L ${x + er * 1.15} ${ey - er * 1.25} L ${x + er * 1.15} ${ey - er * 0.05} Q ${x} ${ey + er * 0.15} ${x - er * 1.15} ${ey - er * 0.05} Z`} fill="#e7a3a8" stroke={INK} strokeWidth={sw} />}
        </g>
      )))}
      {smug && <path d={`M ${cx - w * 0.1} ${cy + h * 0.16} Q ${cx} ${cy + h * 0.24} ${cx + w * 0.12} ${cy + h * 0.13}`} fill="none" stroke={INK} strokeWidth={sw} strokeLinecap="round" />}
      {squeezed && <path d={`M ${cx - w * 0.1} ${cy + h * 0.2} q ${w * 0.05} ${-h * 0.06} ${w * 0.1} 0 q ${w * 0.05} ${h * 0.06} ${w * 0.1} 0`} fill="none" stroke={INK} strokeWidth={sw} strokeLinecap="round" />}
    </g>
  );
};

const Comparison: React.FC<{t: number}> = ({t}) => {
  const wallL = 770;
  const back = easeOut(seg(t, T.back0, T.go)) * 30;
  const go = easeIn(seg(t, T.go, T.impact)) * 240;
  const dx = -back + go;
  const bigW = 500, tinyW = 190;
  const bigCx = wallL - bigW / 2 - 240 + dx, tinyCx = wallL - tinyW / 2 - 240 + dx;
  const bob = (p: number) => (t < T.go ? 6 * Math.sin(2 * Math.PI * 0.8 * t + p) : 0);
  const dt = t - T.impact;
  const stars = t > T.impact + 0.15;
  const lines = dt > 0 && dt < 0.35;
  const sparkle = t > T.smug + 0.05 ? popIn(t - T.smug - 0.05) : 0;
  return (
    <AbsoluteFill>
      <Sky />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0}}>
        <g transform="translate(540 960) scale(0.4) translate(-540 -960)">
          <path d="M -1500 2700 C -900 2300 -200 2400 300 2550 C 900 2250 1700 2300 2600 2500 L 2600 4200 L -1500 4200 Z" fill="#a6dd8f" stroke={INK} strokeWidth={18} />
        </g>
        <BrainChar t={t} cx={bigCx} cy={760 + bob(0)} w={bigW} big />
        <BrainChar t={t} cx={tinyCx} cy={1300 + bob(1.3)} w={tinyW} big={false} />
        {lines && [[-90, 0], [0, 0], [90, 0]].map(([oy], i) => (
          <path key={i} d={`M ${wallL - 30} ${760 + oy * 1.4} l ${-60 - 30 * (i % 2)} ${oy * 0.4}`} stroke="#ffffff" strokeWidth={14} strokeLinecap="round" />
        ))}
        {stars && [0, 1, 2].map((i) => {
          const a = (t - T.impact) * 5 + (i * Math.PI * 2) / 3;
          const cx = bigCx + 40 + Math.cos(a) * 170, cy = 760 - 260 + Math.sin(a) * 45;
          return <Star key={i} x={cx} y={cy} r={34} sw={5} rot={a * 60} />;
        })}
        {sparkle > 0 && <g transform={`translate(${tinyCx - 70} ${1300 - 120}) scale(${sparkle})`}><Star x={0} y={0} r={30} fill="#fffbe0" sw={5} rot={(t - T.smug) * 60} /></g>}
      </svg>
      <div style={{position: 'absolute', left: 0, top: 0}}>
        <Trunk x0={wallL} x1={1130} y0={-40} y1={1960} />
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- sound
type Cue = {f: string; at: number; db: number; rate?: number};
const CUES: Cue[] = [
  ...FAST_HITS.map((h, i) => ({f: 'tok', at: h - 0.005, db: -17 - 3 * rand(i + 3), rate: 0.94 + 0.12 * rand(i + 9)})),
  {f: 'whoosh', at: T.turn1 - 0.25, db: -29}, {f: 'pop', at: T.bubble, db: -19}, {f: 'pop', at: T.qmark, db: -21, rate: 1.3},
  {f: 'whoosh', at: T.turn2 - 0.25, db: -29}, {f: 'boing', at: T.spring, db: -16}, {f: 'boing', at: 8.7, db: -22, rate: 1.15},
  {f: 'pop', at: T.bust, db: -15, rate: 0.85}, {f: 'beep', at: T.rec, db: -24}, {f: 'pop', at: T.xray, db: -22},
  {f: 'whoosh', at: T.leanBack1, db: -27, rate: 0.6}, {f: 'tok', at: T.slowHit, db: -11, rate: 0.5}, {f: 'thud', at: T.slowHit, db: -15},
  {f: 'ding', at: T.unit, db: -27},
  {f: 'pop', at: T.hammerIn, db: -21}, {f: 'swish', at: T.hammerHit - 0.2, db: -24}, {f: 'tok', at: T.hammerHit, db: -12}, {f: 'tok', at: T.hammerHit + 0.012, db: -14, rate: 0.8},
  {f: 'pop', at: T.pillow, db: -20},
  ...T.pillowPecks.map((h, i) => ({f: i % 2 ? 'squish' : 'boing', at: h - 0.03, db: i % 2 ? -17 : -21, rate: 1.2})),
  {f: 'pop', at: T.pillowOff, db: -17}, {f: 'whoosh', at: T.zoom0, db: -27}, {f: 'pop', at: T.xray2, db: -21}, {f: 'ding', at: T.size, db: -25},
  {f: 'swish', at: T.cut - 0.08, db: -26}, {f: 'whoosh', at: T.impact - 0.45, db: -23},
  {f: 'thud', at: T.impact, db: -10}, {f: 'squish', at: T.impact + 0.01, db: -14}, {f: 'tok', at: T.impact, db: -19, rate: 1.3},
  {f: 'ding', at: T.smug + 0.05, db: -19},
];

// ---------------------------------------------------------------- composition
export const Woodpecker: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const hits = REAL_HITS.filter((h) => t >= h).length;
  const hole = hits === 0 ? 0 : clamp(0.35 + hits * 0.05, 0, 1);
  const cam0 = camAt(t), sh = shake(t);
  const cam = {x: cam0.x - sh.x * (1000 - cam0.z) / 1000, y: cam0.y - sh.y * (1000 - cam0.z) / 1000, z: cam0.z};
  const dof = 3.2 * clamp((cam.z - 120) / 300);
  const audio = (
    <>
      <Sequence from={Math.round(VO_AT * FPS)} layout="none"><Audio src={f('vo/take1.mp3')} /></Sequence>
      {CUES.map((c, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(c.at * FPS))} layout="none">
          <Audio src={f(`sfx/${c.f}.wav`)} volume={10 ** (c.db / 20)} playbackRate={c.rate ?? 1} />
        </Sequence>
      ))}
    </>
  );
  if (t >= T.cut) {
    const ct = t;
    const s2 = shake(ct);
    return (
      <AbsoluteFill style={{background: '#b9e3fb'}}>
        <AbsoluteFill style={{transform: `translate(${ct >= T.impact ? s2.x * 0.8 : 0}px, ${ct >= T.impact ? s2.y * 0.8 : 0}px)`}}><Comparison t={ct} /></AbsoluteFill>
        {audio}
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{background: '#b9e3fb'}}>
      <Sky />
      <Layer cam={cam} z={3000} blur={dof}><FarHills /></Layer>
      <Layer cam={cam} z={1800} blur={dof * 0.6}><MidTrees /></Layer>
      <Layer cam={cam} z={1000}>
        <Trunk x0={TRUNK_L} x1={TRUNK_R} y0={-1600} y1={3600} hole={hole} />
        <ThoughtBubble t={t} />
        <Hammer t={t} />
        <Bird t={t} />
        <Chips t={t} />
        <ImpactStar t={t} />
      </Layer>
      <Layer cam={cam} z={650}><ForeLeaves /></Layer>
      <Viewfinder t={t} />
      {audio}
    </AbsoluteFill>
  );
};
