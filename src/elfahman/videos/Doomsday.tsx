import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Fonts} from '../lib/fonts';
import {FPS, clamp, easeIn, easeInOut, easeOut, lerp, popIn, rand, seg, wobble} from '../lib/anim';
import {Cam, CamKey, Layer, camAt, shakeAt} from '../lib/camera';
import {SetBack, SetFront, DESK_SCREEN_Y} from '../lib/Set';
import {CANVAS, Character, HEAD, Pose, PoseKey, blinkTimes, mouthStates, poseAt, squashAt} from '../lib/Character';
import {Captions, Group, RED, YELLOW, Word, norm} from '../lib/Captions';
import {INK, Sparkle, Star, SweatDrop, showScale} from '../lib/fx';
import WORDS from './doomsday.words.json';
import ENV from './doomsday.env.json';
import CAPS from './doomsday.captions.json';

// Episode 10: "العالم كان هيخلص الأسبوع اللي فات!" (1960: a scientist and two students published "Doomsday: Friday, 13 November
// A.D. 2026" — world population growing faster and faster would reach infinity on that day; the strange part: it was his own
// birthday, and before he was a scientist he was a magician; it didn't happen because people have fewer children now).
// Every picture is drawn in code. Voice: the raw take at 1.0x, every silence cut to max 0.25 s (tools/capgaps.py --merge 0.06);
// the only longer pause is the natural one after "تفتكر؟" (0.46 s, cap 0.6 s, never lengthened); a second pass (tools/trimgaps.py) caps every gap at -30 dB too.
// Hook caption rule: caption 1 "العالم كان هيخلص" (3 words, big, centred) from frame 0, replaced by caption 2 "الأسبوع اللي فات!"
// exactly when the voice reaches it. The hook board (cracking Earth + red warning flash + a calendar flipping to "١٣ نوفمبر")
// moves from frame 0, and the last scene is the same hook board running into its frame-0 state (loop).

// ============================================================ timing
const VO = 0;
const words = WORDS as Word[];
const nq = (w: string) => norm(w).replace(/"/g, '');
const idx = (w: string, nth = 0) => {
  const hits = words.map((x, i) => (nq(x.w) === nq(w) ? i : -1)).filter((i) => i >= 0);
  if (hits[nth] === undefined) throw new Error(`word not found: ${w} #${nth}`);
  return hits[nth];
};
const S = (i: number) => words[i].s + VO; // onset of word i (index in doomsday.words.json)
const SPEECH_END = 68.45 + VO; // measured end of the last word (scribe_words.pauses.json)
export const DOOMSDAY_DURATION_S = Math.round((SPEECH_END + 0.4) * FPS) / FPS; // 0.4 s of silence after the last word
const END = DOOMSDAY_DURATION_S;

const T = {
  hayekhlas: S(2), osboo3: S(3), fat: S(5),
  mesh: S(6), kalam: S(8), dagaleen: S(9), da2: S(10), olama: S(12),
  sana: S(13), alf: S(14), settin: S(16), alem: S(17), ma3ah: S(18), etnein: S(19), tolabo: S(21), nashro: S(22), ba7s: S(23), akbar: S(27), magallat: S(28), elmeya: S(29),
  enwan: S(32), kan3: S(34), yom: S(35), nehaya: S(36), gom3a: S(38), talatashar: S(39), november: S(40), alfein: S(41), setta: S(42), eshreen: S(43),
  ya3ni: S(44), gom3a2: S(46), fatet: S(48), bezabt: S(50),
  tab: S(51), gaboo: S(53), tareekh: S(54), mneen: S(56),
  basso: S(57), adad: S(59), bashar: S(60), akher: S(62), alfein2: S(63), la2o: S(65), benzeed: S(67), wekol: S(68), shwaya: S(69), benzeed2: S(70), asra3: S(71), awel: S(73),
  fa3amalo: S(74), hesba: S(75), wetele3: S(76), fedelna: S(79), beshakl: S(81), adadna: S(83), hayewsal: S(84), lama: S(85), nehaya2: S(87), elyom: S(89), bezabt2: S(91),
  katabo: S(92), gomla: S(93), tekhawef: S(94), a7fad: S(95), a7fadna: S(96), mesh2: S(97), goo3: S(100), hayemoto2: S(101), za7ma: S(103),
  estanna: S(104), ghareeb: S(106), gay: S(107),
  yom3: S(108), talatashar2: S(109), makansh: S(112), sodfa: S(113), eed: S(116), milad: S(117), el3alem: S(118), nafso: S(119),
  aghrab: S(120), ragel: S(122), abl: S(124), yeb2a: S(126), alem2: S(127), shaghal: S(129), sa7er: S(130),
  tab2: S(131), leh: S(132), donya: S(133), makhlasetsh: S(134), teftekir: S(135),
  ashan: S(136), nas: S(137), tekhallef: S(139), a2al: S(140), zaman: S(141), beit: S(142), sab3: S(145), taman: S(146), atfal: S(147), delwa2ty: S(148), teflein: S(149), talata: S(150),
  zeyada: S(151), hedyet: S(152), badal: S(153), nehaya3: S(158), e7na: S(159), hawaly: S(161), tamanya: S(162), milyar: S(163), bas: S(164),
  aghlab: S(165), olama2: S(166), beyhazzar: S(170), tareekh2: S(171), bas2: S(172), ayez: S(174), yo2ros: S(175), wedn: S(176), za7ma2: S(179),
  bas3: S(180), besara7a: S(181), terkab: S(183), metro: S(184), sa3a: S(185), khamsa: S(186), bet7es: S(187), ando: S(190), ha2: S(191),
  ekteb: S(192), comments: S(194), az7am: S(196), makan: S(197), hayatak: S(200), fahman: S(201), kasban: S(202),
};
if (nq(words[104].w) !== 'استنى' || nq(words[201].w) !== 'الفهمان' || nq(words[135].w) !== 'تفتكر' || nq(words[184].w) !== 'المترو') throw new Error('word index table is off');
// signature moments pinned to the measured audio onsets (timing.py)
T.estanna = 35.18 + VO; T.fahman = 67.28 + VO; T.kasban = 68.08 + VO;
// the mystery pause: the real silence after "تفتكر؟" (scribe_words.pauses.json: 45.797-46.253 s, 0.46 s)
const MYST: [number, number] = [45.797 + VO, T.ashan];
// idle clock: idle wiggles stop during the stare from "استنى" (board held, darker)
const FREEZE: [number, number][] = [[T.estanna, T.yom3 - 0.05]];
const idle = (t: number) => t - FREEZE.reduce((a, [p0, p1]) => a + clamp(t - p0 - 0.04, 0, p1 - p0 - 0.04), 0);

// ============================================================ character
const TALKABLE: Pose[] = ['hero', 'explain', 'point_up', 'thinking', 'temple', 'thumbs_up', 'worried'];
const POSES: PoseKey[] = [
  [0, 'shocked'],               // hook: shocked beside the cracking Earth, from frame 0
  [T.mesh, 'explain'],          // "not fortune tellers"
  [T.olama, 'point_up'],        // "scientists"
  [T.alem, 'explain'],          // the scientist and his students
  [T.akbar, 'point_up'],        // one of the biggest journals
  [T.enwan, 'explain'],         // the title
  [T.ya3ni, 'point_up'],        // pointing at last Friday on the calendar
  [T.tab, 'thinking'],          // "where did they get that date?" (hand on chin)
  [T.basso, 'explain'],         // population
  [T.fa3amalo, 'point_up'],     // the sum -> infinity
  [T.katabo, 'worried'],        // the scary sentence
  [T.estanna, 'shocked'],       // signature line: shocked stare exactly on "استنى"
  [T.yom3, 'explain'],          // the date
  [T.eed, 'point_up'],          // his birthday!
  [T.aghrab, 'explain'],        // stranger still
  [T.sa7er, 'shocked'],         // a magician!
  [T.tab2, 'thinking'],         // why didn't it end? the mystery question
  [T.ashan, 'point_up'],        // the answer: fewer children
  [T.zaman, 'explain'],
  [T.zeyada, 'explain'],        // growth slowed down
  [T.milyar, 'thumbs_up'],      // just 8 billion
  [T.aghlab, 'explain'],        // most scientists think ...
  [T.beyhazzar, 'laughing'],    // ... he was joking
  [T.bas2, 'hero'],
  [T.bas3, 'worried'],          // squeezed in the 5 o'clock metro
  [T.ekteb, 'explain'],         // comments (arrows do the pointing down)
  [T.fahman, 'temple'],         // ending: hand on temple exactly on "الفهمان"
];
const MOUTH = mouthStates((ENV as {level: number[]}).level);
const BLINKS = blinkTimes(END, 10);

const CS = 0.6;
const CHAR_X = 540 - (CANVAS[0] * CS) / 2;
const CHAR_Y = DESK_SCREEN_Y - 1450 * CS;

// ============================================================ camera
const CAM0: Cam = {x: 520, y: 860, z: 180};
const BASE: Cam = {x: 512, y: 866, z: 125};
const NEAR: Cam = {x: 510, y: 850, z: 150};
const CAM_KEYS: CamKey[] = [
  [0, 1.0, {x: 512, y: 872, z: 120}],                              // pulls back from frame 0
  [T.mesh - 0.1, T.mesh + 0.4, BASE],
  [T.sana - 0.05, T.settin + 0.3, NEAR],                           // the old film frame
  [T.nashro - 0.1, T.nashro + 0.4, BASE],
  [T.enwan - 0.05, T.eshreen + 0.3, {x: 510, y: 840, z: 162}],      // close on the headline being typed
  [T.ya3ni - 0.1, T.ya3ni + 0.4, BASE],
  [T.tab - 0.05, T.mneen + 0.3, NEAR],
  [T.basso - 0.1, T.basso + 0.4, BASE],
  [T.benzeed2 - 0.05, T.awel + 0.3, NEAR],                         // faster and faster
  [T.fa3amalo - 0.1, T.fa3amalo + 0.4, BASE],
  [T.hayewsal - 0.03, T.nehaya2 + 0.15, {x: 508, y: 830, z: 170}],  // the graph shoots off the screen
  [T.katabo - 0.1, T.katabo + 0.4, BASE],
  [T.hayemoto2 - 0.05, T.za7ma + 0.3, {x: 510, y: 846, z: 158}],    // the packed Earth
  [T.estanna - 0.04, T.estanna + 0.1, {x: 540, y: 690, z: 280}],    // punch-in exactly on "استنى" (the board stays in frame)
  [T.yom3 - 0.1, T.yom3 + 0.4, BASE],
  [T.eed - 0.05, T.nafso + 0.3, NEAR],
  [T.aghrab - 0.1, T.aghrab + 0.4, BASE],
  [T.sa7er - 0.03, T.sa7er + 0.15, {x: 508, y: 846, z: 160}],       // the rabbit pops out
  [T.teftekir - 0.3, MYST[1] - 0.02, {x: 512, y: 780, z: 215}],    // slow push-in on the question
  [MYST[1] - 0.02, MYST[1] + 0.25, {x: 510, y: 820, z: 175}],      // the answer
  [T.zaman - 0.1, T.zaman + 0.4, BASE],
  [T.zeyada - 0.1, T.zeyada + 0.4, NEAR],
  [T.aghlab - 0.1, T.aghlab + 0.4, BASE],
  [T.bas3 - 0.05, T.khamsa + 0.3, {x: 510, y: 848, z: 156}],        // squeezed in the metro
  [T.bet7es - 0.1, T.bet7es + 0.4, BASE],
  [T.ekteb - 0.1, T.ekteb + 0.4, {x: 512, y: 868, z: 122}],
  [T.fahman - 0.1, T.fahman + 0.5, CAM0],                          // ends on the opening framing
];
const SHAKES: [number, number, number][] = [
  [0, 4, 8], [T.hayekhlas, 4, 9], [T.fat, 3, 10], [T.dagaleen, 3, 10], [T.magallat, 3, 10], [T.eshreen, 3, 10], [T.bezabt, 4, 9],
  [T.asra3, 2.5, 12], [T.nehaya2, 7, 7], [T.za7ma, 5, 8],
  [T.estanna, 16, 6], [T.milad, 3, 10], [T.sa7er, 6, 7], [MYST[1], 4, 9], [T.teflein, 2.5, 12], [T.milyar, 4, 9],
  [T.yo2ros, 2.5, 12], [T.khamsa, 3, 10], [T.ha2, 2.5, 12], [T.comments, 2.5, 12],
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
const Comment: React.FC = () => (
  <g>
    <path d="M -70 -50 Q -70 -70 -50 -70 L 50 -70 Q 70 -70 70 -50 L 70 10 Q 70 30 50 30 L -10 30 L -40 56 L -34 30 L -50 30 Q -70 30 -70 10 Z" fill="#fff" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    {[-30, 0, 30].map((x) => <circle key={x} cx={x} cy={-20} r={9} fill={INK} />)}
  </g>
);
// emoji-like faces drawn in code: crying 😢 and fuming 😤
// ---- 11. the experiment: a lab; a little tube labelled "دموع" held under a man's nose (he doesn't know what it is)
const Flask: React.FC<{c: string; ti: number}> = ({c, ti}) => (
  <g>
    <path d="M -14 -60 L -14 -20 L -44 30 Q -48 40 -38 40 L 38 40 Q 48 40 44 30 L 14 -20 L 14 -60 Z" fill="#e8f4f8" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M -30 8 L 30 8 L 42 32 Q 44 36 38 36 L -38 36 Q -44 36 -42 32 Z" fill={c} />
    {[0, 1].map((i) => { const u = pm(ti * 0.9 + i / 2, 1); return <circle key={i} cx={(i ? 6 : -6) + Math.sin(u * 9) * 4} cy={-20 - u * 60} r={6} fill={c} stroke={INK} strokeWidth={3} opacity={1 - u} />; })}
  </g>
);
const PAPER = '#f4ecdc', SEPIA = '#b89a6e', NAVY = '#22344a', PURPLE = '#8a5cd6';
const AR = '٠١٢٣٤٥٦٧٨٩';
const ar = (n: number | string) => String(n).replace(/[0-9]/g, (d) => AR[+d]);

// reveal a drawing from the right (dir -1, Arabic) or the left (dir 1)
const Wipe: React.FC<{id: string; x: number; y: number; w: number; h: number; p: number; dir: 1 | -1; children: React.ReactNode}> = ({id, x, y, w, h, p, dir, children}) => {
  if (p <= 0.001) return null;
  const ww = w * clamp(p);
  return (
    <g>
      <defs><clipPath id={id}><rect x={dir > 0 ? x : x + w - ww} y={y} width={ww} height={h} /></clipPath></defs>
      <g clipPath={`url(#${id})`}>{children}</g>
    </g>
  );
};

// ---- Earth (centre 0,0, radius r); crack 0..1 = a zigzag crack running down it; face: shock / smile / worry / none
const CONT = ['M -62 -48 Q -34 -86 4 -64 Q 22 -40 -8 -22 Q -40 2 -62 -18 Z', 'M 18 8 Q 62 -4 74 30 Q 52 74 18 62 Q -2 40 18 8 Z',
  'M -74 30 Q -52 18 -40 48 Q -54 72 -78 52 Z', 'M 40 -70 Q 70 -60 80 -30 Q 60 -30 44 -46 Z'];
const CRACK: [number, number][] = [[6, -100], [-8, -66], [14, -38], [-10, -6], [12, 22], [-6, 52], [8, 78], [-2, 100]];
const Earth: React.FC<{r?: number; crack?: number; face?: 'shock' | 'smile' | 'worry' | 'none'; id: string; ti?: number}> = ({r = 120, crack = 0, face = 'none', id, ti = 0}) => {
  const k = r / 100;
  const n = crack * (CRACK.length - 1), full = Math.floor(n), fr = n - full;
  const pts = CRACK.slice(0, full + 1).map(([x, y]) => [x * k, y * k]);
  if (full < CRACK.length - 1 && fr > 0) {
    const [x0, y0] = CRACK[full], [x1, y1] = CRACK[full + 1];
    pts.push([lerp(x0, x1, fr) * k, lerp(y0, y1, fr) * k]);
  }
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'} ${x} ${y}`).join(' ');
  return (
    <g>
      <defs><clipPath id={`earth${id}`}><circle r={r} /></clipPath></defs>
      <circle r={r + 7} fill={INK} />
      <circle r={r} fill="#3d8bff" />
      <g clipPath={`url(#earth${id})`}>
        <g transform={`scale(${k})`}>{CONT.map((c) => <path key={c} d={c} fill="#4fc26a" stroke="#2f8a47" strokeWidth={4} />)}</g>
        <ellipse cx={-r * 0.35} cy={-r * 0.45} rx={r * 0.32} ry={r * 0.16} fill="#fff" opacity={0.25} transform={`rotate(-30 ${-r * 0.35} ${-r * 0.45})`} />
        <circle r={r} fill="none" stroke="#1b4fa8" strokeWidth={r * 0.12} opacity={0.35} />
      </g>
      {crack > 0.01 && <g>
        <path d={d} stroke={RED} strokeWidth={r * 0.16} fill="none" strokeLinejoin="round" strokeLinecap="round" opacity={0.35 + 0.25 * Math.abs(Math.sin(ti * 9))} />
        <path d={d} stroke={INK} strokeWidth={r * 0.07} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      </g>}
      {face !== 'none' && <g transform={`scale(${k})`}>
        {face === 'smile' ? <path d="M -34 -14 q 10 -10 20 0 M 14 -14 q 10 -10 20 0" stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round" />
          : <g>
            <circle cx={-24} cy={-14} r={face === 'shock' ? 13 : 11} fill="#fff" stroke={INK} strokeWidth={5} /><circle cx={24} cy={-14} r={face === 'shock' ? 13 : 11} fill="#fff" stroke={INK} strokeWidth={5} />
            <circle cx={-24} cy={-12} r={5} fill={INK} /><circle cx={24} cy={-12} r={5} fill={INK} />
            {face === 'worry' && <path d="M -40 -38 L -14 -30 M 40 -38 L 14 -30" stroke={INK} strokeWidth={6} strokeLinecap="round" />}
          </g>}
        {face === 'smile' && <path d="M -22 18 q 22 22 44 0" stroke={INK} strokeWidth={7} fill="#7a1f1a" strokeLinecap="round" />}
        {face === 'shock' && <ellipse cx={0} cy={26} rx={14} ry={18} fill="#7a1f1a" stroke={INK} strokeWidth={5} />}
        {face === 'worry' && <path d="M -20 30 q 10 -10 20 0 q 10 10 20 0" stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />}
      </g>}
    </g>
  );
};

// ---- a calendar page (centre 0,0): red band with the month, big day number
const CalPage: React.FC<{day: string; month?: string; w?: number; h?: number; dayC?: string}> = ({day, month = 'نوفمبر', w = 230, h = 270, dayC = INK}) => (
  <g>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={18} fill="#fffaf0" stroke={INK} strokeWidth={8} />
    <path d={`M ${-w / 2 + 4} ${-h / 2 + h * 0.3} L ${-w / 2 + 4} ${-h / 2 + 18} Q ${-w / 2 + 4} ${-h / 2 + 4} ${-w / 2 + 18} ${-h / 2 + 4} L ${w / 2 - 18} ${-h / 2 + 4} Q ${w / 2 - 4} ${-h / 2 + 4} ${w / 2 - 4} ${-h / 2 + 18} L ${w / 2 - 4} ${-h / 2 + h * 0.3} Z`} fill={RED} />
    <path d={`M ${-w / 2} ${-h / 2 + h * 0.3} L ${w / 2} ${-h / 2 + h * 0.3}`} stroke={INK} strokeWidth={6} />
    <Txt x={0} y={-h / 2 + h * 0.23} size={h * 0.15} fill="#fff" sw={0.08}>{month}</Txt>
    <Txt x={0} y={h * 0.32} size={h * 0.5} fill={dayC} sw={0}>{day}</Txt>
    {[-1, 1].map((sd) => <rect key={sd} x={sd * w * 0.25 - 9} y={-h / 2 - 22} width={18} height={40} rx={8} fill="#9aa2ad" stroke={INK} strokeWidth={5} />)}
  </g>
);
// the hook calendar: pages flip up one by one and land on 13 (continuous in t, so the loop can run into frame 0)
const FlipCal: React.FC<{t: number; w?: number; h?: number}> = ({t, w = 230, h = 270}) => {
  const f = Math.floor((t + 0.2) / 0.3), u = pm((t + 0.2) / 0.3, 1);
  const under = Math.min(13, 11 + f), old = 10 + f;
  const flipping = old < 13;
  const sy = flipping ? Math.cos(easeIn(u) * Math.PI * 0.5) : 0;
  return (
    <g>
      <CalPage day={ar(under)} w={w} h={h} dayC={under === 13 ? RED : INK} />
      {flipping && sy > 0.02 && <g transform={`translate(0 ${-h / 2}) scale(1 ${sy}) translate(0 ${h / 2})`}>
        <CalPage day={ar(old)} w={w} h={h} />
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={18} fill="#000" opacity={0.25 * (1 - sy)} />
      </g>}
    </g>
  );
};
const Warn: React.FC<{s?: number}> = ({s = 1}) => (
  <g transform={`scale(${s})`}>
    <path d="M 0 -56 L 56 44 L -56 44 Z" fill={YELLOW} stroke={INK} strokeWidth={9} strokeLinejoin="round" />
    <rect x={-6} y={-24} width={12} height={40} rx={5} fill={INK} /><circle cx={0} cy={30} r={7} fill={INK} />
  </g>
);
const Glasses: React.FC<{s?: number; c?: string}> = ({s = 1, c = INK}) => (
  <g transform={`scale(${s})`}>
    <circle cx={-34} cy={0} r={28} fill="#cfe6ff" fillOpacity={0.5} stroke={c} strokeWidth={9} />
    <circle cx={34} cy={0} r={28} fill="#cfe6ff" fillOpacity={0.5} stroke={c} strokeWidth={9} />
    <path d="M -8 -4 Q 0 -12 8 -4 M -62 -6 L -86 -16 M 62 -6 L 86 -16" stroke={c} strokeWidth={8} fill="none" strokeLinecap="round" />
  </g>
);
const CrystalBall: React.FC<{ti: number}> = ({ti}) => (
  <g>
    <circle cx={0} cy={-20} r={104} fill={PURPLE} opacity={0.18 + 0.1 * Math.sin(ti * 4)} />
    <path d="M -70 70 L 70 70 L 52 34 L -52 34 Z" fill="#7a4a2a" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
    <circle cx={0} cy={-20} r={78} fill="#b9a2ff" stroke={INK} strokeWidth={8} />
    {[0, 1, 2].map((i) => <path key={i} d={`M ${-40 + i * 10} ${-20} q 30 ${-30 + i * 12} 60 0`} stroke="#fff" strokeWidth={5} fill="none" opacity={0.6}
      transform={`rotate(${ti * 60 + i * 120} 0 -20)`} />)}
    <ellipse cx={-30} cy={-52} rx={18} ry={10} fill="#fff" opacity={0.7} transform="rotate(-30 -30 -52)" />
  </g>
);
// ---- a scientist (Person in a white coat with glasses); hat = magician's top hat on his head (0..1)
const Scientist: React.FC<{ti: number; hat?: number; mouth?: 'smile' | 'flat'}> = ({ti, hat = 0, mouth = 'smile'}) => (
  <g>
    <Person mouth={mouth} shirt="#f7f7f2" hair="#cfcfcf" ti={ti} />
    <g transform="translate(0 -256)"><Glasses s={0.42} /></g>
    {hat > 0.01 && <g transform={`translate(0 ${-296 - 140 * (1 - hat)}) scale(0.62)`}><TopHat /></g>}
  </g>
);
const TopHat: React.FC<{wink?: number}> = ({wink = -1}) => (
  <g>
    <ellipse cx={0} cy={0} rx={92} ry={20} fill="#2a2a2a" stroke={INK} strokeWidth={8} />
    <path d="M -58 0 L -54 -124 Q 0 -136 54 -124 L 58 0 Z" fill="#2a2a2a" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
    <path d="M -57 -30 L 57 -30 L 57 -6 L -57 -6 Z" fill={RED} stroke={INK} strokeWidth={5} />
    {wink >= 0 && <g>
      <circle cx={-22} cy={-76} r={10} fill="#fff" stroke={INK} strokeWidth={4} /><circle cx={-22} cy={-74} r={4} fill={INK} />
      {wink > 0.5 ? <path d="M 12 -76 q 10 -8 20 0" stroke="#fff" strokeWidth={6} fill="none" strokeLinecap="round" />
        : <g><circle cx={22} cy={-76} r={10} fill="#fff" stroke={INK} strokeWidth={4} /><circle cx={22} cy={-74} r={4} fill={INK} /></g>}
      <path d="M -16 -50 q 16 12 32 0" stroke="#fff" strokeWidth={5} fill="none" strokeLinecap="round" />
    </g>}
  </g>
);
const Wand: React.FC = () => (
  <g>
    <rect x={-6} y={-90} width={12} height={130} rx={5} fill="#1c1c1c" stroke={INK} strokeWidth={4} />
    <rect x={-7} y={-92} width={14} height={24} rx={5} fill="#fff" stroke={INK} strokeWidth={4} />
  </g>
);
const Rabbit: React.FC<{ti: number}> = ({ti}) => (
  <g>
    {[-1, 1].map((sd) => <g key={sd} transform={`rotate(${sd * (10 + 6 * Math.sin(ti * 6 + sd))} ${sd * 18} -40)`}>
      <ellipse cx={sd * 18} cy={-92} rx={14} ry={46} fill="#fff" stroke={INK} strokeWidth={6} />
      <ellipse cx={sd * 18} cy={-90} rx={6} ry={30} fill={PINK} />
    </g>)}
    <ellipse cx={0} cy={-20} rx={46} ry={40} fill="#fff" stroke={INK} strokeWidth={7} />
    <circle cx={-16} cy={-26} r={6} fill={INK} /><circle cx={16} cy={-26} r={6} fill={INK} />
    <ellipse cx={0} cy={-12} rx={7} ry={5} fill={PINK} stroke={INK} strokeWidth={3} />
    <path d="M -8 -4 q 8 8 16 0" stroke={INK} strokeWidth={3.5} fill="none" />
  </g>
);
// a tiny person icon (feet at 0,0)
const Mini: React.FC<{c?: string; s?: number; sweat?: boolean; ti?: number}> = ({c = BLUE, s = 1, sweat = false, ti = 0}) => (
  <g transform={`scale(${s})`}>
    <path d="M -15 0 L -15 -20 Q -15 -34 0 -34 Q 15 -34 15 -20 L 15 0 Z" fill={c} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <circle cx={0} cy={-46} r={12} fill={SKIN} stroke={INK} strokeWidth={4} />
    {sweat && <g transform={`translate(14 ${-56 + pm(ti * 1.3, 1) * 16})`}><Drop r={5} o={1 - pm(ti * 1.3, 1)} /></g>}
  </g>
);
const KID_C = [BLUE, '#ff6f61', GREEN, '#ffb03a', PURPLE, '#3ac0c0', PINK, '#c0392b'];
const Kid: React.FC<{c: string; ti: number; k: number}> = ({c, ti, k}) => (
  <g transform={`translate(0 ${-Math.abs(Math.sin(ti * 5 + k)) * 6})`}>
    <path d="M -17 0 L -17 -24 Q -17 -38 0 -38 Q 17 -38 17 -24 L 17 0 Z" fill={c} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
    <circle cx={0} cy={-54} r={17} fill={SKIN} stroke={INK} strokeWidth={4.5} />
    <circle cx={-6} cy={-56} r={2.6} fill={INK} /><circle cx={6} cy={-56} r={2.6} fill={INK} />
    <path d="M -6 -47 q 6 5 12 0" stroke={INK} strokeWidth={2.6} fill="none" strokeLinecap="round" />
  </g>
);
// ---- the population curve: y grows like 1 / (end - x) (it shoots to infinity at the end); p = how much is drawn (0..1)
const GW = 560, GH = 300;
const hyper = (x: number) => GH * 0.08 * (1 / (1 - x * 0.985) - 1);
const logi = (x: number) => GH * 0.66 * (1 / (1 + Math.exp(-9 * (x - 0.48))) - 1 / (1 + Math.exp(9 * 0.48)));
const curve = (f: (x: number) => number, p: number, n = 90) =>
  Array.from({length: n + 1}, (_, i) => { const x = (i / n) * p; return `${i ? 'L' : 'M'} ${x * GW} ${-Math.min(f(x), 4000)}`; }).join(' ');
const Axes: React.FC<{label?: boolean}> = ({label = true}) => (
  <g>
    <path d={`M 0 ${-GH - 10} L 0 0 L ${GW + 20} 0`} stroke={CHALK} strokeWidth={7} fill="none" strokeLinecap="round" />
    <path d={`M -12 ${-GH + 6} L 0 ${-GH - 14} L 12 ${-GH + 6} M ${GW + 2} -12 L ${GW + 22} 0 L ${GW + 2} 12`} stroke={CHALK} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    {label && <g>
      <Txt x={130} y={-GH + 8} size={34} fill={CHALK} sw={0}>عدد البشر</Txt>
      <Txt x={GW + 10} y={46} size={32} fill={CHALK} anchor="end" sw={0}>السنين</Txt>
    </g>}
  </g>
);
const Line: React.FC<{d: string; c?: string; w?: number; dash?: string; o?: number}> = ({d, c = RED, w = 10, dash, o = 1}) => (
  <g opacity={o}>
    <path d={d} stroke={INK} strokeWidth={w + 8} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} />
    <path d={d} stroke={c} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} />
  </g>
);
// ∞ drawn as a lemniscate (the font has no ∞)
const INF = Array.from({length: 121}, (_, i) => {
  const a = (i / 120) * Math.PI * 2, d = 1 + Math.sin(a) ** 2;
  return `${i ? 'L' : 'M'} ${(100 * Math.cos(a)) / d} ${(100 * Math.sin(a) * Math.cos(a)) / d}`;
}).join(' ') + ' Z';
const Infinity_: React.FC<{p?: number; c?: string}> = ({p = 1, c = YELLOW}) => (
  <g>
    <path d={INF} stroke={INK} strokeWidth={40} fill="none" strokeLinejoin="round" pathLength={1} strokeDasharray={`${p} 1`} strokeLinecap="round" />
    <path d={INF} stroke={c} strokeWidth={24} fill="none" strokeLinejoin="round" pathLength={1} strokeDasharray={`${p} 1`} strokeLinecap="round" />
  </g>
);
const Calculator: React.FC<{ti: number}> = ({ti}) => (
  <g>
    <rect x={-60} y={-84} width={120} height={168} rx={16} fill="#3b3f4a" stroke={INK} strokeWidth={8} />
    <rect x={-44} y={-68} width={88} height={40} rx={6} fill="#bfe8c0" stroke={INK} strokeWidth={4} />
    <Txt x={38} y={-36} size={30} fill={INK} sw={0} anchor="end" rtl={false}>{String(Math.floor(pm(ti * 7, 1) * 90000) + 10000)}</Txt>
    {Array.from({length: 9}, (_, i) => <rect key={i} x={-42 + (i % 3) * 30} y={-16 + Math.floor(i / 3) * 30} width={24} height={22} rx={5}
      fill={i === Math.floor(pm(ti * 5, 1) * 9) ? YELLOW : '#9aa2ad'} stroke={INK} strokeWidth={3} />)}
  </g>
);
const Bread: React.FC = () => (
  <g>
    <path d="M -110 30 Q -120 -50 -40 -60 Q 0 -86 40 -60 Q 120 -50 110 30 Z" fill="#e0a35a" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
    <path d="M -50 -30 q 10 20 0 40 M 0 -40 q 10 20 0 40 M 50 -30 q 10 20 0 40" stroke="#b8742e" strokeWidth={7} fill="none" strokeLinecap="round" />
  </g>
);
const Dice: React.FC = () => (
  <g>
    <rect x={-50} y={-50} width={100} height={100} rx={20} fill="#fff" stroke={INK} strokeWidth={8} />
    {[[-24, -24], [24, -24], [0, 0], [-24, 24], [24, 24]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r={9} fill={INK} />)}
  </g>
);
const Cake: React.FC<{ti: number; candles?: number}> = ({ti, candles = 1}) => (
  <g>
    <rect x={-110} y={-20} width={220} height={90} rx={14} fill="#ff9fb8" stroke={INK} strokeWidth={8} />
    <rect x={-80} y={-80} width={160} height={66} rx={12} fill="#fff1d6" stroke={INK} strokeWidth={8} />
    <path d="M -110 0 q 18 22 36 0 q 18 22 36 0 q 18 22 36 0 q 18 22 36 0 q 18 22 36 0 q 18 22 36 0" stroke="#fff" strokeWidth={10} fill="none" strokeLinecap="round" />
    {[-50, -16, 18, 52].map((x, i) => <g key={x} opacity={candles}>
      <rect x={x - 7} y={-128} width={14} height={50} rx={4} fill={[BLUE, YELLOW, GREEN, PURPLE][i]} stroke={INK} strokeWidth={4} />
      <path d={`M ${x} ${-160 - 4 * Math.sin(ti * 13 + i)} Q ${x + 12} ${-140} ${x} ${-132} Q ${x - 12} ${-140} ${x} ${-160 - 4 * Math.sin(ti * 13 + i)} Z`} fill="#ffb03a" stroke={INK} strokeWidth={3.5} />
    </g>)}
  </g>
);
const PartyHat: React.FC = () => (
  <g>
    <path d="M -50 0 L 0 -120 L 50 0 Z" fill={PURPLE} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    <path d="M -34 -38 L 18 -42 M -20 -74 L 18 -80 M -42 -14 L 40 -16" stroke={YELLOW} strokeWidth={9} strokeLinecap="round" />
    <circle cx={0} cy={-124} r={16} fill={YELLOW} stroke={INK} strokeWidth={5} />
  </g>
);
const CONF = Array.from({length: 26}, (_, i) => ({x: rand(i * 2.1) * 860, v: 140 + rand(i * 5.3) * 160, d: rand(i * 3.7), c: [RED, YELLOW, BLUE, GREEN, PURPLE, PINK][i % 6], r: rand(i * 9.1) * 360}));
const Confetti: React.FC<{dt: number}> = ({dt}) => dt <= 0 ? null : (
  <g>{CONF.map((c, i) => {
    const y = -20 + (dt + c.d) * c.v;
    return <rect key={i} x={c.x + Math.sin(dt * 4 + i) * 20} y={y} width={16} height={10} fill={c.c} stroke={INK} strokeWidth={2.5}
      transform={`rotate(${c.r + dt * 300} ${c.x} ${y})`} />;
  })}</g>
);
const House: React.FC = () => (
  <g>
    <rect x={-210} y={-170} width={420} height={250} rx={10} fill="#fff4dd" stroke={INK} strokeWidth={9} />
    <path d="M -246 -160 L 0 -290 L 246 -160 Z" fill="#c0392b" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
    <rect x={130} y={-270} width={36} height={70} fill="#8a5a33" stroke={INK} strokeWidth={7} />
  </g>
);
const Ear: React.FC<{red: number}> = ({red}) => (
  <g>
    <path d="M -20 -110 Q 70 -130 80 -30 Q 86 40 30 70 Q 10 82 0 110 Q -40 120 -40 80 Q -40 40 -10 20 Q 20 0 0 -40 Q -20 -70 -20 -110 Z"
      fill={`rgb(${Math.round(lerp(232, 250, red))},${Math.round(lerp(180, 110, red))},${Math.round(lerp(138, 100, red))})`} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
    <path d="M 0 -80 Q 50 -86 52 -30 Q 54 10 20 30" stroke="#b9774f" strokeWidth={7} fill="none" strokeLinecap="round" />
  </g>
);
const Pinch: React.FC<{k: number}> = ({k}) => (
  <g>
    <path d="M 160 -40 L 70 -10" stroke={INK} strokeWidth={34} strokeLinecap="round" /><path d="M 160 -40 L 70 -10" stroke={SKIN} strokeWidth={24} strokeLinecap="round" />
    <path d={`M 160 40 L ${70 + 6 * k} ${14 - 8 * k}`} stroke={INK} strokeWidth={34} strokeLinecap="round" /><path d={`M 160 40 L ${70 + 6 * k} ${14 - 8 * k}`} stroke={SKIN} strokeWidth={24} strokeLinecap="round" />
    <circle cx={200} cy={0} r={56} fill={SKIN} stroke={INK} strokeWidth={8} />
  </g>
);
const Clock: React.FC<{hm: number}> = ({hm}) => (
  <g>
    <circle r={58} fill="#fff" stroke={INK} strokeWidth={9} />
    {Array.from({length: 12}, (_, i) => <path key={i} d={`M ${Math.sin((i / 12) * Math.PI * 2) * 44} ${-Math.cos((i / 12) * Math.PI * 2) * 44} L ${Math.sin((i / 12) * Math.PI * 2) * 50} ${-Math.cos((i / 12) * Math.PI * 2) * 50}`} stroke={INK} strokeWidth={4} />)}
    <path d={`M 0 0 L ${Math.sin(hm * Math.PI / 6) * 28} ${-Math.cos(hm * Math.PI / 6) * 28}`} stroke={INK} strokeWidth={9} strokeLinecap="round" />
    <path d={`M 0 0 L ${Math.sin(hm * Math.PI * 2) * 42} ${-Math.cos(hm * Math.PI * 2) * 42}`} stroke={RED} strokeWidth={6} strokeLinecap="round" />
    <circle r={6} fill={INK} />
  </g>
);
const DownArrow: React.FC<{s?: number}> = ({s = 1}) => (
  <g transform={`scale(${s})`}><path d="M 0 0 L -52 -60 L -21 -60 L -21 -150 L 21 -150 L 21 -60 L 52 -60 Z" fill={YELLOW} stroke={INK} strokeWidth={10} strokeLinejoin="round" /></g>
);

// ============================================================ board (chalkboard inset above his head)
const BX = 80, BY = 84, BW = 860, BH = 480, MID = BW / 2;
type Scene = 'hook' | 'fake' | 'y1960' | 'team' | 'mag' | 'title' | 'lastfri' | 'where' | 'people' | 'graph' | 'infinity' | 'quote' | 'crowd' |
  'bday' | 'magic' | 'why' | 'kids' | 'flatten' | 'joke' | 'metro' | 'comment' | 'loop';
const PUSH = 0.3;
const SCENES: [number, Scene][] = [
  [0, 'hook'], [T.mesh - 0.1, 'fake'], [T.sana - 0.1, 'y1960'], [T.alem - 0.1, 'team'], [T.nashro - 0.1, 'mag'], [T.enwan - 0.1, 'title'],
  [T.ya3ni - 0.1, 'lastfri'], [T.tab - 0.1, 'where'], [T.basso - 0.1, 'people'], [T.la2o - 0.1, 'graph'], [T.fa3amalo - 0.1, 'infinity'],
  [T.katabo - 0.1, 'quote'], [T.mesh2 - 0.1, 'crowd'], [T.yom3 - 0.1, 'bday'], [T.aghrab - 0.1, 'magic'], [T.tab2 - 0.1, 'why'],
  [MYST[1] - 0.02, 'kids'], [T.zeyada - 0.1, 'flatten'], [T.aghlab - 0.1, 'joke'], [T.bas3 - 0.1, 'metro'], [T.ekteb - 0.1, 'comment'], [T.fahman - 0.15, 'loop'],
];
type SP = {t: number; ti: number};

// ---- 0. hook: a cracking Earth, red warning flash, a calendar flipping to "١٣ نوفمبر" (all moving from frame 0)
const HookScene: React.FC<SP & {loop?: boolean}> = ({t, loop = false}) => {
  const crack = clamp(0.45 + t * 0.32);
  const fl = 0.5 + 0.5 * Math.sin(t * 10 + 1.2);
  const hit = loop ? 0 : popIn(t - T.fat, 0.2);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#1a1630" />
      {Array.from({length: 14}, (_, i) => <circle key={i} cx={rand(i * 4.1) * BW} cy={rand(i * 7.7) * BH} r={2 + rand(i) * 3} fill="#fff" opacity={0.3 + 0.4 * Math.abs(Math.sin(t * 2 + i))} />)}
      <g transform={`translate(${290 + Math.sin(t * 37) * 4} 255) rotate(${Math.sin(t * 23) * 2})`}><Earth r={150} crack={crack} face="shock" id={loop ? 'L' : 'H'} ti={t} /></g>
      <g transform={`translate(660 262) rotate(${-4 + Math.sin(t * 3) * 2}) scale(${1 + 0.06 * hit})`}><FlipCal t={t} /></g>
      <g transform={`translate(92 86) scale(${0.85 + 0.15 * fl})`}><Warn /></g>
      <rect x={0} y={0} width={BW} height={BH} fill={RED} opacity={0.08 + 0.16 * fl} />
    </g>
  );
};

// ---- 1. not fortune tellers: a crystal ball gets crossed out -> a lab flask + glasses (scientists)
const FakeScene: React.FC<SP> = ({t, ti}) => {
  const ball = popIn(t - T.mesh + 0.05, 0.26), x = popIn(t - T.dagaleen, 0.22);
  const away = easeIn(seg(t, T.da2 - 0.1, T.da2 + 0.15));
  const flask = popIn(t - T.da2, 0.26), gl = popIn(t - T.olama + 0.05, 0.26);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#2a1f3a" />
      {ball > 0.01 && away < 1 && <g transform={`translate(${MID - 600 * away} 270) scale(${1.25 * ball})`}><CrystalBall ti={ti} /><Cross x={0} y={-10} s={x} r={90} /></g>}
      {flask > 0.01 && <g transform={`translate(330 ${300 + Math.sin(ti * 3) * 5}) scale(${2.1 * flask})`}><Flask c="#6dff8c" ti={ti} /></g>}
      {gl > 0.01 && <g transform={`translate(600 240) scale(${1.6 * gl}) rotate(${wobble(t - T.olama, 2.5, 4) * 10})`}><Glasses /></g>}
      {gl > 0.01 && <g transform={`translate(600 380) scale(${gl})`}><Txt x={0} y={20} size={66} fill={YELLOW}>علما</Txt></g>}
    </g>
  );
};

// ---- 2. 1960: an old black-and-white film frame, the year typed, a typewriter clacking
const Typewriter: React.FC<{ti: number; on: number}> = ({ti, on}) => (
  <g>
    <rect x={-170} y={-40} width={340} height={110} rx={22} fill="#3b3b3b" stroke={INK} strokeWidth={8} />
    <rect x={-200} y={-80} width={400} height={44} rx={18} fill="#555" stroke={INK} strokeWidth={8} />
    <rect x={-120} y={-170} width={240} height={110} fill="#fffaf0" stroke={INK} strokeWidth={6} />
    {Array.from({length: 18}, (_, i) => {
      const r = Math.floor(i / 6), c = i % 6;
      const down = on > 0 && Math.floor(pm(ti * 9 + i * 0.37, 1) * 6) === c ? 6 : 0;
      return <circle key={i} cx={-125 + c * 50 + r * 12} cy={-8 + r * 30 + down} r={15} fill="#e8e2d2" stroke={INK} strokeWidth={4} />;
    })}
  </g>
);
const Film: React.FC<{ti: number}> = ({ti}) => (
  <g>
    <rect x={0} y={0} width={BW} height={BH} fill="#d9d2c0" />
    {[0, 1].map((sd) => <g key={sd}>
      <rect x={sd ? BW - 54 : 0} y={0} width={54} height={BH} fill="#1b1b1b" />
      {Array.from({length: 8}, (_, i) => <rect key={i} x={(sd ? BW - 54 : 0) + 14} y={pm(i * 64 + ti * 90, 512) - 30} width={26} height={34} rx={6} fill="#d9d2c0" />)}
    </g>)}
    {[0, 1, 2].map((i) => <path key={i} d={`M ${120 + pm(ti * 330 + i * 270, 640)} 0 L ${118 + pm(ti * 330 + i * 270, 640)} ${BH}`} stroke="#000" strokeWidth={2} opacity={0.25} />)}
  </g>
);
const Y1960Scene: React.FC<SP> = ({t, ti}) => {
  const yr = seg(t, T.alf - 0.05, T.settin + 0.45);
  const tw = popIn(t - T.sana + 0.05, 0.28);
  return (
    <g>
      <Film ti={ti} />
      <g filter="url(#bw)">
        {tw > 0.01 && <g transform={`translate(560 ${400}) scale(${0.95 * tw})`}><Typewriter ti={ti} on={yr > 0 && yr < 1 ? 1 : 0} /></g>}
        <Wipe id="yr60" x={90} y={70} w={330} h={200} p={yr} dir={-1}><Txt x={255} y={225} size={170} fill="#333" sw={0}>١٩٦٠</Txt></Wipe>
        <Txt x={255} y={300} size={36} fill="#555" sw={0}>{yr >= 1 ? 'سنة' : ''}</Txt>
      </g>
    </g>
  );
};
// ---- 3. a scientist and two of his students (old photo)
const TeamScene: React.FC<SP> = ({t, ti}) => {
  const a = popIn(t - T.alem + 0.05, 0.28), s1 = popIn(t - T.etnein, 0.26), s2 = popIn(t - T.etnein - 0.18, 0.26);
  const tag = popIn(t - T.tolabo, 0.24);
  return (
    <g>
      <Film ti={ti} />
      <g filter="url(#bw)">
        {a > 0.01 && <g transform={`translate(${MID} 470) scale(${1.15 * a})`}><Scientist ti={ti} /></g>}
        {s1 > 0.01 && <g transform={`translate(${MID - 210} 470) scale(${0.95 * s1})`}><Person mouth="smile" shirt="#5b7bd5" ti={ti} /></g>}
        {s2 > 0.01 && <g transform={`translate(${MID + 210} 470) scale(${0.95 * s2})`}><Person mouth="smile" shirt="#c0392b" hair="#2a1a10" ti={ti} /></g>}
      </g>
      {tag > 0.01 && <g transform={`translate(${MID} 70) scale(${tag})`}><Txt x={0} y={20} size={54} fill={YELLOW}>عالِم + ٢ طلاب</Txt></g>}
    </g>
  );
};
// ---- 4. they published in one of the biggest journals: a thick old magazine "Science"
const MagScene: React.FC<SP> = ({t, ti}) => {
  const pap = popIn(t - T.nashro + 0.05, 0.26), fly = easeInOut(seg(t, T.ba7s + 0.1, T.akbar));
  const mag = popIn(t - T.akbar + 0.05, 0.3), glow = popIn(t - T.elmeya, 0.3);
  const slam = mag > 0 ? 1 + 0.5 * (1 - Math.min(1, (t - T.akbar + 0.05) / 0.12)) : 0;
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#2b2b2b" />
      {glow > 0.01 && Array.from({length: 10}, (_, i) => { const a = (i / 10) * Math.PI * 2 + ti * 0.6;
        return <path key={i} d={`M 0 0 L ${Math.cos(a - 0.12) * 420} ${Math.sin(a - 0.12) * 420} L ${Math.cos(a + 0.12) * 420} ${Math.sin(a + 0.12) * 420} Z`} fill={YELLOW} opacity={0.12 * glow} transform={`translate(${MID} 250)`} />; })}
      {pap > 0.01 && fly < 1 && <g transform={`translate(${lerp(170, MID, fly)} ${lerp(260, 240, fly)}) rotate(${lerp(-8, 0, fly)}) scale(${pap * lerp(1, 0.4, fly)})`}>
        <rect x={-90} y={-120} width={180} height={240} fill="#fffaf0" stroke={INK} strokeWidth={6} />
        {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M -64 ${-84 + i * 32} L 64 ${-84 + i * 32}`} stroke="#9aa2ad" strokeWidth={8} strokeLinecap="round" />)}
      </g>}
      {mag > 0.01 && <g transform={`translate(${MID} 250) rotate(-4) scale(${mag * slam})`} filter="url(#bw)">
        {[5, 4, 3, 2, 1].map((i) => <rect key={i} x={-150 + i * 6} y={-200 + i * 6} width={300} height={400} rx={6} fill="#efe6d0" stroke={INK} strokeWidth={4} />)}
        <rect x={-150} y={-200} width={300} height={400} rx={6} fill="#e9e1cc" stroke={INK} strokeWidth={8} />
        <rect x={-150} y={-200} width={300} height={110} fill="#333" />
        <Txt x={0} y={-118} size={72} fill="#fff" rtl={false} sw={0}>Science</Txt>
        <circle cx={0} cy={40} r={80} fill="#bbb" stroke={INK} strokeWidth={6} />
        <circle cx={0} cy={40} r={80} fill="none" stroke="#666" strokeWidth={4} strokeDasharray="8 10" />
        <Txt x={0} y={172} size={30} fill="#333" rtl={false} sw={0}>NOV. 1960</Txt>
      </g>}
      {glow > 0.01 && [[170, 120], [700, 110], [720, 400], [150, 390]].map(([x, y], i) => <Star key={i} x={x} y={y} r={26 * glow * (0.8 + 0.2 * Math.sin(ti * 5 + i))} rot={ti * 40} />)}
    </g>
  );
};
// ---- 5. the paper's title typed out: "يوم نهاية العالم: الجمعة ١٣ نوفمبر ٢٠٢٦"
const TitleScene: React.FC<SP> = ({t, ti}) => {
  const pap = popIn(t - T.enwan + 0.05, 0.26);
  const l1 = seg(t, T.yom - 0.05, T.gom3a - 0.05), l2 = seg(t, T.gom3a - 0.05, T.alfein - 0.05), l3 = seg(t, T.alfein - 0.05, T.eshreen + 0.4);
  const ul = seg(t, T.eshreen + 0.3, T.eshreen + 0.6);
  const cur = (p: number, x0: number, w: number) => p > 0 && p < 1 ? x0 + w * (1 - p) : null;
  const curs = [cur(l1, 90, 680), cur(l2, 90, 680), cur(l3, 270, 320)];
  const cy = [150, 280, 400];
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#3a2f28" />
      <g transform={`translate(${MID} 250) scale(${pap}) translate(${-MID} -250)`}>
        <rect x={60} y={24} width={740} height={440} fill="#fffaf0" stroke={INK} strokeWidth={8} />
        <Txt x={MID} y={70} size={28} fill="#888" sw={0}>عنوان البحث</Txt>
        <Wipe id="tl1" x={66} y={70} w={728} h={110} p={l1} dir={-1}><Txt x={MID} y={160} size={84} fill={INK} sw={0}>يوم نهاية العالم:</Txt></Wipe>
        <Wipe id="tl2" x={66} y={200} w={728} h={110} p={l2} dir={-1}><Txt x={MID} y={290} size={84} fill={RED} sw={0}>الجمعة ١٣ نوفمبر</Txt></Wipe>
        <Wipe id="tl3" x={250} y={320} w={360} h={110} p={l3} dir={-1}><Txt x={MID} y={410} size={92} fill={RED} sw={0}>٢٠٢٦</Txt></Wipe>
        {ul > 0 && <path d={`M ${MID + 150} 432 L ${MID + 150 - 300 * ul} 432`} stroke={RED} strokeWidth={10} strokeLinecap="round" />}
        {curs.map((x, i) => x !== null && Math.sin(ti * 20) > -0.3 ? <rect key={i} x={x - 4} y={cy[i] - 70} width={8} height={84} fill={INK} /> : null)}
      </g>
    </g>
  );
};
// ---- 6. "last Friday, exactly": the November 2026 calendar, Friday the 13th circled in red (the week starts on Saturday)
const DAYS = ['سبت', 'حد', 'اتنين', 'تلات', 'أربع', 'خميس', 'جمعة'];
const LastFriScene: React.FC<SP> = ({t, ti}) => {
  const s = popIn(t - T.ya3ni + 0.05, 0.28), circ = seg(t, T.fatet - 0.05, T.fatet + 0.35), stamp = popIn(t - T.bezabt, 0.24);
  const today = popIn(t - T.gom3a2, 0.24);
  const CW = 100, X0 = MID + 3 * CW, Y0 = 150, RH = 56;
  const cell = (d: number) => { const k = d + 0; return [X0 - (k % 7) * CW, Y0 + Math.floor(k / 7) * RH] as const; }; // Nov 1 2026 = Sunday = column 1
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#2a3a33" />
      <g transform={`translate(${MID} 250) scale(${s}) translate(${-MID} -250)`}>
        <rect x={60} y={20} width={740} height={450} rx={18} fill="#fffaf0" stroke={INK} strokeWidth={8} />
        <rect x={64} y={24} width={732} height={64} rx={14} fill={RED} />
        <Txt x={MID} y={72} size={44} fill="#fff" sw={0.08}>نوفمبر ٢٠٢٦</Txt>
        {DAYS.map((d, i) => <Txt key={d} x={X0 - i * CW} y={124} size={26} fill={i === 6 ? RED : '#666'} sw={0}>{d}</Txt>)}
        {Array.from({length: 30}, (_, i) => { const [x, y] = cell(i + 1);
          return <Txt key={i} x={x} y={y + 30} size={34} fill={i + 1 === 13 ? RED : INK} sw={0}>{ar(i + 1)}</Txt>; })}
        {circ > 0 && (() => { const [x, y] = cell(13); return <g>
          <ellipse cx={x} cy={y + 18} rx={46} ry={32} fill="none" stroke={RED} strokeWidth={9} pathLength={1} strokeDasharray={`${circ} 1`} strokeLinecap="round" transform={`rotate(-8 ${x} ${y + 18})`} />
        </g>; })()}
        {today > 0.01 && (() => { const [x, y] = cell(21); return <g transform={`translate(${x} ${y + 18}) scale(${today})`}>
          <rect x={-40} y={-26} width={80} height={52} rx={12} fill="none" stroke={GREEN} strokeWidth={6} />
        </g>; })()}
      </g>
      {stamp > 0.01 && (() => { const [x, y] = cell(13); return <g transform={`translate(${x + 30} ${y + 96 + Math.sin(ti * 6) * 4}) scale(${stamp})`}>
        <path d="M -30 -66 L -44 -30 L -16 -30 Z" fill={RED} stroke={INK} strokeWidth={4} />
        <rect x={-70} y={-30} width={140} height={44} rx={10} fill={RED} stroke={INK} strokeWidth={5} />
        <Txt x={0} y={4} size={28} fill="#fff" sw={0}>بالظبط!</Txt>
      </g>; })()}
    </g>
  );
};
// ---- 7. "where did they get that date from?": the date card with question marks
const WhereScene: React.FC<SP> = ({t, ti}) => {
  const s = popIn(t - T.tab + 0.05, 0.28);
  const qs = [T.gaboo, T.tareekh, T.mneen].map((x) => popIn(t - x, 0.26));
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#1a1d2e" />
      <g transform={`translate(${MID} 260) scale(${s})`}><CalPage day="١٣" w={230} h={270} dayC={RED} /></g>
      <QMark x={190} y={260} size={170} s={qs[0]} rot={-14 + Math.sin(ti * 3) * 6} />
      <QMark x={680} y={230} size={150} s={qs[1]} rot={12 + Math.sin(ti * 3.4) * 6} fill={BLUE} />
      <QMark x={MID} y={470} size={120} s={qs[2] * (1 + 0.1 * Math.sin(ti * 7))} fill={RED} />
    </g>
  );
};
// ---- 8. the population over the last 2000 years: little people multiplying faster and faster
const PPL = (() => {
  const cells = Array.from({length: 96}, (_, i) => ({x: 90 + (i % 16) * 46 + ((Math.floor(i / 16) % 2) ? 23 : 0), y: 200 + Math.floor(i / 16) * 48}));
  return cells.map((c, i) => ({...c, k: rand(i * 3.17 + 1)})).sort((a, b) => a.k - b.k).map((c, i) => ({...c, c: KID_C[i % 8]}));
})();
const PeopleScene: React.FC<SP> = ({t, ti}) => {
  const bar = seg(t, T.akher, T.alfein2 + 0.5), tag = popIn(t - T.akher, 0.24);
  const t0 = T.basso - 0.1;
  const at = (i: number) => t0 + 0.45 * Math.log2(i + 1); // doubling every 0.45 s
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#1f3446" />
      {tag > 0.01 && <g>
        <rect x={60} y={40} width={740} height={20} rx={10} fill="#33506a" stroke={INK} strokeWidth={4} />
        <rect x={800 - 740 * bar} y={40} width={740 * bar} height={20} rx={10} fill={YELLOW} stroke={INK} strokeWidth={4} />
        <g transform={`translate(${MID} 120) scale(${tag})`}><Txt x={0} y={20} size={56} fill={CHALK}>آخر ٢٠٠٠ سنة</Txt></g>
      </g>}
      {PPL.map((p, i) => { const s = popIn(t - at(i), 0.2); return s > 0.01 &&
        <g key={i} transform={`translate(${p.x} ${p.y + 34 - Math.abs(Math.sin(ti * 6 + i)) * 4}) scale(${s * 0.8})`}><Mini c={p.c} /></g>; })}
    </g>
  );
};
// ---- 9. the graph: growing, and growing faster and faster
const GraphScene: React.FC<SP> = ({t, ti}) => {
  const ax = popIn(t - T.la2o + 0.05, 0.28);
  const p = 0.88 * easeInOut(seg(t, T.benzeed - 0.1, T.awel + 0.2));
  const fast = popIn(t - T.asra3, 0.24);
  const x = p * GW, y = -hyper(p);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#21302b" />
      <g transform={`translate(170 420) scale(${ax}) translate(-0 0)`}>
        <Axes />
        {p > 0.005 && <Line d={curve(hyper, p)} />}
        {p > 0.005 && <g transform={`translate(${x} ${y})`}><circle r={14 + 4 * Math.sin(ti * 10)} fill={YELLOW} stroke={INK} strokeWidth={5} /><g transform="translate(0 -18)"><Mini c={BLUE} s={0.8} /></g></g>}
        {fast > 0.01 && <g transform={`translate(${x - 150} ${y + 40}) scale(${fast})`}>
          {[0, 1, 2].map((i) => <path key={i} d={`M ${-60 - pm(ti * 3 + i / 3, 1) * 40} ${i * 22 - 22} l 40 0`} stroke={CHALK} strokeWidth={6} strokeLinecap="round" opacity={0.8} />)}
          <Txt x={0} y={-50} size={52} fill={YELLOW}>أسرع!</Txt>
        </g>}
      </g>
    </g>
  );
};
// ---- 10. the sum: the curve shoots straight up off the board -> a big ∞ -> on that exact day
const InfinityScene: React.FC<SP> = ({t, ti}) => {
  const calc = popIn(t - T.hesba + 0.02, 0.26);
  const p = lerp(0.88, 1, easeIn(seg(t, T.fedelna, T.nehaya2)));
  const up = popIn(t - T.fedelna, 0.24) * (1 - seg(t, T.hayewsal - 0.2, T.hayewsal));
  const inf = popIn(t - T.nehaya2, 0.3), draw = seg(t, T.nehaya2 - 0.05, T.nehaya2 + 0.45);
  const tag = popIn(t - T.elyom, 0.26), stamp = popIn(t - T.bezabt2, 0.22);
  const fl = 1 - seg(t, T.nehaya2, T.nehaya2 + 0.35);
  const ax = GW * 1.0;
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#21302b" />
      <g transform="translate(170 420)">
        <Axes label={false} />
        {p >= 0.99 && <path d={`M ${ax} 0 L ${ax} ${-GH - 140}`} stroke={CHALK} strokeWidth={4} strokeDasharray="12 12" opacity={0.6} />}
        <Line d={curve(hyper, p, 140)} />
        {tag > 0.01 && <g transform={`translate(${ax - 90} -60) scale(${tag})`}>
          <rect x={-140} y={-40} width={280} height={70} rx={14} fill={RED} stroke={INK} strokeWidth={6} />
          <Txt x={0} y={10} size={40} fill="#fff" sw={0}>١٣ نوفمبر ٢٠٢٦</Txt>
        </g>}
      </g>
      {calc > 0.01 && <g transform={`translate(110 140) scale(${calc}) rotate(-8)`}><Calculator ti={ti} /></g>}
      {up > 0.01 && <g transform={`translate(560 ${300 - pm(ti * 1.5, 1) * 30}) scale(${up})`}><g transform="rotate(180)"><DownArrow s={0.7} /></g><Txt x={0} y={-24} size={44} fill={YELLOW}>نزيد</Txt></g>}
      {inf > 0.01 && <g transform={`translate(${MID - 30} 170) scale(${1.35 * inf * (1 + 0.04 * Math.sin(ti * 6))})`}><Infinity_ p={draw} /></g>}
      {stamp > 0.01 && <g transform={`translate(330 300) scale(${stamp})`}><Txt x={0} y={0} size={50} fill={YELLOW}>في اليوم ده!</Txt></g>}
      {fl > 0 && fl < 1 && <rect x={0} y={0} width={BW} height={BH} fill="#fff8e0" opacity={fl * 0.6} />}
    </g>
  );
};
// ---- 11. the scary sentence: a quote, the family tree growing (great-grandchildren)
const QuoteScene: React.FC<SP> = ({t, ti}) => {
  const q = popIn(t - T.katabo + 0.05, 0.26), sc = popIn(t - T.tekhawef, 0.24);
  const g1 = popIn(t - T.a7fad, 0.24), g2 = seg(t, T.a7fadna, T.a7fadna + 0.4);
  const rows: [number, number, number][] = [[1, 150, 1], [2, 240, 0.9], [4, 330, 0.8], [8, 420, 0.7]];
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#2b2233" />
      {q > 0.01 && <g transform={`scale(${q})`}>
        <Txt x={110} y={200} size={220} fill={YELLOW} rtl={false} sw={0.06}>“</Txt>
        <Txt x={760} y={200} size={220} fill={YELLOW} rtl={false} sw={0.06}>”</Txt>
      </g>}
      {sc > 0.01 && <g transform={`translate(${MID} 74) scale(${sc}) translate(${Math.sin(ti * 40) * 2} 0)`}><Txt x={0} y={14} size={48} fill={RED}>جملة تخوّف!</Txt></g>}
      {rows.map(([n, y, s], r) => {
        const show = r === 0 ? q : r === 1 ? g1 : clamp(g2 * 3 - (r - 2) * 1.2);
        return Array.from({length: n}, (_, i) => {
          const x = MID + (i - (n - 1) / 2) * (r === 3 ? 74 : 120);
          const pa = r > 0 ? MID + (Math.floor(i / 2) - (n / 2 - 1) / 2) * (r === 3 ? 148 : r === 2 ? 240 : 0) : 0;
          return show > 0.01 && <g key={`${r}${i}`}>
            {r > 0 && <path d={`M ${r === 1 ? MID : pa} ${rows[r - 1][1] - 4} L ${x} ${y - 58 * s}`} stroke={CHALK} strokeWidth={4} opacity={0.6 * show} />}
            <g transform={`translate(${x} ${y}) scale(${s * popIn(show, 0.4) * 1.1})`}><Mini c={KID_C[(r * 3 + i) % 8]} /></g>
          </g>;
        });
      })}
    </g>
  );
};
// ---- 12. not hunger: bread crossed out -> crowding: the Earth packed shoulder to shoulder, sweating
const CROWD = Array.from({length: 46}, (_, i) => ({a: -Math.PI + (i / 45) * Math.PI, row: i % 2, c: KID_C[i % 8], k: rand(i * 1.9)}));
const CrowdScene: React.FC<SP> = ({t, ti}) => {
  const br = popIn(t - T.mesh2 + 0.05, 0.26), x = popIn(t - T.goo3 + 0.1, 0.22);
  const away = easeIn(seg(t, T.hayemoto2 - 0.05, T.hayemoto2 + 0.2));
  const e = popIn(t - T.hayemoto2, 0.3), packed = seg(t, T.za7ma - 0.15, T.za7ma + 0.4);
  const R = 150;
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#1a1630" />
      {br > 0.01 && away < 1 && <g transform={`translate(${MID - 700 * away} 250) scale(${1.4 * br})`}><Bread /><Cross x={0} y={-10} s={x} r={90} /></g>}
      {e > 0.01 && <g transform={`translate(${MID + Math.sin(ti * 30) * 3 * packed} 340) scale(${e})`}>
        {CROWD.map((p, i) => {
          const on = i % 2 === 0 || packed > p.k;
          if (!on) return null;
          const rr = R + 22 + p.row * 30 + Math.sin(ti * 7 + i) * 2;
          const a = p.a + Math.sin(ti * 5 + i * 1.3) * 0.012;
          return <g key={i} transform={`translate(${Math.cos(a) * rr} ${Math.sin(a) * rr + 22}) rotate(${(a * 180) / Math.PI + 90})`}><Mini c={p.c} s={0.72} /></g>;
        })}
        <Earth r={R} face="worry" id="crowd" ti={ti} />
        {[0, 1, 2, 3].map((i) => { const u = pm(ti * 1.1 + i / 4, 1), sd = i % 2 ? 1 : -1;
          return <g key={i} transform={`translate(${sd * (R * 0.75 + u * 120)} ${-R * 0.2 + u * u * 150}) scale(${1.4})`}><Drop r={11} o={(1 - u) * (0.4 + 0.6 * packed)} /></g>; })}
      </g>}
    </g>
  );
};
// ---- 13. it wasn't a coincidence: it was his own birthday (cake + party hat on the calendar page)
const BdayScene: React.FC<SP> = ({t, ti}) => {
  const cal = popIn(t - T.yom3 + 0.05, 0.28), dice = popIn(t - T.makansh, 0.24), dx = popIn(t - T.sodfa, 0.22);
  const cake = popIn(t - T.eed, 0.28), hat = easeOut(seg(t, T.milad - 0.05, T.milad + 0.2)), conf = t - T.nafso;
  const diceAway = easeIn(seg(t, T.eed - 0.25, T.eed));
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#2a1f3a" />
      {cal > 0.01 && <g transform={`translate(260 270) rotate(-4) scale(${1.05 * cal})`}>
        <CalPage day="١٣" w={250} h={290} dayC={RED} />
        {hat > 0.01 && <g transform={`translate(70 ${-150 - 160 * (1 - hat)}) rotate(16)`}><PartyHat /></g>}
      </g>}
      {dice > 0.01 && diceAway < 1 && <g transform={`translate(${640 + 400 * diceAway} 250) rotate(${12 + Math.sin(ti * 4) * 6}) scale(${1.3 * dice})`}><Dice /><Cross x={0} y={0} s={dx} r={64} /></g>}
      {dice > 0.01 && diceAway < 1 && <g transform={`translate(640 400) scale(${dice})`} opacity={1 - diceAway}><Txt x={0} y={10} size={44} fill={CHALK}>صدفة؟</Txt></g>}
      {cake > 0.01 && <g transform={`translate(620 390) scale(${1.05 * cake})`}><Cake ti={ti} /></g>}
      {cake > 0.01 && <g transform={`translate(620 120) scale(${popIn(t - T.milad, 0.26)})`}><Txt x={0} y={14} size={56} fill={YELLOW}>عيد ميلاده!</Txt></g>}
      <Confetti dt={conf} />
    </g>
  );
};
// ---- 14. stranger still: before he was a scientist, he was a magician (top hat, wand, a rabbit popping out, sparkles)
const MagicScene: React.FC<SP> = ({t, ti}) => {
  const sci = popIn(t - T.ragel + 0.02, 0.28), back = seg(t, T.abl, T.alem2 + 0.2);
  const hat = popIn(t - T.shaghal, 0.28), wand = popIn(t - T.shaghal - 0.1, 0.26);
  const rab = easeOut(seg(t, T.sa7er - 0.02, T.sa7er + 0.22)), sp = t - T.sa7er;
  const head = easeOut(seg(t, T.sa7er + 0.1, T.sa7er + 0.35));
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#22183a" />
      {Array.from({length: 12}, (_, i) => <circle key={i} cx={rand(i * 3.9) * BW} cy={rand(i * 6.1) * BH * 0.7} r={2 + rand(i) * 3} fill={YELLOW} opacity={0.2 + 0.5 * Math.abs(Math.sin(ti * 2.4 + i))} />)}
      {sci > 0.01 && <g transform={`translate(210 470) scale(${1.1 * sci})`}><Scientist ti={ti} hat={head} /></g>}
      {back > 0.01 && back < 1 && <g opacity={Math.sin(back * Math.PI)}>
        <path d="M 400 160 Q 340 60 260 90" stroke={CHALK} strokeWidth={8} fill="none" strokeDasharray="14 12" strokeLinecap="round" />
        <Txt x={420} y={130} size={42} fill={CHALK}>قبل...</Txt>
      </g>}
      {hat > 0.01 && <g transform={`translate(620 310) scale(${1.1 * hat})`}>
        {rab > 0.01 && <g transform={`translate(0 ${-10 - 90 * rab})`}><Rabbit ti={ti} /></g>}
        <g transform="rotate(180) translate(0 0)"><TopHat /></g>
      </g>}
      {wand > 0.01 && <g transform={`translate(760 250) rotate(${-30 + Math.sin(ti * 5) * 18}) scale(${wand})`}><Wand /></g>}
      {sp > 0 && [[540, 200], [700, 170], [600, 120], [780, 330], [460, 300]].map(([x, y], i) => <Sparkle key={i} x={x} y={y} dt={pm(sp * 0.8 + i * 0.17, 0.9)} r={30} />)}
      {sp > 0 && <g transform={`translate(${MID} 64) scale(${popIn(sp, 0.26)})`}><Txt x={0} y={14} size={56} fill={YELLOW}>ساحر!</Txt></g>}
    </g>
  );
};
// ---- 15. "so why didn't the world end? what do you think?": the Earth is fine; a big pulsing question mark (the mystery pause)
const WhyScene: React.FC<SP> = ({t, ti}) => {
  const e = popIn(t - T.donya + 0.05, 0.28), ok = popIn(t - T.makhlasetsh, 0.24);
  const q = popIn(t - T.teftekir + 0.02, 0.3), pulse = 1 + 0.12 * Math.sin(ti * 7);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#1a1d2e" />
      {e > 0.01 && <g transform={`translate(${q > 0 ? lerp(MID, 230, easeInOut(clamp(q))) : MID} 260) scale(${e * lerp(1, 0.75, clamp(q))})`}><Earth r={150} face="smile" id="why" ti={ti} /></g>}
      <Check x={MID + 170} y={120} s={ok * (1 - clamp(q))} r={44} />
      <QMark x={600} y={380} size={300} s={q * pulse} rot={Math.sin(ti * 3) * 6} />
    </g>
  );
};
// ---- 16. the answer: people have fewer children. A house with 8 kids -> the same house with 2-3
const KidsScene: React.FC<SP> = ({t, ti}) => {
  const house = popIn(t - T.zaman + 0.1, 0.28), less = popIn(t - T.a2al, 0.26), baby = popIn(t - T.ashan + 0.02, 0.26);
  const babyAway = easeIn(seg(t, T.zaman - 0.25, T.zaman));
  const tagNow = t >= T.delwa2ty;
  const kidIn = (i: number) => T.beit + (i / 7) * (T.taman - T.beit);
  const KX = (i: number) => -150 + (i % 4) * 100, KY = (i: number) => (i < 4 ? -50 : 60);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#2a3a33" />
      {baby > 0.01 && babyAway < 1 && <g transform={`translate(${330 - 500 * babyAway} 300) scale(${1.6 * baby})`}><Kid c={PINK} ti={ti} k={0} /></g>}
      {house > 0.01 && <g transform={`translate(330 ${385}) scale(${0.95 * house})`}>
        <House />
        {Array.from({length: 8}, (_, i) => {
          const keep = i < 2 || (i === 2 && t >= T.talata);
          const s = t < T.teflein - 0.05 ? popIn(t - kidIn(i), 0.22) : keep ? (i === 2 ? popIn(t - T.talata, 0.22) : 1) : 1 - easeIn(seg(t, T.teflein - 0.05 + i * 0.02, T.teflein + 0.12 + i * 0.02));
          return s > 0.01 && <g key={i} transform={`translate(${KX(i)} ${KY(i) + 8}) scale(${1.3 * s})`}><Kid c={KID_C[i]} ti={ti} k={i} /></g>;
        })}
      </g>}
      {house > 0.01 && <g transform={`translate(330 64) scale(${popIn(t - (tagNow ? T.delwa2ty : T.zaman), 0.24)})`}>
        <rect x={-110} y={-36} width={220} height={66} rx={16} fill={tagNow ? GREEN : SEPIA} stroke={INK} strokeWidth={6} />
        <Txt x={0} y={14} size={42} fill="#fff" sw={0}>{tagNow ? 'دلوقتي' : 'زمان'}</Txt>
      </g>}
      {less > 0.01 && <g transform={`translate(700 ${250 + Math.sin(ti * 4) * 8}) scale(${less})`}>
        <g transform="rotate(0) translate(0 110)"><DownArrow s={1.1} /></g>
        <Txt x={0} y={-110} size={58} fill={YELLOW}>أقل</Txt>
        <g transform="translate(0 -40)"><Kid c={PINK} ti={ti} k={3} /></g>
      </g>}
      {t >= T.sab3 && t < T.delwa2ty && <g transform={`translate(700 440) scale(${popIn(t - T.sab3, 0.24)})`}><Txt x={0} y={0} size={46} fill={CHALK}>٧ - ٨</Txt></g>}
      {t >= T.teflein && <g transform={`translate(700 440) scale(${popIn(t - T.teflein, 0.24)})`}><Txt x={0} y={0} size={46} fill={YELLOW}>٢ - ٣</Txt></g>}
    </g>
  );
};
// ---- 17. growth slowed down: the curve bends and flattens, ∞ crossed out, the counter rolls to "٨ مليار"
const FlattenScene: React.FC<SP> = ({t, ti}) => {
  const ax = popIn(t - T.zeyada + 0.05, 0.28);
  const p = easeInOut(seg(t, T.zeyada, T.badal + 0.1));
  const old = popIn(t - T.badal, 0.26), x = popIn(t - T.nehaya3 + 0.1, 0.22);
  const cnt = popIn(t - T.hawaly, 0.26), roll = easeOut(seg(t, T.tamanya - 0.05, T.milyar + 0.1));
  const bas = popIn(t - T.bas, 0.24);
  const n = Math.round(roll * 8);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#21302b" />
      <g transform={`translate(130 430) scale(${ax * 0.86})`}>
        <Axes />
        {old > 0.01 && <Line d={curve(hyper, 0.985, 120)} c={CHALK} w={6} dash="14 14" o={0.5 * old} />}
        {p > 0.005 && <Line d={curve(logi, p)} c={GREEN} />}
      </g>
      {old > 0.01 && <g transform={`translate(560 92) scale(${0.5 * old})`}><Infinity_ c={CHALK} /><Cross x={0} y={0} s={x * 2} r={70} /></g>}
      {cnt > 0.01 && <g transform={`translate(700 260) scale(${cnt})`}>
        <rect x={-120} y={-64} width={240} height={128} rx={20} fill="#fffaf0" stroke={INK} strokeWidth={7} />
        <defs><clipPath id="rollclip"><rect x={-110} y={-56} width={110} height={112} /></clipPath></defs>
        <g clipPath="url(#rollclip)">
          {Array.from({length: 9}, (_, k) => <Txt key={k} x={-56} y={26 + (k - roll * 8) * 96} size={86} fill={GREEN} sw={0}>{ar(k)}</Txt>)}
        </g>
        <Txt x={60} y={18} size={44} fill={INK} sw={0}>مليار</Txt>
        {n === 8 && <Sparkle x={110} y={-60} dt={t - T.milyar - 0.05} r={34} />}
      </g>}
      {bas > 0.01 && <g transform={`translate(700 380) scale(${bas})`}><Txt x={0} y={10} size={50} fill={YELLOW}>بس!</Txt></g>}
    </g>
  );
};
// ---- 18. he was joking: the paper with the date and a winking magician hat; he wanted to pinch people's ears about crowding
const JokeScene: React.FC<SP> = ({t, ti}) => {
  const sc = popIn(t - T.olama2, 0.26), pap = popIn(t - T.beyhazzar, 0.28);
  const wink = t > T.tareekh2 && pm(t - T.tareekh2, 1.2) < 0.5 ? 1 : 0;
  const ha = popIn(t - T.tareekh2, 0.24);
  const ear = popIn(t - T.yo2ros + 0.05, 0.26), pinch = easeOut(seg(t, T.wedn - 0.05, T.wedn + 0.15));
  const earAway = easeIn(seg(t, T.yo2ros - 0.3, T.yo2ros - 0.05));
  const crowd = popIn(t - T.za7ma2 + 0.05, 0.26);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#2b2233" />
      {sc > 0.01 && earAway < 1 && [0, 1, 2].map((i) => <g key={i} transform={`translate(${520 + i * 120 + 500 * earAway} 470) scale(${0.72 * popIn(t - T.olama2 - i * 0.08, 0.26)})`}>
        <Person mouth="smile" shirt="#f7f7f2" hair={['#cfcfcf', HAIR, '#2a1a10'][i]} ti={ti} /><g transform="translate(0 -256)"><Glasses s={0.42} /></g>
      </g>)}
      {pap > 0.01 && <g transform={`translate(230 ${270}) rotate(-6) scale(${pap})`}>
        <rect x={-150} y={-120} width={300} height={250} fill="#fffaf0" stroke={INK} strokeWidth={7} />
        <Txt x={0} y={-50} size={36} fill={INK} sw={0}>يوم نهاية العالم</Txt>
        <Txt x={0} y={20} size={46} fill={RED} sw={0}>١٣ نوفمبر</Txt>
        <Txt x={0} y={90} size={50} fill={RED} sw={0}>٢٠٢٦</Txt>
        <g transform={`translate(120 -110) rotate(${12 + wobble(t - T.beyhazzar, 3, 4) * 10}) scale(0.62)`}><TopHat wink={wink} /></g>
      </g>}
      {ha > 0.01 && earAway < 1 && <g transform={`translate(${560 - 500 * earAway} 110) scale(${ha})`}>
        <g transform={`rotate(${Math.sin(ti * 14) * 6}) translate(0 ${Math.sin(ti * 24) * 6})`}><Txt x={70} y={0} size={70} fill={YELLOW}>ههههه</Txt></g>
      </g>}
      {ear > 0.01 && <g transform={`translate(560 ${230}) scale(${ear})`}>
        <Ear red={pinch} />
        <g transform={`translate(${-20 * pinch} 0)`}><Pinch k={pinch} /></g>
      </g>}
      {crowd > 0.01 && Array.from({length: 9}, (_, i) => <g key={i} transform={`translate(${470 + i * 40} ${470 - (i % 2) * 14}) scale(${0.7 * crowd})`}><Mini c={KID_C[i % 8]} sweat ti={ti + i * 0.3} /></g>)}
    </g>
  );
};
// ---- 19. the 5 o'clock metro: a packed car, people squeezed shoulder to shoulder
const MetroScene: React.FC<SP> = ({t, ti}) => {
  const car = easeOut(seg(t, T.bas3 - 0.1, T.terkab + 0.25));
  const clk = popIn(t - T.sa3a + 0.02, 0.26), five = easeOut(seg(t, T.sa3a, T.khamsa + 0.2));
  const sq = seg(t, T.metro, T.metro + 0.4);
  const ok = popIn(t - T.ha2, 0.24);
  const jolt = Math.sin(ti * 14) * 2;
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#33405a" />
      <rect x={0} y={420} width={BW} height={60} fill="#555" />
      {[0, 1].map((i) => <path key={i} d={`M 0 ${430 + i * 26} L ${BW} ${430 + i * 26}`} stroke="#999" strokeWidth={6} />)}
      <g transform={`translate(${lerp(900, 0, car)} ${jolt})`}>
        <rect x={30} y={130} width={800} height={290} rx={40} fill="#c9ccd2" stroke={INK} strokeWidth={9} />
        <rect x={30} y={350} width={800} height={26} fill={RED} />
        {[0, 1, 2, 3].map((w) => <g key={w}>
          <rect x={70 + w * 190} y={170} width={160} height={150} rx={14} fill="#bfe3f2" stroke={INK} strokeWidth={6} />
          <defs><clipPath id={`win${w}`}><rect x={73 + w * 190} y={173} width={154} height={144} rx={12} /></clipPath></defs>
          <g clipPath={`url(#win${w})`}>
            {Array.from({length: 6}, (_, k) => <g key={k} transform={`translate(${86 + w * 190 + k * (26 - 4 * sq)} ${312 + (k % 2) * 8 + Math.sin(ti * 6 + k + w) * 2})`}>
              <Mini c={KID_C[(k + w * 3) % 8]} s={0.95} sweat={k % 3 === w % 3} ti={ti + k} />
            </g>)}
          </g>
        </g>)}
        {[0, 1].map((i) => <circle key={i} cx={170 + i * 520} cy={420} r={30} fill="#333" stroke={INK} strokeWidth={7} />)}
        <Txt x={430} y={112} size={40} fill={CHALK}>المترو</Txt>
      </g>
      {clk > 0.01 && <g transform={`translate(110 80) scale(${clk})`}><Clock hm={lerp(3, 5, five)} /></g>}
      {clk > 0.01 && five >= 1 && <g transform={`translate(220 90) scale(${popIn(t - T.khamsa - 0.1, 0.24)})`}><Txt x={0} y={14} size={46} fill={YELLOW}>٥:٠٠</Txt></g>}
      {ok > 0.01 && <g transform={`translate(${BW - 90} 80) scale(${ok})`}><Check x={0} y={0} s={1} r={40} /><QMark x={66} y={30} size={70} s={1} /></g>}
    </g>
  );
};
// ---- 20. comments: "أزحم مكان؟" in a comment bubble, with a down arrow
const CommentScene: React.FC<SP> = ({t, ti}) => {
  const cm = popIn(t - T.ekteb + 0.05, 0.28), q = popIn(t - T.az7am + 0.02, 0.26), ar2 = popIn(t - T.hayatak, 0.24);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#1f3446" />
      {cm > 0.01 && <g transform={`translate(${MID} ${230 + Math.sin(ti * 3) * 5}) scale(${cm})`}>
        <path d="M -300 -150 Q -300 -180 -270 -180 L 270 -180 Q 300 -180 300 -150 L 300 60 Q 300 90 270 90 L 60 90 L -10 160 L 0 90 L -270 90 Q -300 90 -300 60 Z" fill="#fff" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
        {q > 0.01 ? <g transform={`scale(${q})`}><Txt x={-50} y={-20} size={90} fill={INK} sw={0}>أزحم مكان؟</Txt></g>
          : [-60, 0, 60].map((x) => <circle key={x} cx={x} cy={-46} r={18} fill={INK} />)}
        {ar2 > 0.01 && <g transform={`translate(250 ${66 + Math.abs(Math.sin(ti * 6)) * 12}) scale(${0.5 * ar2})`}><DownArrow /></g>}
      </g>}
      {q > 0.01 && Array.from({length: 7}, (_, i) => <g key={i} transform={`translate(${80 + i * 22} ${470 - (i % 2) * 10}) scale(${0.6 * q})`}><Mini c={KID_C[i]} /></g>)}
      {q > 0.01 && Array.from({length: 7}, (_, i) => <g key={i} transform={`translate(${640 + i * 22} ${470 - (i % 2) * 10}) scale(${0.6 * q})`}><Mini c={KID_C[(i + 3) % 8]} /></g>)}
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
      {s === 'fake' && <FakeScene t={t} ti={ti} />}
      {s === 'y1960' && <Y1960Scene t={t} ti={ti} />}
      {s === 'team' && <TeamScene t={t} ti={ti} />}
      {s === 'mag' && <MagScene t={t} ti={ti} />}
      {s === 'title' && <TitleScene t={t} ti={ti} />}
      {s === 'lastfri' && <LastFriScene t={t} ti={ti} />}
      {s === 'where' && <WhereScene t={t} ti={ti} />}
      {s === 'people' && <PeopleScene t={t} ti={ti} />}
      {s === 'graph' && <GraphScene t={t} ti={ti} />}
      {s === 'infinity' && <InfinityScene t={t} ti={ti} />}
      {s === 'quote' && <QuoteScene t={t} ti={ti} />}
      {s === 'crowd' && <CrowdScene t={t} ti={ti} />}
      {s === 'bday' && <BdayScene t={t} ti={ti} />}
      {s === 'magic' && <MagicScene t={t} ti={ti} />}
      {s === 'why' && <WhyScene t={t} ti={ti} />}
      {s === 'kids' && <KidsScene t={t} ti={ti} />}
      {s === 'flatten' && <FlattenScene t={t} ti={ti} />}
      {s === 'joke' && <JokeScene t={t} ti={ti} />}
      {s === 'metro' && <MetroScene t={t} ti={ti} />}
      {s === 'comment' && <CommentScene t={t} ti={ti} />}
      {/* the hook drawing again, running into its frame-0 state at the last frame (loop) */}
      {s === 'loop' && <HookScene t={t - END} ti={t - END} loop />}
    </g>
  );
  // the question is swapped for the answer in place (no push): a quick white flash
  const flash = 1 - seg(t, MYST[1] - 0.02, MYST[1] + 0.25);
  const isReveal = scene === 'kids' && prev === 'why';
  return (
    <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        <radialGradient id="spot" cx="50%" cy="42%" r="62%">
          <stop offset="0" stopColor="#fff6d8" stopOpacity={0.08} /><stop offset="0.6" stopColor="#fff6d8" stopOpacity={0} /><stop offset="1" stopColor="#000" stopOpacity={0.28} />
        </radialGradient>
        <radialGradient id="halo" cx="50%" cy="50%" r="50%">
          <stop offset="0.55" stopColor="#ffe9b0" stopOpacity={0.18} /><stop offset="1" stopColor="#ffe9b0" stopOpacity={0} />
        </radialGradient>
        {/* old black-and-white photo look for 1960 */}
        <filter id="bw"><feColorMatrix type="matrix" values="0.33 0.5 0.17 0 0.03  0.3 0.48 0.16 0 0.02  0.26 0.42 0.14 0 0  0 0 0 1 0" /></filter>
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
          {scene === 'kids' && flash > 0 && <rect x={0} y={0} width={BW} height={BH} fill="#fff8e0" opacity={flash * 0.85} />}
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
const TICK = 'doomsday/sfx/tick', CRACK_SFX = 'doomsday/sfx/crack';
const SFX: Cue[] = [
  // hook: the cracking Earth + warning alarm + flipping pages from frame 0
  [0, CRACK_SFX, 0.16], [0, 'alarm', 0.1], [0.05, 'tremble', 0.12], [0.1, 'swish', 0.08], [0.4, 'swish', 0.08], [0.7, 'swish', 0.08], [T.hayekhlas, 'thud', 0.2], [T.fat, CRACK_SFX, 0.14],
  // not fortune tellers -> scientists
  [T.mesh, 'sparkle', 0.12], [T.dagaleen, 'swish', 0.18], [T.da2, 'bubbles', 0.14], [T.olama, 'ding', 0.18],
  // 1960: typewriter clacks, the team, the journal
  ...Array.from({length: 8}, (_, i): Cue => [T.alf + i * 0.13, 'click', 0.12]), [T.alem, 'pop', 0.14], [T.etnein, 'pop', 0.12], [T.etnein + 0.18, 'pop', 0.12],
  [T.nashro, 'whoosh', 0.14], [T.akbar, 'thud', 0.24], [T.elmeya, 'sparkle', 0.16],
  // the title typed out
  ...Array.from({length: 22}, (_, i): Cue => [T.yom + i * ((T.eshreen + 0.3 - T.yom) / 22), 'click', 0.1]), [T.eshreen + 0.4, 'ding', 0.18],
  // last Friday
  [T.ya3ni, 'pop', 0.14], [T.fatet, 'swish', 0.16], [T.bezabt, 'thud', 0.2],
  // where from?
  [T.gaboo, 'boing', 0.12], [T.tareekh, 'pop', 0.12], [T.mneen, 'boing', 0.14],
  // population: pops getting denser, the graph
  ...Array.from({length: 12}, (_, i): Cue => [T.basso - 0.1 + 0.45 * Math.log2(1 + 2 ** (i * 0.55)), 'pop', 0.08]), [T.akher, 'whoosh', 0.12],
  [T.la2o, 'pop', 0.14], [T.benzeed, 'whoosh', 0.1], [T.asra3, 'whoosh', 0.18],
  // the sum -> infinity
  ...Array.from({length: 4}, (_, i): Cue => [T.hesba + i * 0.11, 'click', 0.12]), [T.fedelna, 'pop', 0.12], [T.hayewsal, 'whoosh', 0.2], [T.nehaya2, 'stinger', 0.2], [T.nehaya2, 'sparkle', 0.2], [T.elyom, 'pop', 0.14], [T.bezabt2, 'thud', 0.2],
  // scary sentence, crowding
  [T.tekhawef, 'tremble', 0.14], [T.a7fad, 'pop', 0.12], [T.a7fadna, 'pop', 0.12], [T.a7fadna + 0.2, 'pop', 0.12], [T.goo3 + 0.1, 'swish', 0.16],
  [T.hayemoto2, 'pop', 0.14], [T.za7ma, 'squish', 0.2], [T.za7ma + 0.1, 'tremble', 0.14],
  // signature: stinger exactly on "استنى"
  [T.estanna, 'stinger', 0.34],
  // birthday
  [T.yom3, 'pop', 0.14], [T.sodfa, 'swish', 0.16], [T.eed, 'pop', 0.16], [T.milad, 'boing', 0.14], [T.nafso, 'sparkle', 0.2], [T.nafso, 'ding', 0.16],
  // magician
  [T.ragel, 'pop', 0.14], [T.abl, 'whoosh', 0.12], [T.shaghal, 'pop', 0.14], [T.sa7er, 'boing', 0.18], [T.sa7er, 'twinkle', 0.24],
  // why? the mystery question, the answer
  [T.donya, 'pop', 0.14], [T.makhlasetsh, 'ding', 0.14], [T.teftekir, 'pop', 0.14], [MYST[1], 'whoosh', 0.18],
  [T.a2al, 'swish', 0.14], [T.zaman, 'pop', 0.14], ...Array.from({length: 8}, (_, i): Cue => [T.beit + (i / 7) * (T.taman - T.beit), 'pop', 0.09]),
  [T.delwa2ty, 'swish', 0.14], [T.teflein, 'whoosh', 0.16], [T.talata, 'pop', 0.14],
  // flattening, 8 billion
  [T.zeyada, 'whoosh', 0.12], [T.nehaya3, 'swish', 0.16], ...Array.from({length: 8}, (_, i): Cue => [T.tamanya + i * 0.06, TICK, 0.1]), [T.milyar, 'ding', 0.2], [T.bas, 'boing', 0.12],
  // joking, ear pinch
  [T.olama2, 'pop', 0.12], [T.beyhazzar, 'pop', 0.14], [T.tareekh2, 'twinkle', 0.14], [T.wedn, 'squish', 0.2], [T.za7ma2, 'pop', 0.12],
  // metro
  [T.bas3, 'whoosh', 0.18], ...Array.from({length: 6}, (_, i): Cue => [T.terkab + i * 0.45, 'step', 0.08]), [T.sa3a, 'pop', 0.14],
  ...Array.from({length: 4}, (_, i): Cue => [T.sa3a + 0.1 + i * 0.12, TICK, 0.1]), [T.khamsa, 'ding', 0.14], [T.ha2, 'boing', 0.14],
  // comments
  [T.ekteb, 'pop', 0.24], [T.az7am, 'pop', 0.16], [T.comments, 'boing', 0.14],
  // ending
  [T.fahman - 0.15, 'swish', 0.24], [T.fahman, 'pop', 0.2], [T.kasban, 'twinkle', 0.34],
];
const SCENE_SWISH: Cue[] = SCENES.slice(1).filter(([, s]) => !['kids', 'loop'].includes(s)).map(([tt]): Cue => [tt, 'swish', 0.1]);
const POSE_SWAP_SFX: Cue[] = POSES.slice(1).map(([t]) => [t - 0.06, 'swish', 0.07]);
const sfxFile = (n: string) => (n.includes('/') ? `elfahman/${n}.wav` : `elfahman/sfx/${n}.wav`);

// ============================================================ captions (word for word from the script)
// Hook caption rule: card 0 "العالم كان هيخلص" (big, centred) from frame 0; card 1 replaces it on "الأسبوع". Both bigger than every other card.
const caps = CAPS as unknown as {sizes: number[]; w100: number[]; base: {normal: number; big: number; gold: number}; cards: Record<string, Partial<Group>>};
const PAINT: [string, number, string][] = [
  ['هيخلص', 0, RED], ['فات', 0, YELLOW], ['دجالين', 0, RED], ['علما', 0, YELLOW], ['وستين', 0, YELLOW], ['المجلات', 0, YELLOW],
  ['نهاية', 0, RED], ['تلتاشر', 0, RED], ['نوفمبر', 0, RED], ['فاتت', 0, YELLOW], ['منين', 0, YELLOW], ['أسرع', 0, YELLOW],
  ['نهاية', 1, RED], ['الزحمة', 0, RED], ['استنى', 0, RED], ['الغريب', 0, RED], ['ميلاد', 0, YELLOW], ['ساحر', 0, YELLOW],
  ['تفتكر', 0, YELLOW], ['أقل', 0, YELLOW], ['طفلين', 0, YELLOW], ['تلاتة', 0, YELLOW], ['تمانية', 0, YELLOW], ['مليار', 0, YELLOW],
  ['بيهزر', 0, YELLOW], ['الزحمة', 1, RED], ['المترو', 0, YELLOW], ['خمسة', 0, RED], ['أزحم', 0, YELLOW],
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
  out[0].e = out[1].s; // ... and caption 2 replaces it exactly when the voice reaches "الأسبوع"
  return out;
})();

// ============================================================ composition
const SWEAT = Array.from({length: 8}, (_, i) => T.bas3 + 0.15 + i * 0.45);
export const Doomsday: React.FC = () => {
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
  const sig = t >= T.estanna - 0.02 && t < T.yom3 ? 0.3 * easeOut(seg(t, T.estanna - 0.02, T.estanna + 0.12)) * (1 - seg(t, T.yom3 - 0.3, T.yom3)) : 0;
  // mood: red warning tint on the hook (and back on the loop); the room dims for the question; a warm lift on the answer
  const warn = (1 - seg(t, T.mesh - 0.2, T.mesh + 0.2)) + seg(t, T.fahman - 0.15, END - 0.05);
  const myst = seg(t, T.teftekir - 0.2, T.teftekir + 0.3) * (1 - seg(t, MYST[1] - 0.02, MYST[1] + 0.15));
  const rev = seg(t, MYST[1], MYST[1] + 0.3) * (1 - seg(t, T.zeyada - 0.2, T.zeyada + 0.3));
  const ROOM = 0.06 + 0.22 * myst;
  const sweat = pose === 'worried' && t >= T.bas3;
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
      <AbsoluteFill style={{background: `rgba(255,170,70,${0.06 + 0.08 * rev})`}} />
      {warn > 0.01 && <AbsoluteFill style={{background: `rgba(255,40,30,${0.06 * clamp(warn) * (0.6 + 0.4 * Math.sin(t * 10 + 1.2))})`}} />}
      <AbsoluteFill style={{background: `radial-gradient(ellipse 78% 62% at 50% 36%, rgba(0,0,0,0) 52%, rgba(0,0,0,${0.3 + sig * 0.6 + myst * 0.2 - rev * 0.12}) 100%)`}} />
      <DownArrows t={t} />
      <Captions t={t} groups={GROUPS} colors={{}} y={1250} x={460} />
      <Sequence from={Math.round(VO * FPS)}><Audio src={staticFile('elfahman/doomsday/vo/vo.mp3')} volume={1} /></Sequence>
      <Audio src={staticFile('elfahman/doomsday/music/bed.wav')} volume={1} />
      <Audio src={staticFile('elfahman/doomsday/music/hits.wav')} volume={1} />
      <Sequence from={Math.round(T.estanna * FPS)} durationInFrames={Math.round(0.6 * FPS)}><Audio src={staticFile('elfahman/doomsday/music/scratch.wav')} volume={0.8} /></Sequence>
      {[...SFX, ...SCENE_SWISH, ...POSE_SWAP_SFX].map(([tt, n, v], i) => (
        <Sequence key={i} from={Math.max(0, Math.round(tt * FPS))} durationInFrames={Math.round(1.6 * FPS)}>
          <Audio src={staticFile(sfxFile(n))} volume={v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// beats on the board (for QA: the longest time the board goes without a new beat)
export const DOOMSDAY_BEATS: number[] = [
  0, 0.4, 0.7, T.osboo3, T.fat, ...SCENES.map(([s]) => s),
  T.dagaleen, T.da2, T.olama, T.alf, T.settin, T.etnein, T.tolabo, T.ba7s, T.akbar, T.elmeya, T.yom, T.gom3a, T.alfein, T.eshreen + 0.4,
  T.gom3a2, T.fatet, T.bezabt, T.gaboo, T.tareekh, T.mneen, T.adad, T.akher, T.bashar, T.alfein2, T.benzeed, T.asra3, T.awel,
  T.hesba, T.fedelna, T.adadna, T.nehaya2, T.elyom, T.bezabt2, T.tekhawef, T.a7fad, T.a7fadna, T.goo3, T.hayemoto2, T.za7ma, T.estanna,
  T.makansh, T.sodfa, T.eed, T.milad, T.nafso, T.ragel, T.abl, T.shaghal, T.sa7er, T.donya, T.makhlasetsh, T.teftekir,
  T.a2al, T.zaman, T.beit, T.sab3, T.taman, T.delwa2ty, T.teflein, T.talata, T.badal, T.nehaya3, T.hawaly, T.milyar, T.bas,
  T.olama2, T.beyhazzar, T.tareekh2, T.yo2ros, T.wedn, T.za7ma2, T.terkab, T.metro, T.sa3a, T.khamsa, T.ha2,
  T.az7am, T.hayatak, T.fahman, T.kasban,
].sort((a, b) => a - b);
