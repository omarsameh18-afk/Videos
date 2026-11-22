import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Fonts} from '../lib/fonts';
import {FPS, clamp, easeIn, easeInOut, easeOut, lerp, popIn, popOut, seg, wobble} from '../lib/anim';
import {Cam, CamKey, Layer, camAt, shakeAt} from '../lib/camera';
import {SetBack, SetFront, DESK_SCREEN_Y} from '../lib/Set';
import {CANVAS, Character, HEAD, Pose, PoseKey, blinkTimes, mouthStates, poseAt, squashAt} from '../lib/Character';
import {Captions, Group, RED, YELLOW, Word, norm} from '../lib/Captions';
import {INK, Sparkle, showScale} from '../lib/fx';
import WORDS from './writing.words.json';
import ENV from './writing.env.json';
import CAPS from './writing.captions.json';

// Episode 04: writing direction ("اتجاه الكتابة"): why Arabic runs right-to-left and English left-to-right.
// Every prop is drawn in code: no generated pictures. Template for the hook rule: the voice starts at frame 0,
// the whole first line is ONE caption card from frame 1, and the board is never empty (scenes push each other out).

// ============================================================ timing
// voice (ElevenLabs eleven_v4, voice "Fodoly", one take, tightened with tools/tighten.py) starts at frame 0
const VO = 0;
const words = WORDS as Word[];
const at = (w: string, nth = 0) => {
  const hits = words.filter((x) => norm(x.w) === norm(w));
  if (!hits[nth]) throw new Error(`word not found: ${w} #${nth}`);
  return hits[nth].s + VO;
};
const SPEECH_END = 39.4 + VO; // measured end of the last word (the file keeps 0.08 s of room tone after it)
export const WRITING_DURATION_S = Math.round((SPEECH_END + 0.5) * FPS) / FPS; // ~0.5 s of silence after the last word

const T = {
  english1: at('الإنجليزي'), shemal1: at('الشمال'), arabi1: at('والعربي'), yemeen1: at('اليمين'),
  hekaya: at('الحكاية'), badaet: at('بدأت'), talat: at('تلات'), sana: at('سنة'), mofagaa: at('والمفاجأة'),
  arabi2: at('العربي'), english2: at('والإنجليزي'), aslohom: at('أصلهم'), wahed: at('واحد'),
  kan: at('كان'), toggar: at('تجار'), lebnan: at('لبنان'), amalo: at('عملوا'), horoof2: at('حروف', 1), sahla: at('سهلة'),
  byektebooha: at('بيكتبوها'), men3: at('من', 3), lelshemal: at('للشمال'),
  elhoroof: at('الحروف'), di: at('دي'), lel3arab: at('للعرب'), wefdelna: at('وفضلنا'), zay: at('زي'), yemeen3: at('اليمين', 2),
  wweslet: at('ووصلت'), yunan: at('لليونانيين'), bas: at('بس'), dol: at('دول'), a3ado: at('قعدوا'),
  estanna: at('استنى'), da: at('ده'),
  kano: at('كانوا'), byektebo: at('بيكتبوا'), satr: at('سطر'), yemeen4: at('اليمين', 3), welsatr: at('والسطر'), shemal2: at('الشمال', 1),
  rayeh: at('رايح'), gay2: at('جاي', 1),
  wfi: at('وفي'), sabbeto: at('ثبتوا'), shemal3: at('الشمال', 2), lelyemeen: at('لليمين'),
  oroba: at('وأوروبا'), kollaha: at('كلها'), warahom: at('وراهم'), wmenha: at('ومنها'), english3: at('الإنجليزي', 1),
  ya3ni: at('يعني'), e7na: at('إحنا'), mashyeen: at('ماشيين'), elasl: at('الأصل'), wehomma: at('وهم'), ghayyaro: at('غيّروا'),
  ektebli: at('اكتبلي'), esmak: at('اسمك'), belma2loob: at('بالمقلوب'), fi: at('في'), comments: at('الكومنتات'),
  fahman: at('الفهمان'), kasban: at('كسبان'),
};
// signature moments pinned to the measured audio onsets (voice level envelope), not just the transcript
T.hekaya = 3.15 + VO; T.estanna = 22.1 + VO; T.fahman = 38.32 + VO; T.kasban = 38.92 + VO;
const END = WRITING_DURATION_S;
const HOOK_POSE = 0.1; // the first frames reuse the closing pose (loop), then he swaps to "thinking"

// ============================================================ character
const TALKABLE: Pose[] = ['hero', 'explain', 'point_up', 'thinking', 'temple', 'thumbs_up', 'worried'];
const POSES: PoseKey[] = [
  [0, 'temple'],             // first frames match the last frame (loop)
  [HOOK_POSE, 'thinking'],   // hook: "why English from the left and Arabic from the right?"
  [T.hekaya, 'hero'],
  [T.mofagaa, 'point_up'],   // idea: "...they share one origin!"
  [T.kan, 'explain'],        // both hands: the traders and their letters
  [T.elhoroof, 'hero'],
  [T.zay, 'thumbs_up'],      // "we kept writing them as they are"
  [T.wweslet, 'hero'],
  [T.bas, 'thinking'],       // "...but those kept experimenting"
  [T.estanna, 'shocked'],    // signature line: shocked stare exactly on "استنى"
  [T.kano, 'explain'],
  [T.wfi, 'hero'],
  [T.oroba, 'point_up'],     // "all of Europe followed them"
  [T.ya3ni, 'explain'],
  [T.elasl, 'thumbs_up'],    // "we are the ones on the original"
  [T.wehomma, 'hero'],
  [T.ektebli, 'explain'],    // open hands to the viewer + arrows down to the comments (the library has no pointing-down pose)
  [T.fahman, 'temple'],      // ending: hand on temple exactly on "الفهمان"
];
const MOUTH = mouthStates((ENV as {level: number[]}).level);
const BLINKS = blinkTimes(END);
const winkOn = (t: number) => t < HOOK_POSE || t >= T.kasban; // wink exactly on "كسبان" (and the looped first frames)

const CS = 0.6; // character canvas px -> world px
const CHAR_X = 540 - (CANVAS[0] * CS) / 2;
const CHAR_Y = DESK_SCREEN_Y - 1450 * CS; // pocket line sits on the desk edge
const FACE = {x: CHAR_X + HEAD[0] * CS, y: CHAR_Y + HEAD[1] * CS};

// ============================================================ camera
const CAM0: Cam = {x: 520, y: 860, z: 180};
const CAM_KEYS: CamKey[] = [
  [0, 1.0, {x: 512, y: 872, z: 120}], // pull back from frame 1 while the two halves are written
  [T.hekaya - 0.1, T.hekaya + 0.4, {x: 508, y: 846, z: 150}],
  [T.mofagaa - 0.1, T.mofagaa + 0.4, {x: 512, y: 866, z: 128}],
  [T.wahed - 0.04, T.wahed + 0.22, {x: 506, y: 830, z: 168}], // "...one origin!"
  [T.kan - 0.1, T.kan + 0.4, {x: 512, y: 866, z: 125}],
  [T.zay - 0.04, T.zay + 0.25, {x: 508, y: 846, z: 152}],
  [T.wweslet - 0.1, T.wweslet + 0.4, {x: 512, y: 866, z: 125}],
  [T.estanna - 0.04, T.estanna + 0.1, {x: 540, y: FACE.y + 20, z: 380}], // punch-in exactly on "استنى"
  [T.kano - 0.1, T.kano + 0.4, {x: 512, y: 866, z: 130}],
  [T.shemal3 - 0.04, T.shemal3 + 0.2, {x: 508, y: 842, z: 158}], // the arrows snap
  [T.oroba - 0.1, T.oroba + 0.4, {x: 512, y: 866, z: 128}],
  [T.english3 - 0.02, T.english3 + 0.2, {x: 508, y: 840, z: 160}], // "ABC" lands
  [T.ya3ni - 0.1, T.ya3ni + 0.4, {x: 512, y: 866, z: 125}],
  [T.ghayyaro - 0.04, T.ghayyaro + 0.2, {x: 506, y: 836, z: 162}],
  [T.ektebli - 0.1, T.ektebli + 0.4, {x: 512, y: 868, z: 122}],
  [T.fahman - 0.1, T.fahman + 0.5, CAM0], // ends on the opening framing -> seamless loop
];
const SHAKES: [number, number, number][] = [[T.estanna, 16, 6], [T.wahed, 4, 10], [T.shemal3, 6, 10], [T.english3, 8, 9], [T.ghayyaro, 5, 9]];

// ============================================================ drawing kit (all code)
const BOARD = '#21302b', CHALK = '#fdf6e8', BLUE = '#4aa8ff', GREEN = '#43a85a', SAND = '#e6c583', SEA = '#3f7fb5', CLAY = '#d9a66b', CLAY_D = '#b07a44';
const bump = (t: number, t0: number, a = 0.14, k = 9) => (t < t0 ? 1 : 1 + a * Math.exp(-(t - t0) * k) * Math.cos((t - t0) * 18));

// board lettering: Cairo Black with the dark outline. Arabic is shaped by the browser (direction rtl); Latin letters are plain LTR glyphs.
const Txt: React.FC<{x: number; y: number; size: number; fill?: string; rtl?: boolean; sw?: number; children: React.ReactNode}> =
({x, y, size, fill = CHALK, rtl = false, sw = 0.11, children}) => (
  <text x={x} y={y} textAnchor="middle" direction={rtl ? 'rtl' : 'ltr'} fontFamily="Cairo" fontWeight={900} fontSize={size} fill={fill}
    stroke={sw > 0 ? INK : 'none'} strokeWidth={size * sw} strokeLinejoin="round" paintOrder="stroke">{children}</text>
);
// reveal in the writing direction: dir 1 = left to right, -1 = right to left (the glyphs themselves are never mirrored)
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
// straight arrow growing from x0 towards x1 (p = 0..1); the head leads, the shaft follows
const HArrow: React.FC<{x0: number; x1: number; y: number; p: number; c: string; w?: number; hs?: number}> = ({x0, x1, y, p, c, w = 18, hs = 1}) => {
  if (p <= 0.001) return null;
  const d = Math.sign(x1 - x0), k = clamp(p * 7), hl = 46 * hs * k, hw = 32 * hs * k;
  const tip = lerp(x0 + d * hl, x1, clamp(p));
  const sh = `M ${x0} ${y} L ${tip - d * hl * 0.7} ${y}`;
  return (
    <g>
      <path d={sh} stroke={INK} strokeWidth={(w + 11) * k} strokeLinecap="round" />
      <path d={`M ${tip} ${y} L ${tip - d * hl} ${y - hw} L ${tip - d * hl} ${y + hw} Z`} fill={c} stroke={INK} strokeWidth={8 * k} strokeLinejoin="round" />
      <path d={sh} stroke={c} strokeWidth={w * k} strokeLinecap="round" />
    </g>
  );
};
// a bright dot that runs along an arrow once (dt = seconds since it fired)
const Ping: React.FC<{x0: number; x1: number; y: number; dt: number}> = ({x0, x1, y, dt}) => {
  if (dt < 0 || dt > 0.4) return null;
  const u = dt / 0.4;
  return <circle cx={lerp(x0, x1, easeOut(u))} cy={y} r={15 * (1 - u * 0.5)} fill="#fff" opacity={1 - u * u} />;
};
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
// label tag with a string hole
const Tag: React.FC<{x: number; y: number; s: number; w: number; h: number; size: number; rot?: number; children: React.ReactNode}> = ({x, y, s, w, h, size, rot = 0, children}) => s <= 0.001 ? null : (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h * 0.24} fill={YELLOW} stroke={INK} strokeWidth={8} />
    <circle cx={w / 2 - 24} cy={0} r={8} fill={BOARD} stroke={INK} strokeWidth={5} />
    <text x={-10} y={size * 0.34} textAnchor="middle" direction="rtl" fontFamily="Cairo" fontWeight={900} fontSize={size} fill={INK}>{children}</text>
  </g>
);
// dotted route along a quadratic curve: the dots appear one by one behind a bright head
type Pt = [number, number];
const Route: React.FC<{a: Pt; c: Pt; b: Pt; p: number; col: string}> = ({a, c, b, p, col}) => {
  if (p <= 0.001) return null;
  const N = 9, q = (u: number): Pt => [(1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1]];
  const head = q(clamp(p));
  return (
    <g>
      {Array.from({length: N + 1}, (_, i) => {
        const u = i / N, s = clamp((p - u) * N + 0.4);
        if (s <= 0) return null;
        const [x, y] = q(u);
        return <circle key={i} cx={x} cy={y} r={8.5 * s} fill={col} stroke={INK} strokeWidth={4} />;
      })}
      {p < 1 && <circle cx={head[0]} cy={head[1]} r={15} fill="#fff" stroke={INK} strokeWidth={5} />}
    </g>
  );
};
// small stick figure (same as episode 03); (x, y) = feet
const Stick: React.FC<{x: number; y: number; s?: number; dir?: number; confused?: boolean; scratch?: number; wig?: number}> = ({x, y, s = 1, dir = 1, confused = false, scratch = 0, wig = 0}) => {
  const a = 0.13, hy = -80, ny = -140, sy = -128, hd = -170, L = 82, A = 60, b1 = -a * 1.1 + 0.12, b2 = a * 1.1 - 0.12;
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
      {confused ? <g>
        <path d={`M -6 ${hd - 16} l 10 4 M 13 ${hd - 13} l 10 -5`} stroke={INK} strokeWidth={4} strokeLinecap="round" />
        <path d={`M 3 ${hd + 12} q 4 -5 8 0 q 4 5 8 0`} stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
      </g> : <path d={`M 5 ${hd + 11} l 11 0`} stroke={INK} strokeWidth={4} strokeLinecap="round" />}
    </g>
  );
};

// ============================================================ board (chalkboard inset above his head)
const BX = 80, BY = 84, BW = 860, BH = 480, MID = BW / 2;
type Scene = 'hook' | 'origin' | 'journey' | 'zigzag' | 'europe' | 'verdict' | 'cta' | 'loop';
// the board is never empty: each scene pushes the previous one out (PUSH seconds), and its main drawing rides in with it
const PUSH = 0.3;
const SCENES: [number, Scene][] = [
  [0, 'hook'], [T.hekaya - 0.1, 'origin'], [T.kan - 0.1, 'journey'], [T.kano - 0.1, 'zigzag'], [T.oroba - 0.1, 'europe'],
  [T.ya3ni - 0.1, 'verdict'], [T.ektebli - 0.1, 'cta'], [T.fahman - 0.15, 'loop'],
];
const Divider: React.FC = () => <path d={`M ${MID} 22 L ${MID} ${BH - 22}`} stroke={CHALK} strokeWidth={6} strokeDasharray="16 16" strokeLinecap="round" opacity={0.55} />;

// ---- 1. hook: split board. Left "ABC" written left to right over a blue arrow; right "أ ب ت" written right to left over a red arrow; "؟"
const LAT = ['A', 'B', 'C'], ARA = ['أ', 'ب', 'ت'];
const LX = [78, 193, 308], RX = [796, 678, 560], LETTER_Y = 250, ARROW_Y = 352;
const HookScene: React.FC<{t: number; frozen?: boolean}> = ({t, frozen = false}) => {
  // frozen = the closing shot (first letters only, no arrows yet): the last frame hands over to frame 1, where the writing starts
  const tt = frozen ? 0 : t;
  const wr = (i: number) => (i === 0 ? 1 : easeOut(seg(tt, 0.06 + (i - 1) * 0.42, 0.3 + (i - 1) * 0.42)));
  const grow = easeInOut(seg(tt, 0, 1.2));
  const q = popIn(tt - T.yemeen1 - 0.04, 0.26);
  return (
    <g>
      <Divider />
      <g transform={`translate(200 240) scale(${bump(tt, T.english1)}) translate(-200 -240)`}>
        {LAT.map((c, i) => <Wipe key={c} id={`hkL${i}`} x={LX[i] - 62} y={LETTER_Y - 140} w={124} h={190} p={wr(i)} dir={1}><Txt x={LX[i]} y={LETTER_Y} size={150}>{c}</Txt></Wipe>)}
        <g transform={`translate(0 ${ARROW_Y}) scale(1 ${bump(tt, T.shemal1, 0.3)}) translate(0 ${-ARROW_Y})`}><HArrow x0={44} x1={354} y={ARROW_Y} p={grow} c={BLUE} /></g>
        <Ping x0={44} x1={354} y={ARROW_Y} dt={tt - T.shemal1} />
      </g>
      <g transform={`translate(660 240) scale(${bump(tt, T.arabi1)}) translate(-660 -240)`}>
        {ARA.map((c, i) => <Wipe key={c} id={`hkR${i}`} x={RX[i] - 62} y={LETTER_Y - 140} w={124} h={220} p={wr(i)} dir={-1}><Txt x={RX[i]} y={LETTER_Y} size={122} rtl>{c}</Txt></Wipe>)}
        <g transform={`translate(0 ${ARROW_Y}) scale(1 ${bump(tt, T.yemeen1, 0.3)}) translate(0 ${-ARROW_Y})`}><HArrow x0={816} x1={506} y={ARROW_Y} p={grow} c={RED} /></g>
        <Ping x0={816} x1={506} y={ARROW_Y} dt={tt - T.yemeen1} />
      </g>
      <QMark x={MID} y={326} size={200} s={q} rot={wobble(tt - T.yemeen1 - 0.3, 2.5, 4) * 14} fill={YELLOW} />
    </g>
  );
};

// ---- 2. a clock spins backwards to the tag "من ٣٠٠٠ سنة"; then "A" and "ا" slide in and join one glowing dot: "أصل واحد"
const OriginScene: React.FC<{t: number}> = ({t}) => {
  const out = T.mofagaa - 0.12;
  const clock = t < out ? 1 : popOut(t - out, 0.16);
  const spin = easeInOut(seg(t, T.hekaya, T.sana + 0.3));
  const tag = popIn(t - T.talat, 0.28), mv = easeInOut(seg(t, out, out + 0.4));
  const LA = 280, LB = 580; // where "A" and "ا" stop
  const ax = lerp(112, LA, easeInOut(seg(t, T.english2, T.english2 + 0.45))), alx = lerp(748, LB, easeInOut(seg(t, T.arabi2, T.arabi2 + 0.45)));
  const lets = popIn(t - out - 0.04, 0.28);
  const ln = easeInOut(seg(t, T.aslohom, T.aslohom + 0.45));
  const dot = popIn(t - T.wahed, 0.26), glow = t >= T.wahed ? 0.6 + 0.4 * Math.sin((t - T.wahed) * 9) : 0;
  const DX = MID, DY = 352;
  const hand = (deg: number, len: number, w: number) => <path d={`M 0 0 L 0 ${-len}`} stroke={INK} strokeWidth={w} strokeLinecap="round" transform={`rotate(${deg})`} />;
  return (
    <g>
      {clock > 0.001 && <g transform={`translate(214 246) scale(${clock})`}>
        {/* rewind arc: runs anticlockwise round the clock */}
        <g transform={`rotate(${-spin * 300})`}>
          <path d="M 152 -58 A 163 163 0 1 0 152 58" fill="none" stroke={INK} strokeWidth={22} strokeLinecap="round" />
          <path d="M 152 -58 A 163 163 0 1 0 152 58" fill="none" stroke={YELLOW} strokeWidth={11} strokeLinecap="round" />
          <path d="M 124 44 L 176 30 L 168 88 Z" fill={YELLOW} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        </g>
        <circle r={118} fill="#fffbe6" stroke={INK} strokeWidth={10} />
        {Array.from({length: 12}, (_, i) => <path key={i} d="M 0 -100 L 0 -84" stroke={INK} strokeWidth={i % 3 ? 5 : 9} strokeLinecap="round" transform={`rotate(${i * 30})`} />)}
        {hand(-60 - spin * 360 * 1.5, 56, 13)}{hand(40 - spin * 360 * 9, 84, 9)}
        <circle r={9} fill={RED} stroke={INK} strokeWidth={4} />
      </g>}
      <Tag x={lerp(632, MID, mv)} y={lerp(246, 66, mv)} s={tag * lerp(1, 0.62, mv)} w={424} h={122} size={62} rot={lerp(-4, 0, mv) + wobble(t - T.talat - 0.28, 2.5, 4) * 8}>من ٣٠٠٠ سنة</Tag>
      {/* the two family lines meet in one dot */}
      {ln > 0 && [[LA, BLUE], [LB, RED]].map(([x, c]) => {
        const x1 = lerp(x as number, DX, ln), y1 = lerp(282, DY, ln), d = `M ${x} 282 L ${x1} ${y1}`;
        return <g key={x}><path d={d} stroke={INK} strokeWidth={19} strokeLinecap="round" /><path d={d} stroke={c as string} strokeWidth={9} strokeLinecap="round" /></g>;
      })}
      {lets > 0.001 && <g transform={`translate(${alx} 210) scale(${lets})`}><Txt x={0} y={52} size={170} rtl>ا</Txt></g>}
      {lets > 0.001 && <g transform={`translate(${ax} 210) scale(${lets})`}><Txt x={0} y={52} size={170}>A</Txt></g>}
      {dot > 0.001 && <g transform={`translate(${DX} ${DY}) scale(${dot})`}>
        {[58, 44, 32].map((r, i) => <circle key={r} r={r + glow * 6} fill={YELLOW} opacity={[0.14, 0.22, 0.34][i] * (0.6 + glow * 0.4)} />)}
        <circle r={22} fill={YELLOW} stroke={INK} strokeWidth={7} />
      </g>}
      <g transform={`translate(${DX} 446) scale(${popIn(t - T.wahed - 0.06, 0.26)})`}><Txt x={0} y={0} size={58} fill={YELLOW} rtl>أصل واحد</Txt></g>
      <Sparkle x={DX + 150} y={DY - 30} dt={t - T.wahed - 0.05} r={32} />
      <Sparkle x={DX - 160} y={DY + 20} dt={t - T.wahed - 0.18} r={26} />
    </g>
  );
};

// ---- 3 + 4 + 5 (+ 6). the coast with a pin on Lebanon and a trading boat; a tablet whose letters appear right to left;
// then the tablet moves up and two dotted routes leave it: one to "عربي" (kept as is), one to a Greek temple (they experiment)
const GLYPHS = [
  'M 15 -21 L -15 0 L 15 21 M -3 -24 L -3 24', 'M 12 24 L 12 -22 L -13 -22 L -13 -1 L 12 -1', 'M -15 23 L 4 -23 L 16 0',
  'M 0 -23 L 17 17 L -17 17 Z', 'M 11 -23 L 11 23 M 11 -20 L -14 -20 M 11 -3 L -11 -3 M 11 14 L -14 14', 'M -15 -23 L 0 -2 L 15 -23 M 0 -2 L 0 24',
];
const GT = [T.horoof2, T.sahla, T.byektebooha, T.byektebooha + 0.22, T.byektebooha + 0.44, T.byektebooha + 0.66];
const Tablet: React.FC<{t: number}> = ({t}) => (
  <g>
    <path d="M -178 -138 L 170 -144 Q 196 -142 194 -116 L 190 118 Q 190 144 164 142 L -170 146 Q -196 146 -194 120 L -192 -112 Q -192 -138 -178 -138 Z" fill={CLAY} stroke={INK} strokeWidth={10} strokeLinejoin="round" />
    <path d="M -166 122 L 164 118 M 172 -100 L 170 96" stroke={CLAY_D} strokeWidth={9} strokeLinecap="round" opacity={0.7} />
    <path d="M -160 -112 l 30 -6 M -164 -84 l 12 -3" stroke="#f1c995" strokeWidth={8} strokeLinecap="round" />
    {GLYPHS.map((d, i) => {
      const s = popIn(t - GT[i], 0.2);
      return s <= 0.001 ? null : <g key={i} transform={`translate(${142 - i * 57} -34) scale(${s * 1.12})`}><path d={d} fill="none" stroke="#4a2c17" strokeWidth={9.5} strokeLinecap="round" strokeLinejoin="round" /></g>;
    })}
    <g transform={`translate(0 74) scale(1 ${bump(t, T.lelshemal, 0.3)}) translate(0 -74)`}>
      <HArrow x0={156} x1={-156} y={74} p={easeInOut(seg(t, T.men3, T.lelshemal + 0.1))} c={RED} w={16} hs={0.86} />
    </g>
    <Ping x0={156} x1={-156} y={74} dt={t - T.lelshemal - 0.1} />
  </g>
);
const Boat: React.FC = () => (
  <g>
    <path d="M 0 -4 L 0 -84" stroke={INK} strokeWidth={7} strokeLinecap="round" />
    <path d="M -38 -78 L 38 -78 L 31 -22 L -31 -22 Z" fill={CHALK} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M -34 -59 L 35 -59 M -32 -41 L 33 -41" stroke={RED} strokeWidth={8} />
    <rect x={-30} y={-18} width={20} height={16} rx={3} fill="#f5c04a" stroke={INK} strokeWidth={4.5} /><rect x={8} y={-20} width={22} height={18} rx={3} fill="#c98a1e" stroke={INK} strokeWidth={4.5} />
    <path d="M -66 -22 Q -62 -2 -52 -2 L 50 -2 Q 62 -4 70 -30 L 56 -8 Q 0 30 -50 12 Q -60 6 -66 -22 Z" fill="#a8642f" stroke={INK} strokeWidth={6.5} strokeLinejoin="round" />
  </g>
);
const COAST = 'M 262 -10 Q 240 40 252 96 Q 262 140 236 190 Q 220 226 236 268 Q 248 306 222 350 Q 206 392 214 450';
const MapPanel: React.FC<{t: number}> = ({t}) => {
  const boat = popIn(t - T.toggar, 0.3), bx = lerp(168, 96, seg(t, T.toggar, T.elhoroof));
  const drop = easeIn(seg(t, T.lebnan - 0.14, T.lebnan)), hit = wobble(t - T.lebnan, 5, 8);
  const ring = clamp((t - T.lebnan) / 0.5);
  return (
    <g>
      <defs><clipPath id="mapclip"><rect x={0} y={0} width={380} height={432} rx={18} /></clipPath></defs>
      <g clipPath="url(#mapclip)">
        <rect x={0} y={0} width={380} height={432} fill={SEA} />
        {[[60, 70], [150, 250], [40, 300], [120, 400], [168, 60]].map(([x, y], i) => (
          <path key={i} d={`M ${x + Math.sin(t * 1.6 + i) * 7} ${y} q 11 -9 22 0 q 11 9 22 0`} stroke="#fff" strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.45} />
        ))}
        <path d={`${COAST} L 400 450 L 400 -10 Z`} fill={SAND} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <path d="M 320 20 l 16 -22 l 16 22 M 336 110 l 14 -20 l 14 20 M 300 392 l 15 -21 l 15 21" stroke={CLAY_D} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.75} />
        <path d="M 66 152 Q 84 132 118 138 Q 150 128 160 140 Q 138 150 126 162 Q 96 172 66 152 Z" fill={SAND} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
        <g transform={`translate(${bx} ${336 + Math.sin(t * 3.1) * 5}) rotate(${Math.sin(t * 2.3) * 4}) scale(${boat * 0.92})`}><Boat /></g>
        {boat > 0.5 && <path d={`M ${bx + 68} 340 q 12 -8 24 0 q 12 8 24 0`} stroke="#fff" strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.7} />}
      </g>
      <rect x={0} y={0} width={380} height={432} rx={18} fill="none" stroke={INK} strokeWidth={9} />
      {t >= T.lebnan && ring < 1 && <ellipse cx={238} cy={228} rx={16 + ring * 46} ry={(16 + ring * 46) * 0.42} fill="none" stroke={RED} strokeWidth={6} opacity={1 - ring} />}
      {t >= T.lebnan - 0.14 && <g transform={`translate(238 ${228 - (1 - drop) * 190}) scale(${1 + hit * 0.14} ${1 - hit * 0.14})`}>
        <path d="M 0 0 C -9 -26 -34 -40 -34 -68 A 34 34 0 1 1 34 -68 C 34 -40 9 -26 0 0 Z" fill={RED} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <circle cx={0} cy={-68} r={13} fill="#fff" stroke={INK} strokeWidth={5} />
      </g>}
      <g transform={`translate(312 318) scale(${popIn(t - T.lebnan - 0.06, 0.26)})`}><Txt x={0} y={0} size={50} rtl>لبنان</Txt></g>
    </g>
  );
};
const Temple: React.FC = () => (
  <g>
    <path d="M -96 -44 L 0 -100 L 96 -44 Z" fill="#f4efe2" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    <rect x={-92} y={-44} width={184} height={20} fill="#e4dcc8" stroke={INK} strokeWidth={7} />
    {[-70, -24, 22, 68].map((x) => <rect key={x} x={x - 13} y={-24} width={26} height={84} fill="#f4efe2" stroke={INK} strokeWidth={6} />)}
    <rect x={-100} y={60} width={200} height={16} fill="#e4dcc8" stroke={INK} strokeWidth={7} /><rect x={-112} y={76} width={224} height={16} fill="#f4efe2" stroke={INK} strokeWidth={7} />
  </g>
);
const TAB0: Pt = [634, 236], TAB1: Pt = [MID, 110], TABS = 0.6;
const JourneyScene: React.FC<{t: number}> = ({t}) => {
  const mv = easeInOut(seg(t, T.elhoroof - 0.1, T.elhoroof + 0.32));
  // the coast starts in the middle of the board, moves left when the tablet arrives, and leaves when the letters travel
  const mapX = lerp(240, 24, easeInOut(seg(t, T.amalo - 0.2, T.amalo + 0.15))) - 520 * easeIn(seg(t, T.elhoroof - 0.1, T.elhoroof + 0.22));
  const tab = popIn(t - T.amalo, 0.3);
  // route 1: to the Arabs, who keep the direction
  const r1 = easeInOut(seg(t, T.elhoroof + 0.2, T.lel3arab)), sheet = popIn(t - T.di, 0.3), word = easeInOut(seg(t, T.wefdelna, T.zay - 0.08));
  // route 2: to the Greeks, who start experimenting
  const r2 = easeInOut(seg(t, T.wweslet + 0.05, T.yunan + 0.1)), temple = popIn(t - T.yunan - 0.08, 0.3), man = popIn(t - T.bas, 0.28);
  const flick = t >= T.a3ado ? Math.floor((t - T.a3ado) / 0.17) % 2 : -1;
  return (
    <g>
      {mapX > -420 && <g transform={`translate(${mapX} 24)`}><MapPanel t={t} /></g>}
      <Route a={[552, 110]} c={[668, 108]} b={[668, 204]} p={r1} col={RED} />
      <Route a={[308, 110]} c={[176, 108]} b={[176, 236]} p={r2} col={BLUE} />
      {tab > 0.001 && <g transform={`translate(${lerp(TAB0[0], TAB1[0], mv)} ${lerp(TAB0[1], TAB1[1], mv)}) scale(${tab * lerp(1, TABS, mv)})`}><Tablet t={t} /></g>}
      {/* a sheet where "عربي" is written right to left over the same red arrow, then a green check */}
      {sheet > 0.001 && <g transform={`translate(664 334) scale(${sheet * bump(t, T.zay, 0.1)}) translate(-664 -334)`}>
        <rect x={508} y={222} width={312} height={232} rx={16} fill="#fbf1d8" stroke={INK} strokeWidth={9} transform="rotate(1.5 664 334)" />
        <Wipe id="arword" x={520} y={236} w={288} h={150} p={word} dir={-1}><Txt x={664} y={338} size={112} fill="#3a2416" sw={0} rtl>عربي</Txt></Wipe>
        <g transform={`translate(0 408) scale(1 ${bump(t, T.yemeen3, 0.3)}) translate(0 -408)`}><HArrow x0={786} x1={546} y={408} p={word} c={RED} w={14} hs={0.76} /></g>
        <Ping x0={786} x1={546} y={408} dt={t - T.yemeen3} />
      </g>}
      <Check x={818} y={230} s={popIn(t - T.zay, 0.24) * 1.05} />
      <Sparkle x={500} y={250} dt={t - T.zay - 0.08} r={30} />
      {/* Greek temple + a man who cannot decide: ← and → flicker over his head */}
      {temple > 0.001 && <g transform={`translate(160 450) scale(${temple * 0.98}) translate(0 -92)`}><Temple /></g>}
      <Stick x={366} y={452} s={0.92 * man} confused={t >= T.dol} scratch={easeOut(seg(t, T.dol, T.dol + 0.2))} wig={Math.sin(t * 16)} />
      {flick >= 0 && <g opacity={0.96}>
        {flick === 0 ? <HArrow x0={426} x1={310} y={238} p={1} c={RED} w={13} hs={0.6} /> : <HArrow x0={310} x1={426} y={238} p={1} c={BLUE} w={13} hs={0.6} />}
      </g>}
    </g>
  );
};

// ---- 7 + 8a. three lines written as a snake (← → ←) with a pencil running along; then every arrow snaps to →
const ROWS = [136, 256, 376], DX0 = 160, DSTEP = 70, DLEN = 50, DN = 8, XL = DX0, XR = DX0 + (DN - 1) * DSTEP + DLEN;
const CONN = ['M 142 136 C 62 136 62 256 142 256', 'M 718 256 C 798 256 798 376 718 376'];
const cub = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, u: number): Pt => {
  const v = 1 - u;
  return [v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0], v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1]];
};
const Pencil: React.FC = () => (
  <g transform="rotate(60) scale(0.78)">
    <rect x={-10} y={-104} width={20} height={14} rx={4} fill="#f4a6b8" stroke={INK} strokeWidth={5} />
    <rect x={-10} y={-92} width={20} height={10} fill="#cfd6dd" stroke={INK} strokeWidth={5} />
    <rect x={-10} y={-82} width={20} height={58} fill={YELLOW} stroke={INK} strokeWidth={5} />
    <path d="M -10 -24 L 10 -24 L 0 0 Z" fill="#f2c891" stroke={INK} strokeWidth={5} strokeLinejoin="round" /><path d="M -4 -9 L 4 -9 L 0 0 Z" fill={INK} />
  </g>
);
const ZigzagScene: React.FC<{t: number}> = ({t}) => {
  const F0 = T.satr, F1 = T.yemeen4 + 0.45, G0 = T.welsatr, G1 = T.shemal2 + 0.45, H0 = T.rayeh, H1 = T.gay2 + 0.28;
  const f = [seg(t, F0, F1), seg(t, G0, G1), seg(t, H0, H1)];
  const c = [seg(t, F1, G0), seg(t, G1, H0)];
  const dirs = [-1, 1, -1];
  const snapped = t >= T.shemal3;
  const gone = t >= T.sabbeto ? popOut(t - T.sabbeto, 0.18) : 1; // the snake turns and the pencil leave when they settle
  // pencil position along the snake
  let pen: Pt = [XR + 16, ROWS[0]];
  if (t >= H0) pen = [XR - (XR - XL) * f[2], ROWS[2]];
  else if (t >= G1) pen = cub([718, 256], [798, 256], [798, 376], [718, 376], c[1]);
  else if (t >= G0) pen = [XL + (XR - XL) * f[1], ROWS[1]];
  else if (t >= F1) pen = cub([142, 136], [62, 136], [62, 256], [142, 256], c[0]);
  else pen = [XR - (XR - XL) * f[0], ROWS[0]];
  const penS = showScale(t, T.byektebo, T.sabbeto, 0.26, 0.18);
  return (
    <g>
      {ROWS.map((y, r) => {
        const shake = t >= T.sabbeto && !snapped ? Math.sin(t * 60 + r) * 3 : 0;
        const turn = easeOut(seg(t, T.shemal3 + r * 0.03, T.shemal3 + 0.16 + r * 0.03)) + wobble(t - T.shemal3 - 0.16 - r * 0.03, 4, 9) * 0.12;
        const flip = dirs[r] < 0 ? 180 * turn : 0;
        const blue = dirs[r] > 0 || (snapped && turn > 0.5);
        const arrow = popIn(t - [F0, G0, H0][r], 0.24) * bump(t, T.gay2 + 0.1, 0.16) * bump(t, T.shemal3, 0.2);
        const AY = y - 62;
        return (
          <g key={r} transform={`translate(${shake} 0)`}>
            {Array.from({length: DN}, (_, j) => {
              const x = DX0 + j * DSTEP, a = clamp(f[r] * DN - (dirs[r] > 0 ? j : DN - 1 - j));
              const d = a <= 0 ? '' : dirs[r] > 0 ? `M ${x} ${y} L ${x + DLEN * a} ${y}` : `M ${x + DLEN} ${y} L ${x + DLEN - DLEN * a} ${y}`;
              return (
                <g key={j}>
                  <path d={`M ${x} ${y} L ${x + DLEN} ${y}`} stroke={CHALK} strokeWidth={10} strokeLinecap="round" opacity={0.16} />
                  {a > 0 && <g><path d={d} stroke={INK} strokeWidth={24} strokeLinecap="round" /><path d={d} stroke={CHALK} strokeWidth={14} strokeLinecap="round" /></g>}
                </g>
              );
            })}
            {arrow > 0.001 && <g transform={`translate(${MID} ${AY}) rotate(${flip}) scale(${arrow}) translate(${-MID} ${-AY})`}>
              {dirs[r] > 0 ? <HArrow x0={MID - 78} x1={MID + 78} y={AY} p={1} c={BLUE} w={14} hs={0.62} /> : <HArrow x0={MID + 78} x1={MID - 78} y={AY} p={1} c={blue ? BLUE : RED} w={14} hs={0.62} />}
            </g>}
            <Ping x0={MID - 78} x1={MID + 78} y={AY} dt={t - T.lelyemeen - r * 0.07} />
          </g>
        );
      })}
      {CONN.map((d, i) => c[i] > 0 && gone > 0.001 && (
        <path key={i} d={d} fill="none" stroke={CHALK} strokeWidth={7} strokeLinecap="round" pathLength={1} strokeDasharray={`${c[i]} 1`} opacity={0.8 * clamp(gone)} />
      ))}
      {penS > 0.001 && <g transform={`translate(${pen[0]} ${pen[1] - 4 - Math.abs(Math.sin(t * 26)) * 3}) scale(${penS})`}><Pencil /></g>}
    </g>
  );
};

// ---- 8b. a simple map of Europe lights up from Greece outwards; "ABC" lands on it with the blue arrow
const EU_MAIN = 'M 40 330 L 30 290 L 50 265 L 105 262 L 120 250 L 112 215 L 95 200 L 125 190 L 150 175 L 175 160 L 195 140 L 205 115 L 200 95 L 215 85 L 225 105 L 222 130 L 250 135 L 290 128 L 320 110 L 335 85 L 350 60 L 385 45 L 410 55 L 410 290 L 372 296 L 356 284 L 346 300 L 336 324 L 312 318 L 302 336 L 306 364 L 291 386 L 276 366 L 268 336 L 255 310 L 230 280 L 215 262 L 200 268 L 215 290 L 240 320 L 262 345 L 251 353 L 246 373 L 232 366 L 228 340 L 205 312 L 185 290 L 170 282 L 150 290 L 130 300 L 122 315 L 108 345 L 85 362 L 55 368 L 40 355 Z';
const EU_SCAN = 'M 215 70 L 205 45 L 225 18 L 265 -2 L 300 -4 L 330 8 L 346 34 L 341 55 L 319 60 L 311 40 L 296 30 L 281 55 L 273 85 L 256 100 L 243 95 L 241 70 L 229 75 Z';
const EU_GB = 'M 135 170 L 118 165 L 125 150 L 112 140 L 122 120 L 115 100 L 128 85 L 142 95 L 140 115 L 152 135 L 160 155 L 150 168 Z';
const EU_IE = 'M 95 135 L 82 145 L 78 128 L 90 115 L 102 122 Z';
const EU = [EU_MAIN, EU_SCAN, EU_GB, EU_IE];
const EuropeScene: React.FC<{t: number}> = ({t}) => {
  const lit = easeInOut(seg(t, T.oroba, T.warahom + 0.25));
  const land = (fill: string) => EU.map((d, i) => <path key={i} d={d} fill={fill} stroke={INK} strokeWidth={7} strokeLinejoin="round" />);
  const fall = easeIn(seg(t, T.english3 - 0.2, T.english3)), hit = wobble(t - T.english3, 5, 8);
  const arr = easeInOut(seg(t, T.english3 + 0.08, T.english3 + 0.5));
  return (
    <g>
      <g transform="translate(212 38) scale(1.04)">
        <defs><clipPath id="euLit"><circle cx={296} cy={352} r={lit * 470} /></clipPath></defs>
        {land('#48655a')}
        <g clipPath="url(#euLit)">{land(YELLOW)}</g>
        {lit > 0 && lit < 1 && <circle cx={296} cy={352} r={lit * 470} fill="none" stroke="#fff" strokeWidth={7} opacity={0.75 * (1 - lit)} />}
        {/* where it started: Greece */}
        <g transform={`translate(296 352) scale(${0.3 * bump(t, T.oroba, 0.4)})`}><Temple /></g>
      </g>
      {t >= T.english3 - 0.2 && <g transform={`translate(${MID} ${lerp(-150, 232, fall)}) scale(${1 + hit * 0.12} ${1 - hit * 0.12})`}>
        <Txt x={0} y={0} size={150} sw={0.14}>ABC</Txt>
      </g>}
      <HArrow x0={MID - 170} x1={MID + 170} y={308} p={arr} c={BLUE} w={18} />
      <Sparkle x={690} y={120} dt={t - T.english3 - 0.1} r={34} />
      <Sparkle x={170} y={300} dt={t - T.english3 - 0.24} r={26} />
    </g>
  );
};

// ---- 9. verdict: right "عربي" with the straight red arrow and the tag "الأصل"; left "English" with an arrow that makes a U-turn
const UX1 = 338, UX0 = 128, UY = 300, UR = 46, UL = UX1 - UX0, UARC = Math.PI * UR, UTOT = UL * 2 + UARC;
const uPos = (u: number): {p: Pt; d: Pt} => {
  const s = clamp(u) * UTOT;
  if (s < UL) return {p: [UX1 - s, UY], d: [-1, 0]};
  if (s < UL + UARC) { const a = (s - UL) / UR; return {p: [UX0 - UR * Math.sin(a), UY + UR - UR * Math.cos(a)], d: [-Math.cos(a), Math.sin(a)]}; }
  return {p: [UX0 + (s - UL - UARC), UY + 2 * UR], d: [1, 0]};
};
const uPath = (u0: number, u1: number) => {
  if (u1 <= u0) return '';
  const n = Math.max(2, Math.ceil((u1 - u0) * 90));
  return Array.from({length: n + 1}, (_, i) => { const {p} = uPos(lerp(u0, u1, i / n)); return `${i ? 'L' : 'M'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`; }).join(' ');
};
const UMID = (UL + UARC / 2) / UTOT;
const VerdictScene: React.FC<{t: number}> = ({t}) => {
  const straight = easeInOut(seg(t, T.mashyeen, T.elasl - 0.05));
  const u = easeInOut(seg(t, T.wehomma + 0.12, T.ghayyaro + 0.42)) * 0.94;
  const {p, d} = uPos(u), k = clamp(u * 12), col = u > UMID ? BLUE : RED, hl = 44 * k, hw = 30 * k;
  const tip: Pt = [p[0] + d[0] * hl, p[1] + d[1] * hl];
  return (
    <g>
      <Divider />
      {/* right: Arabic stays on the original direction */}
      <g transform={`translate(645 190) scale(${bump(t, T.e7na, 0.1)}) translate(-645 -190)`}><Txt x={645} y={196} size={128} rtl>عربي</Txt></g>
      <g transform={`translate(0 272) scale(1 ${bump(t, T.elasl, 0.3)}) translate(0 -272)`}><HArrow x0={782} x1={508} y={272} p={straight} c={RED} /></g>
      <Tag x={645} y={386} s={popIn(t - T.elasl, 0.28)} w={250} h={104} size={64} rot={-3 + wobble(t - T.elasl - 0.28, 2.5, 4) * 8}>الأصل</Tag>
      <Sparkle x={800} y={330} dt={t - T.elasl - 0.06} r={30} />
      {/* left: English, whose arrow starts the same way and then turns round */}
      <g transform={`translate(215 170) scale(${bump(t, T.wehomma, 0.12)}) translate(-215 -170)`}><Txt x={215} y={196} size={92}>English</Txt></g>
      {u > 0.001 && <g>
        <path d={uPath(0, u)} fill="none" stroke={INK} strokeWidth={29} strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M ${tip[0]} ${tip[1]} L ${p[0] - d[1] * hw} ${p[1] + d[0] * hw} L ${p[0] + d[1] * hw} ${p[1] - d[0] * hw} Z`} fill={col} stroke={INK} strokeWidth={8 * k} strokeLinejoin="round" />
        <path d={uPath(0, Math.min(u, UMID))} fill="none" stroke={RED} strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" />
        <path d={uPath(UMID, u)} fill="none" stroke={BLUE} strokeWidth={18} strokeLinecap="butt" strokeLinejoin="round" />
      </g>}
    </g>
  );
};

// ---- 10. write your name backwards: a bouncing comment bubble + a name card that flips "عمر" -> "رمع"
const CtaScene: React.FC<{t: number}> = ({t}) => {
  const bounce = Math.abs(Math.sin((t - T.ektebli) * 6.2)) * 16;
  const typed = clamp((t - T.comments) / 0.45);
  const card = popIn(t - T.esmak, 0.28);
  const fl = seg(t, T.belma2loob, T.belma2loob + 0.3), sx = Math.cos(fl * Math.PI), back = fl > 0.5;
  const land = t >= T.belma2loob + 0.3 ? wobble(t - T.belma2loob - 0.3, 4, 8) : 0;
  return (
    <g>
      <g transform={`translate(214 ${236 - bounce}) scale(0.86)`}>
        <path d="M -150 -110 L 150 -110 Q 180 -110 180 -80 L 180 60 Q 180 90 150 90 L 10 90 L -50 150 L -40 90 L -150 90 Q -180 90 -180 60 L -180 -80 Q -180 -110 -150 -110 Z" fill="#fff" stroke={INK} strokeWidth={11} strokeLinejoin="round" />
        {typed <= 0 ? [-60, 0, 60].map((x, i) => (
          <circle key={i} cx={x} cy={-10 - 14 * Math.max(0, Math.sin((t - T.ektebli) * 9 - i * 0.9))} r={17} fill="#8a949c" />
        )) : [[-50, 250], [0, 300], [50, 180]].map(([y, w], i) => (
          <rect key={i} x={140 - w * clamp(typed * 3 - i)} y={y - 22} width={w * clamp(typed * 3 - i)} height={24} rx={12} fill={i === 0 ? RED : '#8a949c'} />
        ))}
      </g>
      {card > 0.001 && <g transform={`translate(630 ${232 - land * 10}) scale(${card * Math.max(0.04, Math.abs(sx)) * (1 + land * 0.06)} ${card})`}>
        <rect x={-180} y={-126} width={360} height={252} rx={30} fill={back ? '#fff3c4' : '#fff'} stroke={INK} strokeWidth={11} />
        <text x={0} y={50} textAnchor="middle" direction="rtl" fontFamily="Cairo" fontWeight={900} fontSize={150} fill={back ? RED : INK}>{back ? 'رمع' : 'عمر'}</text>
      </g>}
      {/* the two little arrows that say "turn it round" */}
      {card > 0.001 && <g transform={`translate(630 414) scale(${card * bump(t, T.belma2loob, 0.3)}) translate(-630 -414)`}>
        <HArrow x0={520} x1={612} y={414} p={1} c={YELLOW} w={12} hs={0.56} /><HArrow x0={740} x1={648} y={414} p={1} c={YELLOW} w={12} hs={0.56} />
      </g>}
      <Sparkle x={808} y={88} dt={t - T.belma2loob - 0.3} r={32} />
      <Sparkle x={454} y={350} dt={t - T.belma2loob - 0.42} r={24} />
    </g>
  );
};

const Board: React.FC<{t: number; dim: number}> = ({t, dim}) => {
  let i = 0;
  for (let k = 0; k < SCENES.length; k++) if (t >= SCENES[k][0]) i = k;
  const [start, scene] = SCENES[i];
  const e = i === 0 ? 1 : easeInOut(seg(t, start, start + PUSH));
  const prev = i > 0 && e < 1 ? SCENES[i - 1][1] : null;
  const draw = (s: Scene) => (
    <g>
      {s === 'hook' && <HookScene t={t} />}
      {s === 'origin' && <OriginScene t={t} />}
      {s === 'journey' && <JourneyScene t={t} />}
      {s === 'zigzag' && <ZigzagScene t={t} />}
      {s === 'europe' && <EuropeScene t={t} />}
      {s === 'verdict' && <VerdictScene t={t} />}
      {s === 'cta' && <CtaScene t={t} />}
      {s === 'loop' && <HookScene t={t} frozen />}
    </g>
  );
  return (
    <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <g transform={`translate(${BX} ${BY})`}>
        <rect x={-16} y={-16} width={BW + 32} height={BH + 32} rx={26} fill="#8a5a33" stroke={INK} strokeWidth={10} />
        <rect x={0} y={0} width={BW} height={BH} rx={14} fill={BOARD} stroke={INK} strokeWidth={6} />
        <rect x={10} y={10} width={BW - 20} height={BH - 20} rx={10} fill="none" stroke="#ffffff" strokeOpacity={0.05} strokeWidth={8} />
        <defs><clipPath id="boardclip"><rect x={3} y={3} width={BW - 6} height={BH - 6} rx={12} /></clipPath></defs>
        <g clipPath="url(#boardclip)">
          {prev && <g transform={`translate(${-BW * e} 0)`}>{draw(prev)}</g>}
          <g transform={`translate(${BW * (1 - e)} 0)`}>{draw(scene)}</g>
          {/* the previous drawing stays on the board during the signature line, a little darker while he stares */}
          {dim > 0 && <rect x={0} y={0} width={BW} height={BH} fill="#0b1210" opacity={dim * 0.8} />}
        </g>
      </g>
    </svg>
  );
};

// arrows down to the comments, on screen below the caption (he has no pointing-down pose, so the arrows do the pointing)
const DownArrows: React.FC<{t: number}> = ({t}) => {
  const s = showScale(t, T.fi, T.fahman - 0.12, 0.24, 0.14);
  if (s <= 0.001) return null;
  const b = Math.abs(Math.sin((t - T.fi) * 7)) * 22;
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
type Cue = [number, string, number];
const TICKS = (t0: number, t1: number, every: number, n: string, v: number): Cue[] => Array.from({length: Math.max(0, Math.floor((t1 - t0) / every))}, (_, i): Cue => [t0 + i * every, n, v]);
const SFX: Cue[] = [
  // hook (kept soft: the question starts on frame 0)
  [0, 'whoosh', 0.2], [0.06, 'click', 0.26], [0.48, 'click', 0.26], [T.shemal1, 'swish', 0.2], [T.yemeen1, 'swish', 0.2], [T.yemeen1 + 0.04, 'boing', 0.3],
  // clock + one origin
  [T.hekaya - 0.1, 'swish', 0.28], ...TICKS(T.hekaya + 0.1, T.sana, 0.16, 'click', 0.2), [T.talat, 'pop', 0.32], [T.sana, 'ding', 0.22],
  [T.mofagaa - 0.12, 'swish', 0.24], [T.arabi2, 'whoosh', 0.2], [T.english2, 'whoosh', 0.2], [T.aslohom, 'swish', 0.2], [T.wahed, 'ding', 0.34], [T.wahed + 0.02, 'sparkle', 0.3],
  // coast, boat, tablet
  [T.kan - 0.1, 'swish', 0.28], [T.toggar, 'pop', 0.26], [T.toggar + 0.1, 'bubbles', 0.14], [T.lebnan, 'thud', 0.36], [T.amalo - 0.2, 'swish', 0.2], [T.amalo, 'pop', 0.3],
  ...GT.map((g): Cue => [g, 'click', 0.36]), [T.men3, 'whoosh', 0.22], [T.lelshemal + 0.1, 'ding', 0.26],
  // to the Arabs
  [T.elhoroof - 0.1, 'swish', 0.28], [T.elhoroof + 0.2, 'whoosh', 0.2], [T.di, 'pop', 0.26], [T.lel3arab, 'ding', 0.22], [T.wefdelna, 'swish', 0.2], [T.zay, 'ding', 0.34], [T.zay + 0.02, 'sparkle', 0.28], [T.yemeen3, 'swish', 0.22],
  // to the Greeks
  [T.wweslet + 0.05, 'whoosh', 0.2], [T.yunan + 0.08, 'pop', 0.3], [T.bas, 'pop', 0.26], [T.dol, 'boing', 0.26], ...TICKS(T.a3ado, T.estanna - 0.1, 0.17, 'click', 0.24),
  [T.estanna - 0.02, 'stinger', 0.55],
  // the snake lines
  [T.kano - 0.1, 'swish', 0.3], [T.byektebo, 'pop', 0.24], ...TICKS(T.satr, T.yemeen4 + 0.45, 0.11, 'step', 0.2), [T.yemeen4 + 0.45, 'swish', 0.2],
  ...TICKS(T.welsatr, T.shemal2 + 0.45, 0.11, 'step', 0.2), [T.shemal2 + 0.45, 'swish', 0.2], ...TICKS(T.rayeh, T.gay2 + 0.28, 0.11, 'step', 0.2), [T.gay2 + 0.1, 'boing', 0.26],
  // the arrows snap, Europe lights up, ABC lands
  [T.sabbeto, 'tremble', 0.2], [T.shemal3, 'click', 0.5], [T.shemal3 + 0.02, 'thud', 0.4], [T.lelyemeen, 'whoosh', 0.24],
  [T.oroba - 0.1, 'swish', 0.3], [T.oroba + 0.05, 'sparkle', 0.26], [T.warahom, 'ding', 0.22], [T.english3 - 0.2, 'whoosh', 0.22], [T.english3, 'thud', 0.5], [T.english3 + 0.1, 'swish', 0.22],
  // verdict
  [T.ya3ni - 0.1, 'swish', 0.3], [T.mashyeen, 'whoosh', 0.2], [T.elasl, 'ding', 0.32], [T.elasl + 0.02, 'sparkle', 0.26], [T.wehomma, 'pop', 0.26], [T.wehomma + 0.12, 'whoosh', 0.2], [T.ghayyaro, 'boing', 0.32],
  // comments
  [T.ektebli - 0.1, 'swish', 0.28], [T.esmak, 'pop', 0.3], [T.belma2loob, 'whoosh', 0.26], [T.belma2loob + 0.3, 'click', 0.45], [T.fi, 'pop', 0.26], [T.comments, 'click', 0.4],
  // ending
  [T.fahman - 0.15, 'swish', 0.3], [T.fahman, 'pop', 0.25], [T.kasban, 'twinkle', 0.4],
];
const POSE_SWAP_SFX: Cue[] = POSES.slice(2).map(([t]) => [t - 0.06, 'swish', 0.1]);

// ============================================================ captions (word for word from the script, tashkeel kept)
const COLORS: Record<string, string> = {};
const paint = (ws: string[], c: string) => { for (const w of ws) COLORS[norm(w)] = c; };
paint(['الشمال', 'للشمال', 'تلات', 'آلاف', 'سنة', 'واحد', 'لبنان', 'سهلة', 'للعرب', 'زي', 'ما', 'هي', 'لليونانيين', 'رايح', 'وأوروبا', 'الأصل', 'بالمقلوب', 'الكومنتات'], YELLOW);
paint(['اليمين', 'لليمين', 'استنى', 'الغريب', 'غيّروا'], RED);
const PAINT_NTH: [string, number, string][] = [['جاي', 1, YELLOW]]; // "رايح جاي" (not the "جاي" of the signature line)
const GROUPS: Group[] = (() => {
  const caps = CAPS as unknown as {sizes: number[]; w100: number[]; cards: Record<string, Partial<Group>>};
  const seen: Record<string, number> = {};
  const ws0 = words.map((w): Word => {
    const n = norm(w.w), k = seen[n] ?? 0; seen[n] = k + 1;
    const c = PAINT_NTH.find(([pw, nth]) => norm(pw) === n && nth === k)?.[2];
    return {...w, s: w.s + VO, e: w.e + VO, ...(c ? {c} : {})};
  });
  const out: Group[] = []; let i = 0;
  caps.sizes.forEach((n, k) => {
    const ws = ws0.slice(i, i + n); i += n;
    out.push({words: ws, s: ws[0].s, e: ws[ws.length - 1].e, w100: caps.w100[k], ...(caps.cards[String(k)] ?? {})});
  });
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
  const pin: Record<string, number> = {'الحكاية': T.hekaya, 'استنى': T.estanna, 'الفهمان': T.fahman, 'كسبان': T.kasban};
  for (const g of out) for (const w of g.words) if (pin[norm(w.w)] !== undefined) w.s = pin[norm(w.w)];
  for (const g of out) g.s = g.words[0].s;
  for (let k = 0; k < out.length - 1; k++) out[k].e = Math.min(out[k].e, out[k + 1].s);
  out[0].e = out[1].s; // the hook card holds until line 2 starts
  out[0].s = 0.03;     // the whole hook question is on screen in frame 1
  return out;
})();

// ============================================================ composition
export const Writing: React.FC = () => {
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
  const dim = t >= T.estanna - 0.02 && t < T.kano ? 0.38 * easeOut(seg(t, T.estanna - 0.02, T.estanna + 0.12)) * (1 - seg(t, T.kano - 0.3, T.kano)) : 0;
  return (
    <AbsoluteFill style={{backgroundColor: '#1d1410'}}>
      <Fonts />
      <SetBack cam={cam} dim={dim} />
      <Layer cam={cam} z={1000}>
        <Board t={t} dim={dim} />
        <Character pose={pose} mouth={mouth} blink={blink} wink={wink} x={CHAR_X} y={CHAR_Y} scale={CS} squash={squash} t={t}>
          <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
            {wink && t >= HOOK_POSE && <Sparkle x={HEAD[0] + 210} y={HEAD[1] - 40} dt={t - T.kasban} r={48} />}
          </svg>
        </Character>
      </Layer>
      <SetFront cam={cam} dim={dim} />
      {/* vignette, deeper during the signature line */}
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,${0.28 + dim}) 100%)`}} />
      <DownArrows t={t} />
      {/* captions at ~65% of the frame height: clear of the Shorts/TikTok channel name, title and buttons */}
      <Captions t={t} groups={GROUPS} colors={COLORS} y={1250} x={460} />
      <Sequence from={Math.round(VO * FPS)}><Audio src={staticFile('elfahman/writing/vo/vo.mp3')} volume={1} /></Sequence>
      {[...SFX, ...POSE_SWAP_SFX].map(([tt, n, v], i) => (
        <Sequence key={i} from={Math.max(0, Math.round(tt * FPS))} durationInFrames={Math.round(1.6 * FPS)}>
          <Audio src={staticFile(`elfahman/sfx/${n}.wav`)} volume={v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
