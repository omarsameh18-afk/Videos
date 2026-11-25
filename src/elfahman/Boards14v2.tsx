// الفهمان #14 v2 (bigger board layout): a NEW hook board (Seba tiptoeing away from the tomb door, basket and chisel dropped,
// "غايب!" stamp on "زوّغ", the slab small in the corner), the loop board that replays it, and the per-board view
// (zoom + focus) that makes every v1 drawing fill the taller board. Boards 2–19 are the v1 drawings, unchanged.
import React from 'react';
import {rand, seg} from './lib/anim';
import {
  B10, B11, B12, B13, B15, B16, B17, B18, B19, B2, B3, B4, B5, B6, B7, B8, B9, type BoardProps,
  Dust, FLOOR, Ground, INK, RED, SAND, SKIN, Scene, Slab, Stamp, YEL,
} from './Boards14';

// ------------------------------------------------------------------ Seba tiptoeing (sneaky cartoon walk), facing right
// x,y = feet, s = scale, t = seconds (the walk cycle). Exaggerated: big knee lifts on tiptoe, body leaning forward,
// hands up like paws, head turned back over the shoulder with guilty eyes.
const CYCLE = 1.1;
export const SneakSeba: React.FC<{x: number; y: number; s: number; t: number}> = ({x, y, s, t}) => {
  const p = (t / CYCLE) * Math.PI * 2;
  const a = Math.max(0, Math.sin(p)), b = Math.max(0, -Math.sin(p)); // lift of the front / back leg
  const bob = -10 * Math.abs(Math.sin(p)) + 4;
  const leg = (lift: number, side: number) => {
    const hx = side * 10, hy = -95;
    const kx = hx + 10 + 38 * lift, ky = -50 - 46 * lift;
    const fx = hx + 6 + 34 * lift, fy = -lift * 34;
    return (
      <g>
        <path d={`M ${hx} ${hy} L ${kx} ${ky} L ${fx} ${fy - 6}`} stroke={SKIN} strokeWidth={22} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M ${fx - 12} ${fy - 8} L ${fx + 20} ${fy + 2} L ${fx - 6} ${fy + 4} Z`} fill={SKIN} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      </g>
    );
  };
  const look = 0.5 + 0.5 * Math.sin(t * 1.7); // glances back
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={8} cy={2} rx={62} ry={10} fill={INK} opacity={0.2} />
      <g transform={`translate(0 ${bob})`}>
        {leg(b, -1)}
        <g transform="rotate(12 0 -95)">
          {/* back arm: paw up */}
          <path d="M -28 -160 Q -6 -118 22 -132 Q 30 -150 34 -160" stroke={SKIN} strokeWidth={20} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M -40 -165 Q -46 -120 -36 -96 L 36 -96 Q 46 -120 40 -165 Q 0 -178 -40 -165 Z" fill={SKIN} stroke={INK} strokeWidth={6} />
          <path d="M -30 -164 Q 0 -140 30 -164" stroke="#2F7FD8" strokeWidth={10} fill="none" />
          {[-20, -8, 4, 16].map((bx, i) => <circle key={i} cx={bx + 2} cy={-152 + Math.abs(bx + 2) * 0.12} r={5} fill="#6FC3FF" stroke={INK} strokeWidth={2} />)}
          <path d="M -42 -104 L 42 -104 L 54 -46 Q 0 -38 -54 -46 Z" fill="#fff" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          <line x1={-42} y1={-98} x2={42} y2={-98} stroke="#E2D6B8" strokeWidth={8} />
          {/* front arm: paw up, fingers dangling */}
          <path d="M 30 -158 Q 66 -128 60 -168 Q 62 -176 70 -184" stroke={SKIN} strokeWidth={20} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 64 -184 l 6 12 M 72 -186 l 8 10" stroke={INK} strokeWidth={4} strokeLinecap="round" />
          {/* head, turned back over the shoulder */}
          <g transform="rotate(-10 0 -218)">
            <circle cx={0} cy={-218} r={46} fill={SKIN} stroke={INK} strokeWidth={7} />
            <path d="M -46 -222 Q -50 -272 0 -270 Q 50 -272 46 -222 Q 34 -246 0 -248 Q -34 -246 -46 -222 Z" fill="#17120f" />
            {[-1, 1].map((sd) => (
              <g key={sd}>
                <ellipse cx={sd * 18 - 4} cy={-226} rx={15} ry={17} fill="#fff" stroke={INK} strokeWidth={4} />
                <circle cx={sd * 18 - 4 - 7 * look} cy={-224} r={7.5} fill={INK} />
                <path d={`M ${sd * 18 - 18} ${-246 + (sd > 0 ? 2 : -3)} L ${sd * 18 + 10} ${-240 - (sd > 0 ? 4 : -1)}`} stroke={INK} strokeWidth={4} />
              </g>
            ))}
            <path d="M -18 -192 Q -2 -182 16 -196" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
            <circle cx={44} cy={-216} r={8} fill={SKIN} stroke={INK} strokeWidth={4} />
          </g>
        </g>
        {leg(a, 1)}
      </g>
      {/* sneak lines */}
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M ${-80 - i * 22} ${-150 + i * 40} q -16 -8 -30 0`} stroke="#fff" strokeWidth={6} fill="none" strokeLinecap="round"
          opacity={0.35 + 0.35 * Math.sin(t * 5 + i)} />
      ))}
    </g>
  );
};

const TombCliff: React.FC = () => (
  <g>
    <path d={`M 0 ${FLOOR} L 0 300 Q 140 270 300 300 Q 470 262 640 296 Q 820 268 1080 300 L 1080 ${FLOOR} Z`} fill="#C9874A" stroke={INK} strokeWidth={8} />
    <path d="M 0 420 Q 300 396 540 430 Q 800 410 1080 440" stroke="#A86A36" strokeWidth={8} fill="none" />
    <g transform="translate(320 600)">
      <rect x={-80} y={-60} width={160} height={260} fill="#3B2414" stroke={INK} strokeWidth={9} />
      <rect x={-108} y={-96} width={216} height={40} fill="#E0B070" stroke={INK} strokeWidth={8} />
      <circle cx={0} cy={-76} r={11} fill={YEL} stroke={INK} strokeWidth={4} />
      <rect x={-80} y={-60} width={160} height={260} fill="#000" opacity={0.25} />
    </g>
  </g>
);
const Basket: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(-24)`}>
    <path d="M -60 -50 L 60 -50 L 44 10 Q 0 22 -44 10 Z" fill="#D4A05A" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    {[-36, -12, 12, 36].map((bx) => <line key={bx} x1={bx} y1={-48} x2={bx * 0.8} y2={12} stroke="#A8743A" strokeWidth={4} />)}
    {[-30, -10].map((by) => <line key={by} x1={-56} y1={by} x2={56} y2={by} stroke="#A8743A" strokeWidth={4} />)}
    <ellipse cx={0} cy={-50} rx={60} ry={12} fill="#B8843F" stroke={INK} strokeWidth={6} />
  </g>
);
const Chisel: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <g transform="rotate(14)">
      <rect x={-50} y={-8} width={70} height={16} rx={4} fill="#C97A3A" stroke={INK} strokeWidth={5} />
      <path d="M 20 -8 L 52 -3 L 52 3 L 20 8 Z" fill="#9AA3AD" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    </g>
    <g transform="translate(70 -10) rotate(-30)">
      <rect x={-8} y={-10} width={16} height={70} rx={5} fill="#8A5A2B" stroke={INK} strokeWidth={5} />
      <rect x={-26} y={-36} width={52} height={30} rx={8} fill="#7A4A20" stroke={INK} strokeWidth={5} />
    </g>
  </g>
);

// ================================================================== 1 — hook: Seba tiptoes away from the tomb door; "غايب!" stamps on "زوّغ"
// Continuous in t (also for t < 0, which the loop board uses), so the last frame runs straight into frame 0.
export const HOOK_X0 = 610, HOOK_V = 62;
export const B1v2: React.FC<BoardProps> = ({t, ev}) => {
  const sx = HOOK_X0 + HOOK_V * t;
  return (
    <Scene bg={SAND} html={<Stamp x={470} y={330} dt={t - ev[0]} text="غايب!" size={110} rot={-12} />}>
      <TombCliff />
      <Dust t={t} />
      <rect x={0} y={FLOOR - 4} width={1080} height={30} fill="#B37845" />
      <Basket x={420} y={FLOOR + 6} s={0.95} />
      {[0, 1, 2].map((i) => <ellipse key={i} cx={470 + i * 34} cy={FLOOR + 14 + (i % 2) * 6} rx={16} ry={11} fill="#D8B77A" stroke={INK} strokeWidth={4} />)}
      <Chisel x={250} y={FLOOR + 22} s={1.0} />
      <SneakSeba x={sx} y={FLOOR + 10} s={1.15} t={t + 0.25} />
      <Slab x={850} y={300} s={0.34} t={t} rows={5} red={[1, 3]} glow={1} rot={6} />
      <Ground o={0.12} />
    </Scene>
  );
};

// ================================================================== 20 — "الفهمان كسبان": the hook board again (t < 0), gold sparkles fading out by the last frame
export const B20v2: React.FC<BoardProps> = ({t, d}) => (
  <>
    <B1v2 t={t - d} d={3} ev={[99]} />
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      {Array.from({length: 22}, (_, i) => (
        <circle key={i} cx={rand(i) * 1080} cy={180 + ((rand(i + 3) * 760 + t * 140) % 760)} r={5 + rand(i + 8) * 7} fill={YEL} opacity={0.75 * (1 - seg(t, d - 0.7, d - 0.15))} />
      ))}
    </svg>
  </>
);

export const BOARDS_V2 = [B1v2, B2, B3, B4, B5, B6, B7, B8, B9, B10, B11, B12, B13, B13, B15, B16, B17, B18, B19, B20v2];
// per-board view: zoom (1 = the full 1080-wide scene across the board) and the scene point at the board centre
export const VIEWS: {z: number; cx: number; cy: number}[] = [
  {z: 1.4, cx: 560, cy: 640},  // 1 hook
  {z: 1.45, cx: 640, cy: 640}, // 2 cliff + Seba carrying
  {z: 1.45, cx: 540, cy: 640}, // 3 row with the gap
  {z: 1.45, cx: 610, cy: 640}, // 4 scribe
  {z: 1.5, cx: 640, cy: 640},  // 5 scorpion
  {z: 1.5, cx: 550, cy: 640},  // 6 عذر محترم
  {z: 1.3, cx: 540, cy: 600},  // 7 forty workers
  {z: 1.3, cx: 660, cy: 640},  // 8 bandaged eye
  {z: 1.7, cx: 460, cy: 640},  // 9 beer jar
  {z: 1.5, cx: 600, cy: 640},  // 10 the boss
  {z: 1.6, cx: 540, cy: 640},  // 11 museum
  {z: 1.5, cx: 560, cy: 640},  // 12 wheat sack
  {z: 1.35, cx: 540, cy: 640}, // 13 hungry
  {z: 1.35, cx: 540, cy: 640}, // 14 (= 13, frozen)
  {z: 1.35, cx: 560, cy: 640}, // 15 strike
  {z: 1.35, cx: 550, cy: 640}, // 16 temple sit-in
  {z: 1.35, cx: 540, cy: 640}, // 17 pastries
  {z: 1.6, cx: 540, cy: 640},  // 18 badge
  {z: 1.3, cx: 570, cy: 640},  // 19 comment
  {z: 1.4, cx: 560, cy: 640},  // 20 loop (= 1)
];
