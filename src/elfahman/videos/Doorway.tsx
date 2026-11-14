import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Fonts} from '../lib/fonts';
import {FPS, clamp, easeIn, easeInOut, easeOut, lerp, popIn, popOut, seg, wobble} from '../lib/anim';
import {Cam, CamKey, Layer, camAt, shakeAt} from '../lib/camera';
import {SetBack, SetFront, DESK_SCREEN_Y} from '../lib/Set';
import {CANVAS, Character, HEAD, Pose, PoseKey, blinkTimes, mouthStates, poseAt, squashAt} from '../lib/Character';
import {Captions, Group, RED, YELLOW, Word, norm} from '../lib/Captions';
import {INK, Sparkle, Star, SweatDrop, showScale} from '../lib/fx';
import WORDS from './doorway.words.json';
import ENV from './doorway.env.json';
import CAPS from './doorway.captions.json';

// Episode 03: the doorway effect ("تأثير الباب"). Every prop is drawn in code: no generated pictures.

// ============================================================ timing
// voice (ElevenLabs eleven_v4, voice "Fodoly", one take) placed at VO seconds; word times from ElevenLabs Scribe
const VO = 0.15;
const words = WORDS as Word[];
const at = (w: string, nth = 0) => {
  const hits = words.filter((x) => norm(x.w) === norm(w));
  if (!hits[nth]) throw new Error(`word not found: ${w} #${nth}`);
  return hits[nth].s + VO;
};
const VOICE_END = words[words.length - 1].e + VO;
export const DOORWAY_DURATION_S = Math.round((VOICE_END + 0.7) * FPS) / FPS;

const T = {
  omrak: at('عمرك'), dakhalt: at('دخلت'), oda: at('أوضة'), wenset: at('ونسيت'), leh: at('ليه'),
  enta2: at('إنت', 1), mesh: at('مش'), lewahdak: at('لوحدك'), wessabab: at('والسبب'), bab1: at('الباب'), nafso: at('نفسه'),
  olama: at('علماء'), amrika: at('أمريكا'), khallo: at('خلوا'), nas: at('ناس'), temshi: at('تمشي'), nafs: at('نفس'), masafa: at('المسافة'),
  marra1: at('مرة'), wahda: at('واحدة'), wamarra: at('ومرة'), bab2: at('باب'),
  elli: at('اللي'), addo: at('عدوا'), elbab2: at('الباب', 1), nesyo: at('نسيوا'), aktar: at('أكتر'),
  asl: at('أصل'), mokhak: at('مخك'), elbab3: at('الباب', 2), nehaya: at('نهاية'), mashhad: at('مشهد'),
  fabye2fel: at('فبيقفل'), qadeem: at('القديم'), yeftah: at('ويفتح'), malaf: at('ملف'), gedeed: at('جديد'),
  estanna: at('استنى'),
  da2: at('ده', 1), hasal: at('حصل'), abwab: at('أبواب'), shasha: at('شاشة'), computer: at('كمبيوتر'), zay: at('زي'), le3ba: at('لعبة'),
  mahadesh: at('ومحدش'), makano: at('مكانه'),
  bas: at('بس'), olama2: at('علماء', 1), ostralya: at('أستراليا'), elbab4: at('الباب', 3), mesh2: at('مش', 1), kefaya: at('كفاية'),
  da3: at('ده', 2), beyehsal: at('بيحصل'), demaghak: at('دماغك'), mashghoola: at('مشغولة'), bekaza: at('بكذا'), haga: at('حاجة'), elwa2t: at('الوقت'),
  ya3ni: at('يعني'), elmarra: at('المرة'), karrar: at('كرر'), mashi: at('ماشي'),
  akher: at('آخر'), dakhalt2: at('دخلت', 1), wenset2: at('ونسيت', 1), kont: at('كنت'), rayeh: at('رايح'), tegeeb: at('تجيب'), eh: at('إيه'),
  ekteb: at('اكتبلي'), comments: at('الكومنتات'),
  fahman: at('الفهمان'), kasban: at('كسبان'),
};
// signature moments pinned to the measured audio onsets (voice level envelope), not just the transcript
T.estanna = 21.48 + VO; T.fahman = 42.58 + VO; T.kasban = 43.35 + VO;
const END = DOORWAY_DURATION_S;

// ============================================================ character
const TALKABLE: Pose[] = ['hero', 'explain', 'point_up', 'thinking', 'temple', 'thumbs_up', 'worried'];
const POSES: PoseKey[] = [
  [0, 'temple'],            // first frames match the last frame (loop)
  [VO, 'thinking'],         // hook: "ever walked into a room and forgot why?"
  [T.enta2, 'explain'],
  [T.bab1, 'point_up'],     // idea: "...the door itself!"
  [T.olama, 'hero'],
  [T.marra1, 'explain'],
  [T.elli, 'hero'],
  [T.nesyo, 'worried'],     // "they forgot more"
  [T.asl, 'explain'],
  [T.yeftah, 'hero'],
  [T.estanna, 'shocked'],   // signature line: shocked stare exactly on "استنى"
  [T.da2, 'hero'],
  [T.shasha, 'explain'],
  [T.mahadesh, 'thinking'],
  [T.bas, 'point_up'],
  [T.mesh2, 'hero'],
  [T.da3, 'explain'],       // explaining with both hands while the brain juggles
  [T.ya3ni, 'hero'],
  [T.karrar, 'point_up'],
  [T.mashi, 'thumbs_up'],   // he walks through still holding the thought
  [T.akher, 'thinking'],
  [T.ekteb, 'explain'],     // open hands to the viewer + arrows down to the comments
  [T.fahman, 'temple'],     // ending: hand on temple exactly on "الفهمان"
];
const MOUTH = mouthStates((ENV as {level: number[]}).level);
const BLINKS = blinkTimes(END);
const winkOn = (t: number) => t < VO - 0.02 || t >= T.kasban; // wink exactly on "كسبان" (and the looped first frames)

const CS = 0.6; // character canvas px -> world px
const CHAR_X = 540 - (CANVAS[0] * CS) / 2;
const CHAR_Y = DESK_SCREEN_Y - 1450 * CS; // pocket line sits on the desk edge
const FACE = {x: CHAR_X + HEAD[0] * CS, y: CHAR_Y + HEAD[1] * CS};

// ============================================================ camera
const CAM0: Cam = {x: 520, y: 860, z: 180};
const CAM_KEYS: CamKey[] = [
  [VO, 1.1, {x: 512, y: 872, z: 120}], // small pull-back while the stick figure walks in
  [T.wessabab - 0.1, T.wessabab + 0.5, {x: 502, y: 806, z: 168}], // drift up to the door
  [T.olama - 0.1, T.olama + 0.4, {x: 512, y: 866, z: 130}],
  [T.nesyo - 0.04, T.nesyo + 0.22, {x: 506, y: 832, z: 166}],
  [T.asl - 0.1, T.asl + 0.4, {x: 512, y: 866, z: 125}],
  [T.estanna - 0.04, T.estanna + 0.1, {x: 540, y: FACE.y + 20, z: 380}], // punch-in exactly on "استنى"
  [T.da2 - 0.1, T.da2 + 0.4, {x: 512, y: 866, z: 130}],
  [T.mahadesh - 0.1, T.mahadesh + 0.4, {x: 508, y: 840, z: 160}],
  [T.bas - 0.1, T.bas + 0.4, {x: 512, y: 866, z: 125}],
  [T.ya3ni - 0.1, T.ya3ni + 0.4, {x: 510, y: 852, z: 150}],
  [T.akher - 0.1, T.akher + 0.4, {x: 512, y: 866, z: 125}],
  [T.fahman - 0.1, T.fahman + 0.5, CAM0], // ends on the opening framing -> seamless loop
];
const SHAKES: [number, number, number][] = [[T.estanna, 16, 6], [T.wamarra + 0.14, 4, 11], [T.nesyo, 5, 9], [T.fabye2fel + 0.08, 9, 9], [T.mesh2, 4, 11]];

// ============================================================ drawing kit (all code)
const BOARD = '#21302b', HALL = '#4f7cac', ROOM = '#f0b45c', FLOOR = '#8a5a33', WALLC = '#f3e3bf';
const DOOR = '#b5523c', DOOR_D = '#8f3d2c', KNOB = '#ffd23f', GREEN = '#43a85a', PINK = '#f4a6b8', PINK_D = '#d9748c', CHALK = '#fdf6e8';
type Mood = 'ok' | 'confused' | 'happy';

// small stick figure; (x, y) = feet. ph = walk cycle phase, walk = 0 standing .. 1 walking
const Stick: React.FC<{x: number; y: number; s?: number; ph?: number; walk?: number; dir?: number; mood?: Mood; scratch?: number; wig?: number}> =
({x, y, s = 1, ph = 0, walk = 0, dir = 1, mood = 'ok', scratch = 0, wig = 0}) => {
  const a = Math.sin(ph) * 0.52 * walk + 0.13 * (1 - walk); // small stance when standing
  const bob = -Math.abs(Math.cos(ph)) * 5 * walk;
  const hy = -80 + bob, ny = -140 + bob, sy = -128 + bob, hd = -170 + bob, L = 82, A = 60;
  const b1 = -a * 1.1 + 0.12, b2 = a * 1.1 - 0.12;
  const ex = lerp(Math.sin(b2) * A * 0.5, 34, scratch), ey = lerp(sy + Math.cos(b2) * A * 0.5, sy - 16, scratch);
  const hx = lerp(Math.sin(b2) * A, 20 + wig * 6, scratch), hyy = lerp(sy + Math.cos(b2) * A, hd - 30, scratch);
  const d = `M 0 ${hy} L ${Math.sin(a) * L} ${hy + Math.cos(a) * L} M 0 ${hy} L ${-Math.sin(a) * L} ${hy + Math.cos(a) * L} M 0 ${hy} L 0 ${ny}` +
    ` M 0 ${sy} L ${Math.sin(b1) * A} ${sy + Math.cos(b1) * A} M 0 ${sy} L ${ex} ${ey} L ${hx} ${hyy}`;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * dir} ${s})`}>
      <path d={d} stroke={INK} strokeWidth={21} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={0} cy={hd} r={29} fill={CHALK} stroke={INK} strokeWidth={6.5} />
      <path d={d} stroke={CHALK} strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={2} cy={hd - 4} r={3.8} fill={INK} /><circle cx={17} cy={hd - 4} r={3.8} fill={INK} />
      {mood === 'ok' && <path d={`M 5 ${hd + 11} l 11 0`} stroke={INK} strokeWidth={4} strokeLinecap="round" />}
      {mood === 'happy' && <path d={`M 2 ${hd + 8} q 8 10 17 0`} stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />}
      {mood === 'confused' && <g>
        <path d={`M -6 ${hd - 16} l 10 4 M 13 ${hd - 13} l 10 -5`} stroke={INK} strokeWidth={4} strokeLinecap="round" />
        <path d={`M 3 ${hd + 12} q 4 -5 8 0 q 4 5 8 0`} stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
      </g>}
    </g>
  );
};
const walkPh = (x: number, s: number) => (x / (78 * s)) * Math.PI;

type IconK = 'key' | 'phone' | 'clock' | 'cup';
const Icon: React.FC<{k: IconK}> = ({k}) => {
  if (k === 'key') {
    const d = 'M -6 0 L 42 0 M 26 0 L 26 15 M 40 0 L 40 15';
    return <g>
      <circle cx={-24} cy={0} r={17} fill="none" stroke={INK} strokeWidth={20} /><path d={d} stroke={INK} strokeWidth={20} fill="none" strokeLinecap="round" />
      <circle cx={-24} cy={0} r={17} fill="none" stroke={KNOB} strokeWidth={10} /><path d={d} stroke={KNOB} strokeWidth={10} fill="none" strokeLinecap="round" />
    </g>;
  }
  if (k === 'phone') return <g>
    <rect x={-24} y={-40} width={48} height={80} rx={10} fill="#39424e" stroke={INK} strokeWidth={6} />
    <rect x={-17} y={-31} width={34} height={54} rx={3} fill="#8fd6ff" /><circle cx={0} cy={31} r={4} fill="#cfd6dd" />
  </g>;
  if (k === 'clock') return <g>
    <circle r={36} fill="#fffbe6" stroke={INK} strokeWidth={7} />
    <path d="M 0 0 L 0 -22 M 0 0 L 15 8" stroke={INK} strokeWidth={6} strokeLinecap="round" /><circle r={4} fill={RED} />
  </g>;
  return <g>
    <path d="M 22 -12 q 26 0 26 16 q 0 16 -26 16" fill="none" stroke={INK} strokeWidth={8} />
    <path d="M -28 -24 L 24 -24 L 20 22 Q 19 32 9 32 L -13 32 Q -23 32 -24 22 Z" fill="#ff8a5c" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M -12 -36 q -6 -8 0 -16 M 6 -36 q -6 -8 0 -16" stroke="#fff" strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.85} />
  </g>;
};

// thought bubble; tail = unit direction from the bubble towards the head
const Bubble: React.FC<{x: number; y: number; r: number; s: number; tail?: [number, number]; children?: React.ReactNode}> =
({x, y, r, s, tail = [0.5, 0.87], children}) => s <= 0.001 ? null : (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle cx={tail[0] * r * 1.85} cy={tail[1] * r * 1.85} r={r * 0.13} fill="#fff" stroke={INK} strokeWidth={5} />
    <circle cx={tail[0] * r * 1.38} cy={tail[1] * r * 1.38} r={r * 0.22} fill="#fff" stroke={INK} strokeWidth={5.5} />
    <ellipse rx={r * 1.18} ry={r} fill="#fff" stroke={INK} strokeWidth={7} />
    {children}
  </g>
);
// bubble scale: pops in at t0, swells and bursts at tp
const bubbleScale = (t: number, t0: number, tp: number) => t < t0 ? 0 : t < tp ? popIn(t - t0, 0.24) : t - tp < 0.06 ? 1 + ((t - tp) / 0.06) * 0.32 : 0;
const Burst: React.FC<{x: number; y: number; r: number; dt: number}> = ({x, y, r, dt}) => {
  if (dt < 0.04 || dt > 0.4) return null;
  const u = (dt - 0.04) / 0.36;
  return (
    <g transform={`translate(${x} ${y})`} opacity={1 - u * u}>
      {Array.from({length: 9}, (_, i) => {
        const a = (i / 9) * Math.PI * 2 + 0.3, r0 = r * (0.8 + 0.9 * easeOut(u)), r1 = r0 + r * 0.42 * (1 - u * 0.5);
        const p = `M ${Math.cos(a) * r0} ${Math.sin(a) * r0} L ${Math.cos(a) * r1} ${Math.sin(a) * r1}`;
        return <g key={i}><path d={p} stroke={INK} strokeWidth={12} strokeLinecap="round" /><path d={p} stroke={i % 2 ? '#fff' : RED} strokeWidth={6} strokeLinecap="round" /></g>;
      })}
    </g>
  );
};

const QMark: React.FC<{x: number; y: number; size: number; s: number; rot?: number; fill?: string}> = ({x, y, size, s, rot = 0, fill = RED}) => s <= 0.001 ? null : (
  <text x={x} y={y} textAnchor="middle" fontFamily="Cairo" fontWeight={900} fontSize={size * s} fill={fill} stroke={INK} strokeWidth={size * 0.1 * s}
    strokeLinejoin="round" paintOrder="stroke" transform={`rotate(${rot} ${x} ${y - size * 0.3})`}>؟</text>
);
// arrow with its tip at (x, y), pointing down when rot = 0
const Arrow: React.FC<{x: number; y: number; rot?: number; s: number; fill?: string}> = ({x, y, rot = 0, s, fill = RED}) => s <= 0.001 ? null : (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M 0 0 L -46 -54 L -19 -54 L -19 -150 L 19 -150 L 19 -54 L 46 -54 Z" fill={fill} stroke={INK} strokeWidth={9} strokeLinejoin="round" />
  </g>
);
const Check: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => s <= 0.001 ? null : (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle r={30} fill={GREEN} stroke={INK} strokeWidth={7} />
    <path d="M -14 0 l 10 11 l 18 -22" stroke="#fff" strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

// cut-away room(s): one long room, or two rooms split by a wall with a door that swings open towards the viewer
type RoomP = {x: number; y: number; w: number; h: number; fl: number; wall?: number; dh?: number};
const Rooms: React.FC<{id: string; p: RoomP; open?: number; glow?: number; split?: number; drop?: number; lamp?: boolean; dimmed?: number}> =
({id, p, open = 0, glow = 0, split = 1, drop = 1, lamp = false, dimmed = 0}) => {
  const {x, y, w, h, fl, wall} = p, fy = y + h - fl, dh = p.dh ?? 0, DW = dh * 0.48, WT = Math.max(14, dh * 0.085);
  const sx = Math.max(0.09, Math.sin(clamp(open, 0, 1.12) * 1.4));
  const hx = wall === undefined ? 0 : wall - (DW * 0.045) * (1 - clamp(open * 4));
  return (
    <g>
      <defs><clipPath id={id}><rect x={x} y={y} width={w} height={h} rx={16} /></clipPath></defs>
      <g clipPath={`url(#${id})`}>
        <rect x={x} y={y} width={w} height={h} fill={HALL} />
        {wall !== undefined && <rect x={wall} y={y} width={x + w - wall} height={h} fill={ROOM} opacity={split} />}
        {lamp && wall !== undefined && <g transform={`translate(${wall + (x + w - wall) * 0.8} ${y})`}>
          <path d="M 0 0 L 0 34" stroke={INK} strokeWidth={5} />
          <path d="M -30 62 L -16 32 L 16 32 L 30 62 Z" fill="#fff3d6" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          <circle cx={0} cy={66} r={9} fill={KNOB} stroke={INK} strokeWidth={4} />
        </g>}
        <rect x={x} y={fy} width={w} height={fl} fill={FLOOR} />
        <path d={`M ${x} ${fy} L ${x + w} ${fy}`} stroke={INK} strokeWidth={6} />
        {wall !== undefined && (
          <g transform={`translate(0 ${-(1 - drop) * (h + 30)})`}>
            {glow > 0 && [46, 30, 16].map((g, i) => (
              <rect key={i} x={wall - WT / 2 - g / 2} y={fy - dh - g / 2} width={WT + DW * sx + g} height={dh + g} rx={g / 2 + 6} fill={YELLOW} opacity={glow * [0.16, 0.24, 0.34][i]} />
            ))}
            <rect x={wall - WT / 2} y={y - 12} width={WT} height={fy - dh - y + 12} fill={WALLC} stroke={INK} strokeWidth={6} />
            <g transform={`matrix(${sx} ${0.1 * sx} 0 1 ${hx} ${fy - dh})`}>
              <rect x={0} y={0} width={DW} height={dh} rx={4} fill={DOOR} stroke={INK} strokeWidth={6} vectorEffect="non-scaling-stroke" />
              <rect x={DW * 0.16} y={dh * 0.08} width={DW * 0.68} height={dh * 0.36} fill="none" stroke={DOOR_D} strokeWidth={5} vectorEffect="non-scaling-stroke" />
              <rect x={DW * 0.16} y={dh * 0.54} width={DW * 0.68} height={dh * 0.38} fill="none" stroke={DOOR_D} strokeWidth={5} vectorEffect="non-scaling-stroke" />
              <ellipse cx={DW * 0.84} cy={dh * 0.5} rx={dh * 0.034 / Math.max(sx, 0.3)} ry={dh * 0.034} fill={KNOB} stroke={INK} strokeWidth={3.5} vectorEffect="non-scaling-stroke" />
            </g>
          </g>
        )}
        {dimmed > 0 && <rect x={x} y={y} width={w} height={h} fill="#0b1210" opacity={dimmed} />}
      </g>
      <rect x={x} y={y} width={w} height={h} rx={16} fill="none" stroke={INK} strokeWidth={9} />
    </g>
  );
};

// front-view door in its frame (open = 0 shut .. 1 ajar)
const DoorFront: React.FC<{open: number}> = ({open}) => (
  <g>
    <rect x={-84} y={-164} width={168} height={324} rx={8} fill={WALLC} stroke={INK} strokeWidth={8} />
    <rect x={-64} y={-144} width={128} height={304} fill="#2a1a12" stroke={INK} strokeWidth={6} />
    <g transform={`translate(-64 -144) scale(${lerp(1, 0.3, clamp(open, 0, 1.1))} 1)`}>
      <rect width={128} height={304} fill={DOOR} stroke={INK} strokeWidth={6} vectorEffect="non-scaling-stroke" />
      <rect x={18} y={22} width={92} height={112} fill="none" stroke={DOOR_D} strokeWidth={6} vectorEffect="non-scaling-stroke" />
      <rect x={18} y={160} width={92} height={120} fill="none" stroke={DOOR_D} strokeWidth={6} vectorEffect="non-scaling-stroke" />
      <circle cx={106} cy={152} r={10} fill={KNOB} stroke={INK} strokeWidth={5} vectorEffect="non-scaling-stroke" />
    </g>
    <rect x={-96} y={156} width={192} height={13} rx={5} fill={FLOOR} stroke={INK} strokeWidth={5} />
  </g>
);

const Folder: React.FC<{open: number; label: string; papers?: boolean}> = ({open, label, papers = false}) => {
  const o = clamp(open, 0, 1.15);
  return (
    <g>
      <path d="M -130 -80 L -130 -106 Q -130 -118 -118 -118 L -52 -118 Q -42 -118 -36 -108 L -26 -92 L 118 -92 Q 130 -92 130 -80 L 130 80 Q 130 92 118 92 L -118 92 Q -130 92 -130 80 Z"
        fill="#c98a1e" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
      {papers && <g transform={`translate(0 ${lerp(48, -32, o)})`}>
        <rect x={-104} y={-108} width={150} height={150} rx={6} fill="#fff" stroke={INK} strokeWidth={6} transform="rotate(-5)" />
        <rect x={-36} y={-112} width={150} height={150} rx={6} fill={CHALK} stroke={INK} strokeWidth={6} transform="rotate(4)" />
        <g transform="translate(46 -76) scale(0.62)"><Icon k="key" /></g>
        <path d="M -84 -84 l 50 -4 M -84 -66 l 36 -3" stroke="#8a949c" strokeWidth={7} strokeLinecap="round" />
      </g>}
      <g transform={`translate(0 92) skewX(${-15 * o}) scale(1 ${1 - 0.3 * o}) translate(0 -92)`}>
        <rect x={-130} y={-70} width={260} height={162} rx={12} fill="#f5c04a" stroke={INK} strokeWidth={9} />
        <rect x={-88} y={-24} width={176} height={70} rx={10} fill="#fff" stroke={INK} strokeWidth={6} />
        <text x={0} y={28} textAnchor="middle" direction="rtl" fontFamily="Cairo" fontWeight={900} fontSize={46} fill={INK}>{label}</text>
      </g>
    </g>
  );
};

const BR: [number, number, number][] = [[-72, -8, 46], [-44, -50, 44], [6, -66, 46], [56, -46, 44], [84, 0, 40], [54, 40, 42], [2, 50, 44], [-50, 38, 42], [4, -6, 60]];
const Brain: React.FC<{mood?: Mood; arms?: number; t?: number; look?: number}> = ({mood = 'ok', arms = 0, t = 0, look = 0}) => (
  <g>
    {arms > 0 && [-1, 1].map((sd) => {
      const hx = sd * 168, hy = -64 + Math.sin(t * 2 * Math.PI * 1.2 + (sd > 0 ? 0 : Math.PI)) * 16;
      const d = `M ${sd * 90} 16 Q ${sd * 168} 44 ${hx} ${hy}`;
      return <g key={sd} opacity={clamp(arms)}>
        <path d={d} stroke={INK} strokeWidth={23} fill="none" strokeLinecap="round" /><path d={d} stroke={PINK} strokeWidth={11} fill="none" strokeLinecap="round" />
        <circle cx={hx} cy={hy} r={16} fill={PINK} stroke={INK} strokeWidth={6} />
      </g>;
    })}
    <rect x={12} y={64} width={44} height={52} rx={14} fill={PINK_D} stroke={INK} strokeWidth={9} transform="rotate(-12 34 80)" />
    {BR.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={PINK} stroke={INK} strokeWidth={18} />)}
    {BR.map(([x, y, r], i) => <circle key={`f${i}`} cx={x} cy={y} r={r} fill={PINK} />)}
    <path d="M 6 -110 Q -10 -84 2 -58 M -92 -34 q 22 -16 38 4 M -34 -88 q 4 20 26 18 M 44 -86 q -6 18 16 26 M 92 -30 q -20 -2 -28 16 M -96 22 q 18 12 34 -4 M 64 70 q -8 -20 14 -30 M -44 76 q 2 -20 26 -20"
      stroke={PINK_D} strokeWidth={8} fill="none" strokeLinecap="round" />
    <circle cx={-26} cy={-4} r={15} fill="#fff" stroke={INK} strokeWidth={5} /><circle cx={30} cy={-4} r={15} fill="#fff" stroke={INK} strokeWidth={5} />
    <circle cx={-26 + look * 5} cy={-4 - (mood === 'ok' ? 3 : 0)} r={6.5} fill={INK} /><circle cx={30 + look * 5} cy={-4 - (mood === 'ok' ? 3 : 0)} r={6.5} fill={INK} />
    {mood === 'confused' ? <ellipse cx={2} cy={34} rx={9} ry={11} fill={INK} /> :
      <path d={mood === 'happy' ? 'M -16 26 q 18 20 36 0' : 'M -12 30 q 14 10 28 0'} stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />}
  </g>
);

const Clipboard: React.FC = () => (
  <g>
    <rect x={-74} y={-92} width={148} height={192} rx={14} fill="#b9814a" stroke={INK} strokeWidth={9} />
    <rect x={-58} y={-68} width={116} height={152} rx={6} fill="#fff" stroke={INK} strokeWidth={6} />
    <rect x={-34} y={-110} width={68} height={36} rx={10} fill="#cfd6dd" stroke={INK} strokeWidth={7} />
    {[0, 1, 2].map((i) => <g key={i}>
      <path d={`M -44 ${-36 + i * 42} l 9 9 l 15 -18`} stroke={GREEN} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M -6 ${-34 + i * 42} L 42 ${-34 + i * 42}`} stroke="#8a949c" strokeWidth={9} strokeLinecap="round" />
    </g>)}
  </g>
);
const FlagUS: React.FC = () => (
  <g>
    <defs><clipPath id="usclip"><rect x={-120} y={-72} width={240} height={144} rx={10} /></clipPath></defs>
    <g clipPath="url(#usclip)">
      <rect x={-120} y={-72} width={240} height={144} fill="#fff" />
      {[0, 2, 4, 6].map((i) => <rect key={i} x={-120} y={-72 + (i * 144) / 7} width={240} height={144 / 7 + 0.5} fill="#d8392f" />)}
      <rect x={-120} y={-72} width={110} height={(144 / 7) * 4} fill="#24408e" />
      {[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => <circle key={`${r}${c}`} cx={-104 + c * 26} cy={-58 + r * 26} r={5.5} fill="#fff" />))}
    </g>
    <rect x={-120} y={-72} width={240} height={144} rx={10} fill="none" stroke={INK} strokeWidth={10} />
  </g>
);
const FlagAU: React.FC = () => (
  <g>
    <defs><clipPath id="auclip"><rect x={-120} y={-72} width={240} height={144} rx={10} /></clipPath><clipPath id="aujack"><rect x={-120} y={-72} width={110} height={70} /></clipPath></defs>
    <g clipPath="url(#auclip)">
      <rect x={-120} y={-72} width={240} height={144} fill="#24408e" />
      <g clipPath="url(#aujack)">
        <path d="M -120 -72 L -10 -2 M -10 -72 L -120 -2" stroke="#fff" strokeWidth={16} /><path d="M -120 -72 L -10 -2 M -10 -72 L -120 -2" stroke="#d8392f" strokeWidth={6} />
        <path d="M -65 -72 L -65 -2 M -120 -37 L -10 -37" stroke="#fff" strokeWidth={24} /><path d="M -65 -72 L -65 -2 M -120 -37 L -10 -37" stroke="#d8392f" strokeWidth={13} />
      </g>
      <Star x={-65} y={36} r={24} fill="#fff" />
      {[[62, -44, 13], [96, -6, 13], [60, 46, 13], [30, 2, 13], [78, 18, 8]].map(([sx, sy, r], i) => <Star key={i} x={sx} y={sy} r={r} fill="#fff" />)}
    </g>
    <rect x={-120} y={-72} width={240} height={144} rx={10} fill="none" stroke={INK} strokeWidth={10} />
  </g>
);

// ============================================================ board (chalkboard inset above his head)
const BX = 80, BY = 84, BW = 860, BH = 480;
type Scene = 'hook' | 'split' | 'brain' | 'computer' | 'juggle' | 'repeat' | 'ask' | 'loop';
const SCENES: [number, Scene | null][] = [
  [0, 'hook'], [T.olama - 0.1, 'split'], [T.asl - 0.08, 'brain'], [T.estanna - 0.12, null], [T.da2 - 0.1, 'computer'],
  [T.bas - 0.08, 'juggle'], [T.ya3ni - 0.08, 'repeat'], [T.akher - 0.08, 'ask'], [T.fahman - 0.15, 'loop'],
];
const sceneAt = (t: number) => {
  let cur: [number, Scene | null] = SCENES[0], prev: [number, Scene | null] | null = null;
  for (const s of SCENES) if (t >= s[0]) { prev = cur; cur = s; }
  return {scene: cur[1], since: t - cur[0], start: cur[0], prev: prev?.[1] ?? null};
};

// ---- 1 + 2. hook: the door swings open from frame 1, he walks in, stops, "؟"; then the arrow lands on the door
const HR: RoomP = {x: 20, y: 26, w: 820, h: 428, fl: 64, wall: 400, dh: 262};
const HFY = HR.y + HR.h - HR.fl, HFEET = HFY + 20;
const HOOK_STOP = 1.62, HS = 1.14;
const Hook: React.FC<{t: number; frozen?: boolean}> = ({t, frozen = false}) => {
  // frozen = the closing shot (door shut, empty room): the last frame hands over to frame 1, where the door starts to swing
  if (frozen) return <Rooms id="hookclip" p={HR} open={0} lamp />;
  const open = easeOut(seg(t, 0, 0.4)) * (1 + wobble(t - 0.4, 3, 7) * 0.08) + (t >= T.nafso ? wobble(t - T.nafso, 5, 5) * 0.12 : 0);
  const fx = lerp(-34, 610, seg(t, 0, HOOK_STOP));
  const walk = 1 - seg(t, HOOK_STOP - 0.12, HOOK_STOP + 0.06);
  const scr = easeOut(seg(t, T.wenset - 0.04, T.wenset + 0.2));
  const q = popIn(t - T.wenset, 0.26);
  const qrot = wobble(t - T.wenset - 0.26, 2.5, 4) * 14 + (t >= T.leh ? wobble(t - T.leh, 3, 3.5) * 18 : 0);
  const turned = t >= T.wessabab + 0.25;
  const others: [number, number][] = [[724, T.enta2], [806, T.mesh]];
  const glow = t >= T.bab1 ? (0.75 + 0.25 * Math.sin((t - T.bab1) * 11)) * easeOut(seg(t, T.bab1, T.bab1 + 0.15)) : 0;
  const ab = t >= T.bab1 ? Math.abs(Math.sin((t - T.bab1 - 0.24) * 6.5)) * 15 * (t > T.bab1 + 0.24 ? 1 : 0) : 0;
  return (
    <g>
      <Rooms id="hookclip" p={HR} open={open} glow={glow} lamp />
      <g clipPath="url(#hookclip)">
        <ellipse cx={fx} cy={HFEET + 4} rx={50} ry={10} fill="#000" opacity={0.22} />
        <Stick x={fx} y={HFEET} s={HS} ph={walkPh(fx, HS)} walk={walk} dir={turned ? -1 : 1} mood={t >= T.wenset - 0.05 ? 'confused' : 'ok'}
          scratch={scr} wig={Math.sin(t * 16)} />
        {others.map(([ox, ot], i) => {
          const s = showScale(t, ot, T.wessabab - 0.06);
          return s <= 0.001 ? null : <Stick key={i} x={ox} y={HFEET - 6 + i * 10} s={0.8 * s} dir={i ? -1 : 1} mood="confused" scratch={i ? 0 : 1} wig={Math.sin(t * 14 + 2)} />;
        })}
      </g>
      {others.map(([ox, ot], i) => <QMark key={i} x={ox} y={HFEET - 176 + i * 10} size={84} s={showScale(t, ot + 0.08, T.wessabab - 0.06)} rot={wobble(t - ot - 0.3, 2.5, 4) * 14} />)}
      <QMark x={fx + (turned ? 6 : -6)} y={HFEET - 252} size={160} s={q} rot={qrot} />
      <Arrow x={356 - ab * 0.77} y={226 - ab * 0.64} rot={-50} s={popIn(t - T.bab1, 0.22) * 1.25} />
      <Sparkle x={470} y={96} dt={t - T.nafso} r={34} />
      <Sparkle x={330} y={330} dt={t - T.nafso - 0.14} r={26} />
    </g>
  );
};

// ---- 3 + 4. split screen: same distance, one long room vs through a door; the thought pops at the door
const SA: RoomP = {x: 30, y: 14, w: 800, h: 200, fl: 32};
const SB: RoomP = {x: 30, y: 266, w: 800, h: 200, fl: 32, wall: 430, dh: 142};
const FA = SA.y + SA.h - SA.fl + 9, FB = SB.y + SB.h - SB.fl + 9, X0 = 90, X1 = 770, FS = 0.63;
const VA = 283, TA_END = T.marra1 + (X1 - X0) / VA;                 // top figure: starts on "مرة", same speed as the bottom one
const VB = (430 - X0) / (T.nesyo - T.elli);                         // bottom figure: starts on "اللي", is in the doorway exactly on "نِسْيوا"
const BSTOP = 430 + VB * (T.aktar - T.nesyo);
const Split: React.FC<{t: number}> = ({t}) => {
  const clip = showScale(t, T.olama, T.khallo - 0.12), flag = showScale(t, T.amrika, T.khallo - 0.12);
  const sa = popIn(t - T.khallo, 0.28), sb = popIn(t - T.nas, 0.28), fig = popIn(t - T.temshi, 0.24);
  const ax = clamp(X0 + VA * (t - T.marra1), X0, X1), aWalk = t >= T.marra1 && t < TA_END ? 1 : 0;
  const bx = clamp(X0 + VB * (t - T.elli), X0, BSTOP), bWalk = t >= T.elli && bx < BSTOP ? 1 : 0;
  const drop = t < T.wamarra ? 0 : easeIn(seg(t, T.wamarra, T.wamarra + 0.14)) + wobble(t - T.wamarra - 0.14, 5, 9) * 0.03;
  const split = seg(t, T.wamarra + 0.14, T.wamarra + 0.4);
  const open = easeOut(seg(t, T.bab2, T.bab2 + 0.34)) * (1 + wobble(t - T.bab2 - 0.34, 3, 7) * 0.08);
  const glow = t >= T.bab2 && t < T.elli + 0.3 ? (0.7 + 0.3 * Math.sin((t - T.bab2) * 11)) * easeOut(seg(t, T.bab2, T.bab2 + 0.15)) * (1 - seg(t, T.elli, T.elli + 0.3)) : 0;
  const dimB = t >= T.marra1 && t < T.wamarra ? 0.5 * seg(t, T.marra1, T.marra1 + 0.2) * (1 - seg(t, T.wamarra - 0.15, T.wamarra)) : 0;
  const draw = easeInOut(seg(t, T.nafs, T.masafa + 0.2)), eq = popIn(t - T.masafa - 0.15, 0.26);
  const bubA = popIn(t - T.temshi - 0.1, 0.24), bubB = bubbleScale(t, T.temshi + 0.2, T.nesyo);
  const lost = t >= T.nesyo;
  const strip = (cy: number, s: number, kids: React.ReactNode) => <g transform={`translate(430 ${cy}) scale(${s}) translate(-430 ${-cy})`}>{kids}</g>;
  return (
    <g>
      <g transform={`translate(300 244) rotate(-5) scale(${clip * 1.05})`}><Clipboard /></g>
      <g transform={`translate(570 240) rotate(${4 + wobble(t - T.amrika - 0.28, 2.5, 4) * 10}) scale(${flag * 1.15})`}><FlagUS /></g>
      {sa > 0 && strip(SA.y + SA.h / 2, sa, <Rooms id="sAclip" p={SA} />)}
      {sb > 0 && strip(SB.y + SB.h / 2, sb, <Rooms id="sBclip" p={SB} open={open} glow={glow} split={split} drop={drop} dimmed={dimB} />)}
      {/* equal distances: start and finish marks + one dotted line per room, with "=" between them */}
      {fig > 0 && [X0, X1].map((x) => <path key={x} d={`M ${x} ${FA + 12} L ${x} ${FB - 150}`} stroke="#fff" strokeWidth={5} strokeDasharray="3 13" strokeLinecap="round" opacity={0.7 * clamp(fig)} />)}
      {draw > 0 && [227, 253].map((y) => <g key={y}>
        <path d={`M ${X0} ${y} L ${lerp(X0, X1, draw)} ${y}`} stroke={INK} strokeWidth={14} strokeLinecap="round" />
        <path d={`M ${X0} ${y} L ${lerp(X0, X1, draw)} ${y}`} stroke={YELLOW} strokeWidth={8} strokeDasharray="2 17" strokeLinecap="round" />
        <circle cx={X0} cy={y} r={9} fill={YELLOW} stroke={INK} strokeWidth={5} />
        <circle cx={lerp(X0, X1, draw)} cy={y} r={9} fill={YELLOW} stroke={INK} strokeWidth={5} />
      </g>)}
      {eq > 0 && <g transform={`translate(430 240) scale(${eq})`}>
        <circle r={27} fill={YELLOW} stroke={INK} strokeWidth={7} /><path d="M -12 -6 L 12 -6 M -12 7 L 12 7" stroke={INK} strokeWidth={7} strokeLinecap="round" />
      </g>}
      {/* top: one long room, the thought stays */}
      <Stick x={ax} y={FA} s={FS * fig} ph={walkPh(ax, FS)} walk={aWalk} mood={t >= TA_END ? 'happy' : 'ok'} />
      <Bubble x={ax - 58} y={FA - 146} r={30} s={bubA * (1 + 0.12 * wobble(t - TA_END, 3, 5))} tail={[0.62, 0.78]}><g transform="scale(0.56)"><Icon k="key" /></g></Bubble>
      <Check x={ax - 4} y={FA - 150} s={popIn(t - TA_END, 0.24) * 0.62} />
      {/* bottom: through the door, the thought pops */}
      <Stick x={bx} y={FB} s={FS * fig} ph={walkPh(bx, FS)} walk={bWalk} mood={lost ? 'confused' : 'ok'} scratch={easeOut(seg(t, T.aktar - 0.05, T.aktar + 0.2))} wig={Math.sin(t * 16)} />
      <Bubble x={bx - 58} y={FB - 146} r={30} s={bubB} tail={[0.62, 0.78]}><g transform="scale(0.56)"><Icon k="key" /></g></Bubble>
      <Burst x={430 - 58} y={FB - 146} r={38} dt={t - T.nesyo} />
      <QMark x={bx + 2} y={FB - 136} size={104} s={popIn(t - T.aktar, 0.24)} rot={wobble(t - T.aktar - 0.24, 2.5, 4) * 16} />
    </g>
  );
};

// ---- 5. the brain files the scene: folder "مشهد 1" slams shut with the door, an empty "مشهد 2" opens
const BrainScene: React.FC<{t: number}> = ({t}) => {
  const b = popIn(t - T.mokhak, 0.3), d = popIn(t - T.elbab3, 0.28), f1 = popIn(t - T.nehaya, 0.3);
  const slam = seg(t, T.fabye2fel, T.fabye2fel + 0.09);
  const o1 = (1 - easeIn(slam)) * (1 + 0.06 * wobble(t - T.mashhad, 3, 5));
  const hit = t >= T.fabye2fel + 0.09 ? wobble(t - T.fabye2fel - 0.09, 6, 9) : 0;
  const away = easeInOut(seg(t, T.qadeem, T.qadeem + 0.32));
  const f2 = popIn(t - T.yeftah, 0.28), o2 = easeOut(seg(t, T.malaf, T.malaf + 0.3)) * (1 + wobble(t - T.malaf - 0.3, 3, 6) * 0.12);
  const dp = t - T.fabye2fel - 0.09;
  return (
    <g>
      <g transform={`translate(160 262) rotate(${Math.sin(t * 2.2) * 2.5}) scale(${b * 1.08 * (1 + 0.05 * hit)})`}>
        <Brain mood={t >= T.yeftah ? 'happy' : 'ok'} look={t >= T.elbab3 ? 1 : 0} />
      </g>
      <g transform={`translate(${410 + hit * 5} 246) scale(${d * 0.9})`}><DoorFront open={1 - easeIn(slam)} /></g>
      <g transform={`translate(${lerp(672, 566, away)} ${lerp(262, 396, away)}) rotate(${lerp(0, -9, away)}) scale(${f1 * lerp(1, 0.5, away) * (1 + 0.08 * hit)} ${f1 * lerp(1, 0.5, away) * (1 - 0.1 * hit)})`} opacity={lerp(1, 0.72, away)}>
        <Folder open={o1} label="مشهد 1" papers />
      </g>
      {dp > 0 && dp < 0.42 && [-1, 1].map((s) => [0, 1].map((k) => (
        <circle key={`${s}${k}`} cx={672 + s * (140 + dp * (150 + k * 90))} cy={340 - k * 46 - dp * 60} r={(20 - k * 5) * (1 - dp / 0.42) + 5} fill={CHALK} stroke={INK} strokeWidth={5} opacity={1 - dp / 0.42} />
      )))}
      <g transform={`translate(690 226) rotate(3) scale(${f2 * 0.96})`}><Folder open={o2} label="مشهد 2" /></g>
      <Sparkle x={836} y={96} dt={t - T.gedeed} r={36} />
      <Sparkle x={560} y={150} dt={t - T.gedeed - 0.14} r={26} />
    </g>
  );
};

// ---- 7. it even happened with doors in a computer game: nobody left the chair
const GX = 426, GY = 44, GW = 388, GH = 216, GFL = 172, GWALL = 200;
const ComputerScene: React.FC<{t: number}> = ({t}) => {
  const desk = popIn(t - T.da2, 0.28), man = popIn(t - T.hasal, 0.28), mon = popIn(t - T.da2 - 0.06, 0.3);
  const TC = T.le3ba + 0.3;                           // the game character is in the doorway here
  const gv = (GWALL - 48) / (TC - T.zay);
  const gx = Math.round(clamp(48 + gv * (t - T.zay), 48, 320) / 6) * 6;
  const gwalk = t >= T.zay && gx < 320;
  const step = gwalk ? Math.floor(t * 12) % 2 : 0;
  const blink = t >= T.abwab && t < T.shasha && Math.floor((t - T.abwab) * 8) % 2 === 0;
  const bub = bubbleScale(t, T.hasal + 0.12, TC);
  const lost = t >= TC;
  const typing = Math.sin(t * 22) * 4;
  const seat = popIn(t - T.makano, 0.24), sb = Math.abs(Math.sin((t - T.makano) * 7)) * 10;
  const body = 'M 128 318 L 142 236 M 128 318 L 206 322 L 210 404 L 236 404 M 142 250 L 196 286 L 268 300';
  return (
    <g>
      {/* desk */}
      <g transform={`translate(540 320) scale(${desk}) translate(-540 -320)`}>
        <rect x={262} y={332} width={18} height={96} fill={FLOOR} stroke={INK} strokeWidth={7} /><rect x={806} y={332} width={18} height={96} fill={FLOOR} stroke={INK} strokeWidth={7} />
        <rect x={236} y={312} width={614} height={22} rx={8} fill="#b9814a" stroke={INK} strokeWidth={8} />
        <rect x={258} y={298} width={104} height={14} rx={5} fill="#cfd6dd" stroke={INK} strokeWidth={6} />
      </g>
      {/* monitor with a simple game: two rooms, a door, a blocky character */}
      <g transform={`translate(620 312) scale(${mon}) translate(-620 -312)`}>
        <rect x={596} y={270} width={48} height={36} fill="#5a6470" stroke={INK} strokeWidth={8} />
        <rect x={546} y={300} width={148} height={14} rx={6} fill="#5a6470" stroke={INK} strokeWidth={8} />
        <rect x={GX - 18} y={GY - 18} width={GW + 36} height={GH + 36} rx={20} fill="#39424e" stroke={INK} strokeWidth={9} />
        <g transform={`translate(${GX} ${GY})`} shapeRendering="crispEdges">
          <rect width={GW} height={GH} fill="#6c8fd6" /><rect x={GWALL} width={GW - GWALL} height={GH} fill="#f2c14e" />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <rect key={i} x={i * 52 + 8} y={18 + (i % 2) * 34} width={14} height={14} fill="#fff" opacity={0.13} />)}
          <rect y={GFL} width={GW} height={GH - GFL} fill="#5b3a1e" />
          {Array.from({length: 13}, (_, i) => <rect key={i} x={i * 32} y={GFL} width={16} height={8} fill="#8a5a33" />)}
          <rect x={GWALL - 8} y={0} width={18} height={GFL - 106} fill="#f3e3bf" stroke={INK} strokeWidth={4} />
          <rect x={GWALL + 10} y={GFL - 106} width={40} height={106} fill={DOOR} stroke={blink ? YELLOW : INK} strokeWidth={blink ? 8 : 4} />
          <rect x={GWALL + 38} y={GFL - 58} width={8} height={8} fill={KNOB} />
          {[0, 1, 2].map((i) => <path key={i} transform={`translate(${14 + i * 30} 12)`} d="M 0 4 h 4 v -4 h 6 v 4 h 2 v -4 h 6 v 4 h 4 v 8 h -4 v 4 h -4 v 4 h -4 v -4 h -4 v -4 h -4 v -4 h -2 Z" fill={RED} stroke={INK} strokeWidth={2} />)}
          <g transform={`translate(${gx} ${GFL - (gwalk && step ? 4 : 0)})`}>
            <rect x={-13} y={-74} width={26} height={24} fill={CHALK} stroke={INK} strokeWidth={4} />
            <rect x={3} y={-66} width={5} height={6} fill={INK} />
            <rect x={-11} y={-50} width={22} height={28} fill="#e2463c" stroke={INK} strokeWidth={4} />
            <rect x={step ? -13 : -9} y={-22} width={8} height={22} fill={INK} /><rect x={step ? 5 : 1} y={-22} width={8} height={22} fill={INK} />
          </g>
          {lost && t < TC + 1.6 && <text x={Math.min(gx + 4, 330)} y={GFL - 86} textAnchor="middle" fontFamily="Cairo" fontWeight={900} fontSize={46 * popIn(t - TC, 0.2)} fill="#fff" stroke={INK} strokeWidth={7} paintOrder="stroke">؟</text>}
        </g>
        <path d={`M ${GX + 14} ${GY + 30} L ${GX + 14} ${GY + 12} L ${GX + 44} ${GY + 12}`} stroke="#fff" strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.35} />
      </g>
      {/* the player never leaves the chair */}
      <g transform={`translate(140 420) scale(${man}) translate(-140 -420)`}>
        <path d="M 84 330 L 176 330 M 90 330 L 78 222 M 96 330 L 88 420 M 166 330 L 174 420" stroke={INK} strokeWidth={15} fill="none" strokeLinecap="round" />
        <path d="M 84 330 L 176 330 M 90 330 L 78 222 M 96 330 L 88 420 M 166 330 L 174 420" stroke="#6f8fa6" strokeWidth={7} fill="none" strokeLinecap="round" />
        <g transform={`translate(0 ${lost ? wobble(t - TC, 4, 6) * -6 : 0})`}>
          <path d={body} stroke={INK} strokeWidth={21} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={148} cy={204} r={29} fill={CHALK} stroke={INK} strokeWidth={6.5} />
          <path d={body} stroke={CHALK} strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={268} cy={300 + (lost ? 0 : typing)} r={8} fill={CHALK} stroke={INK} strokeWidth={5} />
          <circle cx={152} cy={200} r={3.8} fill={INK} /><circle cx={167} cy={200} r={3.8} fill={INK} />
          {lost ? <g><path d="M 144 188 l 10 4 M 163 191 l 10 -5" stroke={INK} strokeWidth={4} strokeLinecap="round" /><ellipse cx={162} cy={216} rx={5} ry={6} fill={INK} /></g> :
            <path d="M 154 215 l 11 0" stroke={INK} strokeWidth={4} strokeLinecap="round" />}
        </g>
      </g>
      <Bubble x={108} y={92} r={50} s={bub} tail={[0.42, 0.9]}><g transform="scale(0.85)"><Icon k="key" /></g></Bubble>
      <Burst x={108} y={92} r={58} dt={t - TC} />
      <QMark x={110} y={132} size={132} s={popIn(t - T.mahadesh, 0.24)} rot={wobble(t - T.mahadesh - 0.24, 2.5, 4) * 16} />
      <Arrow x={44 + sb * 0.5} y={318 - sb} rot={-28} s={seat * 0.62} fill={YELLOW} />
    </g>
  );
};

// ---- 8. the door alone is not enough: it happens when the brain is juggling several things at once
const JC = {x: 430, y: 178, rx: 226, ry: 90}, JW = (2 * Math.PI) / 1.7, JFLOOR = 446;
const JUG: [IconK, number][] = [['phone', T.demaghak], ['key', T.mashghoola], ['clock', T.bekaza], ['cup', T.haga]];
const JuggleScene: React.FC<{t: number}> = ({t}) => {
  const out = T.da3 - 0.12;
  const clip = showScale(t, T.olama2, out), flag = showScale(t, T.ostralya, out), door = showScale(t, T.elbab4, out);
  const x = popIn(t - T.mesh2, 0.2);
  const br = popIn(t - T.da3, 0.3);
  const dropped = t >= T.elwa2t, dd = t - T.elwa2t;
  const passX = lerp(1010, -150, seg(t, T.elwa2t - 0.42, T.elwa2t + 0.42));
  const tf = Math.sqrt((2 * (JFLOOR - (JC.y - JC.ry))) / 2800);
  return (
    <g>
      <g transform={`translate(140 250) rotate(-5) scale(${clip * 0.92})`}><Clipboard /></g>
      <g transform={`translate(390 246) rotate(${3 + wobble(t - T.ostralya - 0.28, 2.5, 4) * 10}) scale(${flag * 1.0})`}><FlagAU /></g>
      <g transform={`translate(${690 + (t >= T.mesh2 ? wobble(t - T.mesh2, 7, 7) * 10 : 0)} 240) scale(${door * 0.88})`}>
        <DoorFront open={0} />
        {x > 0 && <g transform={`scale(${x})`}>
          <path d="M -86 -96 L 86 96 M 86 -96 L -86 96" stroke={INK} strokeWidth={46} strokeLinecap="round" />
          <path d="M -86 -96 L 86 96 M 86 -96 L -86 96" stroke={RED} strokeWidth={28} strokeLinecap="round" />
        </g>}
      </g>
      {/* a door passes by behind the busy brain */}
      {t > T.elwa2t - 0.42 && t < T.elwa2t + 0.42 && <g transform={`translate(${passX} 258) scale(0.92)`}><DoorFront open={0.7} /></g>}
      {br > 0 && <g transform={`translate(430 ${398 + (dropped ? wobble(dd, 5, 6) * 8 : 0)}) scale(${br * 0.66})`}>
        <Brain mood={dropped ? 'confused' : 'ok'} arms={seg(t, T.demaghak - 0.1, T.demaghak + 0.1)} t={t} look={dropped ? -1 : 0} />
      </g>}
      {JUG.map(([k, ti], i) => {
        const s = popIn(t - ti, 0.24);
        if (s <= 0.001) return null;
        if (k === 'key' && dropped) {
          const fall = Math.min(dd, tf), b = dd > tf ? Math.abs(Math.sin(((dd - tf) * Math.PI) / 0.22)) * 40 * Math.exp(-(dd - tf) * 7) : 0;
          return <g key={k} transform={`translate(${JC.x - 420 * Math.min(dd, tf + 0.25)} ${JC.y - JC.ry + 1400 * fall * fall - b}) rotate(${-Math.min(dd, tf + 0.1) * 520}) scale(1.05)`}><Icon k="key" /></g>;
        }
        const a = -Math.PI / 2 + ((i - 1) * Math.PI) / 2 + JW * (t - T.elwa2t);
        return <g key={k} transform={`translate(${JC.x + JC.rx * Math.cos(a)} ${JC.y + JC.ry * Math.sin(a)}) rotate(${Math.sin(t * 5 + i) * 14}) scale(${s * 1.05})`}><Icon k={k} /></g>;
      })}
      <SweatDrop x={548} y={318} dt={dd - 0.05} s={0.5} />
      <QMark x={664} y={440} size={128} s={popIn(dd - 0.12, 0.22)} rot={wobble(dd - 0.34, 2.5, 4) * 16} />
    </g>
  );
};

// ---- 9. next time: repeat what you want while you walk ("مفتاح... مفتاح...") and it survives the door
const RX0 = 190, RV = (HR.wall! - RX0) / (T.mashi - T.karrar);
const PUFFS = Array.from({length: 6}, (_, i) => T.karrar + 0.02 + i * 0.3).filter((p) => p < T.mashi + 0.35);
const RepeatScene: React.FC<{t: number}> = ({t}) => {
  const fig = popIn(t - T.ya3ni, 0.28);
  const fxAt = (tt: number) => RX0 + RV * clamp(tt - T.karrar, 0, 10);
  const fx = fxAt(t), walk = t >= T.karrar ? 1 : 0, S = 0.9;
  const bub = popIn(t - T.elmarra, 0.26);
  const pulse = 1 + 0.1 * Math.max(0, ...PUFFS.map((p) => (t >= p ? Math.exp(-(t - p) * 9) : 0))) + 0.16 * (t >= T.mashi ? wobble(t - T.mashi, 3, 4) : 0);
  const through = t >= T.mashi;
  const glow = through ? 0.9 * (1 - seg(t, T.mashi, T.mashi + 0.6)) : 0;
  return (
    <g>
      <Rooms id="repclip" p={HR} open={1} glow={glow} lamp />
      {/* the word he keeps repeating pops beside the thought, left then right, one at a time */}
      {PUFFS.map((p, i) => {
        const dt = t - p; if (dt < 0 || dt > 0.3) return null;
        const px = fx + (i % 2 ? 122 : -124), py = HFEET - 296 - dt * 30;
        return <g key={i} transform={`translate(${px} ${py}) rotate(${i % 2 ? 6 : -7}) scale(${popIn(dt, 0.14) * (dt > 0.24 ? popOut(dt - 0.24, 0.06) : 1)})`}>
          <rect x={-62} y={-27} width={124} height={54} rx={22} fill="#fff" stroke={INK} strokeWidth={6} />
          <text x={0} y={13} textAnchor="middle" direction="rtl" fontFamily="Cairo" fontWeight={900} fontSize={36} fill={INK}>مفتاح</text>
        </g>;
      })}
      <g clipPath="url(#repclip)">
        <ellipse cx={fx} cy={HFEET + 4} rx={40} ry={8} fill="#000" opacity={0.22 * clamp(fig)} />
        <Stick x={fx} y={HFEET} s={S * fig} ph={walkPh(fx, S)} walk={walk} mood={through ? 'happy' : 'ok'} />
      </g>
      <Bubble x={fx - 4} y={HFEET - 252} r={46} s={bub * pulse} tail={[0.1, 1]}><g transform="scale(0.8)"><Icon k="key" /></g></Bubble>
      <Check x={fx + 84} y={HFEET - 190} s={popIn(t - T.mashi, 0.22) * 0.95} />
      <Sparkle x={fx - 90} y={HFEET - 300} dt={t - T.mashi} r={34} />
      <Sparkle x={fx + 96} y={HFEET - 286} dt={t - T.mashi - 0.12} r={26} />
    </g>
  );
};

// ---- 10. question to the viewer: what were you going to get? + bouncing comment icon
const AR: RoomP = {x: 20, y: 70, w: 430, h: 384, fl: 56, wall: 150, dh: 236};
const AFEET = AR.y + AR.h - AR.fl + 17;
const AskScene: React.FC<{t: number}> = ({t}) => {
  const TS = T.dakhalt2 + 0.4;
  const fx = lerp(56, 300, seg(t, T.akher, TS)), walk = 1 - seg(t, TS - 0.1, TS + 0.05), S = 0.95;
  const bub = popIn(t - T.wenset2, 0.26);
  const items: [number, React.ReactNode][] = [
    [T.wenset2, <QMark x={0} y={30} size={92} s={1} />], [T.kont, <Icon k="phone" />], [T.rayeh, <Icon k="cup" />], [T.tegeeb, <Icon k="key" />],
    [T.eh, <QMark x={0} y={36} size={108} s={1} fill={YELLOW} rot={wobble(t - T.eh - 0.2, 3, 3.5) * 16} />],
  ];
  let cur = items[0]; for (const it of items) if (t >= it[0]) cur = it;
  const b = popIn(t - T.ekteb, 0.3), bounce = t >= T.ekteb + 0.3 ? Math.abs(Math.sin((t - T.ekteb - 0.3) * 6.2)) * 16 : 0;
  const typed = clamp((t - T.comments) / 0.5);
  const ar = popIn(t - T.ekteb - 0.12, 0.24), ab = Math.abs(Math.sin((t - T.ekteb) * 7)) * 16;
  return (
    <g>
      <Rooms id="askclip" p={AR} open={1} />
      <g clipPath="url(#askclip)">
        <ellipse cx={fx} cy={AFEET + 4} rx={42} ry={8} fill="#000" opacity={0.22} />
        <Stick x={fx} y={AFEET} s={S} ph={walkPh(fx, S)} walk={walk} mood={t >= T.wenset2 - 0.05 ? 'confused' : 'ok'}
          scratch={easeOut(seg(t, T.wenset2 - 0.04, T.wenset2 + 0.2))} wig={Math.sin(t * 16)} />
      </g>
      <Bubble x={300} y={148} r={60} s={bub} tail={[0.05, 1]}>
        <g transform={`scale(${0.55 + 0.45 * popIn(t - cur[0], 0.18)})`}>{cur[1]}</g>
      </Bubble>
      {/* comment bubble: typing dots, then lines */}
      <g transform={`translate(668 ${196 - bounce}) scale(${b * 0.84})`}>
        <path d="M -150 -110 L 150 -110 Q 180 -110 180 -80 L 180 60 Q 180 90 150 90 L 10 90 L -50 150 L -40 90 L -150 90 Q -180 90 -180 60 L -180 -80 Q -180 -110 -150 -110 Z" fill="#fff" stroke={INK} strokeWidth={11} strokeLinejoin="round" />
        {typed <= 0 ? [-60, 0, 60].map((x, i) => (
          <circle key={i} cx={x} cy={-10 - 14 * Math.max(0, Math.sin((t - T.ekteb) * 9 - i * 0.9))} r={17} fill="#8a949c" />
        )) : [[-50, 250], [0, 300], [50, 180]].map(([y, w], i) => (
          <rect key={i} x={140 - w * clamp(typed * 3 - i)} y={y - 22} width={w * clamp(typed * 3 - i)} height={24} rx={12} fill={i === 0 ? RED : '#8a949c'} />
        ))}
      </g>
      {/* arrows down, towards the comments */}
      <Arrow x={590} y={446 - ab} s={ar * 0.66} fill={YELLOW} />
      <Arrow x={750} y={446 - ab} s={ar * 0.66} fill={YELLOW} />
      <Sparkle x={830} y={66} dt={t - T.comments - 0.1} r={30} />
    </g>
  );
};

const Board: React.FC<{t: number}> = ({t}) => {
  const {scene, since, start, prev} = sceneAt(t);
  // the board itself: pops in when a scene starts from nothing, pops out when the scene list goes to null
  const shown = scene !== null;
  let bs = 0;
  if (shown) bs = prev === null ? popIn(since, 0.32) : 1;
  else if (prev !== null && since < 0.2) bs = popOut(since, 0.18);
  if (bs <= 0.001) return null;
  const content = shown ? scene : prev;
  // content swaps never cut: the old drawing pops out during the 0.12 s before the next one pops in
  const next = SCENES.find((s) => s[0] > t);
  const leaving = shown && next && next[1] !== null && next[0] - t < 0.12 ? popOut(0.12 - (next[0] - t), 0.12) : 1;
  // (the hook drawing is already on the board in frame 1: no pop-in at t = 0)
  const cs = (shown && prev !== null && start > 0 && since < 0.3 ? popIn(since, 0.26) : 1) * leaving;
  return (
    <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <g transform={`translate(${BX + BW / 2} ${BY + BH}) scale(${bs}) translate(${-BW / 2} ${-BH})`}>
        <rect x={-16} y={-16} width={BW + 32} height={BH + 32} rx={26} fill="#8a5a33" stroke={INK} strokeWidth={10} />
        <rect x={0} y={0} width={BW} height={BH} rx={14} fill={BOARD} stroke={INK} strokeWidth={6} />
        <rect x={10} y={10} width={BW - 20} height={BH - 20} rx={10} fill="none" stroke="#ffffff" strokeOpacity={0.05} strokeWidth={8} />
        <defs><clipPath id="boardclip"><rect x={3} y={3} width={BW - 6} height={BH - 6} rx={12} /></clipPath></defs>
        <g clipPath="url(#boardclip)">
          <g transform={`translate(${BW / 2} ${BH / 2}) scale(${cs}) translate(${-BW / 2} ${-BH / 2})`}>
            {content === 'hook' && <Hook t={t} />}
            {content === 'split' && <Split t={t} />}
            {content === 'brain' && <BrainScene t={t} />}
            {content === 'computer' && <ComputerScene t={t} />}
            {content === 'juggle' && <JuggleScene t={t} />}
            {content === 'repeat' && <RepeatScene t={t} />}
            {content === 'ask' && <AskScene t={t} />}
            {content === 'loop' && <Hook t={t} frozen />}
          </g>
        </g>
      </g>
    </svg>
  );
};

// ============================================================ sound
type Cue = [number, string, number];
const STEPS = (t0: number, t1: number, every = 0.2, v = 0.2): Cue[] => Array.from({length: Math.max(0, Math.floor((t1 - t0) / every))}, (_, i): Cue => [t0 + i * every, 'step', v]);
const SFX: Cue[] = [
  // hook
  [0, 'click', 0.4], [0.02, 'whoosh', 0.26], ...STEPS(0.2, HOOK_STOP), [T.wenset, 'boing', 0.32], [T.leh, 'pop', 0.25],
  [T.enta2, 'pop', 0.28], [T.mesh, 'pop', 0.28], [T.wessabab - 0.06, 'swish', 0.25], [T.bab1, 'thud', 0.4], [T.bab1 + 0.02, 'ding', 0.3], [T.nafso, 'sparkle', 0.3],
  // split screen
  [T.olama - 0.1, 'swish', 0.3], [T.olama, 'pop', 0.3], [T.amrika, 'pop', 0.28], [T.khallo - 0.12, 'swish', 0.25], [T.khallo, 'pop', 0.3], [T.nas, 'pop', 0.3],
  [T.temshi, 'boing', 0.25], [T.nafs, 'whoosh', 0.24], [T.masafa + 0.15, 'ding', 0.3],
  ...STEPS(T.marra1, TA_END, 0.19, 0.2), [TA_END, 'sparkle', 0.26], [T.wamarra + 0.14, 'thud', 0.45], [T.bab2, 'click', 0.4], [T.bab2 + 0.02, 'whoosh', 0.22],
  ...STEPS(T.elli, T.aktar, 0.19, 0.2), [T.nesyo, 'pop', 0.6], [T.nesyo + 0.02, 'squish', 0.3], [T.aktar, 'boing', 0.32],
  // brain + folders
  [T.asl - 0.08, 'swish', 0.3], [T.mokhak, 'boing', 0.3], [T.elbab3, 'pop', 0.3], [T.nehaya, 'pop', 0.3], [T.fabye2fel + 0.08, 'thud', 0.6], [T.fabye2fel + 0.08, 'click', 0.45],
  [T.qadeem, 'swish', 0.25], [T.yeftah, 'pop', 0.3], [T.malaf, 'whoosh', 0.22], [T.gedeed, 'sparkle', 0.32],
  [T.estanna - 0.02, 'stinger', 0.55],
  // computer game
  [T.da2 - 0.1, 'whoosh', 0.3], [T.da2, 'pop', 0.3], [T.hasal, 'pop', 0.28], [T.hasal + 0.12, 'pop', 0.22], [T.abwab, 'click', 0.4], [T.abwab + 0.25, 'click', 0.35],
  [T.computer, 'ding', 0.25], ...STEPS(T.zay, T.le3ba + 0.6, 0.13, 0.24), [T.le3ba + 0.3, 'pop', 0.6], [T.le3ba + 0.32, 'squish', 0.3],
  [T.mahadesh, 'boing', 0.32], [T.makano, 'pop', 0.3],
  // not the door alone: a busy brain
  [T.bas - 0.08, 'swish', 0.3], [T.olama2, 'pop', 0.3], [T.ostralya, 'pop', 0.28], [T.elbab4, 'pop', 0.3], [T.mesh2, 'thud', 0.45], [T.mesh2, 'alarm', 0.12],
  [T.da3 - 0.12, 'swish', 0.28], [T.da3, 'boing', 0.3], [T.demaghak, 'pop', 0.28], [T.mashghoola, 'pop', 0.28], [T.bekaza, 'pop', 0.28], [T.haga, 'pop', 0.28],
  [T.elwa2t - 0.4, 'whoosh', 0.34], [T.elwa2t, 'gulp', 0.34], [T.elwa2t + 0.49, 'thud', 0.4], [T.elwa2t + 0.5, 'click', 0.4],
  // repeat it while you walk
  [T.ya3ni - 0.08, 'swish', 0.3], [T.ya3ni, 'pop', 0.3], [T.elmarra, 'pop', 0.28], ...PUFFS.map((p): Cue => [p, 'pop', 0.22]),
  ...STEPS(T.karrar + 0.1, T.mashi + 0.6, 0.3, 0.2), [T.mashi, 'ding', 0.34], [T.mashi, 'sparkle', 0.32],
  // question + comments
  [T.akher - 0.08, 'swish', 0.28], ...STEPS(T.akher + 0.05, T.dakhalt2 + 0.4, 0.2, 0.2), [T.wenset2, 'boing', 0.3], [T.kont, 'pop', 0.25], [T.rayeh, 'pop', 0.25], [T.tegeeb, 'pop', 0.25],
  [T.eh, 'boing', 0.28], [T.ekteb, 'pop', 0.3], [T.comments, 'click', 0.45],
  // ending
  [T.fahman - 0.15, 'swish', 0.3], [T.fahman, 'pop', 0.25], [T.kasban, 'twinkle', 0.4],
];
const POSE_SWAP_SFX: Cue[] = POSES.slice(2).map(([t]) => [t - 0.06, 'swish', 0.1]);

// ============================================================ captions (2-3 words, word for word from the script)
const COLORS: Record<string, string> = {};
const paint = (ws: string[], c: string) => { for (const w of ws) COLORS[norm(w)] = c; };
paint(['أوضة', 'الباب', 'باب', 'أمريكا', 'المسافة', 'مخك', 'مشهد', 'جديد', 'أبواب', 'كمبيوتر', 'لعبة', 'مكانه', 'أستراليا', 'دماغك', 'كرر', 'ماشي', 'إيه', 'الكومنتات'], YELLOW);
paint(['ونسيت', 'نسيوا', 'أكتر', 'فبيقفل', 'استنى', 'الغريب', 'كفاية', 'مشغولة'], RED);
const GROUPS: Group[] = (() => {
  const out: Group[] = []; let i = 0;
  for (const n of (CAPS as {sizes: number[]}).sizes) {
    const ws = words.slice(i, i + n).map((w) => ({...w, s: w.s + VO, e: w.e + VO})); i += n;
    out.push({words: ws, s: ws[0].s, e: ws[ws.length - 1].e});
  }
  if (i !== words.length) throw new Error(`caption sizes cover ${i} of ${words.length} words`);
  for (const g of out) {
    if (g.words.length === 1 && norm(g.words[0].w) === 'استنى') g.style = 'big';
    if (g.words.every((w) => ['الفهمان', 'كسبان'].includes(norm(w.w)))) g.style = 'gold';
  }
  // each caption stays up until the next one starts (no empty gaps under 0.6 s)
  for (let k = 0; k < out.length; k++) {
    const nx = out[k + 1];
    out[k].e = nx ? (nx.s - out[k].e < 0.6 ? nx.s : out[k].e + 0.25) : 1e9;
  }
  // the signature words appear exactly on their pinned audio onsets
  const pin: Record<string, number> = {'استنى': T.estanna, 'الفهمان': T.fahman, 'كسبان': T.kasban};
  for (const g of out) for (const w of g.words) if (pin[norm(w.w)] !== undefined) w.s = pin[norm(w.w)];
  for (const g of out) g.s = g.words[0].s;
  for (let k = 0; k < out.length - 1; k++) if (out[k].e > out[k + 1].s) out[k].e = out[k + 1].s;
  out[0].s = 0.03; // the first caption is already on screen in frame 1
  return out;
})();

// ============================================================ composition
export const Doorway: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam0 = camAt(t, CAM0, CAM_KEYS);
  const sh = shakeAt(t, SHAKES);
  const cam: Cam = {x: cam0.x - sh.x, y: cam0.y - sh.y, z: cam0.z};
  const pose = poseAt(t, POSES);
  const squash = squashAt(t, POSES);
  const vf = Math.round((t - VO) * FPS);
  const talking = TALKABLE.includes(pose) && vf >= 0 && vf < MOUTH.length;
  const mouth = talking ? MOUTH[vf] : 0;
  const blink = BLINKS.some((b) => t >= b && t < b + 0.1) && pose !== 'shocked';
  const wink = winkOn(t) && pose === 'temple';
  // signature: dim the room while he stares
  const dim = t >= T.estanna - 0.02 && t < T.da2 ? 0.38 * easeOut(seg(t, T.estanna - 0.02, T.estanna + 0.12)) * (1 - seg(t, T.da2 - 0.3, T.da2)) : 0;
  return (
    <AbsoluteFill style={{backgroundColor: '#1d1410'}}>
      <Fonts />
      <SetBack cam={cam} dim={dim} />
      <Layer cam={cam} z={1000}>
        <Board t={t} />
        <Character pose={pose} mouth={mouth} blink={blink} wink={wink} x={CHAR_X} y={CHAR_Y} scale={CS} squash={squash} t={t}>
          <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
            <SweatDrop x={HEAD[0] + 250} y={HEAD[1] - 140} dt={t - T.nesyo - 0.05} s={1.2} />
            {wink && t >= VO && <Sparkle x={HEAD[0] + 210} y={HEAD[1] - 40} dt={t - T.kasban} r={48} />}
          </svg>
        </Character>
      </Layer>
      <SetFront cam={cam} dim={dim} />
      {/* vignette, deeper during the signature line */}
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,${0.28 + dim}) 100%)`}} />
      {/* captions at ~65% of the frame height: clear of the Shorts/TikTok channel name, title and buttons */}
      <Captions t={t} groups={GROUPS} colors={COLORS} y={1250} x={460} />
      <Sequence from={Math.round(VO * FPS)}><Audio src={staticFile('elfahman/doorway/vo/take1.mp3')} volume={1} /></Sequence>
      {[...SFX, ...POSE_SWAP_SFX].map(([tt, n, v], i) => (
        <Sequence key={i} from={Math.max(0, Math.round(tt * FPS))} durationInFrames={Math.round(1.6 * FPS)}>
          <Audio src={staticFile(`elfahman/sfx/${n}.wav`)} volume={v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
