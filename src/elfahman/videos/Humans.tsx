import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Fonts} from '../lib/fonts';
import {FPS, clamp, easeIn, easeInOut, easeOut, lerp, popIn, rand, seg, wobble} from '../lib/anim';
import {Cam, CamKey, Layer, camAt, shakeAt} from '../lib/camera';
import {SetBack, SetFront, DESK_SCREEN_Y} from '../lib/Set';
import {CANVAS, Character, HEAD, Pose, PoseKey, blinkTimes, mouthStates, poseAt, squashAt} from '../lib/Character';
import {Captions, GOLD, Group, RED, YELLOW, Word, norm} from '../lib/Captions';
import {INK, Sparkle, showScale} from '../lib/fx';
import WORDS from './humans.words.json';
import ENV from './humans.env.json';
import CAPS from './humans.captions.json';

// Episode 07: "لو البشر كلهم اختفوا" — a fast "what if" timeline. The board gets a new beat about every 2 s; every time
// phrase pops a TIME CHIP at the top of the board (clock whose hands spin faster at each jump + a timeline bar filling up
// step by step). Every picture is drawn in code (no generated pictures). The voice is the raw take at 1.0x with every
// silence cut to max 0.25 s (tools/capgaps.py); the only longer pause is the natural "..." after "كله" (the mystery pause,
// 0.36 s, never lengthened). Ambient bed (pad -> wind + birds) and the chip whooshes are synthesized (tools/ambient_bed.py).
// Frame 0 starts in the hook pose with the first person already vanishing; the last frame is the full Earth again (loop).

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
const en = (w: string, nth = 0) => words[idx(w, nth)].e + VO;
const SPEECH_END = 61.25 + VO; // measured end of the last word (scribe_words.pauses.json)
export const HUMANS_DURATION_S = Math.round((SPEECH_END + 0.4) * FPS) / FPS; // ~0.4 s of silence after the last word
const END = HUMANS_DURATION_S;

const T = {
  eih: at('إيه'), bashar: at('البشر'), kollohom: at('كلهم'), ekhtafo: at('اختفوا'), naharda: at('النهارده'),
  fi: at('في'), awel: at('أول'), yom: at('يوم'), kahraba: at('الكهربا'), hate2ta3: at('هتقطع'), donya: at('الدنيا'), ashan: at('عشان'), mafish: at('مفيش'), beyshaghal: at('بيشغل'), ma7atat: at('المحطات'),
  bellel: at('وبالليل'), sama: at('السما'), malyana: at('مليانة'), nogoom: at('نجوم'), omrak: at('عمرك'), kedda: at('كده'), wala: at('ولا'), lamba: at('لمبة'), menawara: at('منورة'),
  ba3d1: at('بعد', 0), yomein: at('يومين'), anfa2: at('أنفاق'), metro: at('المترو'), hatghra2: at('هتغرق'), maya: at('مية'), makan: at('المكن'), beyeshfat: at('بيشفط'), elmaya: at('المية'), we2ef: at('وقف'),
  ba3d2: at('بعد', 1), kam: at('كام'), osboo3: at('أسبوع'), hayawanat: at('الحيوانات'), bareya: at('البرية'), hatebda: at('هتبدأ'), tenzel: at('تنزل'), modon: at('المدن'), tetmasha: at('وتتمشى'), shawre3: at('الشوارع'), fadya: at('الفاضية'),
  ba3d3: at('بعد', 2), sana1: at('سنة'), zar3: at('الزرع'), hayetla3: at('هيطلع'), sho2oo2: at('شقوق'), asfalt: at('الأسفلت'), weshawre3: at('والشوارع'), hatebda2: at('هتبدأ', 1), tekhtefi: at('تختفي'),
  saraseer: at('والصراصير'), benool: at('بنقول'), hate3eesh: at('هتعيش'), nehaya: at('نهاية'), alam: at('العالم'), bilad: at('البلاد'), barda: at('الباردة'), hatmoot: at('هتموت'), bard: at('البرد'),
  ashan5: at('عشان', 3), kanet: at('كانت'), ayshah: at('عايشة'), dafa: at('دفا'), beyootna: at('بيوتنا'),
  ba3d5: at('بعد', 4), eshreen: at('عشرين'), shagar: at('الشجر'), hayetla32: at('هيطلع', 1), gowa: at('جوه'), beyoot: at('البيوت'), nafsaha: at('نفسها'), yekasar: at('ويكسر'), shababeek: at('الشبابيك'), yekhrog: at('ويخرج'), sa2f: at('السقف'),
  ba3d6: at('بعد', 5), meet: at('ميت'), kabary: at('الكباري'), hadeed: at('الحديد'), hatsadi: at('هتصدي'), teqa3: at('وتقع'), welmodon: at('والمدن'), hatba2a2: at('هتبقى', 1), ghabat: at('غابات'),
  ba3d7: at('بعد', 6), alaf: at('آلاف'), seneen: at('السنين'), abrag: at('الأبراج'), kona: at('كنا'), fakhoreen: at('فخورين'), hatba2a3: at('هتبقى', 2), kom: at('كوم'), torab: at('تراب'),
  estanna: at('استنى'), ghareeb: at('الغريب'), gay: at('جاي'),
  fih: at('فيه'), haga: at('حاجة'), baneenaha: at('بنيناها'), arba3: at('أربع'), khomsomeya: at('وخمسمية'), hatfdal: at('هتفضل'), wa2fa: at('واقفة'), kollo: at('كله'), kolloEnd: en('كله'),
  ahramat: at('الأهرامات'),
  ya3ni: at('يعني'), agdadna: at('أجدادنا'), hagar: at('بالحجر'), hebal: at('والحبال'), ghalabo: at('غلبوا'), nate7at: at('ناطحات'), sa7ab: at('السحاب'),
  tab: at('طب'), sa7eet: at('صحيت'), la2eet: at('لقيت'), akher: at('آخر'), wa7ed: at('واحد'), ard: at('الأرض'), awel2: at('أول', 1), haga2: at('حاجة', 1), hate3melha: at('هتعملها'), eih2: at('إيه', 1),
  ekteb: at('اكتبلي'), comments: at('الكومنتات'),
  fahman: at('الفهمان'), kasban: at('كسبان'),
};
// signature moments pinned to the measured audio onsets (timing.py)
T.estanna = 45.67 + VO; T.fahman = 60.32 + VO; T.kasban = 60.92 + VO;
// the mystery pause: the natural "..." after "كله" (0.36 s, the only pause over 0.25 s)
const MYST: [number, number] = [T.kolloEnd, T.ahramat];
// idle clock: idle wiggles stop during the stare from "استنى" (board held, darker)
const FREEZE: [number, number][] = [[T.estanna, T.fih - 0.05]];
const idle = (t: number) => t - FREEZE.reduce((a, [p0, p1]) => a + clamp(t - p0 - 0.04, 0, p1 - p0 - 0.04), 0);

// ============================================================ time chips (the "what if" timeline)
// [time of the word, chip text]; the chip pops exactly on the first word of the time phrase
const CHIPS: [number, string][] = [
  [T.awel, 'أول يوم'], [T.bellel, 'بالليل'], [T.ba3d1, 'بعد يومين'], [T.ba3d2, 'بعد كام أسبوع'],
  [T.ba3d3, 'بعد سنة'], [T.ba3d5, 'بعد عشرين سنة'], [T.ba3d6, 'بعد ميت سنة'], [T.ba3d7, 'بعد آلاف السنين'],
];
const CHIP_OFF = T.estanna - 0.05;
// clock hand angle: the spin speed doubles (roughly) at each time jump
const SPIN = [90, 160, 300, 520, 900, 1500, 2400, 3600]; // deg/s for the minute hand
const handAngle = (t: number) => {
  let a = 0;
  for (let k = 0; k < CHIPS.length; k++) {
    const t0 = CHIPS[k][0], t1 = k + 1 < CHIPS.length ? CHIPS[k + 1][0] : CHIP_OFF;
    if (t <= t0) break;
    a += SPIN[k] * (Math.min(t, t1) - t0);
  }
  return a;
};

// ============================================================ character
const TALKABLE: Pose[] = ['hero', 'explain', 'point_up', 'thinking', 'temple', 'thumbs_up', 'worried'];
const POSES: PoseKey[] = [
  [0, 'thinking'],              // hook pose from frame 0
  [T.fi, 'explain'],            // day one: the power goes out
  [T.bellel, 'thinking'],       // he looks up at the stars
  [T.ba3d1, 'worried'],         // the metro floods
  [T.ba3d2, 'point_up'],        // wild animals
  [T.ba3d3, 'explain'],         // plants through the asphalt
  [T.saraseer, 'hero'],         // cockroaches...
  [T.bilad, 'worried'],         // ...die of cold
  [T.ba3d5, 'point_up'],        // the tree through the roof
  [T.ba3d6, 'explain'],         // bridges rust and fall
  [T.ba3d7, 'hero'],
  [T.hatba2a3, 'worried'],      // the towers crumble
  [T.estanna, 'shocked'],       // signature line: shocked stare exactly on "استنى"
  [T.fih, 'thinking'],          // the mystery
  [T.ahramat, 'point_up'],      // "الأهرامات!" he points up
  [T.ghalabo, 'thumbs_up'],     // the ancestors won
  [T.tab, 'explain'],           // the question + arrows down to the comments (the library has no pointing-down pose)
  [T.fahman, 'temple'],         // ending: hand on temple exactly on "الفهمان"
];
const MOUTH = mouthStates((ENV as {level: number[]}).level);
const BLINKS = blinkTimes(END, 7);

const CS = 0.6;
const CHAR_X = 540 - (CANVAS[0] * CS) / 2;
const CHAR_Y = DESK_SCREEN_Y - 1450 * CS;

// ============================================================ camera
const CAM0: Cam = {x: 520, y: 860, z: 180};
const BASE: Cam = {x: 512, y: 866, z: 125};
const NEAR: Cam = {x: 510, y: 850, z: 150};
const CAM_KEYS: CamKey[] = [
  [0, 1.0, {x: 512, y: 872, z: 120}],                             // pulls back from frame 0
  [T.fi - 0.1, T.fi + 0.4, BASE],
  [T.bellel - 0.1, T.nogoom + 0.3, {x: 510, y: 836, z: 165}],     // slow push while the stars come out
  [T.ba3d1 - 0.1, T.ba3d1 + 0.4, BASE],
  [T.hatghra2 - 0.05, T.we2ef + 0.3, NEAR],
  [T.ba3d2 - 0.1, T.ba3d2 + 0.4, BASE],
  [T.tetmasha - 0.05, T.fadya + 0.4, NEAR],
  [T.ba3d3 - 0.1, T.ba3d3 + 0.4, {x: 510, y: 840, z: 165}],
  [T.saraseer - 0.1, T.saraseer + 0.4, BASE],
  [T.hatmoot - 0.05, T.hatmoot + 0.3, {x: 508, y: 846, z: 158}],
  [T.ba3d5 - 0.1, T.ba3d5 + 0.4, BASE],
  [T.yekhrog - 0.05, T.sa2f + 0.3, {x: 510, y: 836, z: 160}],
  [T.ba3d6 - 0.1, T.ba3d6 + 0.4, BASE],
  [T.welmodon - 0.1, T.ghabat + 0.3, NEAR],
  [T.ba3d7 - 0.1, T.ba3d7 + 0.4, BASE],
  [T.estanna - 0.04, T.estanna + 0.1, {x: 540, y: 690, z: 280}],  // punch-in exactly on "استنى" (the board stays in frame)
  [T.fih - 0.1, T.fih + 0.4, {x: 510, y: 820, z: 160}],
  [T.fih + 0.4, MYST[1], {x: 512, y: 760, z: 235}],               // slow push-in on the hidden shape
  [T.ahramat - 0.04, T.ahramat + 0.25, {x: 510, y: 800, z: 190}], // the reveal
  [T.ya3ni - 0.1, T.ya3ni + 0.4, BASE],
  [T.tab - 0.1, T.tab + 0.4, {x: 512, y: 866, z: 128}],
  [T.ekteb - 0.1, T.ekteb + 0.4, {x: 512, y: 868, z: 122}],
  [T.fahman - 0.1, T.fahman + 0.5, CAM0],                          // ends on the opening framing
];
const SHAKES: [number, number, number][] = [
  ...CHIPS.map(([c]): [number, number, number] => [c, 2.5, 12]),
  [T.beyshaghal, 3, 10], [T.hatghra2, 3, 10], [T.hatmoot, 3, 10], [T.shababeek, 4, 10], [T.sa2f, 5, 9], [T.teqa3, 7, 8],
  [T.hatba2a3, 4, 6], [T.torab, 6, 7], [T.estanna, 16, 6], [T.ahramat, 6, 7], [T.ghalabo, 3, 10],
];

// ============================================================ drawing kit (all code)
const CHALK = '#fdf6e8', GREEN = '#43a85a', LEAF = '#4f9a3f', LEAF2 = '#6fbf4a', SKIN = '#e8b48a';
const bump = (t: number, t0: number, a = 0.14, k = 9) => (t < t0 ? 1 : 1 + a * Math.exp(-(t - t0) * k) * Math.cos((t - t0) * 18));
type Pt = [number, number];
const poly = (pts: Pt[]) => 'M ' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L ') + ' Z';
const blob = (cx: number, cy: number, r: number, seed: number, n = 16, j = 0.3, sq = 0.78): Pt[] =>
  Array.from({length: n}, (_, i) => { const a = (i / n) * Math.PI * 2, rr = r * (1 + j * (rand(seed * 31 + i) - 0.5) + 0.12 * Math.sin(a * 3 + seed)); return [cx + rr * Math.cos(a), cy + rr * Math.sin(a) * sq]; });
const mix = (a: string, b: string, k: number) => {
  const p = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(lerp(v, B[i], clamp(k))).toString(16).padStart(2, '0')).join('');
};
const AR = (n: number) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);

const Txt: React.FC<{x: number; y: number; size: number; fill?: string; rtl?: boolean; sw?: number; anchor?: 'start' | 'middle' | 'end'; children: React.ReactNode}> =
({x, y, size, fill = CHALK, rtl = false, sw = 0.11, anchor = 'middle', children}) => (
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
// a small "poof" cloud: puffs grow and fade out (dt = time since the poof)
const Poof: React.FC<{x: number; y: number; dt: number; r?: number; c?: string}> = ({x, y, dt, r = 26, c = '#f2efe6'}) => {
  if (dt < 0 || dt > 0.55) return null;
  const g = easeOut(clamp(dt / 0.3)), o = 1 - seg(dt, 0.25, 0.55);
  return (
    <g transform={`translate(${x} ${y})`} opacity={o}>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2 + 0.4, d = r * 0.9 * g;
        return <circle key={i} cx={Math.cos(a) * d} cy={Math.sin(a) * d * 0.8} r={r * (0.35 + 0.35 * g)} fill={c} stroke={INK} strokeWidth={3} />;
      })}
      <circle r={r * 0.6 * g} fill={c} />
    </g>
  );
};
// dust: drifting grey puffs (n puffs, spread around (x, y))
const Dust: React.FC<{x: number; y: number; dt: number; w: number; n?: number; seed?: number; o?: number}> = ({x, y, dt, w, n = 8, seed = 1, o = 0.85}) => {
  if (dt < 0) return null;
  const k = easeOut(clamp(dt / 0.8)), fade = o * (1 - 0.55 * seg(dt, 1.2, 3.5));
  return (
    <g opacity={fade}>
      {Array.from({length: n}, (_, i) => {
        const px = x + (rand(seed * 13 + i) - 0.5) * w * (0.4 + 0.8 * k) + Math.sin(dt * 0.8 + i) * 10, py = y - rand(seed * 7 + i) * 60 * k - dt * 6;
        return <circle key={i} cx={px} cy={py} r={(18 + 26 * rand(seed + i * 3)) * (0.4 + 0.8 * k)} fill="#b9ab96" stroke={INK} strokeWidth={2.5} strokeOpacity={0.4} />;
      })}
    </g>
  );
};

// ---- stick figure; (x, y) = feet
type Arm = [number, number];
const ARM = 60, SH_Y = -128;
const Stick: React.FC<{x: number; y: number; s?: number; dir?: number; armF?: Arm; armB?: Arm; legF?: number; rot?: number; body?: string; o?: number}> =
({x, y, s = 1, dir = 1, armF = [0.25, 0.2], armB = [-0.25, -0.2], legF = 0.13, rot = 0, body = CHALK, o = 1}) => {
  const hy = -80, ny = -140, hd = -170, L = 82, sy = SH_Y;
  const hand = (a: Arm): Pt => [Math.sin(a[0]) * ARM / 2 + Math.sin(a[1]) * ARM / 2, sy + Math.cos(a[0]) * ARM / 2 + Math.cos(a[1]) * ARM / 2];
  const arm = (a: Arm) => { const e: Pt = [Math.sin(a[0]) * ARM / 2, sy + Math.cos(a[0]) * ARM / 2], h = hand(a); return ` M 0 ${sy} L ${e[0]} ${e[1]} L ${h[0]} ${h[1]}`; };
  const d = `M 0 ${hy} L ${Math.sin(legF) * L} ${hy + Math.cos(legF) * L} M 0 ${hy} L ${-Math.sin(0.13) * L} ${hy + Math.cos(0.13) * L} M 0 ${hy} L 0 ${ny}` + arm(armF) + arm(armB);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s * dir} ${s})`} opacity={o}>
      <path d={d} stroke={INK} strokeWidth={21} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={0} cy={hd} r={29} fill={CHALK} stroke={INK} strokeWidth={6.5} />
      <path d={d} stroke={body} strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={2} cy={hd - 4} r={3.8} fill={INK} /><circle cx={17} cy={hd - 4} r={3.8} fill={INK} />
      <path d={`M 3 ${hd + 9} q 7 6 14 0`} stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
    </g>
  );
};

// ============================================================ board (chalkboard inset above his head)
const BX = 80, BY = 84, BW = 860, BH = 480, MID = BW / 2;
const CHIP_Y = 52, BAR_Y = 104; // time chip + timeline bar, at the top of the board (scenes keep it readable)
type Scene = 'hook' | 'power' | 'stars' | 'metro' | 'animals' | 'asphalt' | 'roach' | 'tree' | 'bridge' | 'forest' | 'towers' | 'desert' | 'pyramids' | 'split' | 'alone' | 'loop';
const PUSH = 0.3;
const SCENES: [number, Scene][] = [
  [0, 'hook'], [T.fi - 0.08, 'power'], [T.bellel - 0.1, 'stars'], [T.ba3d1 - 0.1, 'metro'], [T.ba3d2 - 0.1, 'animals'], [T.ba3d3 - 0.1, 'asphalt'],
  [T.saraseer - 0.1, 'roach'], [T.ba3d5 - 0.1, 'tree'], [T.ba3d6 - 0.1, 'bridge'], [T.welmodon - 0.1, 'forest'], [T.ba3d7 - 0.1, 'towers'],
  [T.fih - 0.1, 'desert'], [T.ahramat - 0.02, 'pyramids'], [T.ya3ni - 0.1, 'split'], [T.tab - 0.1, 'alone'], [T.fahman - 0.15, 'loop'],
];
type SP = {t: number; ti: number};

// ---- 1. hook: Earth with tiny people on top; from frame 0 they vanish one by one with a small poof
const EC: Pt = [MID, 330], ER = 150;
const PEOPLE = [-62, -44, -26, -9, 9, 26, 44, 62]; // angles from the top (deg)
const POOF_ORDER = [3, 6, 1, 4, 7, 0, 5, 2];
const poofAt = (k: number) => [0.0, 0.32, 0.66, 1.0, 1.36, 1.72, 2.08, 2.44][POOF_ORDER.indexOf(k)];
const CONT: Pt[][] = [blob(-60, -40, 52, 2, 14, 0.5), blob(50, 40, 46, 5, 14, 0.5), blob(80, -70, 26, 8, 12, 0.5), blob(-40, 80, 30, 11, 12, 0.5), blob(-150, 10, 40, 13, 12, 0.5), blob(170, 20, 44, 17, 12, 0.5)];
const Earth: React.FC<{ti: number; r?: number}> = ({ti, r = ER}) => {
  const shift = ((ti * 26) % 360 + 360) % 360; // continents slide across: the globe turns
  return (
    <g>
      <defs><clipPath id="earthclip"><circle r={r} /></clipPath></defs>
      <circle r={r + 14} fill="#7cc4ff" opacity={0.18} />
      <circle r={r} fill="#2f7ad0" stroke={INK} strokeWidth={8} />
      <g clipPath="url(#earthclip)">
        {[-360, 0].map((o) => <g key={o} transform={`translate(${o + shift - 180} 0)`}>
          {CONT.map((c, i) => <path key={i} d={poly(c.map(([x, y]) => [x * (r / ER) + 180, y * (r / ER)] as Pt))} fill="#5fae4f" stroke={INK} strokeWidth={5} strokeLinejoin="round" />)}
        </g>)}
        <circle cx={-r * 0.35} cy={-r * 0.4} r={r * 0.5} fill="#fff" opacity={0.12} />
      </g>
      <circle r={r} fill="none" stroke={INK} strokeWidth={8} />
    </g>
  );
};
const HookScene: React.FC<SP & {frozen?: boolean}> = ({t, ti, frozen = false}) => {
  const tt = frozen ? -1 : t, ii = frozen ? 0 : ti;
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#0d1838" />
      {Array.from({length: 26}, (_, i) => <circle key={i} cx={rand(i * 3.3) * BW} cy={rand(i * 5.1 + 2) * BH} r={1.6 + rand(i) * 2.2} fill="#fff" opacity={0.35 + 0.35 * Math.sin(ii * 2 + i)} />)}
      <g transform={`translate(${EC[0]} ${EC[1]})`}>
        <Earth ti={ii} />
        {PEOPLE.map((a, k) => {
          const dt = tt - poofAt(k), rad = (a * Math.PI) / 180;
          const fx = Math.sin(rad) * ER, fy = -Math.cos(rad) * ER;
          const s = dt < 0 ? 1 : 1 - easeIn(clamp(dt / 0.16));
          const sway = Math.sin(ii * 3 + k) * 4;
          return <g key={k}>
            {s > 0.01 && <g transform={`translate(${fx} ${fy}) rotate(${a})`}>
              <Stick x={0} y={0} s={0.42 * s} armF={[0.5 + 0.2 * Math.sin(ii * 4 + k), 0.6]} armB={[-0.4, -0.3]} rot={sway} body={['#ff8a3d', '#ffd23f', '#7cc4ff', '#f4efe2'][k % 4]} />
            </g>}
            <Poof x={fx + Math.sin(rad) * 40} y={fy - Math.cos(rad) * 40} dt={dt} r={22} />
          </g>;
        })}
      </g>
    </g>
  );
};

// ---- city skyline (night): windows light per building; `lit(i)` 0..1
const CITY: {x: number; w: number; h: number}[] = [
  {x: 210, w: 90, h: 210}, {x: 304, w: 70, h: 290}, {x: 380, w: 110, h: 180}, {x: 496, w: 76, h: 320}, {x: 578, w: 96, h: 240}, {x: 680, w: 64, h: 300}, {x: 750, w: 104, h: 200},
];
const GROUND = 440;
const City: React.FC<{lit: (i: number) => number; tint?: number; seed?: number}> = ({lit, tint = 0}) => (
  <g>
    {CITY.map((b, i) => {
      const L = lit(i);
      const cols = Math.max(2, Math.floor((b.w - 16) / 22)), rows = Math.floor((b.h - 24) / 30);
      return <g key={i}>
        <rect x={b.x} y={GROUND - b.h} width={b.w} height={b.h} fill={mix('#2a3352', '#1a1f33', tint)} stroke={INK} strokeWidth={6} />
        {Array.from({length: rows * cols}, (_, k) => {
          const c = k % cols, r = Math.floor(k / cols), on = rand(i * 97 + k) < 0.72;
          const wx = b.x + 10 + c * ((b.w - 20) / cols), wy = GROUND - b.h + 14 + r * 30;
          const glow = on ? L : 0;
          return <rect key={k} x={wx} y={wy} width={(b.w - 20) / cols - 6} height={16} fill={glow > 0.01 ? `rgba(255,214,90,${0.15 + 0.85 * glow})` : '#141a2c'} />;
        })}
      </g>;
    })}
    <rect x={0} y={GROUND} width={BW} height={BH - GROUND} fill="#22263a" stroke={INK} strokeWidth={6} />
  </g>
);
const Gear: React.FC<{r: number; a: number; c?: string}> = ({r, a, c = '#c9cfd6'}) => (
  <g transform={`rotate(${a})`}>
    {Array.from({length: 8}, (_, i) => <rect key={i} x={-r * 0.16} y={-r * 1.25} width={r * 0.32} height={r * 0.5} rx={3} fill={c} stroke={INK} strokeWidth={5} transform={`rotate(${i * 45})`} />)}
    <circle r={r} fill={c} stroke={INK} strokeWidth={6} />
    <circle r={r * 0.35} fill="#5a6470" stroke={INK} strokeWidth={5} />
  </g>
);
const PowerPlant: React.FC<{gearA: number; on: number}> = ({gearA, on}) => (
  <g>
    <rect x={-80} y={-110} width={160} height={110} fill="#6b7480" stroke={INK} strokeWidth={6} />
    <rect x={-60} y={-190} width={34} height={86} fill="#8a939e" stroke={INK} strokeWidth={6} />
    <rect x={20} y={-170} width={30} height={66} fill="#8a939e" stroke={INK} strokeWidth={6} />
    <path d="M -80 -110 L -40 -140 L -40 -110 L 0 -140 L 0 -110 L 40 -140 L 40 -110 Z" fill="#7d8792" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <g transform="translate(0 -52)"><Gear r={30} a={gearA} /></g>
    {/* bolt sign: yellow while on */}
    <path d="M 52 -96 l -14 24 h 12 l -10 22 l 26 -30 h -12 l 10 -16 Z" fill={on > 0.5 ? YELLOW : '#555'} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
  </g>
);
const NightSky: React.FC<{id: string; k?: number}> = ({id, k = 0}) => (
  <g>
    <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={mix('#18244f', '#040818', k)} /><stop offset="1" stopColor={mix('#3a3f6e', '#101838', k)} /></linearGradient></defs>
    <rect x={0} y={0} width={BW} height={BH} fill={`url(#${id})`} />
  </g>
);
// blackout order: block by block, left to right in pairs
const OUT = [0, 1, 2, 3, 4, 5, 6].map((i) => T.kahraba + 0.05 + Math.floor(i / 2) * 0.38 + (i % 2) * 0.14);
const PowerScene: React.FC<SP> = ({t, ti}) => {
  const stopT = T.beyshaghal; // the gear stops on "بيشغّل"
  const spin = t < stopT ? 220 * ti : 220 * stopT + 60 * (1 - Math.exp(-(t - stopT) * 6)) / 6 * 6;
  const plant = popIn(t - T.ashan + 0.05, 0.3);
  return (
    <g>
      <NightSky id="skyP" k={seg(t, T.kahraba, T.donya + 0.5)} />
      <circle cx={130} cy={170} r={34} fill="#f6ecc0" stroke={INK} strokeWidth={5} opacity={0.9} />
      <City lit={(i) => 1 - seg(t, OUT[i], OUT[i] + 0.12)} />
      {/* a flicker before each block goes dark */}
      {OUT.map((o, i) => t > o - 0.1 && t < o + 0.05 ? <rect key={i} x={CITY[i].x} y={GROUND - CITY[i].h} width={CITY[i].w} height={CITY[i].h} fill="#fff6c2" opacity={0.25} /> : null)}
      <g transform={`translate(110 ${GROUND}) scale(${0.9 * (plant > 0 ? plant : 0.001)})`}>
        <PowerPlant gearA={spin} on={t < stopT ? 1 : 0} />
      </g>
      <Cross x={110} y={GROUND - 52 * 0.9} s={popIn(t - stopT - 0.08, 0.26)} r={34} w={13} />
    </g>
  );
};

// ---- 3. stars over the dark city, then the Milky Way band; a light bulb with a ✗
const STARS = Array.from({length: 110}, (_, i): [number, number, number, number] => [rand(i * 3.1) * BW, 120 + rand(i * 7.3 + 1) * 290, 1.5 + rand(i * 1.7) * 3, rand(i * 2.9 + 4)]);
const StarsScene: React.FC<SP> = ({t, ti}) => {
  const fill = seg(t, T.sama, T.nogoom + 0.4); // share of stars out
  const band = easeInOut(seg(t, T.nogoom - 0.1, T.omrak + 0.6));
  const shoot = t - T.kedda;
  const bulb = popIn(t - T.lamba, 0.26);
  return (
    <g>
      <NightSky id="skyS" k={1} />
      {/* Milky Way: a soft diagonal band with a dense dust of tiny stars */}
      <defs>
        <linearGradient id="mw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#b9a8ff" stopOpacity={0} /><stop offset="0.5" stopColor="#e9e2ff" stopOpacity={0.55} /><stop offset="1" stopColor="#b9a8ff" stopOpacity={0} /></linearGradient>
        <filter id="mwblur" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="18" /></filter>
      </defs>
      <g opacity={band} transform="rotate(-22 430 260)">
        <rect x={-80} y={200} width={1020} height={110} fill="url(#mw)" filter="url(#mwblur)" />
        {Array.from({length: 90}, (_, i) => <circle key={i} cx={-60 + rand(i * 5.7) * 980} cy={215 + rand(i * 9.1) * 80} r={1 + rand(i) * 1.6} fill="#fff" opacity={0.5 + 0.5 * Math.sin(ti * 3 + i)} />)}
      </g>
      {STARS.map(([x, y, r, o], i) => {
        const on = popIn(t - lerp(T.sama, T.nogoom + 0.3, o), 0.3) * (o <= fill + 0.01 ? 1 : 0);
        if (on <= 0.01) return null;
        const tw = 0.6 + 0.4 * Math.sin(ti * (2 + o * 4) + i);
        return r > 3.6 ? <path key={i} d={`M ${x} ${y - r * 2.2} L ${x + r * 0.5} ${y - r * 0.5} L ${x + r * 2.2} ${y} L ${x + r * 0.5} ${y + r * 0.5} L ${x} ${y + r * 2.2} L ${x - r * 0.5} ${y + r * 0.5} L ${x - r * 2.2} ${y} L ${x - r * 0.5} ${y - r * 0.5} Z`} fill="#fff8d6" opacity={on * tw} />
          : <circle key={i} cx={x} cy={y} r={r * on} fill="#fff" opacity={tw} />;
      })}
      {shoot > 0 && shoot < 0.7 && <path d={`M ${720 - shoot * 600} ${150 + shoot * 160} l 90 -26`} stroke="#fff" strokeWidth={4} strokeLinecap="round" opacity={1 - shoot / 0.7} />}
      <City lit={() => 0} tint={1} />
      {/* he looks up: a tiny figure on the roof looking at the sky (no: the city is empty) -> a bulb icon, off */}
      {bulb > 0.001 && <g transform={`translate(760 ${GROUND - 260}) scale(${bulb})`}>
        <circle cx={0} cy={-20} r={42} fill="#d9dde3" stroke={INK} strokeWidth={6} />
        <rect x={-20} y={18} width={40} height={30} rx={5} fill="#8a939e" stroke={INK} strokeWidth={6} />
        <path d="M -14 -14 q 14 -20 28 0" stroke="#9aa2ad" strokeWidth={5} fill="none" />
        <Cross x={0} y={-10} s={1} r={30} w={11} />
      </g>}
    </g>
  );
};

// ---- 4. metro tunnel cross-section: a train in the tunnel; the pump stops (✗), water rises and fills the tunnel
const TUN = {x: 40, y: 250, w: 780, h: 180};
const MetroScene: React.FC<SP> = ({t, ti}) => {
  const stop = T.hatghra2;
  const fan = t < stop ? ti * 600 : stop * 600 + 200 * (1 - Math.exp(-(t - stop) * 5));
  const level = easeInOut(seg(t, stop + 0.1, T.we2ef + 0.4)); // 0..1 of the tunnel height
  const wy = TUN.y + TUN.h - level * (TUN.h + 8);
  const train = popIn(t - T.anfa2, 0.3);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={170} fill="#7aa8cf" />
      <rect x={0} y={150} width={BW} height={24} fill="#4a4f5a" stroke={INK} strokeWidth={5} />
      <rect x={0} y={174} width={BW} height={BH - 174} fill="#7a5233" />
      {Array.from({length: 18}, (_, i) => <circle key={i} cx={rand(i * 4.1) * BW} cy={190 + rand(i * 6.7) * 280} r={4 + rand(i) * 6} fill="#5e3e26" />)}
      <defs><clipPath id="tun"><rect x={TUN.x} y={TUN.y} width={TUN.w} height={TUN.h} rx={70} /></clipPath></defs>
      <rect x={TUN.x} y={TUN.y} width={TUN.w} height={TUN.h} rx={70} fill="#2b2f3a" stroke={INK} strokeWidth={8} />
      <g clipPath="url(#tun)">
        <rect x={TUN.x} y={TUN.y + TUN.h - 22} width={TUN.w} height={22} fill="#454a55" />
        {Array.from({length: 20}, (_, i) => <rect key={i} x={TUN.x + 10 + i * 40} y={TUN.y + TUN.h - 22} width={14} height={8} fill="#6b5a44" />)}
        {/* train */}
        <g transform={`translate(${lerp(-420, 0, easeOut(train))} 0)`}>
          <rect x={150} y={TUN.y + 40} width={520} height={108} rx={20} fill="#d9483b" stroke={INK} strokeWidth={6} />
          {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={180 + i * 78} y={TUN.y + 58} width={56} height={40} rx={6} fill="#bfe3ff" stroke={INK} strokeWidth={4} />)}
          <rect x={150} y={TUN.y + 112} width={520} height={10} fill="#fff" opacity={0.6} />
          {[210, 300, 520, 610].map((x) => <circle key={x} cx={x} cy={TUN.y + 150} r={12} fill="#333" stroke={INK} strokeWidth={4} />)}
        </g>
        {/* water */}
        {level > 0.001 && <g>
          <path d={`M ${TUN.x} ${wy} ` + Array.from({length: 21}, (_, i) => `L ${TUN.x + i * 39} ${wy + Math.sin(ti * 5 + i * 0.9) * 5}`).join(' ') + ` L ${TUN.x + TUN.w} ${TUN.y + TUN.h + 10} L ${TUN.x} ${TUN.y + TUN.h + 10} Z`}
            fill="#2f8fd8" opacity={0.82} stroke="#bfe3ff" strokeWidth={4} />
          {Array.from({length: 10}, (_, i) => {
            const ph = (ti * 0.8 + rand(i)) % 1, bx = TUN.x + 40 + rand(i * 3.7) * 700, by = lerp(TUN.y + TUN.h, wy, ph);
            return <circle key={i} cx={bx} cy={by} r={4 + rand(i * 2) * 5} fill="none" stroke="#e6f6ff" strokeWidth={3} opacity={1 - ph} />;
          })}
        </g>}
      </g>
      <rect x={TUN.x} y={TUN.y} width={TUN.w} height={TUN.h} rx={70} fill="none" stroke={INK} strokeWidth={8} />
      {/* the pump: on the street, with a pipe down into the tunnel */}
      <rect x={724} y={200} width={20} height={54} fill="#8a939e" stroke={INK} strokeWidth={5} />
      <g transform={`translate(734 196) scale(${bump(t, T.makan, 0.16) * 0.85})`}>
        <rect x={-62} y={-52} width={124} height={86} rx={12} fill="#c9cfd6" stroke={INK} strokeWidth={6} />
        <g transform="translate(-8 -9)">
          <circle r={30} fill="#eef1f4" stroke={INK} strokeWidth={5} />
          {[0, 1, 2].map((i) => <path key={i} d="M 0 0 C 8 -10 20 -14 24 -4 Z" fill="#5a6470" stroke={INK} strokeWidth={3} transform={`rotate(${fan + i * 120})`} />)}
        </g>
        <circle cx={44} cy={-34} r={8} fill={t < stop ? GREEN : RED} stroke={INK} strokeWidth={3} />
      </g>
      <Cross x={734} y={190} s={popIn(t - stop, 0.26)} r={34} w={13} />
    </g>
  );
};

// ---- street in perspective (empty city), shared by the animals and the lone-man scenes
const HZ = 200;
const Street: React.FC<{sky?: string; green?: number}> = ({sky = '#9cc9e8', green = 0}) => (
  <g>
    <rect x={0} y={0} width={BW} height={HZ + 4} fill={sky} />
    <path d={`M 0 ${HZ} L ${BW} ${HZ} L ${BW} ${BH} L 0 ${BH} Z`} fill={mix('#a7a196', '#8fae6c', green)} />
    <path d={`M 360 ${HZ} L 500 ${HZ} L ${BW + 120} ${BH} L -120 ${BH} Z`} fill="#555a63" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    {[0, 1, 2, 3, 4].map((i) => { const u0 = (i + 0.2) / 5, u1 = (i + 0.6) / 5, y0 = lerp(HZ, BH, u0 * u0), y1 = lerp(HZ, BH, u1 * u1);
      return <path key={i} d={`M ${MID} ${y0} L ${MID} ${y1}`} stroke="#f2e6b8" strokeWidth={lerp(3, 14, u1)} strokeLinecap="round" />; })}
    {/* buildings on both sides */}
    {[[0, 70, 180], [70, 90, 120], [160, 110, 70], [250, 70, 40]].map(([x, w, h], i) => <g key={i}>
      <rect x={x} y={HZ - h} width={w} height={h + 40 - i * 10} fill={['#c9a27c', '#b8866a', '#d5b48e', '#a98b74'][i]} stroke={INK} strokeWidth={5} />
      <rect x={BW - x - w} y={HZ - h} width={w} height={h + 40 - i * 10} fill={['#b8866a', '#c9a27c', '#a98b74', '#d5b48e'][i]} stroke={INK} strokeWidth={5} />
    </g>)}
  </g>
);
// ---- animals (side view, facing right when dir = 1); p = walk phase
const legs = (xs: number[], y: number, len: number, p: number, c: string) => xs.map((x, i) => {
  const a = Math.sin(p * Math.PI * 2 + (i % 2 ? Math.PI : 0)) * 0.4;
  return <path key={i} d={`M ${x} ${y} L ${x + Math.sin(a) * len} ${y + Math.cos(a) * len}`} stroke={c} strokeWidth={9} strokeLinecap="round" />;
});
const Deer: React.FC<{p: number}> = ({p}) => (
  <g>
    {legs([-40, -26, 30, 44], 0, 62, p, INK)}
    {legs([-40, -26, 30, 44], 0, 60, p, '#a8683a')}
    <ellipse cx={0} cy={-8} rx={62} ry={30} fill="#b9733f" stroke={INK} strokeWidth={6} />
    <path d="M 40 -20 L 66 -76 L 84 -70 L 64 -16 Z" fill="#b9733f" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <ellipse cx={84} cy={-80} rx={24} ry={15} fill="#b9733f" stroke={INK} strokeWidth={6} />
    <path d="M 70 -92 l -8 -30 M 64 -110 l -14 -6 M 82 -94 l 6 -30 M 86 -112 l 14 -8" stroke="#6b4325" strokeWidth={6} strokeLinecap="round" />
    <circle cx={90} cy={-84} r={3.5} fill={INK} />
    <path d="M -62 -14 q -10 -4 -8 -14" stroke={INK} strokeWidth={6} fill="#fff" />
    {[-30, -8, 14].map((x) => <circle key={x} cx={x} cy={-18} r={4} fill="#f4e2c8" />)}
  </g>
);
const Fox: React.FC<{p: number}> = ({p}) => (
  <g>
    {legs([-26, -14, 20, 32], 0, 34, p, INK)}
    <path d="M -46 -16 Q -100 -30 -104 -2 Q -80 6 -46 -6 Z" fill="#e8742e" stroke={INK} strokeWidth={5} />
    <path d="M -96 -10 Q -104 -2 -96 2 L -88 -2 Z" fill="#fff" />
    <ellipse cx={0} cy={-12} rx={46} ry={20} fill="#e8742e" stroke={INK} strokeWidth={5} />
    <path d="M 36 -22 L 70 -30 L 82 -14 L 52 -2 Z" fill="#e8742e" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <path d="M 46 -26 l 4 -22 l 12 18 Z M 58 -28 l 8 -20 l 8 20 Z" fill="#e8742e" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <circle cx={84} cy={-14} r={4} fill={INK} /><circle cx={62} cy={-18} r={3} fill={INK} />
  </g>
);
const Boar: React.FC<{p: number}> = ({p}) => (
  <g>
    {legs([-34, -20, 22, 36], 2, 30, p, INK)}
    <ellipse cx={0} cy={-18} rx={58} ry={32} fill="#5b4334" stroke={INK} strokeWidth={6} />
    <path d="M -40 -46 l 10 -10 l 8 10 l 10 -10 l 8 10 l 10 -10 l 8 10" stroke={INK} strokeWidth={4} fill="none" />
    <path d="M 44 -34 L 82 -18 L 82 0 L 46 0 Z" fill="#5b4334" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <ellipse cx={84} cy={-9} rx={7} ry={10} fill="#c88b76" stroke={INK} strokeWidth={4} />
    <path d="M 72 -2 q 6 -10 0 -16" stroke="#fffbe6" strokeWidth={5} fill="none" strokeLinecap="round" />
    <circle cx={62} cy={-22} r={3.5} fill={INK} />
    <path d="M 46 -36 l 6 -14 l 8 12 Z" fill="#5b4334" stroke={INK} strokeWidth={4} />
  </g>
);
// [enters at, from x, lane x, scale, walk speed]
const ANIMALS: {k: 'deer' | 'fox' | 'boar'; t0: number; fromX: number; laneX: number; dir: number}[] = [
  {k: 'deer', t0: T.hayawanat, fromX: 980, laneX: 520, dir: -1},
  {k: 'fox', t0: T.bareya, fromX: -140, laneX: 330, dir: 1},
  {k: 'boar', t0: T.tenzel, fromX: 1000, laneX: 640, dir: -1},
];
const AnimalsScene: React.FC<SP> = ({t, ti}) => (
  <g>
    <Street green={seg(t, T.shawre3, T.fadya + 1)} />
    {ANIMALS.map((a, i) => {
      const dt = t - a.t0; if (dt < 0) return null;
      const walkIn = easeOut(clamp(dt / 1.1));
      const stroll = Math.max(0, t - T.tetmasha) * 0.16; // after "وتتمشى" they come down the middle of the road towards us
      const x = lerp(a.fromX, a.laneX, walkIn) + (MID - a.laneX) * clamp(stroll * 0.8) * 0.5;
      const y = 360 + 70 * clamp(stroll);
      const s = (a.k === 'deer' ? 0.9 : a.k === 'boar' ? 0.8 : 0.85) * (1 + 0.5 * clamp(stroll));
      const p = ti * (walkIn < 1 ? 2.2 : 1.4);
      const bob = Math.abs(Math.sin(p * Math.PI * 2)) * 3;
      return <g key={i} transform={`translate(${x} ${y - bob}) scale(${s * a.dir} ${s})`}>
        {a.k === 'deer' ? <Deer p={p} /> : a.k === 'fox' ? <Fox p={p} /> : <Boar p={p} />}
      </g>;
    })}
  </g>
);

// ---- 6. asphalt close-up: cracks spread, grass and small plants push through, the road line fades
const CR: {x: number; y: number; a: number; t0: number}[] = [
  {x: 220, y: 300, a: 20, t0: T.zar3}, {x: 610, y: 260, a: 200, t0: T.zar3 + 0.2}, {x: 420, y: 380, a: -60, t0: T.hayetla3}, {x: 120, y: 200, a: 40, t0: T.sho2oo2},
  {x: 740, y: 400, a: 160, t0: T.sho2oo2 + 0.15}, {x: 500, y: 190, a: 100, t0: T.asfalt},
];
const crackPts = (c: {x: number; y: number; a: number}, k: number): Pt[] => {
  let x = c.x, y = c.y; const pts: Pt[] = [[x, y]]; const r = (c.a * Math.PI) / 180;
  for (let i = 0; i < 9; i++) { const j = (rand(k * 13 + i) - 0.5) * 1.1; x += Math.cos(r + j) * 34; y += Math.sin(r + j) * 22; pts.push([x, y]); }
  return pts;
};
const CRP = CR.map((c, k) => crackPts(c, k));
const Grass: React.FC<{x: number; y: number; s: number; seed: number}> = ({x, y, s, seed}) => s <= 0.01 ? null : (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[-14, -6, 2, 10, 16].map((dx, i) => <path key={i} d={`M ${dx} 0 Q ${dx + (rand(seed + i) - 0.5) * 20} ${-24} ${dx + (rand(seed + i * 2) - 0.5) * 26} ${-40 - rand(seed + i * 5) * 24} Q ${dx + 4} -20 ${dx + 6} 0 Z`} fill={i % 2 ? LEAF : LEAF2} stroke={INK} strokeWidth={3} strokeLinejoin="round" />)}
  </g>
);
const Sprout: React.FC<{x: number; y: number; s: number; flower?: string}> = ({x, y, s, flower}) => s <= 0.01 ? null : (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M 0 0 L 0 -46" stroke={INK} strokeWidth={9} /><path d="M 0 0 L 0 -46" stroke={LEAF} strokeWidth={5} />
    <path d="M 0 -26 Q -30 -40 -30 -20 Q -16 -14 0 -26 Z M 0 -34 Q 30 -50 28 -28 Q 14 -22 0 -34 Z" fill={LEAF2} stroke={INK} strokeWidth={4} />
    {flower && <g transform="translate(0 -52)">{[0, 1, 2, 3, 4].map((i) => <circle key={i} cx={Math.cos(i * 1.256) * 10} cy={Math.sin(i * 1.256) * 10} r={8} fill={flower} stroke={INK} strokeWidth={3} />)}<circle r={6} fill={YELLOW} stroke={INK} strokeWidth={3} /></g>}
  </g>
);
const AsphaltScene: React.FC<SP> = ({t, ti}) => {
  const fade = seg(t, T.weshawre3, T.tekhtefi + 0.4);
  const cover = easeInOut(seg(t, T.hatebda2, T.tekhtefi + 0.5));
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#4d5058" />
      {Array.from({length: 140}, (_, i) => <circle key={i} cx={rand(i * 2.3) * BW} cy={rand(i * 4.9 + 1) * BH} r={2 + rand(i) * 3} fill={rand(i * 7) > 0.5 ? '#5d6069' : '#3f424a'} />)}
      {/* road lines */}
      {[0, 1, 2].map((i) => <rect key={i} x={40 + i * 300} y={238} width={200} height={26} rx={4} fill="#f2e6b8" opacity={1 - 0.9 * fade} />)}
      {CR.map((c, k) => {
        const p = easeOut(seg(t, c.t0, c.t0 + 0.6));
        if (p <= 0.001) return null;
        const d = 'M ' + CRP[k].map((q) => q.join(' ')).join(' L ');
        return <g key={k}>
          <path d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} stroke={INK} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} stroke="#2a2b30" strokeWidth={4} fill="none" strokeLinecap="round" />
        </g>;
      })}
      {/* grass in the cracks: pops on "هيطلع", more on "الأسفلت" */}
      {CRP.map((pts, k) => [2, 5, 8].map((j, m) => {
        const t0 = Math.max(CR[k].t0 + 0.4, T.hayetla3) + m * 0.25 + k * 0.08;
        const s = popIn(t - t0, 0.3) * (1 + 0.03 * Math.sin(ti * 3 + k + m));
        return <Grass key={`${k}-${m}`} x={pts[j][0]} y={pts[j][1]} s={s * (0.9 + 0.5 * cover)} seed={k * 10 + m} />;
      }))}
      <Sprout x={300} y={330} s={popIn(t - T.asfalt, 0.3)} flower="#ff8ab3" />
      <Sprout x={680} y={300} s={popIn(t - T.asfalt - 0.2, 0.3)} />
      <Sprout x={150} y={430} s={popIn(t - T.weshawre3, 0.3)} flower="#fff" />
      <Sprout x={560} y={440} s={popIn(t - T.weshawre3 - 0.15, 0.3)} flower="#b48aff" />
      {/* the road disappears under green */}
      {cover > 0.001 && Array.from({length: 26}, (_, i) => {
        const x = (i % 7) * 140 + 30 + rand(i) * 40, y = Math.floor(i / 7) * 140 + 40 + rand(i * 3) * 40, d = rand(i * 5) * 0.5;
        const s = easeOut(clamp((cover - d) / 0.5));
        return s > 0.01 ? <path key={i} d={poly(blob(x, y, 90 * s, i + 40, 14, 0.4, 0.8))} fill={i % 2 ? LEAF : LEAF2} stroke={INK} strokeWidth={4} /> : null;
      })}
    </g>
  );
};

// ---- 7. snowy street: a cockroach by a radiator; the radiator turns off, it shivers, then falls on its back
const Roach: React.FC<{flip: number; shiver: number; ti: number; frost: number}> = ({flip, shiver, ti, frost}) => {
  const jx = shiver * Math.sin(ti * 70) * 4, wig = Math.sin(ti * (flip > 0.5 ? 18 : 6)) * (flip > 0.5 ? 0.5 : 0.15);
  return (
    <g transform={`translate(${jx} 0) rotate(${180 * easeInOut(flip)} 0 -30)`}>
      {[-30, 0, 30].map((x, i) => <g key={i}>
        <path d={`M ${x} -20 l ${-14 + wig * 20} 30 l -10 10`} stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M ${x} -20 l ${14 - wig * 20} 30 l 10 10`} stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>)}
      <ellipse cx={0} cy={-34} rx={58} ry={28} fill={mix('#8a4b22', '#9fb7d4', frost)} stroke={INK} strokeWidth={6} />
      <path d="M -50 -34 L 54 -34" stroke={INK} strokeWidth={4} />
      <ellipse cx={64} cy={-34} rx={18} ry={16} fill={mix('#6b3818', '#9fb7d4', frost)} stroke={INK} strokeWidth={6} />
      <path d={`M 74 -46 Q 100 ${-90 + wig * 20} 130 -80 M 72 -48 Q 92 ${-100 - wig * 20} 112 -108`} stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
      <circle cx={70} cy={-38} r={4} fill="#fff" /><circle cx={71} cy={-38} r={2} fill={INK} />
      {frost > 0.05 && <g opacity={frost}>{[-36, -12, 14, 38].map((x) => <path key={x} d={`M ${x} -58 l 4 -8 l 4 8`} stroke="#fff" strokeWidth={3} fill="none" />)}</g>}
    </g>
  );
};
const Radiator: React.FC<{on: number; ti: number}> = ({on, ti}) => (
  <g>
    {on > 0.02 && [0, 1, 2].map((i) => {
      const ph = (ti * 0.7 + i / 3) % 1;
      return <path key={i} d={`M ${-40 + i * 40} ${-130 - ph * 60} q 10 -10 0 -20 q -10 -10 0 -20`} stroke="#ff8a3d" strokeWidth={6} fill="none" strokeLinecap="round" opacity={on * (1 - ph)} />;
    })}
    {[-60, -30, 0, 30, 60].map((x) => <rect key={x} x={x - 13} y={-120} width={26} height={120} rx={12} fill={mix('#c9cfd6', '#ffb27a', on * 0.55)} stroke={INK} strokeWidth={6} />)}
    <rect x={-80} y={-26} width={160} height={14} fill="#8a939e" stroke={INK} strokeWidth={5} />
    <circle cx={88} cy={-60} r={11} fill={on > 0.5 ? RED : '#4a6b8a'} stroke={INK} strokeWidth={4} />
  </g>
);
const FLAKES = Array.from({length: 60}, (_, i): [number, number, number] => [rand(i * 1.9) * BW, rand(i * 3.3), 2 + rand(i * 5.1) * 4]);
const RoachScene: React.FC<SP> = ({t, ti}) => {
  const off = T.barda; // the radiator turns off on "الباردة"
  const on = 1 - seg(t, off, off + 0.3);
  const shiver = seg(t, T.hatmoot - 0.2, T.hatmoot) * (1 - seg(t, T.bard + 0.25, T.bard + 0.35));
  const flip = seg(t, T.bard, T.bard + 0.35);
  const frost = seg(t, T.hatmoot, T.bard + 0.3);
  const snow = 0.4 + 0.6 * seg(t, T.bilad, T.barda + 0.5);
  const flex = t - T.hate3eesh;
  const memo = showScale(t, T.dafa - 0.1, 1e9, 0.28);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill={mix('#8fa9c6', '#5d7697', seg(t, off, off + 1))} />
      {/* houses behind, windows warm until the radiator goes off */}
      {[[30, 150], [220, 120], [560, 160], [720, 130]].map(([x, h], i) => <g key={i}>
        <rect x={x} y={360 - h} width={120} height={h} fill="#c9b9a4" stroke={INK} strokeWidth={5} />
        <path d={`M ${x - 10} ${362 - h} L ${x + 60} ${320 - h} L ${x + 130} ${362 - h} Z`} fill="#f2f7ff" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <rect x={x + 40} y={390 - h} width={40} height={36} fill={on > 0.5 ? '#ffd65a' : '#4a5d78'} stroke={INK} strokeWidth={4} />
      </g>)}
      <rect x={0} y={360} width={BW} height={BH - 360} fill="#f2f7ff" stroke={INK} strokeWidth={5} />
      <g transform="translate(560 420)"><Radiator on={on} ti={ti} /></g>
      <Cross x={648} y={360} s={popIn(t - off - 0.05, 0.26)} r={22} w={9} />
      <g transform={`translate(300 ${430 - (flex > 0 && flex < 0.5 ? Math.sin(flex * Math.PI * 2) * 22 : 0)}) scale(${bump(t, T.saraseer, 0.2) * 1.15})`}>
        <Roach flip={flip} shiver={shiver} ti={ti} frost={frost} />
      </g>
      {/* "will survive the end of the world": a little gold crown pops on it, then falls off when it gets cold */}
      {(() => {
        const s = popIn(t - T.hate3eesh, 0.3); if (s <= 0.01) return null;
        const fall = Math.max(0, t - T.barda);
        return <g transform={`translate(${372 + fall * 120} ${376 + fall * 260}) rotate(${-12 + fall * 200}) scale(${s})`} opacity={1 - seg(fall, 0.4, 0.7)}>
          <path d="M -26 0 L -30 -30 L -14 -14 L 0 -36 L 14 -14 L 30 -30 L 26 0 Z" fill={GOLD} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        </g>;
      })()}
      <Sparkle x={380} y={350} dt={flex} r={30} />
      {/* snow */}
      {FLAKES.map(([x, p, r], i) => {
        if (rand(i * 11) > snow) return null;
        const y = ((p * BH + ti * (40 + r * 12)) % (BH + 20)) - 10;
        return <circle key={i} cx={x + Math.sin(ti * 2 + i) * 12} cy={y} r={r} fill="#fff" />;
      })}
      {/* "they lived on the warmth of our homes": a warm house in a thought bubble, then it goes cold */}
      {memo > 0.001 && <g transform={`translate(170 150) scale(${memo})`}>
        <ellipse rx={110} ry={80} fill="#fffbe6" stroke={INK} strokeWidth={6} />
        <circle cx={70} cy={92} r={14} fill="#fffbe6" stroke={INK} strokeWidth={5} /><circle cx={96} cy={118} r={8} fill="#fffbe6" stroke={INK} strokeWidth={4} />
        <rect x={-46} y={-14} width={92} height={60} fill={mix('#ffb27a', '#9fb7d4', seg(t, T.beyootna + 0.3, T.beyootna + 0.8))} stroke={INK} strokeWidth={5} />
        <path d="M -60 -12 L 0 -56 L 60 -12 Z" fill="#d9483b" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <rect x={-14} y={6} width={28} height={24} fill={mix('#ffd65a', '#4a5d78', seg(t, T.beyootna + 0.3, T.beyootna + 0.8))} stroke={INK} strokeWidth={4} />
      </g>}
    </g>
  );
};

// ---- 8. a house front: a tree grows inside, breaks the window, comes out through the roof
const HOUSE = {x: 250, y: 250, w: 360, h: 200};
const TreeScene: React.FC<SP> = ({t, ti}) => {
  const g1 = easeOut(seg(t, T.shagar, T.gowa + 0.3));        // sapling inside, seen in the window
  const brk = t - T.shababeek;                                // the window breaks
  const g2 = easeInOut(seg(t, T.yekhrog - 0.1, T.sa2f + 0.35)); // the trunk goes up through the roof
  const hole = t - T.sa2f;
  const crown = popIn(t - T.sa2f - 0.1, 0.4);
  const branch = easeOut(seg(t, T.yekasar, T.shababeek + 0.2));
  const wx = HOUSE.x + 205, wy = HOUSE.y + 40;
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#a9d6f2" />
      <rect x={0} y={HOUSE.y + HOUSE.h} width={BW} height={BH} fill="#8fbf5c" stroke={INK} strokeWidth={5} />
      {/* house */}
      <rect x={HOUSE.x} y={HOUSE.y} width={HOUSE.w} height={HOUSE.h} fill="#e9d3b0" stroke={INK} strokeWidth={7} />
      <rect x={HOUSE.x + 40} y={HOUSE.y + 80} width={80} height={120} fill="#8a5a33" stroke={INK} strokeWidth={6} />
      {/* window (behind it: the tree inside) */}
      <rect x={wx} y={wy} width={110} height={100} fill="#3a4a5a" stroke={INK} strokeWidth={6} />
      <g transform={`translate(${wx + 55} ${wy + 100})`}>
        <path d={`M -8 0 L -8 ${-80 * g1} L 8 ${-80 * g1} L 8 0 Z`} fill="#7a5233" stroke={INK} strokeWidth={4} />
        {g1 > 0.05 && <circle cx={0} cy={-80 * g1} r={34 * g1} fill={LEAF} stroke={INK} strokeWidth={4} />}
      </g>
      {/* glass: whole until it breaks, then shards fly */}
      {brk < 0 ? <g>
        <rect x={wx} y={wy} width={110} height={100} fill="#bfe3ff" opacity={0.45} />
        <path d={`M ${wx + 55} ${wy} L ${wx + 55} ${wy + 100} M ${wx} ${wy + 50} L ${wx + 110} ${wy + 50}`} stroke={INK} strokeWidth={6} />
      </g> : [0, 1, 2, 3, 4, 5].map((i) => {
        const d = Math.min(brk, 1), vx = (i % 3 - 1) * 160 + 60, vy = -120 - i * 20;
        return d < 0.9 ? <path key={i} d={`M 0 0 l ${18 + i * 3} ${8} l ${-10} ${20} Z`} fill="#bfe3ff" stroke={INK} strokeWidth={3}
          transform={`translate(${wx + 20 + i * 15 + vx * d} ${wy + 30 + (i % 2) * 30 + vy * d + 600 * d * d}) rotate(${d * 500 * (i % 2 ? 1 : -1)})`} opacity={1 - seg(d, 0.5, 0.9)} /> : null;
      })}
      {/* branch out of the broken window */}
      {branch > 0.01 && brk > 0 && <g>
        <path d={`M ${wx + 60} ${wy + 40} Q ${wx + 140} ${wy + 10} ${wx + 60 + 160 * branch} ${wy - 10}`} stroke={INK} strokeWidth={18} fill="none" strokeLinecap="round" />
        <path d={`M ${wx + 60} ${wy + 40} Q ${wx + 140} ${wy + 10} ${wx + 60 + 160 * branch} ${wy - 10}`} stroke="#7a5233" strokeWidth={10} fill="none" strokeLinecap="round" />
        <circle cx={wx + 60 + 160 * branch} cy={wy - 14} r={30 * branch} fill={LEAF2} stroke={INK} strokeWidth={4} />
      </g>}
      {/* roof with a hole */}
      <path d={`M ${HOUSE.x - 30} ${HOUSE.y + 4} L ${HOUSE.x + HOUSE.w / 2} ${HOUSE.y - 110} L ${HOUSE.x + HOUSE.w + 30} ${HOUSE.y + 4} Z`} fill="#c0452f" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      {[0, 1, 2].map((r) => <path key={r} d={`M ${HOUSE.x - 30 + r * 40} ${HOUSE.y - r * 36} L ${HOUSE.x + HOUSE.w + 30 - r * 40} ${HOUSE.y - r * 36}`} stroke={INK} strokeWidth={3} opacity={0.4} />)}
      {hole > 0 && <ellipse cx={HOUSE.x + 240} cy={HOUSE.y - 40} rx={40} ry={18} fill="#3a2416" stroke={INK} strokeWidth={5} />}
      {/* the trunk, through the roof */}
      {g2 > 0.01 && <path d={`M ${HOUSE.x + 228} ${HOUSE.y - 36} L ${HOUSE.x + 228} ${HOUSE.y - 36 - 110 * g2} L ${HOUSE.x + 252} ${HOUSE.y - 36 - 110 * g2} L ${HOUSE.x + 252} ${HOUSE.y - 36} Z`} fill="#7a5233" stroke={INK} strokeWidth={6} />}
      {crown > 0.01 && <g transform={`translate(${HOUSE.x + 240} ${HOUSE.y - 150}) scale(${0.8 * crown * (1 + 0.02 * Math.sin(ti * 2))})`}>
        {[[-60, 10, 52], [60, 14, 50], [0, -30, 66], [-30, 40, 44], [34, 44, 44]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={i % 2 ? LEAF : LEAF2} stroke={INK} strokeWidth={5} />)}
      </g>}
      {/* roof tiles flying off */}
      {hole > 0 && hole < 1 && [0, 1, 2, 3].map((i) => <rect key={i} x={-12} y={-6} width={24} height={12} fill="#c0452f" stroke={INK} strokeWidth={3}
        transform={`translate(${HOUSE.x + 240 + (i - 1.5) * 90 * hole} ${HOUSE.y - 40 - 200 * hole + 700 * hole * hole}) rotate(${hole * 400 * (i % 2 ? 1 : -1)})`} />)}
      <Sparkle x={HOUSE.x + 330} y={HOUSE.y - 170} dt={t - T.sa2f - 0.3} r={30} />
    </g>
  );
};

// ---- 9. steel bridge over a river: rust spreads, it snaps and falls into the river
const RIVER_Y = 360, DECK = 250;
const Truss: React.FC<{x0: number; x1: number}> = ({x0, x1}) => {
  const n = Math.round((x1 - x0) / 70), w = (x1 - x0) / n;
  let d = `M ${x0} ${DECK} L ${x1} ${DECK} M ${x0} ${DECK - 80} L ${x1} ${DECK - 80}`;
  for (let i = 0; i <= n; i++) d += ` M ${x0 + i * w} ${DECK} L ${x0 + i * w} ${DECK - 80}`;
  for (let i = 0; i < n; i++) d += ` M ${x0 + i * w} ${i % 2 ? DECK : DECK - 80} L ${x0 + (i + 1) * w} ${i % 2 ? DECK - 80 : DECK}`;
  return <g><path d={d} stroke={INK} strokeWidth={14} fill="none" strokeLinecap="round" /><path d={d} stroke="#8fa3b5" strokeWidth={7} fill="none" strokeLinecap="round" /></g>;
};
const RUST = Array.from({length: 16}, (_, i): [number, number, number, number] => [130 + rand(i * 3.7) * 600, DECK - 80 + rand(i * 5.3) * 90, 18 + rand(i * 2.1) * 26, rand(i * 9.9)]);
const BridgeScene: React.FC<SP> = ({t, ti}) => {
  const rust = seg(t, T.hatsadi - 0.1, T.teqa3 + 0.1);
  const fall = Math.max(0, t - T.teqa3);
  const f = easeIn(clamp(fall / 0.5));
  const half = (side: number) => {
    const piv = side < 0 ? 110 : 750;
    return `rotate(${side * -38 * f} ${piv} ${DECK}) translate(0 ${f * 60})`;
  };
  const span = (x0: number, x1: number) => <g>
    <Truss x0={x0} x1={x1} />
    <rect x={x0} y={DECK - 6} width={x1 - x0} height={16} fill="#5a6470" stroke={INK} strokeWidth={5} />
    <defs><clipPath id={`rc${x0}`}><rect x={x0} y={DECK - 96} width={x1 - x0} height={120} /></clipPath></defs>
    <g clipPath={`url(#rc${x0})`}>
      {RUST.map(([x, y, r, d], i) => { const s = clamp((rust - d * 0.6) / 0.4); return s > 0.01 ? <circle key={i} cx={x} cy={y} r={r * s} fill="#b5532a" opacity={0.85} /> : null; })}
    </g>
  </g>;
  return (
    <g>
      <rect x={0} y={0} width={BW} height={RIVER_Y} fill="#b7d8ec" />
      <rect x={0} y={RIVER_Y} width={BW} height={BH - RIVER_Y} fill="#3d84b8" />
      {[0, 1, 2, 3].map((i) => <path key={i} d={`M ${(i * 230 + ti * 30) % 900 - 40} ${RIVER_Y + 30 + i * 22} l 70 0`} stroke="#fff" strokeOpacity={0.4} strokeWidth={5} strokeLinecap="round" />)}
      <path d={`M 0 ${DECK + 10} L 120 ${DECK + 10} L 150 ${BH} L 0 ${BH} Z`} fill="#8a7a5a" stroke={INK} strokeWidth={6} />
      <path d={`M ${BW} ${DECK + 10} L 740 ${DECK + 10} L 710 ${BH} L ${BW} ${BH} Z`} fill="#8a7a5a" stroke={INK} strokeWidth={6} />
      <g transform={`translate(0 ${fall > 0 ? 0 : Math.sin(ti * 30) * 2 * seg(t, T.hatsadi, T.teqa3)})`}>
        <g transform={half(-1)}>{span(110, 430)}</g>
        <g transform={half(1)}>{span(430, 750)}</g>
      </g>
      {fall > 0.35 && fall < 1.6 && [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const d = fall - 0.35, a = -Math.PI / 2 + (i - 3.5) * 0.28;
        return <circle key={i} cx={430 + Math.cos(a) * 220 * d + (i - 3.5) * 20} cy={RIVER_Y + Math.sin(a) * 200 * d + 300 * d * d} r={10 - i % 3 * 2} fill="#d6efff" stroke={INK} strokeWidth={3} opacity={1 - seg(d, 0.6, 1.2)} />;
      })}
      {fall > 0 && fall < 0.25 && <path d="M 420 210 l 10 -30 l 6 28 l 14 -20" stroke={YELLOW} strokeWidth={8} fill="none" strokeLinecap="round" />}
    </g>
  );
};

// ---- 9b. the city skyline (daylight, empty) gets covered by trees
const TREES = Array.from({length: 22}, (_, i): [number, number, number, number] => [20 + (i % 11) * 82 + rand(i) * 30, i < 11 ? 430 : 300 + rand(i * 3) * 60, 50 + rand(i * 7) * 34, rand(i * 4.4)]);
const ForestScene: React.FC<SP> = ({t, ti}) => {
  const grow = seg(t, T.hatba2a2 - 0.3, T.ghabat + 0.6);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#bfe0c8" />
      <City lit={() => 0} tint={0} />
      {/* vines on the buildings */}
      {CITY.map((b, i) => { const v = seg(t, T.welmodon + i * 0.1, T.hatba2a2 + 0.3 + i * 0.1);
        return v > 0.01 ? <path key={i} d={`M ${b.x + 10} ${GROUND} Q ${b.x + b.w / 2} ${GROUND - b.h * 0.5} ${b.x + 14} ${GROUND - b.h * v}`} stroke={LEAF} strokeWidth={10} fill="none" strokeLinecap="round" /> : null; })}
      {TREES.map(([x, y, r, d], i) => {
        const s = easeOut(clamp((grow - d * 0.6) / 0.4)); if (s < 0.01) return null;
        const sw = Math.sin(ti * 1.5 + i) * 2;
        return <g key={i} transform={`translate(${x + sw} ${y})`}>
          <rect x={-8} y={-10} width={16} height={60} fill="#7a5233" stroke={INK} strokeWidth={4} />
          <circle cx={0} cy={-10 - r * 0.6 * s} r={r * s} fill={i % 3 ? LEAF : LEAF2} stroke={INK} strokeWidth={5} />
        </g>;
      })}
      {Array.from({length: 4}, (_, i) => { const b = (ti * 0.5 + i * 0.27) % 1; return grow > 0.5 ? <path key={i} d={`M ${-30 + b * 920} ${90 + i * 30 + Math.sin(b * 20) * 10} q 10 -10 20 0 q 10 -10 20 0`} stroke={INK} strokeWidth={4} fill="none" /> : null; })}
    </g>
  );
};

// ---- 10. skyscrapers crumble into piles of dust
const TOWERS: {x: number; w: number; h: number; c: string}[] = [{x: 140, w: 120, h: 330, c: '#7fa7c9'}, {x: 330, w: 140, h: 380, c: '#93b7d4'}, {x: 540, w: 110, h: 300, c: '#6f98bd'}, {x: 700, w: 90, h: 250, c: '#86aacb'}];
const crumbleAt = (i: number) => T.hatba2a3 + [0.25, 0.0, 0.42, 0.6][i];
const Tower: React.FC<{w: number; h: number; c: string; vines?: number}> = ({w, h, c, vines = 0}) => (
  <g>
    <rect x={-w / 2} y={-h} width={w} height={h} fill={c} stroke={INK} strokeWidth={6} />
    {Array.from({length: Math.floor(h / 34)}, (_, r) => <path key={r} d={`M ${-w / 2 + 10} ${-h + 20 + r * 34} L ${w / 2 - 10} ${-h + 20 + r * 34}`} stroke="#d8ecff" strokeWidth={8} opacity={0.6} />)}
    <path d={`M ${-w / 2 + w * 0.33} ${-h} L ${-w / 2 + w * 0.33} 0 M ${-w / 2 + w * 0.66} ${-h} L ${-w / 2 + w * 0.66} 0`} stroke={INK} strokeWidth={3} opacity={0.35} />
    {vines > 0 && <path d={`M ${-w / 2 + 8} 0 Q ${w * 0.1} ${-h * 0.4} ${-w / 2 + 12} ${-h * 0.75}`} stroke={LEAF} strokeWidth={9} fill="none" opacity={vines} />}
  </g>
);
const TowersScene: React.FC<SP> = ({t, ti}) => {
  const flag = popIn(t - T.fakhoreen, 0.3);
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill={mix('#c9dbe8', '#d8c7a8', seg(t, T.hatba2a3, T.torab + 0.5))} />
      <rect x={0} y={GROUND} width={BW} height={BH - GROUND} fill="#a99878" stroke={INK} strokeWidth={5} />
      {TOWERS.map((tw, i) => {
        const c = Math.max(0, t - crumbleAt(i)), k = easeIn(clamp(c / 0.7));
        const pile = easeOut(clamp(c / 0.9));
        const glint = bump(t, T.abrag + i * 0.12, 0.06);
        return <g key={i}>
          <defs><clipPath id={`tw${i}`}><rect x={tw.x - tw.w} y={-200} width={tw.w * 2} height={GROUND + 200} /></clipPath></defs>
          {k < 1 && <g clipPath={`url(#tw${i})`}>
            <g transform={`translate(${tw.x + Math.sin(ti * 40 + i) * 3 * (c > 0 ? 1 : 0)} ${GROUND + k * tw.h}) rotate(${k * (i % 2 ? 6 : -6)}) scale(1 ${glint})`}>
              <Tower w={tw.w} h={tw.h} c={tw.c} vines={0.8} />
              {i === 1 && flag > 0.01 && <g transform={`translate(0 ${-tw.h}) scale(${flag})`}>
                <path d="M 0 0 L 0 -70" stroke={INK} strokeWidth={6} />
                <path d={`M 0 -70 Q 26 ${-80 + Math.sin(ti * 6) * 5} 50 -64 L 50 -40 Q 26 ${-50 + Math.sin(ti * 6) * 5} 0 -42 Z`} fill={RED} stroke={INK} strokeWidth={4} />
              </g>}
            </g>
          </g>}
          {/* falling chunks */}
          {c > 0 && c < 1.2 && [0, 1, 2, 3].map((j) => <rect key={j} x={-10} y={-10} width={20} height={16} fill={tw.c} stroke={INK} strokeWidth={3}
            transform={`translate(${tw.x + (j - 1.5) * 50 * c} ${GROUND - tw.h * (1 - k) + 300 * c * c}) rotate(${c * 300 * (j % 2 ? 1 : -1)})`} />)}
          {pile > 0.01 && <path d={`M ${tw.x - tw.w * 0.9} ${GROUND} Q ${tw.x - tw.w * 0.4} ${GROUND - 70 * pile} ${tw.x} ${GROUND - 80 * pile} Q ${tw.x + tw.w * 0.4} ${GROUND - 70 * pile} ${tw.x + tw.w * 0.9} ${GROUND} Z`} fill="#b9ab96" stroke={INK} strokeWidth={5} />}
          <Dust x={tw.x} y={GROUND - 30} dt={c - 0.1} w={tw.w * 2} n={7} seed={i + 3} />
        </g>;
      })}
    </g>
  );
};

// ---- 12. desert, blowing sand, a big shape hidden in the dust; "؟" in the mystery pause
const PYR: [number, number, number][] = [[560, 420, 230], [330, 420, 170], [170, 420, 110]]; // [centre x, base y, half width]
const Pyramid: React.FC<{x: number; y: number; hw: number; gold: number}> = ({x, y, hw, gold}) => {
  const h = hw * 1.25;
  return (
    <g>
      <path d={`M ${x - hw} ${y} L ${x} ${y - h} L ${x + hw * 0.3} ${y} Z`} fill={mix('#c99b5a', '#f1c264', gold)} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d={`M ${x + hw * 0.3} ${y} L ${x} ${y - h} L ${x + hw} ${y} Z`} fill={mix('#9c7440', '#c98f3c', gold)} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      {[0.25, 0.5, 0.75].map((u) => <path key={u} d={`M ${x - hw * (1 - u)} ${y - h * u} L ${x + hw * 0.3 * (1 - u)} ${y - h * u}`} stroke={INK} strokeWidth={2.5} opacity={0.3} />)}
    </g>
  );
};
const Desert: React.FC<{ti: number; haze: number; gold: number}> = ({ti, haze, gold}) => (
  <g>
    <defs><linearGradient id="dsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={mix('#d8a868', '#ffb347', gold)} /><stop offset="1" stopColor={mix('#ecd2a0', '#ffe2a0', gold)} /></linearGradient></defs>
    <rect x={0} y={0} width={BW} height={BH} fill="url(#dsky)" />
    <path d={`M 0 400 Q 200 360 430 392 Q 650 420 860 380 L 860 480 L 0 480 Z`} fill={mix('#d7b27a', '#e9c27a', gold)} stroke={INK} strokeWidth={5} />
    <path d={`M 0 450 Q 300 410 560 446 Q 720 466 860 440 L 860 480 L 0 480 Z`} fill={mix('#c99f66', '#ddb26a', gold)} stroke={INK} strokeWidth={5} />
    {/* blowing sand streaks */}
    {haze > 0.01 && Array.from({length: 26}, (_, i) => {
      const x = ((rand(i * 2.7) * 1100 + ti * (240 + rand(i) * 200)) % 1100) - 120, y = 120 + rand(i * 5.9) * 340;
      return <path key={i} d={`M ${x} ${y} q 30 -6 70 0`} stroke="#fff3d6" strokeWidth={4} strokeLinecap="round" opacity={haze * 0.7} fill="none" />;
    })}
  </g>
);
const DesertScene: React.FC<SP> = ({t, ti}) => {
  const push = 1 + 0.16 * easeInOut(seg(t, T.fih, MYST[1]));
  const shape = 0.18 + 0.22 * seg(t, T.hatfdal, T.kollo + 0.3);
  const q = popIn(t - MYST[0], 0.22);
  const tag = popIn(t - T.arba3, 0.28);
  return (
    <g>
      <g transform={`translate(${MID} 300) scale(${push}) translate(${-MID} -300)`}>
        <Desert ti={ti} haze={1} gold={0} />
        {/* the hidden shape, deep in the dust */}
        <g opacity={shape}><path d={`M 230 420 L 430 170 L 630 420 Z`} fill="#6b5236" /></g>
        <rect x={0} y={0} width={BW} height={BH} fill="#e3c38e" opacity={0.42 + 0.08 * Math.sin(ti * 1.3)} />
        {Array.from({length: 12}, (_, i) => { const x = ((rand(i * 8.1) * 1000 + ti * 120) % 1000) - 70; return <circle key={i} cx={x} cy={200 + rand(i * 3) * 200} r={60 + rand(i) * 40} fill="#f0d8a8" opacity={0.25} />; })}
      </g>
      {tag > 0.01 && <g transform={`translate(${BW - 150} 180) rotate(${-5 + wobble(t - T.arba3 - 0.28, 2.5, 4) * 6}) scale(${tag})`}>
        <rect x={-120} y={-44} width={240} height={88} rx={20} fill={YELLOW} stroke={INK} strokeWidth={7} />
        <Txt x={0} y={22} size={58} fill={INK} sw={0} rtl>{AR(4500)}</Txt>
      </g>}
      <QMark x={430} y={330} size={190} s={q * (1 + 0.05 * Math.sin(ti * 6))} />
    </g>
  );
};

// ---- 13. the dust clears: the three pyramids alone under golden light
const PyramidsScene: React.FC<SP> = ({t, ti}) => {
  const dt = t - T.ahramat, clear = easeOut(clamp(dt / 0.5));
  return (
    <g>
      <Desert ti={ti} haze={1 - clear} gold={clear} />
      <g opacity={0.6 + 0.4 * clear}>
        {Array.from({length: 12}, (_, i) => <path key={i} d={`M 700 90 L ${700 + Math.cos(i * 0.52 + ti * 0.2) * 900} ${90 + Math.sin(i * 0.52 + ti * 0.2) * 900}`} stroke="#fff1b8" strokeWidth={22} opacity={0.12} />)}
        <circle cx={700} cy={90} r={46} fill="#fff1b8" stroke={INK} strokeWidth={5} />
      </g>
      {PYR.map(([x, y, hw], i) => <g key={i} transform={`translate(${x} ${y}) scale(${bump(t, T.ahramat + i * 0.08, 0.06)}) translate(${-x} ${-y})`}><Pyramid x={x} y={y} hw={hw} gold={clear} /></g>)}
      <rect x={0} y={0} width={BW} height={BH} fill="#e3c38e" opacity={0.5 * (1 - clear)} />
      <Sparkle x={560} y={120} dt={dt - 0.05} r={46} />
      <Sparkle x={330} y={210} dt={dt - 0.25} r={32} />
      <Sparkle x={170} y={280} dt={dt - 0.4} r={26} />
    </g>
  );
};

// ---- 14. split board: right = stone block + rope ✓, left = skyscraper as a dust pile ✗
const SplitScene: React.FC<SP> = ({t, ti}) => {
  const stone = popIn(t - T.hagar, 0.3), rope = easeOut(seg(t, T.hebal, T.hebal + 0.45));
  const ok = popIn(t - T.ghalabo, 0.26), no = popIn(t - T.nate7at, 0.26);
  const sky = 1 - easeIn(seg(t, T.nate7at - 0.1, T.nate7at + 0.5)); // the tower crumbles into the pile
  return (
    <g>
      <rect x={0} y={0} width={BW / 2} height={BH} fill="#b8c7d4" />
      <rect x={BW / 2} y={0} width={BW / 2} height={BH} fill="#f1d9a4" />
      <rect x={0} y={400} width={BW} height={80} fill="#c9b48e" stroke={INK} strokeWidth={5} />
      <path d={`M ${MID} 0 L ${MID} ${BH}`} stroke={INK} strokeWidth={8} />
      {/* right: the ancestors' stone */}
      <g transform={`translate(650 400) scale(${stone * bump(t, T.ghalabo, 0.12)})`}>
        <path d="M -110 0 L -100 -130 L 100 -140 L 112 0 Z" fill="#d9b06c" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <path d="M -100 -130 L -70 -160 L 128 -168 L 100 -140 Z M 100 -140 L 128 -168 L 138 -24 L 112 0 Z" fill="#b88d4e" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        {rope > 0.01 && <g>
          <path d={`M -104 -70 Q 0 -60 ${-104 + 220 * rope} -76`} stroke={INK} strokeWidth={14} fill="none" strokeLinecap="round" />
          <path d={`M -104 -70 Q 0 -60 ${-104 + 220 * rope} -76`} stroke="#c9a46a" strokeWidth={7} fill="none" strokeLinecap="round" strokeDasharray="10 6" />
          <path d={`M ${-104 + 220 * rope} -76 Q ${-60 + 260 * rope} ${-160 + Math.sin(ti * 3) * 6} ${30 + 200 * rope} -260`} stroke="#c9a46a" strokeWidth={6} fill="none" strokeDasharray="10 6" opacity={rope} />
        </g>}
      </g>
      <Check x={760} y={110} s={ok} r={46} />
      {/* left: the skyscraper, gone to dust */}
      {sky > 0.01 && <g transform={`translate(215 400) scale(1 ${sky})`}><Tower w={110} h={300} c="#7fa7c9" /></g>}
      <path d={`M 90 400 Q 160 ${400 - 90 * (1 - sky * 0.7)} 215 ${400 - 100 * (1 - sky * 0.7)} Q 280 ${400 - 90 * (1 - sky * 0.7)} 340 400 Z`} fill="#b9ab96" stroke={INK} strokeWidth={6} />
      <Dust x={215} y={370} dt={t - T.nate7at} w={220} n={7} seed={9} />
      <Cross x={110} y={110} s={no} r={40} w={15} />
      <Sparkle x={650} y={210} dt={t - T.ghalabo} r={36} />
    </g>
  );
};

// ---- 15. alone in an empty street: a tiny orange-hoodie man, a tumbleweed, a "؟", a comment icon
const Comment: React.FC = () => (
  <g>
    <path d="M -70 -50 Q -70 -70 -50 -70 L 50 -70 Q 70 -70 70 -50 L 70 10 Q 70 30 50 30 L -10 30 L -40 56 L -34 30 L -50 30 Q -70 30 -70 10 Z" fill="#fff" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    {[-30, 0, 30].map((x) => <circle key={x} cx={x} cy={-20} r={9} fill={INK} />)}
  </g>
);
const AloneScene: React.FC<SP> = ({t, ti}) => {
  const tw = t - T.akher;
  const q = popIn(t - T.awel2, 0.28);
  const cm = popIn(t - T.ekteb, 0.28);
  const lonely = bump(t, T.wa7ed, 0.12);
  return (
    <g>
      <Street sky="#f3c48d" green={0.3} />
      {tw > -0.5 && <g transform={`translate(${-80 + (tw + 0.5) * 330} ${440 - Math.abs(Math.sin((tw + 0.5) * 6)) * 26}) rotate(${(tw + 0.5) * 400})`}>
        <circle r={30} fill="none" stroke="#a7834f" strokeWidth={6} />
        <path d="M -24 -12 Q 0 30 24 -14 M -20 16 Q 0 -30 22 14 M -28 4 L 28 0" stroke="#a7834f" strokeWidth={5} fill="none" />
      </g>}
      <g transform={`translate(${MID} 410) scale(${lonely})`}>
        <ellipse cx={0} cy={6} rx={40} ry={9} fill="#000" opacity={0.2} />
        <Stick x={0} y={0} s={0.62} body="#f2701f" armF={[0.3 + 0.1 * Math.sin(ti * 2), 0.3]} armB={[-0.3, -0.2]} />
      </g>
      <QMark x={MID + 70} y={300} size={110} s={q * (1 + 0.06 * Math.sin(ti * 5))} rot={10} />
      {cm > 0.01 && <g transform={`translate(${BW - 130} ${210 - Math.abs(Math.sin((t - T.ekteb) * 6)) * 24}) scale(${cm})`}><Comment /></g>}
    </g>
  );
};

// ---- the time chip + clock + timeline bar (drawn over the board scenes, under the dimming)
const TimeChip: React.FC<{t: number}> = ({t}) => {
  let k = -1;
  for (let i = 0; i < CHIPS.length; i++) if (t >= CHIPS[i][0] - 0.02) k = i;
  if (k < 0) return null;
  const off = 1 - seg(t, CHIP_OFF, CHIP_OFF + 0.25);
  if (off <= 0.001) return null;
  const pop = popIn(t - CHIPS[k][0] + 0.02, 0.26);
  const fill = (k + easeOut(seg(t, CHIPS[k][0], CHIPS[k][0] + 0.35))) / CHIPS.length;
  const txt = CHIPS[k][1];
  const w = 120 + txt.length * 30;
  const mA = handAngle(t), hA = mA / 12;
  return (
    <g opacity={off}>
      {/* timeline bar */}
      <rect x={60} y={BAR_Y - 6} width={BW - 120} height={12} rx={6} fill="#1b2420" opacity={0.75} stroke={INK} strokeWidth={3} />
      <rect x={BW - 60 - (BW - 120) * fill} y={BAR_Y - 6} width={(BW - 120) * fill} height={12} rx={6} fill={YELLOW} />
      {CHIPS.map((_, i) => <circle key={i} cx={BW - 60 - ((BW - 120) * (i + 1)) / CHIPS.length} cy={BAR_Y} r={7} fill={i <= k ? YELLOW : '#56605a'} stroke={INK} strokeWidth={3} />)}
      {/* chip */}
      <g transform={`translate(${MID} ${CHIP_Y}) scale(${pop})`}>
        <rect x={-w / 2} y={-36} width={w} height={72} rx={36} fill="#fffbe6" stroke={INK} strokeWidth={7} />
        <g transform={`translate(${w / 2 - 38} 0)`}>
          <circle r={25} fill="#fff" stroke={INK} strokeWidth={5} />
          <path d={`M 0 0 L 0 -18`} stroke={RED} strokeWidth={4} strokeLinecap="round" transform={`rotate(${mA})`} />
          <path d={`M 0 0 L 0 -12`} stroke={INK} strokeWidth={5} strokeLinecap="round" transform={`rotate(${hA})`} />
          <circle r={4} fill={INK} />
        </g>
        <Txt x={-24} y={17} size={48} fill={INK} sw={0} rtl>{txt}</Txt>
      </g>
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
      {s === 'power' && <PowerScene t={t} ti={ti} />}
      {s === 'stars' && <StarsScene t={t} ti={ti} />}
      {s === 'metro' && <MetroScene t={t} ti={ti} />}
      {s === 'animals' && <AnimalsScene t={t} ti={ti} />}
      {s === 'asphalt' && <AsphaltScene t={t} ti={ti} />}
      {s === 'roach' && <RoachScene t={t} ti={ti} />}
      {s === 'tree' && <TreeScene t={t} ti={ti} />}
      {s === 'bridge' && <BridgeScene t={t} ti={ti} />}
      {s === 'forest' && <ForestScene t={t} ti={ti} />}
      {s === 'towers' && <TowersScene t={t} ti={ti} />}
      {s === 'desert' && <DesertScene t={t} ti={ti} />}
      {s === 'pyramids' && <PyramidsScene t={t} ti={ti} />}
      {s === 'split' && <SplitScene t={t} ti={ti} />}
      {s === 'alone' && <AloneScene t={t} ti={ti} />}
      {s === 'loop' && <HookScene t={t} ti={ti} frozen />}
    </g>
  );
  // the dust clears into the pyramids in place (no push): a quick white flash instead
  const flash = 1 - seg(t, T.ahramat - 0.02, T.ahramat + 0.25);
  const isReveal = scene === 'pyramids' && prev === 'desert';
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
          {scene === 'pyramids' && flash > 0 && <rect x={0} y={0} width={BW} height={BH} fill="#fff8e0" opacity={flash * 0.8} />}
          <TimeChip t={t} />
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
// ambient bed (pad -> wind + birds), soft hits and the chip whooshes: synthesized by tools/ambient_bed.py, at their mix level
type Cue = [number, string, number];
const TICKS = (t0: number, t1: number, every: number, n: string, v: number): Cue[] => Array.from({length: Math.max(0, Math.floor((t1 - t0) / every))}, (_, i): Cue => [t0 + i * every, n, v]);
const CRACK = 'sommaroy/sfx/crack';
const SFX: Cue[] = [
  // hook: poofs from frame 0
  ...[0, 1, 2, 3, 4, 5, 6, 7].map((k): Cue => [poofAt(k), 'pop', 0.16 + 0.02 * (k % 3)]),
  // power: blocks go dark, the gear stops
  ...OUT.map((o): Cue => [o, 'click', 0.2]), [T.ashan - 0.05, 'pop', 0.18], [T.beyshaghal, 'thud', 0.26],
  // stars
  [T.sama, 'twinkle', 0.14], [T.nogoom, 'sparkle', 0.18], [T.kedda, 'twinkle', 0.12], [T.lamba, 'pop', 0.2],
  // metro
  [T.anfa2, 'whoosh', 0.16], [T.hatghra2, 'thud', 0.24], [T.hatghra2 + 0.15, 'bubbles', 0.18], [T.makan, 'bubbles', 0.14], [T.we2ef, 'gulp', 0.2],
  // animals
  [T.hayawanat, 'pop', 0.14], ...TICKS(T.hayawanat + 0.1, T.ba3d3 - 0.3, 0.42, 'step', 0.12), [T.bareya, 'pop', 0.12], [T.tenzel, 'pop', 0.12],
  // asphalt
  [T.zar3, CRACK, 0.2], [T.hayetla3, 'pop', 0.16], [T.sho2oo2, CRACK, 0.16], [T.asfalt, 'pop', 0.18], [T.weshawre3, 'squish', 0.14], [T.tekhtefi, 'swish', 0.14],
  // cockroach
  [T.saraseer, 'boing', 0.16], [T.hate3eesh, 'sparkle', 0.16], [T.barda, 'click', 0.26], [T.hatmoot, 'tremble', 0.18], [T.bard, 'thud', 0.22], [T.dafa - 0.1, 'pop', 0.16],
  // tree
  [T.shagar, 'pop', 0.14], [T.shababeek, CRACK, 0.34], [T.sa2f, 'thud', 0.3], [T.sa2f + 0.1, 'pop', 0.2],
  // bridge, forest
  [T.hatsadi, 'tremble', 0.16], [T.teqa3, CRACK, 0.3], [T.teqa3 + 0.4, 'thud', 0.28], [T.teqa3 + 0.4, 'bubbles', 0.2], [T.hatba2a2, 'swish', 0.14], [T.ghabat, 'sparkle', 0.14],
  // towers
  [T.fakhoreen, 'pop', 0.16], ...[0, 1, 2, 3].map((i): Cue => [crumbleAt(i), 'thud', 0.2]), [T.hatba2a3, 'tremble', 0.2],
  // signature: stinger exactly on "استنى"
  [T.estanna, 'stinger', 0.34],
  // desert / mystery / reveal
  [T.arba3, 'pop', 0.18], [MYST[0] + 0.02, 'pop', 0.14], [T.ahramat, 'sparkle', 0.26],
  // split
  [T.ya3ni - 0.1, 'swish', 0.2], [T.hagar, 'thud', 0.2], [T.hebal, 'swish', 0.14], [T.ghalabo, 'ding', 0.24], [T.nate7at, 'thud', 0.22],
  // alone + comments
  [T.tab - 0.1, 'swish', 0.2], [T.akher, 'whoosh', 0.12], [T.awel2, 'pop', 0.2], [T.ekteb, 'pop', 0.24], [T.comments, 'boing', 0.14],
  // ending
  [T.fahman - 0.15, 'swish', 0.24], [T.fahman, 'pop', 0.2], [T.kasban, 'twinkle', 0.34],
];
const SCENE_SWISH: Cue[] = SCENES.slice(1).filter(([, s]) => !['pyramids', 'split', 'alone', 'loop'].includes(s)).map(([tt]): Cue => [tt, 'swish', 0.1]);
const POSE_SWAP_SFX: Cue[] = POSES.slice(1).map(([t]) => [t - 0.06, 'swish', 0.07]);
const sfxFile = (n: string) => (n.includes('/') ? `elfahman/${n}.wav` : `elfahman/sfx/${n}.wav`);

// ============================================================ captions (word for word from the script, tashkeel kept)
// The hook card is the biggest text (two lines over the full width with a small margin); other cards stay under it.
const caps = CAPS as unknown as {sizes: number[]; w100: number[]; base: {normal: number; big: number; gold: number}; cards: Record<string, Partial<Group>>};
const PAINT: [string, number, string][] = [
  ['الكهربا', 0, YELLOW], ['نجوم', 0, YELLOW], ['هتغرق', 0, RED], ['الحيوانات', 0, YELLOW], ['الأسفلت', 0, YELLOW], ['هتموت', 0, RED],
  ['الشجر', 0, YELLOW], ['هتصدي', 0, RED], ['غابات', 0, YELLOW], ['تراب', 0, RED], ['استنى', 0, RED], ['الغريب', 0, RED], ['غلبوا', 0, YELLOW],
  ['أول', 1, YELLOW], ['حاجة', 1, YELLOW], ['هتعملها', 0, YELLOW], ['إيه', 1, YELLOW],
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
export const Humans: React.FC = () => {
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
  const sig = t >= T.estanna - 0.02 && t < T.fih ? 0.3 * easeOut(seg(t, T.estanna - 0.02, T.estanna + 0.12)) * (1 - seg(t, T.fih - 0.3, T.fih)) : 0;
  // mood: night for the blackout/stars, back to the warm study light after; golden light for the pyramids
  const night = seg(t, T.kahraba, T.donya + 0.4) * (1 - seg(t, T.ba3d1 - 0.1, T.ba3d1 + 0.4));
  const gold = seg(t, T.ahramat, T.ahramat + 0.4) * (1 - seg(t, T.ya3ni, T.ya3ni + 0.5));
  const myst = seg(t, T.fih, T.fih + 0.5) * (1 - seg(t, T.ahramat - 0.02, T.ahramat + 0.2));
  const ROOM = 0.06 + 0.2 * night + 0.16 * myst;
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
      <AbsoluteFill style={{background: `rgba(255,170,70,${0.06 + 0.1 * gold})`}} />
      <AbsoluteFill style={{background: `rgba(20,40,110,${0.16 * night})`}} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse 78% 62% at 50% 36%, rgba(0,0,0,0) 52%, rgba(0,0,0,${0.3 + sig * 0.6 + myst * 0.15}) 100%)`}} />
      <DownArrows t={t} />
      <Captions t={t} groups={GROUPS} colors={{}} y={1250} x={460} />
      <Sequence from={Math.round(VO * FPS)}><Audio src={staticFile('elfahman/humans/vo/vo.mp3')} volume={1} /></Sequence>
      <Audio src={staticFile('elfahman/humans/music/bed.wav')} volume={1} />
      <Audio src={staticFile('elfahman/humans/music/hits.wav')} volume={1} />
      {[...SFX, ...SCENE_SWISH, ...POSE_SWAP_SFX].map(([tt, n, v], i) => (
        <Sequence key={i} from={Math.max(0, Math.round(tt * FPS))} durationInFrames={Math.round(1.6 * FPS)}>
          <Audio src={staticFile(sfxFile(n))} volume={v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// beats on the board (for QA: the longest time the board goes without a new beat)
export const HUMANS_BEATS: number[] = [
  0, ...[0, 1, 2, 3, 4, 5, 6, 7].map(poofAt), ...CHIPS.map(([c]) => c), ...SCENES.map(([s]) => s), ...OUT, T.ashan, T.beyshaghal,
  T.sama, T.nogoom, T.kedda, T.lamba, T.anfa2, T.hatghra2, T.makan, T.we2ef, T.hayawanat, T.bareya, T.tenzel, T.tetmasha, T.fadya,
  T.zar3, T.hayetla3, T.sho2oo2, T.asfalt, T.weshawre3, T.hatebda2, T.saraseer, T.hate3eesh, T.barda, T.hatmoot, T.bard, T.dafa, T.beyootna + 0.3,
  T.shagar, T.gowa, T.yekasar, T.shababeek, T.yekhrog, T.sa2f, T.hatsadi, T.teqa3, T.welmodon, T.hatba2a2, T.ghabat,
  T.abrag, T.fakhoreen, ...[0, 1, 2, 3].map(crumbleAt), T.estanna, T.fih, T.arba3, T.hatfdal, MYST[0], T.ahramat,
  T.hagar, T.hebal, T.ghalabo, T.nate7at, T.akher, T.wa7ed, T.awel2, T.ekteb, T.fahman, T.kasban,
].sort((a, b) => a - b);
