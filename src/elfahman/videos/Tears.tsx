import React from 'react';
import {AbsoluteFill, Audio, Sequence, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {Fonts} from '../lib/fonts';
import {FPS, clamp, easeIn, easeInOut, easeOut, lerp, popIn, rand, seg} from '../lib/anim';
import {Cam, CamKey, Layer, camAt, shakeAt} from '../lib/camera';
import {SetBack, SetFront, DESK_SCREEN_Y} from '../lib/Set';
import {CANVAS, Character, HEAD, Pose, PoseKey, blinkTimes, mouthStates, poseAt, squashAt} from '../lib/Character';
import {Captions, Group, RED, YELLOW, Word, norm} from '../lib/Captions';
import {INK, Sparkle, showScale} from '../lib/fx';
import WORDS from './tears.words.json';
import ENV from './tears.env.json';
import CAPS from './tears.captions.json';

// Episode 09: "ليه بتعيط لما حد يزعقلك؟" (yelling -> the amygdala hits the alarm -> fight-or-flight with nowhere to go ->
// tears let the pressure out; the strange part: men who sniffed real tears got ~44% less aggressive in a game made to anger them).
// Every picture is drawn in code, except الفهمان's own face on the hook board (the library's `worried` pose, cropped in SVG).
// Voice: the raw take at 1.0x, every silence cut to max 0.25 s (tools/capgaps.py --merge 0.06); the only longer pause is the
// natural one after "تفتكر حصل إيه؟" (0.42 s, cap 0.6 s, never lengthened).
// Hook caption rule (from this episode): caption 1 "ليه بتعيط غصب عنك" (4 words, big, centred) from frame 0, replaced by
// caption 2 "لما حد يزعّقلك؟" exactly when the voice reaches it. The hook board (shouting mouth + his face with a tear) moves
// from frame 0, and the last scene is the same hook board running into its frame-0 state (loop).

// ============================================================ timing
const VO = 0;
const words = WORDS as Word[];
const nq = (w: string) => norm(w).replace(/"/g, '');
const idx = (w: string, nth = 0) => {
  const hits = words.map((x, i) => (nq(x.w) === nq(w) ? i : -1)).filter((i) => i >= 0);
  if (hits[nth] === undefined) throw new Error(`word not found: ${w} #${nth}`);
  return hits[nth];
};
const S = (i: number) => words[i].s + VO; // onset of word i (index in tears.words.json)
const SPEECH_END = 63.94 + VO; // measured end of the last word (scribe_words.pauses.json)
export const TEARS_DURATION_S = Math.round((SPEECH_END + 0.4) * FPS) / FPS; // 0.4 s of silence after the last word
const END = TEARS_DURATION_S;

const T = {
  bet3ayat: S(1), lama: S(4), yeza3a2: S(6),
  etman: S(7), mesh: S(9), da3eef: S(10), wala: S(11), hasas: S(12), lozoom: S(15), da: S(16), mo5ak: S(17), be7awel: S(18), ye7meek: S(19),
  awel: S(20), ye3ali: S(23), soto: S(24), feeh: S(26), goz2: S(27), soghayar: S(28), mo5ak2: S(30), loza: S(32), bete3teber: S(33), za3ee2: S(34),
  khatar: S(36), ka2en: S(37), asad: S(39), oddamak: S(41),
  yedoos: S(42), zorar: S(44), tawari: S(45), alback: S(46), besor3a: S(48), zorak: S(49), yet2efel: S(50), gesmak: S(51), hormonat: S(53), tawatur: S(54),
  bas: S(55), hatgry: S(58), wemesh: S(59), hatdrab: S(60), enta: S(61), wa2ef: S(62), makanak: S(63), wekol: S(64), daght: S(65), ma7boos: S(67), gowak: S(68),
  wehena: S(69), domoo3: S(70), betetla3: S(71), tefok: S(73), daght2: S(74), el3eyat: S(76), besa3ed: S(77), yehda: S(79), weyraga3: S(80), nafasak: S(81),
  nabdak: S(82), tabe3ethom: S(83),
  ashan: S(84), ba3d: S(86), bet3ayat2: S(88), bet7es: S(89), etfaragh: S(91), ertaht: S(92),
  estanna: S(93), ghareeb: S(95), gay: S(96),
  olama: S(97), regala: S(99), yeshemo: S(100), domoo3_2: S(101), ha2e2eya: S(102), men: S(103), ye3rafo: S(106), weba3deen: S(107), la3abohom: S(108),
  le3ba: S(109), ma3mola: S(110), ta3asabhom: S(113),
  teftekir: S(114), eih: S(116), asabeya: S(117), allet: S(119), be7awaly: S(120), arba3a: S(121), arba3een: S(122), meya: S(124),
  ya3ni: S(125), domoo3ak: S(126), resala: S(129), serreya: S(130), lemo5: S(131), oddamak2: S(133), ehda: S(134),
  marra: S(135), eenak: S(138), dama3et: S(139), wa7ad: S(140), beyza3a2: S(141), mattetkesefsh: S(142),
  da2: S(143), gesmak2: S(144), bey3mel: S(145), sho3lo: S(146),
  walaw: S(147), tehda: S(149), khod: S(151), nafas: S(152), bate2: S(153), taweel: S(154), tala3o: S(155), abta2: S(156),
  wenta: S(157), ba2a: S(158), bet3ayat3: S(159), yeza3a2_3: S(162), walla: S(163), betet3aseb: S(164), wetza3a2: S(165), kaman: S(167),
  ekteb: S(168), comments: S(170), fahman: S(171), kasban: S(172),
};
if (nq(words[93].w) !== 'استنى' || nq(words[171].w) !== 'الفهمان' || nq(words[116].w) !== 'إيه') throw new Error('word index table is off');
// signature moments pinned to the measured audio onsets (timing.py)
T.estanna = 32.97 + VO; T.fahman = 62.80 + VO; T.kasban = 63.62 + VO;
// the mystery pause: the real silence after "تفتكر حصل إيه؟" (scribe_words.pauses.json: 41.825-42.244 s, 0.42 s)
const MYST: [number, number] = [41.825 + VO, T.asabeya];
// idle clock: idle wiggles stop during the stare from "استنى" (board held, darker)
const FREEZE: [number, number][] = [[T.estanna, T.olama - 0.05]];
const idle = (t: number) => t - FREEZE.reduce((a, [p0, p1]) => a + clamp(t - p0 - 0.04, 0, p1 - p0 - 0.04), 0);

// ============================================================ character
const TALKABLE: Pose[] = ['hero', 'explain', 'point_up', 'thinking', 'temple', 'thumbs_up', 'worried'];
const POSES: PoseKey[] = [
  [0, 'worried'],               // hook: the one with the tear, from frame 0
  [T.etman, 'explain'],         // "relax, you're not weak"
  [T.da, 'point_up'],           // "it's your brain protecting you"
  [T.awel, 'explain'],          // someone raises their voice
  [T.loza, 'point_up'],         // the amygdala
  [T.asad, 'worried'],          // a lion in front of you
  [T.yedoos, 'explain'],        // the emergency button
  [T.alback, 'worried'],        // heart, throat, hormones
  [T.bas, 'explain'],           // no running, no hitting
  [T.wekol, 'worried'],         // all that pressure trapped inside
  [T.wehena, 'point_up'],       // the tears come out
  [T.el3eyat, 'explain'],       // crying calms the body
  [T.etfaragh, 'thumbs_up'],    // relieved
  [T.estanna, 'shocked'],       // signature line: shocked stare exactly on "استنى"
  [T.olama, 'point_up'],        // the experiment
  [T.weba3deen, 'explain'],     // the game
  [T.teftekir, 'thinking'],     // the mystery question
  [T.asabeya, 'point_up'],      // the reveal
  [T.meya, 'thumbs_up'],
  [T.ya3ni, 'explain'],         // a secret message
  [T.ehda, 'hero'],
  [T.marra, 'explain'],         // next time
  [T.mattetkesefsh, 'thumbs_up'],
  [T.walaw, 'hero'],            // breathing tip
  [T.wenta, 'thinking'],        // the poll
  [T.ekteb, 'explain'],         // comments (arrows do the pointing down)
  [T.fahman, 'temple'],         // ending: hand on temple exactly on "الفهمان"
];
const MOUTH = mouthStates((ENV as {level: number[]}).level);
const BLINKS = blinkTimes(END, 9);

const CS = 0.6;
const CHAR_X = 540 - (CANVAS[0] * CS) / 2;
const CHAR_Y = DESK_SCREEN_Y - 1450 * CS;

// ============================================================ camera
const CAM0: Cam = {x: 520, y: 860, z: 180};
const BASE: Cam = {x: 512, y: 866, z: 125};
const NEAR: Cam = {x: 510, y: 850, z: 150};
const CAM_KEYS: CamKey[] = [
  [0, 1.0, {x: 512, y: 872, z: 120}],                              // pulls back from frame 0
  [T.etman - 0.1, T.etman + 0.4, BASE],
  [T.da - 0.05, T.ye7meek + 0.3, NEAR],
  [T.awel - 0.1, T.awel + 0.4, BASE],
  [T.loza - 0.05, T.loza + 0.3, {x: 510, y: 840, z: 160}],          // close on the glowing almond
  [T.khatar - 0.1, T.khatar + 0.3, BASE],
  [T.asad - 0.03, T.asad + 0.15, {x: 508, y: 846, z: 158}],         // the lion pops up
  [T.yedoos - 0.1, T.yedoos + 0.4, BASE],
  [T.alback - 0.05, T.tawatur + 0.3, NEAR],
  [T.bas - 0.1, T.bas + 0.4, BASE],
  [T.wekol - 0.05, T.gowak + 0.3, {x: 510, y: 846, z: 158}],         // the pressure builds
  [T.wehena - 0.1, T.wehena + 0.4, BASE],
  [T.el3eyat - 0.1, T.el3eyat + 0.5, {x: 512, y: 868, z: 118}],      // calmer
  [T.etfaragh - 0.1, T.etfaragh + 0.4, BASE],
  [T.estanna - 0.04, T.estanna + 0.1, {x: 540, y: 690, z: 280}],    // punch-in exactly on "استنى" (the board stays in frame)
  [T.olama - 0.1, T.olama + 0.4, BASE],
  [T.weba3deen - 0.05, T.ta3asabhom + 0.3, NEAR],
  [T.teftekir - 0.05, MYST[1] - 0.02, {x: 512, y: 780, z: 215}],   // slow push-in on the question
  [MYST[1] - 0.02, MYST[1] + 0.25, {x: 510, y: 820, z: 175}],      // the reveal
  [T.ya3ni - 0.1, T.ya3ni + 0.4, BASE],
  [T.marra - 0.1, T.marra + 0.4, NEAR],
  [T.walaw - 0.1, T.walaw + 0.4, BASE],
  [T.khod, T.tala3o, {x: 512, y: 858, z: 140}],                    // slow breath in ...
  [T.tala3o, T.wenta, {x: 512, y: 866, z: 122}],                   // ... and a slower breath out
  [T.wenta - 0.1, T.wenta + 0.4, {x: 512, y: 866, z: 128}],
  [T.ekteb - 0.1, T.ekteb + 0.4, {x: 512, y: 868, z: 122}],
  [T.fahman - 0.1, T.fahman + 0.5, CAM0],                          // ends on the opening framing
];
const SHAKES: [number, number, number][] = [
  [T.yeza3a2, 5, 8], [T.da3eef, 4, 9], [T.lozoom, 3, 10], [T.loza, 2.5, 12], [T.khatar, 4, 9], [T.asad, 7, 7], [T.tawari, 6, 8],
  [T.yet2efel, 3, 10], [T.hatgry, 2.5, 12], [T.hatdrab, 2.5, 12], [T.ma7boos, 5, 8], [T.tefok, 3, 10], [T.etfaragh, 2.5, 12],
  [T.estanna, 16, 6], [T.ta3asabhom, 4, 9], [MYST[1], 5, 8], [T.meya, 6, 7], [T.ehda, 2.5, 12], [T.mattetkesefsh, 3, 10], [T.comments, 2.5, 12],
];

// ============================================================ drawing kit (all code)
const CHALK = '#fdf6e8', GREEN = '#43a85a', SKIN = '#e8b48a', HAIR = '#4a2c1c', BLUE = '#3d8bff', PINK = '#ff9fb8', TEAR = '#8fd6ff', ORANGE = '#ff8a3d';
const bump = (t: number, t0: number, a = 0.14, k = 9) => (t < t0 ? 1 : 1 + a * Math.exp(-(t - t0) * k) * Math.cos((t - t0) * 18));
const pm = (x: number, m: number) => ((x % m) + m) % m;

const Txt: React.FC<{x: number; y: number; size: number; fill?: string; rtl?: boolean; sw?: number; anchor?: 'start' | 'middle' | 'end'; children: React.ReactNode}> =
({x, y, size, fill = CHALK, rtl = true, sw = 0.11, anchor = 'middle', children}) => (
  <text x={x} y={y} textAnchor={anchor} direction={rtl ? 'rtl' : 'ltr'} fontFamily="Cairo" fontWeight={900} fontSize={size} fill={fill}
    stroke={sw > 0 ? INK : 'none'} strokeWidth={size * sw} strokeLinejoin="round" paintOrder="stroke">{children}</text>
);
const QMark: React.FC<{x: number; y: number; size: number; s: number; rot?: number; fill?: string}> = ({x, y, size, s, rot = 0, fill = YELLOW}) => s <= 0.001 ? null : (
  <text x={x} y={y} textAnchor="middle" fontFamily="Cairo" fontWeight={900} fontSize={size * s} fill={fill} stroke={INK} strokeWidth={size * 0.1 * s}
    strokeLinejoin="round" paintOrder="stroke" transform={`rotate(${rot} ${x} ${y - size * 0.3})`}>؟</text>
);
const Check: React.FC<{x: number; y: number; s: number; r?: number}> = ({x, y, s, r = 30}) => s <= 0.001 ? null : (
  <g transform={`translate(${x} ${y}) scale(${(s * r) / 30})`}>
    <circle r={30} fill={GREEN} stroke={INK} strokeWidth={6} />
    <path d="M -14 0 l 10 11 l 18 -22" stroke="#fff" strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </g>
);
const Cross: React.FC<{x: number; y: number; s: number; r?: number; rot?: number; w?: number}> = ({x, y, s, r = 40, rot = 0, w = 16}) => s <= 0.001 ? null : (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    {[INK, RED].map((c, i) => <path key={c} d={`M ${-r} ${-r} L ${r} ${r} M ${r} ${-r} L ${-r} ${r}`} stroke={c} strokeWidth={i ? w : w + 11} strokeLinecap="round" />)}
  </g>
);
// a drop (tear), tip up, centre ~ (0, 0), ~ 2r tall
const Drop: React.FC<{r?: number; o?: number; fill?: string}> = ({r = 14, o = 1, fill = TEAR}) => (
  <g opacity={o} transform={`scale(${r / 14})`}>
    <path d="M 0 -18 C 8 -6 12 0 12 6 C 12 13 6 18 0 18 C -6 18 -12 13 -12 6 C -12 0 -8 -6 0 -18 Z" fill={fill} stroke={INK} strokeWidth={3.5} />
    <ellipse cx={-4} cy={6} rx={2.6} ry={4.5} fill="#fff" />
  </g>
);
// sound-wave arcs flying out to the right from (0, 0); ph = phase (cycles), k = loudness
const Waves: React.FC<{ph: number; k?: number; n?: number; span?: number; c?: string}> = ({ph, k = 1, n = 4, span = 260, c = YELLOW}) => (
  <g>
    {Array.from({length: n}, (_, i) => {
      const u = pm(ph + i / n, 1), r = 30 + u * span, a = 0.62;
      const d = `M ${r * Math.cos(-a)} ${r * Math.sin(-a)} A ${r} ${r} 0 0 1 ${r * Math.cos(a)} ${r * Math.sin(a)}`;
      return <g key={i} opacity={Math.sin(u * Math.PI) * clamp(k)}>
        <path d={d} stroke={INK} strokeWidth={(13 + 6 * k) * (1 - 0.4 * u)} fill="none" strokeLinecap="round" />
        <path d={d} stroke={c} strokeWidth={(6 + 4 * k) * (1 - 0.4 * u)} fill="none" strokeLinecap="round" />
      </g>;
    })}
  </g>
);
// a big shouting mouth with angry brows; open 0..1
const ShoutMouth: React.FC<{open: number; s?: number}> = ({open, s = 1}) => {
  const h = 30 + 80 * open;
  return (
    <g transform={`scale(${s})`}>
      <path d="M -92 -150 L -20 -118 M 92 -150 L 20 -118" stroke={INK} strokeWidth={22} strokeLinecap="round" />
      <path d={`M -100 0 Q -96 ${-h} 0 ${-h * 0.9} Q 96 ${-h} 100 0 Q 90 ${h * 1.1} 0 ${h * 1.05} Q -90 ${h * 1.1} -100 0 Z`} fill="#c0392b" stroke={INK} strokeWidth={12} strokeLinejoin="round" />
      <path d={`M -100 0 Q -96 ${-h} 0 ${-h * 0.9} Q 96 ${-h} 100 0 Q 90 ${h * 1.1} 0 ${h * 1.05} Q -90 ${h * 1.1} -100 0 Z`} fill="none" stroke="#e8836f" strokeWidth={20} strokeLinejoin="round" opacity={0.0} />
      <path d={`M -70 ${-h * 0.62} Q 0 ${-h * 0.5} 70 ${-h * 0.62} L 66 ${-h * 0.62 + 22} Q 0 ${-h * 0.5 + 18} -66 ${-h * 0.62 + 22} Z`} fill="#fff" stroke={INK} strokeWidth={4} />
      <ellipse cx={0} cy={h * 0.62} rx={50} ry={h * 0.32} fill="#ff7a8a" stroke={INK} strokeWidth={4} />
      <path d={`M -100 0 Q -96 ${-h} 0 ${-h * 0.9} Q 96 ${-h} 100 0 Q 90 ${h * 1.1} 0 ${h * 1.05} Q -90 ${h * 1.1} -100 0 Z`} fill="none" stroke="#8b2e1f" strokeWidth={14} strokeLinejoin="round" />
      <path d={`M -100 0 Q -96 ${-h} 0 ${-h * 0.9} Q 96 ${-h} 100 0 Q 90 ${h * 1.1} 0 ${h * 1.05} Q -90 ${h * 1.1} -100 0 Z`} fill="none" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    </g>
  );
};

// his own face (the library `worried` pose), cropped round, with a tear rolling from his left eye. Loaded before rendering.
const FACE_SRC = staticFile('elfahman/lib/worried.png');
let faceHandle: number | null = null;
const useFace = () => {
  if (faceHandle === null && typeof window !== 'undefined') {
    faceHandle = delayRender('face');
    const im = new Image(); im.src = FACE_SRC;
    (im.decode ? im.decode() : Promise.resolve()).then(() => continueRender(faceHandle!), () => continueRender(faceHandle!));
  }
};
const FACE_K = 0.42;
const MyFace: React.FC<{t: number; id: string; r?: number; tears?: boolean; shake?: number}> = ({t, id, r = 150, tears = true, shake = 0}) => {
  useFace();
  const [hx, hy] = [670, 330];
  const ph = pm((t + 0.55) / 1.3, 1);       // a tear rolls every 1.3 s, already halfway in frame 0
  const ph2 = pm((t + 0.05) / 1.7, 1);
  const ex = (580 - hx) * FACE_K, ey = (372 - hy) * FACE_K; // under his right-hand (screen-left) eye
  const ex2 = (748 - hx) * FACE_K, ey2 = (362 - hy) * FACE_K;
  const dx = Math.sin(t * 40) * shake;
  return (
    <g transform={`translate(${dx} 0)`}>
      <defs><clipPath id={`face${id}`}><circle cx={0} cy={0} r={r} /></clipPath></defs>
      <circle r={r + 8} fill={INK} />
      <circle r={r} fill="#c9e4f2" />
      <g clipPath={`url(#face${id})`}>
        <image href={FACE_SRC} x={-hx * FACE_K} y={-hy * FACE_K} width={1351 * FACE_K} height={1828 * FACE_K} />
      </g>
      {tears && <g>
        {/* wet line down the cheek */}
        <path d={`M ${ex} ${ey} q -6 30 -2 ${64 * Math.min(1, ph * 1.6)}`} stroke={TEAR} strokeWidth={7} fill="none" strokeLinecap="round" opacity={0.75} />
        <g transform={`translate(${ex - 3 * ph} ${ey + 8 + 110 * easeIn(ph)}) scale(${0.6 + 0.5 * Math.min(1, ph * 3)})`}><Drop r={13} o={1 - seg(ph, 0.82, 1)} /></g>
        <g transform={`translate(${ex2 + 2 * ph2} ${ey2 + 8 + 100 * easeIn(ph2)}) scale(${0.5 + 0.4 * Math.min(1, ph2 * 3)})`}><Drop r={12} o={1 - seg(ph2, 0.8, 1)} /></g>
      </g>}
    </g>
  );
};

// ---- the brain icon: a cloud of lobes with a middle groove and folds; almond (0..1) = the amygdala glowing red
const LOBES: [number, number, number][] = [[-38, -14, 30], [-14, -30, 32], [16, -30, 32], [40, -12, 30], [34, 16, 28], [6, 22, 30], [-24, 20, 30], [-44, 8, 24]];
const Brain: React.FC<{r?: number; almond?: number; ti?: number; face?: boolean; calm?: boolean}> = ({r = 1, almond = 0, ti = 0, face = true, calm = false}) => {
  const c = PINK, c2 = '#e9708f';
  const fl = almond > 0 ? 0.6 + 0.4 * Math.abs(Math.sin(ti * 9)) : 0;
  return (
    <g transform={`scale(${r})`}>
      {LOBES.map(([x, y, rr], i) => <circle key={`o${i}`} cx={x} cy={y} r={rr} fill={INK} stroke={INK} strokeWidth={14} />)}
      {LOBES.map(([x, y, rr], i) => <circle key={`f${i}`} cx={x} cy={y} r={rr} fill={c} />)}
      <path d="M 2 -52 Q -6 -28 4 -6 Q 12 14 2 44" stroke={c2} strokeWidth={6} fill="none" strokeLinecap="round" />
      <path d="M -50 -6 q 14 -10 24 4 M -34 -36 q 10 10 22 2 M 22 -40 q -6 14 10 22 M 46 4 q -16 -4 -20 10 M -30 30 q 8 -12 22 -4 M 20 34 q 4 -14 18 -10"
        stroke={c2} strokeWidth={5} fill="none" strokeLinecap="round" />
      {almond > 0.01 && <g transform={`translate(18 22) rotate(-30) scale(${almond})`}>
        <ellipse rx={30 + 8 * fl} ry={22 + 6 * fl} fill={RED} opacity={0.35 * fl} />
        <path d="M 0 -15 C 12 -14 20 -2 14 8 C 9 15 -9 15 -14 8 C -20 -2 -12 -14 0 -15 Z" fill={RED} stroke={INK} strokeWidth={3.5} />
        <path d="M -2 -10 Q 4 0 -2 10" stroke="#ffb3a8" strokeWidth={2.5} fill="none" />
      </g>}
      {face && <g>
        {calm ? <path d="M -24 0 q 8 6 16 0 M 10 0 q 8 6 16 0" stroke={INK} strokeWidth={4.5} fill="none" strokeLinecap="round" />
          : <g><circle cx={-16} cy={0} r={5} fill={INK} /><circle cx={18} cy={0} r={5} fill={INK} /></g>}
        <path d="M -8 14 q 9 9 18 0" stroke={INK} strokeWidth={4.5} fill="none" strokeLinecap="round" />
      </g>}
    </g>
  );
};
// ---- shield (centre 0,0, ~ 2r tall)
const Shield: React.FC<{r?: number; glow?: number}> = ({r = 120, glow = 0}) => (
  <g transform={`scale(${r / 120})`}>
    {glow > 0.01 && <path d="M 0 -150 L 128 -100 Q 130 60 0 150 Q -130 60 -128 -100 Z" fill={YELLOW} opacity={0.3 * glow} />}
    <path d="M 0 -120 L 104 -82 Q 106 50 0 122 Q -106 50 -104 -82 Z" fill="#4f8fe0" fillOpacity={0.55} stroke={INK} strokeWidth={9} strokeLinejoin="round" />
    <path d="M 0 -100 L 84 -70 Q 86 40 0 100 Q -86 40 -84 -70 Z" fill="none" stroke="#cfe6ff" strokeWidth={6} strokeLinejoin="round" opacity={0.8} />
  </g>
);
// ---- a stamp with a word in it
const Stamp: React.FC<{txt: string; c?: string; rot?: number}> = ({txt, c = '#7a4fd6', rot = -8}) => (
  <g transform={`rotate(${rot})`}>
    <rect x={-150} y={-66} width={300} height={132} rx={18} fill="#f4ecdc" stroke={INK} strokeWidth={8} />
    <rect x={-136} y={-52} width={272} height={104} rx={12} fill="none" stroke={c} strokeWidth={7} />
    <Txt x={0} y={26} size={72} fill={c} sw={0}>{txt}</Txt>
  </g>
);
// ---- an adult (x, y = feet); mouth: 'shout' | 'smile' | 'flat' | 'angry'; red 0..1 = anger flush
const Person: React.FC<{mouth?: 'shout' | 'smile' | 'flat' | 'angry'; shirt?: string; ti?: number; red?: number; open?: number; brows?: number; hair?: string}> =
({mouth = 'flat', shirt = '#5b7bd5', ti = 0, red = 0, open = 0.6, brows = 0, hair = HAIR}) => {
  const face = red > 0 ? `rgb(${Math.round(lerp(232, 240, red))},${Math.round(lerp(180, 110, red))},${Math.round(lerp(138, 100, red))})` : SKIN;
  return (
    <g>
      <ellipse cx={0} cy={4} rx={58} ry={9} fill="#000" opacity={0.18} />
      <path d="M -18 -96 L -20 0 M 18 -96 L 20 0" stroke={INK} strokeWidth={20} strokeLinecap="round" />
      <path d="M -18 -96 L -20 0 M 18 -96 L 20 0" stroke="#3b4a6b" strokeWidth={11} strokeLinecap="round" />
      <path d="M -48 -200 Q -64 -150 -60 -110 M 48 -200 Q 64 -150 60 -110" stroke={INK} strokeWidth={22} fill="none" strokeLinecap="round" />
      <path d="M -48 -200 Q -64 -150 -60 -110 M 48 -200 Q 64 -150 60 -110" stroke={SKIN} strokeWidth={11} fill="none" strokeLinecap="round" />
      <rect x={-48} y={-212} width={96} height={124} rx={34} fill={shirt} stroke={INK} strokeWidth={6} />
      <circle cx={0} cy={-252} r={44} fill={face} stroke={INK} strokeWidth={6} />
      <path d="M -46 -258 Q -48 -306 0 -302 Q 48 -306 46 -258 Q 36 -284 0 -286 Q -36 -284 -46 -258 Z" fill={hair} stroke={INK} strokeWidth={5} />
      <path d={`M -28 ${-270 + brows * 6} L -8 ${-264 - brows * 2} M 28 ${-270 + brows * 6} L 8 ${-264 - brows * 2}`} stroke={INK} strokeWidth={brows > 0 ? 6 : 0} strokeLinecap="round" />
      <circle cx={-16} cy={-254} r={5} fill={INK} /><circle cx={16} cy={-254} r={5} fill={INK} />
      {mouth === 'shout' && <ellipse cx={0} cy={-226} rx={14 + 4 * open} ry={8 + 12 * open} fill="#7a1f1a" stroke={INK} strokeWidth={4} />}
      {mouth === 'smile' && <path d="M -14 -232 q 14 14 28 0" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />}
      {mouth === 'flat' && <path d="M -12 -228 L 12 -228" stroke={INK} strokeWidth={5} strokeLinecap="round" />}
      {mouth === 'angry' && <path d="M -16 -222 q 16 -12 32 0" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />}
      {Math.sin(ti) > 2 && null}
    </g>
  );
};
// steam puffs from the ears of a head at (0, hy)
const Steam: React.FC<{ti: number; k: number; hy?: number; w?: number}> = ({ti, k, hy = -252, w = 54}) => k <= 0.01 ? null : (
  <g opacity={k}>
    {[-1, 1].map((sd) => [0, 1, 2].map((i) => {
      const u = pm(ti * 1.6 + i / 3, 1);
      return <circle key={`${sd}${i}`} cx={sd * (w + 16 + u * 50)} cy={hy - 6 - u * 60} r={10 + u * 16} fill="#f4f4f4" stroke={INK} strokeWidth={4} opacity={Math.sin(u * Math.PI)} />;
    }))}
  </g>
);
// ---- cartoon lion head (centre 0,0); roar 0..1
const Lion: React.FC<{roar?: number; ti?: number}> = ({roar = 0, ti = 0}) => (
  <g>
    {Array.from({length: 14}, (_, i) => {
      const a = (i / 14) * Math.PI * 2 + Math.sin(ti * 3) * 0.03;
      return <ellipse key={i} cx={Math.cos(a) * 86} cy={Math.sin(a) * 86} rx={44} ry={30} transform={`rotate(${(a * 180) / Math.PI} ${Math.cos(a) * 86} ${Math.sin(a) * 86})`}
        fill={i % 2 ? '#c4621c' : '#d9782a'} stroke={INK} strokeWidth={6} />;
    })}
    <circle r={84} fill="#f2b04a" stroke={INK} strokeWidth={7} />
    <circle cx={-56} cy={-60} r={18} fill="#f2b04a" stroke={INK} strokeWidth={6} /><circle cx={56} cy={-60} r={18} fill="#f2b04a" stroke={INK} strokeWidth={6} />
    <path d="M -46 -30 L -16 -20 M 46 -30 L 16 -20" stroke={INK} strokeWidth={8} strokeLinecap="round" />
    <circle cx={-28} cy={-6} r={8} fill={INK} /><circle cx={28} cy={-6} r={8} fill={INK} />
    <path d="M -14 14 L 14 14 L 0 28 Z" fill="#6b3a1e" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <ellipse cx={0} cy={50} rx={26 + 8 * roar} ry={8 + 26 * roar} fill="#7a1f1a" stroke={INK} strokeWidth={5} />
    {roar > 0.2 && <path d={`M -16 ${50 - 26 * roar} l 6 12 l 6 -12 M 4 ${50 - 26 * roar} l 6 12 l 6 -12`} fill="#fff" stroke={INK} strokeWidth={2} />}
  </g>
);
// ---- rotating alarm light (centre = bottom middle)
const Alarm: React.FC<{ti: number; on: number}> = ({ti, on}) => (
  <g>
    {on > 0.01 && [0, 1].map((i) => {
      const a = ti * 8 + i * Math.PI;
      const sx = Math.cos(a);
      return <path key={i} d={`M 0 -40 L ${sx * 220} ${-110} L ${sx * 220} ${30} Z`} fill={RED} opacity={0.22 * on * Math.abs(sx)} />;
    })}
    <rect x={-50} y={-10} width={100} height={22} rx={6} fill="#555" stroke={INK} strokeWidth={6} />
    <path d="M -38 -10 L -38 -50 Q 0 -96 38 -50 L 38 -10 Z" fill={on > 0.5 && Math.sin(ti * 16) > -0.3 ? '#ff4d3d' : '#9b2d24'} stroke={INK} strokeWidth={6} />
    <path d="M -20 -40 Q -12 -60 4 -66" stroke="#fff" strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.7} />
  </g>
);
// ---- body outline (feet at 0, ~ 360 tall); level 0..1 fills it from the feet; neck squeeze 0..1
const BODY_PARTS = (sq: number) => [
  {k: 'c', cx: 0, cy: -322, r: 40},
  {k: 'r', x: -14 + 6 * sq, y: -288, w: 28 - 12 * sq, h: 30, rx: 6},
  {k: 'r', x: -62, y: -266, w: 124, h: 150, rx: 40},
  {k: 'r', x: -94, y: -258, w: 32, h: 140, rx: 16},
  {k: 'r', x: 62, y: -258, w: 32, h: 140, rx: 16},
  {k: 'r', x: -56, y: -136, w: 48, h: 136, rx: 20},
  {k: 'r', x: 8, y: -136, w: 48, h: 136, rx: 20},
];
const Part: React.FC<{p: ReturnType<typeof BODY_PARTS>[number]; fill: string; stroke?: string; sw?: number}> = ({p, fill, stroke = 'none', sw = 0}) =>
  p.k === 'c' ? <circle cx={p.cx} cy={p.cy} r={p.r} fill={fill} stroke={stroke} strokeWidth={sw} />
    : <rect x={p.x} y={p.y} width={p.w} height={p.h} rx={p.rx} fill={fill} stroke={stroke} strokeWidth={sw} />;
const Body: React.FC<{id: string; level?: number; fill?: string; base?: string; sq?: number; children?: React.ReactNode; over?: React.ReactNode}> =
({id, level = 0, fill = RED, base = '#e9eef2', sq = 0, children, over}) => {
  const parts = BODY_PARTS(sq);
  return (
    <g>
      <defs><clipPath id={`body${id}`}>{parts.map((p, i) => <Part key={i} p={p} fill="#000" />)}</clipPath></defs>
      {parts.map((p, i) => <Part key={i} p={p} fill={INK} stroke={INK} sw={16} />)}
      {parts.map((p, i) => <Part key={i} p={p} fill={base} />)}
      <g clipPath={`url(#body${id})`}>
        {level > 0.001 && <g>
          <rect x={-110} y={-364 * level} width={220} height={400} fill={fill} opacity={0.85} />
          <path d={`M -110 ${-364 * level} q 27 -10 55 0 t 55 0 t 55 0 t 55 0`} stroke="#fff" strokeWidth={4} fill="none" opacity={0.5} />
        </g>}
        {children}
      </g>
      {over}
    </g>
  );
};
const Heart: React.FC<{s?: number; c?: string}> = ({s = 1, c = RED}) => (
  <path transform={`scale(${s})`} d="M 0 26 C -40 -2 -34 -36 -12 -36 C -2 -36 0 -26 0 -22 C 0 -26 2 -36 12 -36 C 34 -36 40 -2 0 26 Z" fill={c} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
);
// heartbeat: fast double-thump; rate in beats per second
const beat = (ti: number, rate: number) => { const u = pm(ti * rate, 1); return 1 + 0.22 * Math.exp(-u * 14) + 0.12 * Math.exp(-pm(u - 0.22, 1) * 14); };
const Gauge: React.FC<{v: number; ti: number}> = ({v, ti}) => {
  const a = lerp(-80, 80, clamp(v)) + (v > 0.85 ? Math.sin(ti * 40) * 4 : 0);
  return (
    <g>
      <path d="M -100 0 A 100 100 0 0 1 100 0 Z" fill="#fff" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      <path d="M -84 -6 A 84 84 0 0 1 -26 -80" stroke={GREEN} strokeWidth={16} fill="none" />
      <path d="M -24 -81 A 84 84 0 0 1 40 -74" stroke={YELLOW} strokeWidth={16} fill="none" />
      <path d="M 42 -73 A 84 84 0 0 1 84 -6" stroke={RED} strokeWidth={16} fill="none" />
      <path d="M 0 0 L 0 -74" stroke={INK} strokeWidth={8} strokeLinecap="round" transform={`rotate(${a})`} />
      <circle r={12} fill={INK} />
    </g>
  );
};
const Shoe: React.FC = () => (
  <g>
    <path d="M -70 20 L -70 -30 Q -66 -50 -40 -50 L -10 -50 Q 0 -10 40 -6 Q 76 -2 76 20 Z" fill="#ff5a4e" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    <path d="M -74 20 L 80 20 L 80 34 L -74 34 Z" fill="#fff" stroke={INK} strokeWidth={6} />
    <path d="M -24 -34 l 14 10 M -18 -44 l 14 10" stroke="#fff" strokeWidth={5} strokeLinecap="round" />
  </g>
);
const Fist: React.FC = () => (
  <g>
    <rect x={-56} y={-50} width={112} height={92} rx={30} fill={SKIN} stroke={INK} strokeWidth={7} />
    {[-28, 0, 28].map((x) => <path key={x} d={`M ${x + 14} -50 L ${x + 14} -14`} stroke={INK} strokeWidth={5} />)}
    <path d="M -56 0 Q -84 -6 -70 -34 Q -56 -44 -40 -26" fill={SKIN} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    <rect x={-40} y={40} width={80} height={44} rx={10} fill="#5b7bd5" stroke={INK} strokeWidth={6} />
  </g>
);
const Gear: React.FC<{r?: number; a: number; c?: string}> = ({r = 40, a, c = '#9aa2ad'}) => (
  <g transform={`rotate(${a}) scale(${r / 40})`}>
    {Array.from({length: 8}, (_, i) => <rect key={i} x={-8} y={-50} width={16} height={22} rx={3} fill={c} stroke={INK} strokeWidth={4} transform={`rotate(${i * 45})`} />)}
    <circle r={36} fill={c} stroke={INK} strokeWidth={5} /><circle r={12} fill="#fff" stroke={INK} strokeWidth={4} />
  </g>
);
const Comment: React.FC = () => (
  <g>
    <path d="M -70 -50 Q -70 -70 -50 -70 L 50 -70 Q 70 -70 70 -50 L 70 10 Q 70 30 50 30 L -10 30 L -40 56 L -34 30 L -50 30 Q -70 30 -70 10 Z" fill="#fff" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    {[-30, 0, 30].map((x) => <circle key={x} cx={x} cy={-20} r={9} fill={INK} />)}
  </g>
);
// emoji-like faces drawn in code: crying 😢 and fuming 😤
const EmojiFace: React.FC<{kind: 'cry' | 'fume'; ti: number}> = ({kind, ti}) => (
  <g>
    <circle r={70} fill={YELLOW} stroke={INK} strokeWidth={7} />
    {kind === 'cry' ? <g>
      <path d="M -40 -26 L -14 -18 M 40 -26 L 14 -18" stroke={INK} strokeWidth={6} strokeLinecap="round" />
      <circle cx={-26} cy={-2} r={8} fill={INK} /><circle cx={26} cy={-2} r={8} fill={INK} />
      <path d="M -22 40 q 22 -20 44 0" stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />
      <g transform={`translate(-30 ${18 + pm(ti * 0.9, 1) * 40})`}><Drop r={10} o={1 - seg(pm(ti * 0.9, 1), 0.7, 1)} /></g>
    </g> : <g>
      <path d="M -44 -30 L -12 -12 M 44 -30 L 12 -12" stroke={INK} strokeWidth={7} strokeLinecap="round" />
      <circle cx={-26} cy={0} r={8} fill={INK} /><circle cx={26} cy={0} r={8} fill={INK} />
      <path d="M -24 36 L 24 36" stroke={INK} strokeWidth={7} strokeLinecap="round" />
      {[-1, 1].map((sd) => {
        const u = pm(ti * 1.4 + (sd > 0 ? 0.5 : 0), 1);
        return <ellipse key={sd} cx={sd * (34 + u * 40)} cy={46 + u * 10} rx={16 + 10 * u} ry={10 + 6 * u} fill="#f4f4f4" stroke={INK} strokeWidth={4} opacity={1 - u} />;
      })}
    </g>}
  </g>
);

// ============================================================ board (chalkboard inset above his head)
const BX = 80, BY = 84, BW = 860, BH = 480, MID = BW / 2;
type Scene = 'hook' | 'weak' | 'shield' | 'amyg' | 'button' | 'body' | 'nofight' | 'pressure' | 'valve' | 'calm' | 'relief' | 'lab' | 'game' |
  'think' | 'reveal' | 'message' | 'next' | 'job' | 'breath' | 'poll' | 'loop';
const PUSH = 0.3;
const SCENES: [number, Scene][] = [
  [0, 'hook'], [T.etman - 0.1, 'weak'], [T.da - 0.1, 'shield'], [T.awel - 0.1, 'amyg'], [T.yedoos - 0.1, 'button'], [T.alback - 0.1, 'body'],
  [T.bas - 0.1, 'nofight'], [T.enta - 0.1, 'pressure'], [T.wehena - 0.1, 'valve'], [T.el3eyat - 0.1, 'calm'], [T.ashan - 0.1, 'relief'],
  [T.olama - 0.1, 'lab'], [T.weba3deen - 0.1, 'game'], [T.teftekir - 0.1, 'think'], [MYST[1] - 0.02, 'reveal'], [T.ya3ni - 0.1, 'message'],
  [T.marra - 0.1, 'next'], [T.da2 - 0.1, 'job'], [T.walaw - 0.1, 'breath'], [T.wenta - 0.1, 'poll'], [T.fahman - 0.15, 'loop'],
];
type SP = {t: number; ti: number};

// ---- 0. hook: a shouting mouth with sound waves on the left, his face with a tear on the right (all moving from frame 0)
const HookScene: React.FC<SP & {loop?: boolean}> = ({t, loop = false}) => {
  const loud = loop ? 0 : popIn(t - T.yeza3a2, 0.2);
  const open = 0.55 + 0.35 * Math.abs(Math.sin(t * 13)) + 0.15 * loud;
  const hit = Math.abs(Math.sin(t * 9)) * (2 + 4 * loud);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#3a2028" />
      <rect x={MID - 20} y={0} width={MID + 20} height={BH} fill="#22344a" />
      <g transform={`translate(${190 + Math.sin(t * 31) * (2 + 3 * loud)} 250) scale(${1 + 0.08 * loud})`}><ShoutMouth open={open} s={1.05} /></g>
      <g transform="translate(300 250)"><Waves ph={t * 1.8} k={0.75 + 0.5 * loud} n={4} span={230} /></g>
      <g transform={`translate(640 242)`}><MyFace t={t} id={loop ? 'L' : 'H'} r={160} shake={hit * 0.4} /></g>
      {loud > 0.01 && <g>
        <Txt x={100} y={110} size={84 * loud} fill={RED} rtl={false}>!!</Txt>
      </g>}
    </g>
  );
};

// ---- 1. "you're not weak, not too sensitive": two stamps slam in and get crossed out
const WeakScene: React.FC<SP> = ({t}) => {
  const s1 = popIn(t - T.da3eef + 0.04, 0.2), s2 = popIn(t - T.hasas + 0.04, 0.2);
  const slam = (s: number) => (s <= 0 ? 0 : s);
  const c1 = popIn(t - T.wala + 0.12, 0.2), c2 = popIn(t - T.lozoom, 0.2); // crosses go over the corners, the word stays readable
  const ok = popIn(t - T.mesh, 0.25);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#2a3a33" />
      {ok > 0.01 && <g transform={`translate(${MID} 70) scale(${ok})`}><Txt x={0} y={20} size={58} fill={GREEN}>انت مش</Txt></g>}
      {s1 > 0.01 && <g transform={`translate(230 270) scale(${1.15 * slam(s1) * (1 + 0.6 * (1 - Math.min(1, (t - T.da3eef + 0.04) / 0.12)))})`}><Stamp txt="ضعيف" /></g>}
      <Cross x={230} y={270} s={c1} r={118} w={10} />
      {s2 > 0.01 && <g transform={`translate(630 290) scale(${1.15 * slam(s2) * (1 + 0.6 * (1 - Math.min(1, (t - T.hasas + 0.04) / 0.12)))})`}><Stamp txt="حساس" c="#d64f8e" rot={7} /></g>}
      <Cross x={630} y={290} s={c2} r={118} w={10} />
    </g>
  );
};

// ---- 2. "it's your brain trying to protect you": a shield closes over a brain
const ShieldScene: React.FC<SP> = ({t, ti}) => {
  const b = popIn(t - T.da + 0.05, 0.28), sh = popIn(t - T.be7awel, 0.3), gl = seg(t, T.ye7meek, T.ye7meek + 0.3);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#1f3446" />
      {b > 0.01 && <g transform={`translate(${MID} ${250 + Math.sin(ti * 2.4) * 6}) scale(${1.45 * b})`}><Brain ti={ti} /></g>}
      {sh > 0.01 && <g transform={`translate(${MID} 250) scale(${1.25 * sh})`}><Shield r={150} glow={gl * (0.7 + 0.3 * Math.sin(ti * 6))} /></g>}
      <Check x={MID + 170} y={120} s={popIn(t - T.ye7meek, 0.25)} r={40} />
    </g>
  );
};

// ---- 3. someone shouts -> the amygdala (an almond in the brain) glows red, the alarm spins, a lion pops up behind the shouter
const AmygScene: React.FC<SP> = ({t, ti}) => {
  const p = popIn(t - T.awel + 0.05, 0.28), w = seg(t, T.ye3ali, T.ye3ali + 0.3);
  const br = popIn(t - T.feeh, 0.28), zoom = easeInOut(seg(t, T.goz2, T.soghayar + 0.3));
  const al = popIn(t - T.loza, 0.3), alarm = seg(t, T.khatar - 0.05, T.khatar + 0.1);
  const lion = popIn(t - T.asad, 0.3), roar = clamp(seg(t, T.asad + 0.1, T.asad + 0.3)) * (0.6 + 0.4 * Math.abs(Math.sin(ti * 7)));
  const open = 0.4 + 0.6 * Math.abs(Math.sin(ti * 12));
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill={alarm > 0 ? `rgb(${Math.round(lerp(31, 70, alarm * (0.6 + 0.4 * Math.sin(ti * 16))))},30,40)` : '#1f2a3a'} />
      {lion > 0.01 && <g transform={`translate(180 ${210 + 80 * (1 - lion)}) scale(${1.05 * lion})`}><Lion roar={roar} ti={ti} /></g>}
      {p > 0.01 && <g transform={`translate(190 460) scale(${p * 1.05})`}><Person mouth="shout" shirt="#c0392b" open={open} brows={1} red={0.4} ti={ti} /></g>}
      {w > 0.01 && <g transform="translate(250 200)"><Waves ph={ti * 1.8} k={w} n={3} span={200} /></g>}
      {br > 0.01 && <g transform={`translate(${lerp(620, 600, zoom)} 240) scale(${br * lerp(1.3, 2.2, zoom)})`}><Brain ti={ti} almond={al} face={false} /></g>}
      {al > 0.01 && <g transform={`translate(700 420) scale(${al})`}><Txt x={0} y={10} size={54} fill={RED}>اللوزة</Txt></g>}
      {alarm > 0.01 && <g transform={`translate(760 120) scale(${popIn(t - T.khatar + 0.05, 0.25)})`}><Alarm ti={ti} on={alarm} /></g>}
    </g>
  );
};

// ---- 4. the big red emergency button gets pressed
const ButtonScene: React.FC<SP> = ({t, ti}) => {
  const s = popIn(t - T.yedoos + 0.05, 0.28), press = t < T.zorar ? 0 : t < T.tawari ? easeOut(seg(t, T.zorar, T.zorar + 0.12)) : 1;
  const fl = t > T.tawari ? 0.5 + 0.5 * Math.sin(ti * 18) : 0;
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill={t > T.tawari ? `rgb(${Math.round(60 + 40 * fl)},28,30)` : '#2a2a35'} />
      <g transform={`translate(${MID} 330) scale(${1.3 * s})`}>
        <ellipse cx={0} cy={40} rx={170} ry={46} fill="#444" stroke={INK} strokeWidth={8} />
        <rect x={-170} y={0} width={340} height={40} fill="#555" />
        <ellipse cx={0} cy={0} rx={170} ry={46} fill="#ffd23f" stroke={INK} strokeWidth={8} />
        <path d="M -110 0 L 110 0" stroke={INK} strokeWidth={0} />
        <g transform={`translate(0 ${-60 + 44 * press})`}>
          <rect x={-110} y={0} width={220} height={60 - 44 * press} fill="#b5221a" stroke={INK} strokeWidth={0} />
          <ellipse cx={0} cy={60 - 44 * press} rx={110} ry={32} fill="#b5221a" stroke={INK} strokeWidth={7} />
          <path d={`M -110 0 L -110 ${60 - 44 * press} M 110 0 L 110 ${60 - 44 * press}`} stroke={INK} strokeWidth={7} />
          <ellipse cx={0} cy={0} rx={110} ry={32} fill="#ff4d3d" stroke={INK} strokeWidth={7} />
          <ellipse cx={-34} cy={-8} rx={30} ry={8} fill="#fff" opacity={0.6} />
        </g>
      </g>
      {t > T.zorar && <g transform={`translate(${MID + 150} ${120 - 30 * easeOut(seg(t, T.zorar, T.zorar + 0.3))}) scale(${popIn(t - T.zorar, 0.2)})`}>
        <path d="M -20 -40 L 20 -40 L 20 10 L 40 10 L 0 50 L -40 10 L -20 10 Z" fill="#fff" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      </g>}
      {t > T.tawari && <g transform={`translate(${MID} 90) scale(${popIn(t - T.tawari, 0.24)})`}><Txt x={0} y={20} size={66} fill={RED}>طوارئ!</Txt></g>}
    </g>
  );
};

// ---- 5. heart racing, throat squeezed, stress-hormone bubbles fill a body outline
const BUBS = Array.from({length: 40}, (_, i) => ({x: -90 + rand(i * 3.3) * 180, v: 60 + rand(i * 7.1) * 80, d: rand(i * 1.7), r: 6 + rand(i * 5.9) * 9, c: [ORANGE, YELLOW, '#ff6f61'][i % 3]}));
const BodyScene: React.FC<SP> = ({t, ti}) => {
  const s = popIn(t - T.alback + 0.05, 0.28);
  const hb = beat(ti, 2.6) * popIn(t - T.alback, 0.2);
  const sq = easeOut(seg(t, T.yet2efel - 0.15, T.yet2efel + 0.15));
  const lv = easeInOut(seg(t, T.gesmak, T.tawatur + 0.3));
  const nb = Math.round(40 * lv);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#2b2338" />
      <g transform={`translate(${MID} 452) scale(${1.15 * s})`}>
        <Body id="b5" level={lv * 0.92} fill="#ffb347" sq={sq}
          over={<g>
            <g transform={`translate(-18 -210) scale(${hb})`}><Heart s={1.05} /></g>
            {sq > 0.01 && [-1, 1].map((sd) => <path key={sd} d={`M ${sd * 70} -276 L ${sd * 30} -276 M ${sd * 42} -290 L ${sd * 28} -276 L ${sd * 42} -262`} stroke={RED} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={sq} />)}
          </g>}>
          {BUBS.slice(0, nb).map((b, i) => {
            const y = -pm(ti * b.v / 360 + b.d, 1) * 360 * lv;
            return <circle key={i} cx={b.x + Math.sin(ti * 3 + i) * 6} cy={y} r={b.r} fill={b.c} stroke={INK} strokeWidth={3} />;
          })}
        </Body>
      </g>
      {/* little labels */}
      <g transform={`translate(160 140) scale(${popIn(t - T.alback, 0.24)})`}><Txt x={0} y={0} size={46} fill={PINK}>دق دق</Txt></g>
      <g transform={`translate(700 140) scale(${popIn(t - T.zorak, 0.24)})`}><Txt x={0} y={0} size={46} fill={RED}>زور</Txt></g>
      <g transform={`translate(710 360) scale(${popIn(t - T.hormonat, 0.24)})`}><Txt x={0} y={0} size={44} fill={ORANGE}>هرمونات</Txt></g>
    </g>
  );
};

// ---- 6. "you won't run, you won't hit": a running shoe and a fist, both crossed out
const NoFightScene: React.FC<SP> = ({t, ti}) => {
  const a = popIn(t - T.hatgry + 0.12, 0.26), b = popIn(t - T.hatdrab + 0.1, 0.26);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#283a2f" />
      {a > 0.01 && <g transform={`translate(${250 + Math.sin(ti * 10) * 4} 250) scale(${1.7 * a})`}><Shoe /></g>}
      {a > 0.01 && <g transform="translate(250 250)">{[0, 1, 2].map((i) => <path key={i} d={`M ${-170 - i * 6} ${-30 + i * 30} l 50 0`} stroke="#9fd8ff" strokeWidth={6} strokeLinecap="round" opacity={0.7} />)}</g>}
      <Cross x={250} y={250} s={popIn(t - T.hatgry - 0.12, 0.2)} r={130} w={11} />
      {b > 0.01 && <g transform={`translate(610 ${240 + Math.sin(ti * 9) * 5}) scale(${1.6 * b})`}><Fist /></g>}
      <Cross x={610} y={250} s={popIn(t - T.hatdrab - 0.08, 0.2)} r={130} w={11} />
    </g>
  );
};

// ---- 7. "you stand still, all that pressure trapped inside": the body outline fills up like a pressure gauge
const PressureScene: React.FC<SP> = ({t, ti}) => {
  const s = popIn(t - T.enta + 0.05, 0.28);
  const lv = easeInOut(seg(t, T.wekol, T.gowak + 0.4));
  const shake = t > T.ma7boos ? Math.sin(ti * 46) * 3 : 0;
  const plant = popIn(t - T.wa2ef, 0.24);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#33242a" />
      <g transform={`translate(${300 + shake} 452) scale(${1.15 * s})`}>
        <Body id="b7" level={0.08 + lv * 0.86} fill={lerp(0, 1, lv) > 0.6 ? RED : ORANGE} />
        {plant > 0.01 && <path d="M -80 6 L 80 6" stroke={INK} strokeWidth={10 * plant} strokeLinecap="round" />}
      </g>
      <g transform={`translate(640 300) scale(${1.35 * popIn(t - T.wekol, 0.26)})`}><Gauge v={0.15 + 0.85 * lv} ti={ti} /></g>
      {t > T.ma7boos && <g transform={`translate(640 140) scale(${popIn(t - T.ma7boos, 0.24)})`}><Txt x={0} y={0} size={60} fill={RED}>محبوس!</Txt></g>}
    </g>
  );
};

// ---- 8. tears = a pressure valve: tears pour from a head, steam whistles out, the gauge needle drops back to green
const ValveScene: React.FC<SP> = ({t, ti}) => {
  const s = popIn(t - T.wehena + 0.05, 0.28);
  const tears = seg(t, T.domoo3, T.domoo3 + 0.3);
  const rel = easeInOut(seg(t, T.tefok, T.el3eyat));
  const gv = lerp(0.98, 0.25, rel);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#1f3446" />
      <g transform={`translate(300 ${470}) scale(${1.25 * s})`}>
        <Body id="b8" level={lerp(0.92, 0.15, rel)} fill={rel > 0.5 ? ORANGE : RED}
          over={<g>
            {/* closed crying eyes */}
            <path d="M -22 -324 q 8 6 16 0 M 6 -324 q 8 6 16 0" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
            {tears > 0.01 && [-14, 14].map((x, k) => [0, 1, 2].map((i) => {
              const u = pm(ti * 1.6 + i / 3 + k * 0.17, 1);
              return <g key={`${k}${i}`} transform={`translate(${x + (x < 0 ? -1 : 1) * u * 28} ${-314 + u * 120})`}><Drop r={10} o={tears * (1 - seg(u, 0.75, 1))} /></g>;
            }))}
            {/* valve on top of the head */}
            <rect x={-10} y={-382} width={20} height={22} fill="#9aa2ad" stroke={INK} strokeWidth={5} />
            <g transform={`translate(0 -388) rotate(${rel * 180})`}><rect x={-36} y={-7} width={72} height={14} rx={7} fill={RED} stroke={INK} strokeWidth={5} /></g>
            {rel > 0.01 && rel < 0.98 && [0, 1, 2].map((i) => {
              const u = pm(ti * 2 + i / 3, 1);
              return <circle key={i} cx={(i - 1) * 16 + u * (i - 1) * 30} cy={-400 - u * 70} r={10 + u * 14} fill="#f4f4f4" stroke={INK} strokeWidth={4} opacity={(1 - u) * Math.sin(rel * Math.PI)} />;
            })}
          </g>} />
      </g>
      <g transform={`translate(640 300) scale(${1.35 * s})`}><Gauge v={gv} ti={ti} /></g>
      {rel > 0.02 && <g transform={`translate(640 380) scale(${popIn(t - T.tefok, 0.24)})`}><Txt x={0} y={20} size={54} fill={GREEN}>فك الضغط</Txt></g>}
    </g>
  );
};

// ---- 9. "crying calms the body, brings breath and pulse back": the heart-rate line slows down and turns green
const ECG_LEN = 760;
const CalmScene: React.FC<SP> = ({t, ti}) => {
  const s = popIn(t - T.el3eyat + 0.05, 0.28);
  const calm = easeInOut(seg(t, T.yehda - 0.3, T.tabe3ethom + 0.4));
  const rate = lerp(2.6, 1.0, calm);
  // the line: beats spaced by the current rate, scrolling left
  const scroll = ti * 260;
  const pts: string[] = [];
  for (let x = 0; x <= ECG_LEN; x += 4) {
    const wx = x + scroll;
    const per = 260 / rate;
    const u = pm(wx, per) / per;
    let y = 0;
    if (u > 0.42 && u < 0.46) y = -20 * Math.sin(((u - 0.42) / 0.04) * Math.PI);
    else if (u > 0.48 && u < 0.5) y = 26 * ((u - 0.48) / 0.02);
    else if (u >= 0.5 && u < 0.53) y = 26 - 136 * ((u - 0.5) / 0.03);
    else if (u >= 0.53 && u < 0.56) y = -110 + 140 * ((u - 0.53) / 0.03);
    else if (u >= 0.56 && u < 0.58) y = 30 - 30 * ((u - 0.56) / 0.02);
    else if (u > 0.66 && u < 0.74) y = -26 * Math.sin(((u - 0.66) / 0.08) * Math.PI);
    pts.push(`${x} ${y}`);
  }
  const col = calm > 0.5 ? '#6dff8c' : `rgb(255,${Math.round(lerp(90, 220, calm * 2))},${Math.round(lerp(78, 120, calm * 2))})`;
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#0f1d1a" />
      <g opacity={s}>
        {Array.from({length: 18}, (_, i) => <path key={i} d={`M ${i * 50} 0 L ${i * 50} ${BH}`} stroke="#1f3a33" strokeWidth={2} />)}
        {Array.from({length: 10}, (_, i) => <path key={i} d={`M 0 ${i * 50} L ${BW} ${i * 50}`} stroke="#1f3a33" strokeWidth={2} />)}
        <g transform="translate(50 290)"><path d={'M ' + pts.join(' L ')} stroke={col} strokeWidth={7} fill="none" strokeLinejoin="round" /></g>
      </g>
      <g transform={`translate(110 100) scale(${s * beat(ti, rate) * 0.9})`}><Heart c={calm > 0.5 ? '#ff6f8a' : RED} /></g>
      <g transform="translate(740 100)" opacity={s}><Txt x={0} y={18} size={56} fill={col} rtl={false}>{Math.round(lerp(150, 70, calm))}</Txt></g>
      <g transform={`translate(${MID} 440) scale(${popIn(t - T.yehda, 0.24)})`}><Txt x={0} y={0} size={52} fill="#6dff8c">يهدى...</Txt></g>
    </g>
  );
};

// ---- 10. "after you cry you feel emptied and relieved": a balloon lets its air out, then a relaxed sigh
const ReliefScene: React.FC<SP> = ({t, ti}) => {
  const s = popIn(t - T.ashan + 0.05, 0.28);
  const def = easeIn(seg(t, T.etfaragh - 0.05, T.ertaht + 0.1));
  const fly = seg(t, T.etfaragh - 0.05, T.ertaht + 0.4);
  const bx = lerp(260, 230, fly) + Math.sin(fly * 14) * 90 * fly, by = lerp(250, 200, fly) + Math.cos(fly * 11) * 50 * fly;
  const sigh = popIn(t - T.ertaht, 0.3);
  const tearIn = popIn(t - T.bet3ayat2, 0.24);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#22344a" />
      <g transform={`translate(${bx} ${by}) rotate(${fly * 400}) scale(${s * lerp(1, 0.35, def)})`}>
        <ellipse rx={110} ry={130} fill="#ff5a4e" stroke={INK} strokeWidth={8} />
        <ellipse cx={-40} cy={-60} rx={22} ry={34} fill="#fff" opacity={0.5} />
        <path d="M -12 128 L 12 128 L 0 146 Z" fill="#ff5a4e" stroke={INK} strokeWidth={6} />
        {def > 0.02 && def < 0.98 && [0, 1, 2].map((i) => <path key={i} d={`M ${-20 + i * 20} ${160 + i * 6} l ${-10 + i * 10} 40`} stroke="#fff" strokeWidth={6} strokeLinecap="round" opacity={0.7} />)}
      </g>
      {tearIn > 0.01 && t < T.etfaragh && <g transform={`translate(260 110) scale(${tearIn * 2})`}><Drop r={16} /></g>}
      {sigh > 0.01 && <g transform={`translate(620 270) scale(${sigh})`}>
        <circle r={110} fill={YELLOW} stroke={INK} strokeWidth={8} />
        <path d="M -60 -10 q 22 16 44 0 M 16 -10 q 22 16 44 0" stroke={INK} strokeWidth={8} fill="none" strokeLinecap="round" />
        <path d="M -30 40 q 30 26 60 0" stroke={INK} strokeWidth={8} fill="none" strokeLinecap="round" />
        <circle cx={-66} cy={30} r={16} fill="#ff8f8f" opacity={0.6} /><circle cx={66} cy={30} r={16} fill="#ff8f8f" opacity={0.6} />
        {[0, 1, 2].map((i) => { const u = pm(ti * 0.8 + i / 3, 1); return <path key={i} d={`M ${120 + u * 60} ${-30 + i * 30} q 20 -10 40 0`} stroke="#fff" strokeWidth={6} fill="none" strokeLinecap="round" opacity={1 - u} />; })}
      </g>}
      {sigh > 0.01 && <g transform={`translate(620 450) scale(${sigh})`}><Txt x={0} y={0} size={54} fill={YELLOW}>آاااه</Txt></g>}
    </g>
  );
};

// ---- 11. the experiment: a lab; a little tube labelled "دموع" held under a man's nose (he doesn't know what it is)
const Flask: React.FC<{c: string; ti: number}> = ({c, ti}) => (
  <g>
    <path d="M -14 -60 L -14 -20 L -44 30 Q -48 40 -38 40 L 38 40 Q 48 40 44 30 L 14 -20 L 14 -60 Z" fill="#e8f4f8" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M -30 8 L 30 8 L 42 32 Q 44 36 38 36 L -38 36 Q -44 36 -42 32 Z" fill={c} />
    {[0, 1].map((i) => { const u = pm(ti * 0.9 + i / 2, 1); return <circle key={i} cx={(i ? 6 : -6) + Math.sin(u * 9) * 4} cy={-20 - u * 60} r={6} fill={c} stroke={INK} strokeWidth={3} opacity={1 - u} />; })}
  </g>
);
const Tube: React.FC = () => (
  <g>
    <rect x={-16} y={-70} width={32} height={110} rx={14} fill="#e8f4f8" stroke={INK} strokeWidth={6} />
    <rect x={-10} y={-10} width={20} height={44} rx={8} fill={TEAR} />
    <rect x={-20} y={-80} width={40} height={18} rx={5} fill="#9aa2ad" stroke={INK} strokeWidth={5} />
  </g>
);
const LabScene: React.FC<SP> = ({t, ti}) => {
  const s = popIn(t - T.olama + 0.05, 0.28), man = popIn(t - T.regala, 0.28);
  const tube = seg(t, T.yeshemo - 0.1, T.yeshemo + 0.3);
  const lab = popIn(t - T.domoo3_2, 0.24);
  const q = popIn(t - T.men, 0.26);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#e6eef0" />
      <rect x={0} y={330} width={BW} height={150} fill="#c9d6da" />
      <path d="M 0 330 L 860 330" stroke={INK} strokeWidth={6} />
      <g opacity={s}>
        <path d="M 40 150 L 330 150" stroke="#8a5a33" strokeWidth={12} />
        <g transform="translate(90 108) scale(0.7)"><Flask c="#6dff8c" ti={ti} /></g>
        <g transform="translate(180 108) scale(0.7)"><Flask c="#ff9fb8" ti={ti + 0.4} /></g>
        <g transform="translate(270 108) scale(0.7)"><Flask c="#8fd6ff" ti={ti + 0.8} /></g>
      </g>
      {man > 0.01 && <g transform={`translate(560 ${470}) scale(${1.05 * man})`}><Person mouth="flat" shirt="#5b7bd5" ti={ti} /></g>}
      {/* the hand with the tube, sliding under his nose */}
      {tube > 0.01 && <g transform={`translate(${lerp(300, 470, easeOut(tube))} ${lerp(330, 250, easeOut(tube))}) rotate(-24)`}>
        <path d="M -40 60 L -130 140" stroke={INK} strokeWidth={30} strokeLinecap="round" /><path d="M -40 60 L -130 140" stroke="#f7f7f2" strokeWidth={20} strokeLinecap="round" />
        <circle cx={-26} cy={44} r={22} fill="#b9e3ff" stroke={INK} strokeWidth={6} />
        <Tube />
      </g>}
      {tube > 0.6 && [0, 1, 2].map((i) => { const u = pm(ti * 1.2 + i / 3, 1); return (
        <path key={i} d={`M ${470 + u * 50} ${200 - u * 20} q 10 -14 20 0 q 10 14 20 0`} stroke="#5aa9e6" strokeWidth={5} fill="none" strokeLinecap="round" opacity={(1 - u) * 0.9} />); })}
      {lab > 0.01 && <g transform={`translate(330 230) scale(${lab})`}>
        <rect x={-62} y={-30} width={124} height={56} rx={12} fill="#fff" stroke={INK} strokeWidth={5} />
        <Txt x={0} y={14} size={40} fill={BLUE} sw={0}>دموع</Txt>
        <path d="M 62 0 L 110 10" stroke={INK} strokeWidth={4} />
      </g>}
      {q > 0.01 && <g transform={`translate(${640 + Math.sin(ti * 3) * 6} 110)`}><circle r={44 * q} fill="#fff" stroke={INK} strokeWidth={6} /><QMark x={0} y={28} size={80} s={q} fill={BLUE} /></g>}
    </g>
  );
};

// ---- 12. a game made to make them angry: a monitor with a game; the angry face gets redder; steam
const GameScene: React.FC<SP> = ({t, ti}) => {
  const s = popIn(t - T.weba3deen + 0.05, 0.28), sc = popIn(t - T.la3abohom, 0.28);
  const ang = easeInOut(seg(t, T.ma3mola, T.ta3asabhom + 0.3));
  const lose = popIn(t - T.ta3asabhom, 0.24);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#2a2a40" />
      {sc > 0.01 && <g transform={`translate(300 220) scale(${sc})`}>
        <rect x={-220} y={-150} width={440} height={280} rx={20} fill="#3b3f4a" stroke={INK} strokeWidth={9} />
        <rect x={-200} y={-132} width={400} height={244} rx={10} fill="#18243a" />
        <rect x={-30} y={130} width={60} height={50} fill="#3b3f4a" stroke={INK} strokeWidth={7} />
        {/* the game: a bar that keeps resetting, a red "X" score */}
        {[0, 1, 2, 3].map((i) => <rect key={i} x={-170 + i * 90} y={40 - pm(ti * 2 + i * 0.3, 1) * 110} width={50} height={20} rx={4} fill={['#6dff8c', YELLOW, BLUE, PINK][i]} stroke={INK} strokeWidth={3} />)}
        <g transform={`translate(110 -60) scale(${0.55 + 0.25 * ang})`}>
          <circle r={70} fill={`rgb(255,${Math.round(lerp(210, 80, ang))},${Math.round(lerp(63, 60, ang))})`} stroke={INK} strokeWidth={7} />
          <path d="M -44 -30 L -12 -12 M 44 -30 L 12 -12" stroke={INK} strokeWidth={8} strokeLinecap="round" />
          <circle cx={-26} cy={0} r={8} fill={INK} /><circle cx={26} cy={0} r={8} fill={INK} />
          <path d="M -26 38 q 26 -20 52 0" stroke={INK} strokeWidth={8} fill="none" strokeLinecap="round" />
        </g>
        {lose > 0.01 && <g transform={`translate(-90 -60) scale(${lose})`}><Txt x={0} y={20} size={58} fill={RED} rtl={false}>LOSE</Txt></g>}
      </g>}
      {s > 0.01 && <g transform={`translate(680 ${470}) scale(${1.0 * s})`}>
        <Person mouth={ang > 0.5 ? 'angry' : 'flat'} red={ang} brows={ang} shirt="#5b7bd5" ti={ti} />
        <Steam ti={ti} k={seg(t, T.ta3asabhom - 0.1, T.ta3asabhom + 0.2)} />
        {/* controller */}
        <g transform="translate(0 -150)"><rect x={-40} y={-16} width={80} height={32} rx={14} fill="#444" stroke={INK} strokeWidth={5} /></g>
      </g>}
    </g>
  );
};

// ---- 13. "what do you think happened?": a pulsing question mark between the tube and the angry face
const ThinkScene: React.FC<SP> = ({t, ti}) => {
  const s = popIn(t - T.teftekir + 0.05, 0.28);
  const q = popIn(t - T.eih + 0.02, 0.3);
  const pulse = 1 + 0.12 * Math.sin(ti * 7);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#1a1d2e" />
      <g transform={`translate(160 250) scale(${s})`}><Tube /><Txt x={0} y={110} size={40} fill={TEAR}>دموع</Txt></g>
      <g transform={`translate(700 250) scale(${0.8 * s})`}>
        <circle r={70} fill="rgb(255,90,60)" stroke={INK} strokeWidth={7} />
        <path d="M -44 -30 L -12 -12 M 44 -30 L 12 -12" stroke={INK} strokeWidth={8} strokeLinecap="round" />
        <circle cx={-26} cy={0} r={8} fill={INK} /><circle cx={26} cy={0} r={8} fill={INK} />
        <path d="M -26 38 q 26 -20 52 0" stroke={INK} strokeWidth={8} fill="none" strokeLinecap="round" />
      </g>
      {[0, 1].map((i) => <path key={i} d={`M ${250 + i * 300} 250 l 60 0`} stroke={CHALK} strokeWidth={8} strokeDasharray="12 12" strokeDashoffset={-ti * 40} opacity={s} />)}
      <QMark x={MID} y={330} size={240} s={Math.max(s * 0.6, q) * pulse} fill={YELLOW} rot={Math.sin(ti * 3) * 6} />
    </g>
  );
};

// ---- 14. the reveal: the anger bar drops, a counter runs to 44%
const RevealScene: React.FC<SP> = ({t, ti}) => {
  const drop = easeInOut(seg(t, T.allet, T.arba3a + 0.2));
  const cnt = Math.round(44 * easeOut(seg(t, T.arba3a, T.meya)));
  const done = popIn(t - T.meya, 0.26);
  const BH2 = 300, lv = lerp(1, 0.56, drop);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#1d3a33" />
      {/* rays */}
      {done > 0.01 && Array.from({length: 12}, (_, i) => <path key={i} d="M 0 0 L -40 -420 L 40 -420 Z" fill={YELLOW} opacity={0.1 * done}
        transform={`translate(560 250) rotate(${i * 30 + ti * 12})`} />)}
      <Txt x={200} y={64} size={44} fill={CHALK}>العصبية</Txt>
      <g transform="translate(200 420)">
        <rect x={-70} y={-BH2} width={140} height={BH2} rx={16} fill="#2b2b2b" stroke={INK} strokeWidth={8} />
        <rect x={-58} y={-BH2 * lv + 12} width={116} height={BH2 * lv - 24} rx={10} fill={lv > 0.8 ? RED : ORANGE} />
        <path d={`M -90 ${-BH2} L 90 ${-BH2}`} stroke={CHALK} strokeWidth={4} strokeDasharray="10 8" opacity={drop} />
        {drop > 0.02 && <g transform={`translate(116 ${-BH2 * lerp(1, lv, 0.5)}) scale(${popIn(t - T.allet, 0.24)})`}>
          <path d="M -22 -50 L 22 -50 L 22 0 L 44 0 L 0 50 L -44 0 L -22 0 Z" fill="#6dff8c" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        </g>}
      </g>
      <g transform={`translate(560 270) scale(${popIn(t - T.arba3a + 0.1, 0.26) * (1 + 0.15 * done * Math.exp(-(t - T.meya) * 6))})`}>
        <Txt x={0} y={50} size={180} fill={done > 0.01 ? YELLOW : CHALK} rtl={false}>{`-${cnt}%`}</Txt>
      </g>
      {done > 0.01 && <g transform={`translate(560 380) scale(${done})`}><Txt x={0} y={20} size={50} fill="#6dff8c">أهدى بكتير</Txt></g>}
    </g>
  );
};

// ---- 15. "your tears may be a secret message to the other person's brain: calm down": an envelope flies from a tear to a head
const MessageScene: React.FC<SP> = ({t, ti}) => {
  const s = popIn(t - T.ya3ni + 0.05, 0.28);
  const fly = easeInOut(seg(t, T.resala, T.lemo5 + 0.3));
  const open = seg(t, T.ehda - 0.1, T.ehda + 0.15);
  const seal = popIn(t - T.serreya, 0.22);
  const ex = lerp(220, 600, fly), ey = lerp(250, 210, fly) - Math.sin(fly * Math.PI) * 110;
  const calm = seg(t, T.ehda, T.ehda + 0.4);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#22344a" />
      <g transform={`translate(160 300) scale(${0.62 * s})`}><MyFace t={ti} id="M" r={150} /></g>
      <g transform={`translate(700 ${470}) scale(${1.05 * s})`}>
        <Person mouth={calm > 0.5 ? 'smile' : 'shout'} red={0.5 * (1 - calm)} brows={1 - calm} open={0.4 + 0.4 * Math.abs(Math.sin(ti * 10)) * (1 - calm)} shirt="#c0392b" ti={ti} />
        {calm < 0.99 && <g transform="translate(-60 -230) scale(-1 1)" opacity={1 - calm}><Waves ph={ti * 1.8} k={0.7} n={3} span={120} /></g>}
      </g>
      {fly > 0.001 && <g transform={`translate(${ex} ${ey}) rotate(${Math.sin(fly * 9) * 10 * (1 - open)}) scale(${0.9 + 0.2 * Math.sin(fly * Math.PI)})`}>
        <rect x={-70} y={-46} width={140} height={92} rx={8} fill="#fff" stroke={INK} strokeWidth={6} />
        {open < 0.5 ? <path d="M -70 -46 L 0 10 L 70 -46" stroke={INK} strokeWidth={5} fill="none" strokeLinejoin="round" />
          : <path d={`M -70 -46 L 0 ${-46 - 70 * open} L 70 -46`} fill="#f1e6cf" stroke={INK} strokeWidth={5} strokeLinejoin="round" />}
        {seal > 0.01 && open < 0.5 && <g transform={`translate(0 10) scale(${seal})`}><circle r={18} fill={RED} stroke={INK} strokeWidth={4} /><Txt x={0} y={7} size={20} fill="#fff" sw={0}>سري</Txt></g>}
      </g>}
      {open > 0.4 && <g transform={`translate(${600} ${120 - 30 * open}) scale(${popIn(t - T.ehda, 0.28)})`}>
        <rect x={-110} y={-50} width={220} height={100} rx={14} fill="#fffbe8" stroke={INK} strokeWidth={6} />
        <Txt x={0} y={22} size={64} fill={GREEN}>اهدى</Txt>
      </g>}
    </g>
  );
};

// ---- 16. "next time your eyes tear up while someone yells, don't be embarrassed"
const NextScene: React.FC<SP> = ({t, ti}) => {
  const eye = popIn(t - T.eenak + 0.05, 0.26), tear = seg(t, T.dama3et, T.dama3et + 0.4);
  const shout = popIn(t - T.beyza3a2, 0.26), ok = popIn(t - T.mattetkesefsh, 0.3);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#2b2338" />
      {eye > 0.01 && <g transform={`translate(560 240) scale(${eye * 1.3})`}>
        <path d="M -130 0 Q 0 -110 130 0 Q 0 110 -130 0 Z" fill="#fff" stroke={INK} strokeWidth={9} />
        <circle r={48} fill="#6b4a2e" stroke={INK} strokeWidth={5} /><circle r={22} fill={INK} /><circle cx={-14} cy={-14} r={9} fill="#fff" />
        <path d="M -120 16 Q 0 96 120 16" stroke={TEAR} strokeWidth={10 * tear} fill="none" opacity={0.8} />
        {tear > 0.01 && <g transform={`translate(${60} ${64 + 60 * easeIn(pm((ti - T.dama3et) * 0.9, 1))})`}><Drop r={18} o={tear} /></g>}
      </g>}
      {shout > 0.01 && <g transform={`translate(150 250) scale(${0.55 * shout})`}><ShoutMouth open={0.5 + 0.4 * Math.abs(Math.sin(ti * 13))} /></g>}
      {shout > 0.01 && <g transform={`translate(230 250)`}><Waves ph={ti * 1.8} k={shout * 0.7} n={3} span={140} /></g>}
      {ok > 0.01 && <g transform={`translate(720 110) rotate(-8) scale(${ok})`}>
        <rect x={-110} y={-44} width={220} height={88} rx={14} fill="#e8ffe9" stroke={INK} strokeWidth={7} />
        <Txt x={0} y={20} size={58} fill={GREEN}>عادي</Txt>
      </g>}
      <Check x={820} y={190} s={ok} r={30} />
    </g>
  );
};

// ---- 17. "it's your body doing its job": a body with a turning gear and a check
const JobScene: React.FC<SP> = ({t, ti}) => {
  const s = popIn(t - T.da2 + 0.05, 0.28), g = popIn(t - T.bey3mel, 0.26), ok = popIn(t - T.sho3lo, 0.26);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#283a2f" />
      <g transform={`translate(${MID} 452) scale(${1.15 * s})`}>
        <Body id="b17" level={0.0} base="#e9eef2"
          over={<g>
            <g transform="translate(0 -320)"><path d="M -22 -2 q 8 -8 16 0 M 6 -2 q 8 -8 16 0" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" /><path d="M -12 16 q 12 10 24 0" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" /></g>
            {g > 0.01 && <g transform={`translate(-18 -190) scale(${g})`}><Gear r={40} a={ti * 120} /></g>}
            {g > 0.01 && <g transform={`translate(26 -150) scale(${g})`}><Gear r={26} a={-ti * 185 + 20} c="#ffd23f" /></g>}
          </g>} />
      </g>
      <Check x={MID + 170} y={150} s={ok} r={44} />
      <Txt x={MID - 200} y={170} size={54} fill={GREEN}>{ok > 0.01 ? 'شغّال' : ''}</Txt>
    </g>
  );
};

// ---- 18. breathing tip: lungs (and a balloon) slowly in ... and slower out
const Lungs: React.FC<{k: number}> = ({k}) => (
  <g>
    <path d="M -8 -150 L -8 -60 L -40 -30 M 8 -150 L 8 -60 L 40 -30" stroke={INK} strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    {[-1, 1].map((sd) => (
      <g key={sd} transform={`translate(${sd * 70} 10) scale(${sd * k} ${k})`}>
        <path d="M -20 -100 Q -70 -96 -64 20 Q -60 90 0 86 Q 20 84 20 40 L 20 -60 Q 20 -100 -20 -100 Z" fill="#ff9fb8" stroke={INK} strokeWidth={8} strokeLinejoin="round" transform="scale(-1 1)" />
      </g>
    ))}
    <path d="M -8 -150 L -8 -60 L -40 -30 M 8 -150 L 8 -60 L 40 -30" stroke="#f2c4cf" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </g>
);
const breathK = (t: number) => {
  // gentle idle breathing until "خد", a slow breath in until "وطلّعه", then a slower breath out
  if (t < T.khod) return 0.9 + 0.05 * Math.sin((t - T.walaw) * 3.2);
  if (t < T.tala3o) return lerp(0.9, 1.22, easeInOut(seg(t, T.khod, T.tala3o)));
  return lerp(1.22, 0.85, easeInOut(seg(t, T.tala3o, T.tala3o + 2.6)));
};
const BreathScene: React.FC<SP> = ({t, ti}) => {
  const s = popIn(t - T.walaw + 0.05, 0.28), k = breathK(t);
  const inA = t >= T.khod && t < T.tala3o, outA = t >= T.tala3o;
  const snail = popIn(t - T.abta2, 0.28);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#1f3446" />
      <g transform={`translate(${MID} 290) scale(${1.15 * s})`}><Lungs k={k} /></g>
      {inA && <g transform={`translate(160 ${200 + pm(ti, 1) * 60}) rotate(180)`} opacity={0.9}>
        <path d="M -16 -36 L 16 -36 L 16 0 L 34 0 L 0 36 L -34 0 L -16 0 Z" fill="#9fd8ff" stroke={INK} strokeWidth={6} strokeLinejoin="round" /></g>}
      {inA && <g transform={`translate(160 360) scale(${popIn(t - T.khod, 0.24)})`}><Txt x={0} y={0} size={50} fill="#9fd8ff">شهيق</Txt></g>}
      {outA && <g transform={`translate(700 ${260 - pm(ti * 0.6, 1) * 60})`} opacity={0.9}>
        <path d="M -16 -36 L 16 -36 L 16 0 L 34 0 L 0 36 L -34 0 L -16 0 Z" fill="#6dff8c" stroke={INK} strokeWidth={6} strokeLinejoin="round" transform="rotate(180)" /></g>}
      {outA && <g transform={`translate(700 360) scale(${popIn(t - T.tala3o, 0.24)})`}><Txt x={0} y={0} size={50} fill="#6dff8c">زفير</Txt></g>}
      {snail > 0.01 && <g transform={`translate(${720 - (t - T.abta2) * 14} 430) scale(${0.8 * snail})`}>
        <path d="M -60 20 L 60 20 Q 70 20 66 6 L 50 -6" stroke={INK} strokeWidth={10} fill="#b8e986" strokeLinecap="round" />
        <circle cx={0} cy={-14} r={34} fill="#d9a066" stroke={INK} strokeWidth={6} /><path d="M 0 -14 m -16 0 a 16 16 0 1 0 32 0 a 8 8 0 1 0 -16 0" stroke={INK} strokeWidth={4} fill="none" />
        <path d="M 50 -6 L 46 -30 M 58 -6 L 66 -28" stroke={INK} strokeWidth={4} />
      </g>}
    </g>
  );
};

// ---- 19. the poll: right "بعيط 😢" / left "بزعق 😤" (both faces drawn in code)
const PollScene: React.FC<SP> = ({t, ti}) => {
  const q = popIn(t - T.wenta + 0.05, 0.3) * bump(t, T.ba2a, 0.12);
  const right = popIn(t - T.bet3ayat3, 0.28), left = popIn(t - T.betet3aseb, 0.28);
  const cm = popIn(t - T.ekteb, 0.28);
  return (
    <g>
      <rect x={MID} y={0} width={MID} height={BH} fill="#d4ebff" />
      <rect x={0} y={0} width={MID} height={BH} fill="#ffd9d4" />
      <path d={`M ${MID} 0 L ${MID} ${BH}`} stroke={INK} strokeWidth={8} />
      {right > 0.01 && <g transform={`translate(${MID + MID / 2} 220) scale(${right})`}>
        <EmojiFace kind="cry" ti={ti} />
        <Txt x={0} y={150} size={70} fill={BLUE}>بعيّط</Txt>
      </g>}
      {left > 0.01 && <g transform={`translate(${MID / 2} 220) scale(${left})`}>
        <EmojiFace kind="fume" ti={ti} />
        <Txt x={0} y={150} size={70} fill={RED}>بزعّق</Txt>
      </g>}
      {q > 0.01 && <g transform={`translate(${MID} 80)`}>
        <circle r={56 * q} fill={YELLOW} stroke={INK} strokeWidth={7} />
        <QMark x={0} y={36} size={100} s={q} fill="#fff" />
      </g>}
      {cm > 0.01 && <g transform={`translate(${MID} ${415 - Math.abs(Math.sin((t - T.ekteb) * 6)) * 14}) scale(${0.7 * cm})`}><Comment /></g>}
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
      {s === 'weak' && <WeakScene t={t} ti={ti} />}
      {s === 'shield' && <ShieldScene t={t} ti={ti} />}
      {s === 'amyg' && <AmygScene t={t} ti={ti} />}
      {s === 'button' && <ButtonScene t={t} ti={ti} />}
      {s === 'body' && <BodyScene t={t} ti={ti} />}
      {s === 'nofight' && <NoFightScene t={t} ti={ti} />}
      {s === 'pressure' && <PressureScene t={t} ti={ti} />}
      {s === 'valve' && <ValveScene t={t} ti={ti} />}
      {s === 'calm' && <CalmScene t={t} ti={ti} />}
      {s === 'relief' && <ReliefScene t={t} ti={ti} />}
      {s === 'lab' && <LabScene t={t} ti={ti} />}
      {s === 'game' && <GameScene t={t} ti={ti} />}
      {s === 'think' && <ThinkScene t={t} ti={ti} />}
      {s === 'reveal' && <RevealScene t={t} ti={ti} />}
      {s === 'message' && <MessageScene t={t} ti={ti} />}
      {s === 'next' && <NextScene t={t} ti={ti} />}
      {s === 'job' && <JobScene t={t} ti={ti} />}
      {s === 'breath' && <BreathScene t={t} ti={ti} />}
      {s === 'poll' && <PollScene t={t} ti={ti} />}
      {/* the hook drawing again, running into its frame-0 state at the last frame (loop) */}
      {s === 'loop' && <HookScene t={t - END} ti={t - END} loop />}
    </g>
  );
  // the question is swapped for the answer in place (no push): a quick white flash
  const flash = 1 - seg(t, MYST[1] - 0.02, MYST[1] + 0.25);
  const isReveal = scene === 'reveal' && prev === 'think';
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
          {scene === 'reveal' && flash > 0 && <rect x={0} y={0} width={BW} height={BH} fill="#fff8e0" opacity={flash * 0.85} />}
          <rect x={0} y={0} width={BW} height={BH} fill="url(#spot)" />
          {/* the board stays visible during the signature line, a little darker while he stares */}
          {dim > 0 && <rect x={0} y={0} width={BW} height={BH} fill="#0b1210" opacity={dim * 0.8} />}
        </g>
      </g>
    </svg>
  );
};

// arrows down to the comments, below the caption (he has no pointing-down pose, so the arrows do the pointing)
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
// curious bed + soft hits + record scratch: synthesized by tools/curious_bed.py, at their mix level
type Cue = [number, string, number];
const TICK = 'tears/sfx/tick';
const SFX: Cue[] = [
  // hook: the shouting rumble + a tear from frame 0
  [0, 'tremble', 0.1], [0.05, 'squish', 0.08], [T.yeza3a2, 'thud', 0.2], [T.yeza3a2 + 0.05, 'tremble', 0.14],
  // not weak / not too sensitive: stamps
  [T.da3eef - 0.04, 'thud', 0.24], [T.wala, 'swish', 0.16], [T.hasas - 0.04, 'thud', 0.22], [T.lozoom, 'swish', 0.16],
  [T.da - 0.05, 'pop', 0.16], [T.be7awel, 'whoosh', 0.14], [T.ye7meek, 'ding', 0.2],
  // amygdala
  [T.awel - 0.05, 'pop', 0.14], [T.ye3ali, 'tremble', 0.12], [T.feeh, 'pop', 0.14], [T.goz2, 'whoosh', 0.12], [T.loza, 'sparkle', 0.18],
  [T.khatar - 0.05, 'alarm', 0.14], [T.asad, 'thud', 0.26], [T.asad + 0.08, 'tremble', 0.16],
  // emergency button, body
  [T.yedoos - 0.05, 'pop', 0.14], [T.zorar, 'click', 0.22], [T.tawari, 'alarm', 0.16],
  ...Array.from({length: 8}, (_, i): Cue => [T.alback + i / 2.6, 'step', 0.1]), [T.yet2efel, 'squish', 0.18], [T.gesmak, 'bubbles', 0.16],
  // no running, no hitting, pressure
  [T.hatgry - 0.12, 'pop', 0.14], [T.hatgry + 0.12, 'swish', 0.18], [T.hatdrab - 0.1, 'pop', 0.14], [T.hatdrab + 0.08, 'swish', 0.18],
  [T.wa2ef, 'step', 0.16], [T.wekol, 'pop', 0.14], ...Array.from({length: 5}, (_, i): Cue => [T.daght + i * 0.25, TICK, 0.12]), [T.ma7boos, 'thud', 0.22],
  // release, calm, relief
  [T.domoo3, 'squish', 0.16], [T.tefok, 'whoosh', 0.22], [T.el3eyat - 0.05, 'pop', 0.12], [T.yehda, 'twinkle', 0.14],
  [T.bet3ayat2, 'pop', 0.12], [T.etfaragh - 0.05, 'whoosh', 0.2], [T.ertaht, 'ding', 0.16],
  // signature: stinger exactly on "استنى"
  [T.estanna, 'stinger', 0.34],
  // experiment
  [T.olama - 0.05, 'pop', 0.14], [T.regala, 'pop', 0.14], [T.yeshemo, 'swish', 0.14], [T.domoo3_2, 'pop', 0.14], [T.men, 'boing', 0.14],
  [T.la3abohom, 'click', 0.14], [T.la3abohom + 0.15, 'click', 0.12], [T.le3ba, 'click', 0.12], [T.ta3asabhom, 'thud', 0.2], [T.ta3asabhom + 0.05, 'boing', 0.12],
  // question and reveal
  [T.teftekir, 'pop', 0.14], [MYST[1], 'whoosh', 0.18], [T.allet, 'swish', 0.16],
  ...Array.from({length: 6}, (_, i): Cue => [T.arba3a + i * ((T.meya - T.arba3a) / 6), 'click', 0.1]), [T.meya, 'sparkle', 0.24], [T.meya, 'ding', 0.2],
  // secret message
  [T.ya3ni - 0.05, 'pop', 0.14], [T.resala, 'whoosh', 0.18], [T.serreya, 'pop', 0.14], [T.ehda - 0.05, 'swish', 0.14], [T.ehda, 'twinkle', 0.2],
  // next time, the body's job
  [T.eenak, 'pop', 0.14], [T.dama3et, 'squish', 0.12], [T.beyza3a2, 'tremble', 0.1], [T.mattetkesefsh, 'ding', 0.2],
  [T.bey3mel, 'click', 0.12], [T.sho3lo, 'ding', 0.18],
  // breathing
  [T.khod, 'whoosh', 0.1], [T.tala3o, 'whoosh', 0.08], [T.abta2, 'boing', 0.12],
  // poll + comments
  [T.wenta - 0.1, 'swish', 0.2], [T.wenta, 'pop', 0.18], [T.bet3ayat3, 'pop', 0.18], [T.betet3aseb, 'pop', 0.18], [T.ekteb, 'pop', 0.24], [T.comments, 'boing', 0.14],
  // ending
  [T.fahman - 0.15, 'swish', 0.24], [T.fahman, 'pop', 0.2], [T.kasban, 'twinkle', 0.34],
];
const SCENE_SWISH: Cue[] = SCENES.slice(1).filter(([, s]) => !['reveal', 'loop'].includes(s)).map(([tt]): Cue => [tt, 'swish', 0.1]);
const POSE_SWAP_SFX: Cue[] = POSES.slice(1).map(([t]) => [t - 0.06, 'swish', 0.07]);
const sfxFile = (n: string) => (n.includes('/') ? `elfahman/${n}.wav` : `elfahman/sfx/${n}.wav`);

// ============================================================ captions (word for word from the script)
// Hook caption rule: card 0 (4 words, big, centred) from frame 0; card 1 replaces it on "لما". Both bigger than every other card.
const caps = CAPS as unknown as {sizes: number[]; w100: number[]; base: {normal: number; big: number; gold: number}; cards: Record<string, Partial<Group>>};
const PAINT: [string, number, string][] = [
  ['بتعيط', 0, YELLOW], ['يزعقلك', 0, RED], ['ضعيف', 0, YELLOW], ['يحميك', 0, YELLOW], ['اللوزة', 0, YELLOW], ['خطر', 0, RED], ['أسد', 0, RED],
  ['الطوارئ', 0, RED], ['بسرعة', 0, RED], ['محبوس', 0, RED], ['الدموع', 0, YELLOW], ['يهدى', 0, YELLOW], ['وارتحت', 0, YELLOW],
  ['استنى', 0, RED], ['الغريب', 0, RED], ['دموع', 0, YELLOW], ['تعصبهم', 0, RED], ['أربعة', 0, YELLOW], ['وأربعين', 0, YELLOW], ['المية', 0, YELLOW],
  ['سرية', 0, YELLOW], ['اهدى', 0, YELLOW], ['متتكسفش', 0, YELLOW], ['بطيء', 0, YELLOW], ['أبطأ', 0, YELLOW], ['بتعيط', 2, YELLOW], ['بتتعصب', 0, RED],
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
  for (let k = 0; k < out.length; k++) {
    const nx = out[k + 1];
    out[k].e = nx ? (nx.s - out[k].e < 1.2 ? nx.s : out[k].e + 0.25) : 1e9;
  }
  const pin: Record<string, number> = {'استنى': T.estanna, 'الفهمان': T.fahman, 'كسبان': T.kasban};
  for (const g of out) for (const w of g.words) if (pin[nq(w.w)] !== undefined) w.s = pin[nq(w.w)];
  for (const g of out) g.s = g.words[0].s;
  for (let k = 0; k < out.length - 1; k++) out[k].e = Math.min(out[k].e, out[k + 1].s);
  out[0].s = 0;        // caption 1 of the hook is on screen in frame 0 ...
  out[0].e = out[1].s; // ... and caption 2 replaces it exactly when the voice reaches "لما"
  return out;
})();

// ============================================================ composition
export const Tears: React.FC = () => {
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
  const blink = BLINKS.some((b) => t >= b && t < b + 0.1) && pose !== 'shocked' && t > 0.3;
  const wink = t >= T.kasban && pose === 'temple'; // wink exactly on "كسبان"
  const sig = t >= T.estanna - 0.02 && t < T.olama ? 0.3 * easeOut(seg(t, T.estanna - 0.02, T.estanna + 0.12)) * (1 - seg(t, T.olama - 0.3, T.olama)) : 0;
  // mood: red alarm tint while the body panics; the room dims for the question; a warm lift on the reveal
  const alarm = seg(t, T.khatar, T.khatar + 0.3) * (1 - seg(t, T.tefok, T.el3eyat + 0.5));
  const myst = seg(t, T.teftekir, T.teftekir + 0.35) * (1 - seg(t, MYST[1] - 0.02, MYST[1] + 0.15));
  const rev = seg(t, MYST[1], MYST[1] + 0.3) * (1 - seg(t, T.ya3ni - 0.2, T.ya3ni + 0.3));
  const ROOM = 0.06 + 0.22 * myst;
  return (
    <AbsoluteFill style={{backgroundColor: '#140e0b'}}>
      <Fonts />
      <SetBack cam={cam} dim={ROOM + sig} />
      <Layer cam={cam} z={1000}>
        <Board t={t} dim={(sig / 0.3) * 0.32} />
        <Character pose={pose} mouth={mouth} blink={blink} wink={wink} x={CHAR_X} y={CHAR_Y} scale={CS} squash={squash} t={t}>
          <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
            {wink && <Sparkle x={HEAD[0] + 210} y={HEAD[1] - 40} dt={t - T.kasban} r={48} />}
          </svg>
        </Character>
      </Layer>
      <SetFront cam={cam} dim={ROOM + sig} />
      <AbsoluteFill style={{background: `rgba(255,170,70,${0.06 + 0.08 * rev})`}} />
      {alarm > 0.01 && <AbsoluteFill style={{background: `rgba(255,40,30,${0.05 * alarm * (0.7 + 0.3 * Math.sin(t * 8))})`}} />}
      <AbsoluteFill style={{background: `radial-gradient(ellipse 78% 62% at 50% 36%, rgba(0,0,0,0) 52%, rgba(0,0,0,${0.3 + sig * 0.6 + myst * 0.2 - rev * 0.12}) 100%)`}} />
      <DownArrows t={t} />
      <Captions t={t} groups={GROUPS} colors={{}} y={1250} x={460} />
      <Sequence from={Math.round(VO * FPS)}><Audio src={staticFile('elfahman/tears/vo/vo.mp3')} volume={1} /></Sequence>
      <Audio src={staticFile('elfahman/tears/music/bed.wav')} volume={1} />
      <Audio src={staticFile('elfahman/tears/music/hits.wav')} volume={1} />
      <Sequence from={Math.round(T.estanna * FPS)} durationInFrames={Math.round(0.6 * FPS)}><Audio src={staticFile('elfahman/tears/music/scratch.wav')} volume={0.8} /></Sequence>
      {[...SFX, ...SCENE_SWISH, ...POSE_SWAP_SFX].map(([tt, n, v], i) => (
        <Sequence key={i} from={Math.max(0, Math.round(tt * FPS))} durationInFrames={Math.round(1.6 * FPS)}>
          <Audio src={staticFile(sfxFile(n))} volume={v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// beats on the board (for QA: the longest time the board goes without a new beat)
export const TEARS_BEATS: number[] = [
  0, 0.5, 1.0, T.lama, T.yeza3a2, ...SCENES.map(([s]) => s),
  T.mesh, T.da3eef, T.wala, T.hasas, T.lozoom, T.be7awel, T.ye7meek, T.ye3ali, T.feeh, T.goz2, T.loza, T.khatar, T.asad,
  T.zorar, T.tawari, T.zorak, T.yet2efel, T.gesmak, T.hormonat, T.hatgry, T.hatdrab, T.wa2ef, T.wekol, T.ma7boos,
  T.domoo3, T.tefok, T.yehda, T.nafasak, T.bet3ayat2, T.etfaragh, T.ertaht, T.estanna,
  T.regala, T.yeshemo, T.domoo3_2, T.men, T.la3abohom, T.ma3mola, T.ta3asabhom, T.eih, T.allet, T.arba3a, T.meya,
  T.resala, T.serreya, T.lemo5, T.ehda, T.eenak, T.dama3et, T.beyza3a2, T.mattetkesefsh, T.bey3mel, T.sho3lo,
  T.khod, T.tala3o, T.abta2, T.bet3ayat3, T.betet3aseb, T.ekteb, T.fahman, T.kasban,
].sort((a, b) => a - b);
