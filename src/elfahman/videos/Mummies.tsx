import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Fonts} from '../lib/fonts';
import {FPS, clamp, easeIn, easeInOut, easeOut, lerp, popIn, popOut, rand, seg, wobble} from '../lib/anim';
import {Cam, CamKey, Layer, camAt, shakeAt} from '../lib/camera';
import {SetBack, SetFront, DESK_SCREEN_Y} from '../lib/Set';
import {CANVAS, Character, HEAD, Pose, PoseKey, blinkTimes, mouthStates, poseAt, squashAt} from '../lib/Character';
import {Captions, RED, YELLOW, Word, groupWords, norm} from '../lib/Captions';
import {INK, Sparkle, Star, SweatDrop, showScale} from '../lib/fx';
import WORDS from './mummies.words.json';
import ENV from './mummies.env.json';

// Episode 02: mummies in Europe ("mumia" medicine and the "mummy brown" paint)

// ============================================================ timing
// voice (ElevenLabs eleven_v4, voice "Fodoly": the hook line take + the main take joined into vo.mp3) placed at VO seconds;
// word times from ElevenLabs Scribe
const VO = 0.15;
const words = WORDS as Word[];
const nq = (w: string) => norm(w).replace(/"/g, '');
const at = (w: string, nth = 0) => {
  const hits = words.filter((x) => nq(x.w) === nq(w));
  if (!hits[nth]) throw new Error(`word not found: ${w} #${nth}`);
  return hits[nth].s + VO;
};
const VOICE_END = words[words.length - 1].e + VO;
export const MUMMIES_DURATION_S = Math.round((VOICE_END + 0.8) * FPS) / FPS;

const T = {
  ayeet: at('عييت'), europa1: at('أوروبا'), zaman: at('زمان'), hayeddook: at('هيدوك'), mumya: at('مومياء'), masreya: at('مصرية'),
  takolha: at('تاكلها'), lemodda: at('لمدة'), tahn: at('بيطحنوا'), ye3melo: at('ويعملوها'), bodra: at('بودرة'), mumia: at('موميا'),
  yeshrabo: at('ويشربوها'), dawa: at('كدوا'), ko7a: at('الكحة'), goroo7: at('للجروح'),
  ba3deen: at('وبعدين'), rassameen: at('الرسامين'), lon1: at('اللون'), helw: at('حلو'),
  wa3amalo: at('وعملوا'), lon2: at('لون'), bonni: at('بني'), bonni2: at('بني', 1), mumia2: at('المومياء'),
  etrasamet: at('واترسمت'), lawhat: at('لوحات'), keteer: at('كتير'),
  estanna: at('استنى'),
  rassam: at('رسام'), engleezi: at('إنجليزي'), mashhoor: at('مشهور'), eref: at('عرف'), ma3mool: at('معمول'),
  bani: at('بني', 2), ha2ee2i: at('حقيقي'),
  akhad: at('أخد'), dafan: at('ودفنها'), geneena: at('جنينة'), beeto: at('بيته'), amalaha: at('وعملها'), genaza: at('جنازة'),
  wellon: at('واللون'), yetba3: at('بيتباع'), london: at('لندن'), sana: at('سنة'), alf: at('ألف'), talateen: at('وتلاتين'),
  ya3ni: at('يعني'), geddak: at('جدك'), far3ooni: at('الفرعوني'), met3alla2: at('متعلق'), europa: at('أوروبا', 1), delwa2ti: at('دلوقتي'),
  law: at('لو', 1), makan: at('مكان'), hate3mel: at('هتعمل'), eh: at('إيه'), ekteb: at('اكتبلي'), comments: at('الكومنتات'),
  fahman: at('الفهمان'), kasban: at('كسبان'),
};
// signature moments pinned to the measured audio onsets (voice level envelope), not just the transcript
T.estanna = 20.67 + VO; T.fahman = 43.25 + VO; T.kasban = 44.0 + VO;
const END = MUMMIES_DURATION_S;

// ============================================================ character
const TALKABLE: Pose[] = ['hero', 'explain', 'point_up', 'thinking', 'temple', 'thumbs_up', 'worried'];
const POSES: PoseKey[] = [
  [0, 'temple'],            // first frames match the last frame (loop)
  [VO, 'hero'],
  [T.hayeddook, 'explain'],
  [T.takolha, 'worried'],
  [T.lemodda, 'hero'],
  [T.tahn, 'explain'],
  [T.yeshrabo, 'worried'],
  [T.ba3deen, 'thinking'],
  [T.helw, 'thumbs_up'],
  [T.wa3amalo, 'explain'],
  [T.etrasamet, 'hero'],
  [T.estanna, 'shocked'],   // signature line: shocked stare exactly on "استنى"
  [T.rassam, 'explain'],
  [T.ma3mool, 'worried'],
  [T.akhad, 'hero'],
  [T.amalaha, 'point_up'],
  [T.wellon, 'explain'],
  [T.sana, 'point_up'],
  [T.ya3ni, 'thinking'],
  [T.met3alla2, 'explain'],
  [T.law, 'hero'],
  [T.hate3mel, 'thinking'],
  [T.ekteb, 'explain'],
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
  [VO, 1.2, {x: 540, y: 940, z: 30}], // quick pull-back so the hook board is fully in frame
  [T.ba3deen - 0.15, T.ba3deen + 0.45, {x: 512, y: 770, z: 160}],
  [T.etrasamet - 0.1, T.etrasamet + 0.4, {x: 540, y: 860, z: 90}],
  [T.estanna - 0.04, T.estanna + 0.1, {x: 540, y: FACE.y + 20, z: 380}], // punch-in exactly on "استنى"
  [T.rassam - 0.1, T.rassam + 0.4, {x: 540, y: 900, z: 60}],
  [T.ha2ee2i - 0.05, T.ha2ee2i + 0.3, {x: 540, y: 860, z: 140}],
  [T.akhad - 0.1, T.akhad + 0.4, {x: 540, y: 880, z: 60}],
  [T.ya3ni - 0.1, T.ya3ni + 0.4, {x: 525, y: 820, z: 120}],
  [T.law - 0.1, T.law + 0.4, {x: 540, y: 880, z: 60}],
  [T.fahman - 0.1, T.fahman + 0.5, CAM0], // ends on the opening framing -> seamless loop
];
// the pestle pounds while he says "بيطحنوا المومياوات"
const POUNDS = [0, 1, 2, 3].map((i) => T.tahn + 0.02 + i * 0.27);
const SHAKES: [number, number, number][] = [[T.estanna, 16, 6], [T.ha2ee2i, 7, 7], ...POUNDS.map((p): [number, number, number] => [p, 4, 12])];

// ============================================================ board (chalkboard inset above his head)
const BX = 80, BY = 84, BW = 860, BH = 480;
type Scene = 'sick' | 'grind' | 'medicine' | 'palette' | 'tube' | 'paintings' | 'painter' | 'funeral' | 'london' | 'wall' | 'comment';
const SCENES: [number, Scene | null][] = [
  [0, null], [T.ayeet - 0.1, 'sick'], [T.tahn - 0.12, 'grind'], [T.yeshrabo - 0.08, 'medicine'], [T.ba3deen - 0.08, 'palette'], [T.wa3amalo - 0.05, 'tube'],
  [T.etrasamet - 0.08, 'paintings'], [T.estanna - 0.12, null], [T.rassam - 0.1, 'painter'], [T.akhad - 0.05, 'funeral'],
  [T.wellon - 0.08, 'london'], [T.ya3ni - 0.08, 'wall'], [T.law - 0.08, 'comment'], [T.fahman - 0.15, null],
];
const sceneAt = (t: number) => {
  let cur: [number, Scene | null] = SCENES[0], prev: [number, Scene | null] | null = null;
  for (const s of SCENES) if (t >= s[0]) { prev = cur; cur = s; }
  return {scene: cur[1], since: t - cur[0], start: cur[0], prev: prev?.[1] ?? null};
};
const P = (n: string) => staticFile(`elfahman/mummies/${n}`);
const IMG = {mummy: [540, 964], tube: [446, 949], painter: [519, 995]};
const BROWN = '#7a4a22', BROWN_D = '#56321a', BROWN_L = '#b07a45', CREAM = '#f3e3bf', GOLDF = '#e6ae2e', BOARD = '#21302b';

// a prop picture centred on (0,0) with height h
const Pic: React.FC<{n: keyof typeof IMG; h: number; foot?: boolean}> = ({n, h, foot = false}) => {
  const w = (h * IMG[n][0]) / IMG[n][1];
  return <image href={P(`${n}.png`)} x={-w / 2} y={foot ? -h : -h / 2} width={w} height={h} />;
};

const MummyFace: React.FC<{r: number}> = ({r}) => (
  <g>
    <ellipse rx={r} ry={r * 1.15} fill={CREAM} stroke={INK} strokeWidth={r * 0.16} />
    <path d={`M ${-r} ${-r * 0.2} L ${r} ${-r * 0.2} L ${r * 0.95} ${r * 0.28} L ${-r * 0.95} ${r * 0.28} Z`} fill={BROWN_D} />
    <circle cx={-r * 0.4} cy={r * 0.04} r={r * 0.17} fill="#fff" /><circle cx={r * 0.4} cy={r * 0.04} r={r * 0.17} fill="#fff" />
    <path d={`M ${-r * 0.9} ${-r * 0.6} L ${r * 0.8} ${-r * 0.75} M ${-r * 0.85} ${r * 0.7} L ${r * 0.85} ${r * 0.55}`} stroke={INK} strokeWidth={r * 0.08} fill="none" />
  </g>
);

const StarBadge: React.FC = () => (
  <g>
    <circle r={96} fill="#2b4ea8" stroke={INK} strokeWidth={10} />
    {Array.from({length: 12}, (_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return <Star key={i} x={Math.cos(a) * 66} y={Math.sin(a) * 66} r={13} fill="#ffd23f" />;
    })}
  </g>
);

// hook: a sick face in old Europe is served an Egyptian mummy on a plate
const Sick: React.FC<{t: number}> = ({t}) => {
  const f = popIn(t - T.ayeet, 0.3), badge = popIn(t - T.europa1, 0.28);
  const plate = popIn(t - T.hayeddook, 0.3), mum = popIn(t - T.mumya, 0.3), cut = popIn(t - T.takolha, 0.24);
  const scared = t >= T.takolha ? 2.4 : 1;
  const hop = t >= T.takolha ? wobble(t - T.takolha, 4, 5) : 0;
  return (
    <g>
      <g transform={`translate(${175 + Math.sin(t * 5) * 4} 305) rotate(${Math.sin(t * 2.6) * 5}) scale(${f})`}>
        <circle r={104} fill="#b9d98a" stroke={INK} strokeWidth={11} />
        <path d="M -62 -30 q 20 -18 40 0 M 22 -30 q 20 -18 40 0" stroke={INK} strokeWidth={10} fill="none" strokeLinecap="round" />
        <path d="M -40 44 q 12 -14 24 0 q 12 14 24 0 q 12 -14 24 0" stroke={INK} strokeWidth={9} fill="none" strokeLinecap="round" />
        <g transform="translate(34 44) rotate(-28)">
          <rect x={0} y={-9} width={120} height={18} rx={9} fill="#fff" stroke={INK} strokeWidth={7} />
          <rect x={30} y={-4} width={62} height={8} rx={4} fill={RED} />
          <circle cx={122} cy={0} r={15} fill={RED} stroke={INK} strokeWidth={7} />
        </g>
        <ellipse cx={-62} cy={18} rx={18} ry={11} fill="#8fc46a" opacity={0.8} /><ellipse cx={66} cy={18} rx={18} ry={11} fill="#8fc46a" opacity={0.8} />
      </g>
      <SweatDrop x={60} y={190} dt={t - T.ayeet - 0.15} s={0.6} />
      <g transform={`translate(175 96) rotate(${wobble(t - T.europa1 - 0.28, 2, 4) * 12}) scale(${badge * 0.6})`}><StarBadge /></g>
      {/* the plate, then the mummy on it, then the cutlery */}
      <g transform={`translate(640 372) scale(${plate})`}>
        <ellipse rx={205} ry={56} fill="#f4f7fb" stroke={INK} strokeWidth={11} />
        <ellipse rx={140} ry={34} fill="#dfe6ee" stroke={INK} strokeWidth={6} />
      </g>
      <g transform={`translate(${640 + Math.sin(t * 2 * Math.PI * 15) * 2.5 * scared} 384) scale(${mum * (1 - 0.08 * hop)} ${mum * (1 + 0.1 * hop)})`}><Pic n="mummy" h={330} foot /></g>
      <SweatDrop x={770} y={110} dt={t - T.takolha} s={0.6} />
      <SweatDrop x={520} y={120} dt={t - T.takolha - 0.18} s={0.5} />
      <g transform={`translate(425 270) rotate(${-10 + wobble(t - T.takolha - 0.24, 3, 4) * 14}) scale(${cut})`}>
        <path d="M -30 -150 L -30 -70 Q -30 -40 0 -40 Q 30 -40 30 -70 L 30 -150 M 0 -150 L 0 -60" stroke={INK} strokeWidth={26} fill="none" strokeLinecap="round" />
        <path d="M -30 -150 L -30 -70 Q -30 -40 0 -40 Q 30 -40 30 -70 L 30 -150 M 0 -150 L 0 -60" stroke="#cfd6dd" strokeWidth={12} fill="none" strokeLinecap="round" />
        <rect x={-13} y={-44} width={26} height={200} rx={13} fill="#cfd6dd" stroke={INK} strokeWidth={8} />
      </g>
      <g transform={`translate(848 270) rotate(${10 - wobble(t - T.takolha - 0.24, 3, 4) * 14}) scale(${cut * 0.9})`}>
        <path d="M -14 -160 C 26 -130 30 -70 16 -20 L -14 -20 Z" fill="#e9eef2" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
        <rect x={-14} y={-22} width={28} height={180} rx={13} fill="#8a5a33" stroke={INK} strokeWidth={8} />
      </g>
    </g>
  );
};

const Grind: React.FC<{t: number}> = ({t}) => {
  // a scared mummy in a stone mortar; every pound of the pestle pushes it down until only powder is left
  const mx = 255, rim = 290;
  const sunk = POUNDS.reduce((a, p) => a + easeOut(seg(t, p, p + 0.12)), 0) / POUNDS.length;
  const u = clamp((t - POUNDS[0]) / 0.27 + 1, 0, POUNDS.length);
  const lift = t < POUNDS[POUNDS.length - 1] ? 85 * Math.abs(Math.sin(Math.PI * u)) : 0;
  const hit = POUNDS.reduce((a, p) => Math.max(a, t >= p ? Math.exp(-(t - p) * 14) : 0), 0);
  const headY = rim - 195 + sunk * 245;
  const tipY = Math.min(headY, rim + 30) - lift + 6;
  const jar = popIn(t - T.bodra, 0.3), fill = easeOut(seg(t, T.bodra + 0.1, T.bodra + 0.6));
  const label = popIn(t - T.mumia, 0.28);
  return (
    <g>
      <ellipse cx={mx} cy={rim} rx={160} ry={34} fill="#6f685c" stroke={INK} strokeWidth={10} />
      <defs><clipPath id="bowlclip"><rect x={mx - 150} y={-200} width={300} height={rim + 232} /></clipPath></defs>
      <g clipPath="url(#bowlclip)">
        <g transform={`translate(${mx + Math.sin(t * 2 * Math.PI * 15) * 3 * (1 - sunk)} ${rim + 40 + sunk * 245}) scale(${1 + 0.1 * hit} ${1 - 0.14 * hit})`}>
          <Pic n="mummy" h={235} foot />
        </g>
      </g>
      {[0, 1].map((i) => <SweatDrop key={i} x={mx + (i ? 115 : -115)} y={rim - 150} dt={t - (T.tahn - 0.05) - i * 0.2} s={0.55} />)}
      {/* pestle */}
      <g transform={`translate(${mx + 6} ${tipY}) rotate(24)`}>
        <rect x={-30} y={-270} width={60} height={270} rx={30} fill="#d8d1c3" stroke={INK} strokeWidth={9} />
        <ellipse cx={0} cy={-8} rx={44} ry={26} fill="#bfb7a7" stroke={INK} strokeWidth={9} />
      </g>
      {/* bowl front */}
      <path d={`M ${mx - 160} ${rim} C ${mx - 160} ${rim + 120} ${mx - 100} ${rim + 150} ${mx} ${rim + 150} C ${mx + 100} ${rim + 150} ${mx + 160} ${rim + 120} ${mx + 160} ${rim} C ${mx + 90} ${rim + 44} ${mx - 90} ${rim + 44} ${mx - 160} ${rim} Z`}
        fill="#c9c2b4" stroke={INK} strokeWidth={10} strokeLinejoin="round" />
      <rect x={mx - 85} y={rim + 146} width={170} height={30} rx={12} fill="#aaa294" stroke={INK} strokeWidth={9} />
      <path d={`M ${mx - 110} ${rim + 70} C ${mx - 90} ${rim + 105} ${mx - 50} ${rim + 118} ${mx - 10} ${rim + 120}`} stroke="#e6e0d4" strokeWidth={9} fill="none" strokeLinecap="round" />
      {/* brown dust puffs on every hit */}
      {POUNDS.map((p, i) => [-1, 1].map((s) => {
        const dt = t - p; if (dt < 0 || dt > 0.45) return null;
        return <circle key={`${i}${s}`} cx={mx + s * (70 + dt * 220)} cy={rim - 20 - dt * 120 + dt * dt * 200} r={(16 + i * 5) * (1 - dt / 0.45) + 6} fill={BROWN_L} stroke={INK} strokeWidth={5} opacity={1 - dt / 0.45} />;
      }))}
      {/* jar of powder, then its label */}
      <g transform={`translate(640 300) scale(${jar})`}>
        <rect x={-95} y={-110} width={190} height={240} rx={34} fill="#dff1f7" stroke={INK} strokeWidth={10} />
        <path d={`M -85 ${120 - 170 * fill} Q 0 ${100 - 190 * fill} 85 ${120 - 170 * fill} L 85 96 Q 85 120 61 120 L -61 120 Q -85 120 -85 96 Z`} fill={BROWN} />
        <rect x={-95} y={-110} width={190} height={240} rx={34} fill="none" stroke={INK} strokeWidth={10} />
        <rect x={-75} y={-150} width={150} height={48} rx={12} fill="#c98f55" stroke={INK} strokeWidth={9} />
        <path d="M -66 -70 L -66 60" stroke="#fff" strokeWidth={10} strokeLinecap="round" opacity={0.7} />
        <g transform={`translate(0 20) scale(${label})`}>
          <rect x={-70} y={-62} width={140} height={124} rx={14} fill={CREAM} stroke={INK} strokeWidth={8} />
          <MummyFace r={34} />
        </g>
      </g>
      <Sparkle x={770} y={150} dt={t - T.mumia - 0.05} r={36} />
      <Sparkle x={520} y={390} dt={t - T.mumia - 0.2} r={26} />
    </g>
  );
};

const Medicine: React.FC<{t: number}> = ({t}) => {
  const b = popIn(t - T.yeshrabo, 0.3), sp = popIn(t - T.dawa, 0.26);
  const tilt = -18 * easeInOut(seg(t, T.dawa + 0.15, T.dawa + 0.6));
  const cough = showScale(t, T.ko7a, 1e9), plaster = showScale(t, T.goroo7, 1e9);
  const ck = t >= T.ko7a ? wobble(t - T.ko7a, 5, 4) * 10 : 0;
  return (
    <g>
      {/* medicine bottle */}
      <g transform={`translate(190 265) scale(${b})`}>
        <rect x={-34} y={-200} width={68} height={50} rx={10} fill="#c98f55" stroke={INK} strokeWidth={9} />
        <path d="M -40 -152 L 40 -152 L 40 -120 C 95 -100 105 -70 105 -40 L 105 150 Q 105 180 75 180 L -75 180 Q -105 180 -105 150 L -105 -40 C -105 -70 -95 -100 -40 -120 Z" fill={BROWN} stroke={INK} strokeWidth={10} strokeLinejoin="round" />
        <rect x={-78} y={-20} width={156} height={130} rx={12} fill={CREAM} stroke={INK} strokeWidth={8} />
        <g transform="translate(0 45)"><MummyFace r={36} /></g>
        <path d="M -80 -60 L -80 -90" stroke="#fff" strokeWidth={10} strokeLinecap="round" opacity={0.5} />
      </g>
      {/* spoon of brown syrup */}
      <g transform={`translate(430 300) rotate(${tilt}) scale(${sp})`}>
        <path d="M 60 -8 L 250 -30 L 254 -6 L 62 20 Z" fill="#cfd6dd" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
        <ellipse cx={0} cy={0} rx={80} ry={46} fill="#cfd6dd" stroke={INK} strokeWidth={9} />
        <ellipse cx={0} cy={-4} rx={62} ry={30} fill={BROWN} />
        <ellipse cx={-22} cy={-12} rx={16} ry={7} fill="#fff" opacity={0.5} />
      </g>
      {[0, 1, 2].map((k) => {
        const dt = t - T.dawa - 0.55 - k * 0.22;
        return dt > 0 && dt < 0.5 ? <path key={k} transform={`translate(${372 - k * 4} ${340 + easeIn(dt / 0.5) * 110}) scale(${0.5 * (1 - dt)})`}
          d="M 0 -48 C 20 -16 34 4 34 22 C 34 43 18 56 0 56 C -18 56 -34 43 -34 22 C -34 4 -20 -16 0 -48 Z" fill={BROWN} stroke={INK} strokeWidth={8} /> : null;
      })}
      {/* cough */}
      <g transform={`translate(${640 + ck} 150) scale(${cough})`}>
        <circle r={78} fill="#ffd9a0" stroke={INK} strokeWidth={10} />
        <path d="M -48 -22 l 26 12 l -26 12 M 12 -10 l 26 -12" stroke={INK} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <ellipse cx={22} cy={34} rx={20} ry={16} fill={INK} />
        {[0, 1, 2].map((k) => {
          const d = ((t - T.ko7a) * 1.6 + k / 3) % 1;
          return <circle key={k} cx={95 + d * 90} cy={34 + (k - 1) * 26 * d} r={10 + d * 16} fill="#e9eef2" stroke={INK} strokeWidth={5} opacity={1 - d} />;
        })}
      </g>
      {/* plaster */}
      <g transform={`translate(660 365) rotate(-18) scale(${plaster})`}>
        <rect x={-130} y={-42} width={260} height={84} rx={42} fill="#f2b98a" stroke={INK} strokeWidth={10} />
        <rect x={-46} y={-42} width={92} height={84} fill="#fbe3cc" stroke={INK} strokeWidth={8} />
        {[-92, -72, 72, 92].map((x) => [-16, 16].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r={5} fill={INK} opacity={0.55} />))}
      </g>
    </g>
  );
};

const PaletteScene: React.FC<{t: number}> = ({t}) => {
  const s = popIn(t - T.rassameen, 0.32);
  const dip = easeInOut(seg(t, T.lon1 - 0.15, T.lon1 + 0.1));
  const pulse = t >= T.lon1 ? 1 + 0.25 * Math.max(0, Math.sin((t - T.lon1) * 12)) * Math.exp(-(t - T.lon1) * 2.2) : 1;
  const blobs: [number, number, string][] = [[-150, -70, '#e2463c'], [-60, -112, '#f2c230'], [50, -112, '#3f8fd6'], [150, -62, '#4aa85a'], [180, 30, '#f6f1e6']];
  return (
    <g>
      <g transform={`translate(400 255) rotate(-6) scale(${s})`}>
        <path d="M -270 10 C -270 -110 -150 -180 0 -180 C 160 -180 280 -110 280 0 C 280 110 170 180 20 180 C -40 180 -60 150 -40 110 C -25 80 -70 60 -130 90 C -200 125 -270 90 -270 10 Z" fill="#d9a566" stroke={INK} strokeWidth={12} strokeLinejoin="round" />
        <ellipse cx={-170} cy={30} rx={36} ry={28} fill={BOARD} stroke={INK} strokeWidth={10} />
        {blobs.map(([x, y, c], i) => <ellipse key={i} cx={x} cy={y} rx={34} ry={26} fill={c} stroke={INK} strokeWidth={7} />)}
        <g transform={`translate(80 60) scale(${pulse})`}>
          <path d="M -70 0 C -70 -45 -30 -62 10 -55 C 60 -48 80 -20 72 14 C 64 48 20 60 -20 52 C -55 45 -70 30 -70 0 Z" fill={BROWN} stroke={INK} strokeWidth={8} />
          <ellipse cx={-22} cy={-22} rx={20} ry={9} fill="#fff" opacity={0.4} />
        </g>
      </g>
      {/* brush dips into the brown */}
      <g transform={`translate(${lerp(760, 520, dip)} ${lerp(40, 270, dip)}) rotate(${lerp(30, 42, dip)}) scale(${s})`}>
        <rect x={-13} y={-250} width={26} height={190} rx={10} fill="#c0392b" stroke={INK} strokeWidth={8} />
        <rect x={-18} y={-66} width={36} height={40} fill="#cfd6dd" stroke={INK} strokeWidth={8} />
        <path d="M -18 -26 L 18 -26 C 20 0 10 26 0 40 C -10 26 -20 0 -18 -26 Z" fill={dip > 0.9 ? BROWN : '#3b2a20'} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      </g>
      <Sparkle x={640} y={130} dt={t - T.helw} r={44} />
      <Sparkle x={170} y={110} dt={t - T.helw - 0.12} r={32} />
      <Sparkle x={700} y={380} dt={t - T.helw - 0.24} r={28} />
    </g>
  );
};

const STROKE_D = 'M 420 120 C 500 70 560 170 640 120 S 760 80 810 130';
const TubeScene: React.FC<{t: number}> = ({t}) => {
  const s = popIn(t - T.wa3amalo - 0.05, 0.32);
  const sq = t >= T.bonni ? 1 - 0.08 * Math.max(0, Math.sin((t - T.bonni) * 16)) * Math.exp(-(t - T.bonni) * 5) : 1;
  const draw = easeInOut(seg(t, T.bonni, T.bonni + 0.45));
  const m = popIn(t - T.mumia2, 0.3);
  return (
    <g>
      <g transform={`translate(230 250) rotate(${-8 + Math.sin(t * 2.4) * 2}) scale(${s * (2 - sq)} ${s * sq})`}><Pic n="tube" h={420} /></g>
      {draw > 0 && <g>
        <path d={STROKE_D} fill="none" stroke={INK} strokeWidth={86} strokeLinecap="round" pathLength={1} strokeDasharray={`${draw} 1`} />
        <path d={STROKE_D} fill="none" stroke={BROWN} strokeWidth={68} strokeLinecap="round" pathLength={1} strokeDasharray={`${draw} 1`} />
        <path d={STROKE_D} fill="none" stroke={BROWN_L} strokeWidth={10} strokeLinecap="round" pathLength={1} strokeDasharray={`${draw * 0.92} 1`} transform="translate(0 -18)" />
      </g>}
      <g transform={`translate(${620 + Math.sin(t * 2 * Math.PI * 14) * 3} 440) scale(${m})`}><Pic n="mummy" h={270} foot /></g>
      <SweatDrop x={730} y={230} dt={t - T.mumia2 - 0.2} s={0.6} />
      <SweatDrop x={510} y={240} dt={t - T.mumia2 - 0.4} s={0.5} />
    </g>
  );
};

const Frame: React.FC<{w: number; h: number; children?: React.ReactNode}> = ({w, h, children}) => (
  <g>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={10} fill={GOLDF} stroke={INK} strokeWidth={10} />
    <rect x={-w / 2 + 12} y={-h / 2 + 12} width={w - 24} height={h - 24} rx={6} fill="none" stroke="#fff3b8" strokeWidth={5} opacity={0.8} />
    <rect x={-w / 2 + 26} y={-h / 2 + 26} width={w - 52} height={h - 52} fill="#c9a06c" stroke={INK} strokeWidth={7} />
    {children}
  </g>
);
const Paintings: React.FC<{t: number}> = ({t}) => {
  const ts = [T.etrasamet, T.lawhat, T.keteer];
  const art = [
    // portrait
    <g key="a"><circle cx={0} cy={-36} r={40} fill={BROWN_D} /><path d="M -74 100 C -74 30 -40 10 0 10 C 40 10 74 30 74 100 Z" fill={BROWN} /></g>,
    // landscape
    <g key="b"><circle cx={38} cy={-60} r={24} fill="#f3e3bf" /><path d="M -80 100 L -80 30 L -30 -30 L 10 20 L 44 -8 L 80 40 L 80 100 Z" fill={BROWN} /><path d="M -80 100 L -80 64 C -30 40 30 80 80 56 L 80 100 Z" fill={BROWN_D} /></g>,
    // still life
    <g key="c"><path d="M -30 -10 C -52 20 -48 80 -24 100 L 24 100 C 48 80 52 20 30 -10 L 20 -40 L -20 -40 Z" fill={BROWN} /><circle cx={-10} cy={-70} r={20} fill={BROWN_D} /><circle cx={22} cy={-82} r={16} fill={BROWN_D} /><path d="M -80 100 L 80 100" stroke={BROWN_D} strokeWidth={10} /></g>,
  ];
  return (
    <g>
      {ts.map((tt, i) => (
        <g key={i} transform={`translate(${150 + i * 280} ${240 + (i === 1 ? -14 : 10)}) rotate(${(i - 1) * 4 + wobble(t - tt, 2.2, 4) * 9}) scale(${popIn(t - tt, 0.28)})`}>
          <Frame w={236} h={300}>{art[i]}</Frame>
        </g>
      ))}
      <Sparkle x={290} y={70} dt={t - T.lawhat - 0.1} r={30} />
      <Sparkle x={590} y={420} dt={t - T.keteer - 0.1} r={34} />
    </g>
  );
};

const Flag: React.FC = () => (
  <g>
    <defs><clipPath id="ukclip"><rect x={-120} y={-72} width={240} height={144} rx={10} /></clipPath></defs>
    <g clipPath="url(#ukclip)">
      <rect x={-120} y={-72} width={240} height={144} fill="#24408e" />
      <path d="M -120 -72 L 120 72 M 120 -72 L -120 72" stroke="#fff" strokeWidth={30} />
      <path d="M -120 -72 L 120 72 M 120 -72 L -120 72" stroke="#d8392f" strokeWidth={11} />
      <path d="M 0 -72 L 0 72 M -120 0 L 120 0" stroke="#fff" strokeWidth={48} />
      <path d="M 0 -72 L 0 72 M -120 0 L 120 0" stroke="#d8392f" strokeWidth={28} />
    </g>
    <rect x={-120} y={-72} width={240} height={144} rx={10} fill="none" stroke={INK} strokeWidth={10} />
  </g>
);

const PainterScene: React.FC<{t: number}> = ({t}) => {
  const s = popIn(t - T.rassam, 0.3);
  const shake = t >= T.ha2ee2i ? wobble(t - T.ha2ee2i, 8, 4) * 14 : 0;
  const flag = showScale(t, T.engleezi, T.eref - 0.12);
  const tube = popIn(t - T.eref, 0.3);
  const mum = popIn(t - T.bani, 0.3);
  const bang = popIn(t - T.ha2ee2i, 0.22);
  return (
    <g>
      <g transform={`translate(${215 + shake} 468) scale(${s})`}><Pic n="painter" h={450} foot /></g>
      <g transform={`translate(600 150) rotate(${Math.sin(t * 3) * 3}) scale(${flag})`}><Flag /></g>
      {t >= T.mashhoor && t < T.eref && [0, 1, 2].map((i) => (
        <Star key={i} x={480 + i * 120} y={330 - (i === 1 ? 30 : 0)} r={38 * showScale(t, T.mashhoor + i * 0.08, T.eref - 0.12)} rot={(t - T.mashhoor) * 40} />
      ))}
      <g transform={`translate(520 250) rotate(6) scale(${tube})`}><Pic n="tube" h={360} /></g>
      <g transform={`translate(${730 + Math.sin(t * 2 * Math.PI * 14) * 2.5} 440) scale(${mum})`}><Pic n="mummy" h={290} foot /></g>
      {bang > 0 && (
        <g transform={`translate(390 110) rotate(10) scale(${bang})`}>
          <rect x={-17} y={-80} width={34} height={104} rx={15} fill={RED} stroke={INK} strokeWidth={9} />
          <circle cx={0} cy={58} r={20} fill={RED} stroke={INK} strokeWidth={9} />
        </g>
      )}
      <SweatDrop x={80} y={110} dt={t - T.ha2ee2i - 0.1} s={0.6} />
    </g>
  );
};

const Flower: React.FC<{x: number; y: number; s: number; c: string}> = ({x, y, s, c}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M 0 0 L 0 60" stroke="#2f6b2a" strokeWidth={9} strokeLinecap="round" />
    {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx={0} cy={-19} rx={12} ry={17} fill={c} stroke={INK} strokeWidth={5} transform={`rotate(${a})`} />)}
    <circle r={10} fill="#ffd23f" stroke={INK} strokeWidth={5} />
  </g>
);

const Funeral: React.FC<{t: number}> = ({t}) => {
  const GY = 372; // ground line
  const ts = popIn(t - T.akhad, 0.28);
  const lower = easeInOut(seg(t, T.dafan, T.geneena + 0.05));
  const mound = popIn(t - T.geneena - 0.05, 0.26);
  const house = popIn(t - T.beeto, 0.28);
  const stone = popIn(t - T.amalaha, 0.3);
  const fl = (i: number) => popIn(t - T.genaza - i * 0.07, 0.24);
  const painter = popIn(t - T.genaza, 0.3);
  return (
    <g>
      {/* house in the background */}
      <g transform={`translate(140 ${GY}) scale(${house})`}>
        <rect x={-90} y={-130} width={180} height={130} fill="#e8c9a0" stroke={INK} strokeWidth={9} />
        <path d="M -112 -126 L 0 -214 L 112 -126 Z" fill="#b5523c" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
        <rect x={-22} y={-70} width={44} height={70} fill="#7a4a22" stroke={INK} strokeWidth={7} />
        <rect x={38} y={-100} width={34} height={34} fill="#ffe9a3" stroke={INK} strokeWidth={6} />
        <rect x={-72} y={-100} width={34} height={34} fill="#ffe9a3" stroke={INK} strokeWidth={6} />
      </g>
      {/* headstone behind the grave */}
      <g transform={`translate(430 ${GY - 4}) scale(${stone})`}>
        <path d="M -70 0 L -70 -110 C -70 -168 70 -168 70 -110 L 70 0 Z" fill="#c4ccd2" stroke={INK} strokeWidth={10} strokeLinejoin="round" />
        <path d="M 0 -128 C 14 -106 24 -94 24 -78 C 24 -62 12 -52 0 -52 C -12 -52 -24 -62 -24 -78 C -24 -94 -14 -106 0 -128 Z" fill={BROWN} stroke={INK} strokeWidth={6} />
        <path d="M -40 -30 L 40 -30" stroke="#8d989f" strokeWidth={8} strokeLinecap="round" />
      </g>
      {/* the tube goes down into the hole (clipped at the ground line) */}
      <defs><clipPath id="groundclip"><rect x={0} y={-200} width={BW} height={GY + 212} /></clipPath></defs>
      <ellipse cx={430} cy={GY + 14} rx={118} ry={24} fill="#1c120c" stroke={INK} strokeWidth={8} opacity={t >= T.akhad ? 1 - mound : 0} />
      <g clipPath="url(#groundclip)">
        <g transform={`translate(430 ${lerp(170, GY + 190, lower) + Math.sin(t * 5) * 5 * (1 - lower)}) rotate(${lerp(-10, 0, lower)}) scale(${ts})`}><Pic n="tube" h={270} /></g>
      </g>
      {/* garden ground */}
      <path d={`M -6 ${GY + 16} Q 430 ${GY - 4} ${BW + 6} ${GY + 16} L ${BW + 6} ${BH - 6} Q ${BW + 6} ${BH + 6} ${BW - 8} ${BH + 6} L 8 ${BH + 6} Q -6 ${BH + 6} -6 ${BH - 6} Z`} fill="#4f8a3c" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      {t < T.geneena + 0.3 && <ellipse cx={430} cy={GY + 34} rx={112} ry={22} fill="#1c120c" opacity={(t >= T.akhad ? 1 : 0) * (1 - clamp(mound))} />}
      <g transform={`translate(430 ${GY + 50}) scale(${mound})`}>
        <path d="M -140 0 C -110 -64 110 -64 140 0 Z" fill={BROWN} stroke={INK} strokeWidth={9} strokeLinejoin="round" />
        <path d="M -70 -22 q 14 -10 28 0 M 30 -30 q 14 -10 28 0" stroke={BROWN_D} strokeWidth={6} fill="none" strokeLinecap="round" />
      </g>
      {[[-40, '#ff8fb3'], [0, '#ffffff'], [40, '#ffb347']].map(([dx, c], i) => <Flower key={i} x={430 + (dx as number)} y={GY + 6} s={0.85 * fl(i)} c={c as string} />)}
      {[[300, 0.7], [570, 0.6], [820, 0.75], [40, 0.6]].map(([x, s], i) => <Flower key={`g${i}`} x={x} y={GY + 40} s={s * popIn(t - T.geneena - i * 0.06, 0.24)} c={i % 2 ? '#ffd23f' : '#ff8fb3'} />)}
      {/* the painter mourns */}
      <g transform={`translate(${700 + Math.sin(t * 9) * 2} ${GY + 78}) scale(${painter})`}><Pic n="painter" h={300} foot /></g>
      {[0, 1].map((i) => <SweatDrop key={i} x={i ? 770 : 640} y={GY - 150} dt={t - T.genaza - 0.15 - i * 0.18} s={0.45} />)}
    </g>
  );
};

const London: React.FC<{t: number}> = ({t}) => {
  const tube = popIn(t - T.wellon, 0.3), tag = popIn(t - T.yetba3, 0.26), ben = popIn(t - T.london, 0.32);
  const ys = popIn(t - T.sana, 0.26);
  const n = Math.round(lerp(1500, 1933, easeOut(seg(t, T.alf, T.talateen + 0.35))));
  const done = t >= T.talateen + 0.35;
  const beat = done ? 1 + 0.1 * wobble(t - T.talateen - 0.35, 3, 5) : 1;
  const hand = (t - T.london) * 200;
  return (
    <g>
      {/* shop shelf with the tube and its price tag */}
      <rect x={30} y={420} width={420} height={34} rx={10} fill="#8a5a33" stroke={INK} strokeWidth={9} />
      <g transform={`translate(150 424) rotate(-4) scale(${tube})`}><Pic n="tube" h={250} foot /></g>
      <g transform={`translate(330 340) rotate(${12 + wobble(t - T.yetba3 - 0.26, 2.5, 4) * 14}) scale(${tag})`}>
        <path d="M -70 -44 L 40 -44 L 86 0 L 40 44 L -70 44 Z" fill="#fff3d6" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
        <circle cx={48} cy={0} r={9} fill={BOARD} stroke={INK} strokeWidth={5} />
        <text x={-22} y={24} textAnchor="middle" fontFamily="Cairo" fontWeight={900} fontSize={66} fill="#2f8a4a" direction="ltr">£</text>
      </g>
      {/* clock tower */}
      <g transform={`translate(740 462) scale(${ben})`}>
        <rect x={-58} y={-300} width={116} height={300} fill="#d9b57a" stroke={INK} strokeWidth={10} />
        <path d="M -70 -300 L 0 -430 L 70 -300 Z" fill="#6f7f8a" stroke={INK} strokeWidth={10} strokeLinejoin="round" />
        <circle cx={0} cy={-232} r={44} fill="#fffbe6" stroke={INK} strokeWidth={9} />
        <path d="M 0 -232 L 0 -262" stroke={INK} strokeWidth={7} strokeLinecap="round" />
        <path d="M 0 -232 L 22 -232" stroke={INK} strokeWidth={7} strokeLinecap="round" transform={`rotate(${hand} 0 -232)`} />
        {[-150, -100, -50].map((y) => <path key={y} d={`M -30 ${y} L -30 ${y + 30} M 0 ${y} L 0 ${y + 30} M 30 ${y} L 30 ${y + 30}`} stroke="#a8824a" strokeWidth={10} strokeLinecap="round" />)}
      </g>
      {/* the year counts up to 1933 */}
      {ys > 0 && (
        <text x={400} y={210} textAnchor="middle" fontFamily="Cairo" fontWeight={900} fontSize={170 * ys * beat} fill={done ? YELLOW : '#fff'}
          stroke={INK} strokeWidth={20} strokeLinejoin="round" paintOrder="stroke" direction="ltr">{n}</text>
      )}
      <Sparkle x={150} y={90} dt={t - T.talateen - 0.35} r={38} />
      <Sparkle x={620} y={250} dt={t - T.talateen - 0.5} r={30} />
    </g>
  );
};

const Wall: React.FC<{t: number}> = ({t}) => {
  const m = popIn(t - T.geddak, 0.3);
  const pyr = showScale(t, T.far3ooni, T.met3alla2 - 0.1);
  const fr = popIn(t - T.met3alla2, 0.32);
  const swing = t >= T.met3alla2 ? wobble(t - T.met3alla2, 1.6, 2.2) * 9 : 0;
  const eu = popIn(t - T.europa, 0.3);
  const inFrame = easeInOut(seg(t, T.met3alla2 - 0.05, T.met3alla2 + 0.25));
  return (
    <g>
      {/* pyramids while he is still "your pharaoh grandpa" */}
      <g transform={`translate(150 420) scale(${pyr})`}>
        <path d="M -130 0 L -20 -170 L 90 0 Z" fill="#e8b85a" stroke={INK} strokeWidth={10} strokeLinejoin="round" />
        <path d="M -20 -170 L 90 0 L 30 0 Z" fill="#c9923c" />
        <path d="M 40 0 L 110 -100 L 180 0 Z" fill="#e8b85a" stroke={INK} strokeWidth={10} strokeLinejoin="round" />
      </g>
      <g transform={`translate(700 130) scale(${pyr})`}><circle r={52} fill="#ffd23f" stroke={INK} strokeWidth={10} /></g>
      {/* the frame swings from a nail */}
      <g transform={`translate(430 6) rotate(${swing})`}>
        <g transform={`scale(${fr})`}>
          <path d="M 0 0 L -110 62 M 0 0 L 110 62" stroke="#d8d1c3" strokeWidth={6} />
          <circle r={11} fill="#cfd6dd" stroke={INK} strokeWidth={6} />
          <g transform="translate(0 250)"><Frame w={330} h={400} /></g>
        </g>
        <g transform={`translate(${Math.sin(t * 2 * Math.PI * 13) * 2} ${lerp(444, 412, inFrame)}) scale(${m * lerp(1, 0.84, inFrame)})`}><Pic n="mummy" h={370} foot /></g>
      </g>
      <SweatDrop x={610} y={150} dt={t - T.delwa2ti} s={0.6} />
      <SweatDrop x={250} y={170} dt={t - T.delwa2ti - 0.2} s={0.5} />
      {/* Europe badge: ring of stars */}
      <g transform={`translate(735 330) rotate(${wobble(t - T.europa - 0.3, 2, 4) * 12}) scale(${eu})`}>
        <StarBadge />
      </g>
    </g>
  );
};

const CommentScene: React.FC<{t: number}> = ({t}) => {
  const p = popIn(t - T.makan, 0.3);
  const q = popIn(t - T.hate3mel, 0.28);
  const qk = t >= T.eh ? wobble(t - T.eh, 3, 3.5) * 16 : 0;
  const b = popIn(t - T.ekteb, 0.3);
  const typed = clamp((t - T.comments) / 0.5);
  return (
    <g>
      <g transform={`translate(170 470) scale(${p})`}><Pic n="painter" h={400} foot /></g>
      <g transform={`translate(318 95) rotate(-8) scale(${p})`}><Pic n="tube" h={140} /></g>
      {q > 0 && (
        <text x={405} y={335} textAnchor="middle" fontFamily="Cairo" fontWeight={900} fontSize={270 * q} fill={YELLOW} stroke={INK} strokeWidth={26}
          strokeLinejoin="round" paintOrder="stroke" transform={`rotate(${qk} 405 240)`}>؟</text>
      )}
      {/* comment bubble: typing dots, then lines */}
      <g transform={`translate(680 215) scale(${b * 0.86})`}>
        <path d="M -150 -110 L 150 -110 Q 180 -110 180 -80 L 180 60 Q 180 90 150 90 L 10 90 L -50 150 L -40 90 L -150 90 Q -180 90 -180 60 L -180 -80 Q -180 -110 -150 -110 Z" fill="#fff" stroke={INK} strokeWidth={11} strokeLinejoin="round" />
        {typed <= 0 ? [-60, 0, 60].map((x, i) => (
          <circle key={i} cx={x} cy={-10 - 14 * Math.max(0, Math.sin((t - T.ekteb) * 9 - i * 0.9))} r={17} fill="#8a949c" />
        )) : [[-50, 250], [0, 300], [50, 180]].map(([y, w], i) => (
          <rect key={i} x={140 - w * clamp(typed * 3 - i)} y={y - 22} width={w * clamp(typed * 3 - i)} height={24} rx={12} fill={i === 0 ? RED : '#8a949c'} />
        ))}
      </g>
      <Sparkle x={830} y={70} dt={t - T.comments - 0.1} r={32} />
    </g>
  );
};

const Board: React.FC<{t: number}> = ({t}) => {
  const {scene, since, prev} = sceneAt(t);
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
  const cs = (shown && prev !== null && since < 0.3 ? popIn(since, 0.26) : 1) * leaving;
  return (
    <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <g transform={`translate(${BX + BW / 2} ${BY + BH}) scale(${bs}) translate(${-BW / 2} ${-BH})`}>
        <rect x={-16} y={-16} width={BW + 32} height={BH + 32} rx={26} fill="#8a5a33" stroke={INK} strokeWidth={10} />
        <rect x={0} y={0} width={BW} height={BH} rx={14} fill={BOARD} stroke={INK} strokeWidth={6} />
        <rect x={10} y={10} width={BW - 20} height={BH - 20} rx={10} fill="none" stroke="#ffffff" strokeOpacity={0.05} strokeWidth={8} />
        <g transform={`translate(${BW / 2} ${BH / 2}) scale(${cs}) translate(${-BW / 2 + 0} ${-BH / 2})`}>
          {content === 'sick' && <Sick t={t} />}
          {content === 'grind' && <Grind t={t} />}
          {content === 'medicine' && <Medicine t={t} />}
          {content === 'palette' && <PaletteScene t={t} />}
          {content === 'tube' && <TubeScene t={t} />}
          {content === 'paintings' && <Paintings t={t} />}
          {content === 'painter' && <PainterScene t={t} />}
          {content === 'funeral' && <Funeral t={t} />}
          {content === 'london' && <London t={t} />}
          {content === 'wall' && <Wall t={t} />}
          {content === 'comment' && <CommentScene t={t} />}
        </g>
      </g>
    </svg>
  );
};

// ============================================================ hook prop: the scared mummy on the desk (moving from frame 1)
const HookMummy: React.FC<{t: number}> = ({t}) => {
  const out = T.tahn - 0.14;
  if (t > out + 0.2) return null;
  const s = t < out ? 1 : popOut(t - out, 0.18);
  const fear = t >= T.takolha ? 2.2 : 1;
  const jump = t >= T.takolha ? wobble(t - T.takolha, 4, 6) : 0;
  const gh = 400, gw = (gh * IMG.mummy[0]) / IMG.mummy[1];
  const x = 215 + Math.sin(t * 2 * Math.PI * 16) * 3 * fear, y = DESK_SCREEN_Y + 45;
  const rot = Math.sin(t * 2 * Math.PI * 8.5) * 2.2 * fear;
  return (
    <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <ellipse cx={215} cy={y - 4} rx={gw * 0.42 * s} ry={14 * s} fill="#000" opacity={0.25} />
      <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s * (1 - 0.08 * jump)} ${s * (1 + 0.1 * jump)})`}>
        <image href={P('mummy.png')} x={-gw / 2} y={-gh} width={gw} height={gh} />
        <SweatDrop x={-gw * 0.55} y={-gh * 0.9} dt={t - T.takolha} s={0.6} />
        <SweatDrop x={gw * 0.55} y={-gh * 0.85} dt={t - T.takolha - 0.15} s={0.5} />
      </g>
    </svg>
  );
};

// ============================================================ sound
type Cue = [number, string, number];
const SFX: Cue[] = [
  [0, 'tremble', 0.32], [T.ayeet - 0.1, 'whoosh', 0.28], [T.ayeet, 'pop', 0.3], [T.europa1, 'pop', 0.25], [T.hayeddook, 'pop', 0.3],
  [T.mumya, 'boing', 0.3], [T.takolha, 'ding', 0.3], [T.takolha, 'tremble', 0.4], [T.takolha + 0.1, 'gulp', 0.3], [T.tahn - 0.14, 'swish', 0.3],
  [T.tahn - 0.12, 'swish', 0.28], ...POUNDS.map((p): Cue => [p, 'thud', 0.42]), [T.bodra, 'pop', 0.3], [T.mumia, 'sparkle', 0.3],
  [T.yeshrabo - 0.08, 'swish', 0.3], [T.yeshrabo, 'pop', 0.28], [T.dawa, 'gulp', 0.35], [T.ko7a, 'squish', 0.35], [T.goroo7, 'pop', 0.3],
  [T.ba3deen - 0.08, 'swish', 0.3], [T.rassameen, 'boing', 0.28], [T.lon1, 'squish', 0.3], [T.helw, 'sparkle', 0.35], [T.helw, 'ding', 0.25],
  [T.wa3amalo - 0.05, 'whoosh', 0.28], [T.wa3amalo + 0.05, 'pop', 0.3], [T.bonni, 'squish', 0.4], [T.mumia2, 'boing', 0.3], [T.mumia2 + 0.1, 'tremble', 0.3],
  [T.etrasamet - 0.08, 'swish', 0.3], [T.etrasamet, 'pop', 0.3], [T.lawhat, 'pop', 0.3], [T.keteer, 'pop', 0.3],
  [T.estanna - 0.02, 'stinger', 0.55],
  [T.rassam - 0.1, 'whoosh', 0.3], [T.rassam, 'pop', 0.3], [T.engleezi, 'pop', 0.25], [T.mashhoor, 'twinkle', 0.3],
  [T.eref, 'pop', 0.3], [T.bani, 'boing', 0.3], [T.ha2ee2i, 'alarm', 0.2], [T.ha2ee2i, 'tremble', 0.35],
  [T.akhad - 0.05, 'swish', 0.3], [T.akhad, 'pop', 0.28], [T.dafan, 'whoosh', 0.3], [T.geneena, 'thud', 0.45], [T.beeto, 'pop', 0.22],
  [T.amalaha, 'pop', 0.3], [T.genaza, 'ding', 0.35], [T.genaza + 0.1, 'bubbles', 0.2],
  [T.wellon - 0.08, 'swish', 0.3], [T.wellon, 'pop', 0.28], [T.yetba3, 'click', 0.45], [T.london, 'ding', 0.3], [T.sana, 'pop', 0.25],
  [T.alf, 'step', 0.3], [T.alf + 0.35, 'step', 0.3], [T.alf + 0.7, 'step', 0.3], [T.talateen + 0.35, 'ding', 0.35], [T.talateen + 0.35, 'sparkle', 0.3],
  [T.ya3ni - 0.08, 'swish', 0.3], [T.geddak, 'boing', 0.3], [T.far3ooni, 'pop', 0.28], [T.met3alla2, 'thud', 0.4], [T.europa, 'pop', 0.3], [T.delwa2ti, 'tremble', 0.3],
  [T.law - 0.08, 'swish', 0.28], [T.makan, 'pop', 0.3], [T.hate3mel, 'boing', 0.3], [T.ekteb, 'pop', 0.3], [T.comments, 'click', 0.45],
  [T.fahman - 0.15, 'swish', 0.3], [T.fahman, 'pop', 0.25], [T.kasban, 'twinkle', 0.4],
];
const POSE_SWAP_SFX: Cue[] = POSES.slice(2).map(([t]) => [t - 0.06, 'swish', 0.1]);

// caption key words (quotes around a word in the script are kept in the caption, so colour both spellings)
const COLORS: Record<string, string> = {};
const paint = (ws: string[], c: string) => { for (const w of ws) for (const k of [w, `"${w}`, `${w}"`, `"${w}"`]) COLORS[norm(k)] = c; };
paint(['أوروبا', 'مومياء', 'مصرية', 'المومياوات', 'بودرة', 'موميا', 'كدوا', 'الرسامين', 'حلو', 'بني', 'المومياء', 'لوحات', 'إنجليزي', 'الأنبوبة', 'جنينة', 'لندن',
  'ألف', 'تسعمية', 'تلاتة', 'وتلاتين', 'الفرعوني', 'حيطة', 'أوروبا', 'الكومنتات'], YELLOW);
paint(['عييت', 'تاكلها', 'بيطحنوا', 'استنى', 'الغريب', 'آدم', 'حقيقي', 'ودفنها', 'جنازة'], RED);

// ============================================================ composition
export const Mummies: React.FC = () => {
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
  const dim = t >= T.estanna - 0.02 && t < T.rassam ? 0.38 * easeOut(seg(t, T.estanna - 0.02, T.estanna + 0.12)) * (1 - seg(t, T.rassam - 0.3, T.rassam)) : 0;
  const redPulse = t >= T.ha2ee2i && t < T.ha2ee2i + 1.0 ? 0.18 * Math.max(0, Math.sin((t - T.ha2ee2i) * 9)) * (1 - (t - T.ha2ee2i) / 1.0) : 0;
  const groups = groupWords(words, VO, {gold: ['الفهمان', 'كسبان'], big: ['استنى...']});
  return (
    <AbsoluteFill style={{backgroundColor: '#1d1410'}}>
      <Fonts />
      <SetBack cam={cam} dim={dim} />
      <Layer cam={cam} z={1000}>
        <Board t={t} />
        <Character pose={pose} mouth={mouth} blink={blink} wink={wink} x={CHAR_X} y={CHAR_Y} scale={CS} squash={squash} t={t}>
          <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
            <SweatDrop x={HEAD[0] + 250} y={HEAD[1] - 140} dt={t - T.dawa} s={1.3} />
            <SweatDrop x={HEAD[0] - 260} y={HEAD[1] - 120} dt={t - T.ha2ee2i - 0.1} s={1.1} />
            {wink && t >= VO && <Sparkle x={HEAD[0] + 210} y={HEAD[1] - 40} dt={t - T.kasban} r={48} />}
          </svg>
        </Character>
      </Layer>
      <SetFront cam={cam} dim={dim} />
      <Layer cam={cam} z={1000}><HookMummy t={t} /></Layer>
      {/* vignette, deeper during the signature line, red pulse on "حقيقي" */}
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,${0.28 + dim}) 100%)`}} />
      {redPulse > 0 && <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, rgba(255,60,40,0) 45%, rgba(255,60,40,${redPulse}) 100%)`}} />}
      {/* captions at ~65% of the frame height: clear of the Shorts/TikTok channel name, title and buttons */}
      <Captions t={t} groups={groups} colors={COLORS} y={1250} x={460} />
      <Sequence from={Math.round(VO * FPS)}><Audio src={staticFile('elfahman/mummies/vo/vo.mp3')} volume={1} /></Sequence>
      {[...SFX, ...POSE_SWAP_SFX].map(([tt, n, v], i) => (
        <Sequence key={i} from={Math.max(0, Math.round(tt * FPS))} durationInFrames={Math.round(1.6 * FPS)}>
          <Audio src={staticFile(`elfahman/sfx/${n}.wav`)} volume={v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
