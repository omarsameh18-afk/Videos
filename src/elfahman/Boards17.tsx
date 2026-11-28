// The boards of الفهمان #17 "لو الكهربا قطعت عن الدنيا أسبوع". NO generated pictures: حمادة, the neighbours, the 1859 operator, the
// friend and every object are drawn here in code (حمادة is ONE component, so he is the same person in every beat; only the face
// state, the arms and what he holds change).
// Board space: x 0..1080, y 0..1200 (shown 1:1 inside the wall board). The bottom centre (x ~300..780, y > ~860) sits behind
// الفهمان's head, so nothing important goes there.
// Script line 7 (the phone tower) was cut from the voice, so there are 16 story boards + the loop board.
import React from 'react';
import {clamp, easeIn, easeInOut, easeOut, lerp, popIn, rand, seg, wobble} from './lib/anim';
import {norm} from './lib/Captions';
import {Scene} from './Boards14';
import WORDS from './videos/blackout.words.json';

export type BoardProps = {t: number; d: number; b0: number};
const W = 1080, H = 1200;
export const YEL = '#FFD23F', RED = '#FF5A4E', GREEN = '#43C463', INK = '#1b1410';
const SKIN = '#C98D5E', SKIN_D = '#A9714A', HAIR = '#16110E';
const ar = (n: number | string) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[+d]);

// ------------------------------------------------------------------ word onsets (absolute seconds)
const words = WORDS as {w: string; s: number; e: number; sent: number}[];
export const wi = (i: number) => words[i].s;
export const at = (w: string, nth = 0) => {
  const hits = words.map((x, i) => (norm(x.w) === norm(w) ? i : -1)).filter((i) => i >= 0);
  if (hits[nth] === undefined) throw new Error(`word not found: ${w} #${nth}`);
  return words[hits[nth]].s;
};

// ------------------------------------------------------------------ text + small parts
const T: React.FC<{x: number; y: number; size: number; color?: string; stroke?: number; children: React.ReactNode; anchor?: 'middle' | 'start' | 'end'; ltr?: boolean; s?: number; rot?: number; o?: number; sw?: string}> =
({x, y, size, color = '#fff', stroke = 0, children, anchor = 'middle', ltr = false, s = 1, rot = 0, o = 1, sw = INK}) => (s <= 0 ? null : (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={o}>
    <text x={0} y={0} textAnchor={anchor} direction={ltr ? 'ltr' : 'rtl'} fontFamily="Cairo" fontWeight={900} fontSize={size} fill={color}
      stroke={stroke ? sw : 'none'} strokeWidth={stroke} strokeLinejoin="round" paintOrder="stroke" dominantBaseline="middle">{children}</text>
  </g>
));
const DayPill: React.FC<{text: string; s?: number; dark?: boolean}> = ({text, s = 1, dark = false}) => (s <= 0 ? null : (
  <g transform={`translate(540 84) scale(${s})`}>
    <rect x={-210} y={-56} width={420} height={112} rx={56} fill="#000" opacity={0.3} transform="translate(6 8)" />
    <rect x={-210} y={-56} width={420} height={112} rx={56} fill={dark ? '#FFE9A8' : YEL} stroke={INK} strokeWidth={8} />
    <T x={0} y={4} size={60} color={INK}>{text}</T>
  </g>
));
const stampK = (dt: number) => (dt <= 0 ? 0 : dt < 0.12 ? 1.8 - 0.8 * easeIn(dt / 0.12) : 1 + wobble(dt - 0.12, 3, 10) * 0.06);
const Cross: React.FC<{x: number; y: number; dt: number; r?: number}> = ({x, y, dt, r = 60}) => {
  const k = stampK(dt);
  if (k <= 0) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <circle r={r} fill="#fff" stroke={RED} strokeWidth={r * 0.16} />
      <path d={`M ${-r * 0.45} ${-r * 0.45} L ${r * 0.45} ${r * 0.45} M ${r * 0.45} ${-r * 0.45} L ${-r * 0.45} ${r * 0.45}`} stroke={RED} strokeWidth={r * 0.22} strokeLinecap="round" />
    </g>
  );
};
const Check: React.FC<{x: number; y: number; dt: number; r?: number}> = ({x, y, dt, r = 56}) => {
  const k = stampK(dt);
  if (k <= 0) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <circle r={r} fill="#fff" stroke={GREEN} strokeWidth={r * 0.16} />
      <path d={`M ${-r * 0.45} 0 L ${-r * 0.1} ${r * 0.38} L ${r * 0.5} ${-r * 0.36}`} stroke={GREEN} strokeWidth={r * 0.22} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};
const Bolt: React.FC<{x: number; y: number; s: number; c?: string}> = ({x, y, s, c = YEL}) => (s <= 0 ? null : (
  <path transform={`translate(${x} ${y}) scale(${s})`} d="M 14 -60 L -30 8 L -2 8 L -14 60 L 32 -10 L 4 -10 Z" fill={c} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
));
const Plug: React.FC<{x: number; y: number; s: number; rot?: number}> = ({x, y, s, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M -90 0 C -60 0 -50 -30 -20 -30" stroke={INK} strokeWidth={14} fill="none" strokeLinecap="round" />
    <rect x={-20} y={-56} width={64} height={52} rx={12} fill="#EDEDED" stroke={INK} strokeWidth={7} />
    <rect x={44} y={-46} width={30} height={9} rx={4} fill="#C9C9C9" stroke={INK} strokeWidth={4} />
    <rect x={44} y={-24} width={30} height={9} rx={4} fill="#C9C9C9" stroke={INK} strokeWidth={4} />
  </g>
);
const QMark: React.FC<{x: number; y: number; s: number; size?: number; color?: string}> = ({x, y, s, size = 300, color = YEL}) => (s <= 0 ? null : (
  <text x={x} y={y + size * 0.35 * s} textAnchor="middle" fontFamily="Cairo" fontWeight={900} fontSize={size * s} fill={color} stroke={INK} strokeWidth={size * s * 0.06} paintOrder="stroke">؟</text>
));
const Glow: React.FC<{x: number; y: number; r: number; c?: string; o?: number; id: string}> = ({x, y, r, c = '#FFD27A', o = 1, id}) => (o <= 0 ? null : (
  <g opacity={o}>
    <defs><radialGradient id={id}><stop offset="0%" stopColor={c} stopOpacity={0.75} /><stop offset="45%" stopColor={c} stopOpacity={0.28} /><stop offset="100%" stopColor={c} stopOpacity={0} /></radialGradient></defs>
    <circle cx={x} cy={y} r={r} fill={`url(#${id})`} />
  </g>
));
const Candle: React.FC<{x: number; y: number; s: number; t: number}> = ({x, y, s, t}) => {
  const f = 1 + 0.08 * Math.sin(t * 17) + 0.05 * Math.sin(t * 29 + 1);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={4} rx={40} ry={12} fill="#C9C2B4" stroke={INK} strokeWidth={5} />
      <rect x={-16} y={-82} width={32} height={84} rx={6} fill="#FFF6E2" stroke={INK} strokeWidth={5} />
      <line x1={0} y1={-82} x2={0} y2={-94} stroke={INK} strokeWidth={4} />
      <g transform={`translate(0 -96) scale(${f} ${f * (1 + 0.06 * Math.sin(t * 11))})`}>
        <path d="M 0 -44 Q 18 -14 12 2 Q 0 14 -12 2 Q -18 -14 0 -44 Z" fill="#FFB43A" stroke={INK} strokeWidth={4} />
        <path d="M 0 -26 Q 8 -8 5 0 Q 0 6 -5 0 Q -8 -8 0 -26 Z" fill="#FFF3B0" />
      </g>
    </g>
  );
};
// a few drops / a puddle
const Drop: React.FC<{x: number; y: number; s?: number; c?: string}> = ({x, y, s = 1, c = '#7CC4F4'}) => (
  <path transform={`translate(${x} ${y}) scale(${s})`} d="M 0 -22 Q 14 -2 12 8 Q 8 18 0 18 Q -8 18 -12 8 Q -14 -2 0 -22 Z" fill={c} stroke={INK} strokeWidth={4} />
);

// ------------------------------------------------------------------ حمادة (code-drawn, same component everywhere)
// Basis 300 x 700: head centre (150,122), shoulders (88,222) / (212,222), feet at y 690. x = centre, y = top, h = height.
export type Face = 'sleepy' | 'neutral' | 'confused' | 'annoyed' | 'amazed' | 'happy' | 'worried' | 'laugh';
export type ArmT = {tx: number; ty: number; bend?: number} | null;
const L1 = 112, L2 = 108;
const ArmP: React.FC<{sx: number; sy: number; tx: number; ty: number; bend: number}> = ({sx, sy, tx, ty, bend}) => {
  const dx = tx - sx, dy = ty - sy;
  const d = clamp(Math.hypot(dx, dy), 30, L1 + L2 - 2);
  const a = Math.atan2(dy, dx);
  const al = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
  const ex = sx + L1 * Math.cos(a - bend * al), ey = sy + L1 * Math.sin(a - bend * al);
  const hx = sx + d * Math.cos(a), hy = sy + d * Math.sin(a);
  return (
    <g>
      <path d={`M ${sx} ${sy} L ${ex} ${ey} L ${hx} ${hy}`} fill="none" stroke={INK} strokeWidth={42} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M ${sx} ${sy} L ${ex} ${ey} L ${hx} ${hy}`} fill="none" stroke={SKIN} strokeWidth={33} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hx} cy={hy} r={21} fill={SKIN} stroke={INK} strokeWidth={4.5} />
    </g>
  );
};
const HFace: React.FC<{face: Face; t: number; look?: number}> = ({face, t, look = 0}) => {
  const ey = 120, lx = 122, rx = 178, lk = look * 5;
  const eyes = (() => {
    switch (face) {
      case 'sleepy': return [lx, rx].map((x) => <g key={x}><path d={`M ${x - 15} ${ey} Q ${x} ${ey + 9} ${x + 15} ${ey}`} stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" /><path d={`M ${x - 13} ${ey + 3} L ${x + 13} ${ey + 3}`} stroke={INK} strokeWidth={3} opacity={0.5} /></g>);
      case 'amazed': return [lx, rx].map((x) => <g key={x}><ellipse cx={x} cy={ey} rx={15} ry={17} fill="#fff" stroke={INK} strokeWidth={4.5} /><circle cx={x + lk} cy={ey - 3 - Math.abs(look) * 4} r={6.5} fill={INK} /><circle cx={x + lk - 2} cy={ey - 6} r={2} fill="#fff" /></g>);
      case 'happy': case 'laugh': return [lx, rx].map((x) => <path key={x} d={`M ${x - 14} ${ey + 4} Q ${x} ${ey - 12} ${x + 14} ${ey + 4}`} stroke={INK} strokeWidth={5.5} fill="none" strokeLinecap="round" />);
      default: return [lx, rx].map((x) => <g key={x}><ellipse cx={x + lk} cy={ey} rx={7.5} ry={9} fill={INK} /><circle cx={x + lk - 2.5} cy={ey - 3} r={2.3} fill="#fff" /></g>);
    }
  })();
  const brow = (() => {
    switch (face) {
      case 'annoyed': return `M 104 98 L 138 106 M 196 98 L 162 106`;
      case 'confused': return `M 104 100 Q 122 92 138 100 M 162 90 Q 178 80 196 88`;
      case 'amazed': return `M 104 90 Q 122 78 140 88 M 160 88 Q 178 78 196 90`;
      case 'worried': return `M 104 104 Q 120 92 138 96 M 162 96 Q 180 92 196 104`;
      case 'sleepy': return `M 104 106 Q 122 102 138 106 M 162 106 Q 178 102 196 106`;
      default: return `M 104 98 Q 122 90 138 98 M 162 98 Q 178 90 196 98`;
    }
  })();
  const mouth = (() => {
    switch (face) {
      case 'amazed': return <ellipse cx={150} cy={168} rx={12} ry={15} fill="#5a1d14" stroke={INK} strokeWidth={4} />;
      case 'happy': return <path d="M 128 160 Q 150 182 172 160" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />;
      case 'laugh': { const o = 0.7 + 0.3 * Math.abs(Math.sin(t * 9)); return <path d={`M 126 158 Q 150 ${158 + 30 * o} 174 158 Z`} fill="#5a1d14" stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />; }
      case 'annoyed': return <path d="M 132 168 L 168 166" stroke={INK} strokeWidth={5} strokeLinecap="round" />;
      case 'confused': return <path d="M 130 168 Q 140 162 150 168 Q 160 174 170 166" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />;
      case 'worried': return <path d="M 132 172 Q 150 160 168 172" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />;
      case 'sleepy': return <ellipse cx={150} cy={168} rx={8} ry={5 + 2 * Math.sin(t * 2)} fill="#5a1d14" stroke={INK} strokeWidth={3.5} />;
      default: return <path d="M 134 166 Q 150 172 166 166" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />;
    }
  })();
  return <g>{eyes}<path d={brow} stroke={HAIR} strokeWidth={7} fill="none" strokeLinecap="round" />{mouth}</g>;
};
const HHead: React.FC<{face: Face; t: number; look?: number}> = ({face, t, look}) => (
  <g>
    <ellipse cx={70} cy={128} rx={13} ry={19} fill={SKIN} stroke={INK} strokeWidth={5} />
    <ellipse cx={230} cy={128} rx={13} ry={19} fill={SKIN} stroke={INK} strokeWidth={5} />
    <ellipse cx={150} cy={124} rx={80} ry={82} fill={SKIN} stroke={INK} strokeWidth={6} />
    {/* light stubble on the jaw, NO mustache */}
    <path d="M 82 140 Q 92 206 150 208 Q 208 206 218 140 Q 200 186 150 188 Q 100 186 82 140 Z" fill="#3B2A22" opacity={0.2} />
    {Array.from({length: 26}, (_, i) => <circle key={i} cx={96 + rand(i + 3) * 108} cy={168 + rand(i + 31) * 30} r={1.6} fill="#3B2A22" opacity={0.45} />)}
    <ellipse cx={104} cy={152} rx={14} ry={8} fill="#E07A5F" opacity={0.25} /><ellipse cx={196} cy={152} rx={14} ry={8} fill="#E07A5F" opacity={0.25} />
    {/* messy curly hair */}
    {[[82, 86, 22], [92, 60, 24], [114, 42, 25], [140, 34, 25], [166, 36, 25], [190, 46, 24], [210, 66, 22], [220, 92, 18], [78, 106, 15], [128, 54, 18], [158, 56, 18], [182, 62, 17], [104, 66, 17]]
      .map(([cx, cy, r], i) => <circle key={i} cx={cx} cy={cy} r={r} fill={HAIR} stroke={INK} strokeWidth={4} />)}
    {[[100, 40], [150, 22], [200, 40]].map(([cx, cy], i) => <path key={i} d={`M ${cx - 12} ${cy + 6} q 10 -18 22 -4`} stroke="#3a3a3a" strokeWidth={4} fill="none" />)}
    <path d="M 120 128 Q 150 150 158 132" stroke={SKIN_D} strokeWidth={4} fill="none" strokeLinecap="round" />
    <HFace face={face} t={t} look={look} />
  </g>
);
export const Hamada: React.FC<{x: number; y: number; h: number; t: number; face?: Face; l?: ArmT; r?: ArmT; sit?: boolean; id: string; flip?: boolean; look?: number; legsHidden?: boolean; o?: number}> =
({x, y, h, t, face = 'neutral', l = null, r = null, sit = false, id, flip = false, look = 0, legsHidden = false, o = 1}) => {
  const k = h / 700;
  const breathe = 1 + 0.008 * Math.sin(t * 2.4);
  const la = l ?? {tx: 72, ty: 432}, ra = r ?? {tx: 228, ty: 432};
  return (
    <g transform={`translate(${x} ${y}) scale(${(flip ? -1 : 1) * k} ${k}) translate(-150 0)`} opacity={o}>
      <defs>
        <pattern id={`st-${id}`} width={26} height={10} patternUnits="userSpaceOnUse">
          <rect width={26} height={10} fill="#F4F7FF" /><rect width={12} height={10} fill="#3D6FD0" />
        </pattern>
      </defs>
      {/* legs: striped pajama pants + plastic slippers */}
      {!legsHidden && (!sit ? <>
        {[[-1], [1]].map(([s], i) => (
          <g key={i}>
            <path d={`M ${150 + s * 6} 440 L ${150 + s * 68} 440 L ${150 + s * 60} 648 L ${150 + s * 12} 648 Z`} fill={`url(#st-${id})`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
            <path d={`M ${150 + s * 36 - 30} 668 Q ${150 + s * 36} 640 ${150 + s * 36 + 30} 668 L ${150 + s * 36 + 34} 690 L ${150 + s * 36 - 34} 690 Z`} fill={SKIN} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <path d={`M ${150 + s * 36 - 36} 684 h 72 v 10 h -72 Z`} fill="#2E86C1" stroke={INK} strokeWidth={5} />
            <path d={`M ${150 + s * 36 - 28} 666 h 56 v 12 h -56 Z`} fill="#2E86C1" stroke={INK} strokeWidth={4} />
          </g>
        ))}
      </> : <>
        {[[-1], [1]].map(([s], i) => (
          <g key={i}>
            <path d={`M ${150 + s * 4} 436 L ${150 + s * 96} 448 L ${150 + s * 100} 530 L ${150 + s * 8} 520 Z`} fill={`url(#st-${id})`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
            <path d={`M ${150 + s * 56} 520 L ${150 + s * 100} 524 L ${150 + s * 98} 620 L ${150 + s * 58} 620 Z`} fill={`url(#st-${id})`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
            <path d={`M ${150 + s * 78 - 34} 642 Q ${150 + s * 78} 614 ${150 + s * 78 + 34} 642 v 14 h -68 Z`} fill={SKIN} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <path d={`M ${150 + s * 78 - 38} 652 h 76 v 10 h -76 Z`} fill="#2E86C1" stroke={INK} strokeWidth={5} />
          </g>
        ))}
      </>)}
      {/* body: white sleeveless undershirt over a round belly */}
      <g transform={`translate(150 330) scale(${breathe}) translate(-150 -330)`}>
        <rect x={130} y={190} width={40} height={30} fill={SKIN} stroke={INK} strokeWidth={5} />
        <path d="M 74 214 Q 150 196 226 214 Q 254 330 236 452 Q 150 470 64 452 Q 46 330 74 214 Z" fill={SKIN} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d="M 96 210 L 112 210 Q 150 262 188 210 L 204 210 Q 232 300 230 448 Q 150 466 70 448 Q 68 300 96 210 Z" fill="#FBFBF7" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d="M 112 210 Q 150 262 188 210" fill="none" stroke={INK} strokeWidth={5} />
        <path d="M 92 380 Q 150 400 208 380" stroke="#D8D8D0" strokeWidth={5} fill="none" />
        <rect x={64} y={438} width={172} height={20} rx={8} fill="#2F5DA8" stroke={INK} strokeWidth={5} />
      </g>
      <ArmP sx={88} sy={226} tx={la.tx} ty={la.ty} bend={la.bend ?? -1} />
      <ArmP sx={212} sy={226} tx={ra.tx} ty={ra.ty} bend={ra.bend ?? 1} />
      <g transform={`translate(0 ${Math.sin(t * 2.4) * 1.5})`}><HHead face={face} t={t} look={look} /></g>
    </g>
  );
};
// where his hand is, in board coordinates (for things he holds)
export const hand = (x: number, y: number, h: number, a: {tx: number; ty: number}, flip = false): [number, number] => {
  const k = h / 700;
  return [x + (flip ? -1 : 1) * (a.tx - 150) * k, y + a.ty * k];
};

// ------------------------------------------------------------------ neighbours / other people (code-drawn, friendly)
type PV = 'old' | 'track' | 'cap' | 'operator';
const Person: React.FC<{x: number; y: number; h: number; t: number; v: PV; laugh?: number; sit?: boolean; arm?: 'down' | 'hold' | 'up' | 'phone'; flip?: boolean; face?: 'smile' | 'shock' | 'laugh'; o?: number}> =
({x, y, h, t, v, laugh = 0, sit = false, arm = 'down', flip = false, face = 'smile', o = 1}) => {
  const k = h / 700;
  const skin = v === 'old' ? '#B9835A' : v === 'cap' ? '#A97650' : v === 'operator' ? '#F0C9A6' : '#C48A5C';
  const top = v === 'old' ? '#E9E4D6' : v === 'track' ? '#C73A3A' : v === 'cap' ? '#6F8D9E' : '#F4F1E8';
  const pants = v === 'track' ? '#C73A3A' : v === 'cap' ? '#4A4E58' : v === 'operator' ? '#3E3A45' : '#E9E4D6';
  const bob = laugh ? Math.abs(Math.sin(t * 10)) * -6 * laugh : 0;
  const arms: [number, number][] = arm === 'hold' ? [[118, 372], [182, 372]] : arm === 'up' ? [[40, 90], [260, 90]] : arm === 'phone' ? [[78, 430], [190, 330]] : [[70, 430], [230, 430]];
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${(flip ? -1 : 1) * k} ${k}) translate(-150 0)`} opacity={o}>
      {/* legs */}
      {v === 'old' ? (
        !sit ? <path d="M 76 430 L 224 430 L 236 660 L 64 660 Z" fill={top} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          : <path d="M 70 430 L 230 430 Q 262 520 250 600 L 50 600 Q 38 520 70 430 Z" fill={top} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      ) : [[-1], [1]].map(([s], i) => (
        !sit ? <rect key={i} x={150 + s * 36 - 24} y={430} width={48} height={225} rx={14} fill={pants} stroke={INK} strokeWidth={5} />
          : <path key={i} d={`M ${150 + s * 8} 430 L ${150 + s * 92} 440 L ${150 + s * 96} 600 L ${150 + s * 56} 600 L ${150 + s * 56} 510 L ${150 + s * 8} 500 Z`} fill={pants} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      ))}
      {v === 'track' && !sit && [[-1], [1]].map(([s], i) => <line key={i} x1={150 + s * 36 + s * 18} y1={436} x2={150 + s * 36 + s * 18} y2={650} stroke="#fff" strokeWidth={6} />)}
      {[[-1], [1]].map(([s], i) => <path key={i} d={`M ${150 + s * (sit ? 76 : 36) - 30} ${sit ? 604 : 656} h 60 q 12 0 12 12 v 8 h -72 Z`} fill="#3a2a22" stroke={INK} strokeWidth={5} strokeLinejoin="round" />)}
      {/* body */}
      <path d="M 82 196 Q 150 176 218 196 L 228 440 L 72 440 Z" fill={top} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      {v === 'track' && <><line x1={150} y1={200} x2={150} y2={440} stroke="#fff" strokeWidth={6} /><path d="M 82 200 L 72 440 M 218 200 L 228 440" stroke="#fff" strokeWidth={6} /></>}
      {v === 'operator' && <><path d="M 100 196 L 108 440 L 192 440 L 200 196 Q 150 210 100 196 Z" fill="#5B4A7A" stroke={INK} strokeWidth={5} />
        {[250, 300, 350, 400].map((by) => <circle key={by} cx={150} cy={by} r={6} fill="#D9B44A" stroke={INK} strokeWidth={2.5} />)}
        <path d="M 130 196 L 150 228 L 170 196 Z" fill="#fff" stroke={INK} strokeWidth={4} /><path d="M 140 214 L 160 214 L 150 232 Z" fill="#8B1E2B" stroke={INK} strokeWidth={3} /></>}
      {v === 'old' && <path d="M 128 196 L 150 250 L 172 196" fill="none" stroke={INK} strokeWidth={4} />}
      {arms.map(([tx, ty], i) => {
        const sx = i ? 214 : 86, sy = 214;
        const mx = (sx + tx) / 2 + (i ? 30 : -30), my = (sy + ty) / 2;
        return <g key={i}>
          <path d={`M ${sx} ${sy} Q ${mx} ${my} ${tx} ${ty}`} stroke={INK} strokeWidth={38} fill="none" strokeLinecap="round" />
          <path d={`M ${sx} ${sy} Q ${mx} ${my} ${tx} ${ty}`} stroke={v === 'operator' ? '#F4F1E8' : top} strokeWidth={30} fill="none" strokeLinecap="round" />
          <circle cx={tx} cy={ty} r={17} fill={skin} stroke={INK} strokeWidth={4} />
        </g>;
      })}
      {/* head */}
      <rect x={132} y={150} width={36} height={40} fill={skin} stroke={INK} strokeWidth={4.5} />
      <ellipse cx={86} cy={106} rx={11} ry={16} fill={skin} stroke={INK} strokeWidth={4.5} /><ellipse cx={214} cy={106} rx={11} ry={16} fill={skin} stroke={INK} strokeWidth={4.5} />
      <ellipse cx={150} cy={104} rx={64} ry={70} fill={skin} stroke={INK} strokeWidth={5.5} />
      {v === 'old' && <>{[[94, 82, 18], [206, 82, 18], [100, 60, 13], [200, 60, 13]].map(([cx, cy, r], i) => <circle key={i} cx={cx} cy={cy} r={r} fill="#DCDCDC" stroke={INK} strokeWidth={4} />)}
        <path d="M 120 140 Q 150 128 180 140 Q 150 150 120 140 Z" fill="#E6E6E6" stroke={INK} strokeWidth={3.5} /></>}
      {v === 'track' && <path d="M 86 92 Q 86 30 150 30 Q 214 30 214 92 Q 196 58 150 58 Q 104 58 86 92 Z" fill="#2A1C14" stroke={INK} strokeWidth={4.5} />}
      {v === 'cap' && <><path d="M 84 78 Q 88 22 150 22 Q 212 22 216 78 Z" fill="#2E5C8A" stroke={INK} strokeWidth={5} /><path d="M 84 78 L 236 78 Q 246 90 230 92 L 84 90 Z" fill="#244A70" stroke={INK} strokeWidth={5} />
        <path d="M 116 140 Q 150 126 184 140 Q 150 152 116 140 Z" fill="#2A1C14" stroke={INK} strokeWidth={3.5} /></>}
      {v === 'operator' && <><path d="M 88 84 Q 92 36 150 34 Q 208 36 212 84 Q 196 60 150 62 Q 104 60 88 84 Z" fill="#6A4026" stroke={INK} strokeWidth={4.5} />
        <path d="M 88 90 Q 84 130 98 150 L 104 108 Z M 212 90 Q 216 130 202 150 L 196 108 Z" fill="#6A4026" stroke={INK} strokeWidth={4} /></>}
      {/* eyes */}
      {[126, 174].map((ex) => face === 'laugh' || laugh > 0
        ? <path key={ex} d={`M ${ex - 11} ${104} Q ${ex} ${92} ${ex + 11} ${104}`} stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
        : face === 'shock'
          ? <g key={ex}><circle cx={ex} cy={100} r={13} fill="#fff" stroke={INK} strokeWidth={4} /><circle cx={ex} cy={100} r={5} fill={INK} /></g>
          : <circle key={ex} cx={ex} cy={102} r={6} fill={INK} />)}
      {v === 'old' && <g fill="none" stroke="#333" strokeWidth={5}><circle cx={126} cy={102} r={18} /><circle cx={174} cy={102} r={18} /><path d="M 144 100 Q 150 96 156 100" /></g>}
      <path d={face === 'shock' ? 'M 110 76 Q 126 64 140 74 M 160 74 Q 174 64 190 76' : 'M 112 84 Q 126 78 140 84 M 160 84 Q 174 78 188 84'} stroke={v === 'old' ? '#BBB' : '#2A1C14'} strokeWidth={6} fill="none" strokeLinecap="round" />
      {face === 'shock' ? <ellipse cx={150} cy={152} rx={12} ry={15} fill="#5a1d14" stroke={INK} strokeWidth={4} />
        : laugh > 0 || face === 'laugh' ? <path d={`M 128 146 Q 150 ${168 + 6 * Math.sin(t * 10)} 172 146 Z`} fill="#5a1d14" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          : <path d="M 130 148 Q 150 160 170 148" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />}
    </g>
  );
};

// ------------------------------------------------------------------ objects
const Battery: React.FC<{x: number; y: number; s: number; lvl: number}> = ({x, y, s, lvl}) => {
  const c = lvl > 0.5 ? GREEN : lvl > 0.2 ? '#F2B233' : RED;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-110} y={-52} width={210} height={104} rx={20} fill="#fff" stroke={INK} strokeWidth={10} />
      <rect x={100} y={-22} width={22} height={44} rx={6} fill={INK} />
      <rect x={-96} y={-38} width={Math.max(6, 182 * lvl)} height={76} rx={10} fill={c} />
    </g>
  );
};
const PhoneG: React.FC<{x: number; y: number; s: number; rot?: number; t: number; pct: number; dim?: number; children?: React.ReactNode}> = ({x, y, s, rot = 0, t, pct, dim = 0, children}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-110} y={-200} width={220} height={400} rx={34} fill="#000" opacity={0.25} transform="translate(10 12)" />
    <rect x={-110} y={-200} width={220} height={400} rx={34} fill="#262626" stroke={INK} strokeWidth={8} />
    <rect x={-94} y={-174} width={188} height={350} rx={18} fill={pct <= 0.1 ? '#FFE3DE' : '#DDEBFF'} />
    <rect x={-30} y={-190} width={60} height={9} rx={4.5} fill="#555" />
    <Battery x={0} y={-60} s={0.72} lvl={pct} />
    <T x={0} y={40} size={pct <= 0.1 ? 78 : 64} color={pct <= 0.1 ? RED : INK} stroke={pct <= 0.1 ? 0 : 0}>{ar(Math.round(pct * 100))}٪</T>
    {pct <= 0.1 && <rect x={-94} y={-174} width={188} height={350} rx={18} fill={RED} opacity={0.12 + 0.1 * Math.sin(t * 8)} />}
    {children}
    {dim > 0 && <rect x={-94} y={-174} width={188} height={350} rx={18} fill="#000" opacity={dim} />}
  </g>
);
const Bulb: React.FC<{x: number; y: number; s: number; on: number; id: string}> = ({x, y, s, on, id}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Glow x={0} y={0} r={190} o={on} id={id} c="#FFE27A" />
    <line x1={0} y1={-200} x2={0} y2={-92} stroke={INK} strokeWidth={8} />
    <path d="M 0 -92 C 64 -92 84 -40 66 -4 C 52 22 40 34 36 58 L -36 58 C -40 34 -52 22 -66 -4 C -84 -40 -64 -92 0 -92 Z"
      fill={on > 0.5 ? '#FFF2A6' : '#D9DDE0'} stroke={INK} strokeWidth={8} />
    <path d="M -18 52 L -12 0 L 0 18 L 12 0 L 18 52" fill="none" stroke={on > 0.5 ? '#F29E1F' : '#8E9599'} strokeWidth={6} strokeLinejoin="round" />
    <rect x={-38} y={58} width={76} height={40} rx={8} fill="#9AA3AD" stroke={INK} strokeWidth={7} />
    <line x1={-38} y1={72} x2={38} y2={72} stroke={INK} strokeWidth={4} /><line x1={-38} y1={84} x2={38} y2={84} stroke={INK} strokeWidth={4} />
    <path d="M -18 98 L 18 98 L 8 112 L -8 112 Z" fill={INK} />
  </g>
);
const Globe: React.FC<{x: number; y: number; r: number; dark: number; id: string}> = ({x, y, r, dark, id}) => (
  <g transform={`translate(${x} ${y})`}>
    <Glow x={0} y={0} r={r * 2} o={1 - dark} id={id} c="#9AD8FF" />
    <circle r={r} fill={dark > 0.5 ? '#3A4250' : '#3F8FE0'} stroke={INK} strokeWidth={r * 0.12} />
    <g fill={dark > 0.5 ? '#262C36' : '#5CC36A'} stroke={INK} strokeWidth={r * 0.05}>
      <path d={`M ${-r * 0.6} ${-r * 0.5} q ${r * 0.4} ${-r * 0.2} ${r * 0.6} ${r * 0.1} q ${-r * 0.1} ${r * 0.3} ${-r * 0.4} ${r * 0.4} q ${-r * 0.3} ${-r * 0.1} ${-r * 0.2} ${-r * 0.5} Z`} />
      <path d={`M ${r * 0.1} ${-r * 0.1} q ${r * 0.5} ${-r * 0.1} ${r * 0.6} ${r * 0.3} q ${-r * 0.1} ${r * 0.5} ${-r * 0.4} ${r * 0.6} q ${-r * 0.1} ${-r * 0.4} ${-r * 0.2} ${-r * 0.9} Z`} />
    </g>
    {dark > 0 && dark < 1 && <circle r={r} fill="#000" opacity={dark * 0.3} />}
  </g>
);
const Clock: React.FC<{x: number; y: number; r: number; t: number; speed?: number}> = ({x, y, r, t, speed = 1}) => {
  const ma = t * 360 * speed, ha = ma / 12 + 60;
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r + 6} fill={INK} opacity={0.3} transform="translate(8 10)" />
      <circle r={r} fill="#FFFDF4" stroke={INK} strokeWidth={r * 0.1} />
      {Array.from({length: 12}, (_, i) => <line key={i} x1={0} y1={-r * 0.8} x2={0} y2={-r * (i % 3 ? 0.72 : 0.66)} stroke={INK} strokeWidth={r * (i % 3 ? 0.035 : 0.06)} transform={`rotate(${i * 30})`} strokeLinecap="round" />)}
      <line x1={0} y1={0} x2={0} y2={-r * 0.45} stroke={INK} strokeWidth={r * 0.09} strokeLinecap="round" transform={`rotate(${ha})`} />
      <line x1={0} y1={0} x2={0} y2={-r * 0.68} stroke={RED} strokeWidth={r * 0.055} strokeLinecap="round" transform={`rotate(${ma})`} />
      <circle r={r * 0.08} fill={INK} />
    </g>
  );
};

// ================================================================== 1 — hook: Cairo skyline at night; windows switch off block by block
// (left to right) from frame 1, the bulb dies on "قطعت", the globe goes dark on "الدنيا كلها", a 7-day strip slides in on "أسبوع".
// The loop board runs this with t = t_abs - END (t < 0 => every light on = frame 0).
type Blk = {x: number; w: number; top: number; c: string; off: number};
const BLOCKS: Blk[] = [
  {x: -20, w: 150, top: 560, c: '#3B4A78', off: 0.02}, {x: 120, w: 130, top: 470, c: '#46588C', off: 0.32},
  {x: 360, w: 120, top: 520, c: '#3E4E80', off: 0.95}, {x: 470, w: 150, top: 600, c: '#4A5C92', off: 1.25},
  {x: 610, w: 120, top: 500, c: '#3B4A78', off: 1.55}, {x: 820, w: 130, top: 560, c: '#46588C', off: 2.05}, {x: 940, w: 160, top: 470, c: '#3E4E80', off: 2.35},
];
const winOff = (t: number, b: Blk, i: number) => t >= b.off + rand(i * 7 + b.x) * 0.22;
const Skyline: React.FC<{t: number; id: string}> = ({t, id}) => {
  const towerOff = t >= 0.65, minOff = t >= 1.85;
  return (
    <g>
      {/* stars faint */}
      {Array.from({length: 26}, (_, i) => <circle key={i} cx={rand(i + 5) * W} cy={30 + rand(i + 50) * 360} r={2 + rand(i + 9) * 2} fill="#fff" opacity={0.35 + 0.2 * Math.sin(t * 2 + i)} />)}
      <circle cx={880} cy={120} r={0} />
      {/* Cairo Tower (lattice outline) */}
      <g transform="translate(300 230)">
        <path d="M -26 820 L -14 120 L 14 120 L 26 820 Z" fill="#2E3A63" stroke={INK} strokeWidth={6} />
        {Array.from({length: 14}, (_, i) => <path key={i} d={`M ${-24 + i * 0.85} ${170 + i * 46} L ${24 - i * 0.85} ${200 + i * 46} M ${24 - i * 0.85} ${170 + i * 46} L ${-24 + i * 0.85} ${200 + i * 46}`} stroke="#4A5B92" strokeWidth={3} />)}
        <path d="M -44 120 L 44 120 L 36 62 L -36 62 Z" fill="#2E3A63" stroke={INK} strokeWidth={6} />
        {[-24, -8, 8, 24].map((wx) => <rect key={wx} x={wx - 5} y={76} width={10} height={30} fill={towerOff ? '#232B47' : YEL} />)}
        <rect x={-6} y={0} width={12} height={62} fill="#2E3A63" stroke={INK} strokeWidth={5} />
        <circle cx={0} cy={-6} r={8} fill={towerOff ? '#5A2A2A' : RED} stroke={INK} strokeWidth={3} />
      </g>
      {/* minaret */}
      <g transform="translate(770 330)">
        <rect x={-16} y={60} width={32} height={700} fill="#33416E" stroke={INK} strokeWidth={6} />
        <rect x={-28} y={150} width={56} height={18} fill="#33416E" stroke={INK} strokeWidth={5} />
        <rect x={-24} y={330} width={48} height={16} fill="#33416E" stroke={INK} strokeWidth={5} />
        <path d="M -20 60 Q 0 -10 20 60 Z" fill="#33416E" stroke={INK} strokeWidth={5} />
        <line x1={0} y1={8} x2={0} y2={-30} stroke={INK} strokeWidth={5} /><path d="M -8 -30 a 9 9 0 1 0 12 -8" fill="none" stroke={INK} strokeWidth={4} />
        {[110, 240].map((wy) => <rect key={wy} x={-6} y={wy} width={12} height={24} rx={6} fill={minOff ? '#232B47' : YEL} />)}
      </g>
      {/* apartment blocks */}
      {BLOCKS.map((b, bi) => {
        const cols = Math.floor((b.w - 24) / 34), rows = Math.floor((H - b.top - 30) / 56);
        return (
          <g key={bi}>
            <rect x={b.x} y={b.top} width={b.w} height={H - b.top + 20} fill={b.c} stroke={INK} strokeWidth={6} />
            <rect x={b.x - 6} y={b.top - 14} width={b.w + 12} height={16} fill="#2B375E" stroke={INK} strokeWidth={5} />
            {Array.from({length: rows * cols}, (_, i) => {
              const r = Math.floor(i / cols), c = i % cols;
              const lit = rand(i + bi * 31) > 0.12;
              const off = !lit || winOff(t, b, i);
              const fl = !off && t > b.off - 0.1 && t >= 0 ? (rand(i + bi) > 0.6 ? 0.75 + 0.25 * Math.sin(t * 60 + i) : 1) : 1;
              return <rect key={i} x={b.x + 16 + c * 34} y={b.top + 26 + r * 56} width={20} height={30} rx={3} fill={off ? '#1E2642' : '#FFD86B'} opacity={off ? 1 : fl} stroke={INK} strokeWidth={2.5} />;
            })}
          </g>
        );
      })}
      <Glow x={540} y={1080} r={520} c="#FFB54A" o={0.35 * (1 - seg(t, 0.2, 2.6))} id={`${id}-cg`} />
    </g>
  );
};
export const B1: React.FC<BoardProps> = ({t}) => {
  const eQ = wi(2), eD = wi(4), eA = wi(6);
  const fl = t < eQ - 0.2 ? 1 : t < eQ ? (Math.sin(t * 80) > 0 ? 1 : 0.25) : t < eQ + 0.08 ? 0.5 : 0;
  const gD = seg(t, eD, eD + 0.25);
  const strip = t < eA ? 0 : easeOut(seg(t, eA, eA + 0.35));
  return (
    <Scene bg="linear-gradient(180deg,#1A2350 0%,#2D3A78 55%,#5A4A86 100%)">
      <Skyline t={t} id="b1" />
      <Bulb x={150} y={210} s={0.95} on={t < 0 ? 1 : fl} id="b1-bulb" />
      <Globe x={935} y={160} r={78} dark={t < 0 ? 0 : gD} id="b1-glb" />
      {strip > 0 && <g transform={`translate(${lerp(1300, 540, strip)} 420)`}>
        <rect x={-380} y={-74} width={760} height={148} rx={22} fill="#000" opacity={0.3} transform="translate(8 10)" />
        <rect x={-380} y={-74} width={760} height={148} rx={22} fill="#fff" stroke={INK} strokeWidth={8} />
        {Array.from({length: 7}, (_, i) => {
          const cx = 320 - i * 106;
          const fill = popIn(t - eA - 0.25 - i * 0.07, 0.2);
          return <g key={i}>
            <rect x={cx - 46} y={-56} width={92} height={112} rx={12} fill={RED} stroke={INK} strokeWidth={6} opacity={0.15 + 0.85 * clamp(fill)} />
            <T x={cx} y={4} size={64} color={fill > 0.5 ? '#fff' : INK}>{ar(i + 1)}</T>
          </g>;
        })}
      </g>}
    </Scene>
  );
};

// ================================================================== 2 — morning bedroom: sleepy حمادة presses the wall switch on "داس" (click)… nothing;
// he presses it 3 times fast on "ولا حاجة".
const Switch: React.FC<{x: number; y: number; down: boolean}> = ({x, y, down}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-58} y={-82} width={116} height={164} rx={16} fill="#000" opacity={0.25} transform="translate(6 8)" />
    <rect x={-58} y={-82} width={116} height={164} rx={16} fill="#F7F4EC" stroke={INK} strokeWidth={8} />
    <rect x={-26} y={-48} width={52} height={96} rx={10} fill="#E3DED2" stroke={INK} strokeWidth={6} />
    <rect x={-20} y={down ? -2 : -42} width={40} height={44} rx={8} fill="#fff" stroke={INK} strokeWidth={5} />
  </g>
);
const press = (t: number, times: number[]) => times.some((p) => t >= p && t < p + 0.12);
export const B2: React.FC<BoardProps> = ({t, b0}) => {
  const eD = wi(11) - b0, eN = wi(15) - b0;
  const presses = [eD, eN, eN + 0.22, eN + 0.44];
  const reach = easeInOut(seg(t, eD - 0.55, eD - 0.1));
  const jig = press(t, presses) ? 14 : 0;
  const face: Face = t < eN ? 'sleepy' : 'confused';
  const rArm = {tx: lerp(228, 360, reach) - jig * 0.3, ty: lerp(432, 150, reach) + jig};
  return (
    <Scene bg="linear-gradient(180deg,#C9D3DF 0%,#AEBACB 100%)">
      <rect x={0} y={880} width={W} height={H - 880} fill="#8C7A68" />
      {/* window with early morning light */}
      <g transform="translate(150 150)">
        <rect x={0} y={0} width={250} height={320} fill="#FFE2B0" stroke={INK} strokeWidth={10} />
        <circle cx={170} cy={250} r={46} fill="#FFC56A" />
        <line x1={125} y1={0} x2={125} y2={320} stroke={INK} strokeWidth={8} /><line x1={0} y1={160} x2={250} y2={160} stroke={INK} strokeWidth={8} />
        <path d="M -30 -20 L 60 -20 L 30 360 L -30 360 Z" fill="#7FA6C9" stroke={INK} strokeWidth={6} opacity={0.95} />
      </g>
      {/* ceiling lamp: stays dark */}
      <g transform="translate(540 0)">
        <line x1={0} y1={0} x2={0} y2={90} stroke={INK} strokeWidth={7} />
        <path d="M -70 160 Q -70 90 0 90 Q 70 90 70 160 Z" fill="#B9B4A8" stroke={INK} strokeWidth={7} />
        <ellipse cx={0} cy={166} rx={30} ry={18} fill="#D6D6D6" stroke={INK} strokeWidth={5} />
      </g>
      <T x={680} y={210} size={120} color={RED} stroke={10} s={popIn(t - eD - 0.15, 0.3)} rot={8}>؟</T>
      <Cross x={540} y={290} dt={t - eN - 0.1} r={52} />
      {/* bed corner */}
      <rect x={760} y={760} width={330} height={150} rx={20} fill="#6FA8DC" stroke={INK} strokeWidth={8} />
      <ellipse cx={940} cy={760} rx={110} ry={44} fill="#fff" stroke={INK} strokeWidth={7} />
      <Switch x={720} y={500} down={press(t, presses)} />
      <Hamada x={470} y={330} h={850} t={t} face={face} r={rArm} id="b2h" />
    </Scene>
  );
};

// ================================================================== 3 — "قال عادي": shrug + hand wave, a "تخفيف أحمال" tag, a clock "٢ ساعة" on "ساعتين"
export const B3: React.FC<BoardProps> = ({t, b0}) => {
  const eA = wi(18) - b0, eT = wi(19) - b0, eS = wi(21) - b0;
  const sh = easeOut(seg(t, eA - 0.2, eA + 0.1));
  const wave = t > eA + 0.3 ? Math.sin((t - eA) * 9) * 18 : 0;
  return (
    <Scene bg="linear-gradient(180deg,#D3DBE4 0%,#B7C3D2 100%)">
      <rect x={0} y={880} width={W} height={H - 880} fill="#8C7A68" />
      <Hamada x={330} y={330} h={850} t={t} face={t > eA ? 'happy' : 'sleepy'} id="b3h"
        l={{tx: lerp(72, 6, sh), ty: lerp(432, 250, sh), bend: -1}} r={{tx: lerp(228, 300, sh) + wave * 0.4, ty: lerp(432, 170, sh) + wave}} />
      {t > eA && <T x={110} y={420} size={70} color={INK} s={popIn(t - eA, 0.25)} rot={-12} o={0.85}>~</T>}
      {/* load-shedding tag */}
      {t > eT - 0.05 && <g transform={`translate(790 300) rotate(-4) scale(${popIn(t - eT + 0.05, 0.3)})`}>
        <rect x={-230} y={-74} width={460} height={148} rx={24} fill="#000" opacity={0.25} transform="translate(8 10)" />
        <rect x={-230} y={-74} width={460} height={148} rx={24} fill={YEL} stroke={INK} strokeWidth={9} />
        <Bolt x={170} y={0} s={0.8} c="#fff" />
        <T x={-30} y={6} size={62} color={INK}>تخفيف أحمال</T>
      </g>}
      {t > eS - 0.05 && <g transform={`translate(790 620) scale(${popIn(t - eS + 0.05, 0.3)})`}>
        <Clock x={-110} y={0} r={120} t={t} speed={1.4} />
        <g transform="translate(130 0)">
          <rect x={-110} y={-62} width={220} height={124} rx={62} fill="#fff" stroke={INK} strokeWidth={8} />
          <T x={0} y={6} size={62} color={INK}>{'٢ ساعة'}</T>
        </g>
      </g>}
    </Scene>
  );
};

// ================================================================== 4 — bathroom sink: he opens the tap on "فتح"; it coughs ONE drop… then nothing on "مفيش مية"
export const B4: React.FC<BoardProps> = ({t, b0}) => {
  const eF = wi(23) - b0, eM = wi(27) - b0;
  const turn = easeInOut(seg(t, eF - 0.15, eF + 0.35));
  const dropT = t - (eF + 0.55);
  const cough = t > eF + 0.4 && t < eF + 0.9 ? Math.sin(t * 70) * 3 : 0;
  return (
    <Scene bg="linear-gradient(180deg,#CFE6EC 0%,#A9D0DA 100%)">
      {/* tiles */}
      {Array.from({length: 10 * 9}, (_, i) => <rect key={i} x={(i % 10) * 110} y={Math.floor(i / 10) * 110} width={110} height={110} fill="none" stroke="#fff" strokeWidth={4} opacity={0.6} />)}
      {/* mirror */}
      <rect x={300} y={60} width={480} height={300} rx={30} fill="#E8F6FA" stroke={INK} strokeWidth={10} />
      <path d="M 360 110 L 420 110 L 350 220 Z" fill="#fff" opacity={0.7} />
      {/* sink */}
      <g transform="translate(540 640)">
        <path d="M -380 -40 L 380 -40 Q 360 180 0 200 Q -360 180 -380 -40 Z" fill="#fff" stroke={INK} strokeWidth={10} strokeLinejoin="round" />
        <ellipse cx={0} cy={-40} rx={380} ry={44} fill="#F4F8FA" stroke={INK} strokeWidth={10} />
        <ellipse cx={0} cy={-30} rx={300} ry={26} fill="#DCE8EE" />
        <circle cx={0} cy={-22} r={16} fill="#9AA3AD" stroke={INK} strokeWidth={5} />
        <rect x={-50} y={190} width={100} height={260} fill="#E9EEF1" stroke={INK} strokeWidth={8} />
      </g>
      {/* tap */}
      <g transform={`translate(${540 + cough} 470)`}>
        <rect x={-34} y={-30} width={68} height={130} rx={14} fill="#B7C0C8" stroke={INK} strokeWidth={8} />
        <path d="M -34 -20 L -34 -70 Q -34 -110 30 -110 L 170 -110 Q 200 -110 200 -80 L 200 -40 L 150 -40 L 150 -64 L 30 -64 Q 18 -64 18 -50 L 18 -20 Z" fill="#C9D1D8" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
        <g transform={`translate(0 -126) rotate(${turn * 80})`}>
          <rect x={-90} y={-16} width={180} height={32} rx={16} fill={RED} stroke={INK} strokeWidth={7} />
          <circle r={22} fill="#E9EEF1" stroke={INK} strokeWidth={6} />
        </g>
        {dropT > 0 && dropT < 0.5 && <Drop x={175} y={-30 + easeIn(dropT / 0.5) * 220} s={1.6} />}
        {dropT >= 0.5 && dropT < 0.8 && <ellipse cx={175} cy={196} rx={30 * (1 - (dropT - 0.5) / 0.3)} ry={6} fill="#7CC4F4" opacity={0.8} />}
        {t > eM - 0.1 && <>{[[-1, 0], [1, 0.08]].map(([s, d], i) => <path key={i} d={`M ${175 + s * 26} ${-20} q ${s * 18} -18 ${s * 34} -6`} stroke={INK} strokeWidth={5} fill="none" opacity={clamp((t - eM + 0.1 - d) / 0.1) * (1 - seg(t, eM + 0.6, eM + 0.9))} />)}</>}
      </g>
      <Cross x={800} y={420} dt={t - eM} r={64} />
      <T x={800} y={540} size={64} color={INK} s={popIn(t - eM - 0.1, 0.3)}>{'مفيش!'}</T>
      {/* حمادة at the left of the sink, sleepy and dry, hand on the tap */}
      <Hamada x={190} y={250} h={700} t={t} face={t < eM ? 'sleepy' : 'annoyed'} id="b4h"
        r={{tx: lerp(228, 420, turn > 0 || t > eF - 0.6 ? easeOut(seg(t, eF - 0.6, eF - 0.15)) : 0), ty: lerp(432, 190, easeOut(seg(t, eF - 0.6, eF - 0.15)))}} legsHidden />
    </Scene>
  );
};

// ================================================================== 5 — the building cut-away: the water motor on the ground floor has a plug + red ✗; the pipe up to
// his flat stays empty.
export const B5: React.FC<BoardProps> = ({t, b0}) => {
  const eM = wi(31) - b0, eK = wi(34) - b0;
  const hl = popIn(t - eM, 0.3);
  return (
    <Scene bg="linear-gradient(180deg,#BFE0F5 0%,#E6F2FA 100%)">
      <rect x={0} y={1080} width={W} height={120} fill="#9C8B76" />
      {/* building section */}
      <rect x={150} y={150} width={780} height={930} fill="#F2E3C9" stroke={INK} strokeWidth={10} />
      <path d="M 130 150 L 950 150 L 950 120 L 130 120 Z" fill="#C9A47A" stroke={INK} strokeWidth={8} />
      {[336, 522, 708, 894].map((fy) => <rect key={fy} x={150} y={fy - 8} width={780} height={16} fill="#C9A47A" stroke={INK} strokeWidth={5} />)}
      {/* floors: little windows, his flat on top (number 4) */}
      {[0, 1, 2, 3, 4].map((f) => <g key={f}>
        <rect x={560} y={190 + f * 186} width={120} height={100} fill={f === 0 ? '#FFF3D6' : '#CFE3F2'} stroke={INK} strokeWidth={6} />
        <line x1={620} y1={190 + f * 186} x2={620} y2={290 + f * 186} stroke={INK} strokeWidth={4} />
      </g>)}
      {/* empty pipe from the motor up to the top flat */}
      <path d="M 300 1000 L 300 230 L 470 230" fill="none" stroke={INK} strokeWidth={46} strokeLinejoin="round" />
      <path d="M 300 1000 L 300 230 L 470 230" fill="none" stroke="#E5ECF0" strokeWidth={32} strokeLinejoin="round" />
      {t > eK && <T x={380} y={600} size={54} color="#6B7C88" rot={-90} s={popIn(t - eK, 0.3)}>{'فاضية'}</T>}
      {/* the top-floor tap with no water */}
      <g transform="translate(470 230)"><rect x={0} y={-20} width={70} height={40} rx={10} fill="#B7C0C8" stroke={INK} strokeWidth={6} /><path d="M 50 20 L 50 54 L 70 54 L 70 20" fill="#B7C0C8" stroke={INK} strokeWidth={6} /></g>
      <g transform="translate(830 250)"><Hamada x={0} y={-80} h={260} t={t} face="annoyed" id="b5h" legsHidden /></g>
      {/* the water motor */}
      <g transform={`translate(300 1000) scale(${1 + 0.08 * hl * Math.max(0, Math.sin(t * 10)) * (t < eM + 0.6 ? 1 : 0)})`}>
        <rect x={-120} y={-50} width={240} height={120} rx={20} fill="#3E7CB1" stroke={INK} strokeWidth={8} />
        <circle cx={-50} cy={10} r={44} fill="#2E5D85" stroke={INK} strokeWidth={7} />
        {[0, 60, 120, 180, 240, 300].map((a) => <line key={a} x1={-50} y1={10} x2={-50 + 34 * Math.cos((a * Math.PI) / 180)} y2={10 + 34 * Math.sin((a * Math.PI) / 180)} stroke={INK} strokeWidth={5} />)}
        <rect x={20} y={-30} width={80} height={60} rx={8} fill="#9AA3AD" stroke={INK} strokeWidth={6} />
      </g>
      <Plug x={560} y={1030} s={1.1} />
      <Cross x={640} y={900} dt={t - eK} r={66} />
      {t > eK && <Bolt x={760} y={900} s={popIn(t - eK - 0.1, 0.3)} />}
      {t > eM && <path d={`M 420 1040 Q 480 ${1080} 520 1040`} stroke={RED} strokeWidth={0} />}
    </Scene>
  );
};

// ================================================================== 6 — the phone drains to a red ١٠٪ on "عشرة في المية" (board a little dimmer)
export const B6: React.FC<BoardProps> = ({t, b0}) => {
  const eA = wi(35) - b0, eT = wi(39) - b0;
  const pct = t < eA ? 0.62 : t < eT ? lerp(0.62, 0.1, easeInOut(seg(t, eA, eT))) : 0.1;
  const beep = t > eT && ((t - eT) % 1.2) < 0.15;
  const ph: [number, number] = hand(330, 300, 860, {tx: 240, ty: 300});
  return (
    <Scene bg="linear-gradient(180deg,#D8C8A8 0%,#C5AE8A 100%)">
      <rect x={0} y={880} width={W} height={H - 880} fill="#8C7A68" />
      <Clock x={900} y={190} r={100} t={t * 0.3 + 3} speed={0.6} />
      <Hamada x={330} y={300} h={860} t={t} face={t > eT ? 'worried' : 'neutral'} look={0.6} id="b6h" r={{tx: 240, ty: 300}} l={{tx: 170, ty: 330, bend: -1}} />
      <PhoneG x={ph[0] + 120} y={ph[1] - 40} s={1.15 + (beep ? 0.04 : 0)} rot={6} t={t} pct={pct} />
      {t > eT && <g transform={`translate(860 520) scale(${popIn(t - eT, 0.3)})`}>
        <path d="M 0 -80 L 74 56 L -74 56 Z" fill={YEL} stroke={RED} strokeWidth={12} strokeLinejoin="round" />
        <rect x={-9} y={-34} width={18} height={56} rx={8} fill={INK} /><circle cx={0} cy={38} r={10} fill={INK} />
      </g>}
    </Scene>
  );
};

// ================================================================== 7 — day 2: a plain street cash machine with a black dead screen; he taps it; on "الفيزا" the plain
// card in his hand turns grey.
export const B7: React.FC<BoardProps> = ({t, b0}) => {
  const eN = wi(44) - b0, eM = wi(47) - b0, eV = wi(50) - b0, eL = wi(51) - b0;
  const tapping = t > eM - 0.3 && t < eV - 0.2;
  const tap = tapping ? Math.max(0, Math.sin((t - eM) * 14)) * 18 : 0;
  const cardUp = easeOut(seg(t, eV - 0.35, eV));
  const grey = seg(t, eV + 0.1, eV + 0.6);
  const walk = t < eM - 0.3 ? 1 - seg(t, eN, eM - 0.3) : 0;
  const rA = tapping ? {tx: 360 - tap * 0.2, ty: 200 + tap * 0.2} : t >= eV - 0.35 ? {tx: lerp(228, 300, cardUp), ty: lerp(432, 200, cardUp)} : {tx: 228, ty: 432};
  const hx = 300 - walk * 40;
  const cp = hand(hx, 330, 820, rA);
  return (
    <Scene bg="linear-gradient(180deg,#9DB0C8 0%,#B8C4D4 100%)">
      <rect x={0} y={900} width={W} height={H - 900} fill="#7E8590" />
      <rect x={0} y={890} width={W} height={20} fill="#646B76" />
      {/* the cash machine (plain, no brand) */}
      <g transform="translate(720 520)">
        <rect x={-230} y={-380} width={460} height={760} rx={30} fill="#000" opacity={0.25} transform="translate(10 12)" />
        <rect x={-230} y={-380} width={460} height={760} rx={30} fill="#5B6B7E" stroke={INK} strokeWidth={10} />
        <rect x={-200} y={-350} width={400} height={90} rx={16} fill="#3E4A58" stroke={INK} strokeWidth={6} />
        <g transform="translate(0 -305)"><rect x={-40} y={-26} width={80} height={52} rx={8} fill="#7FB37F" stroke={INK} strokeWidth={5} /><circle r={14} fill="#5A8F5A" stroke={INK} strokeWidth={4} /></g>
        <rect x={-170} y={-230} width={340} height={230} rx={14} fill="#0B0D10" stroke={INK} strokeWidth={8} />
        <path d="M -150 -210 L -90 -210 L -150 -150 Z" fill="#fff" opacity={0.08} />
        {Array.from({length: 12}, (_, i) => <rect key={i} x={-120 + (i % 3) * 70} y={40 + Math.floor(i / 3) * 52} width={56} height={40} rx={8} fill="#C9D1D8" stroke={INK} strokeWidth={4} />)}
        <rect x={110} y={50} width={70} height={14} rx={7} fill={INK} />
        <rect x={-130} y={270} width={260} height={24} rx={12} fill={INK} />
      </g>
      {t > eM + 0.3 && t < eV && <T x={720} y={-30 + 520 - 230 + 115 + 30} size={56} color="#3a3f44" o={0.6 + 0.4 * Math.sin(t * 6)}>...</T>}
      <Hamada x={hx} y={330} h={820} t={t} face={t > eV ? 'annoyed' : t > eM ? 'confused' : 'neutral'} id="b7h" r={rA} />
      {/* the plain card */}
      {t > eV - 0.35 && <g transform={`translate(${cp[0] + 40} ${cp[1] - 40}) rotate(-12)`}>
        <rect x={-110} y={-70} width={220} height={140} rx={18} fill={grey > 0.5 ? '#9A9A9A' : '#2F7FD8'} stroke={INK} strokeWidth={8} />
        <rect x={-80} y={-30} width={46} height={34} rx={6} fill={grey > 0.5 ? '#BDBDBD' : '#E9C04A'} stroke={INK} strokeWidth={4} />
        <rect x={-80} y={26} width={150} height={12} rx={6} fill="#fff" opacity={0.7} />
        {grey > 0 && grey < 1 && <rect x={-110} y={-70} width={220} height={140} rx={18} fill="#9A9A9A" opacity={grey} />}
      </g>}
      <Cross x={720} y={150} dt={t - eM - 0.4} r={60} />
      {t > eL && <Cross x={cp[0] + 150} y={cp[1] - 140} dt={t - eL} r={46} />}
      <DayPill text="اليوم التاني" />
    </Scene>
  );
};

// ================================================================== 8 — the petrol station: the big underground tank is full ("موجود" ✓), the pump on top has a plug + red
// ✗ on "الطلمبة"; حمادة waits in his car and shrugs.
const Car: React.FC<{x: number; y: number; t: number; shrug: number}> = ({x, y, t, shrug}) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M -230 0 L -230 -70 Q -220 -100 -180 -104 L -120 -110 L -70 -180 Q -60 -192 -40 -192 L 110 -192 Q 130 -192 140 -178 L 190 -110 L 230 -100 Q 250 -94 250 -70 L 250 0 Z" fill="#E2574C" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
    <path d="M -50 -174 L 30 -174 L 30 -118 L -96 -118 Z" fill="#CFE6F5" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M 50 -174 L 106 -174 Q 118 -174 124 -164 L 160 -118 L 50 -118 Z" fill="#CFE6F5" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <g transform={`translate(-10 ${-48 - shrug * 6})`}><svg x={-70} y={-150} width={140} height={150} viewBox="45 20 210 230" overflow="hidden">
      <Hamada x={150} y={20} h={700} t={t} face={shrug > 0.5 ? 'confused' : 'neutral'} id="b8h" legsHidden />
    </svg></g>
    {[-140, 150].map((wx) => <g key={wx}><circle cx={wx} cy={4} r={50} fill="#2A2A2A" stroke={INK} strokeWidth={8} /><circle cx={wx} cy={4} r={20} fill="#BFC5CC" stroke={INK} strokeWidth={5} /></g>)}
    {shrug > 0 && <><T x={-150} y={-260} size={66} color={INK} s={shrug} rot={-14}>؟</T><T x={120} y={-270} size={56} color={INK} s={shrug} rot={12}>؟</T></>}
  </g>
);
export const B8: React.FC<BoardProps> = ({t, b0}) => {
  const eB = wi(54) - b0, eT = wi(57) - b0, eK = wi(58) - b0;
  const wave = Math.sin(t * 2.2) * 10;
  return (
    <Scene bg="linear-gradient(180deg,#A8B8CC 0%,#C6CFDA 100%)">
      {/* canopy */}
      <rect x={60} y={90} width={960} height={70} rx={10} fill="#2F8F6B" stroke={INK} strokeWidth={8} />
      <rect x={120} y={160} width={30} height={420} fill="#D9D9D9" stroke={INK} strokeWidth={6} />
      <rect x={930} y={160} width={30} height={420} fill="#D9D9D9" stroke={INK} strokeWidth={6} />
      {/* ground surface line, then the underground cut-away */}
      <rect x={0} y={580} width={W} height={H - 580} fill="#8E7A62" />
      <rect x={0} y={570} width={W} height={24} fill="#5E5E5E" stroke={INK} strokeWidth={5} />
      {/* the tank, full of fuel */}
      <g transform="translate(540 820)">
        <rect x={-430} y={-150} width={860} height={300} rx={150} fill="#D0D4D8" stroke={INK} strokeWidth={10} />
        <clipPath id="b8tank"><rect x={-420} y={-140} width={840} height={280} rx={140} /></clipPath>
        <g clipPath="url(#b8tank)">
          <path d={`M -440 ${-90 + wave} Q -220 ${-120 + wave} 0 ${-90 + wave} Q 220 ${-60 + wave} 440 ${-90 + wave} L 440 160 L -440 160 Z`} fill="#F2A43A" />
          <path d={`M -440 ${-90 + wave} Q -220 ${-120 + wave} 0 ${-90 + wave} Q 220 ${-60 + wave} 440 ${-90 + wave}`} stroke="#FFD27A" strokeWidth={10} fill="none" />
        </g>
        <rect x={-430} y={-150} width={860} height={300} rx={150} fill="none" stroke={INK} strokeWidth={10} />
        <T x={0} y={40} size={78} color="#fff" stroke={10}>بنزين</T>
      </g>
      <Check x={930} y={720} dt={t - eB - 0.3} r={60} />
      {/* pipe up to the pump */}
      <rect x={700} y={330} width={26} height={350} fill="#9AA3AD" stroke={INK} strokeWidth={6} />
      {/* the pump (generic) */}
      <g transform="translate(740 400)">
        <rect x={-110} y={-200} width={220} height={380} rx={22} fill="#F4F1E8" stroke={INK} strokeWidth={9} />
        <rect x={-80} y={-170} width={160} height={90} rx={10} fill={t > eT ? '#1A1D22' : '#BFE3C3'} stroke={INK} strokeWidth={6} />
        <rect x={-110} y={60} width={220} height={36} fill={RED} stroke={INK} strokeWidth={6} />
        <path d="M 110 -60 Q 170 -60 170 20 L 170 120" stroke={INK} strokeWidth={14} fill="none" />
        <rect x={150} y={110} width={40} height={60} rx={8} fill="#3a3a3a" stroke={INK} strokeWidth={5} />
      </g>
      <Plug x={950} y={520} s={0.9} rot={-10} />
      <Cross x={760} y={250} dt={t - eT} r={64} />
      {t > eK && <Bolt x={890} y={250} s={popIn(t - eK, 0.3)} />}
      <Car x={330} y={560} t={t} shrug={popIn(t - eT - 0.3, 0.35)} />
    </Scene>
  );
};

// ================================================================== 9 — day 3 (dark blue, candle light): the freezer door opens, water drips, the chicken melts; a tiny
// black ribbon pops on it on "البقية في حياتك".
const Chicken: React.FC<{x: number; y: number; s: number; melt: number; t: number}> = ({x, y, s, melt, t}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d={`M -120 30 Q -130 -70 -20 -80 Q 100 -86 120 0 Q 126 50 60 60 L -70 60 Q -116 58 -120 30 Z`} fill="#F4D8B4" stroke={INK} strokeWidth={8} transform={`scale(1 ${1 - 0.12 * melt})`} />
    {[-1, 1].map((sd) => <g key={sd} transform={`translate(${sd * 90} ${-10}) rotate(${sd * 40})`}>
      <rect x={-14} y={-90} width={28} height={70} rx={14} fill="#F4D8B4" stroke={INK} strokeWidth={7} /><circle cx={0} cy={-96} r={18} fill="#FFF8EE" stroke={INK} strokeWidth={6} />
    </g>)}
    {melt < 1 && Array.from({length: 7}, (_, i) => <path key={i} d={`M ${-90 + i * 30} ${-40 + (i % 2) * 30} l 8 -10 l 8 10 l -8 10 Z`} fill="#DFF4FF" stroke="#9CC8DE" strokeWidth={2} opacity={1 - melt} />)}
    {melt > 0 && [-60, 10, 70].map((dx, i) => <Drop key={i} x={dx} y={70 + ((t * 120 + i * 40) % 90)} s={0.8} />)}
  </g>
);
export const B9: React.FC<BoardProps> = ({t, b0}) => {
  const eF = wi(61) - b0, eS = wi(62) - b0, eB = wi(66) - b0;
  const door = easeOut(seg(t, eF - 0.3, eF + 0.3));
  const melt = seg(t, eS, eS + 1.6);
  const pud = seg(t, eS, eB + 0.5);
  return (
    <Scene bg="radial-gradient(ellipse at 30% 45%,#34416E 0%,#1E2648 55%,#121630 100%)">
      <rect x={0} y={900} width={W} height={H - 900} fill="#1A1E33" />
      {/* candle on the counter lights the freezer */}
      <Glow x={240} y={560} r={520} c="#FFB868" o={0.95} id="b9g" />
      <rect x={60} y={640} width={330} height={260} fill="#5A4636" stroke={INK} strokeWidth={8} />
      <Candle x={220} y={640} s={1.3} t={t} />
      {/* freezer */}
      <g transform="translate(700 470)">
        <rect x={-260} y={-380} width={520} height={760} rx={30} fill="#D6DDE6" stroke={INK} strokeWidth={10} />
        <rect x={-230} y={-350} width={460} height={700} rx={18} fill="#9FB4C8" stroke={INK} strokeWidth={6} />
        <rect x={-230} y={-60} width={460} height={14} fill="#C9D3DD" stroke={INK} strokeWidth={4} />
        <Chicken x={0} y={-180} s={1.15} melt={melt} t={t} />
        {t > eB && <g transform={`translate(70 -260) scale(${stampK(t - eB)})`}>
          <path d="M 0 0 L -26 60 L -8 56 L 0 76 L 8 56 L 26 60 Z" fill="#111" stroke="#555" strokeWidth={3} />
          <circle r={14} fill="#111" stroke="#555" strokeWidth={3} />
        </g>}
        {/* the door swings open toward the viewer's left */}
        <g transform={`translate(-260 0) scale(${1 - 1.15 * door} 1)`}>
          <rect x={0} y={-380} width={520} height={760} rx={30} fill="#E8EDF2" stroke={INK} strokeWidth={10} />
          <rect x={440} y={-120} width={26} height={240} rx={13} fill="#9AA3AD" stroke={INK} strokeWidth={6} />
        </g>
        {/* drips + puddle */}
        {door > 0.5 && [-150, -40, 90, 180].map((dx, i) => <Drop key={i} x={dx} y={300 + ((t * 160 + i * 37) % 110)} s={0.9} />)}
        <ellipse cx={0} cy={410} rx={60 + 300 * pud} ry={10 + 22 * pud} fill="#7CC4F4" opacity={0.75} stroke={INK} strokeWidth={4} />
      </g>
      <DayPill text="اليوم التالت" dark />
    </Scene>
  );
};

// ================================================================== 10 — night: dark street, حمادة on his balcony with a candle; the sky fills with stars on "النجوم";
// he looks up amazed.
export const B10: React.FC<BoardProps> = ({t, b0}) => {
  const eN = wi(76) - b0, eA = wi(73) - b0;
  const stars = seg(t, eN - 0.3, eN + 1.0);
  const look = easeOut(seg(t, eA, eN));
  const cnd = hand(560, 290, 600, {tx: 240, ty: 330});
  return (
    <Scene bg="linear-gradient(180deg,#070B1E 0%,#131A3C 60%,#1E2550 100%)">
      {Array.from({length: 120}, (_, i) => {
        const on = rand(i + 2) < stars;
        const r = 2 + rand(i + 70) * 4.5;
        return on ? <path key={i} transform={`translate(${rand(i + 11) * W} ${20 + rand(i + 33) * 560}) scale(${r / 10 * (0.8 + 0.3 * Math.sin(t * 4 + i))})`} d="M0 -10 Q 1.5 -1.5 10 0 Q 1.5 1.5 0 10 Q -1.5 1.5 -10 0 Q -1.5 -1.5 0 -10 Z" fill="#FFF7D0" /> : null;
      })}
      {stars > 0.6 && <path d="M 80 140 Q 540 40 1000 160" stroke="#E8E2FF" strokeWidth={70} fill="none" opacity={0.08 * stars} strokeLinecap="round" />}
      {/* dark city: Cairo Tower silhouette + blocks with no lights */}
      <g fill="#0B0F22" stroke="#2A3366" strokeWidth={4}>
        <path d="M 160 640 L 170 380 L 150 360 L 210 360 L 190 380 L 200 640 Z" />
        {[[0, 560, 140], [130, 610, 110], [230, 520, 150], [820, 540, 140], [950, 600, 140]].map(([x, y, w], i) => <rect key={i} x={x} y={y} width={w} height={700} />)}
      </g>
      {/* his building + balcony */}
      <rect x={380} y={440} width={460} height={760} fill="#1D2342" stroke={INK} strokeWidth={8} />
      <rect x={430} y={480} width={360} height={300} fill="#141933" stroke={INK} strokeWidth={6} />
      <Glow x={cnd[0] + 10} y={cnd[1] - 40} r={330} c="#FFB868" o={0.9} id="b10g" />
      <Hamada x={560} y={290} h={600} t={t} face={t > eN ? 'amazed' : 'neutral'} look={0} id="b10h" r={{tx: 240, ty: 330}} l={{tx: 70, ty: 430}} legsHidden />
      <g transform={`translate(${560} ${290}) rotate(0)`} />
      <Candle x={cnd[0]} y={cnd[1] + 20} s={0.9} t={t} />
      {/* head tilts up: drawn as a small upward glance mark */}
      {look > 0 && t > eN && <g opacity={look}>{[-1, 1].map((s) => <path key={s} d={`M ${560 + s * 120} ${260} l ${s * 20} -30`} stroke="#FFF7D0" strokeWidth={6} strokeLinecap="round" />)}</g>}
      <rect x={380} y={720} width={460} height={26} fill="#3A4370" stroke={INK} strokeWidth={6} />
      {Array.from({length: 11}, (_, i) => <rect key={i} x={392 + i * 42} y={746} width={12} height={130} fill="#3A4370" stroke={INK} strokeWidth={4} />)}
      <rect x={380} y={870} width={460} height={22} fill="#3A4370" stroke={INK} strokeWidth={6} />
      <Moon x={930} y={150} r={60} />
    </Scene>
  );
};
const Moon: React.FC<{x: number; y: number; r: number}> = ({x, y, r}) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r * 1.8} fill="#FFF7D0" opacity={0.08} />
    <circle r={r} fill="#FFF3C4" stroke={INK} strokeWidth={6} />
    <circle cx={r * 0.38} cy={-r * 0.18} r={r * 0.92} fill="#0E1430" />
  </g>
);

// ================================================================== 11 — day 7 (warm candle light): the candle-lit staircase, حمادة plays dominoes with 3 neighbours;
// clack on "دومينو", they laugh.
const Tile: React.FC<{x: number; y: number; s: number; rot?: number; a: number; b: number}> = ({x, y, s, rot = 0, a, b}) => {
  const pip = (n: number, cy: number) => ([[[0, 0]], [[-12, -12], [12, 12]], [[-12, -12], [0, 0], [12, 12]], [[-12, -12], [12, -12], [-12, 12], [12, 12]], [[-12, -12], [12, -12], [0, 0], [-12, 12], [12, 12]], [[-12, -14], [12, -14], [-12, 0], [12, 0], [-12, 14], [12, 14]]][n - 1] ?? [])
    .map(([px, py], i) => <circle key={cy + '-' + i} cx={px} cy={cy + py} r={5} fill={INK} />);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <rect x={-30} y={-60} width={60} height={120} rx={10} fill="#FBF6EA" stroke={INK} strokeWidth={6} />
      <line x1={-22} y1={0} x2={22} y2={0} stroke={INK} strokeWidth={4} />
      {pip(a, -30)}{pip(b, 30)}
    </g>
  );
};
export const B11: React.FC<BoardProps> = ({t, b0}) => {
  const eD = wi(85) - b0, eJ = wi(87) - b0;
  const slam = t > eD ? stampK(t - eD) : 0;
  const lg = t > eD + 0.2 ? 1 : 0;
  return (
    <Scene bg="radial-gradient(ellipse at 50% 55%,#6B4A2E 0%,#3A2718 60%,#20150D 100%)">
      {/* the stairs */}
      {Array.from({length: 6}, (_, i) => <g key={i}>
        <rect x={-20} y={420 + i * 130} width={W + 40} height={130} fill={i % 2 ? '#7A5A3E' : '#86664A'} stroke={INK} strokeWidth={6} />
        <rect x={-20} y={420 + i * 130} width={W + 40} height={18} fill="#A7835F" stroke={INK} strokeWidth={4} />
      </g>)}
      <rect x={0} y={0} width={W} height={430} fill="#4A3524" />
      <path d="M 60 0 L 60 430 M 1020 0 L 1020 430" stroke="#2E1F14" strokeWidth={20} />
      {[[110, 418], [960, 418], [540, 418]].map(([cx, cy], i) => <g key={i}><Glow x={cx} y={cy - 80} r={260} c="#FFB25A" o={0.8} id={`b11g${i}`} /><Candle x={cx} y={cy} s={0.95} t={t + i} /></g>)}
      {/* players: two on the upper step, two on the lower one, tiles between */}
      <Person x={250} y={160} h={560} t={t} v="old" sit arm="hold" laugh={lg} />
      <Person x={830} y={160} h={560} t={t} v="cap" sit arm="hold" laugh={lg} flip />
      <Person x={160} y={520} h={560} t={t} v="track" sit arm="hold" laugh={lg} />
      <Hamada x={900} y={520} h={560} t={t} face={t > eD + 0.2 ? 'laugh' : 'happy'} id="b11h" sit l={{tx: 140, ty: 360, bend: -1}} r={{tx: 200, ty: 360}} />
      {/* domino line on the step */}
      <g transform="translate(540 650)">
        {[[-150, 0, 3, 5], [-75, 0, 5, 2], [0, 0, 2, 6], [75, 0, 6, 1]].map(([x, y, a, b], i) => <Tile key={i} x={x} y={y} s={0.9} rot={90} a={a} b={b} />)}
        {t > eD - 0.15 && <Tile x={150} y={-20 + (1 - Math.min(1, slam)) * -60} s={0.9 * Math.max(1, slam)} rot={90} a={1} b={4} />}
      </g>
      {t > eD && <g opacity={1 - seg(t, eD + 0.2, eD + 0.5)}>{[0, 1, 2, 3].map((i) => <line key={i} x1={690 + Math.cos(i * 1.6) * 60} y1={630 + Math.sin(i * 1.6) * 60} x2={690 + Math.cos(i * 1.6) * 100} y2={630 + Math.sin(i * 1.6) * 100} stroke={YEL} strokeWidth={8} strokeLinecap="round" />)}</g>}
      {t > eJ && <T x={540} y={330} size={70} color={YEL} stroke={9} s={popIn(t - eJ, 0.3)}>ها ها ها</T>}
      <DayPill text="اليوم السابع" dark />
    </Scene>
  );
};

// ================================================================== 12 — the mystery: dark board, one big "؟" pulsing in the centre (holds still in the pause except the pulse)
export const B12: React.FC<BoardProps & {tq?: number}> = ({t, tq = t}) => (
  <Scene bg="radial-gradient(ellipse at 50% 45%,#232A3A 0%,#10141C 70%,#07090D 100%)">
    <Glow x={540} y={500} r={420} c="#FFD23F" o={0.18 + 0.12 * Math.sin(tq * 5)} id="b12g" />
    <QMark x={540} y={420} s={(popIn(t, 0.35) || 0) * (1 + 0.06 * Math.sin(tq * 5))} size={560} />
  </Scene>
);

// ================================================================== 13 — TWIST on "بروفة": sepia washes in, the calendar flips fast backwards from ٢٠٢٦ and lands on ١٨٥٩
// on "تسعة"; a red stamp on "وخمسين".
export const B13: React.FC<BoardProps> = ({t, b0}) => {
  const eB = wi(98) - b0, eL = wi(102) - b0, eS = wi(103) - b0;
  const sep = seg(t, eB - 0.05, eB + 0.3);
  const u = seg(t, eB, eL);
  const year = t < eB ? 2026 : t >= eL ? 1859 : Math.round(lerp(2026, 1859, easeIn(u) * 0.35 + u * 0.65));
  const flipping = t >= eB && t < eL;
  const ph = flipping ? ((t - eB) * 14) % 1 : 0;
  return (
    <Scene bg={`linear-gradient(180deg,${sep > 0.5 ? '#E8D3A8' : '#EAEFF5'} 0%,${sep > 0.5 ? '#C9A86E' : '#CBD5E2'} 100%)`}>
      {sep > 0 && <g opacity={sep}>
        <rect x={0} y={0} width={W} height={H} fill="#D9BE8A" />
        {Array.from({length: 40}, (_, i) => <circle key={i} cx={rand(i + 3) * W} cy={rand(i + 41) * H} r={10 + rand(i + 7) * 40} fill="#A9804A" opacity={0.08} />)}
        <rect x={20} y={20} width={W - 40} height={H - 40} fill="none" stroke="#8B6A3A" strokeWidth={6} opacity={0.5} />
      </g>}
      <g transform="translate(540 470)">
        <rect x={-330} y={-300} width={660} height={620} rx={30} fill="#000" opacity={0.25} transform="translate(12 14)" />
        <rect x={-330} y={-300} width={660} height={620} rx={30} fill={sep > 0.5 ? '#F6E9CC' : '#fff'} stroke={INK} strokeWidth={12} />
        <rect x={-330} y={-300} width={660} height={140} rx={30} fill={sep > 0.5 ? '#9C4A2E' : RED} stroke={INK} strokeWidth={12} />
        <T x={0} y={-226} size={80} color="#fff">سنة</T>
        {[-180, 180].map((rx) => <rect key={rx} x={rx - 16} y={-340} width={32} height={90} rx={16} fill="#ddd" stroke={INK} strokeWidth={8} />)}
        <T x={0} y={90} size={250} color={t >= eL ? RED : INK}>{ar(year)}</T>
        {flipping && <g transform={`translate(0 -160) scale(1 ${1 - ph})`} opacity={1 - ph * 0.6}>
          <rect x={-320} y={0} width={640} height={300} fill="#fff" stroke={INK} strokeWidth={6} />
        </g>}
        {flipping && Array.from({length: 4}, (_, i) => {
          const p = (((t - eB) * 3 + i * 0.25) % 1);
          return <rect key={i} x={-120} y={-80} width={240} height={160} rx={12} fill="#fff" stroke={INK} strokeWidth={5} opacity={1 - p}
            transform={`translate(${lerp(0, (i % 2 ? 1 : -1) * 520, p)} ${lerp(-120, -560, p)}) rotate(${p * (i % 2 ? 120 : -120)})`} />;
        })}
      </g>
      {t > eS && <g transform={`translate(780 760) rotate(-14) scale(${stampK(t - eS)})`}>
        <circle r={120} fill="rgba(255,255,255,0.85)" stroke={RED} strokeWidth={16} />
        <T x={0} y={6} size={92} color={RED}>{ar(1859)}</T>
      </g>}
    </Scene>
  );
};

// ================================================================== 14 — the solar storm: (a) the sun throws a big orange flare at a small Earth, (b) the 1859 telegraph office
// at night: the operator jumps back as his machine throws sparks on "شرار", red + green sky in the window, (c) a world map where the
// glow spreads down to the Caribbean (pin "الكاريبي").
const Telegraph: React.FC<{x: number; y: number; sp: number; t: number}> = ({x, y, sp, t}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-170} y={0} width={340} height={60} rx={10} fill="#7A4A26" stroke={INK} strokeWidth={8} />
    <rect x={-140} y={-40} width={160} height={40} rx={6} fill="#5A3A1E" stroke={INK} strokeWidth={6} />
    <g transform={`rotate(${sp > 0 ? Math.sin(t * 50) * 4 : 0} -60 -40)`}><rect x={-120} y={-70} width={130} height={18} rx={9} fill="#C9A14A" stroke={INK} strokeWidth={5} /><circle cx={10} cy={-62} r={14} fill="#222" stroke={INK} strokeWidth={4} /></g>
    {[60, 120].map((cx) => <g key={cx}><rect x={cx - 22} y={-90} width={44} height={90} rx={8} fill="#B87333" stroke={INK} strokeWidth={6} /><circle cx={cx} cy={-96} r={12} fill="#C9A14A" stroke={INK} strokeWidth={4} /></g>)}
    {sp > 0 && Array.from({length: 14}, (_, i) => {
      const a = rand(i + Math.floor(t * 20)) * Math.PI * 2, L = 50 + rand(i * 3 + Math.floor(t * 20)) * 110;
      return <path key={i} d={`M ${90} ${-100} l ${Math.cos(a) * L * 0.5} ${Math.sin(a) * L * 0.5 - 20} l ${Math.cos(a + 0.6) * L * 0.4} ${Math.sin(a + 0.6) * L * 0.4}`} stroke={i % 2 ? '#FFF6A0' : '#FFB43A'} strokeWidth={7} fill="none" strokeLinecap="round" opacity={sp} />;
    })}
    {sp > 0 && <circle cx={90} cy={-100} r={46 * sp} fill="#FFF6C0" opacity={0.85} />}
  </g>
);
export const B14: React.FC<BoardProps> = ({t, b0}) => {
  const eK = wi(107) - b0, eSp = wi(111) - b0, eS = wi(112) - b0, eC = wi(115) - b0, eSun = wi(104) - b0;
  const phase = t < eK ? 0 : t < eS ? 1 : 2;
  if (phase === 0) {
    const fl = easeOut(seg(t, eSun + 0.2, eK - 0.1));
    return (
      <Scene bg="radial-gradient(ellipse at 20% 50%,#3A1E10 0%,#120A10 60%,#05050A 100%)">
        {Array.from({length: 40}, (_, i) => <circle key={i} cx={rand(i + 1) * W} cy={rand(i + 9) * H} r={2 + rand(i) * 2} fill="#fff" opacity={0.5} />)}
        <g transform="translate(150 520)">
          <Glow x={0} y={0} r={460} c="#FF9A2E" o={1} id="b14s" />
          <circle r={250} fill="#FFB43A" stroke="#E0701A" strokeWidth={14} />
          {Array.from({length: 10}, (_, i) => <circle key={i} cx={Math.cos(i) * 140} cy={Math.sin(i * 1.7) * 140} r={20 + rand(i) * 20} fill="#F08A24" opacity={0.6} />)}
        </g>
        {/* the flare: a big tongue of fire racing to the Earth */}
        <path d={`M 360 470 Q ${lerp(380, 640, fl)} ${lerp(470, 360, fl)} ${lerp(390, 860, fl)} 500 Q ${lerp(380, 640, fl)} ${lerp(520, 640, fl)} 360 580 Z`} fill="#FF7A1A" stroke="#FFD27A" strokeWidth={8} opacity={fl > 0 ? 0.95 : 0} />
        <g transform="translate(900 520)">
          <Glow x={0} y={0} r={160} c="#7FD8FF" o={0.6} id="b14e" />
          <circle r={80} fill="#3F8FE0" stroke={INK} strokeWidth={8} />
          <path d="M -40 -40 q 30 -10 50 10 q -10 30 -40 30 Z M 10 0 q 40 0 50 20 q -10 30 -30 40 Z" fill="#5CC36A" stroke={INK} strokeWidth={4} />
          {fl > 0.9 && <circle r={96} fill="none" stroke="#FF7A1A" strokeWidth={10} opacity={0.6 + 0.4 * Math.sin(t * 20)} />}
        </g>
      </Scene>
    );
  }
  if (phase === 1) {
    const sp = t > eSp - 0.05 ? 1 - seg(t, eSp + 1.2, eS) * 0.5 : t > eK + 0.9 ? 0.3 * (Math.sin(t * 30) > 0.5 ? 1 : 0) : 0;
    const jump = t > eSp - 0.05 ? easeOut(seg(t, eSp - 0.05, eSp + 0.2)) : 0;
    return (
      <Scene bg="linear-gradient(180deg,#3B2A1E 0%,#2A1D14 100%)">
        {/* wallpaper + window with the aurora */}
        {Array.from({length: 12}, (_, i) => <line key={i} x1={i * 100} y1={0} x2={i * 100} y2={760} stroke="#4A3626" strokeWidth={16} />)}
        <g transform="translate(700 90)">
          <rect x={0} y={0} width={320} height={380} fill="#0E1022" stroke="#5A3A1E" strokeWidth={18} />
          <clipPath id="b14w"><rect x={0} y={0} width={320} height={380} /></clipPath>
          <g clipPath="url(#b14w)">
            <path d={`M -20 ${180 + Math.sin(t * 2) * 20} Q 100 ${60 + Math.sin(t * 2.6) * 30} 200 ${150} T 360 ${120}`} stroke="#4CF08A" strokeWidth={70} fill="none" opacity={0.7} />
            <path d={`M -20 ${90 + Math.sin(t * 2.3) * 20} Q 120 ${10} 240 ${70} T 360 ${40}`} stroke="#FF4A6A" strokeWidth={60} fill="none" opacity={0.65} />
          </g>
          <line x1={160} y1={0} x2={160} y2={380} stroke="#5A3A1E" strokeWidth={10} /><line x1={0} y1={190} x2={320} y2={190} stroke="#5A3A1E" strokeWidth={10} />
        </g>
        {/* oil lamp */}
        <g transform="translate(120 330)"><Glow x={0} y={-40} r={200} c="#FFB868" o={0.6} id="b14l" /><path d="M -30 0 Q -40 -40 0 -50 Q 40 -40 30 0 Z" fill="#E8D9B0" stroke={INK} strokeWidth={5} /><rect x={-36} y={0} width={72} height={20} rx={6} fill="#B87333" stroke={INK} strokeWidth={5} /></g>
        <rect x={0} y={700} width={W} height={60} fill="#5A3A1E" stroke={INK} strokeWidth={8} />
        <Telegraph x={470} y={640} sp={sp} t={t} />
        {/* papers that smoke a little */}
        <g transform="translate(250 690)"><rect x={-70} y={-16} width={140} height={20} fill="#F4ECD8" stroke={INK} strokeWidth={4} transform="rotate(-6)" />
          {t > eSp && [0, 1, 2].map((i) => <circle key={i} cx={-20 + i * 26 + Math.sin(t * 2 + i) * 10} cy={-40 - ((t - eSp) * 60 + i * 30) % 160} r={16 + i * 4} fill="#9A9A9A" opacity={0.35} />)}</g>
        <Person x={lerp(520, 300, jump)} y={lerp(200, 160, jump)} h={620} t={t} v="operator" arm={jump > 0.3 ? 'up' : 'hold'} face={jump > 0.3 ? 'shock' : 'smile'} />
        <T x={300} y={110} size={64} color="#F4E2B8" stroke={8} s={popIn(t - eK - 0.2, 0.3)}>{ar(1859)}</T>
      </Scene>
    );
  }
  // phase 2: world map, the red-green glow spreads south to the Caribbean
  const g = easeInOut(seg(t, eS, eC + 0.1));
  return (
    <Scene bg="linear-gradient(180deg,#0E2244 0%,#163866 100%)">
      <defs>
        <linearGradient id="b14au" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF4A6A" stopOpacity={0.75} /><stop offset="45%" stopColor="#4CF08A" stopOpacity={0.6} /><stop offset="100%" stopColor="#4CF08A" stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* simple continents (Americas left, Europe/Africa right) */}
      <g fill="#2F7A55" stroke={INK} strokeWidth={6} strokeLinejoin="round">
        <path d="M 120 160 Q 230 110 360 150 Q 420 220 380 300 Q 330 360 300 420 Q 280 470 230 470 Q 200 430 180 380 Q 120 320 110 250 Z" />
        <path d="M 300 560 Q 380 540 430 600 Q 450 720 400 820 Q 360 920 330 1000 Q 300 940 300 860 Q 270 740 280 640 Z" />
        <path d="M 640 160 Q 720 130 800 160 Q 820 220 760 260 Q 700 280 660 240 Z" />
        <path d="M 680 330 Q 800 310 870 380 Q 880 520 820 640 Q 780 720 740 720 Q 700 600 680 480 Q 650 400 680 330 Z" />
      </g>
      {/* Caribbean islands */}
      <g fill="#3E9A6A" stroke={INK} strokeWidth={4}>
        {[[330, 500, 40, 12], [400, 520, 26, 10], [440, 540, 16, 8], [372, 540, 12, 7]].map(([cx, cy, rx, ry], i) => <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} />)}
      </g>
      {/* the glow curtain coming down from the north */}
      <rect x={0} y={0} width={W} height={lerp(160, 560, g)} fill="url(#b14au)" opacity={0.85} />
      {Array.from({length: 6}, (_, i) => <path key={i} d={`M ${i * 200 - 40} 20 q 40 ${lerp(120, 480, g) * 0.5} 0 ${lerp(120, 480, g)}`} stroke={i % 2 ? '#4CF08A' : '#FF4A6A'} strokeWidth={20} fill="none" opacity={0.25 + 0.1 * Math.sin(t * 3 + i)} />)}
      {t > eC && <g transform={`translate(380 ${440 - Math.abs(Math.sin((t - eC) * 4)) * 10 * Math.exp(-(t - eC) * 2)}) scale(${popIn(t - eC, 0.3)})`}>
        <path d="M 0 60 Q -50 0 -50 -40 A 50 50 0 1 1 50 -40 Q 50 0 0 60 Z" fill={RED} stroke={INK} strokeWidth={7} />
        <circle cx={0} cy={-40} r={18} fill="#fff" stroke={INK} strokeWidth={4} />
        <g transform="translate(250 -40)"><rect x={-150} y={-50} width={300} height={100} rx={50} fill={YEL} stroke={INK} strokeWidth={7} /><T x={0} y={4} size={58} color={INK}>الكاريبي</T></g>
      </g>}
    </Scene>
  );
};

// ================================================================== 15 — split board: left = 1859 one thin telegraph wire; right = today one wire branching into phone, cash machine,
// tap, fridge, hospital cross, petrol pump, all lit on "حياتك كلها" (soft hum).
const Ico: React.FC<{k: string; x: number; y: number; s: number; on: number}> = ({k, x, y, s, on}) => (s <= 0 ? null : (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {on > 0 && <circle r={78} fill="#FFE27A" opacity={0.35 * on} />}
    <circle r={60} fill="#fff" stroke={INK} strokeWidth={7} />
    {k === 'phone' && <><rect x={-22} y={-38} width={44} height={76} rx={9} fill="#333" stroke={INK} strokeWidth={4} /><rect x={-16} y={-30} width={32} height={56} rx={4} fill={on ? '#9DE0FF' : '#555'} /></>}
    {k === 'atm' && <><rect x={-30} y={-36} width={60} height={72} rx={8} fill="#5B6B7E" stroke={INK} strokeWidth={4} /><rect x={-20} y={-26} width={40} height={26} rx={3} fill={on ? '#9DE0FF' : '#111'} /><rect x={-16} y={10} width={32} height={16} rx={3} fill="#C9D1D8" /></>}
    {k === 'tap' && <><path d="M -30 -10 L -30 -26 L 20 -26 Q 30 -26 30 -16 L 30 0 L 16 0 L 16 -12 L -30 -12 Z" fill="#B7C0C8" stroke={INK} strokeWidth={4} />{on > 0 && <Drop x={23} y={22} s={0.9} />}</>}
    {k === 'fridge' && <><rect x={-24} y={-40} width={48} height={80} rx={8} fill="#E8EDF2" stroke={INK} strokeWidth={4} /><line x1={-24} y1={-8} x2={24} y2={-8} stroke={INK} strokeWidth={4} /><rect x={12} y={-32} width={5} height={16} fill={INK} /></>}
    {k === 'hosp' && <path d="M -12 -38 h 24 v 26 h 26 v 24 h -26 v 26 h -24 v -26 h -26 v -24 h 26 Z" fill={RED} stroke={INK} strokeWidth={4} />}
    {k === 'pump' && <><rect x={-24} y={-36} width={40} height={72} rx={6} fill={RED} stroke={INK} strokeWidth={4} /><rect x={-16} y={-28} width={24} height={18} fill={on ? '#BFE3C3' : '#222'} /><path d="M 16 -16 q 16 0 16 16 v 20" stroke={INK} strokeWidth={5} fill="none" /></>}
  </g>
));
export const B15: React.FC<BoardProps> = ({t, b0}) => {
  const eN = wi(123) - b0, eH = wi(124) - b0;
  const L = popIn(t, 0.3), R = popIn(t - eN, 0.3);
  const on = seg(t, eH - 0.05, eH + 0.3);
  const icons: [string, number, number][] = [['phone', 650, 300], ['atm', 880, 300], ['tap', 990, 520], ['fridge', 880, 740], ['hosp', 650, 760], ['pump', 600, 540]];
  const hub: [number, number] = [790, 530];
  return (
    <Scene bg="linear-gradient(90deg,#E6D2A6 0%,#E6D2A6 49.5%,#1B2A4A 50.5%,#1B2A4A 100%)">
      <line x1={540} y1={0} x2={540} y2={H} stroke={INK} strokeWidth={10} />
      {/* left: 1859 */}
      <g opacity={clamp(L)} transform={`translate(0 ${(1 - clamp(L)) * 30})`}>
        <T x={270} y={110} size={80} color={'#9C4A2E'}>{ar(1859)}</T>
        {[90, 450].map((px) => <g key={px}><rect x={px - 10} y={260} width={20} height={540} fill="#7A4A26" stroke={INK} strokeWidth={5} /><rect x={px - 50} y={270} width={100} height={16} fill="#7A4A26" stroke={INK} strokeWidth={4} /></g>)}
        <path d="M 40 300 Q 270 360 500 300" stroke={INK} strokeWidth={5} fill="none" />
        <g transform="translate(270 560)"><Telegraph x={0} y={0} sp={0} t={t} /></g>
      </g>
      {/* right: today */}
      {R > 0 && <g opacity={clamp(R)}>
        <T x={810} y={110} size={72} color="#fff">النهارده</T>
        <path d={`M 560 ${hub[1]} L ${hub[0]} ${hub[1]}`} stroke={on > 0 ? YEL : '#8892A6'} strokeWidth={12} />
        {icons.map(([, x, y], i) => <line key={i} x1={hub[0]} y1={hub[1]} x2={x} y2={y} stroke={on > 0 ? YEL : '#8892A6'} strokeWidth={8} opacity={clamp(popIn(t - eN - 0.1 - i * 0.08, 0.2))} />)}
        <circle cx={hub[0]} cy={hub[1]} r={26} fill={on > 0 ? YEL : '#8892A6'} stroke={INK} strokeWidth={6} />
        {icons.map(([k, x, y], i) => <Ico key={k} k={k} x={x} y={y} s={popIn(t - eN - 0.1 - i * 0.08, 0.25)} on={on} />)}
        {on > 0 && Array.from({length: 8}, (_, i) => {
          const p = ((t * 1.4 + i / 8) % 1);
          const [x, y] = icons[i % 6].slice(1) as number[];
          return <circle key={i} cx={lerp(hub[0], x, p)} cy={lerp(hub[1], y, p)} r={8} fill="#FFF6A0" opacity={on} />;
        })}
      </g>}
    </Scene>
  );
};

// ================================================================== 16 — CTA: حمادة with his phone at ١٠٪; a comment icon bounces on "أول حاجة"; on "وابعته" a send arrow flies from
// his phone to a friend whose phone also shows a red ١٠٪.
export const B16: React.FC<BoardProps> = ({t, b0}) => {
  const eA = wi(130) - b0, eB = wi(138) - b0, eF = wi(143) - b0;
  const ic = popIn(t - eA, 0.3);
  const bounce = ic > 0 ? Math.abs(Math.sin((t - eA) * 5)) * -20 : 0;
  const fr = popIn(t - eB + 0.15, 0.35);
  const fly = seg(t, eB, eB + 0.7);
  const ph = hand(250, 330, 800, {tx: 240, ty: 300});
  return (
    <Scene bg="linear-gradient(180deg,#FFE7C2 0%,#F7CF95 100%)">
      <Hamada x={250} y={330} h={800} t={t} face="happy" id="b16h" r={{tx: 240, ty: 300}} />
      <PhoneG x={ph[0] + 70} y={ph[1] - 60} s={0.82} rot={4} t={t} pct={0.1} />
      {ic > 0 && <g transform={`translate(560 ${190 + bounce}) scale(${ic})`}>
        <path d="M -110 -80 Q -110 -120 -70 -120 L 70 -120 Q 110 -120 110 -80 L 110 14 Q 110 54 70 54 L -14 54 L -60 100 L -52 54 L -70 54 Q -110 54 -110 14 Z" fill="#2F9BFF" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
        {[-46, 0, 46].map((cx) => <circle key={cx} cx={cx} cy={-34} r={15} fill="#fff" />)}
      </g>}
      {ic > 0 && <g transform={`translate(560 ${420 + bounce * 0.6}) scale(${0.8 * ic})`}>
        <path d="M -30 -70 L 30 -70 L 30 0 L 70 0 L 0 80 L -70 0 L -30 0 Z" fill={YEL} stroke={INK} strokeWidth={9} strokeLinejoin="round" />
      </g>}
      {fr > 0 && <g transform={`translate(0 0)`} opacity={clamp(fr)}>
        <Person x={860} y={330 + (1 - clamp(fr)) * 40} h={760} t={t} v="track" arm="phone" face={t > eF ? 'shock' : 'smile'} flip />
        <g transform={`translate(${860 - 115} ${330 + 330 * 760 / 700 - 30})`}><PhoneG x={0} y={0} s={0.55} rot={-6} t={t} pct={0.1} /></g>
      </g>}
      {fly > 0 && fly < 1 && <g transform={`translate(${lerp(ph[0] + 100, 720, easeInOut(fly))} ${lerp(ph[1] - 120, 560, fly) - Math.sin(fly * Math.PI) * 180}) rotate(${-20 + fly * 30}) scale(${1.3 - 0.4 * fly})`}>
        <path d="M -60 -50 L 70 0 L -60 50 L -36 0 Z" fill="#2F9BFF" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      </g>}
    </Scene>
  );
};

// ================================================================== 17 — "الفهمان كسبان": the exact hook board again (loop): t = t_abs - END, so the last frame is frame 0.
export const makeLoop = (END: number): React.FC<BoardProps> => ({t, b0}) => <B1 t={b0 + t - END} d={3} b0={0} />;
export const BOARDS_17 = [B1, B2, B3, B4, B5, B6, B7, B8, B9, B10, B11, B12, B13, B14, B15, B16];
