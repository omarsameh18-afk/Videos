import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Fonts} from '../lib/fonts';
import {FPS, clamp, easeIn, easeInOut, easeOut, lerp, popIn, popOut, seg, wobble} from '../lib/anim';
import {Cam, CamKey, Layer, camAt, shakeAt} from '../lib/camera';
import {SetBack, SetFront, DESK_SCREEN_Y} from '../lib/Set';
import {CANVAS, Character, HEAD, Pose, PoseKey, blinkTimes, mouthStates, poseAt, squashAt} from '../lib/Character';
import {Captions, Group, RED, YELLOW, Word, norm} from '../lib/Captions';
import {INK, Sparkle, SweatDrop, showScale} from '../lib/fx';
import WORDS from './liar.words.json';
import ENV from './liar.env.json';
import CAPS from './liar.captions.json';

// Episode 05: the liar ("الكدّاب"): three things that expose a liar. A suspense episode: darker room, spotlight on the
// board, a quiet low music bed, and three DRAMA PAUSES (the board freezes, slow push-in, one held low note, soft hit on
// the next word). Every prop is drawn in code: no generated pictures. The voice is the raw take at 1.0x; the drama pauses
// were lengthened with room tone (tools/pauses.py). Frame 0 starts directly in the hook pose (no wink frame): the last
// frame cuts into frame 0 inside a pose-swap squash.

// ============================================================ timing
const VO = 0;
const words = WORDS as Word[];
const nq = (w: string) => norm(w).replace(/"/g, '');
const idx = (w: string, nth = 0) => {
  const hits = words.map((x, i) => (nq(x.w) === nq(w) ? i : -1)).filter((i) => i >= 0);
  if (hits[nth] === undefined) throw new Error(`word not found: ${w} #${nth}`);
  return hits[nth];
};
const at = (w: string, nth = 0) => words[idx(w, nth)].s + VO;
const SPEECH_END = 42.02 + VO; // measured end of the last word
export const LIAR_DURATION_S = Math.round((SPEECH_END + 0.5) * FPS) / FPS; // ~0.5 s of silence after the last word
const END = LIAR_DURATION_S;

const T = {
  taaraf: at('تعرف'), oddamak: at('قدّامك'), beyekdeb: at('بيكدب'),
  fih: at('فيه'), wemesh: at('ومش'), menhom: at('منهم'), eineh: at('عينيه'),
  wahed: at('واحد'), hekayto: at('حكايته'), mazboota: at('مظبوطة'), zeyada: at('زيادة'), lozoom: at('اللزوم'),
  sadeq1: at('الصادق'), byensa: at('بينسى'), yerga3: at('ويرجع'), yesalla7: at('يصلّح'), kalamo1: at('كلامه'), kaddab1: at('الكدّاب'), hafez: at('حافظ'),
  etneen: at('اتنين'), es2alo1: at('اسأله'), an2: at('عن', 1), tafaseel: at('تفاصيل'),
  sadeq2: at('الصادق', 1), asami: at('أسامي'), amaken: at('وأماكن'), te2dar: at('تقدر'), tet2akked: at('تتأكد'),
  kaddab2: at('الكدّاب', 1), kalamo2: at('كلامه', 1), ayem: at('عايم'),
  talata: at('تلاتة'), es2alo2: at('اسأله', 1), so2al: at('سؤال'), baloh: at('باله'), wesa3etha: at('وساعتها'), hayet: at('هيتلخبط'),
  estanna: at('استنى'),
  hekaya: at('حكاية'), beyehrab: at('بيهرب'), di: at('دي'), ghalat: at('غلط'), kaddab3: at('الكدّاب', 2), beybos: at('بيبص'), aktar: at('أكتر'),
  ayez: at('عايز'), yet2akked: at('يتأكد'), ennak: at('إنك'), sadda2to: at('صدّقته'),
  ekteb: at('اكتب'), comments: at('الكومنتات'), ana: at('أنا'), kedebt: at('كدبت'), weseeb: at('وسيب'), elnas: at('الناس'), te2fesh: at('تقفشك'),
  fahman: at('الفهمان'), kasban: at('كسبان'),
};
// signature moments pinned to the measured audio onsets
T.estanna = 27.37 + VO; T.fahman = 40.72 + VO; T.kasban = 41.55 + VO;

// drama pauses: [end of the word before, start of the next word] (0.80 s each in the edited voice)
const pauseAfter = (w: string, nth = 0): [number, number] => { const i = idx(w, nth); return [words[i].e + VO, words[i + 1].s + VO]; };
const DRAMA: [number, number][] = [pauseAfter('بتفضحه'), pauseAfter('كلامه'), pauseAfter('يتأكد')];
// idle clock: every idle wiggle on the board runs on it, and it stops during a drama pause (the board freezes)
const idle = (t: number) => t - DRAMA.reduce((a, [p0, p1]) => a + clamp(t - p0 - 0.06, 0, p1 - p0 - 0.06), 0);
const inDrama = (t: number) => DRAMA.reduce((a, [p0, p1]) => Math.max(a, easeInOut(seg(t, p0, p0 + 0.3)) * (1 - seg(t, p1, p1 + 0.25))), 0);

// ============================================================ character
const TALKABLE: Pose[] = ['hero', 'explain', 'point_up', 'thinking', 'temple', 'thumbs_up', 'worried'];
const POSES: PoseKey[] = [
  [0, 'thinking'],            // hook pose from frame 0
  [T.fih, 'hero'],
  [T.wahed, 'explain'],
  [T.sadeq1, 'hero'],
  [T.kaddab1, 'thinking'],    // "...the liar has it memorised"
  [T.etneen, 'explain'],
  [T.sadeq2, 'hero'],
  [T.kaddab2, 'thinking'],
  [T.talata, 'explain'],
  [T.wesa3etha, 'thumbs_up'], // "...and then he trips up"
  [T.estanna, 'shocked'],     // signature line: shocked stare exactly on "استنى"
  [T.hekaya, 'explain'],
  [T.kaddab3, 'point_up'],    // "the liar looks you in the eye MORE"
  [T.ayez, 'thinking'],       // quietly: "he wants to make sure..."
  [T.ennak, 'hero'],
  [T.ekteb, 'explain'],       // open hands + arrows down to the comments (the library has no pointing-down pose)
  [T.fahman, 'temple'],       // ending: hand on temple exactly on "الفهمان"
];
const MOUTH = mouthStates((ENV as {level: number[]}).level);
const BLINKS = blinkTimes(END);

const CS = 0.6; // character canvas px -> world px
const CHAR_X = 540 - (CANVAS[0] * CS) / 2;
const CHAR_Y = DESK_SCREEN_Y - 1450 * CS; // pocket line sits on the desk edge
const FACE = {x: CHAR_X + HEAD[0] * CS, y: CHAR_Y + HEAD[1] * CS};

// ============================================================ camera
const CAM0: Cam = {x: 520, y: 860, z: 180};
const BASE: Cam = {x: 512, y: 866, z: 125}, NUM: Cam = {x: 512, y: 862, z: 138};
const [DA, DB, DC] = DRAMA;
const CAM_KEYS: CamKey[] = [
  [0, 1.0, {x: 512, y: 872, z: 120}], // pulls back from frame 0
  [T.fih - 0.1, T.fih + 0.4, {x: 508, y: 850, z: 146}],
  [DA[0], DA[1], {x: 510, y: 812, z: 190}],                 // drama pause (a): slow push-in
  [DA[1], DA[1] + 0.45, {x: 510, y: 842, z: 150}],
  [T.eineh - 0.04, T.eineh + 0.2, {x: 508, y: 834, z: 168}], // the red cross lands
  [T.wahed - 0.2, T.wahed + 0.3, NUM],
  [T.zeyada, T.zeyada + 0.5, {x: 508, y: 848, z: 152}],
  [T.sadeq1 - 0.1, T.sadeq1 + 0.4, BASE],
  [DB[0], DB[1], {x: 510, y: 812, z: 190}],                 // drama pause (b)
  [DB[1], DB[1] + 0.45, {x: 508, y: 846, z: 150}],
  [T.etneen - 0.2, T.etneen + 0.3, NUM],
  [T.tafaseel, T.tafaseel + 0.5, {x: 506, y: 844, z: 156}],
  [T.sadeq2 - 0.1, T.sadeq2 + 0.4, BASE],
  [T.ayem - 0.04, T.ayem + 0.25, {x: 506, y: 840, z: 158}],
  [T.talata - 0.2, T.talata + 0.3, NUM],
  [T.hayet - 0.04, T.hayet + 0.22, {x: 506, y: 838, z: 164}],
  [T.estanna - 0.04, T.estanna + 0.1, {x: 540, y: FACE.y + 20, z: 380}], // punch-in exactly on "استنى"
  [T.hekaya - 0.1, T.hekaya + 0.4, BASE],
  [T.kaddab3, T.aktar + 0.1, {x: 508, y: 842, z: 160}],     // creeps in while the eyes stare
  [T.ayez, T.ayez + 0.5, {x: 510, y: 832, z: 172}],
  [DC[0], DC[1], {x: 510, y: 808, z: 200}],                 // drama pause (c)
  [T.sadda2to + 0.5, T.ekteb - 0.1, {x: 510, y: 830, z: 172}],
  [T.ekteb - 0.1, T.ekteb + 0.4, {x: 512, y: 868, z: 122}],
  [T.fahman - 0.1, T.fahman + 0.5, CAM0], // ends on the opening framing
];
const SHAKES: [number, number, number][] = [
  [T.estanna, 16, 6], [T.eineh, 6, 10], [DA[1], 3.5, 9], [DB[1], 3.5, 9], [DC[1], 3.5, 9],
  [T.hafez, 3, 10], [T.ayem, 3, 10], [T.hayet, 5, 9], [T.ghalat, 5, 10], [T.aktar, 4, 9], [T.sadda2to, 3, 10],
];

// ============================================================ drawing kit (all code)
const BOARD = '#21302b', CHALK = '#fdf6e8', GREEN = '#43a85a', PAPER = '#fbf1d8', GREY = '#8a949c', DARK = '#3a2416';
const bump = (t: number, t0: number, a = 0.14, k = 9) => (t < t0 ? 1 : 1 + a * Math.exp(-(t - t0) * k) * Math.cos((t - t0) * 18));
type Pt = [number, number];

// board lettering: Cairo Black with the dark outline; Arabic is shaped by the browser (direction rtl)
const Txt: React.FC<{x: number; y: number; size: number; fill?: string; rtl?: boolean; sw?: number; anchor?: 'start' | 'middle' | 'end'; children: React.ReactNode}> =
({x, y, size, fill = CHALK, rtl = false, sw = 0.11, anchor = 'middle', children}) => (
  <text x={x} y={y} textAnchor={anchor} direction={rtl ? 'rtl' : 'ltr'} fontFamily="Cairo" fontWeight={900} fontSize={size} fill={fill}
    stroke={sw > 0 ? INK : 'none'} strokeWidth={size * sw} strokeLinejoin="round" paintOrder="stroke">{children}</text>
);
const QMark: React.FC<{x: number; y: number; size: number; s: number; rot?: number; fill?: string}> = ({x, y, size, s, rot = 0, fill = RED}) => s <= 0.001 ? null : (
  <text x={x} y={y} textAnchor="middle" fontFamily="Cairo" fontWeight={900} fontSize={size * s} fill={fill} stroke={INK} strokeWidth={size * 0.1 * s}
    strokeLinejoin="round" paintOrder="stroke" transform={`rotate(${rot} ${x} ${y - size * 0.3})`}>؟</text>
);
const Check: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => s <= 0.001 ? null : (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle r={30} fill={GREEN} stroke={INK} strokeWidth={7} />
    <path d="M -14 0 l 10 11 l 18 -22" stroke="#fff" strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </g>
);
// big red cross (a stamp): two strokes with the dark outline
const Cross: React.FC<{x: number; y: number; s: number; r?: number; rot?: number; w?: number}> = ({x, y, s, r = 60, rot = 0, w = 22}) => s <= 0.001 ? null : (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    {[INK, RED].map((c, i) => <path key={c} d={`M ${-r} ${-r} L ${r} ${r} M ${r} ${-r} L ${-r} ${r}`} stroke={c} strokeWidth={i ? w : w + 13} strokeLinecap="round" />)}
  </g>
);
// stamp: slams down from big to 1 in 0.12 s, then a tiny settle
const stamp = (dt: number) => (dt < 0 ? 0 : dt < 0.12 ? lerp(2.3, 1, easeIn(dt / 0.12)) : 1 + wobble(dt - 0.12, 5, 10) * 0.08);
// label tag with a string hole
const Tag: React.FC<{x: number; y: number; s: number; w: number; h: number; size: number; rot?: number; fill?: string; children: React.ReactNode}> = ({x, y, s, w, h, size, rot = 0, fill = YELLOW, children}) => s <= 0.001 ? null : (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h * 0.24} fill={fill} stroke={INK} strokeWidth={8} />
    <circle cx={w / 2 - 22} cy={0} r={7} fill={BOARD} stroke={INK} strokeWidth={5} />
    <text x={-10} y={size * 0.34} textAnchor="middle" direction="rtl" fontFamily="Cairo" fontWeight={900} fontSize={size} fill={INK}>{children}</text>
  </g>
);
// small stick figure (same as episodes 03-04); (x, y) = feet
const Stick: React.FC<{x: number; y: number; s?: number; dir?: number; confused?: boolean; scratch?: number; wig?: number; rot?: number; op?: number}> = ({x, y, s = 1, dir = 1, confused = false, scratch = 0, wig = 0, rot = 0, op = 1}) => {
  const a = 0.13, hy = -80, ny = -140, sy = -128, hd = -170, L = 82, A = 60, b1 = -a * 1.1 + 0.12, b2 = a * 1.1 - 0.12;
  const ex = lerp(Math.sin(b2) * A * 0.5, 34, scratch), ey = lerp(sy + Math.cos(b2) * A * 0.5, sy - 16, scratch);
  const hx = lerp(Math.sin(b2) * A, 20 + wig * 6, scratch), hyy = lerp(sy + Math.cos(b2) * A, hd - 30, scratch);
  const d = `M 0 ${hy} L ${Math.sin(a) * L} ${hy + Math.cos(a) * L} M 0 ${hy} L ${-Math.sin(a) * L} ${hy + Math.cos(a) * L} M 0 ${hy} L 0 ${ny}` +
    ` M 0 ${sy} L ${Math.sin(b1) * A} ${sy + Math.cos(b1) * A} M 0 ${sy} L ${ex} ${ey} L ${hx} ${hyy}`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s * dir} ${s})`} opacity={op}>
      <path d={d} stroke={INK} strokeWidth={21} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={0} cy={hd} r={29} fill={CHALK} stroke={INK} strokeWidth={6.5} />
      <path d={d} stroke={CHALK} strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={2} cy={hd - 4} r={3.8} fill={INK} /><circle cx={17} cy={hd - 4} r={3.8} fill={INK} />
      {confused ? <g>
        <path d={`M -6 ${hd - 16} l 10 4 M 13 ${hd - 13} l 10 -5`} stroke={INK} strokeWidth={4} strokeLinecap="round" />
        <path d={`M 3 ${hd + 12} q 4 -5 8 0 q 4 5 8 0`} stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
      </g> : <path d={`M 5 ${hd + 11} l 11 0`} stroke={INK} strokeWidth={4} strokeLinecap="round" />}
    </g>
  );
};
// speech bubble: rounded box centred on (0, 0) with a tail to the point (tx, ty)
const Bubble: React.FC<{w: number; h: number; tx: number; ty: number; fill?: string; r?: number}> = ({w, h, tx, ty, fill = '#fff', r = 26}) => {
  const bx = clamp(tx * 0.45, -w / 2 + 50, w / 2 - 50), by = ty > 0 ? h / 2 : -h / 2, tri = `M ${bx - 24} ${by} L ${tx} ${ty} L ${bx + 24} ${by} Z`;
  return (
    <g>
      <path d={tri} fill={fill} stroke={INK} strokeWidth={9} strokeLinejoin="round" />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={r} fill={fill} stroke={INK} strokeWidth={9} />
      <path d={`M ${bx - 19} ${by + (ty > 0 ? -6 : 6)} L ${tx * 0.97 + bx * 0.03} ${ty * 0.9 + by * 0.1} L ${bx + 19} ${by + (ty > 0 ? -6 : 6)} Z`} fill={fill} />
    </g>
  );
};
// rows of "words" (rounded bars), written right to left: each bar is [width]; p = how much is written (0..1)
const Bars: React.FC<{x: number; y: number; rows: number[][]; h?: number; gap?: number; lh?: number; c?: string; p?: number}> = ({x, y, rows, h = 16, gap = 12, lh = 34, c = GREY, p = 1}) => {
  const total = rows.reduce((a, r) => a + r.length, 0); let k = 0;
  return (
    <g>
      {rows.map((row, ri) => {
        let cx = x;
        return row.map((w, i) => {
          const s = clamp(p * total - k); k++;
          const el = s <= 0 ? null : <rect key={`${ri}-${i}`} x={cx - w * s} y={y + ri * lh - h / 2} width={w * s} height={h} rx={h / 2} fill={c} />;
          cx -= w + gap;
          return el;
        });
      })}
    </g>
  );
};
// a sheet of paper whose lines are all exactly the same length (too neat), with a shine that sweeps across
const NeatSheet: React.FC<{id: string; w: number; h: number; lines: number; p: number; shine: number}> = ({id, w, h, lines, p, shine}) => {
  const m = w * 0.14, lh = (h - 2 * m - 10) / (lines - 1);
  return (
    <g>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={14} fill={PAPER} stroke={INK} strokeWidth={9} />
      {Array.from({length: lines}, (_, i) => {
        const s = clamp(p * lines - i);
        return s <= 0 ? null : <rect key={i} x={w / 2 - m - (w - 2 * m) * s} y={-h / 2 + m + i * lh} width={(w - 2 * m) * s} height={Math.min(14, lh * 0.42)} rx={6} fill={DARK} />;
      })}
      {shine > 0 && shine < 1 && <g>
        <defs><clipPath id={id}><rect x={-w / 2 + 5} y={-h / 2 + 5} width={w - 10} height={h - 10} rx={10} /></clipPath></defs>
        <g clipPath={`url(#${id})`}><path d={`M ${lerp(-w, w, shine)} ${h / 2} l ${w * 0.5} ${-h} l ${w * 0.22} 0 l ${-w * 0.5} ${h} Z`} fill="#fff" opacity={0.75} /></g>
      </g>}
    </g>
  );
};

// ---- face-down / face-up card. flip 0 = back (pattern + "؟", never blank), 1 = face with the chalk number
const CW = 150, CH = 200;
const Card: React.FC<{x: number; y: number; s?: number; rot?: number; flip?: number; n?: string}> = ({x, y, s = 1, rot = 0, flip = 0, n = ''}) => {
  const sx = Math.cos(clamp(flip) * Math.PI), up = flip > 0.5;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s * Math.max(0.05, Math.abs(sx))} ${s})`}>
      <rect x={-CW / 2} y={-CH / 2} width={CW} height={CH} rx={18} fill={up ? '#2c4038' : '#a8382f'} stroke={INK} strokeWidth={9} />
      {up ? <g>
        <rect x={-CW / 2 + 12} y={-CH / 2 + 12} width={CW - 24} height={CH - 24} rx={10} fill="none" stroke={CHALK} strokeWidth={4} strokeDasharray="10 9" opacity={0.6} />
        <Txt x={0} y={44} size={124} fill={YELLOW}>{n}</Txt>
      </g> : <g>
        <rect x={-CW / 2 + 13} y={-CH / 2 + 13} width={CW - 26} height={CH - 26} rx={10} fill="none" stroke="#f3c9a0" strokeWidth={5} />
        <path d="M 0 -62 L 44 0 L 0 62 L -44 0 Z" fill="#f3c9a0" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <text x={0} y={22} textAnchor="middle" fontFamily="Cairo" fontWeight={900} fontSize={58} fill="#a8382f">؟</text>
      </g>}
    </g>
  );
};

// ---- a pair of cartoon eyes. look = pupil offset; stare 0..1 lowers the brows; kids = drawn inside the right pupil (reflection)
const EX = 92, ERX = 70, ERY = 82;
const Eyes: React.FC<{look: Pt; stare?: number; kids?: React.ReactNode}> = ({look, stare = 0, kids}) => (
  <g>
    {[-EX, EX].map((cx) => (
      <g key={cx} transform={`translate(${cx} 0)`}>
        <ellipse rx={ERX} ry={ERY} fill="#fff" stroke={INK} strokeWidth={9} />
        <g transform={`translate(${look[0]} ${look[1]})`}>
          <circle r={lerp(40, 44, stare)} fill="#6b4423" stroke={INK} strokeWidth={5} />
          <circle r={lerp(24, 30, stare)} fill="#0f0a08" />
          {cx > 0 && kids}
          <circle cx={-15} cy={-17} r={7} fill="#fff" opacity={0.95} />
        </g>
        <path d={`M ${-ERX + 4} ${-ERY - 26 + stare * (cx < 0 ? 4 : 30)} L ${ERX - 4} ${-ERY - 26 + stare * (cx < 0 ? 30 : 4)}`} stroke={INK} strokeWidth={17} strokeLinecap="round" />
      </g>
    ))}
  </g>
);

// ============================================================ board (chalkboard inset above his head)
const BX = 80, BY = 84, BW = 860, BH = 480, MID = BW / 2;
type Scene = 'hook' | 'cards' | 'one' | 'split1' | 'two' | 'split2' | 'three' | 'eyes' | 'cta' | 'loop';
// the board is never empty: each scene pushes the previous one out (PUSH seconds)
const PUSH = 0.3, NUM_LEAD = 0.24;
const SCENES: [number, Scene][] = [
  [0, 'hook'], [T.fih - 0.1, 'cards'], [T.wahed - NUM_LEAD, 'one'], [T.sadeq1 - 0.1, 'split1'], [T.etneen - NUM_LEAD, 'two'],
  [T.sadeq2 - 0.1, 'split2'], [T.talata - NUM_LEAD, 'three'], [T.hekaya - 0.1, 'eyes'], [T.ekteb - 0.1, 'cta'], [T.fahman - 0.15, 'loop'],
];
type SP = {t: number; ti: number}; // t = real time (events land on words), ti = idle clock (stops in a drama pause)
const Divider: React.FC = () => <path d={`M ${MID} 22 L ${MID} ${BH - 22}`} stroke={CHALK} strokeWidth={6} strokeDasharray="16 16" strokeLinecap="round" opacity={0.55} />;

// ---- 1. hook: two figures face to face; the talker's bubble flickers between a green tick and a red cross; "؟" over the listener
const HookScene: React.FC<SP & {frozen?: boolean}> = ({t, ti, frozen = false}) => {
  const tt = frozen ? 0 : t, ii = frozen ? 0 : ti;
  const FL = 0.24, k = Math.floor(ii / FL), ph = ii - k * FL, yes = k % 2 === 0;
  const fb = 1 + 0.2 * Math.exp(-ph * 22);
  const q = popIn(tt - T.taaraf, 0.26);
  return (
    <g>
      <Stick x={236} y={452} s={1.12} dir={1} />
      <Stick x={640} y={452} s={1.12} dir={-1} confused={tt >= T.beyekdeb} scratch={easeOut(seg(tt, T.beyekdeb, T.beyekdeb + 0.2))} wig={Math.sin(ii * 15)} />
      <g transform={`translate(380 ${126 + Math.sin(ii * 3.2) * 4})`}>
        <Bubble w={210} h={150} tx={-96} ty={128} />
        <g transform={`scale(${fb})`}>
          {yes ? <path d="M -40 2 l 28 30 l 54 -64" stroke={GREEN} strokeWidth={24} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            : <path d="M -38 -38 L 38 38 M 38 -38 L -38 38" stroke={RED} strokeWidth={24} strokeLinecap="round" />}
        </g>
      </g>
      <QMark x={650} y={212} size={150} s={q} rot={wobble(tt - T.taaraf - 0.26, 2.5, 4) * 14 + Math.sin(ii * 2.6) * 4} fill={YELLOW} />
    </g>
  );
};

// ---- 2. three face-down cards slide in; after drama pause (a) they move up and a pair of eyes appears and gets a red cross
const CARD_X = [690, 430, 170]; // card 1 is on the right (Arabic order)
const CardsScene: React.FC<SP> = ({t, ti}) => {
  const up = easeInOut(seg(t, T.wemesh, T.wemesh + 0.32));
  const eyes = popIn(t - T.wemesh - 0.06, 0.3);
  const look: Pt = t < T.eineh ? [Math.sin(ti * 5.5) * 16, 4] : [0, 6];
  return (
    <g>
      {CARD_X.map((x, i) => {
        const t0 = T.fih + i * 0.24, a = easeOut(seg(t, t0, t0 + 0.34));
        if (t < t0) return null;
        const xx = lerp(lerp(x + 760, x, a), [560, 430, 300][i], up), yy = lerp(242, 100, up);
        return <Card key={i} x={xx} y={yy + Math.sin(ti * 2.4 + i * 1.3) * 3} s={lerp(1.1, 0.5, up) * bump(t, t0 + 0.34, 0.08)} rot={(1 - a) * 14 + wobble(t - t0 - 0.34, 3, 7) * 5 + (i - 1) * -3 * (1 - up)} />;
      })}
      {eyes > 0.001 && <g transform={`translate(${MID} 322) scale(${eyes * 0.86 * bump(t, T.eineh, 0.08)})`}><Eyes look={look} /></g>}
      <Cross x={MID} y={322} s={stamp(t - T.eineh)} r={104} w={26} rot={-4} />
    </g>
  );
};

// ---- number scenes: the next card (others peeking behind it) flips to its chalk number exactly on the word
const NumCard: React.FC<{t: number; ti: number; n: 1 | 2 | 3; at: number}> = ({t, ti, n, at: t0}) => {
  const fl = easeInOut(seg(t, t0, t0 + 0.24));
  return (
    <g transform={`translate(0 ${Math.sin(ti * 2.1) * 3})`}>
      {n < 2 && <Card x={742} y={250} s={1.02} rot={13} />}
      {n < 3 && <Card x={668} y={246} s={1.02} rot={-10} />}
      <Card x={704} y={240} s={1.14 * bump(t, t0 + 0.24, 0.1)} rot={-2} flip={fl} n={String(n)} />
      <Sparkle x={800} y={110} dt={t - t0 - 0.22} r={28} />
    </g>
  );
};

// ---- 3. "one": a sheet of text, every line exactly the same length, with a shine
const OneScene: React.FC<SP> = ({t, ti}) => {
  const sheet = popIn(t - T.hekayto, 0.3);
  return (
    <g>
      <NumCard t={t} ti={ti} n={1} at={T.wahed} />
      {sheet > 0.001 && <g transform={`translate(292 ${244 + Math.sin(ti * 2.2) * 3}) rotate(-3) scale(${sheet * bump(t, T.lozoom, 0.07)})`}>
        <NeatSheet id="sh1" w={290} h={370} lines={8} p={seg(t, T.hekayto + 0.06, T.zeyada)} shine={seg(t, T.zeyada, T.zeyada + 0.55)} />
      </g>}
      <Sparkle x={452} y={84} dt={t - T.lozoom} r={34} />
      <Sparkle x={130} y={400} dt={t - T.lozoom - 0.14} r={26} />
    </g>
  );
};

// ---- 4. split board: right "الصادق" forgets and corrects himself; left "الكدّاب" (after drama pause b) reads a neat sheet
const HONEST_ROWS = [[62, 84, 52], [58, 70, 66]];
const Split1Scene: React.FC<SP> = ({t, ti}) => {
  const lit = t >= T.kaddab1, strike = easeInOut(seg(t, T.yerga3, T.yerga3 + 0.3)), fix = popIn(t - T.yesalla7, 0.24);
  const sheet = popIn(t - T.hafez, 0.28);
  // the crossed-out word: second bar of the second row (right-aligned rows start at x = 122)
  const wx1 = 122 - 58 - 12, wx0 = wx1 - 70, wy = 14;
  return (
    <g>
      <Divider />
      {/* right: the honest one */}
      <g transform={`translate(645 62) scale(${popIn(t - T.sadeq1, 0.26)})`}><Txt x={0} y={0} size={50} fill={GREEN} rtl>الصادق</Txt></g>
      <Stick x={806} y={456} s={0.9} dir={-1} scratch={easeOut(seg(t, T.byensa, T.byensa + 0.2)) * (1 - seg(t, T.yesalla7, T.yesalla7 + 0.2))} wig={Math.sin(ti * 14)} />
      <g transform={`translate(590 ${196 + Math.sin(ti * 2.6) * 3})`}>
        <Bubble w={290} h={150} tx={176} ty={104} />
        <Bars x={122} y={-20} rows={HONEST_ROWS} p={seg(t, T.sadeq1 + 0.05, T.byensa + 0.2)} />
        {strike > 0 && <path d={`M ${wx1 + 6} ${wy - 3} L ${lerp(wx1 + 6, wx0 - 6, strike)} ${wy + 3}`} stroke={RED} strokeWidth={8} strokeLinecap="round" />}
        {fix > 0.001 && <g transform={`translate(${(wx0 + wx1) / 2} ${wy - 26}) scale(${fix})`}>
          <rect x={-30} y={-8} width={60} height={15} rx={7.5} fill={GREEN} />
          <path d="M -9 20 L 0 11 L 9 20" stroke={GREEN} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>}
      </g>
      <Tag x={556} y={372} s={popIn(t - T.byensa, 0.28)} w={226} h={84} size={46} rot={-5 + wobble(t - T.byensa - 0.28, 2.5, 4) * 8}>مش فاكر</Tag>
      <Check x={726} y={130} s={popIn(t - T.kalamo1, 0.24) * 0.9} />
      {/* left: the liar waits in the dark until his line */}
      <g opacity={lit ? 1 : 0.32}>
        <Stick x={76} y={456} s={0.9 * bump(t, T.kaddab1, 0.1)} dir={1} />
      </g>
      {!lit && <QMark x={215} y={270} size={120} s={1} rot={Math.sin(ti * 2.2) * 5} fill="#5d6f68" />}
      <g transform={`translate(215 62) scale(${popIn(t - T.kaddab1, 0.26)})`}><Txt x={0} y={0} size={50} fill={RED} rtl>الكدّاب</Txt></g>
      {sheet > 0.001 && <g transform={`translate(262 ${272 + Math.sin(ti * 2.4) * 3}) rotate(4) scale(${sheet})`}>
        <NeatSheet id="sh2" w={210} h={262} lines={7} p={seg(t, T.hafez - 0.02, T.hafez + 0.3) * 0.86 + 0.14} shine={seg(t, T.hafez + 0.3, T.hafez + 0.8)} />
      </g>}
      <Sparkle x={388} y={150} dt={t - T.hafez - 0.3} r={28} />
    </g>
  );
};

// ---- 5. "two": a magnifying glass moves over a speech bubble
const TWO_ROWS = [[90, 60, 110], [70, 120, 50], [100, 80, 70], [60, 96]];
const TwoScene: React.FC<SP> = ({t, ti}) => {
  const bub = popIn(t - T.es2alo1, 0.28);
  const a = easeInOut(seg(t, T.an2, T.tafaseel + 0.15));
  const orbit: Pt = [300 + 98 * Math.sin(ti * 1.5 + 0.6), 214 + 46 * Math.sin(ti * 2.3 + 1)];
  const L: Pt = [lerp(560, orbit[0], a), lerp(520, orbit[1], a)];
  const R = 66;
  const rows = (c: string) => <Bars x={150} y={-56} rows={TWO_ROWS} h={18} lh={38} c={c} p={seg(t, T.es2alo1 + 0.1, T.an2 + 0.1)} />;
  return (
    <g>
      <NumCard t={t} ti={ti} n={2} at={T.etneen} />
      {bub > 0.001 && <g transform={`translate(300 214) scale(${bub})`}><Bubble w={380} h={226} tx={150} ty={176} />{rows(GREY)}</g>}
      {t >= T.an2 && <g>
        <defs><clipPath id="lens"><circle cx={L[0]} cy={L[1]} r={R - 4} /></clipPath></defs>
        <g clipPath="url(#lens)">
          <circle cx={L[0]} cy={L[1]} r={R} fill="#eaf6ff" />
          <g transform={`translate(${L[0]} ${L[1]}) scale(1.75) translate(${-L[0]} ${-L[1]})`}><g transform="translate(300 214)">{rows(DARK)}</g></g>
        </g>
        <path d={`M ${L[0] + R * 0.72} ${L[1] + R * 0.72} l 62 62`} stroke={INK} strokeWidth={30} strokeLinecap="round" />
        <path d={`M ${L[0] + R * 0.78} ${L[1] + R * 0.78} l 56 56`} stroke="#c98a1e" strokeWidth={16} strokeLinecap="round" />
        <circle cx={L[0]} cy={L[1]} r={R} fill="none" stroke={INK} strokeWidth={19} />
        <circle cx={L[0]} cy={L[1]} r={R} fill="none" stroke="#cfd6dd" strokeWidth={8} />
        <path d={`M ${L[0] - 40} ${L[1] - 22} q 10 -22 34 -26`} stroke="#fff" strokeWidth={7} fill="none" strokeLinecap="round" />
      </g>}
    </g>
  );
};

// ---- 6. split board: right "الصادق" gives names, places, times you can check; left "الكدّاب": only fog
const ICON_X = [96, 0, -96];
const Split2Scene: React.FC<SP> = ({t, ti}) => {
  const lit = t >= T.kaddab2, fog = popIn(t - T.kalamo2, 0.3);
  const fl = t >= T.ayem ? 1 : 0;
  const scribble = (seed: number) => `M -92 ${seed * 9} ` + Array.from({length: 9}, (_, i) => `q 11 ${(i % 2 ? 1 : -1) * (16 + seed * 3)} 22 0`).join(' ');
  return (
    <g>
      <Divider />
      <g transform="translate(645 62)"><Txt x={0} y={0} size={50} fill={GREEN} rtl>الصادق</Txt></g>
      <Stick x={806} y={456} s={0.9} dir={-1} />
      <g transform={`translate(590 ${200 + Math.sin(ti * 2.6) * 3})`}>
        <Bubble w={300} h={166} tx={176} ty={104} />
        {/* name tag */}
        <g transform={`translate(${ICON_X[0]} -6) scale(${popIn(t - T.asami, 0.24)})`}>
          <rect x={-34} y={-30} width={68} height={62} rx={9} fill="#fff" stroke={INK} strokeWidth={6} />
          <path d="M -31 -12 L -31 -21 Q -31 -27 -25 -27 L 25 -27 Q 31 -27 31 -21 L 31 -12 Z" fill={RED} />
          <rect x={-22} y={0} width={44} height={8} rx={4} fill={DARK} /><rect x={-14} y={15} width={28} height={7} rx={3.5} fill={GREY} />
        </g>
        {/* map pin */}
        <g transform={`translate(${ICON_X[1]} 28) scale(${popIn(t - T.amaken, 0.24)})`}>
          <path d="M 0 0 C -8 -22 -29 -34 -29 -58 A 29 29 0 1 1 29 -58 C 29 -34 8 -22 0 0 Z" fill={RED} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          <circle cx={0} cy={-58} r={11} fill="#fff" stroke={INK} strokeWidth={4.5} />
        </g>
        {/* clock */}
        <g transform={`translate(${ICON_X[2]} -4) scale(${popIn(t - T.te2dar, 0.24)})`}>
          <circle r={32} fill="#fffbe6" stroke={INK} strokeWidth={6} />
          <path d="M 0 0 L 0 -20 M 0 0 L 14 8" stroke={INK} strokeWidth={6} strokeLinecap="round" /><circle r={4.5} fill={RED} />
        </g>
        {ICON_X.map((x, i) => <Check key={x} x={x + 28} y={36} s={popIn(t - T.tet2akked - i * 0.14, 0.22) * 0.62} />)}
      </g>
      {/* left: the liar */}
      <g opacity={lit ? 1 : 0.32}><Stick x={76} y={456} s={0.9 * bump(t, T.kaddab2, 0.1)} dir={1} /></g>
      {!lit && <QMark x={215} y={270} size={120} s={1} rot={Math.sin(ti * 2.2) * 5} fill="#5d6f68" />}
      <g transform={`translate(215 62) scale(${popIn(t - T.kaddab2, 0.26)})`}><Txt x={0} y={0} size={50} fill={RED} rtl>الكدّاب</Txt></g>
      {fog > 0.001 && <g transform={`translate(${262 + fl * Math.sin((ti - T.ayem) * 1.7) * 16} ${216 + fl * (Math.sin((ti - T.ayem) * 2.9) * 12 - 8 * easeOut(seg(t, T.ayem, T.ayem + 0.4)))}) rotate(${fl * Math.sin((ti - T.ayem) * 2.1) * 4}) scale(${fog})`}>
        <defs><filter id="fogblur" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="6.5" /></filter></defs>
        <Bubble w={270} h={170} tx={-150} ty={110} fill="#e9eef0" />
        <g filter="url(#fogblur)">
          {[-1.9, 0, 1.9].map((s, i) => <path key={i} d={scribble(s)} transform={`translate(${Math.sin(ti * 1.3 + i) * 10} ${s * 13})`} stroke="#5f6b72" strokeWidth={12} fill="none" strokeLinecap="round" />)}
        </g>
        {[[-84, -46, 30], [70, 44, 34], [86, -40, 24], [-60, 50, 22]].map(([x, y, r], i) => (
          <circle key={i} cx={x + Math.sin(ti * 1.1 + i * 2) * 9} cy={y + Math.cos(ti * 0.9 + i) * 5} r={r} fill="#fff" opacity={0.55} />
        ))}
      </g>}
    </g>
  );
};

// ---- 7. "three": a surprise question flies at the liar; on "هيتلخبط" his speech turns into a tangle and he sweats
const TANGLE = (() => {
  const pts = Array.from({length: 150}, (_, i) => { const u = i / 149 * Math.PI * 2; return [78 * Math.sin(3 * u + 0.6) * Math.cos(1.3 * u), 38 * Math.sin(5 * u) + 10 * Math.cos(2 * u)]; });
  return pts.map(([x, y], i) => `${i ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
})();
const ThreeScene: React.FC<SP> = ({t, ti}) => {
  const bub = popIn(t - T.es2alo2, 0.28), tangled = t >= T.hayet;
  const fly = easeInOut(seg(t, T.so2al, T.baloh)), fx = lerp(-80, 268, fly), fy = lerp(150, 262, fly) - Math.sin(fly * Math.PI) * 70;
  const hit = wobble(t - T.baloh, 5, 7);
  const shake = t >= T.wesa3etha ? Math.sin(ti * 34) * 3 * (tangled ? 1 : seg(t, T.wesa3etha, T.hayet)) : 0;
  return (
    <g>
      <NumCard t={t} ti={ti} n={3} at={T.talata} />
      <Stick x={424 + shake + hit * 10} y={456} s={1} dir={-1} confused={t >= T.baloh} rot={hit * 5} />
      {bub > 0.001 && <g transform={`translate(494 ${116 + Math.sin(ti * 2.6) * 3}) scale(${bub * bump(t, T.hayet, 0.22)}) rotate(${tangled ? Math.sin(ti * 30) * 1.5 : 0})`}>
        <Bubble w={214} h={132} tx={-56} ty={112} fill={tangled ? '#ffe9e4' : '#fff'} />
        {tangled ? <path d={TANGLE} stroke={RED} strokeWidth={6.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          : <Bars x={84} y={-30} rows={[[60, 44, 40], [50, 70, 30], [66, 40]]} h={15} lh={30} p={seg(t, T.es2alo2 + 0.1, T.so2al)} />}
      </g>}
      {/* the surprise question */}
      {t >= T.so2al && <g transform={`translate(${fx + hit * 14} ${fy}) rotate(${(1 - fly) * -18}) scale(${popIn(t - T.so2al, 0.2) * (1 + Math.abs(hit) * 0.2)})`}>
        <Bubble w={96} h={88} tx={66} ty={30} fill={YELLOW} r={30} />
        <text x={0} y={24} textAnchor="middle" fontFamily="Cairo" fontWeight={900} fontSize={66} fill={INK}>؟</text>
      </g>}
      <SweatDrop x={470} y={262} dt={t - T.hayet - 0.05} s={0.5} />
      {t >= T.hayet + 1.0 && <g transform="translate(466 300) scale(0.3)"><path d="M 0 -60 C 25 -20 42 5 42 28 C 42 54 22 70 0 70 C -22 70 -42 54 -42 28 C -42 5 -25 -20 0 -60 Z" fill="#8fd6ff" stroke={INK} strokeWidth={10} /></g>}
    </g>
  );
};

// ---- 9 + 10. the eyes come back: darting = "غلط"; then they stare straight at you and grow; then we zoom into one eye:
// in its reflection a little figure with "؟", which turns into a tick on "صدّقته" (after drama pause c)
const ZOOM = 3.3;
const EyesScene: React.FC<SP> = ({t, ti}) => {
  const swap = T.kaddab3; // the darting eyes are replaced by the staring ones on "الكدّاب"
  const dart = t >= T.beyehrab && t < swap ? Math.sign(Math.sin((ti - T.beyehrab) * 13)) * 26 * easeOut(Math.abs(Math.sin((ti - T.beyehrab) * 13))) : 0;
  const stare = t >= swap ? 1 : 0;
  const look: Pt = stare ? [0, 2] : [dart, 6];
  const wrong = showScale(t, T.ghalat, swap - 0.12, 0.2, 0.12);
  const cross = t < swap - 0.12 ? stamp(t - T.ghalat) : popOut(t - swap + 0.12, 0.12);
  const grow = stare ? lerp(1, 1.16, easeInOut(seg(t, T.beybos, T.aktar))) * bump(t, swap, 0.12) * bump(t, T.aktar, 0.08) : 1;
  const z = easeInOut(seg(t, T.ayez, T.ayez + 0.6));
  const s = lerp(grow, ZOOM, z), ex = lerp(0, -EX * ZOOM, z);
  const refl = popIn(t - T.yet2akked, 0.3), ok = t >= T.sadda2to;
  const kids = refl <= 0.001 ? null : (
    <g transform={`translate(2 3) scale(${refl})`}>
      <g stroke="#cfe8ff" strokeWidth={2.6} fill="none" strokeLinecap="round" opacity={0.95}>
        <circle cx={0} cy={1} r={4.6} fill="#cfe8ff" />
        <path d="M 0 6 L 0 16 M 0 9 L -6 14 M 0 9 L 6 14 M 0 16 L -4.5 24 M 0 16 L 4.5 24" />
      </g>
      <g transform={`translate(0 -12) scale(${ok ? popIn(t - T.sadda2to, 0.22) : 1 + Math.sin(ti * 6) * 0.06})`}>
        {ok ? <path d="M -6 0 l 4.5 5 l 8.5 -10" stroke="#5fe07f" strokeWidth={3.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          : <text x={0} y={5} textAnchor="middle" fontFamily="Cairo" fontWeight={900} fontSize={15} fill={YELLOW}>؟</text>}
      </g>
    </g>
  );
  return (
    <g>
      <g transform={`translate(${MID + ex} ${lerp(232, 240, z)}) scale(${s})`}><Eyes look={look} stare={stare} kids={kids} /></g>
      <Cross x={MID} y={232} s={cross} r={112} w={26} rot={-4} />
      <Tag x={668} y={410} s={wrong} w={176} h={86} size={52} rot={-6 + wobble(t - T.ghalat - 0.2, 2.5, 4) * 8} fill="#ffd9d4">غلط</Tag>
      <Sparkle x={640} y={120} dt={t - T.sadda2to - 0.05} r={34} />
      <Sparkle x={210} y={360} dt={t - T.sadda2to - 0.2} r={26} />
    </g>
  );
};

// ---- 11. a comment box types "أنا عمري ما كدبت"; replies "كدّاب!" + a laughing face pop under it
const COMMENT = 'أنا عمري ما كدبت';
const Laugh: React.FC = () => (
  <g>
    <circle r={21} fill="#ffd23f" stroke={INK} strokeWidth={5} />
    <path d="M -13 -6 l 7 4 l -7 4 M 13 -6 l -7 4 l 7 4" stroke={INK} strokeWidth={3.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M -11 5 Q 0 22 11 5 Z" fill="#7a2d1c" stroke={INK} strokeWidth={3.4} strokeLinejoin="round" />
    <path d="M -19 3 q -7 9 -1 13 q 6 -2 1 -13 Z M 19 3 q 7 9 1 13 q -6 -2 -1 -13 Z" fill="#6cc6ff" stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
  </g>
);
const REPLIES: [number, number, number][] = [[T.weseeb, 566, 262], [T.elnas, 372, 346], [T.te2fesh, 588, 428]];
const CtaScene: React.FC<SP> = ({t, ti}) => {
  const n = Math.round(clamp((t - T.ana) / (T.kedebt + 0.3 - T.ana)) * COMMENT.length);
  const bounce = Math.abs(Math.sin((ti - T.ekteb) * 6.2)) * 14;
  return (
    <g>
      {/* bouncing comment icon */}
      <g transform={`translate(104 ${150 - bounce}) scale(0.5)`}>
        <path d="M -150 -110 L 150 -110 Q 180 -110 180 -80 L 180 60 Q 180 90 150 90 L 10 90 L -50 150 L -40 90 L -150 90 Q -180 90 -180 60 L -180 -80 Q -180 -110 -150 -110 Z" fill="#fff" stroke={INK} strokeWidth={18} strokeLinejoin="round" />
        {[-70, 0, 70].map((x, i) => <circle key={i} cx={x} cy={-10 - 16 * Math.max(0, Math.sin((ti - T.ekteb) * 9 - i * 0.9))} r={22} fill={GREY} />)}
      </g>
      {/* the comment box */}
      <g transform={`translate(504 138) scale(${bump(t, T.ana, 0.05)})`}>
        <rect x={-300} y={-62} width={600} height={124} rx={30} fill="#fff" stroke={INK} strokeWidth={10} />
        <circle cx={246} cy={0} r={34} fill="#cfd6dd" stroke={INK} strokeWidth={6} />
        <circle cx={246} cy={-9} r={12} fill={GREY} /><path d="M 224 22 Q 246 -6 268 22" fill={GREY} />
        {n > 0 ? <text x={196} y={19} textAnchor="start" direction="rtl" fontFamily="Cairo" fontWeight={900} fontSize={54} fill={INK}>{COMMENT.slice(0, n)}</text>
          : <rect x={-250} y={-9} width={440} height={18} rx={9} fill="#e3e7ea" />}
        {n === 0 && Math.floor(ti * 3) % 2 === 0 && <rect x={194} y={-28} width={6} height={56} rx={3} fill={INK} />}
      </g>
      {/* replies */}
      {REPLIES.map(([t0, x, y], i) => {
        const s = popIn(t - t0, 0.26);
        return s <= 0.001 ? null : (
          <g key={i} transform={`translate(${x} ${y}) rotate(${(i - 1) * 2 + wobble(t - t0 - 0.26, 3, 6) * 6}) scale(${s})`}>
            <rect x={-128} y={-34} width={256} height={68} rx={22} fill="#ffe9e4" stroke={INK} strokeWidth={8} />
            <text x={96} y={15} textAnchor="start" direction="rtl" fontFamily="Cairo" fontWeight={900} fontSize={42} fill={RED}>كدّاب!</text>
            <g transform={`translate(-84 0) rotate(${Math.sin(ti * 9 + i) * 10})`}><Laugh /></g>
          </g>
        );
      })}
    </g>
  );
};

const Board: React.FC<{t: number; dim: number; hold: number}> = ({t, dim, hold}) => {
  const ti = idle(t);
  let i = 0;
  for (let k = 0; k < SCENES.length; k++) if (t >= SCENES[k][0]) i = k;
  const [start, scene] = SCENES[i];
  const e = i === 0 ? 1 : easeInOut(seg(t, start, start + PUSH));
  const prev = i > 0 && e < 1 ? SCENES[i - 1][1] : null;
  const draw = (s: Scene) => (
    <g>
      {s === 'hook' && <HookScene t={t} ti={ti} />}
      {s === 'cards' && <CardsScene t={t} ti={ti} />}
      {s === 'one' && <OneScene t={t} ti={ti} />}
      {s === 'split1' && <Split1Scene t={t} ti={ti} />}
      {s === 'two' && <TwoScene t={t} ti={ti} />}
      {s === 'split2' && <Split2Scene t={t} ti={ti} />}
      {s === 'three' && <ThreeScene t={t} ti={ti} />}
      {s === 'eyes' && <EyesScene t={t} ti={ti} />}
      {s === 'cta' && <CtaScene t={t} ti={ti} />}
      {s === 'loop' && <HookScene t={t} ti={ti} frozen />}
    </g>
  );
  return (
    <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        <radialGradient id="spot" cx="50%" cy="42%" r="62%">
          <stop offset="0" stopColor="#fff6d8" stopOpacity={0.13} /><stop offset="0.55" stopColor="#fff6d8" stopOpacity={0.03} /><stop offset="1" stopColor="#000" stopOpacity={0.42} />
        </radialGradient>
        <radialGradient id="halo" cx="50%" cy="50%" r="50%">
          <stop offset="0.55" stopColor="#ffe9b0" stopOpacity={0.2} /><stop offset="1" stopColor="#ffe9b0" stopOpacity={0} />
        </radialGradient>
      </defs>
      <g transform={`translate(${BX} ${BY})`}>
        {/* spotlight: a soft warm halo on the wall around the board */}
        <ellipse cx={MID} cy={BH / 2} rx={BW * 0.82} ry={BH * 0.98} fill="url(#halo)" />
        <rect x={-16} y={-16} width={BW + 32} height={BH + 32} rx={26} fill="#8a5a33" stroke={INK} strokeWidth={10} />
        <rect x={0} y={0} width={BW} height={BH} rx={14} fill={BOARD} stroke={INK} strokeWidth={6} />
        <rect x={10} y={10} width={BW - 20} height={BH - 20} rx={10} fill="none" stroke="#ffffff" strokeOpacity={0.05} strokeWidth={8} />
        <defs><clipPath id="boardclip"><rect x={3} y={3} width={BW - 6} height={BH - 6} rx={12} /></clipPath></defs>
        <g clipPath="url(#boardclip)">
          {prev && <g transform={`translate(${-BW * e} 0)`}>{draw(prev)}</g>}
          <g transform={`translate(${BW * (1 - e)} 0)`}>{draw(scene)}</g>
          {/* spotlight on the board: bright middle, dark corners (deeper while a drama pause holds) */}
          <rect x={0} y={0} width={BW} height={BH} fill="url(#spot)" />
          {hold > 0 && <rect x={0} y={0} width={BW} height={BH} fill="url(#spot)" opacity={hold * 0.7} />}
          {/* the previous drawing stays on the board during the signature line, a little darker while he stares */}
          {dim > 0 && <rect x={0} y={0} width={BW} height={BH} fill="#0b1210" opacity={dim * 0.8} />}
        </g>
      </g>
    </svg>
  );
};

// arrows down to the comments, on screen below the caption (he has no pointing-down pose, so the arrows do the pointing)
const DownArrows: React.FC<{t: number}> = ({t}) => {
  const s = showScale(t, T.comments, T.fahman - 0.12, 0.24, 0.14);
  if (s <= 0.001) return null;
  const b = Math.abs(Math.sin((t - T.comments) * 7)) * 22;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      {[392, 664].map((x) => (
        <g key={x} transform={`translate(${x} ${1568 + b}) scale(${s * 1.05})`}>
          <path d="M 0 0 L -52 -60 L -21 -60 L -21 -150 L 21 -150 L 21 -60 L 52 -60 Z" fill={YELLOW} stroke={INK} strokeWidth={10} strokeLinejoin="round" />
        </g>
      ))}
    </svg>
  );
};

// ============================================================ sound
// music: a quiet low suspense bed + soft hits, synthesized by tools/suspense_bed.py (two stems, already at their mix level)
type Cue = [number, string, number];
const TICKS = (t0: number, t1: number, every: number, n: string, v: number): Cue[] => Array.from({length: Math.max(0, Math.floor((t1 - t0) / every))}, (_, i): Cue => [t0 + i * every, n, v]);
const SFX: Cue[] = [
  // hook (soft: the question starts on frame 0)
  [0, 'whoosh', 0.14], [T.taaraf, 'pop', 0.24],
  // three cards, the eyes, the stamp
  [T.fih - 0.1, 'swish', 0.2], ...[0, 1, 2].map((i): Cue => [T.fih + i * 0.24 + 0.2, 'step', 0.3]), [T.wemesh, 'swish', 0.18], [T.wemesh + 0.06, 'pop', 0.24], [T.eineh, 'thud', 0.42],
  // one
  [T.wahed - NUM_LEAD, 'swish', 0.2], [T.wahed + 0.1, 'click', 0.4], [T.hekayto, 'pop', 0.24], ...TICKS(T.hekayto + 0.1, T.zeyada, 0.11, 'step', 0.16), [T.zeyada, 'sparkle', 0.14], [T.lozoom, 'twinkle', 0.16],
  // honest / liar 1
  [T.sadeq1 - 0.1, 'swish', 0.22], [T.byensa, 'pop', 0.24], [T.yerga3, 'swish', 0.18], [T.yesalla7, 'click', 0.36], [T.kalamo1, 'ding', 0.14], [T.hafez, 'pop', 0.22], [T.hafez + 0.3, 'twinkle', 0.14],
  // two
  [T.etneen - NUM_LEAD, 'swish', 0.2], [T.etneen + 0.1, 'click', 0.4], [T.es2alo1, 'pop', 0.24], [T.an2, 'whoosh', 0.16],
  // honest / liar 2
  [T.sadeq2 - 0.1, 'swish', 0.22], [T.asami, 'pop', 0.22], [T.amaken, 'pop', 0.22], [T.te2dar, 'pop', 0.22], ...[0, 1, 2].map((i): Cue => [T.tet2akked + i * 0.14, 'click', 0.3]),
  [T.kalamo2, 'pop', 0.2], [T.ayem, 'bubbles', 0.09],
  // three
  [T.talata - NUM_LEAD, 'swish', 0.2], [T.talata + 0.1, 'click', 0.4], [T.es2alo2, 'pop', 0.22], [T.so2al, 'whoosh', 0.2], [T.baloh, 'boing', 0.2], [T.hayet, 'tremble', 0.16],
  [T.estanna - 0.02, 'stinger', 0.5],
  // the eyes
  [T.hekaya - 0.1, 'swish', 0.22], ...TICKS(T.beyehrab, T.ghalat - 0.1, 0.24, 'step', 0.2), [T.ghalat, 'thud', 0.4], [T.kaddab3 - 0.12, 'swish', 0.16], [T.kaddab3, 'pop', 0.2],
  [T.ayez, 'whoosh', 0.2], [T.yet2akked, 'pop', 0.16], [T.sadda2to, 'ding', 0.2], [T.sadda2to + 0.02, 'sparkle', 0.16],
  // comments
  [T.ekteb - 0.1, 'swish', 0.22], ...TICKS(T.ana, T.kedebt + 0.3, 0.075, 'click', 0.16), [T.weseeb, 'pop', 0.28], [T.elnas, 'pop', 0.28], [T.te2fesh, 'pop', 0.3],
  // ending
  [T.fahman - 0.15, 'swish', 0.24], [T.fahman, 'pop', 0.2], [T.kasban, 'twinkle', 0.34],
];
const POSE_SWAP_SFX: Cue[] = POSES.slice(1).map(([t]) => [t - 0.06, 'swish', 0.08]);

// ============================================================ captions (word for word from the script, tashkeel kept)
// The hook card must be the biggest text in the video: its two lines fill the safe width (91 px), so the other cards
// stay just under it: normal 82, the number cards / "استنى" / the gold ending 88.
const caps = CAPS as unknown as {sizes: number[]; w100: number[]; base: {normal: number; big: number; gold: number}; cards: Record<string, Partial<Group>>};
const PAINT: [string, number, string][] = [
  ['عينيه', 0, RED], ['حافظ', 0, RED], ['عايم', 0, RED], ['هيتلخبط', 0, RED], ['أكتر', 0, RED], ['استنى', 0, RED], ['الغريب', 0, RED],
  ['مظبوطة', 0, YELLOW], ['صدّقته', 0, YELLOW], ['واحد', 0, YELLOW], ['اتنين', 0, YELLOW], ['تلاتة', 0, YELLOW],
  ['أنا', 0, YELLOW], ['عمري', 0, YELLOW], ['ما', 1, YELLOW], ['كدبت', 0, YELLOW],
];
const GROUPS: Group[] = (() => {
  const col: Record<number, string> = {};
  for (const [w, nth, c] of PAINT) col[idx(w, nth)] = c;
  const ws0 = words.map((w, k): Word => ({...w, s: w.s + VO, e: w.e + VO, ...(col[k] ? {c: col[k]} : {})}));
  const out: Group[] = []; let i = 0;
  caps.sizes.forEach((n, k) => {
    const ws = ws0.slice(i, i + n); i += n;
    out.push({words: ws, s: ws[0].s, e: ws[ws.length - 1].e, w100: caps.w100[k], ...(caps.cards[String(k)] ?? {})});
  });
  if (i !== words.length) throw new Error(`caption sizes cover ${i} of ${words.length} words`);
  for (const g of out) {
    if (g.words.every((w) => ['الفهمان', 'كسبان'].includes(nq(w.w)))) g.style = 'gold';
    if (g.style !== 'hook') g.fs = g.fs ?? (g.style === 'big' ? caps.base.big : g.style === 'gold' ? caps.base.gold : caps.base.normal);
  }
  // each caption stays up until the next one starts (also through a drama pause: the last words hang in the air)
  for (let k = 0; k < out.length; k++) {
    const nx = out[k + 1];
    out[k].e = nx ? (nx.s - out[k].e < 1.2 ? nx.s : out[k].e + 0.25) : 1e9;
  }
  // the signature words appear exactly on their pinned audio onsets
  const pin: Record<string, number> = {'استنى': T.estanna, 'الفهمان': T.fahman, 'كسبان': T.kasban};
  for (const g of out) for (const w of g.words) if (pin[nq(w.w)] !== undefined) w.s = pin[nq(w.w)];
  for (const g of out) g.s = g.words[0].s;
  for (let k = 0; k < out.length - 1; k++) out[k].e = Math.min(out[k].e, out[k + 1].s);
  out[0].e = out[1].s; // the hook card holds until line 2 starts
  out[0].s = 0;        // the whole hook question is on screen in frame 0
  return out;
})();

// ============================================================ composition
export const Liar: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam0 = camAt(t, CAM0, CAM_KEYS);
  const sh = shakeAt(t, SHAKES);
  const cam: Cam = {x: cam0.x - sh.x, y: cam0.y - sh.y, z: cam0.z};
  const pose = poseAt(t, POSES);
  // the loop cut (last frame -> frame 0) is a pose swap like any other: it sits at the peak of a squash
  const squash = Math.max(squashAt(t, POSES), t < 0.1 ? Math.cos((t / 0.1) * Math.PI / 2) : 0, t > END - 0.07 ? Math.sin(((t - END + 0.07) / 0.07) * Math.PI / 2) : 0);
  const vf = Math.round((t - VO) * FPS);
  const talking = TALKABLE.includes(pose) && vf >= 0 && vf < MOUTH.length;
  const mouth = talking ? MOUTH[vf] : 0;
  const blink = BLINKS.some((b) => t >= b && t < b + 0.1) && pose !== 'shocked';
  const wink = t >= T.kasban && pose === 'temple'; // wink exactly on "كسبان"
  // signature: dim the room while he stares
  const sig = t >= T.estanna - 0.02 && t < T.hekaya ? 0.3 * easeOut(seg(t, T.estanna - 0.02, T.estanna + 0.12)) * (1 - seg(t, T.hekaya - 0.3, T.hekaya)) : 0;
  const hold = inDrama(t);
  const ROOM = 0.25; // the suspense mood: the set is about 25% darker than usual for the whole video
  return (
    <AbsoluteFill style={{backgroundColor: '#140e0b'}}>
      <Fonts />
      <SetBack cam={cam} dim={ROOM + sig + hold * 0.1} />
      <Layer cam={cam} z={1000}>
        <Board t={t} dim={sig / 0.3 * 0.38} hold={hold} />
        <Character pose={pose} mouth={mouth} blink={blink} wink={wink} x={CHAR_X} y={CHAR_Y} scale={CS} squash={squash} t={t}>
          <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
            {wink && <Sparkle x={HEAD[0] + 210} y={HEAD[1] - 40} dt={t - T.kasban} r={48} />}
          </svg>
        </Character>
      </Layer>
      <SetFront cam={cam} dim={ROOM + sig + hold * 0.1} />
      {/* soft vignette: the light stays on the board and on him, the corners fall off (deeper in the signature line and the drama pauses) */}
      <AbsoluteFill style={{background: `radial-gradient(ellipse 78% 62% at 50% 36%, rgba(0,0,0,0) 52%, rgba(0,0,0,${0.5 + sig * 0.6 + hold * 0.14}) 100%)`}} />
      <DownArrows t={t} />
      {/* captions at ~65% of the frame height: clear of the Shorts/TikTok channel name, title and buttons */}
      <Captions t={t} groups={GROUPS} colors={{}} y={1250} x={460} />
      <Sequence from={Math.round(VO * FPS)}><Audio src={staticFile('elfahman/liar/vo/vo.mp3')} volume={1} /></Sequence>
      <Audio src={staticFile('elfahman/liar/music/bed.wav')} volume={1} />
      <Audio src={staticFile('elfahman/liar/music/hits.wav')} volume={1} />
      {[...SFX, ...POSE_SWAP_SFX].map(([tt, n, v], i) => (
        <Sequence key={i} from={Math.max(0, Math.round(tt * FPS))} durationInFrames={Math.round(1.6 * FPS)}>
          <Audio src={staticFile(`elfahman/sfx/${n}.wav`)} volume={v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
