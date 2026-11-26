// The 19 boards of الفهمان #15 "ليه الإنجليز بيسوقوا شمال؟". Three generated props (جون on his horse, the 4-horse wagon,
// Napoleon); everything else is drawn here in code (flags, top-down roads, cars, the Cairo taxi, riders, wagons, soldiers,
// sword, forest, boat + island, pyramids, calendar, timeline, puff cloud, comment icon, arrows).
// Board space: x 0..1080, y 0..1200 (the episode shows it 1:1 inside the wall board, VIEW = {z 1, cx 540, cy 600}).
// LEFT/RIGHT RULE: every road is top-down with traffic moving UP the screen. "Driving on the left" = the vehicle is in the
// lane on the LEFT side of the screen; "on the right" = the lane on the RIGHT. Oncoming traffic moves DOWN in the other lane.
// Vehicles mostly stay in place while the road markings scroll down (so nothing is cut off at the board edges).
import React from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';
import {clamp, easeIn, easeInOut, easeOut, lerp, popIn, rand, seg, wobble} from './lib/anim';
import {norm} from './lib/Captions';
import {Scene, Stamp, Txt} from './Boards14';
import WORDS from './videos/ukleft.words.json';
import PROPS from '../../public/elfahman/ukleft/props.json';

export type BoardProps = {t: number; d: number; b0: number};
const W = 1080, H = 1200;
export const YEL = '#FFD23F', RED = '#FF5A4E', GREEN = '#43C463', INK = '#1b1410';

// ------------------------------------------------------------------ word onsets (absolute seconds)
const words = WORDS as {w: string; s: number; e: number; sent: number}[];
const nq = (w: string) => norm(w).replace(/"/g, '');
export const at = (w: string, nth = 0) => {
  const hits = words.map((x, i) => (nq(x.w) === nq(w) ? i : -1)).filter((i) => i >= 0);
  if (hits[nth] === undefined) throw new Error(`word not found: ${w} #${nth}`);
  return words[hits[nth]].s;
};

// ------------------------------------------------------------------ generated props
type PN = 'john' | 'wagon' | 'napoleon';
const SRC = (n: PN) => staticFile(`elfahman/ukleft/${n}.png`);
let handle: number | null = null;
const useProps = () => {
  if (handle === null && typeof window !== 'undefined') {
    handle = delayRender('props');
    Promise.all((['john', 'wagon', 'napoleon'] as PN[]).map((n) => { const im = new Image(); im.src = SRC(n); return im.decode ? im.decode().catch(() => null) : null; }))
      .then(() => continueRender(handle!));
  }
};
// x, y = top-left corner, w = width (height from the picture)
const Pic: React.FC<{n: PN; x: number; y: number; w: number; flip?: boolean; o?: number}> = ({n, x, y, w, flip = false, o = 1}) => {
  useProps();
  const P = (PROPS as Record<PN, {w: number; h: number}>)[n];
  const h = (P.h * w) / P.w;
  return <image href={SRC(n)} x={x} y={y} width={w} height={h} opacity={o} transform={flip ? `translate(${2 * x + w} 0) scale(-1 1)` : undefined} />;
};
const picH = (n: PN, w: number) => ((PROPS as Record<PN, {w: number; h: number}>)[n].h * w) / (PROPS as Record<PN, {w: number; h: number}>)[n].w;

// ------------------------------------------------------------------ flags (flat, in code). x, y = centre, w = width (h = w * 2/3)
export type FlagK = 'uk' | 'eg' | 'fr' | 'us' | 'in' | 'au' | 'de' | 'it' | 'es';
const UKBody: React.FC<{id: string}> = ({id}) => (
  <g clipPath={`url(#${id})`}>
    <rect x={-150} y={-100} width={300} height={200} fill="#012169" />
    <path d="M -150 -100 L 150 100 M 150 -100 L -150 100" stroke="#fff" strokeWidth={40} />
    <path d="M -150 -100 L 150 100 M 150 -100 L -150 100" stroke="#C8102E" strokeWidth={13} />
    <path d="M 0 -100 V 100 M -150 0 H 150" stroke="#fff" strokeWidth={64} />
    <path d="M 0 -100 V 100 M -150 0 H 150" stroke="#C8102E" strokeWidth={38} />
  </g>
);
const star = (cx: number, cy: number, r: number, n = 5) => {
  const p: string[] = [];
  for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; p.push(`${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`); }
  return p.join(' ');
};
export const Flag: React.FC<{k: FlagK; x: number; y: number; w: number; s?: number; t?: number; pole?: boolean; id: string}> = ({k, x, y, w, s = 1, t = 0, pole = false, id}) => {
  if (s <= 0) return null;
  const sc = (w / 300) * s;
  const sway = Math.sin(t * 2.4 + x * 0.01) * 1.5;
  const stripesH = (cols: string[]) => cols.map((c, i) => <rect key={i} x={-150} y={-100 + (i * 200) / cols.length} width={300} height={200 / cols.length + 0.5} fill={c} />);
  const stripesV = (cols: string[]) => cols.map((c, i) => <rect key={i} x={-150 + (i * 300) / cols.length} y={-100} width={300 / cols.length + 0.5} height={200} fill={c} />);
  let body: React.ReactNode;
  if (k === 'uk') body = <UKBody id={id + 'c'} />;
  else if (k === 'eg') body = <>{stripesH(['#CE1126', '#fff', '#111'])}<path d="M -22 -26 Q 0 -44 22 -26 L 18 18 Q 0 30 -18 18 Z" fill="#C09300" stroke="#8a6a00" strokeWidth={3} /><circle cx={0} cy={-36} r={9} fill="#C09300" /></>;
  else if (k === 'fr') body = <>{stripesV(['#0055A4', '#fff', '#EF4135'])}</>;
  else if (k === 'it') body = <>{stripesV(['#009246', '#fff', '#CE2B37'])}</>;
  else if (k === 'de') body = <>{stripesH(['#111', '#DD0000', '#FFCE00'])}</>;
  else if (k === 'es') body = <><rect x={-150} y={-100} width={300} height={200} fill="#AA151B" /><rect x={-150} y={-50} width={300} height={100} fill="#F1BF00" /><rect x={-95} y={-26} width={34} height={46} rx={6} fill="#AA151B" stroke="#7a1010" strokeWidth={3} /></>;
  else if (k === 'in') body = <>{stripesH(['#FF9933', '#fff', '#138808'])}<circle r={26} fill="none" stroke="#000080" strokeWidth={5} />{Array.from({length: 12}, (_, i) => <line key={i} x1={0} y1={0} x2={26 * Math.cos((i * Math.PI) / 6)} y2={26 * Math.sin((i * Math.PI) / 6)} stroke="#000080" strokeWidth={2.5} />)}</>;
  else if (k === 'us') body = <>{stripesH(Array.from({length: 13}, (_, i) => (i % 2 ? '#fff' : '#B22234')))}<rect x={-150} y={-100} width={130} height={108} fill="#3C3B6E" />
    {Array.from({length: 20}, (_, i) => <circle key={i} cx={-136 + (i % 5) * 26 + (Math.floor(i / 5) % 2) * 6} cy={-88 + Math.floor(i / 5) * 25} r={5} fill="#fff" />)}</>;
  else body = <><rect x={-150} y={-100} width={300} height={200} fill="#012169" /><g transform="translate(-75 -50) scale(0.5)"><UKBody id={id + 'a'} /></g>
    <polygon points={star(-75, 52, 24, 7)} fill="#fff" />{[[80, -60], [40, 0], [80, 70], [115, -10], [100, 20]].map(([sx, sy], i) => <polygon key={i} points={star(sx, sy, i === 4 ? 8 : 14, 7)} fill="#fff" />)}</>;
  return (
    <g transform={`translate(${x} ${y}) scale(${sc}) rotate(${sway})`}>
      <defs><clipPath id={id + 'c'}><rect x={-150} y={-100} width={300} height={200} /></clipPath><clipPath id={id + 'a'}><rect x={-150} y={-100} width={300} height={200} /></clipPath><clipPath id={id}><rect x={-150} y={-100} width={300} height={200} rx={10} /></clipPath></defs>
      {pole && <line x1={-154} y1={-110} x2={-154} y2={330} stroke={INK} strokeWidth={14} strokeLinecap="round" />}
      <rect x={-142} y={-88} width={300} height={200} rx={10} fill={INK} opacity={0.3} />
      <g clipPath={`url(#${id})`}>{body}</g>
      <rect x={-150} y={-100} width={300} height={200} rx={10} fill="none" stroke={INK} strokeWidth={8} />
    </g>
  );
};

// ------------------------------------------------------------------ arrows: chunky, dir 'r' (➡ red, يمين) / 'l' (⬅ yellow, شمال)
export const Arrow: React.FC<{x: number; y: number; s: number; dir: 'r' | 'l' | 'u' | 'd'; color?: string; label?: string; len?: number}> = ({x, y, s, dir, color, label, len = 1}) => {
  if (s <= 0) return null;
  const c = color ?? (dir === 'r' ? RED : YEL);
  const rot = {r: 0, l: 180, u: -90, d: 90}[dir];
  const L = 110 * len;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g transform={`rotate(${rot})`}>
        <path d={`M ${-L} -30 L ${L - 40} -30 L ${L - 40} -70 L ${L + 50} 0 L ${L - 40} 70 L ${L - 40} 30 L ${-L} 30 Z`} transform="translate(8 10)" fill={INK} opacity={0.3} />
        <path d={`M ${-L} -30 L ${L - 40} -30 L ${L - 40} -70 L ${L + 50} 0 L ${L - 40} 70 L ${L - 40} 30 L ${-L} 30 Z`} fill={c} stroke={INK} strokeWidth={9} strokeLinejoin="round" />
      </g>
      {label && <text x={0} y={dir === 'u' || dir === 'd' ? 0 : -86} textAnchor="middle" fontFamily="Cairo" fontWeight={900} fontSize={70} fill={c} stroke={INK} strokeWidth={14} paintOrder="stroke" direction="rtl">{label}</text>}
    </g>
  );
};
const stampK = (dt: number) => (dt <= 0 ? 0 : dt < 0.12 ? 1.8 - 0.8 * easeIn(dt / 0.12) : 1 + wobble(dt - 0.12, 3, 10) * 0.06);

// ------------------------------------------------------------------ top-down road (vertical). Markings scroll down = traffic goes up.
const Road: React.FC<{x: number; w: number; t: number; y0?: number; y1?: number; speed?: number; side?: string}> = ({x, w, t, y0 = 0, y1 = H, speed = 260, side = '#D9C7A3'}) => {
  const off = (t * speed) % 120;
  return (
    <g>
      <rect x={x - w / 2 - 46} y={y0} width={w + 92} height={y1 - y0} fill={side} />
      {Array.from({length: Math.ceil((y1 - y0) / 60) + 3}, (_, i) => <line key={i} x1={x - w / 2 - 46} x2={x - w / 2} y1={y0 + i * 60 - (off % 60)} y2={y0 + i * 60 - (off % 60)} stroke="#c2ae88" strokeWidth={3} />)}
      {Array.from({length: Math.ceil((y1 - y0) / 60) + 3}, (_, i) => <line key={'b' + i} x1={x + w / 2} x2={x + w / 2 + 46} y1={y0 + i * 60 - (off % 60)} y2={y0 + i * 60 - (off % 60)} stroke="#c2ae88" strokeWidth={3} />)}
      <rect x={x - w / 2} y={y0} width={w} height={y1 - y0} fill="#45484f" />
      <line x1={x - w / 2 + 10} x2={x - w / 2 + 10} y1={y0} y2={y1} stroke="#fff" strokeWidth={7} />
      <line x1={x + w / 2 - 10} x2={x + w / 2 - 10} y1={y0} y2={y1} stroke="#fff" strokeWidth={7} />
      <rect x={x - w / 2 - 6} y={y0} width={6} height={y1 - y0} fill={INK} /><rect x={x + w / 2} y={y0} width={6} height={y1 - y0} fill={INK} />
      {Array.from({length: Math.ceil((y1 - y0) / 120) + 2}, (_, i) => {
        const yy = y0 - 120 + i * 120 + off;
        return yy > y1 || yy + 60 < y0 ? null : <rect key={'d' + i} x={x - 6} y={Math.max(y0, yy)} width={12} height={Math.min(y1, yy + 64) - Math.max(y0, yy)} fill="#F2F2F2" />;
      })}
    </g>
  );
};

// ------------------------------------------------------------------ top-down car (front = up). rot 180 = driving down.
export const CarTop: React.FC<{x: number; y: number; s?: number; rot?: number; color?: string; taxi?: boolean; t?: number; face?: string}> = ({x, y, s = 1, rot = 0, color = '#E8403A', taxi = false, t = 0}) => {
  const b = Math.sin(t * 18) * 1.2;
  const body = taxi ? '#1d1d1f' : color;
  return (
    <g transform={`translate(${x} ${y + b}) rotate(${rot}) scale(${s})`}>
      <rect x={-52} y={-92} width={104} height={196} rx={30} fill={INK} opacity={0.3} transform="translate(8 10)" />
      {[[-56, -58], [46, -58], [-56, 42], [46, 42]].map(([wx, wy], i) => <rect key={i} x={wx} y={wy} width={12} height={34} rx={5} fill={INK} />)}
      <rect x={-50} y={-96} width={100} height={192} rx={30} fill={body} stroke={INK} strokeWidth={7} />
      {taxi && <><rect x={-50} y={-30} width={100} height={64} fill="#fff" /><rect x={-50} y={-96} width={100} height={192} rx={30} fill="none" stroke={INK} strokeWidth={7} /></>}
      <path d="M -38 -50 Q 0 -66 38 -50 L 32 -22 Q 0 -30 -32 -22 Z" fill="#9FD8F5" stroke={INK} strokeWidth={5} />
      <rect x={-32} y={-18} width={64} height={70} rx={12} fill={taxi ? '#fff' : body} stroke={INK} strokeWidth={5} />
      {taxi && <rect x={-20} y={2} width={40} height={20} rx={5} fill={YEL} stroke={INK} strokeWidth={4} />}
      <path d="M -32 58 Q 0 66 32 58 L 30 76 Q 0 82 -30 76 Z" fill="#9FD8F5" stroke={INK} strokeWidth={5} />
      <circle cx={-30} cy={-86} r={8} fill="#FFF4B0" stroke={INK} strokeWidth={4} /><circle cx={30} cy={-86} r={8} fill="#FFF4B0" stroke={INK} strokeWidth={4} />
      <rect x={-38} y={88} width={16} height={7} rx={3} fill="#C0262A" /><rect x={22} y={88} width={16} height={7} rx={3} fill="#C0262A" />
    </g>
  );
};

// ------------------------------------------------------------------ top-down rider on a horse (front = up). knight = جون
// (silver helmet, white tunic, red cross). sword: drawn in his RIGHT hand = the screen-right side when facing up.
export const RiderTop: React.FC<{x: number; y: number; s?: number; rot?: number; knight?: boolean; sword?: number; t?: number}> = ({x, y, s = 1, rot = 0, knight = false, sword = 0, t = 0}) => {
  const step = Math.sin(t * 10);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <ellipse cx={8} cy={12} rx={46} ry={100} fill={INK} opacity={0.25} />
      {[[-30, -50, step], [30, -50, -step], [-30, 60, -step], [30, 60, step]].map(([lx, ly, k], i) => <ellipse key={i} cx={lx} cy={ly + k * 10} rx={11} ry={16} fill="#5a3418" stroke={INK} strokeWidth={4} />)}
      <path d={`M 0 90 Q ${-14 + step * 8} 130 ${step * 12} 150`} stroke="#3a2210" strokeWidth={14} fill="none" strokeLinecap="round" />
      <ellipse cx={0} cy={10} rx={40} ry={88} fill="#9A5A2C" stroke={INK} strokeWidth={6} />
      <path d="M 0 -76 Q -16 -110 0 -142 Q 16 -110 0 -76" fill="#3a2210" />
      <ellipse cx={0} cy={-118} rx={20} ry={36} fill="#9A5A2C" stroke={INK} strokeWidth={6} />
      <path d="M -10 -146 L -14 -160 L -4 -150 M 10 -146 L 14 -160 L 4 -150" stroke={INK} strokeWidth={4} fill="#9A5A2C" />
      {sword > 0 && (
        <g transform={`translate(44 4) rotate(${-30 + 30 * (1 - sword)}) scale(${sword})`}>
          <rect x={-5} y={-96} width={14} height={90} rx={4} fill="#DCE4EA" stroke={INK} strokeWidth={4} />
          <rect x={-18} y={-8} width={40} height={10} rx={4} fill="#E7B53A" stroke={INK} strokeWidth={3} />
          <rect x={-3} y={0} width={10} height={20} rx={3} fill="#6b4422" stroke={INK} strokeWidth={3} />
        </g>
      )}
      {/* rider: shoulders + head seen from above */}
      <ellipse cx={0} cy={10} rx={46} ry={28} fill={knight ? '#F7F3E8' : '#4b3b5c'} stroke={INK} strokeWidth={6} />
      {knight && <path d="M 0 -14 V 34 M -40 10 H 40" stroke="#D3202A" strokeWidth={11} />}
      {knight && <><ellipse cx={44} cy={14} rx={12} ry={11} fill="#F0C9A0" stroke={INK} strokeWidth={4} /><ellipse cx={-44} cy={14} rx={12} ry={11} fill="#F0C9A0" stroke={INK} strokeWidth={4} /></>}
      <circle cx={0} cy={4} r={22} fill={knight ? '#C9D2D9' : '#2c2236'} stroke={INK} strokeWidth={6} />
      {knight ? <path d="M -12 -6 Q 0 -14 12 -6" stroke="#fff" strokeWidth={5} fill="none" opacity={0.8} /> : <path d="M -14 -10 Q 0 -22 14 -10" stroke="#fff" strokeWidth={3} fill="none" opacity={0.3} />}
    </g>
  );
};

// ------------------------------------------------------------------ top-down wagon pulled by 4 horses (front = up).
// The driver (black beret, blue shirt) rides the REAR-LEFT horse = screen-left of the rear pair when facing up. look 0..1 = leans out.
const HorseTop: React.FC<{x: number; y: number; t: number; ph: number}> = ({x, y, t, ph}) => {
  const st = Math.sin(t * 11 + ph);
  return (
    <g transform={`translate(${x} ${y})`}>
      {[[-20, -34, st], [20, -34, -st], [-20, 40, -st], [20, 40, st]].map(([lx, ly, k], i) => <ellipse key={i} cx={lx} cy={ly + k * 8} rx={8} ry={12} fill="#5a3418" stroke={INK} strokeWidth={3} />)}
      <ellipse cx={0} cy={6} rx={28} ry={62} fill="#9A5A2C" stroke={INK} strokeWidth={5} />
      <ellipse cx={0} cy={-76} rx={14} ry={26} fill="#9A5A2C" stroke={INK} strokeWidth={5} />
      <path d="M 0 -50 L 0 50" stroke="#3a2210" strokeWidth={8} strokeLinecap="round" />
      <path d="M -28 -10 H 28" stroke="#4a3020" strokeWidth={6} />
    </g>
  );
};
export const WagonTop: React.FC<{x: number; y: number; s?: number; rot?: number; t: number; look?: number; whip?: number}> = ({x, y, s = 1, rot = 0, t, look = 0, whip = 0}) => {
  const b = Math.sin(t * 9) * 1.5;
  return (
    <g transform={`translate(${x} ${y + b}) rotate(${rot}) scale(${s})`}>
      {/* wagon body: centre (0, 150), 170 x 290 */}
      <rect x={-77} y={18} width={170} height={290} rx={18} fill={INK} opacity={0.25} transform="translate(0 0)" />
      {[[-104, 40], [82, 40], [-104, 230], [82, 230]].map(([wx, wy], i) => <rect key={i} x={wx} y={wy} width={22} height={64} rx={6} fill="#6b4422" stroke={INK} strokeWidth={5} />)}
      <rect x={-85} y={6} width={170} height={290} rx={18} fill="#F2E4C4" stroke={INK} strokeWidth={7} />
      {[50, 100, 150, 200, 250].map((yy) => <path key={yy} d={`M -85 ${yy} Q 0 ${yy - 10} 85 ${yy}`} stroke="#C9B48A" strokeWidth={6} fill="none" />)}
      <path d="M 0 6 V -40" stroke="#6b4422" strokeWidth={12} />
      {/* 4 horses: rear pair y -110, front pair y -260; left = x -46 */}
      <HorseTop x={-46} y={-260} t={t} ph={0} /><HorseTop x={46} y={-260} t={t} ph={1.4} />
      <HorseTop x={-46} y={-110} t={t} ph={2.2} /><HorseTop x={46} y={-110} t={t} ph={0.7} />
      {/* driver on the rear-LEFT horse */}
      <g transform={`translate(${-46 - 16 * look} -96)`}>
        <ellipse cx={0} cy={4} rx={30} ry={20} fill="#2F6FC0" stroke={INK} strokeWidth={5} />
        <circle cx={-2 * look} cy={0} r={16} fill="#F0C9A0" stroke={INK} strokeWidth={4} />
        <ellipse cx={-2 * look} cy={-2} rx={18} ry={16} fill="#1d1d1f" stroke={INK} strokeWidth={3} />
        <circle cx={-2 * look} cy={-2} r={3} fill="#555" />
        <path d={`M 26 6 Q ${70 + whip * 30} ${-30 - whip * 40} ${50 + whip * 80} ${-90}`} stroke="#5a3418" strokeWidth={4} fill="none" strokeLinecap="round" />
      </g>
    </g>
  );
};

// ------------------------------------------------------------------ small things
const Check: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (s <= 0 ? null : (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle r={78} fill={GREEN} stroke={INK} strokeWidth={9} />
    <path d="M -38 2 L -10 32 L 42 -30" stroke="#fff" strokeWidth={20} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </g>
));
const QMark: React.FC<{x: number; y: number; s: number; size?: number}> = ({x, y, s, size = 300}) => (s <= 0 ? null : (
  <text x={x} y={y + size * 0.35} textAnchor="middle" fontFamily="Cairo" fontWeight={900} fontSize={size * s} fill={YEL} stroke={INK} strokeWidth={size * s * 0.06} paintOrder="stroke">؟</text>
));
const Pyramids: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[[-250, 0, 230], [60, 0, 300], [300, 0, 170]].map(([px, py, r], i) => (
      <g key={i}>
        <path d={`M ${px - r} ${py} L ${px} ${py - r * 0.95} L ${px + r} ${py} Z`} fill="#E9B866" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
        <path d={`M ${px} ${py - r * 0.95} L ${px + r} ${py} L ${px + r * 0.2} ${py} Z`} fill="#C98F3E" />
        <path d={`M ${px - r} ${py} L ${px} ${py - r * 0.95} L ${px + r} ${py} Z`} fill="none" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      </g>
    ))}
  </g>
);
const Sparkle4: React.FC<{x: number; y: number; r: number; o?: number}> = ({x, y, r, o = 1}) => (r <= 0 ? null : (
  <path transform={`translate(${x} ${y})`} opacity={o} d={`M0 ${-r} Q ${r * 0.15} ${-r * 0.15} ${r} 0 Q ${r * 0.15} ${r * 0.15} 0 ${r} Q ${-r * 0.15} ${r * 0.15} ${-r} 0 Q ${-r * 0.15} ${-r * 0.15} 0 ${-r} Z`} fill="#fffbe0" stroke={INK} strokeWidth={4} />
));
const Calendar: React.FC<{x: number; y: number; s: number; year: number; flip: number}> = ({x, y, s, year, flip}) => (s <= 0 ? null : (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-150} y={-120} width={300} height={260} rx={22} fill={INK} opacity={0.3} transform="translate(10 12)" />
    <rect x={-150} y={-120} width={300} height={260} rx={22} fill="#fff" stroke={INK} strokeWidth={9} />
    <rect x={-150} y={-120} width={300} height={74} rx={22} fill={RED} stroke={INK} strokeWidth={9} />
    {[-80, 80].map((rx) => <rect key={rx} x={rx - 10} y={-146} width={20} height={50} rx={10} fill="#ddd" stroke={INK} strokeWidth={6} />)}
    <text x={0} y={92} textAnchor="middle" fontFamily="Cairo" fontWeight={900} fontSize={110} fill={INK}>{year}</text>
    {flip > 0 && <path d={`M -150 ${-46} L 150 -46 L ${150 - flip * 20} ${-46 + 180 * (1 - flip)} L ${-150 + flip * 20} ${-46 + 180 * (1 - flip)} Z`} fill="#f4f4f4" stroke={INK} strokeWidth={5} opacity={0.9} />}
  </g>
));
const Puff: React.FC<{x: number; y: number; dt: number}> = ({x, y, dt}) => {
  if (dt <= 0) return null;
  const k = popIn(dt, 0.25) * (1 - seg(dt, 2.6, 3.2));
  if (k <= 0) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      {[[-90, 0, 70], [90, 0, 70], [0, -60, 80], [0, 50, 75], [-60, -60, 55], [60, -60, 55], [-60, 60, 55], [60, 60, 55]].map(([cx, cy, r], i) => (
        <circle key={i} cx={cx * (1 + 0.1 * Math.sin(dt * 5 + i))} cy={cy} r={r} fill="#fff" stroke={INK} strokeWidth={7} />
      ))}
      {[[-60, -60, 55], [60, -60, 55], [0, 0, 90]].map(([cx, cy, r], i) => <circle key={'i' + i} cx={cx} cy={cy} r={r - 7} fill="#fff" />)}
      <text x={0} y={30} textAnchor="middle" fontFamily="Cairo" fontWeight={900} fontSize={92} fill={RED} stroke={INK} strokeWidth={12} paintOrder="stroke" direction="rtl">بوم!</text>
    </g>
  );
};
const Bubble: React.FC<{x: number; y: number; s: number; text: string; flip?: boolean}> = ({x, y, s, text, flip = false}) => (s <= 0 ? null : (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
    <path d="M -110 -60 Q -110 -96 -74 -96 L 74 -96 Q 110 -96 110 -60 L 110 10 Q 110 46 74 46 L -10 46 L -50 84 L -44 46 L -74 46 Q -110 46 -110 10 Z" fill="#fff" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
    <text x={0} y={-6} transform={flip ? 'scale(-1 1)' : undefined} textAnchor="middle" fontFamily="Cairo" fontWeight={900} fontSize={64} fill={RED} direction="rtl">{text}</text>
  </g>
));
const Buildings: React.FC<{x0: number; x1: number}> = ({x0, x1}) => (
  <g>
    {Array.from({length: 7}, (_, i) => {
      const y = i * 180 - 20, h = 140 + rand(i + x0) * 30;
      return (
        <g key={i}>
          <rect x={x0} y={y} width={x1 - x0} height={h} rx={10} fill={['#E9D3A8', '#D9B88A', '#F0DEB8', '#CFAE84'][i % 4]} stroke={INK} strokeWidth={6} />
          <rect x={x0 + 20} y={y + 20} width={(x1 - x0) * 0.35} height={40} fill="#B9A07A" />
          <circle cx={x0 + (x1 - x0) * 0.72} cy={y + h * 0.6} r={14} fill="#9FD8F5" stroke={INK} strokeWidth={4} />
        </g>
      );
    })}
  </g>
);

// ================================================================== 1 — hook: UK (left lane) vs Egypt (right lane), "؟" pulses
// Pure function of t (also for t < 0, used by the loop board): cars stay put and the road markings scroll, so the last frame
// of the video is this board at t = -1/60, and frame 0 is t = 0.
export const B1: React.FC<BoardProps> = ({t}) => {
  const q = 1 + 0.08 * Math.sin(t * 5);
  return (
    <Scene bg="linear-gradient(180deg,#8FD0FF 0%,#CDEBFF 40%,#9ED27A 41%,#7DBE5C 100%)">
      <Road x={270} w={330} t={t} y0={330} y1={H} />
      <Road x={810} w={330} t={t} y0={330} y1={H} />
      <rect x={535} y={300} width={10} height={900} fill={INK} opacity={0.25} />
      <Flag k="uk" x={270} y={170} w={330} t={t} id="h1uk" />
      <Flag k="eg" x={810} y={170} w={330} t={t} id="h1eg" />
      {/* UK: red car in the LEFT lane, going up */}
      <CarTop x={270 - 82} y={780 + 8 * Math.sin(t * 2)} s={1.15} color="#E8403A" t={t} />
      {/* Egypt: Cairo taxi in the RIGHT lane, going up */}
      <CarTop x={810 + 82} y={780 + 8 * Math.sin(t * 2 + 1)} s={1.15} taxi t={t} />
      <Arrow x={270 - 82} y={1080} s={0.62} dir="u" color={YEL} />
      <Arrow x={810 + 82} y={1080} s={0.62} dir="u" color={RED} />
      <QMark x={540} y={640} s={q} size={260} />
    </Scene>
  );
};

// ================================================================== 2 — "السبب… سيف!": the sword slides across with a glint
const Sword: React.FC<{x: number; y: number; s: number; rot?: number; glint?: number}> = ({x, y, s, rot = 0, glint = -1}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <defs>
      <linearGradient id="blade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.45" stopColor="#D5DEE6" /><stop offset="1" stopColor="#8D9AA6" /></linearGradient>
    </defs>
    <path d="M -150 -34 L 440 -34 L 520 0 L 440 34 L -150 34 Z" fill="url(#blade)" stroke={INK} strokeWidth={10} strokeLinejoin="round" />
    <path d="M -130 0 L 440 0" stroke="#9AA7B2" strokeWidth={8} />
    <rect x={-190} y={-110} width={44} height={220} rx={16} fill="#E7B53A" stroke={INK} strokeWidth={9} />
    <rect x={-330} y={-26} width={144} height={52} rx={14} fill="#7A4A26" stroke={INK} strokeWidth={9} />
    {[-300, -270, -240, -210].map((gx) => <line key={gx} x1={gx} y1={-26} x2={gx + 18} y2={26} stroke="#4a2a12" strokeWidth={6} />)}
    <circle cx={-350} cy={0} r={36} fill="#E7B53A" stroke={INK} strokeWidth={9} />
    <circle cx={-168} cy={0} r={14} fill={RED} stroke={INK} strokeWidth={5} />
    {glint >= 0 && glint <= 1 && <Sparkle4 x={-120 + glint * 600} y={-14} r={70 * Math.sin(glint * Math.PI)} />}
  </g>
);
export const B2: React.FC<BoardProps> = ({t, b0}) => {
  const e = at('سيف') - b0;
  const slide = easeOut(seg(t, e - 0.12, e + 0.3));
  const x = lerp(1600, 560, slide);
  const glint = seg(t, e + 0.3, e + 0.8);
  const q = 1 - seg(t, e - 0.2, e);
  return (
    <Scene bg="radial-gradient(ellipse at 50% 45%,#5A2A6E 0%,#2E1640 70%,#1A0C26 100%)">
      <g opacity={0.25}>{Array.from({length: 18}, (_, i) => <path key={i} d="M 0 0 L -50 -900 L 50 -900 Z" fill="#FFE98A" transform={`translate(540 600) rotate(${i * 20 + t * 8})`} />)}</g>
      <QMark x={540} y={560} s={q * (1 + 0.06 * Math.sin(t * 6))} size={300} />
      {slide > 0 && <Sword x={x} y={600} s={1.25} rot={-8} glint={glint} />}
      {glint > 0 && glint < 1 && <Sparkle4 x={900} y={430} r={60 * Math.sin(glint * Math.PI)} />}
    </Scene>
  );
};

// ================================================================== 3 — جون rides through a dark forest at dusk; thief eyes blink on "حرامية"
const Tree: React.FC<{x: number; y: number; s: number; c: string}> = ({x, y, s, c}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-14} y={-60} width={28} height={70} fill="#3a2614" />
    <path d="M 0 -330 L 110 -150 L 60 -150 L 140 -40 L -140 -40 L -60 -150 L -110 -150 Z" fill={c} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
  </g>
);
const Eyes: React.FC<{x: number; y: number; dt: number; ph: number}> = ({x, y, dt, ph}) => {
  if (dt < 0) return null;
  const open = popIn(dt, 0.2);
  const bl = (dt + ph) % 2.2 > 2.05 ? 0.1 : 1;
  return (
    <g transform={`translate(${x} ${y}) scale(1 ${open * bl})`}>
      {[-26, 26].map((ex) => <g key={ex}><ellipse cx={ex} cy={0} rx={20} ry={13} fill="#FFE34D" opacity={0.35} transform="scale(1.6)" /><ellipse cx={ex} cy={0} rx={17} ry={11} fill="#FFE34D" stroke={INK} strokeWidth={4} /><circle cx={ex + 4} cy={1} r={5} fill={INK} /></g>)}
    </g>
  );
};
const Forest: React.FC<{t: number; speed?: number}> = ({t, speed = 60}) => (
  <>
    {Array.from({length: 7}, (_, i) => { const xx = ((i * 190 - t * speed * 0.5) % 1330 + 1330) % 1330 - 120; return <Tree key={'f' + i} x={xx} y={600} s={1.1} c="#2E4A3A" />; })}
    {Array.from({length: 6}, (_, i) => { const xx = ((i * 230 + 90 - t * speed) % 1380 + 1380) % 1380 - 150; return <Tree key={'n' + i} x={xx} y={700} s={1.45} c="#1F3A2A" />; })}
  </>
);
export const B3: React.FC<BoardProps> = ({t, b0}) => {
  const e = at('حرامية') - b0;
  const bob = Math.abs(Math.sin(t * 7)) * -10;
  return (
    <Scene bg="linear-gradient(180deg,#3E3A78 0%,#B5607A 45%,#E9906A 62%,#3C5A3E 63%,#2C4630 100%)">
      <circle cx={830} cy={330} r={70} fill="#FFD9A0" opacity={0.85} />
      <Forest t={t} />
      <rect x={0} y={880} width={W} height={160} fill="#8A6A4A" stroke={INK} strokeWidth={6} />
      {Array.from({length: 9}, (_, i) => <ellipse key={i} cx={((i * 160 - t * 120) % 1440 + 1440) % 1440 - 180} cy={960} rx={30} ry={6} fill="#6E5236" />)}
      <g transform={`translate(0 ${bob})`}><Pic n="john" x={250} y={890 - picH('john', 600) + 30} w={600} /></g>
      {/* bushes in front with the thieves' eyes */}
      {[[90, 1060, 170], [400, 1110, 150], [720, 1080, 180], [1010, 1060, 160]].map(([bx, by, r], i) => (
        <g key={i}><ellipse cx={bx} cy={by} rx={r} ry={r * 0.6} fill="#1E3424" stroke={INK} strokeWidth={6} /><ellipse cx={bx - r * 0.4} cy={by - r * 0.3} rx={r * 0.55} ry={r * 0.45} fill="#24402C" stroke={INK} strokeWidth={6} /></g>
      ))}
      <Eyes x={110} y={1030} dt={t - e} ph={0} />
      <Eyes x={740} y={1050} dt={t - e - 0.25} ph={0.9} />
    </Scene>
  );
};

// ================================================================== 4 — close-up: his RIGHT hand grips the hilt; highlight on "اليمين"
export const B4: React.FC<BoardProps> = ({t, b0}) => {
  const e = at('اليمين') - b0;
  const k = 1.7, ox = -191, oy = -20 + 6 * Math.sin(t * 3);
  const hx = 430 * k + ox, hy = 335 * k + oy;
  const ring = popIn(t - e, 0.3);
  return (
    <Scene bg="linear-gradient(180deg,#B5607A 0%,#E9906A 60%,#3C5A3E 100%)">
      <Pic n="john" x={ox} y={oy} w={1000 * k} />
      {ring > 0 && <g transform={`translate(${hx} ${hy}) scale(${ring})`}>
        <circle r={150 + 8 * Math.sin(t * 7)} fill="none" stroke={INK} strokeWidth={22} />
        <circle r={150 + 8 * Math.sin(t * 7)} fill="none" stroke={YEL} strokeWidth={13} />
      </g>}
      {ring > 0 && <Arrow x={hx + 300} y={hy + 180} s={0.7 * ring} dir="l" color={YEL} len={0.8} />}
    </Scene>
  );
};

// ================================================================== 5 — top-down: جون UP in the LEFT lane, a stranger comes DOWN the right lane
export const B5: React.FC<BoardProps> = ({t, b0, d}) => {
  const eS = at('الشمال') - b0, eJ = at('جاي') - b0, eSw = at('السيف', 1) - b0;
  const jy = lerp(900, 640, easeInOut(seg(t, 0, eSw)));
  const sy = lerp(-160, 660, easeOut(seg(t, eJ - 0.6, eSw)));
  const sw = easeOut(seg(t, eJ, eJ + 0.4));
  const arr = seg(t, eSw - 0.25, eSw + 0.15);
  const glow = seg(t, eS - 0.1, eS + 0.2) * (1 - seg(t, eJ, eJ + 0.5));
  return (
    <Scene bg="linear-gradient(180deg,#7DBE5C 0%,#6AAE4E 100%)">
      <Road x={540} w={520} t={t} speed={40} />
      {glow > 0 && <rect x={290} y={0} width={250} height={H} fill={YEL} opacity={0.3 * glow} />}
      {glow > 0 && <Arrow x={415} y={240} s={0.75 * glow} dir="l" />}
      <RiderTop x={410} y={jy} s={1.35} knight sword={sw} t={t} />
      <RiderTop x={670} y={sy} s={1.35} rot={180} t={t + 0.5} />
      {arr > 0 && <path d={`M ${480} ${jy - 60} Q ${560} ${(jy + sy) / 2 - 140} ${lerp(480, 640, arr)} ${lerp(jy - 60, sy - 20, arr)}`} stroke={YEL} strokeWidth={12} strokeDasharray="26 18" fill="none" strokeLinecap="round" />}
      <Check x={870} y={300} s={popIn(t - eSw, 0.3)} />
      {d < 0 && null}
    </Scene>
  );
};
// ================================================================== 6 — "منطقي جدًا.": board 5 held, the check grows
export const B6: React.FC<BoardProps> = ({t, b0}) => {
  const b5 = at('فكان');
  return (
    <>
      <B5 t={b0 - b5 + 0.05 + 0 * t} d={9} b0={b5} />
      <svg width={W} height={1920} style={{position: 'absolute', inset: 0}}>
        <Check x={870} y={300} s={1 + 0.25 * popIn(t, 0.3) + 0.04 * Math.sin(t * 6)} />
        {[0, 1, 2].map((i) => <Sparkle4 key={i} x={870 + [-110, 120, 90][i]} y={300 + [-90, -60, 110][i]} r={36 * Math.max(0, Math.sin((t * 1.5 + i * 0.3) * Math.PI))} />)}
      </svg>
    </>
  );
};

// ================================================================== 7 — the big wagon (4 horses) rolls in; France + USA flags pop
export const B7: React.FC<BoardProps> = ({t, b0}) => {
  const eF = at('فرنسا') - b0, eU = at('وأمريكا') - b0, eA = at('عربيات') - b0;
  const x = lerp(-1200, -20, easeOut(seg(t, eA - 0.6, eA + 0.6))) + t * 6;
  const bob = Math.abs(Math.sin(t * 8)) * -6;
  return (
    <Scene bg="linear-gradient(180deg,#8FD0FF 0%,#D7EEFF 52%,#9ED27A 53%,#7DBE5C 100%)">
      <path d="M 0 640 Q 250 520 520 620 T 1080 600 L 1080 700 L 0 700 Z" fill="#8CC56A" stroke={INK} strokeWidth={5} />
      <rect x={0} y={880} width={W} height={150} fill="#C9A878" stroke={INK} strokeWidth={6} />
      <g transform={`translate(0 ${bob})`}><Pic n="wagon" x={x} y={960 - picH('wagon', 1100)} w={1100} /></g>
      <Flag k="fr" x={170} y={190} w={240} s={popIn(t - eF, 0.3)} t={t} id="b7fr" />
      <Flag k="us" x={910} y={190} w={240} s={popIn(t - eU, 0.3)} t={t} id="b7us" />
    </Scene>
  );
};

// ================================================================== 8 — zoom on the driver on the rear-LEFT horse; whip crack on "الكرباج"
export const B8: React.FC<BoardProps> = ({t, b0}) => {
  const eL = at('الشمال', 1) - b0, eR = at('اليمين', 1) - b0, eK = at('الكرباج') - b0;
  const k = 1.5, ox = -560, oy = 300;
  const crack = t - eK;
  const sh = crack > 0 ? wobble(crack, 6, 8) * 10 : 0;
  const bob = Math.abs(Math.sin(t * 8)) * -6;
  const horse = popIn(t - eL, 0.3), hand = popIn(t - eR, 0.3);
  return (
    <Scene bg="linear-gradient(180deg,#8FD0FF 0%,#D7EEFF 60%,#9ED27A 61%,#7DBE5C 100%)">
      <rect x={0} y={1060} width={W} height={140} fill="#C9A878" />
      <g transform={`translate(${sh} ${bob})`}><Pic n="wagon" x={ox} y={oy} w={1400 * k} /></g>
      {horse > 0 && <g transform={`translate(${720 * k + ox} ${430 * k + oy}) scale(${horse})`}>
        <ellipse rx={190} ry={150} fill="none" stroke={INK} strokeWidth={20} /><ellipse rx={190} ry={150} fill="none" stroke={YEL} strokeWidth={11} />
      </g>}
      {horse > 0 && <Arrow x={130} y={1120} s={0.6 * horse} dir="l" label="الشمال" />}
      {hand > 0 && <g transform={`translate(${655 * k + ox} ${125 * k + oy}) scale(${hand})`}>
        <circle r={80} fill="none" stroke={INK} strokeWidth={18} /><circle r={80} fill="none" stroke={RED} strokeWidth={10} />
      </g>}
      {crack > 0 && crack < 0.7 && <g transform={`translate(${1020 * k + ox - 40} ${70 * k + oy}) scale(${popIn(crack, 0.12) * (1 - seg(crack, 0.4, 0.7))})`}>
        {Array.from({length: 10}, (_, i) => <path key={i} d="M 0 -40 L 0 -120" stroke={i % 2 ? YEL : '#fff'} strokeWidth={12} strokeLinecap="round" transform={`rotate(${i * 36})`} />)}
        <text x={0} y={30} textAnchor="middle" fontFamily="Cairo" fontWeight={900} fontSize={80} fill="#fff" stroke={INK} strokeWidth={12} paintOrder="stroke">!</text>
      </g>}
    </Scene>
  );
};

// ================================================================== 9 — top-down: two wagons pass, each keeps to ITS right (up = right lane,
// down = left lane); the driver (rear-left horse, next to the centre line) leans to watch the other wagon's wheels; ➡ "يمين"
export const B9: React.FC<BoardProps> = ({t, b0}) => {
  const eW = at('عجل') - b0, eR = at('اليمين', 2) - b0;
  const uy = lerp(820, 700, easeInOut(seg(t, 0, eR)));
  const dy = lerp(-120, 520, easeOut(seg(t, 0, eR)));
  const look = easeOut(seg(t, eW - 0.4, eW));
  const sight = seg(t, eW - 0.1, eW + 0.4);
  const arr = popIn(t - eR, 0.3);
  // driver head (up wagon): rear-left horse x -46, y -96 relative, leaning left
  const hx = 690 - 46 - 16 * look, hy = uy - 96;
  return (
    <Scene bg="linear-gradient(180deg,#9ED27A 0%,#7DBE5C 100%)">
      <Road x={540} w={600} t={t} speed={30} side="#CDB88E" />
      <WagonTop x={690} y={uy} s={1.02} t={t} look={look} />
      <WagonTop x={390} y={dy} s={1.02} rot={180} t={t + 0.6} />
      {sight > 0 && <path d={`M ${hx} ${hy} L ${lerp(hx, 300, sight)} ${lerp(hy, dy - 60, sight)}`} stroke={YEL} strokeWidth={10} strokeDasharray="20 14" strokeLinecap="round" />}
      {sight > 0 && <g transform={`translate(300 ${dy - 60}) scale(${popIn(t - eW - 0.3, 0.25)})`}><circle r={60} fill="none" stroke={INK} strokeWidth={16} /><circle r={60} fill="none" stroke={YEL} strokeWidth={9} /></g>}
      <Arrow x={850} y={330} s={0.85 * arr} dir="r" label="يمين" />
    </Scene>
  );
};

// ================================================================== 10 — "وبعدين ييجي نابليون.": Napoleon pops on with a drum roll
export const B10: React.FC<BoardProps> = ({t, b0}) => {
  const e = at('نابليون') - b0;
  const s = popIn(t - e + 0.05, 0.35);
  const puff = 1 + 0.02 * Math.sin(t * 3);
  return (
    <Scene bg="radial-gradient(ellipse at 50% 40%,#3B6BD0 0%,#1E3E8A 60%,#13275A 100%)">
      <g opacity={0.3}>{Array.from({length: 16}, (_, i) => <path key={i} d="M 0 0 L -60 -1000 L 60 -1000 Z" fill="#FFE98A" transform={`translate(540 640) rotate(${i * 22.5 + t * 10})`} />)}</g>
      <rect x={0} y={0} width={120} height={H} fill="#0055A4" opacity={0.6} /><rect x={960} y={0} width={120} height={H} fill="#EF4135" opacity={0.6} />
      <ellipse cx={540} cy={1140} rx={300} ry={40} fill={INK} opacity={0.35 * s} />
      {s > 0 && <g transform={`translate(540 1150) scale(${s * puff} ${s / puff}) translate(-540 -1150)`}><Pic n="napoleon" x={540 - 230} y={1150 - picH('napoleon', 460)} w={460} /></g>}
    </Scene>
  );
};

// ================================================================== 11 — Napoleon points RIGHT, soldiers march up the RIGHT lane, then four flags get ➡
export const B11: React.FC<BoardProps> = ({t, b0}) => {
  const e1 = at('يمين') - b0, eJ = at('جيوشه') - b0, eB = at('والبلاد') - b0, e2 = at('يمين', 1) - b0;
  const flags: FlagK[] = ['fr', 'de', 'it', 'es'];
  const fT = flags.map((_, i) => lerp(eB, e2 - 0.45, i / 3));
  const aT = flags.map((_, i) => lerp(eB + 0.3, e2, i / 3));
  const march = (t * 70) % 110;
  const sol = easeOut(seg(t, eJ - 0.4, eJ + 0.2));
  return (
    <Scene bg="linear-gradient(180deg,#9ED27A 0%,#7DBE5C 100%)">
      <Road x={720} w={380} t={t} y0={0} y1={560} speed={20} />
      {sol > 0 && Array.from({length: 10}, (_, i) => {
        const y = 760 - i * 110 + march - (1 - sol) * 400;
        if (y < 30 || y > 530) return null;
        const step = Math.sin(t * 12 + i) * 4;
        return (
          <g key={i} transform={`translate(${815} ${y})`} opacity={sol}>
            <ellipse cx={0} cy={6} rx={30} ry={22} fill="#1E3E8A" stroke={INK} strokeWidth={5} />
            <path d="M -18 0 L 18 14 M 18 0 L -18 14" stroke="#fff" strokeWidth={4} />
            <ellipse cx={0} cy={-6 + step * 0.3} rx={30} ry={12} fill="#1d1d1f" stroke={INK} strokeWidth={4} />
            <line x1={24} y1={-20} x2={24} y2={30} stroke="#5a3418" strokeWidth={5} />
          </g>
        );
      })}
      <rect x={0} y={0} width={500} height={570} fill="url(#b11sky)" />
      <defs><linearGradient id="b11sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3B6BD0" /><stop offset="1" stopColor="#1E3E8A" /></linearGradient></defs>
      <rect x={496} y={0} width={8} height={570} fill={INK} />
      <Pic n="napoleon" x={50} y={550 - picH('napoleon', 220)} w={220} />
      <Arrow x={360} y={280} s={0.8 * popIn(t - e1, 0.3)} dir="r" len={0.8} />
      <rect x={0} y={570} width={W} height={630} fill="#F4E6C8" stroke={INK} strokeWidth={8} />
      {flags.map((k, i) => {
        const x = 900 - i * 250; // reading order right -> left
        return (
          <g key={k}>
            <Flag k={k} x={x} y={700} w={210} s={popIn(t - fT[i], 0.3)} t={t} id={'b11' + k} />
            <Arrow x={x} y={870} s={0.55 * stampK(t - aT[i])} dir="r" len={0.75} />
          </g>
        );
      })}
    </Scene>
  );
};

// ================================================================== 12 — Napoleon's boat bounces back off a wave; جون waits on the UK island; ⬅ on "شمال"
const Boat: React.FC<{x: number; y: number; rot: number}> = ({x, y, rot}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <Pic n="napoleon" x={-70} y={-250} w={140} />
    <path d="M -170 -40 L 170 -40 L 120 40 L -120 40 Z" fill="#8A5A2C" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
    <line x1={-150} y1={-14} x2={150} y2={-14} stroke="#6b4422" strokeWidth={5} />
    <line x1={110} y1={-40} x2={110} y2={-250} stroke={INK} strokeWidth={8} />
    <g transform="translate(110 -250)"><rect x={0} y={0} width={36} height={70} fill="#0055A4" /><rect x={36} y={0} width={36} height={70} fill="#fff" /><rect x={72} y={0} width={36} height={70} fill="#EF4135" /><rect x={0} y={0} width={108} height={70} fill="none" stroke={INK} strokeWidth={5} /></g>
  </g>
);
export const B12: React.FC<BoardProps> = ({t, b0}) => {
  const eQ = at('ماقدرش') - b0, eSh = at('شمال') - b0;
  const hit = eQ + 0.35;
  const fwd = easeOut(seg(t, 0, hit));
  const back = t > hit ? easeOut(seg(t, hit, hit + 0.8)) : 0;
  const bx = lerp(150, 470, fwd) - back * 170;
  const by = 900 + Math.sin(t * 3) * 10 - (t > hit && t < hit + 0.5 ? Math.sin(((t - hit) / 0.5) * Math.PI) * 40 : 0);
  const rot = Math.sin(t * 2.5) * 4 + (t > hit ? wobble(t - hit, 2.5, 4) * 14 : 0);
  const wave = 1 + (t > hit - 0.2 && t < hit + 0.6 ? 0.25 * Math.sin(seg(t, hit - 0.2, hit + 0.6) * Math.PI) : 0);
  return (
    <Scene bg="linear-gradient(180deg,#8FD0FF 0%,#CDEBFF 48%,#3B8FD6 49%,#1F5FA8 100%)">
      {/* island */}
      <path d="M 640 760 Q 700 470 860 450 Q 1040 440 1100 600 L 1100 800 Z" fill="#6FB25A" stroke={INK} strokeWidth={8} />
      <path d="M 640 760 L 700 640 L 1100 640 L 1100 800 Z" fill="#F4F1E6" stroke={INK} strokeWidth={6} />
      <Pic n="john" x={650} y={470 - picH('john', 240) + 30} w={240} />
      <Flag k="uk" x={900} y={330} w={220} t={t} pole id="b12uk" />
      {/* the wave between the boat and the island */}
      <g transform={`translate(600 880) scale(1 ${wave})`}>
        <path d="M -150 60 Q -80 -120 30 -110 Q 110 -100 100 -40 Q 60 -70 30 -40 Q 70 0 150 60 Z" fill="#5FB4F0" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
        <path d="M -60 -60 Q 0 -100 60 -80" stroke="#fff" strokeWidth={10} fill="none" strokeLinecap="round" />
      </g>
      {Array.from({length: 8}, (_, i) => <path key={i} d={`M ${i * 150 - 40 + Math.sin(t * 2 + i) * 20} ${1040 + (i % 2) * 70} q 40 -26 80 0`} stroke="#fff" strokeWidth={7} fill="none" opacity={0.6} strokeLinecap="round" />)}
      <Boat x={bx} y={by} rot={rot} />
      <Arrow x={890} y={340} s={0.8 * stampK(t - eSh)} dir="l" label="شمال" />
    </Scene>
  );
};

// ================================================================== 13 — UK, then India and Australia pop with ⬅ on "الهند وأستراليا" and "شمال"
export const B13: React.FC<BoardProps> = ({t, b0}) => {
  const eI = at('الهند') - b0, eA = at('وأستراليا') - b0, eSh = at('شمال', 1) - b0;
  const puls = t > eSh ? 1 + 0.08 * Math.sin((t - eSh) * 8) * Math.exp(-(t - eSh) * 1.5) : 1;
  return (
    <Scene bg="radial-gradient(ellipse at 50% 40%,#FFF4D6 0%,#F4DFA8 70%,#E8C985 100%)">
      <Flag k="uk" x={540} y={260} w={360} t={t} id="b13uk" />
      <Arrow x={540} y={510} s={0.7 * puls} dir="l" />
      <Flag k="in" x={800} y={760} w={330} s={popIn(t - eI, 0.3)} t={t} id="b13in" />
      <Arrow x={800} y={1010} s={0.65 * stampK(t - eI - 0.2) * puls} dir="l" />
      <Flag k="au" x={280} y={760} w={330} s={popIn(t - eA, 0.3)} t={t} id="b13au" />
      <Arrow x={280} y={1010} s={0.65 * stampK(t - eA - 0.2) * puls} dir="l" />
    </Scene>
  );
};

// ================================================================== 14 — "طب ومصر؟": Egypt flag + pyramids, calendar 1882 -> 1956 under a small UK flag,
// then the Cairo taxi drives UP in the RIGHT lane; TWIST on "يمين!" (red ➡ stamps)
export const B14: React.FC<BoardProps> = ({t, b0}) => {
  const eM = at('ومصر') - b0, eS = at('سبعين') - b0, eB = at('بنسوق') - b0, eY = at('يمين', 2) - b0;
  const fl = popIn(t - eM + 0.25, 0.35);
  const big = 1 - easeInOut(seg(t, eS - 1.0, eS - 0.5)) * 0.42;
  const fx = lerp(540, 290, (1 - big) / 0.42), fy = lerp(330, 300, (1 - big) / 0.42);
  const cal = popIn(t - (eS - 0.5), 0.3);
  const yr = Math.round(lerp(1882, 1956, easeInOut(seg(t, eS, eS + 1.1))));
  const flip = t > eS && t < eS + 1.1 ? (t * 9) % 1 : 0;
  const road = easeOut(seg(t, eB - 1.0, eB - 0.4));
  return (
    <Scene bg="linear-gradient(180deg,#8FD0FF 0%,#FFE7B5 40%,#F4C784 41%,#E9B866 100%)">
      <Pyramids x={560} y={480} s={0.95} />
      <Flag k="eg" x={fx} y={fy} w={420 * big} s={fl} t={t} pole={big < 0.7} id="b14eg" />
      <Flag k="uk" x={800} y={190} w={140} s={cal} t={t} id="b14uk" />
      <Calendar x={800} y={400} s={0.8 * cal} year={yr} flip={flip} />
      {road > 0 && <g transform={`translate(0 ${(1 - road) * 700})`}>
        <Road x={540} w={420} t={t} y0={560} y1={H} />
        <CarTop x={540 + 105} y={880} s={1.3} taxi t={t} />
      </g>}
      <Arrow x={850} y={760} s={0.85 * stampK(t - eY)} dir="r" label="يمين" />
    </Scene>
  );
};

// ================================================================== 15 — "تفتكر ليه؟" + mystery pause: Egypt flag, a big "؟" pulses over it
export const B15: React.FC<BoardProps> = ({t}) => (
  <Scene bg="radial-gradient(ellipse at 50% 45%,#FFF1CF 0%,#F2D59A 70%,#DDB46C 100%)">
    <Pyramids x={560} y={1060} s={0.8} />
    <Flag k="eg" x={540} y={560} w={600} t={0} id="b15eg" />
    <QMark x={540} y={500} s={popIn(t, 0.3) * (1 + 0.1 * Math.sin(t * 5))} size={420} />
  </Scene>
);

// ================================================================== 16 — timeline (read right -> left): 1798 Napoleon at the pyramids (gold glow
// on "سبقهم"), 1882 the UK flag arrives later; arrow "+84" on "تمانين سنة"
export const B16: React.FC<BoardProps> = ({t, b0}) => {
  const eN = at('نابليون', 2) - b0, eSb = at('سبقهم') - b0, eM = at('مصر') - b0, eT = at('تمانين') - b0;
  const nap = popIn(t - eN, 0.3), glow = seg(t, eSb - 0.1, eSb + 0.3);
  const uk = popIn(t - (eM + 0.2), 0.3);
  const arr = easeOut(seg(t, eT - 0.3, eT + 0.4));
  return (
    <Scene bg="linear-gradient(180deg,#FFF6DE 0%,#F4E2B8 100%)">
      <rect x={60} y={900} width={960} height={22} rx={11} fill={INK} />
      {[820, 260].map((x) => <circle key={x} cx={x} cy={911} r={30} fill={YEL} stroke={INK} strokeWidth={8} />)}
      {/* 1798 (right) */}
      <g opacity={nap > 0 ? 1 : 0}>
        <Pyramids x={820} y={800} s={0.42} />
        {glow > 0 && <circle cx={820} cy={560} r={210} fill="#FFD23F" opacity={0.45 * glow + 0.08 * Math.sin(t * 6) * glow} />}
        <g transform={`translate(820 820) scale(${nap}) translate(-820 -820)`}><Pic n="napoleon" x={820 - 110} y={820 - picH('napoleon', 220)} w={220} /></g>
        <text x={820} y={1050} textAnchor="middle" fontFamily="Cairo" fontWeight={900} fontSize={96} fill={INK}>1798</text>
      </g>
      {/* 1882 (left) */}
      {uk > 0 && <g>
        <Flag k="uk" x={260} y={560} w={300} s={uk} t={t} pole id="b16uk" />
        <text x={260} y={1050} textAnchor="middle" fontFamily="Cairo" fontWeight={900} fontSize={96} fill={INK}>1882</text>
      </g>}
      {arr > 0 && <g>
        <path d={`M 740 300 Q 540 170 ${lerp(740, 340, arr)} ${lerp(300, 300, arr)}`} stroke={INK} strokeWidth={22} fill="none" strokeLinecap="round" />
        <path d={`M 740 300 Q 540 170 ${lerp(740, 340, arr)} ${lerp(300, 300, arr)}`} stroke={RED} strokeWidth={12} fill="none" strokeLinecap="round" />
        {arr > 0.95 && <path d="M 340 300 L 380 250 M 340 300 L 400 320" stroke={RED} strokeWidth={14} strokeLinecap="round" />}
        <text x={540} y={150} textAnchor="middle" fontFamily="Cairo" fontWeight={900} fontSize={110 * popIn(t - eT, 0.3)} fill={RED} stroke={INK} strokeWidth={14} paintOrder="stroke">+84</text>
      </g>}
    </Scene>
  );
};

// ================================================================== 17 — comic: the Cairo taxi swerves into the LEFT lane, cars honk, the driver is confused
export const B17: React.FC<BoardProps> = ({t, b0}) => {
  const e = at('شمال', 2) - b0;
  const sw = easeInOut(seg(t, e - 0.6, e));
  const tx = lerp(540 + 105, 540 - 105, sw);
  const rot = Math.sin(sw * Math.PI) * -18;
  const oy = lerp(-200, 330, easeOut(seg(t, e - 0.4, e + 0.4)));
  const h1 = popIn(t - e - 0.1, 0.2), h2 = popIn(t - e - 0.45, 0.2);
  return (
    <Scene bg="#D8C49E">
      <Buildings x0={0} x1={240} />
      <Buildings x0={840} x1={1080} />
      <Road x={540} w={420} t={t} speed={200} />
      <CarTop x={540 + 105} y={1040} s={1.05} color="#2F9BFF" t={t} />
      <CarTop x={540 - 105} y={oy} s={1.15} color="#E8403A" rot={180} t={t} />
      <CarTop x={tx} y={720} s={1.2} taxi rot={rot} t={t} />
      <Bubble x={300} y={oy + 80} s={h1} text="بيب!" />
      <Bubble x={790} y={900} s={h2} text="بيب!" flip />
      {t > e + 0.3 && <QMark x={tx + 120} y={560} s={popIn(t - e - 0.3, 0.3) * (1 + 0.06 * Math.sin(t * 6))} size={150} />}
    </Scene>
  );
};

// ================================================================== 18 — CTA: two cars nose-to-nose stop just in time ("بوم" puff), comment icon, ⬇ on "منشنه"
export const B18: React.FC<BoardProps> = ({t, b0}) => {
  const eH = at('حادثة') - b0, eMn = at('منشنه') - b0;
  const stop = easeOut(seg(t, 0, eH));
  const shake = t > eH ? wobble(t - eH, 5, 6) * 8 : 0;
  const ic = popIn(t - eMn + 0.15, 0.3);
  const bounce = ic > 0 ? Math.abs(Math.sin((t - eMn) * 5)) * -24 : 0;
  return (
    <Scene bg="#D8C49E">
      <Buildings x0={0} x1={220} />
      <Buildings x0={860} x1={1080} />
      <Road x={540} w={420} t={t * (1 - stop)} speed={200} />
      <CarTop x={540 - 105} y={lerp(1050, 640, stop) + shake} s={1.15} taxi t={t} />
      <CarTop x={540 - 105} y={lerp(-120, 360, stop) - shake} s={1.15} color="#E8403A" rot={180} t={t} />
      <Puff x={435} y={500} dt={t - eH} />
      {ic > 0 && <g transform={`translate(800 ${880 + bounce}) scale(${ic})`}>
        <path d="M -120 -90 Q -120 -130 -80 -130 L 80 -130 Q 120 -130 120 -90 L 120 20 Q 120 60 80 60 L -20 60 L -70 110 L -60 60 L -80 60 Q -120 60 -120 20 Z" fill="#2F9BFF" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
        <text x={0} y={18} textAnchor="middle" fontFamily="Cairo" fontWeight={900} fontSize={130} fill="#fff">@</text>
      </g>}
      {ic > 0 && <Arrow x={800} y={1110 + bounce * 0.5} s={0.55 * ic} dir="d" color={YEL} len={0.6} />}
    </Scene>
  );
};

// ================================================================== 19 — "الفهمان كسبان": back to the exact hook board (loop). t_abs - END runs the hook board
// so the last frame equals frame 0.
export const makeB19 = (END: number): React.FC<BoardProps> => ({t, b0, d}) => {
  const ta = b0 + t - END;
  return (
    <>
      <B1 t={ta} d={3} b0={0} />
      <svg width={W} height={1920} style={{position: 'absolute', inset: 0}}>
        {Array.from({length: 18}, (_, i) => (
          <circle key={i} cx={rand(i) * W} cy={60 + ((rand(i + 3) * 1000 + t * 160) % 1100)} r={4 + rand(i + 8) * 7} fill={YEL} opacity={0.75 * (1 - seg(t, d - 0.7, d - 0.2))} />
        ))}
      </svg>
    </>
  );
};
export const BOARDS_15 = [B1, B2, B3, B4, B5, B6, B7, B8, B9, B10, B11, B12, B13, B14, B15, B16, B17, B18];
