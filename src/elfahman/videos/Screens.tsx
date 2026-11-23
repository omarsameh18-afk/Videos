import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Fonts} from '../lib/fonts';
import {FPS, clamp, easeIn, easeInOut, easeOut, lerp, popIn, rand, seg} from '../lib/anim';
import {Cam, CamKey, Layer, camAt, shakeAt} from '../lib/camera';
import {SetBack, SetFront, DESK_SCREEN_Y} from '../lib/Set';
import {CANVAS, Character, HEAD, Pose, PoseKey, blinkTimes, mouthStates, poseAt, squashAt} from '../lib/Character';
import {Captions, Group, RED, YELLOW, Word, norm} from '../lib/Captions';
import {INK, Sparkle, showScale} from '../lib/fx';
import WORDS from './screens.words.json';
import ENV from './screens.env.json';
import CAPS from './screens.captions.json';

// Episode 08: "الأطفال والشاشات" (Finnish study: 260 kids followed for 8 years; more screen time went with faster memory
// and higher reasoning scores, but it is a link, not a cause; what matters is what the child does on the screen).
// Fast board: a new beat about every 2 s, every picture drawn in code (no generated pictures).
// Voice: the raw take at 1.0x with every silence cut to max 0.25 s (tools/capgaps.py); the only longer pause is the natural
// one after "والمفاجأة؟" (0.37 s, capped at 0.6 s, never lengthened). Curious bed + record scratch on "استنى"
// (tools/curious_bed.py). Frame 0: the kid with the glowing phone and the racing brain is already moving; the last scene is
// the same hook drawing running back into its frame-0 state (loop).

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
const SPEECH_END = 59.27 + VO; // measured end of the last word (scribe_words.pauses.json)
export const SCREENS_DURATION_S = Math.round((SPEECH_END + 0.4) * FPS) / FPS; // 0.4 s of silence after the last word
const END = SCREENS_DURATION_S;

const T = {
  tel3o: at('طلعوا'), mo5hom: at('مخهم'), asra3: at('أسرع'),
  kolena: at('كلنا'), gomla: at('جملة'), mobile1: at('الموبايل', 1), haybawaz: at('هيبوظ'), mo5ak: at('مخك'),
  bas: at('بس'), olama: at('علماء'), finland: at('فنلندا'), meten: at('ميتين'), setteen: at('وستين'), tefl: at('طفل'),
  fedlo: at('وفضلوا'), yetab3o: at('يتابعوهم'), taman: at('تمن'), seneen: at('سنين'), kamla: at('كاملة'), soghayareen: at('صغيرين'),
  le7ad: at('لحد'), morahqeen: at('مراهقين'),
  kano: at('كانوا'), besagelo: at('بيسجلوا'), haga: at('حاجة'), bayel3abo: at('بيلعبوا'), yet7arako: at('ويتحركوا'), eih1: at('إيه'),
  bey23odo: at('وبيقعدوا'), shashat1: at('الشاشات'), eih2: at('إيه', 1),
  wefi: at('وفي'), akher: at('الآخر'), amalolhom: at('عملولهم'), ekhtebarat: at('اختبارات'), tafkeer: at('تفكير'), zakra: at('وذاكرة'),
  mofag: at('والمفاجأة'),
  atfal2: at('الأطفال', 1), shashat2: at('الشاشات', 1), aktar2: at('أكتر', 1), kano2: at('كانوا', 1), asra32: at('أسرع', 1),
  zakra2: at('الذاكرة'), daragat: at('ودرجاتهم'), tafkeer2: at('التفكير'), a3la: at('أعلى'),
  olama2: at('والعلماء'), etfage2o: at('اتفاجئوا'), shalo: at('فشالوا'), hesba: at('الحسبة'), zaka: at('ذكاء'), awel: at('الأول'),
  ta3leem: at('وتعليم'), ahlo: at('أهله'), barde: at('وبرضه'), tel3et: at('طلعت'), nafs: at('نفس'), nateega: at('النتيجة'),
  estanna: at('استنى'), dirasa: at('الدراسة'), ma2altesh: at('مقالتش'), mobile3: at('الموبايل', 2), khalahom: at('خلاهم'), ashtar: at('أشطر'),
  heya: at('هي'), le2et: at('لقت'), etneen: at('الاتنين'), mashyeen: at('ماشيين'), ba3d: at('بعض'),
  olama3: at('والعلماء', 1), muhem: at('المهم'), mesh: at('مش'), tefl3: at('الطفل', 1), shasha1: at('الشاشة'), eih3: at('إيه', 2),
  muhem2: at('المهم', 1), bey3mel: at('بيعمل'), aleha: at('عليها'), eih4: at('إيه', 3),
  ya3ni: at('يعني'), bayel3ab: at('بيلعب'), le3ba: at('لعبة'), betshaghal: at('بتشغل'), demagho: at('دماغه'), gheir: at('غير'), tefl5: at('طفل', 2),
  be2aleb: at('بيقلب'), videohat: at('فيديوهات'), sa3teen: at('ساعتين'), yefaker: at('يفكر'),
  naseha: at('ونصيحتهم'), wazen: at('وازن'), shasha2: at('الشاشة', 1), gary: at('والجري'), la3eb: at('واللعب'), barra: at('بره'),
  tab: at('طب'), eih5: at('إيه', 4), mobile4: at('الموبايل', 3), bawaz: at('بوظ'), atfal3: at('أطفال'), walla: at('ولا'),
  khalahom2: at('خلاهم', 1), azka: at('أذكى'), geelna: at('جيلنا'), ekteb: at('اكتبلي'), comments: at('الكومنتات'),
  fahman: at('الفهمان'), kasban: at('كسبان'),
};
// signature moments pinned to the measured audio onsets (timing.py)
T.estanna = 33.50 + VO; T.fahman = 58.15 + VO; T.kasban = 58.93 + VO;
// the mystery pause: the real silence after "والمفاجأة؟" (scribe_words.pauses.json: 21.434-21.808 s, 0.37 s)
const MYST: [number, number] = [21.434 + VO, T.atfal2];
// idle clock: idle wiggles stop during the stare from "استنى" (board held, darker)
const FREEZE: [number, number][] = [[T.estanna, T.dirasa - 0.05]];
const idle = (t: number) => t - FREEZE.reduce((a, [p0, p1]) => a + clamp(t - p0 - 0.04, 0, p1 - p0 - 0.04), 0);

// ============================================================ character
const TALKABLE: Pose[] = ['hero', 'explain', 'point_up', 'thinking', 'temple', 'thumbs_up', 'worried'];
const POSES: PoseKey[] = [
  [0, 'point_up'],              // hook: points up at the kid with the racing brain, from frame 0
  [T.kolena, 'explain'],        // "we all grew up on one sentence"
  [T.haybawaz, 'worried'],      // "the phone will ruin your brain"
  [T.bas, 'point_up'],          // Finland
  [T.taman, 'explain'],         // 8 years
  [T.kano, 'hero'],             // they recorded everything
  [T.wefi, 'explain'],          // the tests
  [T.mofag, 'thinking'],        // the mystery pause
  [T.atfal2, 'point_up'],       // the reveal
  [T.a3la, 'thumbs_up'],
  [T.olama2, 'hero'],
  [T.zaka, 'explain'],          // crossing out the two cards
  [T.nafs, 'thumbs_up'],        // same result
  [T.estanna, 'shocked'],       // signature line: shocked stare exactly on "استنى"
  [T.dirasa, 'thinking'],       // link, not cause
  [T.etneen, 'explain'],
  [T.olama3, 'point_up'],       // what matters
  [T.ya3ni, 'explain'],
  [T.be2aleb, 'worried'],       // endless scrolling
  [T.naseha, 'hero'],           // the advice
  [T.barra, 'thumbs_up'],       // balanced
  [T.tab, 'thinking'],          // the poll
  [T.ekteb, 'explain'],         // comments (arrows do the pointing down)
  [T.fahman, 'temple'],         // ending: hand on temple exactly on "الفهمان"
];
const MOUTH = mouthStates((ENV as {level: number[]}).level);
const BLINKS = blinkTimes(END, 8);

const CS = 0.6;
const CHAR_X = 540 - (CANVAS[0] * CS) / 2;
const CHAR_Y = DESK_SCREEN_Y - 1450 * CS;

// ============================================================ camera
const CAM0: Cam = {x: 520, y: 860, z: 180};
const BASE: Cam = {x: 512, y: 866, z: 125};
const NEAR: Cam = {x: 510, y: 850, z: 150};
const CAM_KEYS: CamKey[] = [
  [0, 1.0, {x: 512, y: 872, z: 120}],                              // pulls back from frame 0
  [T.kolena - 0.1, T.kolena + 0.4, BASE],
  [T.haybawaz - 0.05, T.mo5ak + 0.3, NEAR],
  [T.bas - 0.1, T.bas + 0.4, BASE],
  [T.meten - 0.05, T.tefl + 0.3, {x: 510, y: 846, z: 150}],        // the counter
  [T.fedlo - 0.1, T.fedlo + 0.4, BASE],
  [T.le7ad - 0.05, T.morahqeen + 0.4, {x: 510, y: 846, z: 150}],   // the kid grows
  [T.kano - 0.1, T.kano + 0.4, BASE],
  [T.wefi - 0.1, T.wefi + 0.4, NEAR],
  [T.mofag - 0.05, MYST[1] - 0.02, {x: 512, y: 780, z: 215}],      // slow push-in on the covered result
  [MYST[1] - 0.02, MYST[1] + 0.25, {x: 510, y: 820, z: 175}],      // the reveal
  [T.olama2 - 0.1, T.olama2 + 0.4, BASE],
  [T.nafs - 0.05, T.nateega + 0.3, NEAR],
  [T.estanna - 0.04, T.estanna + 0.1, {x: 540, y: 690, z: 280}],   // punch-in exactly on "استنى" (the board stays in frame)
  [T.dirasa - 0.1, T.dirasa + 0.4, BASE],
  [T.etneen - 0.05, T.ba3d + 0.3, NEAR],
  [T.olama3 - 0.1, T.olama3 + 0.4, BASE],
  [T.bey3mel - 0.05, T.eih4 + 0.3, NEAR],
  [T.ya3ni - 0.1, T.ya3ni + 0.4, BASE],
  [T.naseha - 0.1, T.naseha + 0.4, {x: 510, y: 846, z: 145}],
  [T.tab - 0.1, T.tab + 0.4, {x: 512, y: 866, z: 128}],
  [T.ekteb - 0.1, T.ekteb + 0.4, {x: 512, y: 868, z: 122}],
  [T.fahman - 0.1, T.fahman + 0.5, CAM0],                          // ends on the opening framing
];
const SHAKES: [number, number, number][] = [
  [T.asra3, 4, 9], [T.haybawaz, 3, 10], [T.finland, 2.5, 12], [T.morahqeen, 3, 10], [T.zakra, 2.5, 12],
  [MYST[1], 6, 7], [T.aktar2, 4, 8], [T.asra32, 7, 7], [T.a3la, 4, 8], [T.etfage2o, 3, 10], [T.awel, 3, 10], [T.ahlo, 3, 10],
  [T.nateega, 3, 10], [T.estanna, 16, 6], [T.ashtar, 4, 9], [T.eih3, 3, 10], [T.yefaker, 3, 10], [T.barra, 3, 10], [T.comments, 2.5, 12],
];

// ============================================================ drawing kit (all code)
const CHALK = '#fdf6e8', GREEN = '#43a85a', SKIN = '#e8b48a', HAIR = '#4a2c1c', BLUE = '#3d8bff', PINK = '#ff9fb8', PURPLE = '#8e5bd6';
const bump = (t: number, t0: number, a = 0.14, k = 9) => (t < t0 ? 1 : 1 + a * Math.exp(-(t - t0) * k) * Math.cos((t - t0) * 18));
type Pt = [number, number];

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
// lightning bolt (centre at 0,0, pointing down), size ~ 2r tall
const Bolt: React.FC<{x: number; y: number; r: number; rot?: number; o?: number; fill?: string}> = ({x, y, r, rot = 0, o = 1, fill = YELLOW}) => (
  <path transform={`translate(${x} ${y}) rotate(${rot}) scale(${r / 40})`} opacity={o}
    d="M 8 -40 L -20 4 L -2 4 L -10 40 L 22 -6 L 4 -6 Z" fill={fill} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
);
// a short-lived spark bolt: pops, flickers, fades (dt = time since it fired)
const Spark: React.FC<{x: number; y: number; dt: number; r?: number; rot?: number}> = ({x, y, dt, r = 26, rot = 0}) => {
  if (dt < 0 || dt > 0.32) return null;
  const s = dt < 0.06 ? easeOut(dt / 0.06) * 1.15 : 1.15 - 0.4 * seg(dt, 0.06, 0.32);
  const o = 1 - seg(dt, 0.18, 0.32);
  return <Bolt x={x} y={y} r={r * s} rot={rot} o={o} />;
};

// ---- the brain icon: a cloud of lobes with a middle groove and folds. mode: 'normal' | 'glow' | 'sleepy'
const LOBES: [number, number, number][] = [[-38, -14, 30], [-14, -30, 32], [16, -30, 32], [40, -12, 30], [34, 16, 28], [6, 22, 30], [-24, 20, 30], [-44, 8, 24]];
const Brain: React.FC<{r?: number; mode?: 'normal' | 'glow' | 'sleepy'; ti?: number; face?: boolean}> = ({r = 1, mode = 'normal', ti = 0, face = true}) => {
  const c = mode === 'sleepy' ? '#b7b0c6' : PINK, c2 = mode === 'sleepy' ? '#968fa8' : '#e9708f';
  return (
    <g transform={`scale(${r})`}>
      {mode === 'glow' && <circle r={86 + 6 * Math.sin(ti * 9)} fill={YELLOW} opacity={0.35} />}
      {mode === 'glow' && <circle r={70} fill="#fff6c2" opacity={0.45} />}
      {LOBES.map(([x, y, rr], i) => <circle key={`o${i}`} cx={x} cy={y} r={rr} fill={INK} stroke={INK} strokeWidth={14} />)}
      {LOBES.map(([x, y, rr], i) => <circle key={`f${i}`} cx={x} cy={y} r={rr} fill={c} />)}
      <path d="M 2 -52 Q -6 -28 4 -6 Q 12 14 2 44" stroke={c2} strokeWidth={6} fill="none" strokeLinecap="round" />
      <path d="M -50 -6 q 14 -10 24 4 M -34 -36 q 10 10 22 2 M 22 -40 q -6 14 10 22 M 46 4 q -16 -4 -20 10 M -30 30 q 8 -12 22 -4 M 20 34 q 4 -14 18 -10"
        stroke={c2} strokeWidth={5} fill="none" strokeLinecap="round" />
      {face && mode !== 'sleepy' && <g>
        <circle cx={-16} cy={0} r={5} fill={INK} /><circle cx={18} cy={0} r={5} fill={INK} />
        <path d="M -8 14 q 9 9 18 0" stroke={INK} strokeWidth={4.5} fill="none" strokeLinecap="round" />
      </g>}
      {face && mode === 'sleepy' && <g>
        <path d="M -24 2 q 8 6 16 0 M 10 2 q 8 6 16 0" stroke={INK} strokeWidth={4.5} fill="none" strokeLinecap="round" />
        <ellipse cx={2} cy={20} rx={6} ry={4} fill={INK} />
      </g>}
    </g>
  );
};
const Zzz: React.FC<{x: number; y: number; ti: number; s?: number}> = ({x, y, ti, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[0, 1, 2].map((i) => {
      const ph = (ti * 0.7 + i / 3) % 1;
      return <g key={i} opacity={Math.sin(ph * Math.PI)}><Txt x={ph * 50} y={-ph * 90} size={30 + 14 * ph} fill="#e9e4ff" rtl={false}>Z</Txt></g>;
    })}
  </g>
);

// ---- phone (centre at 0,0, 60x104); glow 0..1; screen = what is on it
const Phone: React.FC<{glow?: number; children?: React.ReactNode; w?: number; h?: number; screen?: string}> = ({glow = 0, children, w = 60, h = 104, screen = '#7cf2ff'}) => (
  <g>
    {glow > 0.01 && <circle r={h * 0.9} fill="#9ff7ff" opacity={0.28 * glow} />}
    {glow > 0.01 && <circle r={h * 0.6} fill="#d8fdff" opacity={0.3 * glow} />}
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={w * 0.18} fill="#2b2f3a" stroke={INK} strokeWidth={6} />
    <rect x={-w / 2 + 6} y={-h / 2 + 10} width={w - 12} height={h - 20} rx={4} fill={screen} />
    <defs><clipPath id={`scr${w}x${h}`}><rect x={-w / 2 + 6} y={-h / 2 + 10} width={w - 12} height={h - 20} rx={4} /></clipPath></defs>
    <g clipPath={`url(#scr${w}x${h})`}>{children}</g>
  </g>
);

// ---- a cartoon kid; (x, y) = feet. g: 0 = small child .. 1 = teen. arms: 'phone' (holds a phone at the chest) | 'run' | 'down'
const Kid: React.FC<{g?: number; arms?: 'phone' | 'run' | 'down' | 'ball'; shirt?: string; ti?: number; glow?: number; phase?: number; flip?: boolean}> =
({g = 0.3, arms = 'phone', shirt = '#ff8a3d', ti = 0, glow = 1, phase = 0, flip = false}) => {
  const leg = lerp(46, 104, g), body = lerp(62, 112, g), hr = lerp(40, 34, g), bw = lerp(58, 64, g);
  const hipY = -leg, shY = hipY - body, headY = shY - hr * 0.95;
  const run = arms === 'run';
  const ph = (ti * 2.4 + phase) * Math.PI * 2;
  const la = run ? Math.sin(ph) * 0.6 : 0.08, lb = run ? -Math.sin(ph) * 0.6 : -0.08;
  const legPath = (a: number, dx: number) => `M ${dx} ${hipY} L ${dx + Math.sin(a) * leg} ${hipY + Math.cos(a) * leg}`;
  const armLen = body * 0.82;
  const armPath = (a: number, dx: number) => `M ${dx} ${shY + 10} L ${dx + Math.sin(a) * armLen} ${shY + 10 + Math.cos(a) * armLen}`;
  return (
    <g transform={flip ? 'scale(-1 1)' : undefined}>
      <ellipse cx={0} cy={4} rx={bw * 0.9} ry={8} fill="#000" opacity={0.18} />
      {/* legs */}
      {[legPath(la, -12), legPath(lb, 12)].map((d, i) => <g key={i}><path d={d} stroke={INK} strokeWidth={22} strokeLinecap="round" /><path d={d} stroke="#3b4a6b" strokeWidth={12} strokeLinecap="round" /></g>)}
      {/* body (t-shirt) */}
      <rect x={-bw / 2} y={shY} width={bw} height={body + 6} rx={bw * 0.36} fill={shirt} stroke={INK} strokeWidth={6} />
      {/* arms */}
      {arms === 'run' && [armPath(-Math.sin(ph) * 0.9 + 0.3, -bw / 2 + 6), armPath(Math.sin(ph) * 0.9 - 0.3, bw / 2 - 6)].map((d, i) =>
        <g key={i}><path d={d} stroke={INK} strokeWidth={18} strokeLinecap="round" /><path d={d} stroke={SKIN} strokeWidth={9} strokeLinecap="round" /></g>)}
      {arms === 'down' && [armPath(0.25, -bw / 2 + 4), armPath(-0.25, bw / 2 - 4)].map((d, i) =>
        <g key={i}><path d={d} stroke={INK} strokeWidth={18} strokeLinecap="round" /><path d={d} stroke={SKIN} strokeWidth={9} strokeLinecap="round" /></g>)}
      {arms === 'ball' && <g>
        {[armPath(0.25, -bw / 2 + 4), armPath(-0.6, bw / 2 - 4)].map((d, i) => <g key={i}><path d={d} stroke={INK} strokeWidth={18} strokeLinecap="round" /><path d={d} stroke={SKIN} strokeWidth={9} strokeLinecap="round" /></g>)}
      </g>}
      {arms === 'phone' && <g>
        <path d={`M ${-bw / 2 + 6} ${shY + 14} Q ${-bw / 2 - 8} ${shY + body * 0.55} ${-8} ${shY + body * 0.42}`} stroke={INK} strokeWidth={18} fill="none" strokeLinecap="round" />
        <path d={`M ${bw / 2 - 6} ${shY + 14} Q ${bw / 2 + 8} ${shY + body * 0.55} ${8} ${shY + body * 0.42}`} stroke={INK} strokeWidth={18} fill="none" strokeLinecap="round" />
        <path d={`M ${-bw / 2 + 6} ${shY + 14} Q ${-bw / 2 - 8} ${shY + body * 0.55} ${-8} ${shY + body * 0.42}`} stroke={SKIN} strokeWidth={9} fill="none" strokeLinecap="round" />
        <path d={`M ${bw / 2 - 6} ${shY + 14} Q ${bw / 2 + 8} ${shY + body * 0.55} ${8} ${shY + body * 0.42}`} stroke={SKIN} strokeWidth={9} fill="none" strokeLinecap="round" />
        <g transform={`translate(0 ${shY + body * 0.3}) scale(0.62)`}><Phone glow={glow * (0.85 + 0.15 * Math.sin(ti * 11))} /></g>
      </g>}
      {/* head */}
      <circle cx={0} cy={headY} r={hr} fill={SKIN} stroke={INK} strokeWidth={6} />
      <path d={`M ${-hr - 2} ${headY - 2} Q ${-hr} ${headY - hr * 1.25} 0 ${headY - hr * 1.12} Q ${hr} ${headY - hr * 1.25} ${hr + 2} ${headY - 2} Q ${hr * 0.4} ${headY - hr * 0.7} ${-hr - 2} ${headY - 2} Z`}
        fill={HAIR} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      {arms === 'phone'
        ? <g><circle cx={-hr * 0.35} cy={headY + hr * 0.18} r={4.5} fill={INK} /><circle cx={hr * 0.35} cy={headY + hr * 0.18} r={4.5} fill={INK} />
          <path d={`M ${-hr * 0.22} ${headY + hr * 0.5} q ${hr * 0.22} ${hr * 0.18} ${hr * 0.44} 0`} stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" /></g>
        : <g><circle cx={-hr * 0.3} cy={headY + hr * 0.02} r={4.5} fill={INK} /><circle cx={hr * 0.38} cy={headY + hr * 0.02} r={4.5} fill={INK} />
          <path d={`M ${-hr * 0.25} ${headY + hr * 0.38} q ${hr * 0.3} ${hr * 0.3} ${hr * 0.6} 0`} stroke={INK} strokeWidth={4} fill="#fff" strokeLinecap="round" /></g>}
      <circle cx={-hr * 0.62} cy={headY + hr * 0.4} r={hr * 0.14} fill="#ff8f8f" opacity={0.6} />
      <circle cx={hr * 0.62} cy={headY + hr * 0.4} r={hr * 0.14} fill="#ff8f8f" opacity={0.6} />
    </g>
  );
};
const kidHeadY = (g: number) => { const leg = lerp(46, 104, g), body = lerp(62, 112, g), hr = lerp(40, 34, g); return -leg - body - hr * 0.95; };

// ---- football
const Ball: React.FC<{r?: number; rot?: number}> = ({r = 34, rot = 0}) => (
  <g transform={`rotate(${rot})`}>
    <circle r={r} fill="#fff" stroke={INK} strokeWidth={6} />
    <path d={`M 0 ${-r * 0.32} L ${r * 0.3} ${-r * 0.1} L ${r * 0.19} ${r * 0.26} L ${-r * 0.19} ${r * 0.26} L ${-r * 0.3} ${-r * 0.1} Z`} fill={INK} />
    {[0, 72, 144, 216, 288].map((a) => <path key={a} d={`M 0 ${-r * 0.32} L 0 ${-r * 0.75}`} stroke={INK} strokeWidth={4} transform={`rotate(${a})`} />)}
    {[36, 108, 180, 252, 324].map((a) => <circle key={a} cx={0} cy={-r * 0.92} r={r * 0.16} fill={INK} transform={`rotate(${a})`} />)}
  </g>
);
// ---- scientist (lab coat, glasses); (x, y) = feet; surprised: 0..1 jumps + raised hands
const Scientist: React.FC<{surprised?: number; ti?: number; point?: number}> = ({surprised = 0, ti = 0, point = 0}) => {
  const jy = -Math.abs(Math.sin(surprised * Math.PI)) * 24;
  const armA = lerp(0.4, 2.6, surprised), armB = lerp(-0.4, -2.6 + 1.2 * point, Math.max(surprised, point));
  const arm = (a: number, dx: number) => `M ${dx} -150 L ${dx + Math.sin(a) * 70} ${-150 + Math.cos(a) * 70}`;
  return (
    <g transform={`translate(0 ${jy})`}>
      <ellipse cx={0} cy={4 - jy} rx={46} ry={8} fill="#000" opacity={0.18} />
      <path d="M -14 -70 L -16 0 M 14 -70 L 16 0" stroke={INK} strokeWidth={16} strokeLinecap="round" />
      <path d="M -14 -70 L -16 0 M 14 -70 L 16 0" stroke="#3b4a6b" strokeWidth={8} strokeLinecap="round" />
      {[arm(armA, -30), arm(armB, 30)].map((d, i) => <g key={i}><path d={d} stroke={INK} strokeWidth={20} strokeLinecap="round" /><path d={d} stroke="#f7f7f2" strokeWidth={11} strokeLinecap="round" /></g>)}
      <path d="M -40 -160 L 40 -160 L 46 -60 L -46 -60 Z" fill="#f7f7f2" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d="M 0 -160 L 0 -60 M -10 -160 L 0 -128 L 10 -160" stroke="#c9cfd6" strokeWidth={4} fill="none" />
      <circle cx={0} cy={-196} r={34} fill={SKIN} stroke={INK} strokeWidth={6} />
      <path d="M -34 -200 Q -36 -236 0 -234 Q 36 -236 34 -200 Q 26 -220 0 -222 Q -26 -220 -34 -200 Z" fill="#9aa2ad" stroke={INK} strokeWidth={5} />
      <g fill="#fff" fillOpacity={0.5} stroke={INK} strokeWidth={4}><circle cx={-13} cy={-196} r={11} /><circle cx={15} cy={-196} r={11} /></g>
      <path d="M -2 -196 L 4 -196" stroke={INK} strokeWidth={4} />
      <circle cx={-13} cy={-196} r={3.5} fill={INK} /><circle cx={15} cy={-196} r={3.5} fill={INK} />
      {surprised > 0.3 ? <ellipse cx={1} cy={-174} rx={7} ry={9} fill={INK} /> : <path d="M -8 -176 q 9 7 18 0" stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />}
      {Math.sin(ti) > 2 && null}
    </g>
  );
};
// ---- comment bubble icon
const Comment: React.FC = () => (
  <g>
    <path d="M -70 -50 Q -70 -70 -50 -70 L 50 -70 Q 70 -70 70 -50 L 70 10 Q 70 30 50 30 L -10 30 L -40 56 L -34 30 L -50 30 Q -70 30 -70 10 Z" fill="#fff" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    {[-30, 0, 30].map((x) => <circle key={x} cx={x} cy={-20} r={9} fill={INK} />)}
  </g>
);
// ---- clock face; a = minute hand angle
const Clock: React.FC<{r?: number; a: number}> = ({r = 70, a}) => (
  <g>
    <circle r={r} fill="#fff" stroke={INK} strokeWidth={7} />
    {Array.from({length: 12}, (_, i) => <path key={i} d={`M 0 ${-r * 0.82} L 0 ${-r * 0.7}`} stroke={INK} strokeWidth={4} transform={`rotate(${i * 30})`} />)}
    <path d={`M 0 0 L 0 ${-r * 0.7}`} stroke={RED} strokeWidth={5} strokeLinecap="round" transform={`rotate(${a})`} />
    <path d={`M 0 0 L 0 ${-r * 0.45}`} stroke={INK} strokeWidth={7} strokeLinecap="round" transform={`rotate(${a / 12})`} />
    <circle r={6} fill={INK} />
  </g>
);
// ---- confetti (falling, spinning) over the whole board from t0
const CONF = Array.from({length: 46}, (_, i) => ({x: rand(i * 3.7) * 860, v: 120 + rand(i * 5.3) * 160, d: rand(i * 1.9) * 2.2, c: [YELLOW, RED, BLUE, GREEN, PINK, '#ff8a3d'][i % 6], s: rand(i * 8.1)}));
const Confetti: React.FC<{dt: number}> = ({dt}) => dt < 0 ? null : (
  <g>
    {CONF.map((p, i) => {
      const tt = dt - p.d * 0.25; if (tt < 0) return null;
      const y = -20 + ((tt * p.v) % 540), x = p.x + Math.sin(tt * 3 + i) * 18;
      return <rect key={i} x={-7} y={-4} width={14} height={8} fill={p.c} stroke={INK} strokeWidth={2} transform={`translate(${x} ${y}) rotate(${tt * 300 * (p.s - 0.5)})`} />;
    })}
  </g>
);

// ============================================================ board (chalkboard inset above his head)
const BX = 80, BY = 84, BW = 860, BH = 480, MID = BW / 2;
type Scene = 'hook' | 'warn' | 'finland' | 'years' | 'record' | 'tests' | 'mystery' | 'reveal' | 'cross' | 'together' | 'what' | 'split' | 'balance' | 'poll' | 'loop';
const PUSH = 0.3;
const SCENES: [number, Scene][] = [
  [0, 'hook'], [T.kolena - 0.1, 'warn'], [T.bas - 0.1, 'finland'], [T.fedlo - 0.1, 'years'], [T.kano - 0.1, 'record'], [T.wefi - 0.1, 'tests'],
  [T.mofag - 0.1, 'mystery'], [MYST[1] - 0.02, 'reveal'], [T.olama2 - 0.1, 'cross'], [T.dirasa - 0.1, 'together'], [T.olama3 - 0.1, 'what'],
  [T.ya3ni - 0.1, 'split'], [T.naseha - 0.1, 'balance'], [T.tab - 0.1, 'poll'], [T.fahman - 0.15, 'loop'],
];
type SP = {t: number; ti: number};

// ---- 0. hook: a kid with a glowing phone; a brain above his head racing faster and faster, sparking (moving from frame 0)
const SPARKS = [0.08, 0.5, 0.86, 1.18, 1.46, 1.7, 1.92, 2.12, 2.3, 2.46, 2.6, 2.72, 2.82, 2.9, 2.98, 3.06, 3.14];
const brainPhase = (t: number) => 1.6 * t + 0.9 * t * Math.abs(t); // pulse cycles; the speed grows every second
const HookScene: React.FC<SP & {loop?: boolean}> = ({t, ti, loop = false}) => {
  const ph = brainPhase(t);
  const pulse = 1 + 0.07 * Math.sin(ph * Math.PI * 2);
  const zap = loop ? 0 : popIn(t - T.asra3, 0.22);
  const g = 0.32, kx = MID, ky = 470, KS = 1.12;
  const by = ky + kidHeadY(g) * KS - 100;
  const lines = Array.from({length: 14}, (_, i) => i);
  return (
    <g>
      <defs><radialGradient id="hookbg" cx="50%" cy="40%" r="70%"><stop offset="0" stopColor="#2b3f8a" /><stop offset="1" stopColor="#0d1838" /></radialGradient></defs>
      <rect x={0} y={0} width={BW} height={BH} fill="url(#hookbg)" />
      {/* speed lines rushing out from the brain, faster with time */}
      {lines.map((i) => {
        const a = (i / lines.length) * Math.PI * 2 + 0.2, u = ((ph * 0.35 + rand(i * 4.1)) % 1 + 1) % 1;
        const r0 = 80 + u * 360, r1 = r0 + 40 + 50 * u;
        return <path key={i} d={`M ${kx + Math.cos(a) * r0} ${by + Math.sin(a) * r0 * 0.8} L ${kx + Math.cos(a) * r1} ${by + Math.sin(a) * r1 * 0.8}`}
          stroke="#9fd8ff" strokeWidth={5} strokeLinecap="round" opacity={0.65 * Math.sin(u * Math.PI)} />;
      })}
      {/* the kid */}
      <g transform={`translate(${kx} ${ky}) scale(${KS})`}><Kid g={g} arms="phone" ti={ti} shirt="#ff8a3d" glow={1.4} /></g>
      {/* glow beam phone -> brain */}
      <path d={`M ${kx - 26} ${ky + kidHeadY(g) * 1.25 + 100} L ${kx - 60} ${by + 40} L ${kx + 60} ${by + 40} L ${kx + 26} ${ky + kidHeadY(g) * 1.25 + 100} Z`} fill="#9ff7ff" opacity={0.0} />
      {/* the brain */}
      <g transform={`translate(${kx} ${by}) scale(${pulse * (1 + 0.12 * zap)})`}>
        <Brain r={1.05} mode={zap > 0.5 ? 'glow' : 'normal'} ti={ti} />
        {/* gears spinning inside the motion: little arcs racing around */}
        {[0, 1, 2].map((i) => <path key={i} d="M 0 -78 A 78 66 0 0 1 64 -38" stroke="#fff" strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.75}
          transform={`rotate(${ph * 140 + i * 120})`} />)}
      </g>
      {!loop && SPARKS.map((s, i) => {
        const a = rand(i * 9.7) * Math.PI * 2;
        return <Spark key={i} x={kx + Math.cos(a) * 118} y={by + Math.sin(a) * 82} dt={t - s} r={20 + 8 * rand(i)} rot={(a * 180) / Math.PI + 90} />;
      })}
      {zap > 0.01 && <g>
        <Bolt x={kx - 150} y={by - 10} r={46 * zap} rot={-20} />
        <Bolt x={kx + 150} y={by - 10} r={46 * zap} rot={20} />
        <Bolt x={kx + 110} y={by + 90} r={30 * zap} rot={40} />
        <Bolt x={kx - 110} y={by + 90} r={30 * zap} rot={-40} />
      </g>}
    </g>
  );
};

// ---- 1. "the phone will ruin your brain": a mom wagging her finger, a speech bubble with a phone (red ✗) and a dizzy brain
const Mom: React.FC<{wag: number}> = ({wag}) => (
  <g>
    <ellipse cx={0} cy={4} rx={56} ry={9} fill="#000" opacity={0.18} />
    <path d="M -14 -20 L -14 0 M 14 -20 L 14 0" stroke={INK} strokeWidth={14} strokeLinecap="round" />
    {/* the other arm on the hip */}
    <path d="M -34 -150 L -64 -110 L -40 -84" stroke={INK} strokeWidth={20} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M -34 -150 L -64 -110 L -40 -84" stroke={SKIN} strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M -36 -160 Q 0 -172 36 -160 L 62 -18 Q 0 -6 -62 -18 Z" fill={PURPLE} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M -16 -160 Q 0 -146 16 -160" stroke="#fff" strokeWidth={5} fill="none" />
    {/* wagging arm: shoulder -> up, finger up */}
    <g transform={`translate(34 -150) rotate(${wag})`}>
      <path d="M 0 0 L 30 -40 L 34 -96" stroke={INK} strokeWidth={20} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 0 0 L 30 -40 L 34 -96" stroke={SKIN} strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={34} cy={-100} r={12} fill={SKIN} stroke={INK} strokeWidth={5} />
      <path d="M 36 -108 L 38 -132" stroke={INK} strokeWidth={12} strokeLinecap="round" /><path d="M 36 -108 L 38 -132" stroke={SKIN} strokeWidth={5} strokeLinecap="round" />
    </g>
    <circle cx={-8} cy={-226} r={22} fill={HAIR} stroke={INK} strokeWidth={5} />
    <circle cx={0} cy={-198} r={36} fill={SKIN} stroke={INK} strokeWidth={6} />
    <path d="M -38 -196 Q -40 -240 0 -238 Q 40 -240 38 -196 Q 30 -222 0 -224 Q -30 -222 -38 -196 Z" fill={HAIR} stroke={INK} strokeWidth={5} />
    <path d="M -22 -208 L -6 -202 M 22 -208 L 6 -202" stroke={INK} strokeWidth={5} strokeLinecap="round" />
    <circle cx={-12} cy={-194} r={4.5} fill={INK} /><circle cx={12} cy={-194} r={4.5} fill={INK} />
    <ellipse cx={0} cy={-176} rx={9} ry={6} fill={INK} />
  </g>
);
const WarnScene: React.FC<SP> = ({t, ti}) => {
  const mom = popIn(t - T.kolena + 0.05, 0.3);
  const wagK = seg(t, T.kolena, T.kolena + 0.3) * (0.5 + 0.5 * seg(t, T.mobile1 - 0.2, T.mobile1 + 0.1));
  const wag = Math.sin(ti * 15) * 16 * wagK;
  const bub = popIn(t - T.gomla, 0.3), ph = popIn(t - T.mobile1, 0.28), x = popIn(t - T.haybawaz, 0.24), br = popIn(t - T.mo5ak, 0.28);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#f1d9a4" />
      {Array.from({length: 9}, (_, i) => <path key={i} d={`M ${i * 100 + 20} 0 L ${i * 100 + 20} 400`} stroke="#e6c88c" strokeWidth={18} />)}
      <rect x={0} y={400} width={BW} height={80} fill="#b8866a" stroke={INK} strokeWidth={5} />
      <g transform={`translate(680 440) scale(${1.15 * mom})`}><Mom wag={wag} /></g>
      {/* the kid, sad with the phone */}
      <g transform={`translate(${470} 440) scale(${0.9 * popIn(t - T.kolena + 0.02, 0.3)})`}><Kid g={0.25} arms="phone" ti={ti} shirt="#7cc4ff" glow={0.6} /></g>
      {bub > 0.01 && <g transform={`translate(220 190) scale(${bub})`}>
        <path d="M -170 -110 Q -180 -130 -150 -130 L 150 -130 Q 180 -130 175 -100 L 170 90 Q 170 110 140 110 L 60 110 L 120 170 L 10 110 L -150 110 Q -175 110 -172 85 Z" fill="#fff" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <g transform={`translate(-70 -10) scale(${1.25 * ph})`}><Phone glow={0} /></g>
        <Cross x={-70} y={-10} s={x} r={56} w={15} />
        {br > 0.01 && <g transform={`translate(80 -10) scale(${0.75 * br}) rotate(${Math.sin(ti * 6) * 8})`}>
          <Brain mode="sleepy" />
          <path d="M -10 -50 l 10 22 l -12 14 l 12 18" stroke={INK} strokeWidth={6} fill="none" strokeLinejoin="round" />
          {[0, 1, 2].map((i) => { const a = ti * 5 + (i * Math.PI * 2) / 3; return <path key={i} transform={`translate(${Math.cos(a) * 60} ${-70 + Math.sin(a) * 14})`} d="M 0 -10 L 3 -3 L 10 0 L 3 3 L 0 10 L -3 3 L -10 0 L -3 -3 Z" fill={YELLOW} stroke={INK} strokeWidth={2.5} />; })}
        </g>}
      </g>}
    </g>
  );
};

// ---- 2. Finland: scientists, a small flag, a "260 طفل" counter ticking up, a grid of kid heads filling
const Flag: React.FC<{ti: number; s?: number}> = ({ti, s = 1}) => {
  const W = 150, H = 96, wave = (x: number) => Math.sin(ti * 5 - x / 30) * 6 * (x / W);
  const pts = (y: number) => Array.from({length: 11}, (_, i) => [i * W / 10, y + wave(i * W / 10)] as Pt);
  const top = pts(0), bot = pts(H).reverse();
  const d = 'M ' + [...top, ...bot].map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L ') + ' Z';
  const cross = (x0: number, x1: number, y0: number, y1: number) => `M ${x0} ${y0 + wave(x0)} L ${x1} ${y0 + wave(x1)} L ${x1} ${y1 + wave(x1)} L ${x0} ${y1 + wave(x0)} Z`;
  return (
    <g transform={`scale(${s})`}>
      <path d={`M 0 -20 L 0 220`} stroke={INK} strokeWidth={12} strokeLinecap="round" /><path d={`M 0 -20 L 0 220`} stroke="#c9cfd6" strokeWidth={6} strokeLinecap="round" />
      <path d={d} fill="#fff" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d={cross(0, W, 36, 60)} fill="#1f4fa0" />
      <path d={`M 44 ${wave(44)} L 70 ${wave(70)} L 70 ${H + wave(70)} L 44 ${H + wave(44)} Z`} fill="#1f4fa0" />
      <path d={d} fill="none" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    </g>
  );
};
const FinlandScene: React.FC<SP> = ({t, ti}) => {
  const sci = popIn(t - T.olama, 0.3), flag = popIn(t - T.finland, 0.3);
  const k = easeOut(seg(t, T.meten, T.tefl + 0.35));
  const n = Math.round(260 * k);
  const cnt = popIn(t - T.meten + 0.05, 0.28) * bump(t, T.tefl, 0.12);
  const heads = Math.round(52 * k);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#cfe8ff" />
      <rect x={0} y={420} width={BW} height={60} fill="#b6d79a" stroke={INK} strokeWidth={5} />
      {/* scientists on the right */}
      <g transform={`translate(760 420) scale(${0.8 * sci})`}><Scientist ti={ti} /></g>
      <g transform={`translate(660 430) scale(${0.72 * popIn(t - T.olama - 0.12, 0.3)})`}><Scientist ti={ti + 1} /></g>
      {/* flag top-left */}
      {flag > 0.01 && <g transform={`translate(60 40) scale(${flag})`}><Flag ti={ti} /></g>}
      {/* counter */}
      {cnt > 0.01 && <g transform={`translate(380 110) scale(${cnt})`}>
        <rect x={-150} y={-62} width={300} height={124} rx={28} fill="#fffbe6" stroke={INK} strokeWidth={7} />
        <Txt x={-42} y={30} size={86} fill={INK} sw={0} anchor="middle" rtl={false}>{String(n)}</Txt>
        <Txt x={92} y={24} size={50} fill={RED} sw={0}>طفل</Txt>
      </g>}
      {/* the kids: a grid of small heads filling as the counter rises (1 head = 5 kids) */}
      {Array.from({length: heads}, (_, i) => {
        const c = i % 13, r = Math.floor(i / 13), x = 90 + c * 40, y = 240 + r * 46;
        const s = popIn(t - T.meten - i * 0.012, 0.18) * (1 + 0.04 * Math.sin(ti * 4 + i));
        return <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
          <circle r={16} fill={SKIN} stroke={INK} strokeWidth={4} />
          <path d="M -16 -2 Q -16 -20 0 -19 Q 16 -20 16 -2 Q 6 -12 -16 -2 Z" fill={[HAIR, '#c27a3a', '#1c1c1c', '#e0b050'][i % 4]} stroke={INK} strokeWidth={3} />
          <circle cx={-5} cy={2} r={2.4} fill={INK} /><circle cx={6} cy={2} r={2.4} fill={INK} />
        </g>;
      })}
    </g>
  );
};

// ---- 3. 8 years: a calendar flipping 1 -> 8, the kid growing from small to teen against a height ruler
const YearsScene: React.FC<SP> = ({t, ti}) => {
  const k = 1 + 7 * easeInOut(seg(t, T.taman, T.kamla + 0.25));
  const n = Math.floor(k + 1e-6), frac = k - n;
  const cal = popIn(t - T.fedlo + 0.05, 0.3), eight = popIn(t - T.kamla - 0.25, 0.26);
  const g = easeInOut(seg(t, T.le7ad, T.morahqeen + 0.35));
  const kid = popIn(t - T.fedlo + 0.02, 0.3) * bump(t, T.soghayareen, 0.1) * bump(t, T.morahqeen, 0.08);
  const mag = popIn(t - T.yetab3o, 0.28);
  const Page: React.FC<{num: number}> = ({num}) => (
    <g>
      <rect x={-110} y={-70} width={220} height={190} rx={12} fill="#fff" stroke={INK} strokeWidth={6} />
      <Txt x={0} y={58} size={120} fill={INK} sw={0} rtl={false}>{String(num)}</Txt>
    </g>
  );
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#e9ddc4" />
      <rect x={0} y={420} width={BW} height={60} fill="#b8866a" stroke={INK} strokeWidth={5} />
      {/* small flag in the corner keeps the place */}
      <g transform="translate(24 24) scale(0.45)"><Flag ti={ti} /></g>
      {/* height ruler behind the kid */}
      <rect x={130} y={40} width={34} height={380} fill="#ffd23f" stroke={INK} strokeWidth={5} />
      {Array.from({length: 16}, (_, i) => <path key={i} d={`M 130 ${400 - i * 24} L ${i % 2 ? 146 : 156} ${400 - i * 24}`} stroke={INK} strokeWidth={4} />)}
      {kid > 0.01 && <g transform={`translate(260 420) scale(${1.05 * kid})`}><Kid g={g} arms={g > 0.5 ? 'down' : 'phone'} ti={ti} shirt={g > 0.5 ? '#43a85a' : '#ff8a3d'} glow={0.5} /></g>}
      {/* height mark that rises with him */}
      {kid > 0.01 && <path d={`M 120 ${420 + kidHeadY(g) * 1.05 - 40 * 1.05} L 176 ${420 + kidHeadY(g) * 1.05 - 40 * 1.05}`} stroke={RED} strokeWidth={7} strokeLinecap="round" />}
      {/* the scientists' magnifier following him */}
      {mag > 0.01 && <g transform={`translate(${400 + Math.sin(ti * 2) * 14} ${200 + Math.cos(ti * 2.4) * 10}) scale(${mag}) rotate(-30)`}>
        <circle r={40} fill="#cfefff" fillOpacity={0.45} stroke={INK} strokeWidth={8} />
        <path d="M 0 40 L 0 96" stroke={INK} strokeWidth={20} strokeLinecap="round" /><path d="M 0 44 L 0 94" stroke="#8a5a33" strokeWidth={11} strokeLinecap="round" />
      </g>}
      {/* calendar on the right */}
      {cal > 0.01 && <g transform={`translate(650 190) scale(${cal})`}>
        <Page num={Math.min(8, n + (frac > 0 ? 1 : 0)) || 1} />
        {frac > 0 && n < 8 && <g transform={`translate(0 ${-frac * 60}) rotate(${-frac * 25}) scale(1 ${1 - frac * 0.6})`} opacity={1 - frac}><Page num={n} /></g>}
        <rect x={-110} y={-110} width={220} height={52} rx={12} fill={RED} stroke={INK} strokeWidth={6} />
        {[-60, 60].map((x) => <rect key={x} x={x - 8} y={-128} width={16} height={36} rx={8} fill="#c9cfd6" stroke={INK} strokeWidth={4} />)}
        <Txt x={0} y={-70} size={34} fill="#fff" sw={0}>سنة</Txt>
      </g>}
      {eight > 0.01 && <g transform={`translate(650 360) scale(${eight})`}>
        <rect x={-120} y={-34} width={240} height={68} rx={34} fill={YELLOW} stroke={INK} strokeWidth={6} />
        <Txt x={0} y={18} size={46} fill={INK} sw={0}>8 سنين</Txt>
      </g>}
    </g>
  );
};

// ---- 4. recording: a clipboard being written; two bars filling: playing/moving vs sitting in front of screens
const BAR_X1 = 640, BAR_W = 520;
const BarRow: React.FC<{y: number; fill: number; c: string; label: string; icon: React.ReactNode; s: number}> = ({y, fill, c, label, icon, s}) => s <= 0.01 ? null : (
  <g transform={`translate(0 ${y})`} opacity={Math.min(1, s)}>
    <g transform={`translate(740 40) scale(${s})`}>{icon}</g>
    <Txt x={BAR_X1} y={-30} size={36} anchor="start" fill={CHALK}>{label}</Txt>
    <rect x={BAR_X1 - BAR_W} y={0} width={BAR_W} height={46} rx={23} fill="#1b2420" stroke={INK} strokeWidth={5} />
    {fill > 0.005 && <rect x={BAR_X1 - BAR_W * fill} y={0} width={BAR_W * fill} height={46} rx={23} fill={c} stroke={INK} strokeWidth={5} />}
  </g>
);
const RecordScene: React.FC<SP> = ({t, ti}) => {
  const clip = popIn(t - T.kano + 0.05, 0.3);
  const write = seg(t, T.besagelo, T.eih2 + 0.3);
  const f1 = 0.62 * easeOut(seg(t, T.yet7arako, T.eih1 + 0.4)), f2 = 0.58 * easeOut(seg(t, T.shashat1, T.eih2 + 0.4));
  const pen = write > 0 && write < 1;
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#2c4a3e" />
      {/* clipboard top-left with lines being written */}
      {clip > 0.01 && <g transform={`translate(110 120) scale(${clip}) rotate(-6)`}>
        <rect x={-70} y={-90} width={140} height={180} rx={12} fill="#c9a27c" stroke={INK} strokeWidth={6} />
        <rect x={-56} y={-70} width={112} height={150} fill="#fff" stroke={INK} strokeWidth={4} />
        <rect x={-30} y={-102} width={60} height={26} rx={8} fill="#9aa2ad" stroke={INK} strokeWidth={4} />
        {[0, 1, 2, 3, 4].map((i) => { const u = clamp(write * 5 - i); return u > 0 ? <path key={i} d={`M 40 ${-48 + i * 26} L ${40 - 80 * u} ${-48 + i * 26}`} stroke={i % 2 ? BLUE : INK} strokeWidth={5} strokeLinecap="round" /> : null; })}
        {pen && <g transform={`translate(${40 - 80 * ((write * 5) % 1)} ${-48 + Math.min(4, Math.floor(write * 5)) * 26 - 6}) rotate(30)`}>
          <rect x={-5} y={-56} width={10} height={52} fill={YELLOW} stroke={INK} strokeWidth={3} /><path d="M -5 -4 L 0 8 L 5 -4 Z" fill={INK} />
        </g>}
      </g>}
      <BarRow y={150} fill={f1} c={GREEN} label="لعب وحركة" s={popIn(t - T.bayel3abo, 0.3)}
        icon={<g transform="scale(0.72)"><Kid g={0.3} arms="run" ti={ti} shirt="#43a85a" /></g>} />
      <BarRow y={320} fill={f2} c={BLUE} label="قدام الشاشات" s={popIn(t - T.bey23odo, 0.3)}
        icon={<g transform="scale(0.72)"><Kid g={0.3} arms="phone" ti={ti} shirt="#7cc4ff" /></g>} />
    </g>
  );
};

// ---- 5. tests: a stopwatch ticking fast and a quiz sheet with ticks
const TestsScene: React.FC<SP> = ({t, ti}) => {
  const sw = popIn(t - T.akher, 0.3), sheet = popIn(t - T.ekhtebarat, 0.3);
  const run = t > T.amalolhom ? (ti - idle(T.amalolhom)) * 720 : 0;
  const bulb = popIn(t - T.tafkeer, 0.26), brain = popIn(t - T.zakra, 0.26);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#f3e6c8" />
      <rect x={0} y={400} width={BW} height={80} fill="#c9a27c" stroke={INK} strokeWidth={5} />
      {sheet > 0.01 && <g transform={`translate(560 245) scale(${sheet}) rotate(4)`}>
        <rect x={-150} y={-190} width={300} height={380} rx={10} fill="#fff" stroke={INK} strokeWidth={7} />
        <rect x={-150} y={-190} width={300} height={60} rx={10} fill={BLUE} stroke={INK} strokeWidth={7} />
        <Txt x={0} y={-146} size={36} fill="#fff" sw={0}>اختبار</Txt>
        {[0, 1, 2, 3].map((i) => <g key={i}>
          <rect x={92} y={-110 + i * 70} width={34} height={34} rx={6} fill="#fff" stroke={INK} strokeWidth={4} />
          <path d={`M 70 ${-92 + i * 70} L -120 ${-92 + i * 70} M 70 ${-74 + i * 70} L -60 ${-74 + i * 70}`} stroke="#9aa2ad" strokeWidth={6} strokeLinecap="round" />
          {t > (i < 2 ? T.tafkeer : T.zakra) + i * 0.08 && <path d={`M 98 ${-94 + i * 70} l 8 9 l 16 -18`} stroke={GREEN} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
        </g>)}
      </g>}
      {sw > 0.01 && <g transform={`translate(230 250) scale(${sw * (1 + 0.03 * Math.sin(ti * 20) * (t > T.amalolhom ? 1 : 0))})`}>
        <rect x={-16} y={-122} width={32} height={26} rx={6} fill="#9aa2ad" stroke={INK} strokeWidth={5} />
        <path d="M 60 -84 l 18 -18" stroke={INK} strokeWidth={12} strokeLinecap="round" />
        <circle r={100} fill="#d9483b" stroke={INK} strokeWidth={8} />
        <g transform="scale(1.2)"><Clock r={70} a={run} /></g>
      </g>}
      {bulb > 0.01 && <g transform={`translate(780 90) scale(${bulb})`}>
        <circle r={40} fill={YELLOW} opacity={0.4} />
        <circle cy={-6} r={28} fill="#fff6c2" stroke={INK} strokeWidth={5} />
        <rect x={-14} y={18} width={28} height={20} rx={4} fill="#9aa2ad" stroke={INK} strokeWidth={4} />
      </g>}
      {brain > 0.01 && <g transform={`translate(780 220) scale(${0.62 * brain})`}><Brain ti={ti} /></g>}
    </g>
  );
};

// ---- 6/7. the result chart: two columns (moving kid / screen kid). mystery = covered with a cloth and a "؟"; reveal = colourful
const CH_BASE = 410, CH_H = 300, COL_RUN = 220, COL_SCR = 470, COL_W = 130;
const Columns: React.FC<{hRun: number; hScr: number; ti: number}> = ({hRun, hScr, ti}) => (
  <g>
    {[[COL_RUN, hRun, GREEN], [COL_SCR, hScr, BLUE]].map(([x, h, c]) => <g key={String(x)}>
      <rect x={(x as number) - COL_W / 2} y={CH_BASE - CH_H * (h as number)} width={COL_W} height={CH_H * (h as number) + 4} rx={12} fill={c as string} stroke={INK} strokeWidth={7} />
      <rect x={(x as number) - COL_W / 2 + 14} y={CH_BASE - CH_H * (h as number) + 14} width={18} height={Math.max(0, CH_H * (h as number) - 28)} rx={9} fill="#fff" opacity={0.35} />
    </g>)}
    <path d={`M 80 ${CH_BASE} L 620 ${CH_BASE}`} stroke={INK} strokeWidth={8} strokeLinecap="round" />
    <g transform={`translate(${COL_RUN} ${CH_BASE + 62}) scale(0.32)`}><Kid g={0.3} arms="run" ti={ti} shirt="#43a85a" /></g>
    <g transform={`translate(${COL_SCR} ${CH_BASE + 62}) scale(0.32)`}><Kid g={0.3} arms="phone" ti={ti} shirt="#7cc4ff" /></g>
  </g>
);
const MysteryScene: React.FC<SP> = ({t, ti}) => {
  const q = popIn(t - T.mofag, 0.3);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#1d2440" />
      <Columns hRun={0.5} hScr={0.5} ti={ti} />
      {/* the cloth over the columns */}
      <path d={`M 120 ${CH_BASE} Q 130 120 345 90 Q 560 120 570 ${CH_BASE} Q 500 ${CH_BASE - 16} 440 ${CH_BASE} Q 380 ${CH_BASE - 16} 345 ${CH_BASE} Q 300 ${CH_BASE - 16} 250 ${CH_BASE} Q 190 ${CH_BASE - 16} 120 ${CH_BASE} Z`}
        fill="#8a5a33" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <path d="M 220 150 Q 250 300 240 400 M 345 100 Q 350 260 345 400 M 470 150 Q 440 300 450 400" stroke="#6b4325" strokeWidth={6} fill="none" />
      <QMark x={720} y={330} size={260} s={q * (1 + 0.05 * Math.sin(ti * 6))} rot={Math.sin(ti * 3) * 8} />
    </g>
  );
};
const RevealScene: React.FC<SP> = ({t, ti}) => {
  const hRun = 0.42;
  const shoot = t < T.aktar2 ? 0.45 + 0.03 * seg(t, MYST[1], T.aktar2) : 0.48 + 0.47 * easeOut(seg(t, T.aktar2, T.aktar2 + 0.35));
  const over = t > T.aktar2 ? 0.05 * Math.exp(-(t - T.aktar2 - 0.35) * 5) * Math.sin((t - T.aktar2) * 20) * (t > T.aktar2 + 0.35 ? 1 : 0) : 0;
  const hScr = shoot + over;
  const fast = popIn(t - T.asra32, 0.26), brain = popIn(t - T.aktar2 - 0.1, 0.3);
  const card = popIn(t - T.daragat, 0.28), up = popIn(t - T.a3la, 0.26);
  const rays = 16, rot = ti * 18;
  const topY = CH_BASE - CH_H * hScr;
  return (
    <g>
      {/* the most colourful beat: rotating multicolour rays + confetti */}
      <rect x={0} y={0} width={BW} height={BH} fill="#ffcf4a" />
      <g transform={`translate(${COL_SCR} ${topY}) rotate(${rot})`}>
        {Array.from({length: rays}, (_, i) => <path key={i} d="M 0 0 L 900 -110 L 900 110 Z" fill={['#ff7aa8', '#7cd4ff', '#a5e86a', '#ffa94d'][i % 4]} opacity={0.75} transform={`rotate(${(i * 360) / rays})`} />)}
      </g>
      <Confetti dt={t - T.aktar2} />
      <Columns hRun={hRun} hScr={hScr} ti={ti} />
      {/* lightning brain over the screen column */}
      {brain > 0.01 && <g transform={`translate(${COL_SCR + 10} ${topY - 74}) scale(${0.72 * brain * bump(t, T.asra32, 0.16)})`}>
        <Brain mode="glow" ti={ti} />
      </g>}
      {brain > 0.01 && [0, 1, 2, 3].map((i) => <Spark key={i} x={COL_SCR + [-120, 130, -90, 110][i]} y={topY - [60, 40, 130, 140][i]} dt={((t - T.aktar2 - 0.1 - i * 0.13) % 0.5 + 0.5) % 0.5} r={30} rot={[-30, 30, -60, 60][i]} />)}
      {fast > 0.01 && <g transform={`translate(680 150) scale(${fast}) rotate(-6)`}>
        <Bolt x={-160} y={0} r={56} rot={-14} />
        <Txt x={30} y={44} size={124} fill={YELLOW} sw={0.13}>أسرع</Txt>
      </g>}
      {card > 0.01 && <g transform={`translate(730 330) scale(${card})`}>
        <rect x={-100} y={-70} width={200} height={140} rx={16} fill="#fff" stroke={INK} strokeWidth={7} />
        {[0, 1, 2].map((i) => <path key={i} d={`M 80 ${-36 + i * 32} L ${-20 + i * 10} ${-36 + i * 32}`} stroke="#9aa2ad" strokeWidth={8} strokeLinecap="round" />)}
        {[0, 1, 2].map((i) => <path key={`s${i}`} transform={`translate(${-62 + i * 0} ${-36 + i * 32}) scale(0.8)`} d="M 0 -14 L 4 -4 L 14 -4 L 6 3 L 9 14 L 0 7 L -9 14 L -6 3 L -14 -4 L -4 -4 Z" fill={YELLOW} stroke={INK} strokeWidth={3} />)}
        {up > 0.01 && <g transform={`translate(-150 0) scale(${up})`}>
          <path d="M 0 -64 L 44 -10 L 18 -10 L 18 60 L -18 60 L -18 -10 L -44 -10 Z" fill={GREEN} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        </g>}
      </g>}
    </g>
  );
};

// ---- 8. they removed the IQ-from-the-start and the parents' education from the sum: two cards crossed out, the result stays ✓
const Card: React.FC<{txt: string; c: string; cross: number}> = ({txt, c, cross}) => (
  <g>
    <rect x={-160} y={-46} width={320} height={92} rx={18} fill={c} stroke={INK} strokeWidth={7} />
    <Txt x={0} y={16} size={44} fill={INK} sw={0}>{txt}</Txt>
    {cross > 0.01 && <g>
      <path d={`M -170 30 L ${-170 + 340 * cross} ${30 - 60 * cross}`} stroke={INK} strokeWidth={22} strokeLinecap="round" />
      <path d={`M -170 30 L ${-170 + 340 * cross} ${30 - 60 * cross}`} stroke={RED} strokeWidth={12} strokeLinecap="round" />
    </g>}
  </g>
);
const CrossScene: React.FC<SP> = ({t, ti}) => {
  const sci = popIn(t - T.olama2 + 0.05, 0.3);
  const sur = t < T.etfage2o ? 0 : Math.min(1, (t - T.etfage2o) / 0.35) * (1 - seg(t, T.etfage2o + 0.8, T.etfage2o + 1.2));
  const frame = popIn(t - T.shalo, 0.3);
  const c1 = popIn(t - T.zaka, 0.28), x1 = easeOut(seg(t, T.awel, T.awel + 0.25));
  const c2 = popIn(t - T.ta3leem, 0.28), x2 = easeOut(seg(t, T.ahlo, T.ahlo + 0.25));
  const chart = popIn(t - T.barde, 0.3) * bump(t, T.nafs, 0.12), ok = popIn(t - T.nateega, 0.26);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#dfe9f2" />
      <rect x={0} y={420} width={BW} height={60} fill="#b8c7d4" stroke={INK} strokeWidth={5} />
      <g transform={`translate(760 430) scale(${0.85 * sci})`}><Scientist surprised={sur} ti={ti} /></g>
      {sur > 0.2 && <Txt x={800} y={170} size={90} fill={RED}>!</Txt>}
      {frame > 0.01 && <g transform={`translate(420 225) scale(${frame})`}>
        <rect x={-200} y={-185} width={400} height={370} rx={22} fill="#fff" fillOpacity={0.6} stroke={INK} strokeWidth={5} strokeDasharray="18 12" />
        <Txt x={0} y={-140} size={38} fill={INK} sw={0}>الحسبة</Txt>
      </g>}
      {c1 > 0.01 && <g transform={`translate(420 ${150 + 6 * x1}) scale(${c1}) rotate(${-3 * x1})`} opacity={1 - 0.35 * x1}><Card txt="ذكاء من الأول" c="#ffd9a8" cross={x1} /></g>}
      {c2 > 0.01 && <g transform={`translate(420 ${290 + 6 * x2}) scale(${c2}) rotate(${3 * x2})`} opacity={1 - 0.35 * x2}><Card txt="تعليم الأهل" c="#cfe0ff" cross={x2} /></g>}
      {/* the result: the same mini chart, still screen-kid higher */}
      {chart > 0.01 && <g transform={`translate(120 ${360}) scale(${chart})`}>
        <rect x={-80} y={-160} width={160} height={190} rx={14} fill="#fff" stroke={INK} strokeWidth={6} />
        <rect x={-56} y={-50} width={44} height={70} rx={6} fill={GREEN} stroke={INK} strokeWidth={5} />
        <rect x={12} y={-130} width={44} height={150} rx={6} fill={BLUE} stroke={INK} strokeWidth={5} />
      </g>}
      <Check x={170} y={190} s={ok} r={40} />
    </g>
  );
};

// ---- 9. not cause, a link: phone -> brain arrow gets a ✗; then two arrows walking side by side
const Arrow: React.FC<{len: number; c: string}> = ({len, c}) => (
  <path d={`M 0 0 L 46 -42 L 46 -20 L ${len} -20 L ${len} 20 L 46 20 L 46 42 Z`} fill={c} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
);
const WalkArrow: React.FC<{c: string; icon: React.ReactNode; ti: number; phase: number}> = ({c, icon, ti, phase}) => {
  const p = (ti * 2.6 + phase) * Math.PI * 2;
  const leg = (a: number, x: number) => <path d={`M ${x} 20 L ${x + Math.sin(a) * 30} ${20 + Math.cos(a) * 34}`} stroke={INK} strokeWidth={9} strokeLinecap="round" />;
  return (
    <g transform={`translate(0 ${-Math.abs(Math.sin(p)) * 8})`}>
      {leg(Math.sin(p) * 0.6, 110)}{leg(-Math.sin(p) * 0.6, 150)}{leg(Math.sin(p) * 0.6, 200)}{leg(-Math.sin(p) * 0.6, 240)}
      <Arrow len={300} c={c} />
      <g transform="translate(200 0)">{icon}</g>
    </g>
  );
};
const TogetherScene: React.FC<SP> = ({t, ti}) => {
  const doc = popIn(t - T.dirasa + 0.05, 0.3);
  const ph = popIn(t - T.mobile3, 0.28), arr = easeOut(seg(t, T.khalahom - 0.1, T.khalahom + 0.3)), sb = popIn(t - T.khalahom + 0.05, 0.28), no = popIn(t - T.ashtar, 0.26);
  const out = easeIn(seg(t, T.heya, T.heya + 0.35));
  const walk = popIn(t - T.etneen, 0.3), go = Math.max(0, t - T.mashyeen) * 40;
  const ok = popIn(t - T.ba3d, 0.26);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#fdf1d6" />
      {doc > 0.01 && <g transform={`translate(${BW - 90} 90) scale(${doc * 0.9}) rotate(6)`}>
        <rect x={-56} y={-70} width={112} height={140} rx={8} fill="#fff" stroke={INK} strokeWidth={6} />
        {[0, 1, 2, 3].map((i) => <path key={i} d={`M 36 ${-36 + i * 24} L -36 ${-36 + i * 24}`} stroke="#9aa2ad" strokeWidth={6} strokeLinecap="round" />)}
        <circle cx={-30} cy={46} r={14} fill={RED} stroke={INK} strokeWidth={4} />
      </g>}
      {/* causal chain (what the study did NOT say) */}
      <g transform={`translate(0 ${-out * 300})`} opacity={1 - out}>
        {ph > 0.01 && <g transform={`translate(640 250) scale(${1.4 * ph})`}><Phone glow={0.5} /></g>}
        {arr > 0.01 && <g transform={`translate(${560 - 260 * arr} 250)`}><Arrow len={260 * arr} c="#c9cfd6" /></g>}
        {sb > 0.01 && <g transform={`translate(200 250) scale(${0.95 * sb})`}><Brain mode="glow" ti={ti} /></g>}
        <Cross x={420} y={250} s={no} r={70} w={20} />
      </g>
      {/* the link: two arrows walking side by side (neither pushes the other) */}
      {walk > 0.01 && <g transform={`translate(${250 - go} 0) scale(${walk})`}>
        <g transform="translate(0 170)"><WalkArrow c={BLUE} ti={ti} phase={0} icon={<g transform="scale(0.55)"><Phone glow={0.4} /></g>} /></g>
        <g transform="translate(0 345)"><WalkArrow c={PINK} ti={ti} phase={0} icon={<g transform="scale(0.42)"><Brain ti={ti} face={false} /></g>} /></g>
      </g>}
      {ok > 0.01 && <g transform={`translate(${720} 260) scale(${ok})`}>
        <rect x={-56} y={-56} width={112} height={112} rx={24} fill={YELLOW} stroke={INK} strokeWidth={7} />
        <path d="M -30 -14 L 30 -14 M -30 14 L 30 14" stroke={INK} strokeWidth={12} strokeLinecap="round" />
      </g>}
    </g>
  );
};

// ---- 10. what matters is not how long, it is what he does: a spinning clock (✗) vs a phone under a magnifier (؟)
const WhatScene: React.FC<SP> = ({t, ti}) => {
  const clk = popIn(t - T.olama3 + 0.05, 0.3) * bump(t, T.muhem, 0.1);
  const kid = popIn(t - T.tefl3, 0.28), no = popIn(t - T.eih3, 0.26);
  const ph = popIn(t - T.bey3mel, 0.3), mag = popIn(t - T.aleha, 0.28), q = popIn(t - T.eih4, 0.26);
  const fade = 0.55 * seg(t, T.muhem2, T.muhem2 + 0.3);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#2c3d55" />
      <path d={`M ${MID} 30 L ${MID} ${BH - 30}`} stroke="#5d7090" strokeWidth={6} strokeDasharray="16 14" />
      <g opacity={1 - fade}>
        {clk > 0.01 && <g transform={`translate(650 200) scale(${clk})`}><Clock r={110} a={ti * 900} /></g>}
        {kid > 0.01 && <g transform={`translate(650 450) scale(${0.62 * kid})`}><Kid g={0.3} arms="phone" ti={ti} shirt="#7cc4ff" /></g>}
      </g>
      <Cross x={650} y={200} s={no} r={90} w={22} />
      {ph > 0.01 && <g transform={`translate(230 250) scale(${2.4 * ph})`}>
        <Phone glow={0.3} screen="#e9f6ff">
          {[0, 1, 2].map((i) => <rect key={i} x={-18} y={-38 + i * 26} width={36} height={20} rx={4} fill={[GREEN, RED, YELLOW][i]} stroke={INK} strokeWidth={2} />)}
        </Phone>
      </g>}
      {mag > 0.01 && <g transform={`translate(${280 + Math.sin(ti * 2.2) * 30} ${220 + Math.cos(ti * 1.8) * 24}) scale(${mag}) rotate(-35)`}>
        <circle r={64} fill="#cfefff" fillOpacity={0.4} stroke={INK} strokeWidth={10} />
        <path d="M 0 64 L 0 150" stroke={INK} strokeWidth={26} strokeLinecap="round" /><path d="M 0 70 L 0 146" stroke="#8a5a33" strokeWidth={14} strokeLinecap="round" />
      </g>}
      <QMark x={110} y={150} size={150} s={q} rot={-10} />
    </g>
  );
};

// ---- 11. split: right = a puzzle game + a glowing brain ✓; left = endless scrolling + a sleepy brain ✗
const SplitScene: React.FC<SP> = ({t, ti}) => {
  const p1 = popIn(t - T.bayel3ab, 0.3), pieces = [T.le3ba, T.le3ba + 0.12, T.le3ba + 0.24, T.betshaghal].map((s) => easeOut(seg(t, s, s + 0.25)));
  const glow = popIn(t - T.betshaghal, 0.28), ok = popIn(t - T.demagho, 0.26);
  const p2 = popIn(t - T.be2aleb, 0.3), scroll = t > T.be2aleb ? (ti - idle(T.be2aleb)) * 160 : 0;
  const sleepy = popIn(t - T.videohat, 0.28), clk = popIn(t - T.sa3teen, 0.26), no = popIn(t - T.yefaker, 0.26);
  const tiles = ['#ff7aa8', '#7cd4ff', '#ffd23f', '#a5e86a', '#ffa94d', '#b9a8ff'];
  return (
    <g>
      <rect x={MID} y={0} width={MID} height={BH} fill="#cdeccf" />
      <rect x={0} y={0} width={MID} height={BH} fill="#c9c3d6" />
      <path d={`M ${MID} 0 L ${MID} ${BH}`} stroke={INK} strokeWidth={8} />
      {/* right: the puzzle */}
      {p1 > 0.01 && <g transform={`translate(650 320) scale(${1.9 * p1})`}>
        <Phone glow={0.2} screen="#fffbe6">
          {[[-11, -22], [11, -22], [-11, 0], [11, 0]].map(([x, y], i) => {
            const u = pieces[i];
            return <rect key={i} x={x - 10 + (1 - u) * (i % 2 ? 30 : -30)} y={y - 10 + (1 - u) * 20} width={20} height={20} rx={3} fill={tiles[i]} stroke={INK} strokeWidth={2} opacity={u > 0 ? 1 : 0} />;
          })}
          {glow > 0.5 && <rect x={-21} y={-32} width={42} height={42} rx={4} fill="none" stroke={GREEN} strokeWidth={3} />}
        </Phone>
      </g>}
      {p1 > 0.01 && <g transform={`translate(650 112) scale(${0.62 * p1 * bump(t, T.betshaghal, 0.14)})`}>
        <Brain mode={glow > 0.5 ? 'glow' : 'normal'} ti={ti} />
        {glow > 0.5 && [0, 1, 2].map((i) => <path key={i} d="M 0 -70 A 70 60 0 0 1 56 -34" stroke="#fff" strokeWidth={6} fill="none" strokeLinecap="round" transform={`rotate(${ti * 260 + i * 120})`} />)}
      </g>}
      {glow > 0.5 && [0, 1].map((i) => <Spark key={i} x={650 + (i ? 80 : -80)} y={80} dt={((t - T.betshaghal - i * 0.2) % 0.6 + 0.6) % 0.6} r={22} rot={i ? 30 : -30} />)}
      <Check x={790} y={60} s={ok} r={38} />
      {/* left: the endless feed */}
      {p2 > 0.01 && <g transform={`translate(210 320) scale(${1.9 * p2})`}>
        <Phone glow={0.15} screen="#2b2f3a">
          {Array.from({length: 6}, (_, i) => {
            const y = ((i * 28 - scroll / 1.9) % 168 + 168) % 168 - 70;
            return <g key={i} transform={`translate(0 ${y})`}>
              <rect x={-21} y={-11} width={42} height={24} rx={3} fill={tiles[(i + 2) % 6]} />
              <path d="M -4 -6 L 6 1 L -4 8 Z" fill="#fff" />
            </g>;
          })}
        </Phone>
      </g>}
      {sleepy > 0.01 && <g transform={`translate(210 112) scale(${0.62 * sleepy}) rotate(${Math.sin(ti * 1.5) * 6})`}><Brain mode="sleepy" ti={ti} /></g>}
      {sleepy > 0.01 && <Zzz x={280} y={80} ti={ti} s={sleepy} />}
      {clk > 0.01 && <g transform={`translate(330 330) scale(${0.5 * clk})`}><Clock r={70} a={ti * 600} /></g>}
      <Cross x={70} y={60} s={no} r={34} w={13} />
    </g>
  );
};

// ---- 12. balance: a scale with a phone on one pan and a football on the other, settling level ✓
const BalanceScene: React.FC<SP> = ({t, ti}) => {
  const sc = popIn(t - T.naseha + 0.05, 0.3);
  const ph = popIn(t - T.shasha2, 0.24), ball = popIn(t - T.gary, 0.24), sun = popIn(t - T.la3eb, 0.28), ok = popIn(t - T.barra, 0.26);
  // beam angle (deg, + = right side down): wobble on "وازن", tips right with the phone, swings back with the ball, settles level
  let a = 0;
  if (t > T.wazen) a += 6 * Math.sin((t - T.wazen) * 9) * Math.exp(-(t - T.wazen) * 3) * (t < T.shasha2 ? 1 : 0);
  if (t > T.shasha2) a += 14 * easeOut(clamp((t - T.shasha2) / 0.3));
  if (t > T.gary) a -= 14 * (1 - Math.exp(-(t - T.gary) * 4) * Math.cos((t - T.gary) * 9));
  const rad = (a * Math.PI) / 180, L = 250, cx = MID, cy = 170;
  const endR: Pt = [cx + L * Math.cos(rad), cy + L * Math.sin(rad)], endL: Pt = [cx - L * Math.cos(rad), cy - L * Math.sin(rad)];
  const Pan: React.FC<{p: Pt; children?: React.ReactNode}> = ({p, children}) => (
    <g transform={`translate(${p[0]} ${p[1]})`}>
      <path d="M 0 0 L -80 110 M 0 0 L 80 110" stroke={INK} strokeWidth={4} />
      <path d="M -100 110 Q 0 160 100 110 Z" fill="#c9a46a" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <g transform="translate(0 104)">{children}</g>
    </g>
  );
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#bfe3ff" />
      {sun > 0.01 && <g transform={`translate(110 90) scale(${sun}) rotate(${ti * 30})`}>
        {Array.from({length: 10}, (_, i) => <path key={i} d="M 0 -62 L 0 -82" stroke="#ffb43a" strokeWidth={8} strokeLinecap="round" transform={`rotate(${i * 36})`} />)}
        <circle r={46} fill={YELLOW} stroke={INK} strokeWidth={6} />
      </g>}
      <rect x={0} y={410} width={BW} height={70} fill="#7cc24f" stroke={INK} strokeWidth={5} />
      {sc > 0.01 && <g transform={`translate(${cx} ${cy}) scale(${sc}) translate(${-cx} ${-cy})`}>
        <path d={`M ${cx - 90} 420 L ${cx + 90} 420 L ${cx + 30} 390 L ${cx - 30} 390 Z`} fill="#8a5a33" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <rect x={cx - 14} y={cy} width={28} height={220} fill="#a8703f" stroke={INK} strokeWidth={6} />
        <path d={`M ${endL[0]} ${endL[1]} L ${endR[0]} ${endR[1]}`} stroke={INK} strokeWidth={22} strokeLinecap="round" />
        <path d={`M ${endL[0]} ${endL[1]} L ${endR[0]} ${endR[1]}`} stroke="#c9a46a" strokeWidth={12} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={18} fill={YELLOW} stroke={INK} strokeWidth={6} />
        <Pan p={endR}>{ph > 0.01 && <g transform={`translate(0 ${-52 * ph}) scale(${ph}) rotate(80)`}><Phone glow={0.4} /></g>}</Pan>
        <Pan p={endL}>{ball > 0.01 && <g transform={`translate(0 ${-36}) scale(${ball})`}><Ball r={34} rot={ti * 40} /></g>}</Pan>
      </g>}
      <Check x={cx} y={70} s={ok} r={40} />
      <Sparkle x={cx + 60} y={60} dt={t - T.barra} r={36} />
    </g>
  );
};

// ---- 13. the poll: "بوّظهم 📉" (right) / "خلّاهم أذكى 📈" (left), a "؟" and a comment bubble
const MiniChart: React.FC<{up: boolean; k: number}> = ({up, k}) => {
  const pts: Pt[] = up ? [[-60, 40], [-20, 10], [10, 20], [60, -40]] : [[-60, -40], [-20, -10], [10, -20], [60, 40]];
  const n = Math.max(1, Math.ceil(k * 3));
  const seg3 = pts.slice(0, n + 1);
  const c = up ? GREEN : RED;
  return (
    <g>
      <rect x={-80} y={-60} width={160} height={120} rx={12} fill="#fff" stroke={INK} strokeWidth={6} />
      <path d={'M ' + seg3.map(([x, y]) => `${x} ${y}`).join(' L ')} stroke={INK} strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={'M ' + seg3.map(([x, y]) => `${x} ${y}`).join(' L ')} stroke={c} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {k >= 1 && <path d={up ? 'M 60 -40 l -26 2 l 18 18 Z' : 'M 60 40 l -26 -2 l 18 -18 Z'} fill={c} stroke={INK} strokeWidth={4} strokeLinejoin="round" />}
    </g>
  );
};
const PollScene: React.FC<SP> = ({t, ti}) => {
  const q = popIn(t - T.tab + 0.05, 0.3) * bump(t, T.eih5, 0.12);
  const right = popIn(t - T.bawaz, 0.28), left = popIn(t - T.khalahom2, 0.28);
  const kr = seg(t, T.bawaz + 0.1, T.atfal3 + 0.4), kl = seg(t, T.khalahom2 + 0.1, T.azka + 0.4);
  const cm = popIn(t - T.ekteb, 0.28);
  return (
    <g>
      <rect x={MID} y={0} width={MID} height={BH} fill="#ffd9d4" />
      <rect x={0} y={0} width={MID} height={BH} fill="#d6f5d0" />
      <path d={`M ${MID} 0 L ${MID} ${BH}`} stroke={INK} strokeWidth={8} />
      {right > 0.01 && <g transform={`translate(${MID + MID / 2} 190) scale(${right})`}>
        <MiniChart up={false} k={kr} />
        <Txt x={0} y={150} size={64} fill={RED}>بوّظهم</Txt>
      </g>}
      {left > 0.01 && <g transform={`translate(${MID / 2} 190) scale(${left})`}>
        <MiniChart up k={kl} />
        <Txt x={0} y={150} size={64} fill={GREEN}>خلّاهم أذكى</Txt>
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
      {s === 'warn' && <WarnScene t={t} ti={ti} />}
      {s === 'finland' && <FinlandScene t={t} ti={ti} />}
      {s === 'years' && <YearsScene t={t} ti={ti} />}
      {s === 'record' && <RecordScene t={t} ti={ti} />}
      {s === 'tests' && <TestsScene t={t} ti={ti} />}
      {s === 'mystery' && <MysteryScene t={t} ti={ti} />}
      {s === 'reveal' && <RevealScene t={t} ti={ti} />}
      {s === 'cross' && <CrossScene t={t} ti={ti} />}
      {s === 'together' && <TogetherScene t={t} ti={ti} />}
      {s === 'what' && <WhatScene t={t} ti={ti} />}
      {s === 'split' && <SplitScene t={t} ti={ti} />}
      {s === 'balance' && <BalanceScene t={t} ti={ti} />}
      {s === 'poll' && <PollScene t={t} ti={ti} />}
      {/* the hook drawing again, running into its frame-0 state at the last frame (loop) */}
      {s === 'loop' && <HookScene t={t - END} ti={t - END} loop />}
    </g>
  );
  // the cloth flies off in place (no push): a quick white flash
  const flash = 1 - seg(t, MYST[1] - 0.02, MYST[1] + 0.25);
  const isReveal = scene === 'reveal' && prev === 'mystery';
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
const TICK = 'screens/sfx/tick';
const flipTimes = Array.from({length: 7}, (_, i) => {
  // the moments the calendar page changes (k crosses 2..8)
  const target = (i + 1) / 7; let lo = 0, hi = 1;
  for (let j = 0; j < 30; j++) { const m = (lo + hi) / 2; if (easeInOut(m) < target) lo = m; else hi = m; }
  return lerp(T.taman, T.kamla + 0.25, lo);
});
const SFX: Cue[] = [
  // hook: sparks from frame 0, a zap on "أسرع"
  [0, 'twinkle', 0.12], ...SPARKS.filter((s) => s < 2.8).map((s, i): Cue => [s, 'click', 0.1 + 0.015 * (i % 4)]), [T.asra3, 'sparkle', 0.26], [T.asra3, 'tremble', 0.12],
  // warning
  [T.kolena - 0.05, 'pop', 0.18], [T.gomla, 'pop', 0.18], [T.mobile1, 'pop', 0.16], [T.haybawaz, 'thud', 0.24], [T.mo5ak, 'boing', 0.16],
  // Finland
  [T.olama, 'pop', 0.14], [T.finland, 'whoosh', 0.14], [T.meten, 'pop', 0.16], ...Array.from({length: 10}, (_, i): Cue => [T.meten + i * ((T.tefl + 0.3 - T.meten) / 10), 'click', 0.12]),
  [T.tefl, 'ding', 0.18],
  // years
  [T.fedlo - 0.05, 'pop', 0.14], [T.yetab3o, 'swish', 0.12], ...flipTimes.map((s): Cue => [s, 'swish', 0.1]), [T.kamla, 'ding', 0.16], [T.soghayareen, 'pop', 0.14], [T.morahqeen, 'boing', 0.16],
  // record
  [T.kano - 0.05, 'pop', 0.16], [T.besagelo, 'click', 0.14], [T.bayel3abo, 'step', 0.16], [T.yet7arako, 'whoosh', 0.12], [T.bey23odo, 'pop', 0.14], [T.shashat1, 'whoosh', 0.12],
  // tests
  [T.akher, 'pop', 0.16], ...Array.from({length: 6}, (_, i): Cue => [T.amalolhom + i * 0.25, TICK, 0.18]), [T.ekhtebarat, 'pop', 0.16], [T.tafkeer, 'ding', 0.14], [T.zakra, 'pop', 0.16],
  // mystery and the reveal
  [T.mofag, 'pop', 0.14], [MYST[1], 'whoosh', 0.18], [T.aktar2, 'whoosh', 0.2], [T.aktar2 + 0.1, 'sparkle', 0.22], [T.asra32, 'tremble', 0.14], [T.asra32, 'twinkle', 0.24],
  [T.daragat, 'pop', 0.16], [T.a3la, 'ding', 0.22],
  // cross out
  [T.olama2 - 0.05, 'pop', 0.14], [T.etfage2o, 'boing', 0.18], [T.shalo, 'pop', 0.14], [T.zaka, 'pop', 0.16], [T.awel, 'swish', 0.2], [T.ta3leem, 'pop', 0.16], [T.ahlo, 'swish', 0.2],
  [T.barde, 'pop', 0.14], [T.nateega, 'ding', 0.22],
  // signature: stinger exactly on "استنى"
  [T.estanna, 'stinger', 0.34],
  // together
  [T.dirasa - 0.05, 'pop', 0.14], [T.mobile3, 'pop', 0.16], [T.khalahom, 'whoosh', 0.14], [T.ashtar, 'thud', 0.22], [T.heya, 'swish', 0.14], [T.etneen, 'pop', 0.16],
  ...Array.from({length: 4}, (_, i): Cue => [T.mashyeen + i * 0.19, 'step', 0.1]), [T.ba3d, 'ding', 0.16],
  // what matters
  [T.olama3 - 0.05, 'pop', 0.14], ...Array.from({length: 4}, (_, i): Cue => [T.mesh + i * 0.3, TICK, 0.14]), [T.tefl3, 'pop', 0.14], [T.eih3, 'thud', 0.2], [T.bey3mel, 'pop', 0.16], [T.aleha, 'swish', 0.12], [T.eih4, 'pop', 0.16],
  // split
  [T.bayel3ab, 'pop', 0.14], [T.le3ba, 'click', 0.14], [T.le3ba + 0.12, 'click', 0.14], [T.le3ba + 0.24, 'click', 0.14], [T.betshaghal, 'sparkle', 0.2], [T.demagho, 'ding', 0.2],
  [T.be2aleb, 'pop', 0.14], [T.videohat, 'swish', 0.1], [T.sa3teen, TICK, 0.16], [T.yefaker, 'thud', 0.2],
  // balance
  [T.naseha - 0.05, 'pop', 0.14], [T.wazen, 'squish', 0.12], [T.shasha2, 'thud', 0.2], [T.gary, 'boing', 0.18], [T.la3eb, 'twinkle', 0.14], [T.barra, 'ding', 0.22],
  // poll + comments
  [T.tab - 0.1, 'swish', 0.2], [T.tab, 'pop', 0.18], [T.bawaz, 'pop', 0.18], [T.khalahom2, 'pop', 0.18], [T.ekteb, 'pop', 0.24], [T.comments, 'boing', 0.14],
  // ending
  [T.fahman - 0.15, 'swish', 0.24], [T.fahman, 'pop', 0.2], [T.kasban, 'twinkle', 0.34],
];
const SCENE_SWISH: Cue[] = SCENES.slice(1).filter(([, s]) => !['reveal', 'loop'].includes(s)).map(([tt]): Cue => [tt, 'swish', 0.1]);
const POSE_SWAP_SFX: Cue[] = POSES.slice(1).map(([t]) => [t - 0.06, 'swish', 0.07]);
const sfxFile = (n: string) => (n.includes('/') ? `elfahman/${n}.wav` : `elfahman/sfx/${n}.wav`);

// ============================================================ captions (word for word from the script)
// The hook card is the biggest text (two lines over the full width); the other cards stay under it.
const caps = CAPS as unknown as {sizes: number[]; w100: number[]; base: {normal: number; big: number; gold: number}; cards: Record<string, Partial<Group>>};
const PAINT: [string, number, string][] = [
  ['أسرع', 0, YELLOW], ['هيبوظ', 0, RED], ['مخك', 0, RED], ['فنلندا', 0, YELLOW], ['ميتين', 0, YELLOW], ['وستين', 0, YELLOW], ['تمن', 0, YELLOW], ['سنين', 0, YELLOW],
  ['والمفاجأة', 0, YELLOW], ['أسرع', 1, YELLOW], ['أعلى', 0, YELLOW], ['اتفاجئوا', 0, YELLOW], ['نفس', 0, YELLOW], ['النتيجة', 0, YELLOW],
  ['استنى', 0, RED], ['الغريب', 0, RED], ['مقالتش', 0, RED], ['ماشيين', 0, YELLOW], ['بعض', 0, YELLOW], ['بيعمل', 0, YELLOW], ['دماغه', 0, YELLOW], ['يفكر', 0, RED],
  ['وازن', 0, YELLOW], ['بوظ', 0, RED], ['أذكى', 0, YELLOW],
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
  out[0].e = out[1].s; // the hook card holds until line 2 starts
  out[0].s = 0;        // the whole hook line is on screen in frame 0
  return out;
})();

// ============================================================ composition
export const Screens: React.FC = () => {
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
  const sig = t >= T.estanna - 0.02 && t < T.dirasa ? 0.3 * easeOut(seg(t, T.estanna - 0.02, T.estanna + 0.12)) * (1 - seg(t, T.dirasa - 0.3, T.dirasa)) : 0;
  // mood: the room dims for the mystery pause, then a burst of colour for the reveal
  const myst = seg(t, T.mofag, T.mofag + 0.35) * (1 - seg(t, MYST[1] - 0.02, MYST[1] + 0.15));
  const rev = seg(t, MYST[1], MYST[1] + 0.3) * (1 - seg(t, T.olama2 - 0.2, T.olama2 + 0.3));
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
      <AbsoluteFill style={{background: `radial-gradient(ellipse 78% 62% at 50% 36%, rgba(0,0,0,0) 52%, rgba(0,0,0,${0.3 + sig * 0.6 + myst * 0.2 - rev * 0.12}) 100%)`}} />
      <DownArrows t={t} />
      <Captions t={t} groups={GROUPS} colors={{}} y={1250} x={460} />
      <Sequence from={Math.round(VO * FPS)}><Audio src={staticFile('elfahman/screens/vo/vo.mp3')} volume={1} /></Sequence>
      <Audio src={staticFile('elfahman/screens/music/bed.wav')} volume={1} />
      <Audio src={staticFile('elfahman/screens/music/hits.wav')} volume={1} />
      <Sequence from={Math.round(T.estanna * FPS)} durationInFrames={Math.round(0.6 * FPS)}><Audio src={staticFile('elfahman/screens/music/scratch.wav')} volume={0.8} /></Sequence>
      {[...SFX, ...SCENE_SWISH, ...POSE_SWAP_SFX].map(([tt, n, v], i) => (
        <Sequence key={i} from={Math.max(0, Math.round(tt * FPS))} durationInFrames={Math.round(1.6 * FPS)}>
          <Audio src={staticFile(sfxFile(n))} volume={v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// beats on the board (for QA: the longest time the board goes without a new beat)
export const SCREENS_BEATS: number[] = [
  0, ...SPARKS, T.asra3, ...SCENES.map(([s]) => s),
  T.gomla, T.mobile1, T.haybawaz, T.mo5ak, T.olama, T.finland, T.meten, T.tefl, T.yetab3o, T.taman, ...flipTimes, T.kamla, T.soghayareen, T.le7ad, T.morahqeen,
  T.besagelo, T.haga, T.bayel3abo, T.yet7arako, T.bey23odo, T.shashat1, T.akher, T.amalolhom, T.ekhtebarat, T.tafkeer, T.zakra,
  T.mofag, MYST[1], T.aktar2, T.asra32, T.daragat, T.a3la, T.etfage2o, T.shalo, T.zaka, T.awel, T.ta3leem, T.ahlo, T.barde, T.nafs, T.nateega,
  T.estanna, T.mobile3, T.khalahom, T.ashtar, T.heya, T.etneen, T.mashyeen, T.ba3d, T.muhem, T.tefl3, T.eih3, T.bey3mel, T.aleha, T.eih4,
  T.bayel3ab, T.le3ba, T.betshaghal, T.demagho, T.be2aleb, T.videohat, T.sa3teen, T.yefaker, T.wazen, T.shasha2, T.gary, T.la3eb, T.barra,
  T.tab, T.eih5, T.bawaz, T.khalahom2, T.ekteb, T.fahman, T.kasban,
].sort((a, b) => a - b);
