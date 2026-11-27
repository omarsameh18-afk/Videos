// The 20 boards of الفهمان #16 "ولد قرر مينامش ١١ يوم". Two generated props (young راندي standing, old راندي in bed); everything
// else is drawn here in code: tiredness / wide eyes / arms on top of the SAME راندي picture, Bruce, the sleep scientist, the
// Egyptian guy, the sleepy friend, calendar, clocks, coin, soda can (no brand), shower, door, football outline, forest, pinball
// machine, chalkboard, bed, press table, newspaper, record book, phone, icons.
// Board space: x 0..1080, y 0..1200 (shown 1:1 inside the wall board). The bottom centre (x ~300..780, y > ~860) sits behind
// الفهمان's head, so nothing important goes there.
import React from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';
import {clamp, easeIn, easeInOut, easeOut, lerp, popIn, rand, seg, wobble} from './lib/anim';
import {norm} from './lib/Captions';
import {Scene} from './Boards14';
import WORDS from './videos/randy.words.json';
import PROPS from '../../public/elfahman/randy/props.json';

export type BoardProps = {t: number; d: number; b0: number};
const W = 1080, H = 1200;
export const YEL = '#FFD23F', RED = '#FF5A4E', GREEN = '#43C463', INK = '#1b1410';
const SKIN = '#F2B88C', CREAM = '#F4EEDF', JRED = '#B8302A';

// ------------------------------------------------------------------ word onsets (absolute seconds)
const words = WORDS as {w: string; s: number; e: number; sent: number}[];
const nq = (w: string) => norm(w).replace(/"/g, '');
export const at = (w: string, nth = 0) => {
  const hits = words.map((x, i) => (nq(x.w) === nq(w) ? i : -1)).filter((i) => i >= 0);
  if (hits[nth] === undefined) throw new Error(`word not found: ${w} #${nth}`);
  return words[hits[nth]].s;
};
const wi = (i: number) => words[i].s; // onset of word i

// ------------------------------------------------------------------ generated props
type PN = 'randy_young' | 'randy_old_bed';
const SRC = (n: PN) => staticFile(`elfahman/randy/${n}.png`);
let handle: number | null = null;
const useProps = () => {
  if (handle === null && typeof window !== 'undefined') {
    handle = delayRender('props');
    Promise.all((['randy_young', 'randy_old_bed'] as PN[]).map((n) => { const im = new Image(); im.src = SRC(n); return im.decode ? im.decode().catch(() => null) : null; }))
      .then(() => continueRender(handle!));
  }
};
const PR = PROPS as Record<PN, {w: number; h: number}>;

// ------------------------------------------------------------------ text helpers
const T: React.FC<{x: number; y: number; size: number; color?: string; stroke?: number; children: React.ReactNode; anchor?: 'middle' | 'start' | 'end'; ltr?: boolean; s?: number; rot?: number; o?: number; sw?: string}> =
({x, y, size, color = '#fff', stroke = 0, children, anchor = 'middle', ltr = false, s = 1, rot = 0, o = 1, sw = INK}) => (s <= 0 ? null : (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={o}>
    <text x={0} y={0} textAnchor={anchor} direction={ltr ? 'ltr' : 'rtl'} fontFamily="Cairo" fontWeight={900} fontSize={size} fill={color}
      stroke={stroke ? sw : 'none'} strokeWidth={stroke} strokeLinejoin="round" paintOrder="stroke" dominantBaseline="middle">{children}</text>
  </g>
));
// day label pill at the top of the board
const DayPill: React.FC<{text: string; s?: number}> = ({text, s = 1}) => (s <= 0 ? null : (
  <g transform={`translate(540 82) scale(${s})`}>
    <rect x={-150} y={-54} width={300} height={108} rx={54} fill={INK} opacity={0.3} transform="translate(6 8)" />
    <rect x={-150} y={-54} width={300} height={108} rx={54} fill={YEL} stroke={INK} strokeWidth={8} />
    <T x={0} y={4} size={66} color={INK}>{text}</T>
  </g>
));
const QMark: React.FC<{x: number; y: number; s: number; size?: number; color?: string}> = ({x, y, s, size = 300, color = YEL}) => (s <= 0 ? null : (
  <text x={x} y={y + size * 0.35} textAnchor="middle" fontFamily="Cairo" fontWeight={900} fontSize={size * s} fill={color} stroke={INK} strokeWidth={size * s * 0.06} paintOrder="stroke">؟</text>
));
const stampK = (dt: number) => (dt <= 0 ? 0 : dt < 0.12 ? 1.8 - 0.8 * easeIn(dt / 0.12) : 1 + wobble(dt - 0.12, 3, 10) * 0.06);
const Stamp: React.FC<{x: number; y: number; dt: number; text: string; color?: string; size?: number; rot?: number; warn?: boolean}> = ({x, y, dt, text, color = RED, size = 90, rot = -10, warn = false}) => {
  const k = stampK(dt);
  if (k <= 0) return null;
  const w = size * (text.length * 0.55 + 0.9) + (warn ? size * 1.1 : 0), h = size * 1.45;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${k})`} opacity={clamp(dt / 0.06)}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={18} fill="rgba(255,255,255,0.9)" stroke={color} strokeWidth={12} />
      <T x={warn ? size * 0.5 : 0} y={size * 0.08} size={size} color={color}>{text}</T>
      {warn && <g transform={`translate(${-w / 2 + size * 0.75} ${-size * 0.02}) scale(${size / 100})`}>
        <path d="M 0 -48 L 46 36 L -46 36 Z" fill={YEL} stroke={color} strokeWidth={10} strokeLinejoin="round" />
        <rect x={-6} y={-22} width={12} height={34} rx={5} fill={INK} /><circle cx={0} cy={24} r={7} fill={INK} />
      </g>}
    </g>
  );
};
const Sparkle4: React.FC<{x: number; y: number; r: number; o?: number}> = ({x, y, r, o = 1}) => (r <= 0 ? null : (
  <path transform={`translate(${x} ${y})`} opacity={o} d={`M0 ${-r} Q ${r * 0.15} ${-r * 0.15} ${r} 0 Q ${r * 0.15} ${r * 0.15} 0 ${r} Q ${-r * 0.15} ${r * 0.15} ${-r} 0 Q ${-r * 0.15} ${-r * 0.15} 0 ${-r} Z`} fill="#fffbe0" stroke={INK} strokeWidth={4} />
));
const Bubble: React.FC<{x: number; y: number; s: number; w?: number; h?: number; tail?: 'l' | 'r' | 'd'; children?: React.ReactNode; fill?: string}> = ({x, y, s, w = 240, h = 150, tail = 'l', children, fill = '#fff'}) => {
  if (s <= 0) return null;
  const tx = tail === 'l' ? -w * 0.25 : tail === 'r' ? w * 0.25 : 0;
  const tp = tail === 'l' ? `${tx - 10},${h / 2 - 4} ${tx - 60},${h / 2 + 60} ${tx + 34},${h / 2 - 4}` : tail === 'r' ? `${tx - 34},${h / 2 - 4} ${tx + 60},${h / 2 + 60} ${tx + 10},${h / 2 - 4}` : `${-30},${h / 2 - 4} ${0},${h / 2 + 60} ${30},${h / 2 - 4}`;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h * 0.4} fill={fill} stroke={INK} strokeWidth={8} />
      <polygon points={tp} fill={fill} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      <rect x={-w / 2 + 6} y={h / 2 - 14} width={w - 12} height={12} fill={fill} />
      {children}
    </g>
  );
};

// ------------------------------------------------------------------ راندي (young): the generated picture + code layers
// Coordinates inside the picture use its ORIGINAL 261 x 707 basis (the file is a 2x Lanczos upscale). Eyes at (113,76) and
// (147,76); viewer's-right shoulder at (214,182). x = centre, y = top, h = height in board units.
const RW = 261, RH = 707;
const EYES: [number, number][] = [[113, 76.5], [147, 76.5]];
const SHOULDER: [number, number] = [214, 184];
type Hand = 'point' | 'chalk' | 'thumb' | 'fist';
// two-segment arm (IK) from the shoulder to a target (picture coordinates), in the jacket's cream sleeve with the red/white cuff
const Arm: React.FC<{tx: number; ty: number; hand: Hand; bend?: number; l2?: number}> = ({tx, ty, hand, bend = 1, l2 = 118}) => {
  const [sx, sy] = SHOULDER, L1 = 118, L2 = l2;
  const dx = tx - sx, dy = ty - sy;
  const d = Math.min(Math.hypot(dx, dy), L1 + L2 - 2);
  const a = Math.atan2(dy, dx);
  const al = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
  const ex = sx + L1 * Math.cos(a - bend * al), ey = sy + L1 * Math.sin(a - bend * al);
  const hx = sx + d * Math.cos(a), hy = sy + d * Math.sin(a);
  const fa = Math.atan2(hy - ey, hx - ex);
  const cx1 = hx - Math.cos(fa) * 30, cy1 = hy - Math.sin(fa) * 30, cx2 = hx - Math.cos(fa) * 16, cy2 = hy - Math.sin(fa) * 16;
  const deg = (fa * 180) / Math.PI;
  return (
    <g>
      <path d={`M ${sx} ${sy} L ${ex} ${ey} L ${cx2} ${cy2}`} fill="none" stroke={INK} strokeWidth={46} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M ${sx} ${sy} L ${ex} ${ey} L ${cx2} ${cy2}`} fill="none" stroke={CREAM} strokeWidth={38} strokeLinecap="round" strokeLinejoin="round" />
      <line x1={cx1} y1={cy1} x2={cx2} y2={cy2} stroke={JRED} strokeWidth={38} />
      <line x1={cx1 + Math.cos(fa) * 6} y1={cy1 + Math.sin(fa) * 6} x2={cx1 + Math.cos(fa) * 10} y2={cy1 + Math.sin(fa) * 10} stroke="#fff" strokeWidth={38} />
      <g transform={`translate(${hx} ${hy}) rotate(${deg})`}>
        {hand === 'point' && <rect x={6} y={-6} width={36} height={12} rx={6} fill={SKIN} stroke={INK} strokeWidth={3} />}
        {hand === 'chalk' && <rect x={10} y={-5} width={26} height={10} rx={3} fill="#fff" stroke={INK} strokeWidth={2.5} />}
        <circle r={19} fill={SKIN} stroke={INK} strokeWidth={3.5} />
        {hand === 'thumb' && <g transform={`rotate(${-deg - 90})`}><rect x={-6} y={-6} width={34} height={13} rx={6.5} fill={SKIN} stroke={INK} strokeWidth={3} /></g>}
        {(hand === 'fist' || hand === 'thumb') && <path d="M -6 -12 Q 2 -4 -6 4 M 2 -14 Q 10 -6 2 2" stroke={INK} strokeWidth={2} fill="none" />}
      </g>
    </g>
  );
};
type RandyOpts = {x: number; y: number; h: number; tired?: number; wide?: number; arm?: {tx: number; ty: number; hand: Hand; bend?: number; l2?: number} | null; closed?: number; rot?: number;
  sx?: number; rub?: number; t?: number; id: string; o?: number};
// tired: 0 rested, 1 day 3 (soft grey-purple circles + a few messy strands), 2 day 5+ (heavier circles, lower eyelids),
// 3 day 11 (+ red-rimmed eyes). SUBTLE on purpose: the same face, only a little more worn.
const Eyes: React.FC<{tired: number; wide: number; closed: number}> = ({tired, wide, closed}) => (
  <g>
    {tired >= 1 && EYES.map(([ex, ey], i) => (
      <ellipse key={'c' + i} cx={ex} cy={ey + 8.5} rx={9.5} ry={3.8} fill="#7E6496" opacity={tired >= 2 ? 0.42 : 0.3} />
    ))}
    {wide > 0 && EYES.map(([ex, ey], i) => (
      <g key={'w' + i} transform={`translate(${ex} ${ey}) scale(${0.85 + 0.15 * wide})`}>
        <ellipse rx={10.5} ry={11} fill="#fff" stroke={INK} strokeWidth={1.8} />
        <circle r={5.6} fill="#6B3E1E" /><circle r={3} fill="#140c08" /><circle cx={-1.8} cy={-2} r={1.5} fill="#fff" />
      </g>
    ))}
    {tired >= 3 && closed <= 0 && EYES.map(([ex, ey], i) => <ellipse key={'r' + i} cx={ex} cy={ey + 0.5} rx={10} ry={7.4} fill="none" stroke="#D9484F" strokeWidth={1.3} opacity={0.55} />)}
    {tired >= 2 && closed <= 0 && wide <= 0 && EYES.map(([ex, ey], i) => (
      <g key={'l' + i}>
        <path d={`M ${ex - 10} ${ey - 8} L ${ex + 10} ${ey - 8} L ${ex + 10} ${ey - 2.5} Q ${ex} ${ey + (tired >= 3 ? 0.5 : -0.8)} ${ex - 10} ${ey - 2.5} Z`} fill={SKIN} />
        <path d={`M ${ex - 9.5} ${ey - 2.4} Q ${ex} ${ey + (tired >= 3 ? 0.5 : -0.8)} ${ex + 9.5} ${ey - 2.4}`} fill="none" stroke={INK} strokeWidth={1.7} strokeLinecap="round" />
      </g>
    ))}
    {closed > 0 && EYES.map(([ex, ey], i) => (
      <g key={'z' + i}>
        <ellipse cx={ex} cy={ey} rx={10.5} ry={8} fill={SKIN} />
        <path d={`M ${ex - 9} ${ey} Q ${ex} ${ey + 5} ${ex + 9} ${ey}`} fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" />
      </g>
    ))}
  </g>
);
const Strands: React.FC = () => (
  <g stroke="#7A4A24" strokeWidth={2.6} fill="none" strokeLinecap="round">
    <path d="M 112 14 Q 106 2 98 -2" /><path d="M 132 10 Q 134 -2 142 -6" /><path d="M 150 16 Q 160 8 164 2" /><path d="M 96 22 Q 86 16 82 8" />
  </g>
);
export const Randy: React.FC<RandyOpts> = ({x, y, h, tired = 0, wide = 0, arm = null, closed = 0, rot = 0, sx = 1, rub = 0, t = 0, id, o = 1}) => {
  useProps();
  const k = h / RH;
  const hideArm = !!arm || rub > 0;
  const rubT: [number, number] = [EYES[1][0] + 4 + 3 * Math.sin(t * 14), EYES[1][1] + 6 + 3 * Math.cos(t * 14)];
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot} 0 ${h}) scale(${k * sx} ${k}) translate(${-RW / 2} 0)`} opacity={o}>
      <defs><clipPath id={id}><path d={`M -5 -5 H ${RW + 5} V ${RH + 5} H -5 Z M 204 172 H ${RW + 5} V 452 H 204 Z`} clipRule="evenodd" /></clipPath></defs>
      <image href={SRC('randy_young')} x={0} y={0} width={RW} height={RH} clipPath={hideArm ? `url(#${id})` : undefined} />
      {tired >= 1 && <Strands />}
      <Eyes tired={tired} wide={wide} closed={closed} />
      {arm && <Arm {...arm} />}
      {!arm && rub > 0 && <Arm tx={lerp(226, rubT[0], rub)} ty={lerp(436, rubT[1], rub)} hand="fist" bend={1} l2={210} />}
    </g>
  );
};
// just the head (for small panels / the bed / the book): picture region x 70..192, y -4..140 drawn with centre (x, y), size = head width
const RandyHead: React.FC<{x: number; y: number; size: number; tired?: number; wide?: number; closed?: number; rot?: number; id: string}> = ({x, y, size, tired = 0, wide = 0, closed = 0, rot = 0, id}) => {
  useProps();
  const k = size / 122;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${k}) translate(-131 -70)`}>
      <defs><clipPath id={id}><path d="M 70 -6 H 192 V 128 Q 131 150 70 128 Z" /></clipPath></defs>
      <g clipPath={`url(#${id})`}>
        <image href={SRC('randy_young')} x={0} y={0} width={RW} height={RH} />
        <Eyes tired={tired} wide={wide} closed={closed} />
        {tired >= 1 && <Strands />}
      </g>
    </g>
  );
};

// ------------------------------------------------------------------ code characters (same 261 x 707 basis as راندي)
type Mouth = 'smile' | 'grin' | 'open' | 'talk' | 'closed';
const MouthP: React.FC<{m: Mouth; x: number; y: number; t?: number}> = ({m, x, y, t = 0}) => {
  const talk = m === 'talk' ? Math.abs(Math.sin(t * 11)) : 0;
  if (m === 'open') return <ellipse cx={x} cy={y + 4} rx={9} ry={12} fill="#5a1d14" stroke={INK} strokeWidth={3} />;
  if (m === 'grin') return <path d={`M ${x - 20} ${y - 2} Q ${x} ${y + 22} ${x + 20} ${y - 2} Z`} fill="#fff" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />;
  if (m === 'talk') return <ellipse cx={x} cy={y + 2} rx={11} ry={2 + 7 * talk} fill="#5a1d14" stroke={INK} strokeWidth={3} />;
  if (m === 'closed') return <path d={`M ${x - 10} ${y + 2} Q ${x} ${y + 5} ${x + 10} ${y + 2}`} stroke={INK} strokeWidth={3.5} fill="none" strokeLinecap="round" />;
  return <path d={`M ${x - 15} ${y} Q ${x} ${y + 12} ${x + 15} ${y}`} stroke={INK} strokeWidth={3.5} fill="none" strokeLinecap="round" />;
};
// Bruce (صاحبه): dark curly hair, glasses, green sweater, clipboard. variant 'friend2': blond, blue sweater, no glasses, no clipboard.
export const Kid: React.FC<{x: number; y: number; h: number; t?: number; walk?: number; mouth?: Mouth; variant?: 'bruce' | 'friend2'; lean?: number; flip?: boolean; eyes?: 'open' | 'wide'}> =
({x, y, h, t = 0, walk = 0, mouth = 'smile', variant = 'bruce', lean = 0, flip = false, eyes = 'open'}) => {
  const k = h / RH;
  const sw = walk ? Math.sin(t * 9) * 16 * walk : 0;
  const bob = walk ? Math.abs(Math.sin(t * 9)) * -6 * walk : 0;
  const bruce = variant === 'bruce';
  const sweater = bruce ? '#3E9A55' : '#3D6FB6', pants = bruce ? '#8A6E4B' : '#3B4A6B', hair = bruce ? '#2A1C14' : '#E8C25A';
  return (
    <g transform={`translate(${x} ${y + bob}) rotate(${lean} 0 ${h}) scale(${(flip ? -1 : 1) * k} ${k}) translate(${-RW / 2} 0)`}>
      {/* legs */}
      {[[-1, sw], [1, -sw]].map(([s, a], i) => (
        <g key={i} transform={`rotate(${a} ${130 + s * 22} 420)`}>
          <rect x={130 + s * 22 - 22} y={410} width={44} height={240} rx={14} fill={pants} stroke={INK} strokeWidth={5} />
          <path d={`M ${130 + s * 22 - 26} 650 h 52 q 14 0 14 14 v 10 h -66 Z`} fill="#3a2a22" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        </g>
      ))}
      {/* body */}
      <path d="M 72 175 Q 130 150 188 175 L 196 420 Q 130 438 64 420 Z" fill={sweater} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d="M 112 162 L 130 196 L 148 162" fill="#fff" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      {/* arms: holding the clipboard in front (bruce) or down */}
      {bruce ? <>
        <path d="M 76 186 Q 58 270 100 300" stroke={INK} strokeWidth={40} fill="none" strokeLinecap="round" />
        <path d="M 76 186 Q 58 270 100 300" stroke={sweater} strokeWidth={32} fill="none" strokeLinecap="round" />
        <path d="M 184 186 Q 202 270 160 300" stroke={INK} strokeWidth={40} fill="none" strokeLinecap="round" />
        <path d="M 184 186 Q 202 270 160 300" stroke={sweater} strokeWidth={32} fill="none" strokeLinecap="round" />
        <rect x={86} y={226} width={88} height={118} rx={8} fill="#B7834F" stroke={INK} strokeWidth={5} />
        <rect x={96} y={240} width={68} height={94} fill="#fff" stroke={INK} strokeWidth={3} />
        {[262, 282, 302, 320].map((ly) => <line key={ly} x1={104} x2={156} y1={ly} y2={ly} stroke="#8aa" strokeWidth={3} />)}
        <rect x={114} y={218} width={32} height={18} rx={4} fill="#9aa3ad" stroke={INK} strokeWidth={3.5} />
        <circle cx={100} cy={300} r={15} fill="#E9B48A" stroke={INK} strokeWidth={3.5} /><circle cx={160} cy={300} r={15} fill="#E9B48A" stroke={INK} strokeWidth={3.5} />
      </> : [[72, -1], [188, 1]].map(([sx, s], i) => (
        <g key={i}>
          <path d={`M ${sx} 186 L ${sx + s * 18} 400`} stroke={INK} strokeWidth={40} strokeLinecap="round" />
          <path d={`M ${sx} 186 L ${sx + s * 18} 400`} stroke={sweater} strokeWidth={32} strokeLinecap="round" />
          <circle cx={sx + s * 18} cy={420} r={16} fill="#F1C29A" stroke={INK} strokeWidth={3.5} />
        </g>
      ))}
      {/* head */}
      <rect x={116} y={130} width={28} height={36} fill={bruce ? '#E9B48A' : '#F1C29A'} stroke={INK} strokeWidth={4} />
      <ellipse cx={78} cy={84} rx={10} ry={15} fill={bruce ? '#E9B48A' : '#F1C29A'} stroke={INK} strokeWidth={4} />
      <ellipse cx={182} cy={84} rx={10} ry={15} fill={bruce ? '#E9B48A' : '#F1C29A'} stroke={INK} strokeWidth={4} />
      <ellipse cx={130} cy={82} rx={52} ry={62} fill={bruce ? '#E9B48A' : '#F1C29A'} stroke={INK} strokeWidth={5} />
      {bruce
        ? [[84, 40], [100, 24], [120, 16], [142, 16], [162, 24], [178, 40], [182, 58], [78, 58]].map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r={18} fill={hair} stroke={INK} strokeWidth={4} />)
        : <path d="M 76 66 Q 74 14 130 16 Q 190 16 184 66 Q 170 40 130 44 Q 96 42 76 66 Z" fill={hair} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />}
      {bruce && <path d="M 82 44 Q 130 12 178 44 Q 160 34 130 36 Q 100 34 82 44 Z" fill={hair} />}
      {/* eyes */}
      {[110, 150].map((ex) => eyes === 'wide'
        ? <g key={ex}><circle cx={ex} cy={84} r={11} fill="#fff" stroke={INK} strokeWidth={3} /><circle cx={ex} cy={84} r={4.5} fill={INK} /></g>
        : <g key={ex}><circle cx={ex} cy={86} r={5.5} fill={INK} /><circle cx={ex - 1.6} cy={84} r={1.6} fill="#fff" /></g>)}
      {bruce && <g fill="none" stroke="#222" strokeWidth={4.5}><circle cx={110} cy={85} r={17} /><circle cx={150} cy={85} r={17} /><path d="M 127 84 Q 130 80 133 84" /></g>}
      <path d="M 100 62 Q 110 56 120 62 M 140 62 Q 150 56 160 62" stroke={bruce ? hair : '#B08A30'} strokeWidth={5} fill="none" strokeLinecap="round" />
      <MouthP m={mouth} x={130} y={116} t={t} />
    </g>
  );
};
// the sleep scientist: older, grey hair, thick black-framed glasses, white lab coat, tie. arm 'down' | 'scratch' | 'wave'
export const Scientist: React.FC<{x: number; y: number; h: number; t?: number; walk?: number; arm?: 'down' | 'scratch'; mouth?: Mouth}> = ({x, y, h, t = 0, walk = 0, arm = 'down', mouth = 'smile'}) => {
  const k = h / RH;
  const sw = walk ? Math.sin(t * 8) * 14 * walk : 0;
  const bob = walk ? Math.abs(Math.sin(t * 8)) * -6 * walk : 0;
  const sc = arm === 'scratch' ? Math.sin(t * 16) * 5 : 0;
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${k}) translate(${-RW / 2} 0)`}>
      {[[-1, sw], [1, -sw]].map(([s, a], i) => (
        <g key={i} transform={`rotate(${a} ${130 + s * 24} 430)`}>
          <rect x={130 + s * 24 - 22} y={420} width={44} height={232} rx={12} fill="#6F7378" stroke={INK} strokeWidth={5} />
          <path d={`M ${130 + s * 24 - 26} 650 h 52 q 14 0 14 14 v 10 h -66 Z`} fill="#22201e" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        </g>
      ))}
      <path d="M 66 175 Q 130 150 194 175 L 210 520 L 50 520 Z" fill="#FAFAF7" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d="M 106 170 L 130 250 L 154 170" fill="#BFD8F0" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d="M 124 186 L 136 186 L 142 270 L 130 290 L 118 270 Z" fill="#C8352E" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <line x1={130} y1={250} x2={130} y2={520} stroke={INK} strokeWidth={4} />
      <rect x={150} y={300} width={34} height={8} fill="#9cb" stroke={INK} strokeWidth={2} />
      <path d="M 70 186 L 52 410" stroke={INK} strokeWidth={42} strokeLinecap="round" /><path d="M 70 186 L 52 410" stroke="#FAFAF7" strokeWidth={34} strokeLinecap="round" />
      <circle cx={52} cy={430} r={16} fill="#E7B38C" stroke={INK} strokeWidth={3.5} />
      {arm === 'down' ? <>
        <path d="M 190 186 L 208 410" stroke={INK} strokeWidth={42} strokeLinecap="round" /><path d="M 190 186 L 208 410" stroke="#FAFAF7" strokeWidth={34} strokeLinecap="round" />
        <circle cx={208} cy={430} r={16} fill="#E7B38C" stroke={INK} strokeWidth={3.5} />
      </> : <>
        <path d={`M 190 186 L 236 116 L ${178 + sc} ${30}`} stroke={INK} strokeWidth={42} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d={`M 190 186 L 236 116 L ${178 + sc} ${30}`} stroke="#FAFAF7" strokeWidth={34} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </>}
      <rect x={116} y={130} width={28} height={36} fill="#E7B38C" stroke={INK} strokeWidth={4} />
      <ellipse cx={78} cy={86} rx={10} ry={15} fill="#E7B38C" stroke={INK} strokeWidth={4} /><ellipse cx={182} cy={86} rx={10} ry={15} fill="#E7B38C" stroke={INK} strokeWidth={4} />
      <ellipse cx={130} cy={84} rx={52} ry={62} fill="#E7B38C" stroke={INK} strokeWidth={5} />
      {[[80, 56, 20], [78, 80, 17], [180, 56, 20], [182, 80, 17], [96, 36, 14], [164, 36, 14]].map(([cx, cy, r], i) => <circle key={i} cx={cx} cy={cy} r={r} fill="#D9D9D9" stroke={INK} strokeWidth={4} />)}
      <path d="M 100 112 Q 130 104 160 112" stroke="#BDBDBD" strokeWidth={9} fill="none" strokeLinecap="round" />
      {[108, 152].map((ex) => <circle key={ex} cx={ex} cy={86} r={5} fill={INK} />)}
      <g fill="none" stroke="#111" strokeWidth={7}><rect x={90} y={72} width={36} height={28} rx={6} /><rect x={134} y={72} width={36} height={28} rx={6} /><line x1={126} y1={84} x2={134} y2={84} /></g>
      <path d="M 96 64 Q 108 58 120 64 M 140 64 Q 152 58 164 64" stroke="#9a9a9a" strokeWidth={6} fill="none" strokeLinecap="round" />
      <MouthP m={mouth} x={130} y={124} t={t} />
      {arm === 'scratch' && <circle cx={178 + sc} cy={30} r={17} fill="#E7B38C" stroke={INK} strokeWidth={3.5} />}
    </g>
  );
};

// ------------------------------------------------------------------ objects
const Clock: React.FC<{x: number; y: number; r: number; t: number; speed?: number; hour?: number; minute?: number; face?: string}> = ({x, y, r, t, speed = 1, hour, minute, face = '#FFFDF4'}) => {
  const ma = minute !== undefined ? minute * 6 : t * 360 * speed;
  const ha = hour !== undefined ? hour * 30 + (minute ?? 0) * 0.5 : ma / 12;
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r + 6} fill={INK} opacity={0.3} transform="translate(8 10)" />
      <circle r={r} fill={face} stroke={INK} strokeWidth={r * 0.1} />
      {Array.from({length: 12}, (_, i) => <line key={i} x1={0} y1={-r * 0.8} x2={0} y2={-r * (i % 3 ? 0.72 : 0.66)} stroke={INK} strokeWidth={r * (i % 3 ? 0.035 : 0.06)} transform={`rotate(${i * 30})`} strokeLinecap="round" />)}
      <line x1={0} y1={0} x2={0} y2={-r * 0.45} stroke={INK} strokeWidth={r * 0.09} strokeLinecap="round" transform={`rotate(${ha})`} />
      <line x1={0} y1={0} x2={0} y2={-r * 0.68} stroke={RED} strokeWidth={r * 0.055} strokeLinecap="round" transform={`rotate(${ma})`} />
      <circle r={r * 0.08} fill={INK} />
    </g>
  );
};
// wall calendar: big day number; a page flies up while flip in (0..1)
const CalDay: React.FC<{x: number; y: number; s: number; n: string; flip: number; head?: string}> = ({x, y, s, n, flip, head = 'يوم'}) => (s <= 0 ? null : (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-150} y={-130} width={300} height={290} rx={22} fill={INK} opacity={0.3} transform="translate(10 12)" />
    <rect x={-150} y={-130} width={300} height={290} rx={22} fill="#fff" stroke={INK} strokeWidth={9} />
    <rect x={-150} y={-130} width={300} height={80} rx={22} fill={RED} stroke={INK} strokeWidth={9} />
    <T x={0} y={-90} size={52} color="#fff">{head}</T>
    {[-80, 80].map((rx) => <rect key={rx} x={rx - 10} y={-156} width={20} height={50} rx={10} fill="#ddd" stroke={INK} strokeWidth={6} />)}
    <T x={0} y={58} size={150} color={INK}>{n}</T>
    {flip > 0 && flip < 1 && <g transform={`translate(0 -50) rotate(${-flip * 70}) scale(1 ${1 - flip})`} opacity={1 - flip * 0.5}>
      <rect x={-146} y={0} width={292} height={206} fill="#f4f4f4" stroke={INK} strokeWidth={5} />
    </g>}
  </g>
));
const AR_DIG = '٠١٢٣٤٥٦٧٨٩';
const ar = (n: number) => String(n).split('').map((c) => AR_DIG[+c]).join('');
const Coin: React.FC<{x: number; y: number; r: number; ph: number}> = ({x, y, r, ph}) => {
  // ph: rotation angle (rad) around the horizontal axis; cos > 0 = happy side, < 0 = sad side
  const c = Math.cos(ph);
  return (
    <g transform={`translate(${x} ${y}) scale(1 ${Math.max(0.08, Math.abs(c))})`}>
      <circle r={r} fill="#C98F1E" transform="translate(0 8)" />
      <circle r={r} fill="#F2C33A" stroke={INK} strokeWidth={8} />
      <circle r={r * 0.78} fill="none" stroke="#C98F1E" strokeWidth={6} />
      <circle cx={-r * 0.28} cy={-r * 0.18} r={r * 0.09} fill={INK} /><circle cx={r * 0.28} cy={-r * 0.18} r={r * 0.09} fill={INK} />
      {c >= 0 ? <path d={`M ${-r * 0.35} ${r * 0.15} Q 0 ${r * 0.5} ${r * 0.35} ${r * 0.15}`} stroke={INK} strokeWidth={r * 0.09} fill="none" strokeLinecap="round" />
        : <path d={`M ${-r * 0.35} ${r * 0.42} Q 0 ${r * 0.1} ${r * 0.35} ${r * 0.42}`} stroke={INK} strokeWidth={r * 0.09} fill="none" strokeLinecap="round" />}
    </g>
  );
};
const NoSleep: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle r={78} fill="#fff" stroke={RED} strokeWidth={14} />
    <T x={0} y={4} size={62} color="#3F6FD8" ltr>Zzz</T>
    <line x1={-54} y1={54} x2={54} y2={-54} stroke={RED} strokeWidth={14} strokeLinecap="round" />
  </g>
);
const Moon: React.FC<{x: number; y: number; r: number; bg?: string}> = ({x, y, r, bg = '#1E2A5A'}) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r * 1.5} fill="#FFF2B0" opacity={0.18} />
    <circle r={r} fill="#FFE9A0" stroke={INK} strokeWidth={r * 0.08} />
    <circle cx={r * 0.45} cy={-r * 0.2} r={r * 0.85} fill={bg} />
  </g>
);
const Zzz: React.FC<{x: number; y: number; t: number; n?: number; size?: number}> = ({x, y, t, n = 3, size = 70}) => (
  <g>
    {Array.from({length: n}, (_, i) => {
      const p = ((t * 0.55 + i / n) % 1 + 1) % 1;
      return <T key={i} x={x + p * 120 + Math.sin(p * 6) * 14} y={y - p * 260} size={size * (0.6 + 0.6 * p)} color="#fff" stroke={size * 0.14} o={Math.sin(p * Math.PI)} ltr>Z</T>;
    })}
  </g>
);
const Panel: React.FC<{x: number; y: number; w: number; h: number; s: number; bg: string; id: string; children?: React.ReactNode}> = ({x, y, w, h, s, bg, id, children}) => (s <= 0 ? null : (
  <g transform={`translate(${x + w / 2} ${y + h / 2}) scale(${s}) translate(${-w / 2} ${-h / 2})`}>
    <defs><clipPath id={id}><rect x={0} y={0} width={w} height={h} rx={26} /></clipPath></defs>
    <rect x={8} y={12} width={w} height={h} rx={26} fill={INK} opacity={0.35} />
    <rect x={0} y={0} width={w} height={h} rx={26} fill={bg} />
    <g clipPath={`url(#${id})`}>{children}</g>
    <rect x={0} y={0} width={w} height={h} rx={26} fill="none" stroke={INK} strokeWidth={9} />
  </g>
));
const Bed: React.FC<{x: number; y: number; w: number; blanket?: string}> = ({x, y, w, blanket = '#6FA8DC'}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-14} y={-150} width={34} height={300} rx={10} fill="#8A5A33" stroke={INK} strokeWidth={7} />
    <rect x={w - 20} y={-70} width={34} height={220} rx={10} fill="#8A5A33" stroke={INK} strokeWidth={7} />
    <rect x={0} y={40} width={w} height={60} rx={10} fill="#A06A3C" stroke={INK} strokeWidth={7} />
    <rect x={8} y={-6} width={w - 16} height={52} rx={14} fill="#F4F6FA" stroke={INK} strokeWidth={6} />
    <ellipse cx={110} cy={-24} rx={100} ry={46} fill="#fff" stroke={INK} strokeWidth={6} />
    <path d={`M 170 -30 Q ${w * 0.5} -70 ${w - 24} -24 L ${w - 24} 50 L 170 50 Z`} fill={blanket} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    <path d={`M 230 -20 Q 300 0 360 -30 M ${w * 0.6} -40 Q ${w * 0.7} -10 ${w * 0.8} -36`} stroke="#4E86BD" strokeWidth={6} fill="none" strokeLinecap="round" />
  </g>
);
const Flash: React.FC<{x: number; y: number; dt: number; r?: number}> = ({x, y, dt, r = 120}) => {
  if (dt < 0 || dt > 0.35) return null;
  const k = Math.sin((dt / 0.35) * Math.PI);
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`} opacity={k}>
      <circle r={r * 0.9} fill="#fff" opacity={0.45} />
      <path d={`M 0 ${-r} L ${r * 0.18} ${-r * 0.18} L ${r} 0 L ${r * 0.18} ${r * 0.18} L 0 ${r} L ${-r * 0.18} ${r * 0.18} L ${-r} 0 L ${-r * 0.18} ${-r * 0.18} Z`} fill="#fff" />
    </g>
  );
};
const Tree: React.FC<{x: number; y: number; s: number; c?: string; rot?: number}> = ({x, y, s, c = '#2E5A3A', rot = 0}) => (s <= 0 ? null : (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-16} y={-70} width={32} height={80} fill="#4a2e18" stroke={INK} strokeWidth={6} />
    <path d="M 0 -360 L 120 -170 L 66 -170 L 150 -50 L -150 -50 L -66 -170 L -120 -170 Z" fill={c} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
  </g>
));

// ================================================================== 1 — hook: راندي wide-eyed, calendar 1 -> 11 (red ١١ stamp on "حداشر"),
// wall clock spinning, a crossed-out "Zzz". Pure function of t (also t < 0: the loop board runs it with t - END).
const FLIP_RATE = 10 / (wi(6) - 0.05); // 10 flips land on "حداشر"
export const B1: React.FC<BoardProps> = ({t}) => {
  const eH = wi(6);
  const n = t <= 0 ? 1 : Math.min(11, 1 + Math.floor(t * FLIP_RATE));
  const flip = n < 11 ? (((t * FLIP_RATE) % 1) + 1) % 1 : 0;
  const stamp = t >= eH ? t - eH : -1;
  const sway = Math.sin(t * 2.2) * 1.2;
  return (
    <Scene bg="linear-gradient(180deg,#5B6FB8 0%,#8E97D0 55%,#B9A9D6 100%)">
      <rect x={0} y={790} width={W} height={H - 790} fill="#6A4E7A" />
      <rect x={0} y={780} width={W} height={20} fill="#4E3760" />
      <Clock x={210} y={250} r={140} t={t} speed={1.6} />
      <NoSleep x={545} y={150 + Math.sin(t * 3) * 6} s={0.95 + 0.05 * Math.sin(t * 5)} />
      <g transform={`rotate(${sway} 545 1180)`}><Randy x={545} y={250} h={930} wide={1} id="b1r" /></g>
      <CalDay x={865} y={430} s={1.1} n={ar(n)} flip={flip} />
      {stamp >= 0 && <g transform={`translate(865 520) rotate(-14) scale(${stampK(stamp)})`}>
        <circle r={96} fill="rgba(255,255,255,0.85)" stroke={RED} strokeWidth={14} />
        <T x={0} y={8} size={120} color={RED}>١١</T>
      </g>}
    </Scene>
  );
};

// ================================================================== 2 — the science fair: banner, table, trophy; راندي walks in and
// points at the trophy on "يكسب"
const Trophy: React.FC<{x: number; y: number; s: number; glow?: number}> = ({x, y, s, glow = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {glow > 0 && <circle cx={0} cy={-120} r={150} fill={YEL} opacity={0.35 * glow} />}
    <rect x={-70} y={-24} width={140} height={34} rx={6} fill="#6E4A2A" stroke={INK} strokeWidth={7} />
    <rect x={-22} y={-90} width={44} height={70} fill="#F2C33A" stroke={INK} strokeWidth={7} />
    <path d="M -90 -250 L 90 -250 Q 90 -110 0 -96 Q -90 -110 -90 -250 Z" fill="#F7CF4A" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
    <path d="M -90 -230 Q -150 -220 -120 -160 Q -105 -135 -78 -140 M 90 -230 Q 150 -220 120 -160 Q 105 -135 78 -140" stroke={INK} strokeWidth={22} fill="none" strokeLinecap="round" />
    <path d="M -90 -230 Q -150 -220 -120 -160 Q -105 -135 -78 -140 M 90 -230 Q 150 -220 120 -160 Q 105 -135 78 -140" stroke="#F7CF4A" strokeWidth={12} fill="none" strokeLinecap="round" />
    <path d="M -50 -230 Q -46 -160 -16 -126" stroke="#fff6c8" strokeWidth={12} fill="none" strokeLinecap="round" />
    <polygon points="0,-212 12,-186 40,-184 18,-166 26,-140 0,-154 -26,-140 -18,-166 -40,-184 -12,-186" fill="#fff" opacity={0.85} />
  </g>
);
export const B2: React.FC<BoardProps> = ({t, b0}) => {
  const eK = wi(13) - b0;
  const walk = easeOut(seg(t, 0, 1.0));
  const x = lerp(-180, 290, walk);
  const point = easeOut(seg(t, eK - 0.15, eK + 0.2));
  const glow = seg(t, eK, eK + 0.3);
  return (
    <Scene bg="linear-gradient(180deg,#FFE9B8 0%,#FCD78E 60%,#E7B866 100%)">
      <rect x={0} y={780} width={W} height={H - 780} fill="#C99A5C" />
      {/* bunting + banner */}
      <path d="M 0 40 Q 540 130 1080 40" stroke={INK} strokeWidth={5} fill="none" />
      {Array.from({length: 11}, (_, i) => { const bx = 50 + i * 98, by = 40 + Math.sin((bx / 1080) * Math.PI) * 88; return <path key={i} d={`M ${bx - 30} ${by - 4} L ${bx + 30} ${by + 4} L ${bx} ${by + 56} Z`} fill={[RED, '#3F86E0', YEL, GREEN][i % 4]} stroke={INK} strokeWidth={4} />; })}
      <g transform="translate(540 230)">
        <rect x={-430} y={-62} width={860} height={124} rx={18} fill="#2E62C9" stroke={INK} strokeWidth={9} />
        <T x={0} y={6} size={78} color="#fff" stroke={10} ltr>SCIENCE FAIR 1963</T>
      </g>
      {/* table */}
      <rect x={470} y={610} width={580} height={36} rx={8} fill="#E9E2D0" stroke={INK} strokeWidth={8} />
      <path d="M 480 646 L 1040 646 L 1020 860 L 500 860 Z" fill="#3F86E0" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      <path d="M 560 646 L 560 860 M 680 646 L 680 860 M 800 646 L 800 860 M 920 646 L 920 860" stroke="#2E6AB8" strokeWidth={6} />
      {/* volcano + flask */}
      <path d="M 520 610 L 590 500 L 630 500 L 700 610 Z" fill="#9A6A3E" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      {[0, 1, 2].map((i) => { const p = ((t * 0.8 + i / 3) % 1); return <circle key={i} cx={610 + Math.sin(p * 9 + i) * 14} cy={496 - p * 110} r={14 * (1 - p) + 4} fill={RED} opacity={1 - p} stroke={INK} strokeWidth={3} />; })}
      <path d="M 990 610 L 990 540 L 975 540 L 975 520 L 1035 520 L 1035 540 L 1020 540 L 1020 610 Z" fill="#9FE3B4" stroke={INK} strokeWidth={6} />
      <Trophy x={840} y={610} s={1.15} glow={glow} />
      {glow > 0 && <><Sparkle4 x={720} y={380} r={40 * Math.sin(glow * Math.PI)} /><Sparkle4 x={960} y={330} r={52 * Math.sin(seg(t, eK + 0.15, eK + 0.6) * Math.PI)} /></>}
      <g transform={`translate(0 ${walk < 1 ? Math.abs(Math.sin(t * 9)) * -10 : 0})`}>
        <Randy x={x} y={300} h={820} arm={point > 0 ? {tx: lerp(226, 470, point), ty: lerp(436, 60, point), hand: 'point'} : null} id="b2r" />
      </g>
    </Scene>
  );
};

// ================================================================== 3 — راندي and Bruce face each other; the coin flips up on "قرعة";
// a "؟" pops over both heads on "مين"
const COIN_UP = wi(21);
const coinPos = (tAbs: number) => {
  const u = seg(tAbs, COIN_UP, COIN_UP + 1.55);
  return {x: lerp(540, 430, u), y: 620 - Math.sin(u * Math.PI) * 470 + u * 120, ph: (tAbs - COIN_UP) * 15};
};
export const B3: React.FC<BoardProps> = ({t, b0}) => {
  const tA = t + b0, eM = wi(22) - b0;
  const c = coinPos(tA);
  const qa = popIn(t - eM, 0.3), qb = popIn(t - eM - 0.12, 0.3);
  return (
    <Scene bg="linear-gradient(180deg,#BFE3F7 0%,#E2F2FB 70%,#9ACB86 71%,#86B972 100%)">
      <Randy x={270} y={320} h={760} id="b3r" />
      <Kid x={815} y={320} h={760} t={t} mouth="talk" />
      {tA < COIN_UP && <g transform="translate(540 610)"><Coin x={0} y={0} r={62} ph={0} /></g>}
      {tA >= COIN_UP && <Coin x={c.x} y={c.y} r={62} ph={c.ph} />}
      <QMark x={270} y={150} s={qa * (1 + 0.06 * Math.sin(t * 6))} size={180} />
      <QMark x={815} y={150} s={qb * (1 + 0.06 * Math.sin(t * 6 + 1))} size={180} />
    </Scene>
  );
};

// ================================================================== 4 — "وراندي خسر.": the coin lands on its sad side next to راندي, a red ✗
// stamps over him, Bruce grins
export const B4: React.FC<BoardProps> = ({t, b0}) => {
  const tA = t + b0, eX = wi(28) - b0;
  const c = coinPos(tA);
  const landed = tA >= COIN_UP + 1.55;
  const bounce = landed ? wobble(tA - COIN_UP - 1.55, 3, 7) * 10 : 0;
  return (
    <Scene bg="linear-gradient(180deg,#BFE3F7 0%,#E2F2FB 70%,#9ACB86 71%,#86B972 100%)">
      <Randy x={270} y={320} h={760} id="b4r" />
      <Kid x={815} y={320} h={760} t={t} mouth={t > 0.25 ? 'grin' : 'talk'} />
      <Coin x={landed ? 430 : c.x} y={(landed ? 740 : c.y) - bounce} r={landed ? 80 : 62} ph={landed ? Math.PI : c.ph} />
      <g transform={`translate(270 210) scale(${stampK(t - eX)})`} opacity={clamp((t - eX) / 0.06)}>
        <path d="M -80 -80 L 80 80 M 80 -80 L -80 80" stroke={INK} strokeWidth={44} strokeLinecap="round" />
        <path d="M -80 -80 L 80 80 M 80 -80 L -80 80" stroke={RED} strokeWidth={30} strokeLinecap="round" />
      </g>
    </Scene>
  );
};

// ================================================================== 5 — "أول يومين؟ سهلين." then three panels (right to left): soda can on
// "كوكاكولا", shower on "دُش", Bruce walking behind راندي on "ماشيين وراه". Label "اليوم ١–٢".
const Can: React.FC<{x: number; y: number; s: number; t: number}> = ({x, y, s, t}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-70} y={-120} width={140} height={240} rx={22} fill="#D92B2B" stroke={INK} strokeWidth={8} />
    <rect x={-60} y={-132} width={120} height={26} rx={10} fill="#C9CED6" stroke={INK} strokeWidth={6} />
    <rect x={-60} y={106} width={120} height={22} rx={10} fill="#C9CED6" stroke={INK} strokeWidth={6} />
    <path d="M -40 -100 L -40 90" stroke="#F06A6A" strokeWidth={16} strokeLinecap="round" />
    <path d="M -70 -10 Q 0 -40 70 -10" stroke="#fff" strokeWidth={10} fill="none" opacity={0.85} />
    {Array.from({length: 7}, (_, i) => { const p = ((t * 0.9 + i / 7) % 1); return <circle key={i} cx={Math.sin(i * 2.1 + p * 5) * 40} cy={-140 - p * 160} r={6 + 5 * rand(i)} fill="#fff" stroke={INK} strokeWidth={3} opacity={1 - p} />; })}
  </g>
);
export const B5: React.FC<BoardProps> = ({t, b0}) => {
  const eS = wi(31) - b0, eC = wi(32) - b0, eD = wi(33) - b0, eW = wi(35) - b0;
  const intro = 1 - seg(t, eC - 0.25, eC);
  const p1 = popIn(t - eC, 0.3), p2 = popIn(t - eD, 0.3), p3 = popIn(t - eW + 0.4, 0.3);
  const walk = ((t - eW + 0.4) * 60) % 900;
  return (
    <Scene bg="linear-gradient(180deg,#FFF3D6 0%,#FBE2AE 100%)">
      <DayPill text="اليوم ١–٢" s={popIn(t, 0.3)} />
      {intro > 0 && <g opacity={intro}>
        <Randy x={540} y={210} h={880} arm={t > eS - 0.1 ? {tx: 330, ty: 130, hand: 'thumb', bend: -1} : null} id="b5r" />
        <g transform={`translate(820 360) scale(${popIn(t - eS, 0.3)})`}>
          <circle r={80} fill={GREEN} stroke={INK} strokeWidth={9} />
          <path d="M -38 2 L -10 32 L 42 -30" stroke="#fff" strokeWidth={20} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>}
      <Panel x={560} y={170} w={480} h={380} s={p1} bg="#FFD9D2" id="b5p1"><Can x={240} y={215} s={1.05} t={t} /></Panel>
      <Panel x={40} y={170} w={480} h={380} s={p2} bg="#D9EEFF" id="b5p2">
        <rect x={232} y={0} width={18} height={70} fill="#9aa3ad" stroke={INK} strokeWidth={5} />
        <path d="M 180 66 L 300 66 L 320 104 L 160 104 Z" fill="#C9CED6" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        {Array.from({length: 9}, (_, i) => { const p = ((t * 2.2 + rand(i)) % 1); const xx = 178 + i * 16; return <line key={i} x1={xx + (xx - 240) * p * 0.6} y1={110 + p * 250} x2={xx + (xx - 240) * (p * 0.6 + 0.08)} y2={140 + p * 250} stroke="#3F9FE8" strokeWidth={6} strokeLinecap="round" />; })}
        <RandyHead x={240} y={300} size={150} wide={0.8} id="b5h" />
      </Panel>
      <Panel x={40} y={565} w={1000} h={320} s={p3} bg="#E6F5D8" id="b5p3">
        <rect x={0} y={285} width={1000} height={40} fill="#B9D99A" />
        <g transform={`translate(${-walk} 0)`}>
          <g transform={`translate(${700} ${Math.abs(Math.sin(t * 9)) * -6})`}><Randy x={0} y={8} h={300} tired={0} id="b5w" /></g>
          <Kid x={920} y={18} h={288} t={t} walk={1} mouth="talk" />
        </g>
      </Panel>
    </Scene>
  );
};

// ================================================================== 6 — a closed bathroom door, Bruce leaning on it talking ("…؟"), a tiny "!"
// bubble from inside; knock SFX
export const B6: React.FC<BoardProps> = ({t, b0}) => {
  const eK = wi(40) - b0, eB = wi(44) - b0;
  const knock = (k: number) => wobble(t - (eK - 0.45 + k * 0.16), 6, 14) * 4;
  const shake = knock(0) + knock(1) + knock(2);
  return (
    <Scene bg="linear-gradient(180deg,#CFE8E4 0%,#BFDCD6 100%)">
      {Array.from({length: 9}, (_, i) => <line key={'h' + i} x1={0} x2={W} y1={i * 110 + 40} y2={i * 110 + 40} stroke="#A8CCC4" strokeWidth={4} />)}
      {Array.from({length: 11}, (_, i) => <line key={'v' + i} y1={0} y2={H} x1={i * 110} x2={i * 110} stroke="#A8CCC4" strokeWidth={4} />)}
      <rect x={0} y={860} width={W} height={340} fill="#8FB8AE" />
      <g transform={`translate(${shake} 0)`}>
        <rect x={150} y={180} width={420} height={690} rx={10} fill="#5B3A22" stroke={INK} strokeWidth={10} />
        <rect x={176} y={206} width={368} height={664} rx={8} fill="#B0743F" stroke={INK} strokeWidth={8} />
        <rect x={210} y={250} width={300} height={240} rx={10} fill="none" stroke="#8C5A2E" strokeWidth={8} />
        <rect x={210} y={540} width={300} height={280} rx={10} fill="none" stroke="#8C5A2E" strokeWidth={8} />
        <circle cx={500} cy={540} r={20} fill="#E3C25A" stroke={INK} strokeWidth={6} />
        <rect x={300} y={300} width={120} height={80} rx={10} fill="#fff" stroke={INK} strokeWidth={6} />
        <T x={360} y={344} size={50} color={INK} ltr>WC</T>
      </g>
      <Kid x={720} y={250} h={640} t={t} mouth={t > eK - 0.2 ? 'talk' : 'smile'} lean={-8} />
      <Bubble x={860} y={170} s={popIn(t - eK, 0.3)} w={250} h={140} tail="l"><T x={0} y={4} size={80} color={INK}>…؟</T></Bubble>
      <Bubble x={360} y={110} s={popIn(t - eB, 0.25) * 0.75} w={130} h={110} tail="d"><T x={0} y={6} size={80} color={RED}>!</T></Bubble>
    </Scene>
  );
};

// ================================================================== 7 — "اليوم ٣": راندي (tired 1), angry steam on "عصبي", a tangled speech
// bubble of scribbled letters on "مش عارف يقول جملة"
const Steam: React.FC<{x: number; y: number; dt: number}> = ({x, y, dt}) => {
  if (dt < 0) return null;
  return (
    <g transform={`translate(${x} ${y})`}>
      {[0, 1, 2].map((i) => { const p = ((dt * 1.1 + i / 3) % 1); const k = popIn(dt - i * 0.1, 0.25);
        return <g key={i} transform={`translate(${(i - 1) * 70 + Math.sin(p * 6 + i) * 12} ${-p * 120}) scale(${k * (0.7 + 0.5 * p)})`} opacity={1 - p * 0.8}>
          {[[-26, 0, 30], [26, 0, 30], [0, -22, 34]].map(([cx, cy, r], j) => <circle key={j} cx={cx} cy={cy} r={r} fill="#F2F2F2" stroke={INK} strokeWidth={6} />)}
        </g>; })}
    </g>
  );
};
export const B7: React.FC<BoardProps> = ({t, b0}) => {
  const eA = wi(48) - b0, eJ = wi(49) - b0;
  const bub = popIn(t - eJ, 0.3);
  const shake = t > eA ? wobble(t - eA, 7, 6) * 6 : 0;
  return (
    <Scene bg="linear-gradient(180deg,#F6D7B8 0%,#EDB98E 100%)">
      <DayPill text="اليوم ٣" s={popIn(t, 0.3)} />
      <g transform={`translate(${shake} 0)`}><Randy x={330} y={250} h={1000} tired={1} id="b7r" /></g>
      <Steam x={330} y={215} dt={t - eA} />
      <Bubble x={780} y={430} s={bub} w={470} h={300} tail="l">
        <g transform="translate(-200 -110)">
          {Array.from({length: 3}, (_, r) => (
            <path key={r} d={`M 10 ${40 + r * 75} ${Array.from({length: 14}, (_, i) => `Q ${20 + i * 27 + 12} ${40 + r * 75 + (i % 2 ? -34 : 34) * rand(i + r * 9)} ${24 + i * 27} ${40 + r * 75 + 10 * Math.sin(i * 1.7 + r)}`).join(' ')}`}
              stroke={[INK, RED, '#3F6FD8'][r]} strokeWidth={7} fill="none" strokeLinecap="round" strokeDasharray={`${clamp((t - eJ) * 1.4 - r * 0.15) * 900} 2000`} />
          ))}
        </g>
        <T x={-150} y={-100} size={58} color={RED} rot={-12} o={clamp((t - eJ - 0.5) * 3)}>؟</T>
        <T x={170} y={90} size={58} color={INK} rot={14} o={clamp((t - eJ - 0.7) * 3)}>!#</T>
      </Bubble>
    </Scene>
  );
};

// ================================================================== 8 — "اليوم ٤": راندي puffs his chest, a glowing outline of an American-football
// player appears behind him (thought-cloud style) on "لاعب كورة مشهور"; his friends stare, mouths open
const Footballer: React.FC<{o: number; t: number}> = ({o, t}) => (o <= 0 ? null : (
  <g opacity={o} transform={`translate(540 ${420 + Math.sin(t * 2) * 6})`}>
    <g fill="rgba(255,230,140,0.16)" stroke="#FFE68C" strokeWidth={14} strokeLinejoin="round" strokeLinecap="round" style={{filter: 'drop-shadow(0 0 14px #FFD23F)'}}>
      <path d="M -210 40 Q -230 -60 -120 -80 L 120 -80 Q 230 -60 210 40 L 170 60 L 150 300 L -150 300 L -170 60 Z" />
      <path d="M -100 -120 Q -110 -290 0 -300 Q 120 -300 110 -150 L 96 -100 L -60 -100 Z" />
      <path d="M 10 -190 L 140 -190 M 20 -150 L 140 -150 M 70 -200 L 70 -130" fill="none" />
      <path d="M -230 40 L -290 220 M 230 40 L 290 220" fill="none" />
      <ellipse cx={330} cy={180} rx={70} ry={42} transform="rotate(-30 330 180)" />
    </g>
    <text x={0} y={190} textAnchor="middle" fontFamily="Cairo" fontWeight={900} fontSize={170} fill="none" stroke="#FFE68C" strokeWidth={8}>11</text>
  </g>
));
export const B8: React.FC<BoardProps> = ({t, b0}) => {
  const eP = wi(57) - b0, eL = wi(61) - b0;
  const puff = easeOut(seg(t, eP - 0.1, eP + 0.3)) + wobble(t - eP - 0.3, 3, 6) * 0.03;
  const glow = seg(t, eL - 0.15, eL + 0.5);
  const dots = [0, 1, 2].map((i) => popIn(t - eL + 0.45 - i * 0.12, 0.2));
  return (
    <Scene bg="linear-gradient(180deg,#3A3F7A 0%,#6C5FA6 60%,#9A7DB8 100%)">
      <DayPill text="اليوم ٤" s={popIn(t, 0.3)} />
      <Footballer o={glow} t={t} />
      {dots.map((k, i) => k > 0 && <circle key={i} cx={560 + i * 24} cy={300 - i * 36} r={(10 + i * 7) * k} fill="#fff" stroke={INK} strokeWidth={4} />)}
      <Kid x={170} y={440} h={620} t={t} mouth={t > eL ? 'open' : 'smile'} eyes={t > eL ? 'wide' : 'open'} />
      <Kid x={910} y={440} h={620} t={t} variant="friend2" mouth={t > eL + 0.1 ? 'open' : 'smile'} eyes={t > eL + 0.1 ? 'wide' : 'open'} />
      <Randy x={540} y={330} h={830} sx={1 + 0.07 * puff} tired={1} id="b8r" />
    </Scene>
  );
};

// ================================================================== 9 — comic: a generic cartoon Egyptian guy wakes up in bed and imagines
// himself in a plain red kit with number 11 (crowd cheer on "محمد صلاح"). No real face, no logos.
const Guy: React.FC<{kit?: boolean; mouth?: Mouth; t?: number}> = ({kit = false, mouth = 'smile', t = 0}) => (
  <g>
    {kit ? <>
      <path d="M -70 30 Q 0 10 70 30 L 80 250 L -80 250 Z" fill="#D92B2B" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <T x={0} y={140} size={110} color="#fff" stroke={8} ltr>11</T>
      {[-1, 1].map((s) => <g key={s}><path d={`M ${s * 66} 44 L ${s * 130} -70`} stroke={INK} strokeWidth={38} strokeLinecap="round" /><path d={`M ${s * 66} 44 L ${s * 130} -70`} stroke="#D92B2B" strokeWidth={30} strokeLinecap="round" />
        <circle cx={s * 134} cy={-82} r={18} fill="#C68A5E" stroke={INK} strokeWidth={4} /></g>)}
    </> : <>
      <path d="M -70 30 Q 0 10 70 30 L 80 250 L -80 250 Z" fill="#7FB3E8" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      {[-40, 0, 40].map((sx) => <line key={sx} x1={sx} y1={30} x2={sx} y2={250} stroke="#fff" strokeWidth={10} />)}
      <path d="M -70 30 Q 0 10 70 30 L 80 250 L -80 250 Z" fill="none" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      {[-1, 1].map((s) => <g key={s}><path d={`M ${s * 66} 44 Q ${s * 96} 130 ${s * 70} 200`} stroke={INK} strokeWidth={36} fill="none" strokeLinecap="round" /><path d={`M ${s * 66} 44 Q ${s * 96} 130 ${s * 70} 200`} stroke="#7FB3E8" strokeWidth={28} fill="none" strokeLinecap="round" /></g>)}
    </>}
    <rect x={-16} y={-10} width={32} height={40} fill="#C68A5E" stroke={INK} strokeWidth={5} />
    <ellipse cx={0} cy={-70} rx={62} ry={70} fill="#C68A5E" stroke={INK} strokeWidth={6} />
    <path d="M -62 -84 Q -66 -150 0 -146 Q 64 -150 62 -84 Q 50 -116 0 -114 Q -48 -116 -62 -84 Z" fill="#1E1612" stroke={INK} strokeWidth={5} />
    <circle cx={-22} cy={-66} r={6.5} fill={INK} /><circle cx={22} cy={-66} r={6.5} fill={INK} />
    <path d="M -34 -88 Q -22 -94 -10 -88 M 10 -88 Q 22 -94 34 -88" stroke="#1E1612" strokeWidth={6} fill="none" strokeLinecap="round" />
    <MouthP m={mouth} x={0} y={-28} t={t} />
  </g>
);
export const B9: React.FC<BoardProps> = ({t, b0}) => {
  const eW = wi(66) - b0, eM = wi(69) - b0;
  const up = easeOut(seg(t, eW - 0.2, eW + 0.3));
  const cloud = popIn(t - eM + 0.25, 0.35);
  const dots = [0, 1, 2].map((i) => popIn(t - eM + 0.5 - i * 0.1, 0.2));
  return (
    <Scene bg="linear-gradient(180deg,#FFE3B3 0%,#F7C98A 100%)">
      <rect x={60} y={90} width={250} height={250} rx={12} fill="#BFE6FF" stroke={INK} strokeWidth={9} />
      <circle cx={240} cy={160} r={44} fill="#FFD23F" stroke={INK} strokeWidth={6} />
      <path d="M 185 90 V 340 M 60 215 H 310" stroke={INK} strokeWidth={9} />
      <g transform={`translate(260 ${lerp(690, 560, up)}) rotate(${lerp(-80, 0, up)} 0 150)`}><Guy mouth={t > eM ? 'grin' : 'smile'} t={t} /></g>
      <Bed x={60} y={720} w={600} blanket="#E08AA6" />
      {dots.map((k, i) => k > 0 && <circle key={i} cx={370 + i * 50} cy={440 - i * 50} r={(10 + i * 7) * k} fill="#fff" stroke={INK} strokeWidth={5} />)}
      {cloud > 0 && <g transform={`translate(760 360) scale(${cloud})`}>
        {[[-170, 20, 110], [170, 20, 110], [0, -120, 130], [-90, -80, 110], [90, -80, 110], [-100, 110, 110], [100, 110, 110], [0, 140, 110]].map(([cx, cy, r], i) => <circle key={i} cx={cx} cy={cy} r={r} fill="#fff" stroke={INK} strokeWidth={8} />)}
        {[[-170, 20, 102], [170, 20, 102], [0, -120, 122], [-90, -80, 102], [90, -80, 102], [-100, 110, 102], [100, 110, 102], [0, 140, 102], [0, 10, 170]].map(([cx, cy, r], i) => <circle key={'i' + i} cx={cx} cy={cy} r={r} fill="#fff" />)}
        <ellipse cx={0} cy={150} rx={210} ry={60} fill="#7BC46A" />
        {Array.from({length: 22}, (_, i) => <circle key={i} cx={-210 + i * 20} cy={-110 + 18 * Math.sin(i + t * 8) * (i % 2)} r={8} fill={['#D92B2B', '#fff', '#3F6FD8', YEL][i % 4]} opacity={0.7} />)}
        <g transform={`translate(0 ${-10 + Math.abs(Math.sin(t * 6)) * -12}) scale(0.68)`}><Guy kit mouth="grin" t={t} /></g>
      </g>}
    </Scene>
  );
};

// ================================================================== 10 — "اليوم ٥": the living room slowly turns into a dark forest; راندي
// (tired 2) rubs his eyes. Board darker. Low hum.
export const B10: React.FC<BoardProps> = ({t, b0}) => {
  const eS = wi(73) - b0, eG = wi(74) - b0;
  const grow = (i: number) => easeOut(seg(t, eS + i * 0.12, eS + 0.9 + i * 0.12));
  const dark = seg(t, eS, eG + 0.8);
  const rub = t > eG + 0.3 ? easeInOut(seg(t, eG + 0.3, eG + 0.6)) : 0;
  return (
    <Scene bg="linear-gradient(180deg,#F1DDB9 0%,#E6C99A 100%)">
      <DayPill text="اليوم ٥" s={popIn(t, 0.3)} />
      <rect x={0} y={800} width={W} height={400} fill="#B98A5A" />
      <rect x={700} y={250} width={240} height={180} rx={8} fill="#9CC9E8" stroke={INK} strokeWidth={8} />
      <path d="M 820 250 V 430 M 700 340 H 940" stroke={INK} strokeWidth={8} />
      <rect x={690} y={580} width={340} height={150} rx={30} fill="#C0504D" stroke={INK} strokeWidth={8} />
      <rect x={720} y={530} width={280} height={90} rx={30} fill="#D9655F" stroke={INK} strokeWidth={8} />
      <line x1={110} y1={340} x2={110} y2={800} stroke={INK} strokeWidth={10} />
      <path d="M 50 340 L 170 340 L 140 250 L 80 250 Z" fill="#F4E28C" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      <rect x={0} y={0} width={W} height={H} fill="#0E1A12" opacity={0.55 * dark} />
      {[[70, 520, 1.2, 0, '#1F3A2A'], [970, 470, 1.3, 0, '#2E5A3A'], [800, 820, 1.4, 0, '#24402C'], [40, 260, 0.9, 70, '#2E5A3A'], [1040, 300, 0.9, -70, '#1F3A2A'],
        [540, 210, 0.55, 180, '#24402C'], [240, 830, 1.1, 0, '#2E5A3A'], [920, 860, 1.0, 0, '#1F3A2A']].map(([x, y, s, r, c], i) => (
        <Tree key={i} x={x as number} y={y as number} s={(s as number) * grow(i)} rot={r as number} c={c as string} />
      ))}
      <Randy x={400} y={300} h={880} tired={2} rub={rub} t={t} id="b10r" />
    </Scene>
  );
};

// ================================================================== 11 — "اليوم ١٠": the sleep scientist walks in, they play pinball; lights flash,
// "WIN" lights up on راندي's side on "غلبه"; the scientist scratches his head
const Pinball: React.FC<{t: number; win: number; flash: number}> = ({t, win, flash}) => (
  <g transform="translate(540 0)">
    <path d="M -190 380 L 190 380 L 220 820 L -220 820 Z" fill="#2B2F7A" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
    <rect x={-200} y={150} width={400} height={240} rx={16} fill="#1E1E3E" stroke={INK} strokeWidth={9} />
    <T x={0} y={215} size={64} color={YEL} stroke={8} ltr>PINBALL</T>
    {Array.from({length: 9}, (_, i) => <circle key={i} cx={-160 + i * 40} cy={290} r={13} fill={flash > 0 && (Math.floor(t * 10) + i) % 2 ? [RED, YEL, GREEN][i % 3] : '#555'} stroke={INK} strokeWidth={3} />)}
    {[-1, 1].map((s) => (
      <g key={s} transform={`translate(${s * 100} 345)`}>
        <rect x={-62} y={-24} width={124} height={48} rx={10} fill={s < 0 && win > 0 ? (Math.floor(t * 8) % 2 ? YEL : '#FFF5B0') : '#3a3a5a'} stroke={INK} strokeWidth={5} />
        <T x={0} y={3} size={36} color={s < 0 && win > 0 ? RED : '#666'} ltr>WIN</T>
      </g>
    ))}
    <path d="M -170 420 L 170 420 L 186 780 L -186 780 Z" fill="#4E58C9" stroke={INK} strokeWidth={6} />
    {[[-80, 520, 34, RED], [70, 500, 34, YEL], [0, 620, 30, GREEN]].map(([cx, cy, r, c], i) => <circle key={i} cx={cx as number} cy={cy as number} r={(r as number) * (flash > 0 ? 1 + 0.12 * Math.sin(t * 20 + i) : 1)} fill={c as string} stroke={INK} strokeWidth={5} />)}
    <circle cx={Math.sin(t * 3.1) * 120} cy={600 + Math.cos(t * 2.3) * 120} r={18} fill="#E8EEF5" stroke={INK} strokeWidth={4} />
    <path d={`M -120 740 L -40 ${760 + Math.sin(t * 9) * 12}`} stroke={RED} strokeWidth={18} strokeLinecap="round" />
    <path d={`M 120 740 L 40 ${760 + Math.sin(t * 9 + 2) * 12}`} stroke={RED} strokeWidth={18} strokeLinecap="round" />
  </g>
);
export const B11: React.FC<BoardProps> = ({t, b0}) => {
  const eJ = wi(80) - b0, eF = wi(83) - b0, eG = wi(85) - b0;
  const walk = easeOut(seg(t, eJ - 0.3, eJ + 0.9));
  const sx = lerp(1250, 900, walk);
  return (
    <Scene bg="linear-gradient(180deg,#2C2148 0%,#4B3270 100%)">
      <DayPill text="اليوم ١٠" s={popIn(t, 0.3)} />
      <rect x={0} y={820} width={W} height={380} fill="#2A1C3A" />
      <Pinball t={t} win={t > eG ? 1 : 0} flash={t > eF ? 1 : 0} />
      {t > eG && <><Sparkle4 x={440} y={310} r={46 * Math.sin(seg(t, eG, eG + 0.5) * Math.PI)} /><Sparkle4 x={300} y={240} r={60 * Math.sin(seg(t, eG + 0.15, eG + 0.7) * Math.PI)} /></>}
      <Randy x={175} y={330} h={760} tired={2} arm={t > eG ? {tx: 230, ty: -40, hand: 'fist'} : null} id="b11r" />
      <Scientist x={sx} y={300} h={790} t={t} walk={walk < 1 ? 1 : 0} arm={t > eG + 0.25 ? 'scratch' : 'down'} mouth={t > eG + 0.25 ? 'open' : 'smile'} />
    </Scene>
  );
};

// ================================================================== 12 + 13 — "اليوم ١١": the chalkboard. "١٠٠ − ٧ = ٩٣ …" then "٨٦ … ٧٩ … ٧٢ … ٦٥" written step by
// step with the words (absolute times, so both boards are one continuous drawing); then the chalk stops, راندي freezes,
// a big "؟" floats over his head and the chalk drops (clink) on "نسي".
const CH = {L1: 290, L2: 470};
const TOK: {txt: string; x: number; y: number; at: number; c?: string}[] = [
  {txt: '١٠٠', x: 935, y: CH.L1, at: wi(91) + 0.05},
  {txt: '−', x: 830, y: CH.L1, at: wi(92) - 0.05},
  {txt: '٧', x: 755, y: CH.L1, at: wi(92) + 0.1},
  {txt: '=', x: 670, y: CH.L1, at: wi(94) - 0.1},
  {txt: '٩٣', x: 575, y: CH.L1, at: wi(94) + 0.12},
  {txt: '…', x: 470, y: CH.L1, at: wi(95) - 0.1},
  {txt: '٨٦', x: 935, y: CH.L2, at: wi(95) + 0.1},
  {txt: '…', x: 845, y: CH.L2, at: wi(95) + 0.35},
  {txt: '٧٩', x: 760, y: CH.L2, at: wi(95) + 0.55},
  {txt: '…', x: 670, y: CH.L2, at: wi(96) - 0.15},
  {txt: '٧٢', x: 585, y: CH.L2, at: wi(96) + 0.1},
  {txt: '…', x: 495, y: CH.L2, at: wi(97)},
  {txt: '٦٥', x: 410, y: CH.L2, at: wi(98), c: '#FF8A80'},
];
const Chalkboard: React.FC<{tA: number; t: number}> = ({tA, t}) => {
  const eN = wi(100);
  const done = TOK.filter((k) => tA >= k.at);
  const last = done[done.length - 1];
  const writing = last && tA < last.at + 0.3;
  const frozen = tA >= TOK[TOK.length - 1].at + 0.35;
  const drop = tA >= eN ? tA - eN : -1;
  const target = last ? {x: last.x - 30, y: last.y + 20} : {x: 980, y: CH.L1};
  const jig = writing ? Math.sin(tA * 40) * 8 : 0;
  // راندي at x 175, top 330, h 760 -> picture scale 760/707; arm target in picture coordinates
  const k = 760 / RH;
  const toPic = (bx: number, by: number) => ({tx: (bx - 175) / k + RW / 2, ty: (by - 330) / k});
  const q = drop >= 0 ? popIn(drop, 0.35) : 0;
  const chalkY = drop >= 0 ? Math.min(820, 470 + easeIn(clamp(drop / 0.45)) * 350) : 0;
  return (
    <>
      <rect x={300} y={150} width={760} height={460} rx={14} fill="#7A5230" stroke={INK} strokeWidth={9} />
      <rect x={322} y={172} width={716} height={416} rx={8} fill="#24493A" stroke={INK} strokeWidth={6} />
      <rect x={340} y={596} width={680} height={18} rx={6} fill="#9C6B3E" stroke={INK} strokeWidth={5} />
      {TOK.map((k2, i) => {
        const u = clamp((tA - k2.at) / 0.25);
        if (u <= 0) return null;
        return (
          <g key={i}>
            <defs><clipPath id={`ck${i}`}><rect x={k2.x + 60 - 120 * u} y={k2.y - 80} width={130} height={160} /></clipPath></defs>
            <text x={k2.x} y={k2.y} textAnchor="middle" dominantBaseline="middle" fontFamily="Cairo" fontWeight={900} fontSize={k2.txt === '…' ? 70 : 104}
              fill={k2.c ?? '#F4F1E6'} opacity={0.93} clipPath={`url(#ck${i})`}>{k2.txt}</text>
          </g>
        );
      })}
      <Randy x={175} y={330} h={760} tired={3} id="b12r"
        arm={drop < 0 ? {...toPic(target.x + jig, target.y + (frozen ? 10 : 0)), hand: 'chalk'} : {...toPic(250, 700), hand: 'fist'}} />
      {drop >= 0 && drop < 0.8 && <rect x={300} y={chalkY} width={26} height={10} rx={3} fill="#fff" stroke={INK} strokeWidth={3} transform={`rotate(${drop * 700} 313 ${chalkY + 5})`} />}
      <QMark x={175} y={130 - (drop >= 0 ? Math.sin(t * 3) * 8 : 0)} s={q * (1 + 0.06 * Math.sin(t * 5))} size={230} />
    </>
  );
};
export const B12: React.FC<BoardProps> = ({t, b0}) => (
  <Scene bg="linear-gradient(180deg,#E9D8BC 0%,#D9C29C 100%)">
    <DayPill text="اليوم ١١" s={popIn(t, 0.3)} />
    <Chalkboard tA={t + b0} t={t + b0} />
  </Scene>
);
export const B13: React.FC<BoardProps> = ({t, b0}) => (
  <Scene bg="linear-gradient(180deg,#E9D8BC 0%,#D9C29C 100%)">
    <DayPill text="اليوم ١١" />
    <Chalkboard tA={t + b0} t={t + b0} />
  </Scene>
);

// ================================================================== 14 — راندي collapses into bed; the clock spins fast; "Zzz" float up;
// "١٥ ساعة" pops on "خمستاشر ساعة". Soft snore.
export const B14: React.FC<BoardProps> = ({t, b0}) => {
  const eN = wi(105) - b0, eH = wi(106) - b0;
  const fall = easeIn(seg(t, 0.1, eN - 0.05));
  const inBed = t >= eN - 0.05;
  return (
    <Scene bg="linear-gradient(180deg,#3B4C8C 0%,#5A6AA8 100%)">
      <rect x={0} y={830} width={W} height={370} fill="#2E3A6E" />
      <Clock x={850} y={230} r={130} t={t} speed={inBed ? 6 : 0.5} />
      {inBed ? <>
        <Bed x={120} y={680} w={760} />
        <RandyHead x={228} y={600} size={170} closed={1} rot={-72} id="b14h" />
        <path d={`M 300 655 Q 560 600 856 656 L 856 720 L 300 720 Z`} fill="#6FA8DC" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <Zzz x={300} y={470} t={t} size={86} />
      </> : <>
        <Bed x={120} y={680} w={760} />
        <g transform={`rotate(${-fall * 78} 470 1060)`}><Randy x={470} y={200} h={860} tired={3} id="b14r" /></g>
      </>}
      <g transform={`translate(640 380) scale(${popIn(t - eH, 0.3)})`}>
        <rect x={-190} y={-70} width={380} height={140} rx={70} fill={YEL} stroke={INK} strokeWidth={9} />
        <T x={0} y={6} size={88} color={INK}>١٥ ساعة</T>
      </g>
    </Scene>
  );
};

// ================================================================== 15 — press conference: راندي (rested) at a table with microphones, camera
// flashes, a newspaper "11 DAYS AWAKE!"; cocky thumbs up on "مفيش حاجة وحشة"
const FLASHES = [0.2, 0.75, 1.1, 1.7, 2.3, 2.6, 3.0];
export const B15: React.FC<BoardProps> = ({t, b0}) => {
  const eP = wi(110) - b0, eM = wi(113) - b0;
  const paper = popIn(t - eP, 0.35);
  const thumb = easeOut(seg(t, eM - 0.15, eM + 0.2));
  return (
    <Scene bg="linear-gradient(180deg,#2B5FA8 0%,#3F7BC6 100%)">
      {Array.from({length: 6}, (_, i) => <rect key={i} x={i * 190 - 20} y={0} width={90} height={H} fill="#fff" opacity={0.05} />)}
      <Randy x={560} y={250} h={900} arm={thumb > 0 ? {tx: lerp(226, 330, thumb), ty: lerp(436, 130, thumb), hand: 'thumb', bend: -1} : null} id="b15r" />
      <rect x={120} y={640} width={840} height={40} rx={8} fill="#E9E2D0" stroke={INK} strokeWidth={8} />
      <rect x={140} y={680} width={800} height={200} fill="#1E3F75" stroke={INK} strokeWidth={8} />
      {[[400, -18], [560, 0], [720, 18]].map(([mx, r], i) => (
        <g key={i} transform={`translate(${mx} 640) rotate(${r})`}>
          <rect x={-8} y={-110} width={16} height={110} fill="#333" stroke={INK} strokeWidth={4} />
          <rect x={-26} y={-170} width={52} height={70} rx={24} fill="#4a4a4a" stroke={INK} strokeWidth={6} />
          <rect x={-24} y={-100} width={48} height={24} rx={6} fill={[RED, YEL, GREEN][i]} stroke={INK} strokeWidth={4} />
        </g>
      ))}
      {paper > 0 && <g transform={`translate(230 270) rotate(-9) scale(${paper})`}>
        <rect x={-190} y={-150} width={380} height={300} fill={INK} opacity={0.3} transform="translate(10 12)" />
        <rect x={-190} y={-150} width={380} height={300} fill="#F7F3E8" stroke={INK} strokeWidth={8} />
        <T x={0} y={-108} size={30} color="#555" ltr>THE DAILY NEWS · 1964</T>
        <line x1={-170} x2={170} y1={-84} y2={-84} stroke={INK} strokeWidth={4} />
        <T x={0} y={-36} size={60} color={INK} ltr>11 DAYS</T>
        <T x={0} y={24} size={60} color={RED} ltr>AWAKE!</T>
        <rect x={-170} y={60} width={120} height={70} fill="#C9C2B0" stroke={INK} strokeWidth={4} />
        {[72, 92, 112].map((ly) => <line key={ly} x1={-36} x2={170} y1={ly} y2={ly} stroke="#999" strokeWidth={6} />)}
      </g>}
      {FLASHES.map((ft, i) => <Flash key={i} x={[880, 980, 820, 960, 900, 1000, 860][i]} y={[180, 420, 320, 140, 520, 300, 240][i]} dt={t - ft} r={110} />)}
      {thumb > 0 && <Sparkle4 x={720} y={250} r={46 * Math.sin(seg(t, eM + 0.1, eM + 0.6) * Math.PI)} />}
    </Scene>
  );
};

// ================================================================== 16 — "بعد أكتر من أربعين سنة… تفتكر حصله إيه؟" + the mystery pause: the board fades to night
// blue, a calendar flips fast 1964 -> 2007, a big "؟" pulses. During the pause only the "؟" moves (the episode freezes t).
export const B16: React.FC<BoardProps & {tq?: number}> = ({t, b0, tq = t}) => {
  const e4 = wi(120) - b0, eS = wi(121) - b0, eQ = wi(122) - b0;
  const night = seg(t, 0, 0.6);
  const u = easeInOut(seg(t, 0.15, eS + 0.25));
  const yr = Math.round(lerp(1964, 2007, u));
  const flip = u > 0 && u < 1 ? ((t * 9) % 1) : 0;
  const q = popIn(tq - eQ, 0.35);
  return (
    <Scene bg={`linear-gradient(180deg, ${night > 0.5 ? '#141B44' : '#2B5FA8'} 0%, ${night > 0.5 ? '#26306A' : '#3F7BC6'} 100%)`}>
      <rect x={0} y={0} width={W} height={H} fill="#141B44" opacity={night} />
      {Array.from({length: 26}, (_, i) => <circle key={i} cx={rand(i) * W} cy={rand(i + 50) * 760 + 40} r={2 + rand(i + 9) * 4} fill="#fff" opacity={night * (0.5 + 0.5 * rand(i + 3))} />)}
      <Moon x={900} y={170} r={70} bg="#141B44" />
      <g transform={`translate(${lerp(540, 330, easeOut(seg(t, eQ - 0.2, eQ + 0.3)))} 430)`}>
        <CalDay x={0} y={0} s={1.45} n={String(yr)} flip={flip} head="سنة" />
      </g>
      {t > e4 && <T x={lerp(540, 330, easeOut(seg(t, eQ - 0.2, eQ + 0.3)))} y={760} size={78} color={YEL} stroke={10} s={popIn(t - e4, 0.3)}>+٤٠ سنة</T>}
      <QMark x={790} y={330} s={q * (1 + 0.1 * Math.sin(tq * 5))} size={420} />
    </Scene>
  );
};

// ================================================================== 17 — old راندي in bed at night, wide awake (prop 2); the bedside clock
// ticks 2:00 -> 3:00 -> 4:00; the moon moves across the window. TWIST on "ينام" (episode camera).
export const B17: React.FC<BoardProps> = ({t, b0, d}) => {
  useProps();
  const e3 = wi(126) - b0, e4 = wi(129) - b0, eN = wi(131) - b0;
  const hr = t < e3 ? 2 : t < e4 ? 3 : 4;
  const tick = (et: number) => wobble(t - et, 5, 9) * 6;
  const moonU = seg(t, 0, d);
  const bw = 820, bh = (PR.randy_old_bed.h * bw) / PR.randy_old_bed.w;
  return (
    <Scene bg="linear-gradient(180deg,#1A2250 0%,#232E66 100%)">
      <rect x={0} y={860} width={W} height={340} fill="#151B3E" />
      {/* window */}
      <defs><clipPath id="b17w"><rect x={600} y={90} width={400} height={330} /></clipPath></defs>
      <rect x={584} y={74} width={432} height={362} rx={10} fill="#5A4632" stroke={INK} strokeWidth={8} />
      <g clipPath="url(#b17w)">
        <rect x={600} y={90} width={400} height={330} fill="#0E1638" />
        {Array.from({length: 12}, (_, i) => <circle key={i} cx={610 + rand(i + 20) * 380} cy={100 + rand(i + 40) * 300} r={2 + rand(i) * 3} fill="#fff" opacity={0.8} />)}
        <Moon x={lerp(640, 960, moonU)} y={250 - Math.sin(moonU * Math.PI) * 90} r={52} bg="#0E1638" />
      </g>
      <path d="M 800 90 V 420 M 600 255 H 1000" stroke="#5A4632" strokeWidth={14} />
      <rect x={584} y={74} width={432} height={362} rx={10} fill="none" stroke={INK} strokeWidth={8} />
      <image href={SRC('randy_old_bed')} x={230} y={880 - bh} width={bw} height={bh} />
      {/* nightstand + alarm clock */}
      <rect x={30} y={640} width={210} height={230} rx={12} fill="#6B4A30" stroke={INK} strokeWidth={8} />
      <line x1={30} y1={740} x2={240} y2={740} stroke={INK} strokeWidth={6} /><circle cx={135} cy={700} r={8} fill="#E3C25A" stroke={INK} strokeWidth={3} />
      <g transform={`translate(135 ${520 + tick(e3) + tick(e4)})`}>
        {[-1, 1].map((s) => <circle key={s} cx={s * 62} cy={-92} r={26} fill="#E9C04A" stroke={INK} strokeWidth={6} />)}
        <Clock x={0} y={0} r={110} t={t} hour={hr} minute={0} face="#FFF8DD" />
        {[-1, 1].map((s) => <line key={'l' + s} x1={s * 60} y1={90} x2={s * 80} y2={124} stroke={INK} strokeWidth={10} strokeLinecap="round" />)}
      </g>
      <g transform="translate(135 300)">
        <rect x={-100} y={-48} width={200} height={96} rx={20} fill="#111" stroke={INK} strokeWidth={6} />
        <T x={0} y={6} size={64} color="#FF5A4E" ltr>{`${hr}:00`}</T>
      </g>
      {t > eN && <T x={600} y={560} size={120} color={RED} stroke={14} s={popIn(t - eN, 0.25)} rot={8}>!</T>}
    </Scene>
  );
};

// ================================================================== 18 — the record book: open on راندي's entry, slams shut with a thud on
// "بطّلت", a red "خطر ⚠" stamp on "خطر"
export const B18: React.FC<BoardProps> = ({t, b0}) => {
  const eC = wi(134) - b0, eK = wi(139) - b0;
  const close = easeIn(seg(t, eC - 0.3, eC));
  const shake = t > eC ? wobble(t - eC, 6, 8) * 10 : 0;
  const cover = (
    <>
      <rect x={-330} y={-280} width={660} height={560} rx={20} fill="#1F3D7A" stroke={INK} strokeWidth={10} />
      <rect x={-300} y={-250} width={600} height={500} rx={12} fill="none" stroke="#E3C25A" strokeWidth={6} />
      <T x={0} y={-100} size={96} color="#F2D06B" ltr>GUINNESS</T>
      <T x={0} y={10} size={74} color="#fff" ltr>WORLD</T>
      <T x={0} y={100} size={74} color="#fff" ltr>RECORDS</T>
    </>
  );
  return (
    <Scene bg="linear-gradient(180deg,#F3E3C0 0%,#E6CC98 100%)">
      <g transform={`translate(540 ${470 + shake})`}>
        <rect x={-340} y={-262} width={680} height={560} rx={20} fill={INK} opacity={0.3} transform="translate(14 18)" />
        {close < 1 ? <>
          {/* open book: left page with the entry, right page; the cover swings shut */}
          <rect x={-340} y={-262} width={680} height={540} rx={16} fill="#1F3D7A" stroke={INK} strokeWidth={10} />
          <rect x={-320} y={-246} width={316} height={508} fill="#FBF6E8" stroke={INK} strokeWidth={6} />
          <rect x={4} y={-246} width={316} height={508} fill="#FBF6E8" stroke={INK} strokeWidth={6} />
          <RandyHead x={-162} y={-110} size={170} id="b18h" />
          <T x={-162} y={40} size={50} color={INK} ltr>RANDY</T>
          <T x={-162} y={110} size={64} color={RED} ltr>11 DAYS</T>
          {[-170, -110, -50, 10, 70, 130].map((ly) => <line key={ly} x1={34} x2={290} y1={ly} y2={ly} stroke="#BBB" strokeWidth={8} strokeLinecap="round" />)}
          <g transform={`scale(${1 - 2 * close} 1)`}>
            {close > 0.5 ? <g transform="translate(170 8) scale(0.52 0.95)">{cover}</g> : <rect x={4} y={-262} width={336} height={540} rx={16} fill="#1F3D7A" stroke={INK} strokeWidth={10} opacity={close > 0 ? 1 : 0} />}
          </g>
        </> : <g>{cover}<rect x={-345} y={-270} width={22} height={540} rx={8} fill="#16305F" stroke={INK} strokeWidth={6} /></g>}
      </g>
      <Stamp x={600} y={600} dt={t - eK} text="خطر" size={120} rot={-12} warn />
    </Scene>
  );
};

// ================================================================== 19 — CTA: phone with an alarm clock "?? ساعة" + a bouncing comment icon on
// "كام ساعة"; a send arrow ➤ flies to a sleepy friend on "وابعته"; "الفجر" + moon on "بينام الفجر"
const Phone: React.FC<{t: number; q: number}> = ({t, q}) => (
  <g transform="translate(290 450)">
    <rect x={-190} y={-330} width={380} height={660} rx={50} fill={INK} opacity={0.3} transform="translate(12 14)" />
    <rect x={-190} y={-330} width={380} height={660} rx={50} fill="#222" stroke={INK} strokeWidth={8} />
    <rect x={-166} y={-290} width={332} height={580} rx={26} fill="#DDEBFF" />
    <rect x={-50} y={-316} width={100} height={14} rx={7} fill="#444" />
    <g transform={`translate(0 -30) rotate(${q > 0 ? Math.sin(t * 30) * 5 * Math.exp(-t * 0.5) : 0})`}>
      {[-1, 1].map((s) => <circle key={s} cx={s * 80} cy={-120} r={34} fill="#E9C04A" stroke={INK} strokeWidth={6} />)}
      <circle r={140} fill="#FFF8DD" stroke={INK} strokeWidth={12} />
      <T x={0} y={-20} size={84} color={RED} ltr>??</T>
      <T x={0} y={56} size={56} color={INK}>ساعة</T>
    </g>
    <T x={0} y={200} size={46} color="#555">صاحي كام؟</T>
  </g>
);
export const B19: React.FC<BoardProps> = ({t, b0}) => {
  const eK = wi(146) - b0, eB = wi(148) - b0, eF = wi(151) - b0;
  const ic = popIn(t - eK, 0.3);
  const bounce = ic > 0 ? Math.abs(Math.sin((t - eK) * 5)) * -22 : 0;
  const fr = popIn(t - eB + 0.1, 0.35);
  const fly = seg(t, eB, eB + 0.6);
  return (
    <Scene bg="linear-gradient(180deg,#FFE7C2 0%,#F7CF95 100%)">
      <Phone t={t} q={1} />
      {ic > 0 && <g transform={`translate(560 ${190 + bounce}) scale(${ic})`}>
        <path d="M -100 -80 Q -100 -116 -64 -116 L 64 -116 Q 100 -116 100 -80 L 100 14 Q 100 50 64 50 L -14 50 L -58 94 L -50 50 L -64 50 Q -100 50 -100 14 Z" fill="#2F9BFF" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
        {[-44, 0, 44].map((cx) => <circle key={cx} cx={cx} cy={-32} r={14} fill="#fff" />)}
      </g>}
      {ic > 0 && <g transform={`translate(560 ${420 + bounce * 0.6}) scale(${0.8 * ic})`}>
        <path d="M -30 -70 L 30 -70 L 30 0 L 70 0 L 0 80 L -70 0 L -30 0 Z" fill={YEL} stroke={INK} strokeWidth={9} strokeLinejoin="round" />
      </g>}
      {fr > 0 && <g transform={`translate(800 520) scale(${fr})`}>
        <rect x={-220} y={60} width={440} height={60} rx={12} fill="#A06A3C" stroke={INK} strokeWidth={7} />
        <ellipse cx={-130} cy={20} rx={80} ry={40} fill="#fff" stroke={INK} strokeWidth={6} />
        <g transform="translate(-130 -10) rotate(-15)">
          <ellipse rx={62} ry={66} fill="#E9B48A" stroke={INK} strokeWidth={6} />
          <path d="M -58 -20 Q -50 -76 4 -70 Q 54 -64 58 -16 Q 40 -44 0 -44 Q -36 -44 -58 -20 Z" fill="#5A3A22" stroke={INK} strokeWidth={5} />
          <path d="M -34 4 Q -22 12 -10 4 M 10 4 Q 22 12 34 4" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
          <ellipse cx={0} cy={34} rx={10} ry={8 + 4 * Math.sin(t * 4)} fill="#5a1d14" stroke={INK} strokeWidth={3} />
        </g>
        <path d="M -60 -30 Q 60 -70 210 -20 L 210 80 L -80 80 Z" fill="#7C6FD0" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <Zzz x={-110} y={-120} t={t} size={60} />
      </g>}
      {fr > 0 && <g transform={`translate(860 260) scale(${popIn(t - eF, 0.3)})`}>
        <rect x={-150} y={-56} width={300} height={112} rx={56} fill="#26306A" stroke={INK} strokeWidth={8} />
        <T x={30} y={6} size={64} color="#fff">الفجر</T>
        <Moon x={-92} y={0} r={30} bg="#26306A" />
      </g>}
      {fly > 0 && fly < 1 && <g transform={`translate(${lerp(400, 700, easeInOut(fly))} ${lerp(420, 470, fly) - Math.sin(fly * Math.PI) * 140}) rotate(${-20 + fly * 30}) scale(${1.2 - 0.4 * fly})`}>
        <path d="M -60 -50 L 70 0 L -60 50 L -36 0 Z" fill="#2F9BFF" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      </g>}
    </Scene>
  );
};

// ================================================================== 20 — "الفهمان كسبان": the exact hook board again (loop). t_abs - END runs the
// hook board, so the last frame equals frame 0.
export const makeB20 = (END: number): React.FC<BoardProps> => ({t, b0}) => <B1 t={b0 + t - END} d={3} b0={0} />;
export const BOARDS_16 = [B1, B2, B3, B4, B5, B6, B7, B8, B9, B10, B11, B12, B13, B14, B15, B16, B17, B18, B19];
