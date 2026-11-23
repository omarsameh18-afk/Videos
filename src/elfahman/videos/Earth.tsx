import React from 'react';
import {AbsoluteFill, Audio, Sequence, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {Fonts} from '../lib/fonts';
import {FPS, clamp, easeIn, easeInOut, easeOut, lerp, popIn, rand, seg, wobble} from '../lib/anim';
import {Cam, CamKey, Layer, camAt, shakeAt} from '../lib/camera';
import {SetBack, SetFront, DESK_SCREEN_Y} from '../lib/Set';
import {CANVAS, Character, HEAD, Pose, PoseKey, blinkTimes, mouthStates, poseAt, squashAt} from '../lib/Character';
import {Captions, Group, RED, YELLOW, Word, norm} from '../lib/Captions';
import {INK, Sparkle, SweatDrop, showScale} from '../lib/fx';
import WORDS from './earth.words.json';
import ENV from './earth.env.json';
import CAPS from './earth.captions.json';

// Episode 11: "لو الأرض وقفت ثانية" (Earth spins ~1670 km/h at the equator, ~1450 in Egypt, faster than a plane; we don't feel it
// because everything spins with us; if it stopped, everything not fixed keeps going east: people, cars, winds stronger than any
// hurricane, ocean waves over the land, all in one second. Can it stop? No. The strange part: it IS slowing down, very slowly:
// the day gets a tiny bit of a second longer every 100 years; in the dinosaurs' time the day was ~half an hour shorter).
// Relaxed pacing (tools/pace.py on the raw take, 1.0x, nothing stretched): sentence gaps ~0.4-0.5 s, comma gaps ~0.2 s, the hook
// and "استنى ده الغريب جاي!" said straight through, 0.8 s mystery pause after "فعلاً؟".
// Three generated pictures (Earth, a huge wave, a dinosaur silhouette); everything else is drawn in code.
// Hook caption rule: caption 1 "الأرض وقفت!" (big, filling the width) from frame 0, caption 2 "ثانية واحدة بس؟" on "ثانية".
// The hook board (spinning Earth that freezes with a screech + shake) moves from frame 0; the last scene is the same spinning
// Earth running into its frame-0 state (loop).

// ============================================================ timing
const VO = 0;
const words = WORDS as Word[];
const nq = (w: string) => norm(w).replace(/"/g, '');
const idx = (w: string, nth = 0) => {
  const hits = words.map((x, i) => (nq(x.w) === nq(w) ? i : -1)).filter((i) => i >= 0);
  if (hits[nth] === undefined) throw new Error(`word not found: ${w} #${nth}`);
  return hits[nth];
};
const S = (i: number) => words[i].s + VO;
const SPEECH_END = 64.677 + VO; // measured end of the last word (silencedetect on vo.mp3)
export const EARTH_DURATION_S = Math.round((SPEECH_END + 0.4) * FPS) / FPS;
const END = EARTH_DURATION_S;

const T = {
  hayo7sol: S(2), ard0: S(4), wa2afet0: S(5), sanya0: S(6),
  ard: S(7), delwa2ty: S(8), betlef: S(9), besor3a: S(10), magnoona: S(11), we7na: S(12), hasseen: S(14),
  and3: S(15), khat: S(16), estwa: S(17), sor3etha: S(18), hawaly: S(19), alf: S(20), setameya: S(21), sab3een: S(22), kilo: S(23), sa3a: S(25),
  masr: S(27), hawaly2: S(28), arba3meya: S(30), sa3a2: S(33), ya3ni: S(34), asra3: S(35), tayara: S(38), rokkab: S(39),
  mesh: S(40), bayha: S(42), ashan3: S(43), hawaleena: S(46), ma3ana: S(48), hawa: S(49), ba7r: S(50), beyoot: S(51), enta: S(52),
  bas: S(53), ard2: S(55), wa2afet: S(56), fag2a: S(57), hatoaf: S(59), laken: S(60), motasabta: S(64), hatkammel: S(66), gary: S(67), nafs: S(68), sor3a: S(69),
  ya3ni2: S(70), enta2: S(71), arabeyat: S(72), wekol: S(73), hattetaazef: S(77), na7yet: S(78), shar2: S(79),
  hawa2: S(80), hayekammel: S(82), riya7: S(84), a2wa: S(85), e3sar: S(88), etshafet: S(89),
  mo7eetat: S(90), hatkammel2: S(92), amwag: S(93), da5ma: S(94), hatodrab: S(95), yabsa: S(96), tegra2: S(97), modon: S(98), kamla: S(99),
  kol: S(100), sanya: S(103), wa7da: S(104), bas2: S(105),
  tab: S(106), teftekir: S(107), momken: S(109), to2af: S(110), fe3lan: S(111),
  egaba: S(112), la2: S(113), mafeesh: S(114), kon: S(117), ta2a: S(119), tekfy: S(120), shakl: S(122),
  estanna: S(124), ghareeb: S(126), gay: S(127),
  ard3: S(128), betbata2: S(129), fe3lan2: S(130), bel_ra7a: S(132), awy: S(133),
  youm: S(134), beyetwal: S(135), goz2: S(137), sogayar: S(138), sanya2: S(140), kol2: S(141), meyya: S(142), sana: S(143),
  ayam: S(144), dinos: S(145), youm2: S(147), a2sar: S(148), nos: S(150), sa3a3: S(151),
  law: S(152), tablaw: S(154), nefsak: S(156), ekteb: S(159), comments: S(161), fahman: S(162), kasban: S(163),
};
if (nq(words[124].w) !== 'استنى' || nq(words[162].w) !== 'الفهمان' || nq(words[111].w) !== nq('فعلاً') || nq(words[27].w) !== 'مصر' || nq(words[113].w) !== 'لأ') throw new Error('word index table is off');
// signature moments pinned to the measured audio onsets (timing.py)
T.estanna = 49.25 + VO; T.fahman = 63.63 + VO; T.kasban = 64.3 + VO;
// the hook line ends at 2.107 s (silencedetect); the mystery pause after "فعلاً؟" is 44.033-44.826 s (0.79 s)
const MYST: [number, number] = [44.033 + VO, 44.826 + VO];
const FREEZE: [number, number][] = [[T.estanna, T.ard3 - 0.05]];
const idle = (t: number) => t - FREEZE.reduce((a, [p0, p1]) => a + clamp(t - p0 - 0.04, 0, p1 - p0 - 0.04), 0);

// ============================================================ character
const TALKABLE: Pose[] = ['hero', 'explain', 'point_up', 'thinking', 'temple', 'thumbs_up', 'worried'];
const POSES: PoseKey[] = [
  [0, 'shocked'],               // hook: the Earth freezes
  [T.ard, 'explain'],           // it spins crazy fast
  [T.and3, 'point_up'],         // the equator: 1670
  [T.masr, 'explain'],          // Egypt: 1450
  [T.asra3, 'point_up'],        // faster than a plane
  [T.mesh, 'explain'],          // everything spins with us
  [T.bas, 'worried'],           // if it stopped suddenly...
  [T.ya3ni2, 'shocked'],        // people and cars thrown east
  [T.hawa2, 'worried'],         // winds
  [T.amwag, 'shocked'],         // the wave hits the city
  [T.kol, 'point_up'],          // all in one second
  [T.tab, 'thinking'],          // can it really stop? (mystery)
  [MYST[1], 'point_up'],        // the answer: no
  [T.mafeesh, 'explain'],
  [T.estanna, 'shocked'],       // signature line exactly on "استنى"
  [T.ard3, 'explain'],          // it IS slowing down
  [T.youm, 'point_up'],         // the day gets longer
  [T.ayam, 'explain'],          // the dinosaurs' shorter day
  [T.law, 'thumbs_up'],         // tell me your "what if"
  [T.ekteb, 'explain'],         // comments (arrows point down)
  [T.fahman, 'temple'],         // ending: hand on temple exactly on "الفهمان"
];
const MOUTH = mouthStates((ENV as {level: number[]}).level);
const BLINKS = blinkTimes(END, 11);

const CS = 0.6;
const CHAR_X = 540 - (CANVAS[0] * CS) / 2;
const CHAR_Y = DESK_SCREEN_Y - 1450 * CS;

// ============================================================ camera
const CAM0: Cam = {x: 520, y: 860, z: 180};
const BASE: Cam = {x: 512, y: 866, z: 125};
const NEAR: Cam = {x: 510, y: 850, z: 150};
const CAM_KEYS: CamKey[] = [
  [0, 1.0, {x: 516, y: 866, z: 150}],
  [T.ard - 0.1, T.ard + 0.4, BASE],
  [T.and3 - 0.05, T.and3 + 0.4, NEAR],                             // the speedometer
  [T.ya3ni - 0.1, T.ya3ni + 0.4, BASE],
  [T.mesh - 0.1, T.mesh + 0.4, BASE],
  [T.bas - 0.05, T.hatoaf + 0.1, {x: 510, y: 846, z: 158}],          // tension until the stop
  [T.ya3ni2 - 0.1, T.ya3ni2 + 0.4, BASE],
  [T.hawa2 - 0.1, T.hawa2 + 0.4, NEAR],
  [T.amwag - 0.05, T.hatodrab + 0.1, {x: 508, y: 836, z: 166}],     // the wave comes in
  [T.kol - 0.1, T.kol + 0.4, BASE],
  [T.teftekir - 0.2, MYST[1] - 0.02, {x: 512, y: 780, z: 215}],     // slow push-in on the question
  [MYST[1] - 0.02, MYST[1] + 0.25, {x: 510, y: 820, z: 175}],       // "لأ"
  [T.mafeesh - 0.1, T.mafeesh + 0.4, BASE],
  [T.estanna - 0.04, T.estanna + 0.1, {x: 540, y: 690, z: 280}],    // punch-in exactly on "استنى"
  [T.ard3 - 0.1, T.ard3 + 0.4, BASE],
  [T.youm - 0.05, T.youm + 0.4, NEAR],
  [T.ayam - 0.1, T.ayam + 0.4, BASE],
  [T.law - 0.1, T.law + 0.4, {x: 512, y: 868, z: 122}],
  [T.fahman - 0.1, T.fahman + 0.5, CAM0],                           // ends on the opening framing
];
const SHAKES: [number, number, number][] = [
  [T.wa2afet0, 14, 6], [T.sanya0, 4, 9], [T.magnoona, 2.5, 12], [T.sab3een, 3, 10], [T.masr, 3, 10], [T.rokkab, 3, 10],
  [T.hatoaf, 12, 6], [T.hattetaazef, 5, 8], [T.shar2, 3, 10], [T.riya7, 4, 9], [T.e3sar, 3, 10], [T.hatodrab, 11, 6], [T.tegra2, 4, 9],
  [T.bas2, 4, 9], [MYST[1], 3, 10], [T.la2, 8, 7], [T.estanna, 16, 6], [T.awy, 2, 12], [T.a2sar, 3, 10], [T.comments, 2.5, 12],
];

// ============================================================ drawing kit
const CHALK = '#fdf6e8', GREEN = '#43a85a', SKIN = '#e8b48a', BLUE = '#3d8bff', PINK = '#ff9fb8', ORANGE = '#ff8a3d', PURPLE = '#8a5cd6', TEAL = '#2ec4b6';
const pm = (x: number, m: number) => ((x % m) + m) % m;
const AR = '٠١٢٣٤٥٦٧٨٩';
const ar = (n: number | string) => String(n).replace(/[0-9]/g, (d) => AR[+d]);

const Txt: React.FC<{x: number; y: number; size: number; fill?: string; rtl?: boolean; sw?: number; anchor?: 'start' | 'middle' | 'end'; children: React.ReactNode}> =
({x, y, size, fill = CHALK, rtl = true, sw = 0.11, anchor = 'middle', children}) => (
  <text x={x} y={y} textAnchor={anchor} direction={rtl ? 'rtl' : 'ltr'} fontFamily="Cairo" fontWeight={900} fontSize={size} fill={fill}
    stroke={sw > 0 ? INK : 'none'} strokeWidth={size * sw} strokeLinejoin="round" paintOrder="stroke">{children}</text>
);
const QMark: React.FC<{x: number; y: number; size: number; s: number; rot?: number; fill?: string}> = ({x, y, size, s, rot = 0, fill = YELLOW}) => s <= 0.001 ? null : (
  <text x={x} y={y} textAnchor="middle" fontFamily="Cairo" fontWeight={900} fontSize={size * s} fill={fill} stroke={INK} strokeWidth={size * 0.1 * s}
    strokeLinejoin="round" paintOrder="stroke" transform={`rotate(${rot} ${x} ${y - size * 0.3})`}>؟</text>
);
const Cross: React.FC<{x: number; y: number; s: number; r?: number; w?: number}> = ({x, y, s, r = 40, w = 16}) => s <= 0.001 ? null : (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[INK, RED].map((c, i) => <path key={c} d={`M ${-r} ${-r} L ${r} ${r} M ${r} ${-r} L ${-r} ${r}`} stroke={c} strokeWidth={i ? w : w + 11} strokeLinecap="round" />)}
  </g>
);
const Mini: React.FC<{c?: string; s?: number; arms?: boolean}> = ({c = BLUE, s = 1, arms = false}) => (
  <g transform={`scale(${s})`}>
    {arms && <path d="M -15 -26 L -30 -44 M 15 -26 L 30 -44" stroke={INK} strokeWidth={7} strokeLinecap="round" />}
    <path d="M -15 0 L -15 -20 Q -15 -34 0 -34 Q 15 -34 15 -20 L 15 0 Z" fill={c} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <circle cx={0} cy={-46} r={12} fill={SKIN} stroke={INK} strokeWidth={4} />
  </g>
);
const KID_C = [BLUE, '#ff6f61', GREEN, '#ffb03a', PURPLE, '#3ac0c0', PINK, '#c0392b'];
// a little car (centre bottom at 0,0, facing right)
const Car: React.FC<{c?: string}> = ({c = '#ff6f61'}) => (
  <g>
    <path d="M -58 -14 L -58 -34 Q -56 -42 -46 -42 L -30 -42 L -16 -62 L 22 -62 L 40 -42 L 54 -40 Q 62 -38 62 -28 L 62 -14 Z" fill={c} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <path d="M -10 -56 L 18 -56 L 30 -42 L -20 -42 Z" fill="#bfe6ff" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    {[-32, 36].map((x) => <circle key={x} cx={x} cy={-12} r={13} fill="#333" stroke={INK} strokeWidth={5} />)}
  </g>
);
const House: React.FC<{c?: string}> = ({c = '#ffd9a0'}) => (
  <g>
    <rect x={-34} y={-50} width={68} height={50} fill={c} stroke={INK} strokeWidth={5} />
    <path d="M -44 -48 L 0 -84 L 44 -48 Z" fill="#c0392b" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <rect x={-10} y={-28} width={20} height={28} fill="#8a5a33" stroke={INK} strokeWidth={4} />
  </g>
);
// a puff of air (swirl), centre 0,0
const Swirl: React.FC<{c?: string}> = ({c = '#e8f6ff'}) => (
  <g fill="none" strokeLinecap="round">
    {[INK, c].map((k, i) => <path key={k} d="M -40 0 Q -40 -26 -12 -26 Q 14 -26 14 -4 Q 14 12 -2 12 Q -14 12 -14 0 M 0 26 L 46 26 M 20 -40 L 50 -40" stroke={k} strokeWidth={i ? 7 : 14} />)}
  </g>
);
const SeaWave: React.FC = () => (
  <g>
    <path d="M -46 10 Q -30 -26 -6 -18 Q 10 -12 2 4 Q 22 -10 46 10 Z" fill={BLUE} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <path d="M -46 10 L 46 10" stroke={INK} strokeWidth={5} />
  </g>
);
const Plane: React.FC = () => (
  <g>
    <path d="M -80 0 Q -80 -16 -60 -16 L 62 -16 Q 92 -14 96 0 Q 92 14 62 14 L -60 14 Q -80 14 -80 0 Z" fill="#f2f5fa" stroke={INK} strokeWidth={6} />
    <path d="M -4 -12 L -34 -58 L -14 -58 L 30 -12 Z M -4 12 L -34 58 L -14 58 L 30 12 Z M -64 -14 L -82 -46 L -66 -46 L -44 -14 Z" fill="#9ec5ff" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    {[20, 36, 52, 68].map((x) => <circle key={x} cx={x} cy={-3} r={4.5} fill="#5a8bd6" />)}
  </g>
);
const Clock: React.FC<{h: number; extra?: number; r?: number}> = ({h, extra = 0, r = 74}) => (
  <g>
    <circle r={r} fill="#fff" stroke={INK} strokeWidth={9} />
    {extra > 0 && <path d={`M 0 0 L 0 ${-r + 6} A ${r - 6} ${r - 6} 0 0 1 ${Math.sin(extra) * (r - 6)} ${-Math.cos(extra) * (r - 6)} Z`} fill={YELLOW} stroke={ORANGE} strokeWidth={3} />}
    {Array.from({length: 12}, (_, i) => { const a = (i / 12) * Math.PI * 2; return <path key={i} d={`M ${Math.sin(a) * r * 0.76} ${-Math.cos(a) * r * 0.76} L ${Math.sin(a) * r * 0.86} ${-Math.cos(a) * r * 0.86}`} stroke={INK} strokeWidth={4} />; })}
    <path d={`M 0 0 L ${Math.sin((h * Math.PI) / 6) * r * 0.48} ${-Math.cos((h * Math.PI) / 6) * r * 0.48}`} stroke={INK} strokeWidth={9} strokeLinecap="round" />
    <path d={`M 0 0 L ${Math.sin(h * Math.PI * 2) * r * 0.72} ${-Math.cos(h * Math.PI * 2) * r * 0.72}`} stroke={RED} strokeWidth={6} strokeLinecap="round" />
    <circle r={7} fill={INK} />
  </g>
);
const DownArrow: React.FC<{s?: number}> = ({s = 1}) => (
  <g transform={`scale(${s})`}><path d="M 0 0 L -52 -60 L -21 -60 L -21 -150 L 21 -150 L 21 -60 L 52 -60 Z" fill={YELLOW} stroke={INK} strokeWidth={10} strokeLinejoin="round" /></g>
);
const Stars: React.FC<{t: number; n?: number; seed?: number}> = ({t, n = 18, seed = 1}) => (
  <g>{Array.from({length: n}, (_, i) => <circle key={i} cx={rand(i * 4.1 + seed) * BW} cy={rand(i * 7.7 + seed) * BH} r={2 + rand(i + seed) * 3} fill="#fff" opacity={0.3 + 0.4 * Math.abs(Math.sin(t * 2 + i))} />)}</g>
);

// ---- the three generated pictures (keyed: public/elfahman/earth/*.png), preloaded once so no frame renders without them
const PROPS = {earth: {w: 947, h: 942}, wave: {w: 1024, h: 922}, dino: {w: 952, h: 793}};
const SRC = (n: keyof typeof PROPS) => staticFile(`elfahman/earth/${n}.png`);
let propsHandle: number | null = null;
const useProps = () => {
  if (propsHandle === null && typeof window !== 'undefined') {
    propsHandle = delayRender('props');
    Promise.all((Object.keys(PROPS) as (keyof typeof PROPS)[]).map((n) => { const im = new Image(); im.src = SRC(n); return im.decode ? im.decode().catch(() => null) : null; }))
      .then(() => continueRender(propsHandle!));
  }
};
// the globe picture, centre 0,0, globe radius r (the globe is ~935 px wide in its 947 px crop), rotated by a degrees
const EarthPic: React.FC<{r: number; a?: number}> = ({r, a = 0}) => {
  useProps();
  const k = r / 468;
  return <g transform={`rotate(${a})`}><image href={SRC('earth')} x={-473.5 * k} y={-471 * k} width={947 * k} height={942 * k} /></g>;
};
const Pic: React.FC<{n: 'wave' | 'dino'; w: number; flip?: boolean}> = ({n, w, flip = false}) => {
  useProps();
  const k = w / PROPS[n].w, h = PROPS[n].h * k;
  return <g transform={flip ? 'scale(-1 1)' : undefined}><image href={SRC(n)} x={-w / 2} y={-h} width={w} height={h} /></g>;
};
// curved speed arcs around a spinning globe (rotating with it), strength 0..1
const SpinArcs: React.FC<{r: number; a: number; k: number; c?: string; n?: number}> = ({r, a, k, c = CHALK, n = 3}) => k <= 0.01 ? null : (
  <g opacity={k} transform={`rotate(${a})`} fill="none" strokeLinecap="round">
    {Array.from({length: n}, (_, i) => {
      const a0 = (i / n) * Math.PI * 2, a1 = a0 + 0.9, R = r + 22 + (i % 2) * 12;
      const d = `M ${Math.cos(a0) * R} ${Math.sin(a0) * R} A ${R} ${R} 0 0 1 ${Math.cos(a1) * R} ${Math.sin(a1) * R}`;
      return <g key={i}><path d={d} stroke={INK} strokeWidth={13} /><path d={d} stroke={c} strokeWidth={7} /></g>;
    })}
  </g>
);

// ============================================================ board (chalkboard inset above his head)
const BX = 80, BY = 84, BW = 860, BH = 480, MID = BW / 2;
type Scene = 'hook' | 'spin' | 'speed' | 'plane' | 'together' | 'stop' | 'fly' | 'wind' | 'wave' | 'second' | 'question' | 'no' | 'slow' | 'dino' | 'comment' | 'loop';
const PUSH = 0.3;
const SCENES: [number, Scene][] = [
  [0, 'hook'], [T.ard - 0.1, 'spin'], [T.and3 - 0.1, 'speed'], [T.ya3ni - 0.1, 'plane'], [T.mesh - 0.1, 'together'], [T.bas - 0.1, 'stop'],
  [T.ya3ni2 - 0.1, 'fly'], [T.hawa2 - 0.1, 'wind'], [T.mo7eetat - 0.1, 'wave'], [T.kol - 0.1, 'second'], [T.tab - 0.1, 'question'],
  [MYST[1] - 0.02, 'no'], [T.ard3 - 0.1, 'slow'], [T.ayam - 0.1, 'dino'], [T.law - 0.1, 'comment'], [T.fahman - 0.15, 'loop'],
];
type SP = {t: number; ti: number};
const SPACE = '#14122a';

// ---- 0. hook: the Earth spinning fast, then it freezes on "وقفت" (screech, sparks, shake); things fly off east
const W0 = 360 / 1.45; // hook spin: exactly one turn by "وقفت" (1.45 s), so it freezes upright
const HookScene: React.FC<SP & {loop?: boolean}> = ({t, loop = false}) => {
  const tf = T.wa2afet0;
  const stopped = !loop && t >= tf;
  const a = loop || t < tf ? W0 * t : W0 * tf + 14 * wobble(t - tf, 3, 6);
  const arcs = loop || t < tf ? 1 : 1 - seg(t, tf, tf + 0.12);
  const jit = stopped ? Math.exp(-(t - tf) * 4) * 9 : 0;
  const fly = stopped ? easeOut(seg(t, tf + 0.05, tf + 1.1)) : 0;
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill={SPACE} />
      <Stars t={t} />
      <g transform={`translate(${MID + Math.sin(t * 61) * jit} ${250 + Math.cos(t * 53) * jit})`}>
        <SpinArcs r={175} a={a * 1.15} k={arcs} n={4} />
        <EarthPic r={175} a={a} />
        {stopped && fly > 0 && [[-60, -150, 0], [40, -168, 1], [120, -110, 2], [-130, -100, 3]].map(([x, y, i]) => (
          <g key={i} transform={`translate(${x + fly * (260 + i * 60)} ${y - fly * 40 - i * 4}) rotate(${fly * (200 + i * 90)})`}>
            {i === 1 ? <g transform="scale(0.6)"><Car /></g> : <Mini c={KID_C[i]} s={0.8} arms />}
          </g>
        ))}
      </g>
      {stopped && t < tf + 0.6 && Array.from({length: 10}, (_, i) => {
        const u = seg(t, tf, tf + 0.5), ang = -0.6 + (i / 9) * 1.2;
        return <path key={i} d={`M ${MID + 185 + u * 30} ${250} l ${Math.cos(ang) * (30 + u * 90)} ${Math.sin(ang) * (30 + u * 90)}`} stroke={i % 2 ? YELLOW : ORANGE} strokeWidth={7} strokeLinecap="round" opacity={1 - u} />;
      })}
      {stopped && <g transform={`translate(${MID - 270} 110) scale(${popIn(t - tf, 0.2)}) rotate(-8)`}>
        <path d="M -60 -26 L 0 -70 L 60 -26 L 60 26 L 0 70 L -60 26 Z" fill={RED} stroke={INK} strokeWidth={8} strokeLinejoin="round" transform="rotate(22)" />
        <Txt x={0} y={20} size={54} fill="#fff" sw={0.06}>قِف!</Txt>
      </g>}
    </g>
  );
};

// ---- 1. it spins crazy fast and we don't feel it (calm little man sitting on top)
const SpinScene: React.FC<SP> = ({t, ti}) => {
  const k = 0.4 + 0.6 * seg(t, T.besor3a, T.magnoona + 0.3);
  const a = 40 * ti + 120 * Math.max(0, ti - T.besor3a);
  const man = popIn(t - T.we7na + 0.05, 0.26), calm = popIn(t - T.hasseen, 0.24);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill={SPACE} />
      <Stars t={ti} seed={3} />
      <g transform={`translate(300 270)`}>
        <SpinArcs r={160} a={a * 1.2} k={k} c={YELLOW} n={4} />
        <EarthPic r={160} a={a} />
        {man > 0.01 && <g transform={`translate(0 -160) scale(${man})`}>
          <Mini c={ORANGE} s={1.5} />
          <path d="M -12 -72 q 6 -5 10 0 M 4 -72 q 6 -5 10 0" stroke={INK} strokeWidth={3} fill="none" transform="translate(-1 0)" />
        </g>}
      </g>
      {calm > 0.01 && <g transform={`translate(660 220) scale(${calm})`}>
        <circle r={78} fill={YELLOW} stroke={INK} strokeWidth={8} />
        <path d="M -38 -12 q 14 -12 28 0 M 10 -12 q 14 -12 28 0" stroke={INK} strokeWidth={8} fill="none" strokeLinecap="round" />
        <path d="M -28 24 q 28 22 56 0" stroke={INK} strokeWidth={8} fill="none" strokeLinecap="round" />
        <Txt x={0} y={150} size={50} fill={CHALK}>ولا حاسين</Txt>
        {[0, 1, 2].map((i) => <text key={i} x={70 + i * 26} y={-70 - i * 26 - Math.sin(ti * 2 + i) * 6} fontFamily="Cairo" fontWeight={900} fontSize={30 + i * 8} fill={CHALK} opacity={0.8}>z</text>)}
      </g>}
    </g>
  );
};

// ---- 2. the speedometer: 1670 km/h at the equator, then 1450 on "مصر" (a pin on Egypt, the needle drops)
const Gauge: React.FC<{v: number; label: string}> = ({v, label}) => {
  const ang = (x: number) => Math.PI * (1 - x / 2000);
  return (
    <g>
      <path d="M -170 0 A 170 170 0 0 1 170 0 Z" fill="#fffaf0" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
      <path d={`M ${Math.cos(ang(1500)) * 150} ${-Math.sin(ang(1500)) * 150} A 150 150 0 0 1 150 0`} stroke={RED} strokeWidth={18} fill="none" />
      {Array.from({length: 11}, (_, i) => { const a = ang(i * 200); return <path key={i} d={`M ${Math.cos(a) * 128} ${-Math.sin(a) * 128} L ${Math.cos(a) * 158} ${-Math.sin(a) * 158}`} stroke={INK} strokeWidth={i % 5 === 0 ? 7 : 4} />; })}
      <path d={`M 0 0 L ${Math.cos(ang(v)) * 140} ${-Math.sin(ang(v)) * 140}`} stroke={INK} strokeWidth={14} strokeLinecap="round" />
      <path d={`M 0 0 L ${Math.cos(ang(v)) * 136} ${-Math.sin(ang(v)) * 136}`} stroke={RED} strokeWidth={7} strokeLinecap="round" />
      <circle r={16} fill={INK} />
      <rect x={-118} y={20} width={236} height={78} rx={16} fill="#101418" stroke={INK} strokeWidth={6} />
      <Txt x={0} y={78} size={52} fill="#6dff8c" sw={0}>{`${ar(Math.round(v / 10) * 10)} كم/س`}</Txt>
      <Txt x={0} y={150} size={44} fill={YELLOW}>{label}</Txt>
    </g>
  );
};
const SpeedScene: React.FC<SP> = ({t, ti}) => {
  const a = 30 * ti;
  const up = easeInOut(seg(t, T.hawaly, T.sab3een + 0.35)), down = easeInOut(seg(t, T.masr, T.arba3meya + 0.3));
  const v = 1670 * up - 220 * down;
  const g = popIn(t - T.and3 + 0.05, 0.28), eq = easeOut(seg(t, T.khat, T.estwa + 0.4));
  const pin = popIn(t - T.masr, 0.24);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill={SPACE} />
      <Stars t={ti} n={10} seed={5} />
      <g transform="translate(225 250)">
        <SpinArcs r={150} a={a * 1.4} k={0.7} n={3} />
        <EarthPic r={150} a={0} />
        {eq > 0.01 && <g>
          <path d={`M ${-150 * eq} 36 Q 0 ${36 + 22 * eq} ${150 * eq} 36`} stroke={INK} strokeWidth={11} fill="none" />
          <path d={`M ${-150 * eq} 36 Q 0 ${36 + 22 * eq} ${150 * eq} 36`} stroke={RED} strokeWidth={6} fill="none" strokeDasharray="16 10" />
        </g>}
        {pin > 0.01 && <g>
          <path d="M -140 -50 Q 0 -38 140 -50" stroke={YELLOW} strokeWidth={6} fill="none" strokeDasharray="12 9" opacity={pin} />
          <g transform={`translate(42 -50) scale(${pin})`}>
            <path d="M 0 0 C -16 -22 -22 -32 -22 -44 A 22 22 0 0 1 22 -44 C 22 -32 16 -22 0 0 Z" fill={RED} stroke={INK} strokeWidth={5} />
            <circle cx={0} cy={-44} r={8} fill="#fff" />
          </g>
        </g>}
      </g>
      {g > 0.01 && <g transform={`translate(620 250) scale(${0.95 * g})`}><Gauge v={v} label={t < T.masr ? 'خط الاستوا' : 'مصر'} /></g>}
    </g>
  );
};

// ---- 3. faster than a passenger plane: a race lane, the Earth zooms past the plane
const PlaneScene: React.FC<SP> = ({t, ti}) => {
  const u = seg(t, T.asra3 - 0.1, T.rokkab + 0.6);
  const px = 150 + 260 * easeInOut(u), ex = 150 + 560 * easeInOut(u);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#6ec3ff" />
      {[0, 1, 2].map((i) => <ellipse key={i} cx={pm(120 + i * 300 - ti * 40, BW + 200) - 100} cy={70 + i * 30} rx={70} ry={24} fill="#fff" opacity={0.85} />)}
      {[170, 360].map((y) => <path key={y} d={`M 40 ${y + 60} L ${BW - 40} ${y + 60}`} stroke="#fff" strokeWidth={5} strokeDasharray="22 16" opacity={0.7} />)}
      <path d={`M ${BW - 60} 30 L ${BW - 60} 460`} stroke={INK} strokeWidth={7} strokeDasharray="20 14" />
      <g transform={`translate(${px} ${180 + Math.sin(ti * 4) * 4})`}><Plane /></g>
      <g transform={`translate(${px} 268)`}><Txt x={0} y={0} size={40} fill="#fff">٩٠٠ كم/س</Txt></g>
      <g transform={`translate(${ex} 372)`}>
        {[1, 2, 3].map((i) => <path key={i} d={`M ${-80 - i * 30} ${-30 + i * 15} l -70 0`} stroke="#fff" strokeWidth={8} strokeLinecap="round" opacity={0.8 * u} />)}
        <EarthPic r={62} a={ti * 300} />
      </g>
      <g transform={`translate(${ex} 470)`}><Txt x={0} y={0} size={40} fill={YELLOW}>١٤٥٠ كم/س</Txt></g>
    </g>
  );
};

// ---- 4. everything spins with us: air, sea, houses and you ride on the Earth
const TogetherScene: React.FC<SP> = ({t, ti}) => {
  const a = 28 * ti;
  const items: [number, React.ReactNode, number][] = [
    [T.hawa, <Swirl />, -130], [T.ba7r, <SeaWave />, -40], [T.beyoot, <House />, 50], [T.enta, <Mini c={ORANGE} s={1.3} />, 140],
  ];
  const ring = easeOut(seg(t, T.hawaleena - 0.1, T.ma3ana + 0.3));
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill={SPACE} />
      <Stars t={ti} seed={7} />
      <g transform={`translate(${MID} 300)`}>
        {ring > 0.01 && <g transform={`rotate(${a})`} opacity={ring}>
          <path d="M 0 -232 A 232 232 0 1 1 -200 -118" fill="none" stroke={INK} strokeWidth={14} />
          <path d="M 0 -232 A 232 232 0 1 1 -200 -118" fill="none" stroke={YELLOW} strokeWidth={7} strokeDasharray="18 12" />
          <path d="M -214 -96 L -184 -146 L -236 -140 Z" fill={YELLOW} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        </g>}
        <g transform={`rotate(${a})`}>
          <EarthPic r={160} a={0} />
          {items.map(([t0, node, deg], i) => {
            const s = popIn(t - t0, 0.24);
            return s > 0.01 && <g key={i} transform={`rotate(${deg}) translate(0 -158) scale(${s})`}>{node}</g>;
          })}
        </g>
      </g>
    </g>
  );
};

// ---- 5. if it stopped suddenly: the spin brakes to a halt (STOP), but loose things keep going at the same speed
const StopScene: React.FC<SP> = ({t, ti}) => {
  const tb = T.wa2afet, ts = T.hatoaf;
  const omega = (x: number) => (x < tb ? 160 : x < ts ? 160 * (1 - (x - tb) / (ts - tb)) : 0);
  const a = t < tb ? 160 * t : t < ts ? 160 * tb + 160 * (t - tb) - (80 * (t - tb) ** 2) / (ts - tb) : 160 * tb + 80 * (ts - tb);
  const stopped = t >= ts;
  const go = stopped ? seg(t, T.hatkammel - 0.1, T.sor3a + 0.7) : 0;
  const loose = popIn(t - T.laken, 0.24);
  const stop = popIn(t - ts, 0.22);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill={SPACE} />
      <Stars t={ti} seed={9} />
      <g transform="translate(270 270)">
        <SpinArcs r={170} a={a * 1.2} k={clamp(omega(t) / 160)} n={4} c={YELLOW} />
        <EarthPic r={170} a={a} />
        {loose > 0.01 && [[-40, 0], [30, 1], [100, 2]].map(([deg, i]) => {
          const d = go * (420 + i * 80);
          return <g key={i} transform={`rotate(${deg}) translate(${d} ${-172 - go * 20}) scale(${loose})`}>
            {go > 0.05 && <path d="M -30 -20 l -70 0 M -30 -40 l -50 0" stroke={CHALK} strokeWidth={6} strokeLinecap="round" opacity={0.8} />}
            {i === 1 ? <g transform="scale(0.55)"><Car /></g> : <Mini c={KID_C[i + 1]} s={1.1} arms={go > 0.05} />}
          </g>;
        })}
      </g>
      {stop > 0.01 && <g transform={`translate(640 150) scale(${stop}) rotate(${wobble(t - ts, 3, 5) * 10})`}>
        <path d="M -38 -92 L 38 -92 L 92 -38 L 92 38 L 38 92 L -38 92 L -92 38 L -92 -38 Z" fill={RED} stroke={INK} strokeWidth={9} strokeLinejoin="round" />
        <path d="M -32 -78 L 32 -78 L 78 -32 L 78 32 L 32 78 L -32 78 L -78 32 L -78 -32 Z" fill="none" stroke="#fff" strokeWidth={6} />
        <Txt x={0} y={22} size={72} fill="#fff" sw={0.05}>قِف</Txt>
      </g>}
      {go > 0.2 && <g transform={`translate(640 380) scale(${popIn(t - T.nafs, 0.24)})`}>
        <rect x={-150} y={-44} width={300} height={78} rx={16} fill="#101418" stroke={INK} strokeWidth={6} />
        <Txt x={0} y={16} size={50} fill="#6dff8c" sw={0}>١٤٥٠ كم/س</Txt>
      </g>}
    </g>
  );
};

// ---- 6. you and the cars thrown east (to the right), wind lines, the sea sloshing
const FLY = Array.from({length: 9}, (_, i) => ({x: 60 + i * 70, car: i % 3 === 1, c: KID_C[i % 8], d: i * 0.07, rot: 220 + rand(i * 3.1) * 300}));
const FlyScene: React.FC<SP> = ({t, ti}) => {
  const lift = (d: number) => seg(t, T.enta2 - 0.1 + d, T.shar2 + 0.6 + d);
  const east = popIn(t - T.na7yet, 0.26);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#8fd0ff" />
      {Array.from({length: 12}, (_, i) => { const y = 40 + rand(i * 2.3) * 300, x = pm(rand(i * 5.1) * BW + ti * (700 + rand(i) * 400), BW + 300) - 150;
        return <path key={i} d={`M ${x} ${y} l 120 0`} stroke="#fff" strokeWidth={6} strokeLinecap="round" opacity={0.7} />; })}
      <path d={`M 0 400 Q 200 380 430 400 T ${BW} 396 L ${BW} ${BH} L 0 ${BH} Z`} fill={GREEN} stroke={INK} strokeWidth={6} />
      <path d={`M 0 430 L ${BW} 430`} stroke="#555" strokeWidth={26} /><path d={`M 0 430 L ${BW} 430`} stroke="#fff" strokeWidth={4} strokeDasharray="26 22" />
      <path d={`M 0 ${380 - 30 * seg(t, T.enta2, T.shar2)} Q 60 ${360 - 40 * seg(t, T.enta2, T.shar2)} 140 ${410} L 0 ${BH} Z`} fill={BLUE} stroke={INK} strokeWidth={5} />
      {FLY.map((f, i) => {
        const u = easeIn(lift(f.d));
        return <g key={i} transform={`translate(${f.x + u * 900} ${(f.car ? 420 : 416) - Math.sin(u * Math.PI * 0.8) * 160 - u * 40}) rotate(${u * f.rot})`}>
          {f.car ? <g transform="scale(0.7)"><Car c={f.c} /></g> : <Mini c={f.c} s={1.1} arms={u > 0.01} />}
        </g>;
      })}
      {east > 0.01 && <g transform={`translate(660 90) scale(${east})`}>
        <path d="M -90 -18 L 40 -18 L 40 -44 L 96 0 L 40 44 L 40 18 L -90 18 Z" fill={YELLOW} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
        <Txt x={-150} y={20} size={58} fill="#fff">الشرق</Txt>
      </g>}
    </g>
  );
};

// ---- 7. winds stronger than any hurricane: streaming wind lines, bending trees, a hurricane spiral blown away
const Tree: React.FC<{bend: number; ti: number}> = ({bend, ti}) => {
  const b = bend * (1 + 0.12 * Math.sin(ti * 14));
  return (
    <g>
      <path d={`M 0 0 Q ${b * 20} -60 ${b * 70} -110`} stroke="#8a5a33" strokeWidth={18} fill="none" strokeLinecap="round" />
      <g transform={`translate(${b * 76} -124) rotate(${b * 40})`}><ellipse rx={56 - b * 8} ry={40} fill={GREEN} stroke={INK} strokeWidth={6} /></g>
    </g>
  );
};
const WindScene: React.FC<SP> = ({t, ti}) => {
  const k = 0.5 + 0.5 * seg(t, T.riya7, T.a2wa + 0.3);
  const hur = popIn(t - T.e3sar + 0.05, 0.26), away = easeIn(seg(t, T.etshafet, T.etshafet + 0.9));
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#5d7f9e" />
      {Array.from({length: 22}, (_, i) => { const y = 20 + rand(i * 1.7) * 380, x = pm(rand(i * 3.3) * BW + ti * (1100 + rand(i) * 700) * k, BW + 400) - 250;
        return <path key={i} d={`M ${x} ${y} q 60 -14 130 0 q 40 10 70 -6`} stroke="#fff" strokeWidth={5 + (i % 3) * 2} fill="none" strokeLinecap="round" opacity={0.55 + 0.3 * (i % 2)} />; })}
      <path d={`M 0 420 L ${BW} 420 L ${BW} ${BH} L 0 ${BH} Z`} fill="#3b7a46" stroke={INK} strokeWidth={6} />
      {[90, 230, 380].map((x, i) => <g key={x} transform={`translate(${x} 424)`}><Tree bend={k * (0.9 + i * 0.1)} ti={ti + i} /></g>)}
      {Array.from({length: 8}, (_, i) => { const u = pm(ti * 0.9 + i / 8, 1); return <ellipse key={i} cx={100 + u * 800} cy={300 - i * 25 + Math.sin(u * 12 + i) * 30} rx={9} ry={5} fill={i % 2 ? GREEN : '#c8e66a'} stroke={INK} strokeWidth={2} transform={`rotate(${u * 720} ${100 + u * 800} ${300 - i * 25})`} />; })}
      {hur > 0.01 && <g transform={`translate(${640 + away * 400} ${200 - away * 60}) scale(${hur * (1 - 0.4 * away)}) rotate(${-ti * 400})`}>
        {[0, 120, 240].map((d) => <path key={d} transform={`rotate(${d})`} d="M 0 0 Q 40 -10 50 -50 Q 54 -86 20 -100" stroke={INK} strokeWidth={22} fill="none" strokeLinecap="round" />)}
        {[0, 120, 240].map((d) => <path key={d + 1} transform={`rotate(${d})`} d="M 0 0 Q 40 -10 50 -50 Q 54 -86 20 -100" stroke="#e8f6ff" strokeWidth={12} fill="none" strokeLinecap="round" />)}
        <circle r={16} fill={SPACE} stroke={INK} strokeWidth={5} />
      </g>}
      {hur > 0.01 && away < 0.5 && <g transform={`translate(640 380) scale(${hur})`}><Txt x={0} y={0} size={44} fill="#fff">إعصار</Txt></g>}
    </g>
  );
};

// ---- 8. the oceans keep going: the huge wave (picture) rushes in from the west and floods the city
const CITY = [[440, 150, '#ffd9a0'], [510, 230, '#9ec5ff'], [590, 180, '#ffb38a'], [660, 270, '#c9b6ff'], [740, 200, '#a8e6a0'], [810, 150, '#ffe08a']] as [number, number, string][];
const WaveScene: React.FC<SP> = ({t, ti}) => {
  const inn = easeOut(seg(t, T.amwag - 0.1, T.hatodrab + 0.15));
  const hit = t >= T.hatodrab;
  const flood = easeInOut(seg(t, T.tegra2 - 0.05, T.kamla + 0.5));
  const tilt = hit ? easeOut(seg(t, T.hatodrab, T.hatodrab + 0.6)) : 0;
  const wx = lerp(-330, 330, inn), ws = lerp(0.55, 1, inn);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#f6b26b" />
      <rect x={0} y={0} width={BW} height={BH * 0.55} fill="#ffcf8a" opacity={0.6} />
      {CITY.map(([x, h, c], i) => (
        <g key={i} transform={`translate(${x + 30} 440) rotate(${tilt * (6 + i * 2) * (i % 2 ? 1 : -0.6)})`}>
          <rect x={-32} y={-h} width={64} height={h} fill={c} stroke={INK} strokeWidth={6} />
          {Array.from({length: Math.floor(h / 46)}, (_, r) => [-14, 14].map((dx) => <rect key={`${r}${dx}`} x={dx - 8} y={-h + 16 + r * 46} width={16} height={20} fill="#fff8d6" stroke={INK} strokeWidth={3} />))}
        </g>
      ))}
      <path d={`M 0 440 L ${BW} 440 L ${BW} ${BH} L 0 ${BH} Z`} fill="#8a7a5a" stroke={INK} strokeWidth={6} />
      {flood > 0.01 && <path d={`M 0 ${BH} L 0 ${440 - flood * 300} ${Array.from({length: 18}, (_, i) => `Q ${i * 50 + 25} ${440 - flood * 300 - 18 * Math.sin(ti * 6 + i)} ${(i + 1) * 50} ${440 - flood * 300}`).join(' ')} L ${BW} ${BH} Z`} fill={BLUE} stroke={INK} strokeWidth={6} opacity={0.92} />}
      {inn > 0.01 && <g transform={`translate(${wx} ${BH + 10}) scale(${ws})`}><Pic n="wave" w={560} /></g>}
      {hit && t < T.hatodrab + 0.7 && Array.from({length: 12}, (_, i) => {
        const u = seg(t, T.hatodrab, T.hatodrab + 0.7), ang = -Math.PI * (0.15 + (i / 11) * 0.7);
        return <circle key={i} cx={440 + Math.cos(ang) * u * 200} cy={330 + Math.sin(ang) * u * 220 + u * u * 120} r={12 - u * 6} fill="#e8f6ff" stroke={INK} strokeWidth={3} opacity={1 - u} />;
      })}
    </g>
  );
};

// ---- 9. all that in ONE second: a 1-second stopwatch sweeping once
const Stopwatch: React.FC<{u: number}> = ({u}) => (
  <g>
    <rect x={-22} y={-150} width={44} height={30} rx={8} fill="#9aa2ad" stroke={INK} strokeWidth={6} />
    <circle r={126} fill="#fffaf0" stroke={INK} strokeWidth={11} />
    {u > 0 && <path d={`M 0 0 L 0 -110 A 110 110 0 ${u > 0.5 ? 1 : 0} 1 ${Math.sin(u * Math.PI * 2) * 110} ${-Math.cos(u * Math.PI * 2) * 110} Z`} fill={RED} opacity={0.35} />}
    {Array.from({length: 10}, (_, i) => <path key={i} d={`M ${Math.sin((i / 10) * Math.PI * 2) * 96} ${-Math.cos((i / 10) * Math.PI * 2) * 96} L ${Math.sin((i / 10) * Math.PI * 2) * 112} ${-Math.cos((i / 10) * Math.PI * 2) * 112}`} stroke={INK} strokeWidth={6} />)}
    <path d={`M 0 0 L ${Math.sin(u * Math.PI * 2) * 100} ${-Math.cos(u * Math.PI * 2) * 100}`} stroke={RED} strokeWidth={9} strokeLinecap="round" />
    <circle r={12} fill={INK} />
  </g>
);
const SecondScene: React.FC<SP> = ({t, ti}) => {
  const icons = [popIn(t - T.kol + 0.05, 0.22), popIn(t - T.kol - 0.12, 0.22), popIn(t - T.kol - 0.24, 0.22)];
  const sw = popIn(t - T.kol - 0.2, 0.26);
  const u = clamp(t - T.sanya);
  const one = popIn(t - T.wa7da, 0.24);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#2a1f3a" />
      <g transform={`translate(300 270) scale(${sw})`}><Stopwatch u={u} /></g>
      {icons[0] > 0.01 && <g transform={`translate(620 120) scale(${0.7 * icons[0]})`}><Car /></g>}
      {icons[1] > 0.01 && <g transform={`translate(740 110) scale(${0.8 * icons[1]})`}><Swirl /></g>}
      {icons[2] > 0.01 && <g transform={`translate(680 210) scale(${icons[2]})`}><Pic n="wave" w={120} /></g>}
      {one > 0.01 && <g transform={`translate(660 380) scale(${one * (1 + 0.08 * Math.max(0, Math.sin((t - T.bas2) * 9)) * (t > T.bas2 ? 1 : 0))})`}>
        <Txt x={0} y={20} size={80} fill={YELLOW}>ثانية واحدة</Txt>
      </g>}
    </g>
  );
};

// ---- 10. can the Earth really stop? a big pulsing question mark (held through the mystery pause)
const QuestionScene: React.FC<SP> = ({t, ti}) => {
  const q = popIn(t - T.teftekir, 0.3);
  const pulse = 1 + 0.08 * Math.sin(ti * 5);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill={SPACE} />
      <Stars t={ti} seed={11} />
      <g transform="translate(260 260)"><SpinArcs r={140} a={ti * 60} k={0.6} n={3} /><EarthPic r={140} a={ti * 40} /></g>
      <QMark x={630} y={390} size={360} s={q * pulse} rot={Math.sin(ti * 2) * 6} />
    </g>
  );
};

// ---- 11. the answer: "لأ" (huge, red); no energy in the universe could stop it (an empty battery, crossed out)
const NoScene: React.FC<SP> = ({t, ti}) => {
  const no = popIn(t - T.la2 + 0.04, 0.22);
  const bat = popIn(t - T.mafeesh, 0.26), x = popIn(t - T.tekfy, 0.22);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#2b1420" />
      <g transform="translate(160 300)"><EarthPic r={110} a={ti * 40} /></g>
      {no > 0.01 && <g transform={`translate(440 290) scale(${no}) rotate(${wobble(t - T.la2, 3, 5) * 6})`}>
        <Txt x={0} y={80} size={300} fill={RED} sw={0.07}>لأ</Txt>
      </g>}
      {bat > 0.01 && <g transform={`translate(700 250) scale(${bat})`}>
        <rect x={-54} y={-100} width={108} height={200} rx={16} fill="#fffaf0" stroke={INK} strokeWidth={9} />
        <rect x={-24} y={-122} width={48} height={24} rx={6} fill="#9aa2ad" stroke={INK} strokeWidth={6} />
        <rect x={-38} y={56} width={76} height={30} rx={6} fill={RED} opacity={0.5 + 0.5 * Math.abs(Math.sin(ti * 6))} />
        <path d="M 8 -70 L -20 -6 L 2 -6 L -10 40 L 24 -20 L 2 -20 Z" fill={YELLOW} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <Cross x={0} y={0} s={x} r={80} />
        <Txt x={0} y={160} size={44} fill={CHALK}>طاقة</Txt>
      </g>}
    </g>
  );
};

// ---- 12. PAYOFF: it IS slowing down, very gently. The most colourful board: sunset gradient, rainbow trails, a snail, a clock
// that gains a tiny sliver.
const RAINBOW = ['#ff5a4e', '#ff8a3d', '#ffd23f', '#43c46a', '#3d8bff', '#8a5cd6'];
const SlowScene: React.FC<SP> = ({t, ti}) => {
  const a = 70 * ti - 18 * Math.max(0, ti - T.betbata2) ** 1.4;
  const snail = popIn(t - T.bel_ra7a + 0.05, 0.26);
  const clk = popIn(t - T.youm + 0.05, 0.26);
  const sliver = easeInOut(seg(t, T.goz2, T.sogayar + 0.5));
  const tag = popIn(t - T.goz2, 0.24), cent = popIn(t - T.kol2, 0.24);
  return (
    <g>
      <defs>
        <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a1c71" /><stop offset="0.5" stopColor="#d76d77" /><stop offset="1" stopColor="#ffaf7b" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={BW} height={BH} fill="url(#dusk)" />
      {Array.from({length: 14}, (_, i) => <g key={i} transform={`translate(${rand(i * 3.3 + 2) * BW} ${rand(i * 6.1 + 2) * BH * 0.6}) scale(${0.5 + 0.5 * Math.abs(Math.sin(ti * 2 + i))})`}>
        <path d="M 0 -10 L 3 -3 L 10 0 L 3 3 L 0 10 L -3 3 L -10 0 L -3 -3 Z" fill={i % 2 ? '#fff6c8' : '#ffd23f'} /></g>)}
      <g transform="translate(250 250)">
        {RAINBOW.map((c, i) => {
          const R = 160 + 14 + i * 13, a0 = ((a * Math.PI) / 180) + i * 0.15, len = 1.6 - i * 0.12;
          return <path key={c} d={`M ${Math.cos(a0) * R} ${Math.sin(a0) * R} A ${R} ${R} 0 0 1 ${Math.cos(a0 + len) * R} ${Math.sin(a0 + len) * R}`} stroke={c} strokeWidth={11} fill="none" strokeLinecap="round" />;
        })}
        <EarthPic r={160} a={a} />
        {snail > 0.01 && <g transform={`translate(0 -160) scale(${snail})`}>
          <ellipse cx={-4} cy={-6} rx={44} ry={12} fill="#ffb38a" stroke={INK} strokeWidth={5} />
          <circle cx={6} cy={-36} r={28} fill="#c98a3d" stroke={INK} strokeWidth={5} />
          <path d="M 6 -36 m -14 0 a 14 14 0 1 0 14 -14" stroke={INK} strokeWidth={4} fill="none" />
          <path d="M -38 -14 l -8 -24 M -30 -14 l 2 -26" stroke={INK} strokeWidth={4} /><circle cx={-46} cy={-40} r={5} fill={INK} /><circle cx={-28} cy={-42} r={5} fill={INK} />
        </g>}
      </g>
      {clk > 0.01 && <g transform={`translate(650 190) scale(${clk})`}>
        <Clock h={ti * 0.4} extra={0.12 + sliver * 0.22} r={110} />
      </g>}
      {tag > 0.01 && <g transform={`translate(650 372) scale(${tag})`}>
        <rect x={-150} y={-46} width={300} height={78} rx={20} fill={YELLOW} stroke={INK} strokeWidth={7} />
        <Txt x={0} y={14} size={44} fill={INK} sw={0}>+ جزء من ثانية</Txt>
      </g>}
      {cent > 0.01 && <g transform={`translate(650 452) scale(${cent})`}><Txt x={0} y={10} size={42} fill="#fff">كل ١٠٠ سنة</Txt></g>}
    </g>
  );
};

// ---- 13. the dinosaurs' day was ~half an hour shorter: the dinosaur silhouette at sunset, a clock with "−½ ساعة"
const DinoScene: React.FC<SP> = ({t, ti}) => {
  const d = popIn(t - T.dinos + 0.05, 0.3);
  const clk = popIn(t - T.youm2, 0.26), tag = popIn(t - T.a2sar, 0.24);
  const walk = Math.sin(ti * 5) * 3;
  return (
    <g>
      <defs>
        <linearGradient id="jura" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff9a3d" /><stop offset="1" stopColor="#ffd36e" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={BW} height={BH} fill="url(#jura)" />
      <circle cx={600} cy={300} r={120} fill="#fff1b0" opacity={0.9} />
      <path d="M 520 420 L 620 250 L 650 262 L 680 245 L 790 420 Z" fill="#5a3a2a" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      {[0, 1, 2].map((i) => <circle key={i} cx={652 + Math.sin(ti * 1.5 + i) * 10} cy={230 - i * 34 - pm(ti * 20, 30)} r={14 + i * 6} fill="#7a6a6a" opacity={0.6} />)}
      <path d={`M 0 420 L ${BW} 420 L ${BW} ${BH} L 0 ${BH} Z`} fill="#3a4a2a" stroke={INK} strokeWidth={6} />
      {[60, 470, 800].map((x) => <g key={x} transform={`translate(${x} 424)`}>{[-50, -20, 10, 40].map((r) => <path key={r} d="M 0 0 Q 10 -50 40 -80" transform={`rotate(${r})`} stroke="#2e5a2a" strokeWidth={10} fill="none" strokeLinecap="round" />)}</g>)}
      {d > 0.01 && <g transform={`translate(${250 + walk} ${430 - Math.abs(walk)}) scale(${d})`}><Pic n="dino" w={420} /></g>}
      {clk > 0.01 && <g transform={`translate(160 120) scale(${clk * 0.85})`}><Clock h={pm(ti * 0.6, 12)} r={90} /></g>}
      {tag > 0.01 && <g transform={`translate(330 110) scale(${tag}) rotate(-6)`}>
        <rect x={-110} y={-52} width={250} height={92} rx={22} fill={RED} stroke={INK} strokeWidth={7} />
        <Txt x={-30} y={20} size={56} fill="#fff" sw={0.05}>ساعة</Txt>
        <Txt x={80} y={22} size={64} fill="#fff" rtl={false} sw={0.05}>-½</Txt>
      </g>}
    </g>
  );
};

// ---- 14. outro: a comment bubble with "طب لو...؟" and a down arrow
const CommentScene: React.FC<SP> = ({t, ti}) => {
  const cm = popIn(t - T.law + 0.05, 0.28), q = popIn(t - T.tablaw + 0.02, 0.26), ar2 = popIn(t - T.ekteb, 0.24);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#1f3446" />
      {cm > 0.01 && <g transform={`translate(${MID} ${230 + Math.sin(ti * 3) * 5}) scale(${cm})`}>
        <path d="M -300 -150 Q -300 -180 -270 -180 L 270 -180 Q 300 -180 300 -150 L 300 60 Q 300 90 270 90 L 60 90 L -10 160 L 0 90 L -270 90 Q -300 90 -300 60 Z" fill="#fff" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
        {q > 0.01 ? <g transform={`scale(${q})`}><Txt x={0} y={-12} size={104} fill={INK} sw={0}>طب لو...؟</Txt></g>
          : [-60, 0, 60].map((x) => <circle key={x} cx={x} cy={-46} r={18} fill={INK} />)}
        {ar2 > 0.01 && <g transform={`translate(250 ${66 + Math.abs(Math.sin(ti * 6)) * 12}) scale(${0.5 * ar2})`}><DownArrow /></g>}
      </g>}
      {q > 0.01 && <g transform={`translate(120 420) scale(${q})`}><EarthPic r={46} a={ti * 60} /></g>}
      {q > 0.01 && <g transform={`translate(${BW - 120} 420) scale(${q})`}><QMark x={0} y={40} size={120} s={1} /></g>}
    </g>
  );
};

const Board: React.FC<{t: number; dim: number}> = ({t, dim}) => {
  const ti = idle(t);
  let i = 0;
  for (let k = 0; k < SCENES.length; k++) if (t >= SCENES[k][0]) i = k;
  const [start, scene] = SCENES[i];
  const e = i === 0 ? 1 : easeInOut(seg(t, start, start + PUSH));
  const prev = i > 0 && e < 1 ? SCENES[i - 1][1] : null;
  const draw = (s: Scene) => (
    <g>
      {s === 'hook' && <HookScene t={t} ti={ti} />}
      {s === 'spin' && <SpinScene t={t} ti={ti} />}
      {s === 'speed' && <SpeedScene t={t} ti={ti} />}
      {s === 'plane' && <PlaneScene t={t} ti={ti} />}
      {s === 'together' && <TogetherScene t={t} ti={ti} />}
      {s === 'stop' && <StopScene t={t} ti={ti} />}
      {s === 'fly' && <FlyScene t={t} ti={ti} />}
      {s === 'wind' && <WindScene t={t} ti={ti} />}
      {s === 'wave' && <WaveScene t={t} ti={ti} />}
      {s === 'second' && <SecondScene t={t} ti={ti} />}
      {s === 'question' && <QuestionScene t={t} ti={ti} />}
      {s === 'no' && <NoScene t={t} ti={ti} />}
      {s === 'slow' && <SlowScene t={t} ti={ti} />}
      {s === 'dino' && <DinoScene t={t} ti={ti} />}
      {s === 'comment' && <CommentScene t={t} ti={ti} />}
      {/* the hook drawing again, running into its frame-0 state at the last frame (loop) */}
      {s === 'loop' && <HookScene t={t - END} ti={t - END} loop />}
    </g>
  );
  // the question is swapped for the answer in place (no push): a quick white flash
  const flash = 1 - seg(t, MYST[1] - 0.02, MYST[1] + 0.25);
  const isReveal = scene === 'no' && prev === 'question';
  return (
    <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        <radialGradient id="spot" cx="50%" cy="42%" r="62%">
          <stop offset="0" stopColor="#fff6d8" stopOpacity={0.08} /><stop offset="0.6" stopColor="#fff6d8" stopOpacity={0} /><stop offset="1" stopColor="#000" stopOpacity={0.28} />
        </radialGradient>
        <radialGradient id="halo" cx="50%" cy="50%" r="50%">
          <stop offset="0.55" stopColor="#ffe9b0" stopOpacity={0.18} /><stop offset="1" stopColor="#ffe9b0" stopOpacity={0} />
        </radialGradient>
      </defs>
      <g transform={`translate(${BX} ${BY})`}>
        <ellipse cx={MID} cy={BH / 2} rx={BW * 0.82} ry={BH * 0.98} fill="url(#halo)" />
        <rect x={-16} y={-16} width={BW + 32} height={BH + 32} rx={26} fill="#8a5a33" stroke={INK} strokeWidth={10} />
        <rect x={0} y={0} width={BW} height={BH} rx={14} fill="#21302b" stroke={INK} strokeWidth={6} />
        <defs><clipPath id="boardclip"><rect x={3} y={3} width={BW - 6} height={BH - 6} rx={12} /></clipPath></defs>
        <g clipPath="url(#boardclip)">
          {isReveal ? <g>{draw(scene)}</g> : <g>
            {prev && <g transform={`translate(${-BW * e} 0)`}>{draw(prev)}</g>}
            <g transform={`translate(${BW * (1 - e)} 0)`}>{draw(scene)}</g>
          </g>}
          {scene === 'no' && flash > 0 && <rect x={0} y={0} width={BW} height={BH} fill="#fff8e0" opacity={flash * 0.85} />}
          <rect x={0} y={0} width={BW} height={BH} fill="url(#spot)" />
          {dim > 0 && <rect x={0} y={0} width={BW} height={BH} fill="#0b1210" opacity={dim * 0.8} />}
        </g>
      </g>
    </svg>
  );
};

// arrows down to the comments, below the caption
const DownArrows: React.FC<{t: number}> = ({t}) => {
  const s = showScale(t, T.ekteb, T.fahman - 0.12, 0.24, 0.14);
  if (s <= 0.001) return null;
  const b = Math.abs(Math.sin((t - T.ekteb) * 7)) * 22;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      {[392, 664].map((x) => (
        <g key={x} transform={`translate(${x} ${1588 + b}) scale(${s * 1.05})`}>
          <path d="M 0 0 L -52 -60 L -21 -60 L -21 -150 L 21 -150 L 21 -60 L 52 -60 Z" fill={YELLOW} stroke={INK} strokeWidth={10} strokeLinejoin="round" />
        </g>
      ))}
    </svg>
  );
};

// ============================================================ sound
type Cue = [number, string, number];
const SCREECH = 'earth/sfx/screech', WIND = 'earth/sfx/wind', CRASH = 'earth/sfx/crash', TICK = 'doomsday/sfx/tick';
const SFX: Cue[] = [
  // hook: spinning whoosh from frame 0, then the screech + thud when it freezes
  [0, 'whoosh', 0.16], [0.5, 'whoosh', 0.1], [T.wa2afet0 - 0.25, SCREECH, 0.3], [T.wa2afet0, 'thud', 0.3], [T.wa2afet0 + 0.05, 'tremble', 0.16], [T.sanya0, 'pop', 0.14],
  // spinning crazy fast; calm
  [T.besor3a, 'whoosh', 0.14], [T.we7na, 'pop', 0.14], [T.hasseen, 'ding', 0.12],
  // speedometer
  [T.and3, 'pop', 0.14], [T.khat, 'swish', 0.12], ...Array.from({length: 10}, (_, i): Cue => [T.hawaly + i * ((T.sab3een + 0.3 - T.hawaly) / 10), TICK, 0.09]), [T.sab3een + 0.35, 'ding', 0.16],
  [T.masr, 'pop', 0.18], ...Array.from({length: 4}, (_, i): Cue => [T.masr + 0.1 + i * 0.15, TICK, 0.09]),
  // plane race
  [T.asra3 - 0.05, 'whoosh', 0.2], [T.rokkab, 'whoosh', 0.14],
  // everything rides along
  [T.hawaleena, 'swish', 0.12], [T.hawa, 'pop', 0.12], [T.ba7r, 'bubbles', 0.12], [T.beyoot, 'pop', 0.12], [T.enta, 'boing', 0.14],
  // the stop
  [T.wa2afet - 0.1, SCREECH, 0.28], [T.hatoaf, 'thud', 0.3], [T.hatoaf, 'stinger', 0.12], [T.laken, 'pop', 0.12], [T.hatkammel, 'whoosh', 0.18], [T.nafs, 'pop', 0.12],
  // thrown east
  [T.enta2, 'whoosh', 0.18], [T.arabeyat, 'boing', 0.12], [T.hattetaazef, 'whoosh', 0.2], [T.na7yet, 'pop', 0.14],
  // wind
  [T.hawa2 - 0.1, WIND, 0.3], [T.riya7, WIND, 0.24], [T.e3sar, 'pop', 0.12], [T.etshafet, 'whoosh', 0.16],
  // wave
  [T.amwag, 'whoosh', 0.16], [T.hatodrab, CRASH, 0.34], [T.tegra2, 'bubbles', 0.16],
  // one second
  [T.kol, 'pop', 0.12], [T.kol + 0.12, 'pop', 0.12], [T.kol + 0.24, 'pop', 0.12], [T.sanya, TICK, 0.14], [T.sanya + 0.5, TICK, 0.14], [T.sanya + 1, 'ding', 0.16], [T.bas2, 'thud', 0.18],
  // mystery question, answer
  [T.teftekir, 'pop', 0.14], [MYST[1], 'whoosh', 0.16], [T.la2, 'thud', 0.28], [T.mafeesh, 'pop', 0.12], [T.tekfy, 'swish', 0.16],
  // signature: stinger exactly on "استنى"
  [T.estanna, 'stinger', 0.34],
  // payoff: slowing down, the clock, the dinosaur
  [T.ard3, 'sparkle', 0.18], [T.bel_ra7a, 'pop', 0.12], [T.youm, 'pop', 0.14], ...Array.from({length: 3}, (_, i): Cue => [T.goz2 + i * 0.3, TICK, 0.1]), [T.sogayar + 0.3, 'ding', 0.16], [T.kol2, 'pop', 0.12],
  [T.dinos, 'step', 0.2], [T.dinos + 0.45, 'step', 0.2], [T.youm2, 'pop', 0.12], [T.a2sar, 'boing', 0.14],
  // comments
  [T.law, 'pop', 0.22], [T.tablaw, 'pop', 0.16], [T.comments, 'boing', 0.14],
  // ending
  [T.fahman - 0.15, 'swish', 0.24], [T.fahman, 'pop', 0.2], [T.kasban, 'twinkle', 0.34],
];
const SCENE_SWISH: Cue[] = SCENES.slice(1).filter(([, s]) => !['no', 'loop'].includes(s)).map(([tt]): Cue => [tt, 'swish', 0.1]);
const POSE_SWAP_SFX: Cue[] = POSES.slice(1).map(([t]) => [t - 0.06, 'swish', 0.07]);
const sfxFile = (n: string) => (n.includes('/') ? `elfahman/${n}.wav` : `elfahman/sfx/${n}.wav`);

// ============================================================ captions (word for word from the script; hook cards from the brief)
const caps = CAPS as unknown as {sizes: number[]; w100: number[]; base: {normal: number; big: number; gold: number}; cards: Record<string, Partial<Group> & {text?: string}>};
const PAINT: [string, number, string][] = [
  ['مجنونة', 0, RED], ['حاسين', 0, YELLOW], ['الاستواء', 0, YELLOW], ['وسبعين', 0, YELLOW], ['مصر', 0, YELLOW], ['وأربعمية', 0, YELLOW], ['أسرع', 0, YELLOW],
  ['فجأة', 0, RED], ['هتقف', 0, RED], ['السرعة', 0, YELLOW], ['الشرق', 0, YELLOW], ['إعصار', 0, RED], ['ضخمة', 0, RED], ['كاملة', 0, RED],
  ['ثانية', 1, YELLOW], ['واحدة', 0, YELLOW], ['فعلاً', 0, YELLOW], ['لأ', 0, RED], ['استنى', 0, RED], ['الغريب', 0, RED],
  ['بتبطّأ', 0, YELLOW], ['صغير', 0, YELLOW], ['الديناصورات', 0, YELLOW], ['نص', 0, RED], ['ساعة', 0, RED], ['طب', 1, YELLOW], ['لو', 3, YELLOW],
];
const GROUPS: Group[] = (() => {
  const col: Record<number, string> = {};
  for (const [w, nth, c] of PAINT) col[idx(w, nth)] = c;
  const ws0 = words.map((w, k): Word => ({...w, s: w.s + VO, e: w.e + VO, ...(col[k] ? {c: col[k]} : {})}));
  const out: Group[] = []; let i = 0;
  caps.sizes.forEach((n, k) => {
    const ws = ws0.slice(i, i + n); i += n;
    const {text, ...opts} = caps.cards[String(k)] ?? {};
    out.push({words: ws, s: ws[0].s, e: ws[ws.length - 1].e, w100: caps.w100[k], ...opts});
    if (text) out[out.length - 1].words = text.split(' ').map((w, j): Word => ({w, s: ws[0].s, e: ws[ws.length - 1].e, ...(j === text.split(' ').length - 1 || k === 0 ? {c: k === 0 && j === 1 ? RED : YELLOW} : {})}));
  });
  if (i !== words.length) throw new Error(`caption sizes cover ${i} of ${words.length} words`);
  for (const g of out) {
    if (g.words.every((w) => ['الفهمان', 'كسبان'].includes(nq(w.w)))) g.style = 'gold';
    if (g.style !== 'hook') g.fs = g.fs ?? (g.style === 'big' ? caps.base.big : g.style === 'gold' ? caps.base.gold : caps.base.normal);
  }
  for (let k = 0; k < out.length; k++) {
    const nx = out[k + 1];
    out[k].e = nx ? (nx.s - out[k].e < 1.2 ? nx.s : out[k].e + 0.25) : 1e9;
  }
  const pin: Record<string, number> = {'استنى': T.estanna, 'الفهمان': T.fahman, 'كسبان': T.kasban};
  for (const g of out) for (const w of g.words) if (pin[nq(w.w)] !== undefined) w.s = pin[nq(w.w)];
  for (const g of out) g.s = g.words[0].s;
  for (let k = 0; k < out.length - 1; k++) out[k].e = Math.min(out[k].e, out[k + 1].s);
  out[0].s = 0;        // caption 1 "الأرض وقفت!" is on screen in frame 0 ...
  out[0].e = out[1].s; // ... and caption 2 "ثانية واحدة بس؟" replaces it exactly when the voice reaches "ثانية"
  return out;
})();

// ============================================================ composition
const SWEAT = Array.from({length: 6}, (_, i) => T.hawa2 + 0.15 + i * 0.45);
export const Earth: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam0 = camAt(t, CAM0, CAM_KEYS);
  const sh = shakeAt(t, SHAKES);
  const cam: Cam = {x: cam0.x - sh.x, y: cam0.y - sh.y, z: cam0.z};
  const pose = poseAt(t, POSES);
  const squash = Math.max(squashAt(t, POSES), t > END - 0.07 ? Math.sin(((t - END + 0.07) / 0.07) * Math.PI / 2) : 0);
  const vf = Math.round((t - VO) * FPS);
  const talking = TALKABLE.includes(pose) && vf >= 0 && vf < MOUTH.length;
  const mouth = talking ? MOUTH[vf] : 0;
  const blink = BLINKS.some((b) => t >= b && t < b + 0.1) && !['shocked', 'laughing'].includes(pose) && t > 0.3;
  const wink = t >= T.kasban && pose === 'temple'; // wink exactly on "كسبان"
  const sig = t >= T.estanna - 0.02 && t < T.ard3 ? 0.3 * easeOut(seg(t, T.estanna - 0.02, T.estanna + 0.12)) * (1 - seg(t, T.ard3 - 0.3, T.ard3)) : 0;
  // mood: the room dims for the mystery question; a warm, colourful lift on the payoff (slowing Earth)
  const myst = seg(t, T.teftekir - 0.2, T.teftekir + 0.3) * (1 - seg(t, MYST[1] - 0.02, MYST[1] + 0.15));
  const rev = seg(t, T.ard3, T.ard3 + 0.4) * (1 - seg(t, T.ayam - 0.2, T.ayam + 0.3));
  const ROOM = 0.06 + 0.22 * myst;
  const sweat = pose === 'worried' && t >= T.hawa2;
  return (
    <AbsoluteFill style={{backgroundColor: '#140e0b'}}>
      <Fonts />
      <SetBack cam={cam} dim={ROOM + sig} />
      <Layer cam={cam} z={1000}>
        <Board t={t} dim={(sig / 0.3) * 0.32} />
        <Character pose={pose} mouth={mouth} blink={blink} wink={wink} x={CHAR_X} y={CHAR_Y} scale={CS} squash={squash} t={t}>
          <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
            {wink && <Sparkle x={HEAD[0] + 210} y={HEAD[1] - 40} dt={t - T.kasban} r={48} />}
            {sweat && SWEAT.map((s0, i) => <SweatDrop key={i} x={HEAD[0] + (i % 2 ? 230 : -220)} y={HEAD[1] - 170} dt={t - s0} s={0.9} />)}
          </svg>
        </Character>
      </Layer>
      <SetFront cam={cam} dim={ROOM + sig} />
      <AbsoluteFill style={{background: `rgba(255,170,70,${0.05 + 0.08 * rev})`}} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse 78% 62% at 50% 36%, rgba(0,0,0,0) 52%, rgba(0,0,0,${0.3 + sig * 0.6 + myst * 0.2 - rev * 0.12}) 100%)`}} />
      <DownArrows t={t} />
      <Captions t={t} groups={GROUPS} colors={{}} y={1250} x={460} />
      <Sequence from={Math.round(VO * FPS)}><Audio src={staticFile('elfahman/earth/vo/vo.mp3')} volume={1} /></Sequence>
      <Audio src={staticFile('elfahman/earth/music/bed.wav')} volume={1} />
      <Audio src={staticFile('elfahman/earth/music/hits.wav')} volume={1} />
      <Sequence from={Math.round(T.estanna * FPS)} durationInFrames={Math.round(0.6 * FPS)}><Audio src={staticFile('elfahman/earth/music/scratch.wav')} volume={0.8} /></Sequence>
      {[...SFX, ...SCENE_SWISH, ...POSE_SWAP_SFX].map(([tt, n, v], i) => (
        <Sequence key={i} from={Math.max(0, Math.round(tt * FPS))} durationInFrames={Math.round(2.5 * FPS)}>
          <Audio src={staticFile(sfxFile(n))} volume={v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// beats on the board (for QA: the longest time the board goes without a new beat)
export const EARTH_BEATS: number[] = [
  0, T.wa2afet0, T.sanya0, ...SCENES.map(([s]) => s),
  T.besor3a, T.we7na, T.hasseen, T.khat, T.hawaly, T.sab3een, T.masr, T.arba3meya, T.asra3, T.rokkab,
  T.hawaleena, T.hawa, T.ba7r, T.beyoot, T.enta, T.wa2afet, T.hatoaf, T.laken, T.hatkammel, T.nafs,
  T.enta2, T.hattetaazef, T.na7yet, T.riya7, T.a2wa, T.e3sar, T.etshafet, T.amwag, T.hatodrab, T.tegra2, T.kamla,
  T.kol, T.sanya, T.wa7da, T.bas2, T.teftekir, MYST[1], T.la2, T.mafeesh, T.tekfy, T.estanna,
  T.betbata2, T.bel_ra7a, T.youm, T.goz2, T.sogayar, T.kol2, T.dinos, T.youm2, T.a2sar, T.tablaw, T.ekteb, T.fahman, T.kasban,
].sort((a, b) => a - b);
