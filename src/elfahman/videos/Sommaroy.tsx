import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Fonts} from '../lib/fonts';
import {FPS, clamp, easeIn, easeInOut, easeOut, lerp, popIn, popOut, rand, seg, wobble} from '../lib/anim';
import {Cam, CamKey, Layer, camAt, shakeAt} from '../lib/camera';
import {SetBack, SetFront, DESK_SCREEN_Y} from '../lib/Set';
import {CANVAS, Character, HEAD, Pose, PoseKey, blinkTimes, mouthStates, poseAt, squashAt} from '../lib/Character';
import {Captions, Group, RED, YELLOW, Word, norm} from '../lib/Captions';
import {INK, Sparkle, showScale} from '../lib/fx';
import WORDS from './sommaroy.words.json';
import ENV from './sommaroy.env.json';
import CAPS from './sommaroy.captions.json';

// Episode 06: Sommarøy ("سومَرُوي"), the island that tried to abolish time. A strange-story episode: bright and warm for
// the summer part, cooler and darker from the "إعلان" reveal, deep blue + green aurora for the winter line. Three DRAMA
// PAUSES (board freezes, slow push-in, one held low note, soft hit on the next word). Every picture is drawn in code,
// including the map: no generated pictures. The voice is the raw take at 1.0x; pauses were only lengthened with room tone
// (tools/pauses.py). Music, record scratch, crack and tick are synthesized (tools/curious_bed.py). Frame 0 starts directly
// in the hook pose; the last frame cuts into frame 0 inside a pose-swap squash, on the same intact clock.

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
const SPEECH_END = 50.68 + VO; // measured end of the last word
export const SOMMAROY_DURATION_S = Math.round((SPEECH_END + 0.5) * FPS) / FPS; // ~0.5 s of silence after the last word
const END = SOMMAROY_DURATION_S;

const T = {
  gezira: at('جزيرة'), sokan: at('سكانها'), hawlo: at('حاولوا'), yelgho: at('يلغوا'), waqt: at('الوقت'), nafso: at('نفسه'),
  gezira2: at('الجزيرة'), esmaha: at('اسمها'), sommaroy: at('سومروي'), shamal: at('شمال'), norway: at('النرويج'), khales: at('خالص'),
  fiSayf: words[idx('الصيف') - 1].s + VO, sayf: at('الصيف'), shams: at('الشمس'), btghrabsh: at('بتغربش'), aktar: at('أكتر'), shahrein: at('شهرين'), nahar: at('نهار'), tool: at('طول'),
  sa3a: at('الساعة'), etneen: at('اتنين'), bellel: at('بالليل'), el3eyal: at('والعيال'), kora: at('كورة'), share3: at('الشارع'),
  wennas: at('والناس'), btestad: at('بتصطاد'), wbtedhen: at('وبتدهن'), byootha: at('بيوتها'), adi: at('عادي'),
  fa2ahl: at('فأهل'), alo: at('قالوا'), e7na: at('إحنا'), malna: at('مالنا'), wmal: at('ومال'), sa3a2: at('الساعة', 1),
  qaddemo: at('وقدموا'), talab: at('طلب'), barlaman: at('للبرلمان'), ayzeen: at('عايزين'), awel: at('أول'), men: at('من', 1), waqt2: at('وقت'),
  qala3o: at('وقلعوا'), sa3athom: at('ساعاتهم'), alla2oha: at('وعلقوها'), kobry: at('الكوبري'),
  khabar: at('والخبر'), laf: at('لف'), alam2: at('العالم', 1), kollo: at('كله'),
  estanna: at('استنى'), ghareeb: at('الغريب'), gay: at('جاي'),
  tala3: at('طلع'), mawdoo3: at('الموضوع'), e3lan: at('إعلان'),
  hay2a: at('هيئة'), seya7a: at('السياحة'), kanet: at('كانت'), wara: at('ورا'), hekaya: at('الحكاية'), ashan: at('عشان'), tegeeb: at('تجيب'), sowa7: at('سياح'),
  gezira4: at('والجزيرة'), naharda: at('النهارده'), mashya: at('ماشية'), bessa3a: at('بالساعة'), adi2: at('عادي', 1),
  wefi: at('وفي'), sheta: at('الشتا'), bey7sal: at('بيحصل'), aks: at('العكس'), shams2: at('الشمس', 1), btetla3sh: at('بتطلعش'), khales2: at('خالص', 1), hawali: at('حوالي'), shahrein2: at('شهرين', 1),
  testa7mel: at('تستحمل'), leil: at('ليل'), wala: at('ولا'), shams3: at('شمس'), ekteb: at('اكتبلي'), comments: at('الكومنتات'),
  fahman: at('الفهمان'), kasban: at('كسبان'),
};
// signature moments pinned to the measured audio onsets
T.estanna = 29.58 + VO; T.fahman = 49.52 + VO; T.kasban = 50.35 + VO;

// drama pauses: [end of the word before, start of the next word] (0.80 s each in the edited voice)
const pauseAfter = (w: string, nth = 0): [number, number] => { const i = idx(w, nth); return [words[i].e + VO, words[i + 1].s + VO]; };
const DRAMA: [number, number][] = [pauseAfter('بالليل'), pauseAfter('ساعاتهم'), pauseAfter('جاي')];
const [DA, DB, DC] = DRAMA;
// idle clock: every idle wiggle on the board runs on it; it stops in a drama pause and in the freeze-frame from "استنى" to "طلع"
const FREEZE: [number, number][] = [DA, DB, [T.estanna, T.tala3]];
const idle = (t: number) => t - FREEZE.reduce((a, [p0, p1]) => a + clamp(t - p0 - 0.04, 0, p1 - p0 - 0.04), 0);
const inDrama = (t: number) => DRAMA.reduce((a, [p0, p1]) => Math.max(a, easeInOut(seg(t, p0, p0 + 0.3)) * (1 - seg(t, p1, p1 + 0.25))), 0);

// ============================================================ character
const TALKABLE: Pose[] = ['hero', 'explain', 'point_up', 'thinking', 'temple', 'thumbs_up', 'worried'];
const POSES: PoseKey[] = [
  [0, 'thinking'],              // hook pose from frame 0
  [T.gezira2, 'point_up'],      // the map on the board
  [T.fiSayf, 'hero'],
  [T.sa3a, 'explain'],          // "two at night..."
  [T.el3eyal, 'point_up'],      // "...and the kids are playing football!"
  [T.wennas, 'hero'],
  [T.fa2ahl, 'explain'],        // islanders shrug: explaining pose
  [T.qaddemo, 'hero'],
  [T.ayzeen, 'point_up'],
  [T.qala3o, 'explain'],
  [T.alla2oha, 'thumbs_up'],
  [T.khabar, 'point_up'],
  [T.estanna, 'shocked'],       // signature line: shocked stare exactly on "استنى"
  [T.tala3, 'explain'],
  [T.hay2a, 'hero'],
  [T.ashan, 'point_up'],
  [T.gezira4, 'hero'],
  [T.adi2, 'laughing'],         // the smirk: "...runs on the clock, as usual"
  [T.wefi, 'worried'],          // winter
  [T.testa7mel, 'explain'],     // the choice + arrows down to the comments (the library has no pointing-down pose)
  [T.fahman, 'temple'],         // ending: hand on temple exactly on "الفهمان"
];
const MOUTH = mouthStates((ENV as {level: number[]}).level);
const BLINKS = blinkTimes(END, 6);

const CS = 0.6;
const CHAR_X = 540 - (CANVAS[0] * CS) / 2;
const CHAR_Y = DESK_SCREEN_Y - 1450 * CS;
const FACE = {x: CHAR_X + HEAD[0] * CS, y: CHAR_Y + HEAD[1] * CS};

// ============================================================ camera
const CAM0: Cam = {x: 520, y: 860, z: 180};
const BASE: Cam = {x: 512, y: 866, z: 125};
const PUSH_IN: Cam = {x: 510, y: 812, z: 190};
const CAM_KEYS: CamKey[] = [
  [0, 1.0, {x: 512, y: 872, z: 120}], // pulls back from frame 0
  [T.gezira2 - 0.1, T.gezira2 + 0.4, {x: 508, y: 850, z: 146}],
  [T.shamal - 0.05, T.shamal + 0.45, {x: 508, y: 832, z: 172}],  // the fast zoom into the north
  [T.fiSayf - 0.1, T.fiSayf + 0.4, BASE],
  [T.aktar - 0.04, T.aktar + 0.3, {x: 508, y: 852, z: 148}],
  [T.sa3a - 0.1, T.sa3a + 0.4, {x: 508, y: 850, z: 146}],
  [DA[0], DA[1], PUSH_IN],                                       // drama pause (a): slow push-in
  [DA[1], DA[1] + 0.45, {x: 510, y: 850, z: 145}],
  [T.wennas - 0.1, T.wennas + 0.4, BASE],
  [T.fa2ahl - 0.1, T.fa2ahl + 0.4, {x: 508, y: 856, z: 140}],
  [T.sa3a2 - 0.04, T.sa3a2 + 0.25, {x: 508, y: 842, z: 160}],
  [T.qaddemo - 0.1, T.qaddemo + 0.4, BASE],
  [T.men - 0.05, T.waqt2 + 0.2, {x: 508, y: 846, z: 158}],
  [T.qala3o - 0.1, T.qala3o + 0.4, {x: 508, y: 852, z: 145}],
  [DB[0], DB[1], PUSH_IN],                                       // drama pause (b)
  [DB[1], DB[1] + 0.45, {x: 510, y: 850, z: 148}],
  [T.khabar - 0.1, T.khabar + 0.4, BASE],
  [T.estanna - 0.04, T.estanna + 0.1, {x: 540, y: 690, z: 280}], // punch-in exactly on "استنى" (the board stays in frame)
  [DC[0], DC[1], {x: 536, y: 672, z: 330}],                      // drama pause (c): slow push-in
  [T.tala3 - 0.05, T.tala3 + 0.35, {x: 508, y: 846, z: 150}],
  [T.e3lan - 0.04, T.e3lan + 0.15, {x: 508, y: 836, z: 170}],    // the stamp
  [T.hay2a - 0.1, T.hay2a + 0.4, BASE],
  [T.sowa7 - 0.04, T.sowa7 + 0.3, {x: 508, y: 850, z: 150}],
  [T.gezira4 - 0.1, T.gezira4 + 0.4, BASE],
  [T.wefi - 0.1, T.aks + 0.4, {x: 510, y: 842, z: 160}],         // night falls: slow push
  [T.btetla3sh - 0.04, T.btetla3sh + 0.25, {x: 508, y: 836, z: 170}],
  [T.testa7mel - 0.1, T.testa7mel + 0.4, {x: 512, y: 866, z: 128}],
  [T.ekteb - 0.1, T.ekteb + 0.4, {x: 512, y: 868, z: 122}],
  [T.fahman - 0.1, T.fahman + 0.5, CAM0], // ends on the opening framing
];
const SHAKES: [number, number, number][] = [
  [T.gezira, 3.5, 10], [T.sokan, 3.5, 10], [T.hawlo, 4.5, 10], [T.waqt, 6, 9],
  [T.estanna, 16, 6], [DA[1], 3.5, 9], [DB[1], 3.5, 9], [DC[1], 3.5, 9], [T.e3lan, 10, 8],
  [T.bellel, 3, 10], [T.sa3a2, 3, 10], [T.btetla3sh, 4, 9],
];

// ============================================================ drawing kit (all code)
const BOARD = '#21302b', CHALK = '#fdf6e8', GREEN = '#43a85a', PAPER = '#fbf1d8', GREY = '#8a949c', DARK = '#3a2416';
const SEA = '#2f7aa0', LAND = '#5f8f56', SKIN = '#e8b48a', SUN = '#ffcb2e';
const bump = (t: number, t0: number, a = 0.14, k = 9) => (t < t0 ? 1 : 1 + a * Math.exp(-(t - t0) * k) * Math.cos((t - t0) * 18));
const stamp = (dt: number) => (dt < 0 ? 0 : dt < 0.12 ? lerp(2.3, 1, easeIn(dt / 0.12)) : 1 + wobble(dt - 0.12, 5, 10) * 0.08);
const AR = (n: number) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);
type Pt = [number, number];
const poly = (pts: Pt[]) => 'M ' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L ') + ' Z';
const blob = (cx: number, cy: number, r: number, seed: number, n = 16, j = 0.3): Pt[] =>
  Array.from({length: n}, (_, i) => { const a = (i / n) * Math.PI * 2, rr = r * (1 + j * (rand(seed * 31 + i) - 0.5) + 0.12 * Math.sin(a * 3 + seed)); return [cx + rr * Math.cos(a), cy + rr * Math.sin(a) * 0.78]; });

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
const Cross: React.FC<{x: number; y: number; s: number; r?: number; rot?: number; w?: number}> = ({x, y, s, r = 60, rot = 0, w = 22}) => s <= 0.001 ? null : (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    {[INK, RED].map((c, i) => <path key={c} d={`M ${-r} ${-r} L ${r} ${r} M ${r} ${-r} L ${-r} ${r}`} stroke={c} strokeWidth={i ? w : w + 13} strokeLinecap="round" />)}
  </g>
);
const Tag: React.FC<{x: number; y: number; s: number; w: number; h: number; size: number; rot?: number; fill?: string; children: React.ReactNode}> = ({x, y, s, w, h, size, rot = 0, fill = YELLOW, children}) => s <= 0.001 ? null : (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h * 0.24} fill={fill} stroke={INK} strokeWidth={8} />
    <circle cx={w / 2 - 22} cy={0} r={7} fill={BOARD} stroke={INK} strokeWidth={5} />
    <text x={-10} y={size * 0.34} textAnchor="middle" direction="rtl" fontFamily="Cairo" fontWeight={900} fontSize={size} fill={INK}>{children}</text>
  </g>
);

// ---- clock: angles in degrees (0 = 12 o'clock)
const hm = (h: number, m: number): [number, number] => [((h % 12) + m / 60) * 30, m * 6];
const Hand: React.FC<{a: number; len: number; w: number; c?: string}> = ({a, len, w, c = INK}) => (
  <path d={`M 0 ${len * 0.14} L 0 ${-len}`} stroke={c} strokeWidth={w} strokeLinecap="round" transform={`rotate(${a})`} />
);
const ClockFace: React.FC<{r: number; hA: number; mA: number; sA?: number; face?: string; rim?: string; hands?: boolean}> = ({r, hA, mA, sA, face = '#fffbe6', rim = '#c98a1e', hands = true}) => (
  <g>
    <circle r={r} fill={face} stroke={INK} strokeWidth={r * 0.09} />
    <circle r={r * 0.9} fill="none" stroke={rim} strokeWidth={r * 0.07} />
    {Array.from({length: 12}, (_, i) => <path key={i} d={`M 0 ${-r * 0.8} L 0 ${-r * (i % 3 ? 0.71 : 0.64)}`} stroke={INK} strokeWidth={r * (i % 3 ? 0.035 : 0.06)} strokeLinecap="round" transform={`rotate(${i * 30})`} />)}
    {hands && <g>
      <Hand a={hA} len={r * 0.46} w={r * 0.085} />
      <Hand a={mA} len={r * 0.68} w={r * 0.06} />
      {sA !== undefined && <Hand a={sA} len={r * 0.72} w={r * 0.025} c={RED} />}
      <circle r={r * 0.07} fill={RED} stroke={INK} strokeWidth={r * 0.025} />
    </g>}
  </g>
);
const Sun: React.FC<{r: number; rot?: number}> = ({r, rot = 0}) => (
  <g>
    <g transform={`rotate(${rot})`}>
      {Array.from({length: 10}, (_, i) => <path key={i} d={`M 0 ${-r * 1.18} L ${r * 0.16} ${-r * 1.5} L ${-r * 0.16} ${-r * 1.5} Z`} fill={SUN} stroke={INK} strokeWidth={r * 0.08} strokeLinejoin="round" transform={`rotate(${i * 36})`} />)}
    </g>
    <circle r={r} fill={SUN} stroke={INK} strokeWidth={r * 0.12} />
    <circle cx={-r * 0.3} cy={-r * 0.3} r={r * 0.25} fill="#fff6c2" opacity={0.8} />
  </g>
);
const Moon: React.FC<{r: number}> = ({r}) => (
  <path d={`M ${r * 0.2} ${-r} A ${r} ${r} 0 1 0 ${r * 0.2} ${r} A ${r * 0.78} ${r * 0.86} 0 1 1 ${r * 0.2} ${-r} Z`} fill="#f6ecc0" stroke={INK} strokeWidth={r * 0.12} strokeLinejoin="round" />
);

// ---- stick figure; (x, y) = feet. Arm = [upper, lower] angle in radians (0 = hanging down, + = forward)
type Arm = [number, number];
const ARM = 60, SH_Y = -128;
const handAt = (a: Arm, sy = SH_Y): Pt => [Math.sin(a[0]) * ARM / 2 + Math.sin(a[1]) * ARM / 2, sy + Math.cos(a[0]) * ARM / 2 + Math.cos(a[1]) * ARM / 2];
const Stick: React.FC<{x: number; y: number; s?: number; dir?: number; armF?: Arm; armB?: Arm; legF?: number; shrug?: number; rot?: number; hat?: string; children?: React.ReactNode}> =
({x, y, s = 1, dir = 1, armF = [0.25, 0.2], armB = [-0.25, -0.2], legF = 0.13, shrug = 0, rot = 0, hat, children}) => {
  const hy = -80, ny = -140, hd = -170, L = 82, sy = SH_Y - 7 * shrug;
  const aF: Arm = [lerp(armF[0], 1.45, shrug), lerp(armF[1], 2.75, shrug)], aB: Arm = [lerp(armB[0], -1.45, shrug), lerp(armB[1], -2.75, shrug)];
  const arm = (a: Arm) => { const e: Pt = [Math.sin(a[0]) * ARM / 2, sy + Math.cos(a[0]) * ARM / 2], h = handAt(a, sy); return ` M 0 ${sy} L ${e[0]} ${e[1]} L ${h[0]} ${h[1]}`; };
  const d = `M 0 ${hy} L ${Math.sin(legF) * L} ${hy + Math.cos(legF) * L} M 0 ${hy} L ${-Math.sin(0.13) * L} ${hy + Math.cos(0.13) * L} M 0 ${hy} L 0 ${ny}` + arm(aF) + arm(aB);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s * dir} ${s})`}>
      <path d={d} stroke={INK} strokeWidth={21} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={0} cy={hd} r={29} fill={CHALK} stroke={INK} strokeWidth={6.5} />
      <path d={d} stroke={CHALK} strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={2} cy={hd - 4} r={3.8} fill={INK} /><circle cx={17} cy={hd - 4} r={3.8} fill={INK} />
      {shrug > 0.3 ? <g>
        <path d={`M -4 ${hd - 17} l 10 -3 M 13 ${hd - 19} l 10 2`} stroke={INK} strokeWidth={4} strokeLinecap="round" />
        <path d={`M 4 ${hd + 11} l 13 -2`} stroke={INK} strokeWidth={4} strokeLinecap="round" />
      </g> : <path d={`M 3 ${hd + 9} q 7 6 14 0`} stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />}
      {hat && <path d={`M -32 ${hd - 18} Q 0 ${hd - 62} 32 ${hd - 18} Z`} fill={hat} stroke={INK} strokeWidth={6} strokeLinejoin="round" />}
      {children}
    </g>
  );
};

// ---- small island with houses (y = sea level); snow / lit windows for winter
const HOUSES: [number, string][] = [[-74, '#d9483b'], [-22, '#ffd23f'], [30, '#f4efe2'], [80, '#d9483b']];
const Isle: React.FC<{w?: number; snow?: number; lit?: number; green?: string}> = ({w = 170, snow = 0, lit = 0, green = LAND}) => {
  const top = (x: number) => -74 * (1 - (x / w) ** 2);
  return (
    <g>
      <path d={`M ${-w} 6 C ${-w * 0.7} -40 ${-w * 0.4} -76 0 -78 C ${w * 0.4} -76 ${w * 0.7} -40 ${w} 6 Z`} fill={green} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      {snow > 0 && <path d={`M ${-w * 0.55} -52 C ${-w * 0.3} -74 ${w * 0.3} -74 ${w * 0.55} -52 L ${w * 0.3} -46 L ${w * 0.1} -54 L ${-w * 0.12} -44 L ${-w * 0.34} -52 Z`} fill="#f2f7ff" opacity={snow} />}
      {HOUSES.map(([x, c], i) => {
        const y = top(x) + 18;
        return (
          <g key={i} transform={`translate(${x} ${y})`}>
            <rect x={-15} y={-20} width={30} height={22} fill={c} stroke={INK} strokeWidth={5} />
            <path d="M -20 -18 L 0 -36 L 20 -18 Z" fill={snow > 0.5 ? '#f2f7ff' : '#6b3a2a'} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <rect x={-5} y={-14} width={10} height={9} fill={lit > 0 ? `rgba(255,214,90,${0.4 + 0.6 * lit})` : '#5a7d93'} />
          </g>
        );
      })}
    </g>
  );
};
// sky + sea background for an outdoor board scene (colours interpolate between two palettes with k)
const mix = (a: string, b: string, k: number) => {
  const p = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(lerp(v, B[i], clamp(k))).toString(16).padStart(2, '0')).join('');
};
const SKY_WARM: [string, string] = ['#ffb75e', '#ffe6a8'], SKY_COOL: [string, string] = ['#8ea6b8', '#d2dee6'], SKY_NIGHT: [string, string] = ['#060f29', '#1b2f63'];
const Sky: React.FC<{id: string; top: string; bot: string; horizon?: number; sea?: string}> = ({id, top, bot, horizon = 360, sea = SEA}) => (
  <g>
    <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={top} /><stop offset="1" stopColor={bot} /></linearGradient></defs>
    <rect x={0} y={0} width={BW} height={horizon} fill={`url(#${id})`} />
    <rect x={0} y={horizon} width={BW} height={BH - horizon} fill={sea} />
    {[0, 1, 2].map((i) => <path key={i} d={`M ${60 + i * 260} ${horizon + 34 + i * 22} l 90 0 M ${160 + i * 240} ${horizon + 70 + (i % 2) * 20} l 60 0`} stroke="#fff" strokeOpacity={0.35} strokeWidth={6} strokeLinecap="round" />)}
  </g>
);

// ============================================================ board (chalkboard inset above his head)
const BX = 80, BY = 84, BW = 860, BH = 480, MID = BW / 2;
type Scene = 'hook' | 'map' | 'summer' | 'clock' | 'people' | 'shrug' | 'petition' | 'watches' | 'news' | 'tourism' | 'bridge2' | 'winter' | 'choice' | 'loop';
const PUSH = 0.3;
const SCENES: [number, Scene][] = [
  [0, 'hook'], [T.gezira2 - 0.1, 'map'], [T.fiSayf - 0.1, 'summer'], [T.sa3a - 0.1, 'clock'], [T.wennas - 0.1, 'people'], [T.fa2ahl - 0.1, 'shrug'],
  [T.qaddemo - 0.1, 'petition'], [T.qala3o - 0.1, 'watches'], [T.khabar - 0.1, 'news'], [T.hay2a - 0.1, 'tourism'], [T.gezira4 - 0.1, 'bridge2'],
  [T.wefi - 0.1, 'winter'], [T.testa7mel - 0.1, 'choice'], [T.fahman - 0.15, 'loop'],
];
type SP = {t: number; ti: number};

// ---- 1. hook: the wall clock cracks (from frame 0), its hands spin, then fly off; pieces break off and fade out
const HR = 172, HC: Pt = [MID, 244], IMPACT: Pt = [52, -46];
const CRACKS: {a: number; t0: number}[] = [{a: -38, t0: 0}, {a: 160, t0: 0}, {a: 22, t0: T.gezira}, {a: 210, t0: T.gezira}, {a: 95, t0: T.sokan}, {a: -95, t0: T.hawlo}, {a: 128, t0: T.hawlo}];
const crackPath = (a: number, k: number) => {
  const r = (a * Math.PI) / 180; let [x, y] = IMPACT; const pts: Pt[] = [[x, y]];
  for (let i = 1; i <= 7; i++) {
    const j = (rand(k * 17 + i) - 0.5) * 0.9; x += Math.cos(r + j) * 30; y += Math.sin(r + j) * 30;
    if (Math.hypot(x, y) > HR * 0.86) break; pts.push([x, y]);
  }
  return 'M ' + pts.map((p) => p.join(' ')).join(' L ');
};
const CRACK_D = CRACKS.map((c, k) => crackPath(c.a, k));
const SHARDS: [number, number][] = [[-62, -32], [14, 44], [104, 132], [188, 214], [246, 270]];
const shardPts = ([a0, a1]: [number, number]): Pt[] => {
  const pts: Pt[] = [];
  for (let i = 0; i <= 4; i++) { const a = ((lerp(a0, a1, i / 4) - 90) * Math.PI) / 180; pts.push([Math.cos(a) * HR * 0.86, Math.sin(a) * HR * 0.86]); }
  for (let i = 4; i >= 0; i--) { const a = ((lerp(a0, a1, i / 4) - 90) * Math.PI) / 180, rr = HR * (0.6 + 0.08 * rand(i + a0)); pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
  return pts;
};
const HookScene: React.FC<SP & {frozen?: boolean}> = ({t, ti, frozen = false}) => {
  const tt = frozen ? 0 : t, ii = frozen ? 0 : ti;
  const spin = tt < T.yelgho ? tt : T.yelgho;
  const mA = 60 + 420 * spin + 260 * spin * spin, hA = 305 + mA / 12;
  const fly = tt - T.yelgho, broke = tt - T.waqt;
  const tremble = frozen ? 0 : Math.sin(ii * 47) * 2.4 * (1 - seg(tt, T.nafso, T.nafso + 0.4));
  return (
    <g>
      <g transform={`translate(${HC[0] + tremble} ${HC[1]}) rotate(${broke > 0 ? easeOut(clamp(broke / 0.5)) * -5 : 0})`}>
        <ClockFace r={HR} hA={hA} mA={mA} hands={false} />
        {/* holes left by the pieces */}
        {SHARDS.map((s, i) => broke > 0.02 ? <path key={i} d={poly(shardPts(s))} fill="#16211d" stroke={INK} strokeWidth={5} strokeLinejoin="round" /> : null)}
        {CRACKS.map((c, k) => {
          const p = easeOut(seg(tt, c.t0, c.t0 + 0.32));
          return p <= 0.001 ? null : <g key={k}>
            <path d={CRACK_D[k]} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d={CRACK_D[k]} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} stroke="#fff" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
          </g>;
        })}
        {/* the hands: spinning wildly, then they fly off */}
        {fly < 0.8 && <g>
          <g transform={`translate(${fly > 0 ? -280 * fly : 0} ${fly > 0 ? -330 * fly + 700 * fly * fly : 0}) rotate(${fly > 0 ? -800 * fly : 0})`} opacity={1 - seg(fly, 0.4, 0.8)}>
            <Hand a={hA} len={HR * 0.46} w={HR * 0.085} />
          </g>
          <g transform={`translate(${fly > 0 ? 300 * fly : 0} ${fly > 0 ? -380 * fly + 760 * fly * fly : 0}) rotate(${fly > 0 ? 900 * fly : 0})`} opacity={1 - seg(fly, 0.4, 0.8)}>
            <Hand a={mA} len={HR * 0.68} w={HR * 0.06} />
          </g>
        </g>}
        <circle r={HR * 0.07} fill={RED} stroke={INK} strokeWidth={HR * 0.025} />
        {/* the pieces: fall, spin and fade out */}
        {SHARDS.map((s, i) => {
          const d = broke, vx = (i - 2) * 110;
          if (d <= 0 || d > 0.95) return null;
          return <path key={i} d={poly(shardPts(s))} fill="#fffbe6" stroke={INK} strokeWidth={5} strokeLinejoin="round"
            transform={`translate(${vx * d} ${-120 * d + 1500 * d * d}) rotate(${(i % 2 ? 1 : -1) * 260 * d})`} opacity={1 - seg(d, 0.45, 0.95)} />;
        })}
      </g>
      <Sparkle x={HC[0] + IMPACT[0] + 10} y={HC[1] + IMPACT[1] - 10} dt={tt - T.waqt} r={40} />
    </g>
  );
};

// ---- 2. map: Europe -> fast zoom into northern Norway -> the island Sommarøy glows yellow, with its label
const EU_MAIN = 'M 0 480 L 0 420 L 60 400 L 120 404 L 150 380 L 168 352 L 205 352 L 240 344 L 285 348 L 318 342 L 345 346 L 360 338 L 372 318 L 386 322 L 392 342 L 430 340 L 470 330 L 510 316 L 560 300 L 610 292 L 660 280 L 700 262 L 760 250 L 860 236 L 860 480 Z';
const EU_SCAN = 'M 345 300 L 330 280 L 328 255 L 340 232 L 352 212 L 366 192 L 382 170 L 400 148 L 420 126 L 440 106 L 462 86 L 484 70 L 504 58 L 526 46 L 552 38 L 580 34 L 610 38 L 640 44 L 668 56 L 700 66 L 716 92 L 722 130 L 712 170 L 700 210 L 690 246 L 660 258 L 625 262 L 596 258 L 606 236 L 600 196 L 592 160 L 574 126 L 552 118 L 536 140 L 522 180 L 510 222 L 498 256 L 478 288 L 452 312 L 432 312 L 420 296 L 404 300 L 386 306 L 362 308 Z';
const EU_GB = 'M 250 330 L 236 318 L 242 300 L 232 284 L 240 262 L 232 240 L 246 222 L 262 230 L 260 252 L 272 274 L 280 300 L 270 322 Z';
const EU_IE = 'M 212 300 L 198 308 L 194 288 L 206 272 L 220 280 Z';
const EU_IS = 'M 70 120 L 100 100 L 140 104 L 156 124 L 128 142 L 86 140 Z';
const EU = [EU_MAIN, EU_SCAN, EU_GB, EU_IE, EU_IS];
const DOT: Pt = [496, 60], ISLE: Pt = [318, 262];
// detail of the north: a fjord coast (land to the lower right), islands; Sommarøy is the small one on the left
const COAST: string = (() => {
  const A: Pt = [380, 520], B: Pt = [900, -10], pts: Pt[] = [];
  for (let i = 0; i <= 64; i++) {
    const u = i / 64, bx = lerp(A[0], B[0], u), by = lerp(A[1], B[1], u), off = 16 * Math.sin(u * 37 + 1) + 9 * Math.sin(u * 91);
    pts.push([bx - off * 0.7, by - off * 0.7]);
    if (i % 8 === 4) { pts.push([bx + 22 + 10 * rand(i), by + 30 + 10 * rand(i + 9)]); pts.push([bx + 6, by + 10]); }
  }
  return poly([...pts, [900, 520]]);
})();
const ISLANDS: [number, number, number, number][] = [[520, 236, 74, 1], [610, 118, 44, 2], [420, 336, 26, 3], [232, 344, 20, 4], [396, 168, 18, 5], [700, 40, 30, 6], [160, 190, 14, 7]];
const SOMMAROY = poly(blob(ISLE[0], ISLE[1], 40, 9, 18, 0.35));
const MapScene: React.FC<SP> = ({t, ti}) => {
  const z = easeInOut(seg(t, T.shamal - 0.05, T.shamal + 0.5));
  const k = Math.exp(lerp(0, Math.log(7), z));
  const off: Pt = [lerp(DOT[0], ISLE[0], z), lerp(DOT[1], ISLE[1], z)];
  const eu = 1 - seg(z, 0.55, 0.95), det = seg(z, 0.5, 0.92), ds = lerp(0.3, 1, easeOut(seg(z, 0.3, 1)));
  const glow = 0.6 + 0.4 * Math.sin(ti * 5);
  const lab = popIn(t - T.sommaroy, 0.28);
  const labPos: Pt = [lerp(DOT[0] + 4, ISLE[0], z), lerp(DOT[1] + 92, ISLE[1] - 96, z)];
  const pulse = (ti * 1.1) % 1;
  return (
    <g>
      <rect x={0} y={0} width={BW} height={BH} fill="#24566e" />
      {[90, 190, 290, 390].map((y) => <path key={y} d={`M 0 ${y} L ${BW} ${y - 30}`} stroke="#fff" strokeOpacity={0.07} strokeWidth={3} strokeDasharray="14 14" />)}
      {eu > 0.001 && <g opacity={eu} transform={`translate(${off[0]} ${off[1]}) scale(${k}) translate(${-DOT[0]} ${-DOT[1]})`}>
        {EU.map((d, i) => <path key={i} d={d} fill={i === 1 ? '#6f9d62' : '#4f7a4b'} stroke={INK} strokeWidth={7} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />)}
        <circle cx={DOT[0]} cy={DOT[1]} r={(10 + pulse * 26) / k} fill="none" stroke={YELLOW} strokeWidth={5} vectorEffect="non-scaling-stroke" opacity={(1 - pulse) * popIn(t - T.gezira2 - 0.25, 0.3)} />
        <circle cx={DOT[0]} cy={DOT[1]} r={11 / k * popIn(t - T.gezira2 - 0.2, 0.3)} fill={YELLOW} stroke={INK} strokeWidth={4} vectorEffect="non-scaling-stroke" />
      </g>}
      {det > 0.001 && <g opacity={det} transform={`translate(${ISLE[0]} ${ISLE[1]}) scale(${ds}) translate(${-ISLE[0]} ${-ISLE[1]})`}>
        <path d={COAST} fill="#5f8f56" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <path d={COAST} fill="none" stroke="#f2f7ff" strokeWidth={3} opacity={0.35} transform="translate(30 30)" />
        {ISLANDS.map(([x, y, r, s]) => <path key={s} d={poly(blob(x, y, r, s, 14, 0.4))} fill="#6f9d62" stroke={INK} strokeWidth={6} strokeLinejoin="round" />)}
        <g transform={`translate(700 ${400 + Math.sin(ti * 2) * 2}) scale(${popIn(t - T.norway, 0.28)})`}><Txt x={0} y={0} size={46} rtl>النرويج</Txt></g>
        {/* Sommarøy: glowing yellow outline */}
        <defs><filter id="isglow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="9" /></filter></defs>
        <path d={SOMMAROY} fill="none" stroke={YELLOW} strokeWidth={22} opacity={0.75 * glow} filter="url(#isglow)" />
        <path d={SOMMAROY} fill="#7fae6a" stroke={INK} strokeWidth={7} strokeLinejoin="round" transform={`translate(${ISLE[0]} ${ISLE[1]}) scale(${bump(t, T.khales, 0.12)}) translate(${-ISLE[0]} ${-ISLE[1]})`} />
        <path d={SOMMAROY} fill="none" stroke={YELLOW} strokeWidth={6} strokeLinejoin="round" opacity={0.6 + 0.4 * glow} />
      </g>}
      {lab > 0.001 && <g>
        <path d={`M ${labPos[0]} ${labPos[1] - 36} L ${lerp(DOT[0], ISLE[0], z)} ${lerp(DOT[1], ISLE[1], z) - lerp(14, 34, z)}`} stroke={YELLOW} strokeWidth={5} strokeDasharray="8 8" opacity={lab} />
        <Tag x={labPos[0]} y={labPos[1]} s={lab} w={248} h={86} size={50} rot={-4 + wobble(t - T.sommaroy - 0.28, 2.5, 4) * 7}>سومَرُوي</Tag>
      </g>}
      <Sparkle x={ISLE[0] + 60} y={ISLE[1] - 40} dt={t - T.khales} r={34} />
    </g>
  );
};

// ---- calendar: flips quickly through the days
const Calendar: React.FC<{day: number; flip: number; dark?: boolean}> = ({day, flip, dark = false}) => (
  <g>
    <rect x={-72} y={-64} width={144} height={152} rx={14} fill={dark ? '#dfe6f2' : '#fff'} stroke={INK} strokeWidth={8} />
    <rect x={-72} y={-64} width={144} height={42} rx={14} fill={dark ? '#3d5a9e' : RED} stroke={INK} strokeWidth={8} />
    {[-36, 36].map((x) => <rect key={x} x={x - 6} y={-78} width={12} height={28} rx={6} fill="#cfd6dd" stroke={INK} strokeWidth={5} />)}
    <Txt x={0} y={64} size={day > 99 ? 62 : 76} fill={INK} sw={0}>{AR(day)}</Txt>
    {flip > 0 && flip < 1 && <g transform={`translate(0 -22) scale(1 ${Math.cos(flip * Math.PI)})`}>
      <rect x={-68} y={0} width={136} height={106} rx={10} fill={flip < 0.5 ? '#f3f3f3' : '#c9c9c9'} stroke={INK} strokeWidth={6} />
    </g>}
  </g>
);

// ---- 3. summer sky: the sun runs along the horizon but never sets; a calendar flips through the days
const SummerScene: React.FC<SP> = ({t, ti}) => {
  const a = Math.PI + (2 * Math.PI * (ti - T.btghrabsh)) / 4.6;
  const dip = Math.exp(-Math.abs(t - T.btghrabsh - 0.15) * 3) * (t > T.btghrabsh - 0.4 ? 1 : 0);
  const sx = MID + 330 * Math.sin(a), sy = 196 - 94 * Math.cos(a) + 0 * dip;
  const cal = popIn(t - T.aktar, 0.26), cu = seg(t, T.aktar + 0.05, T.tool + 0.2), day = 1 + Math.floor(cu * 69), fl = (cu * 69) % 1;
  const glow = seg(t, T.nahar, T.nahar + 0.4);
  return (
    <g>
      <Sky id="skyS" top={SKY_WARM[0]} bot={SKY_WARM[1]} horizon={360} />
      {/* the sun's loop: it never goes under the horizon */}
      <ellipse cx={MID} cy={196} rx={330} ry={94} fill="none" stroke="#fff" strokeOpacity={0.55} strokeWidth={5} strokeDasharray="10 14" />
      <g transform={`translate(${sx} ${sy}) scale(${1 + 0.18 * glow})`}>
        {glow > 0 && <circle r={70} fill="#fff3b0" opacity={0.35 * glow} />}
        <Sun r={38} rot={ti * 40} />
      </g>
      <g transform={`translate(${MID} 362)`}><Isle /></g>
      {/* "it doesn't set": down arrow at the low point, crossed out */}
      {t >= T.btghrabsh - 0.05 && <g transform={`translate(${MID} 120) scale(${showScale(t, T.btghrabsh - 0.05, T.aktar + 0.6, 0.22, 0.16)})`}>
        <path d="M 0 -48 L 0 30 M -26 6 L 0 34 L 26 6" stroke={INK} strokeWidth={22} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 0 -48 L 0 30 M -26 6 L 0 34 L 26 6" stroke="#fff" strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <Cross x={0} y={-6} s={stamp(t - T.btghrabsh - 0.18) * 0.6} r={46} w={18} />
      </g>}
      {cal > 0.001 && <g transform={`translate(104 392) rotate(-5) scale(${cal * 0.8})`}><Calendar day={day} flip={cu > 0 && cu < 1 ? fl : 0} /></g>}
    </g>
  );
};

// ---- 4. 2:00 at night: clock, moon ✗ sun ✓; after drama pause (a) kids kick a ball under a bright sun
const KA = 300, KB = 580, KY = 452, KP = 0.78;
const ClockScene: React.FC<SP> = ({t, ti}) => {
  const c = popIn(t - T.sa3a, 0.28), sp = easeInOut(seg(t, T.sa3a + 0.05, T.etneen + 0.12));
  const mA = lerp(60, 720, sp), hA = lerp(305, 60, sp);
  const u = easeInOut(seg(t, T.el3eyal - 0.05, T.el3eyal + 0.35));
  const cx = lerp(240, 92, u), cy = lerp(244, 92, u), cs = lerp(1, 0.42, u);
  const moon = popIn(t - T.bellel, 0.26) * (1 - u), sunS = popIn(t - T.bellel - 0.2, 0.26);
  const sunX = lerp(720, 760, u), sunY = lerp(160, 86, u);
  // ball: back and forth between the two kids
  const ph = Math.max(0, (ti - idle(T.el3eyal)) / KP), leg = Math.floor(ph), f = ph - leg, ab = leg % 2 === 0;
  const bx = ab ? lerp(KA + 44, KB - 44, f) : lerp(KB - 44, KA + 44, f), by = KY - 16 - Math.sin(f * Math.PI) * 120;
  const kickA = ab ? Math.exp(-f * 9) : 0, kickB = ab ? 0 : Math.exp(-f * 9);
  const kids = popIn(t - T.el3eyal, 0.26);
  return (
    <g>
      <Sky id="skyC" top={SKY_WARM[0]} bot={SKY_WARM[1]} horizon={BH} />
      {u > 0 && <g transform={`translate(0 ${(1 - u) * 120})`}>
        <rect x={0} y={KY - 6} width={BW} height={60} fill="#7d7d84" />
        <path d={`M 0 ${KY + 20} L ${BW} ${KY + 20}`} stroke="#fff" strokeWidth={6} strokeDasharray="34 26" opacity={0.7} />
        <path d={`M 0 ${KY - 6} L ${BW} ${KY - 6}`} stroke={INK} strokeWidth={6} />
      </g>}
      <g transform={`translate(${sunX} ${sunY}) scale(${sunS * lerp(1, 1.25, u)})`}><Sun r={44} rot={ti * 30} /></g>
      <Check x={sunX + 52} y={sunY + 46} s={popIn(t - T.bellel - 0.32, 0.22) * 0.8 * (1 - u)} />
      {moon > 0.001 && <g transform={`translate(520 160) scale(${moon})`}><Moon r={56} /><Cross x={46} y={44} s={stamp(t - T.bellel - 0.06)} r={26} w={14} /></g>}
      <g transform={`translate(${cx} ${cy}) scale(${c * cs * bump(t, T.etneen + 0.12, 0.08)})`}><ClockFace r={150} hA={hA} mA={mA} /></g>
      {kids > 0.001 && <g>
        <Stick x={KA} y={KY} s={0.8 * kids} dir={1} legF={0.13 + kickA * 1.1} armF={[0.6, 0.5]} armB={[-0.7, -0.6]} hat="#3d7be0" />
        <Stick x={KB} y={KY} s={0.8 * kids} dir={-1} legF={0.13 + kickB * 1.1} armF={[0.6, 0.5]} armB={[-0.7, -0.6]} hat={RED} />
        <g transform={`translate(${bx} ${by}) rotate(${ph * 300})`}>
          <circle r={17} fill="#fff" stroke={INK} strokeWidth={5} />
          <path d="M 0 -7 L 7 -2 L 4 6 L -4 6 L -7 -2 Z" fill={INK} />
        </g>
      </g>}
    </g>
  );
};

// ---- 5. people fishing and painting under the same sun; the clock in the corner still says 2:00
const PAINT_X0 = 540, PAINT_X1 = 810;
const PeopleScene: React.FC<SP> = ({t, ti}) => {
  const [h2, m2] = hm(2, 0);
  const bob = Math.sin(ti * 3.1) * 5;
  const fish = t >= T.btestad ? easeOut(seg(t, T.btestad, T.btestad + 0.35)) : 0;
  const p = easeInOut(seg(t, T.wbtedhen, T.adi + 0.1));
  const px = lerp(PAINT_X0 - 70, PAINT_X1 - 90, p), roll = Math.sin(ti * 9) * 48;
  const paintTo = px + 92;
  const rodHand = handAt([1.0, 1.7]);
  const tip: Pt = [rodHand[0] + 150, rodHand[1] - 120];
  const lineEnd: Pt = [tip[0] + 20, 66 + bob - fish * 110];
  return (
    <g>
      <Sky id="skyP" top={SKY_WARM[0]} bot={SKY_WARM[1]} horizon={300} />
      <g transform={`translate(${MID} 74)`}><Sun r={38} rot={ti * 30} /></g>
      {/* pier */}
      <rect x={150} y={366} width={170} height={20} fill="#9a6a3c" stroke={INK} strokeWidth={6} />
      {[170, 230, 290].map((x) => <rect key={x} x={x - 8} y={384} width={16} height={90} fill="#7a4f2a" stroke={INK} strokeWidth={5} />)}
      {/* fisherman, facing the sea on the left */}
      <Stick x={270} y={366} s={0.85} dir={-1} armF={[1.0, 1.7]} armB={[0.5, 1.2]} hat="#ffd23f">
        <path d={`M ${rodHand[0]} ${rodHand[1]} L ${tip[0]} ${tip[1]}`} stroke={INK} strokeWidth={9} strokeLinecap="round" />
        <path d={`M ${rodHand[0]} ${rodHand[1]} L ${tip[0]} ${tip[1]}`} stroke="#c98a1e" strokeWidth={4} strokeLinecap="round" />
        <path d={`M ${tip[0]} ${tip[1]} L ${lineEnd[0]} ${lineEnd[1]}`} stroke={INK} strokeWidth={2.5} />
        {fish > 0 ? <g transform={`translate(${lineEnd[0]} ${lineEnd[1] + 22}) rotate(${80 + Math.sin(ti * 14) * 18})`}>
          <path d="M -26 0 Q 0 -16 22 0 Q 0 16 -26 0 Z M 22 0 L 36 -12 L 36 12 Z" fill="#8fc6e8" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          <circle cx={-14} cy={-3} r={3} fill={INK} />
        </g> : <circle cx={lineEnd[0]} cy={lineEnd[1]} r={8} fill={RED} stroke={INK} strokeWidth={3} />}
      </Stick>
      {/* house wall being painted */}
      <path d={`M ${PAINT_X0 - 24} 230 L ${(PAINT_X0 + PAINT_X1) / 2} 140 L ${PAINT_X1 + 24} 230 Z`} fill="#4a3b36" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      <rect x={PAINT_X0} y={228} width={PAINT_X1 - PAINT_X0} height={212} fill="#b5a493" stroke={INK} strokeWidth={8} />
      <defs><clipPath id="paintclip"><rect x={PAINT_X0} y={228} width={Math.max(0, paintTo - PAINT_X0)} height={212} /></clipPath></defs>
      <rect x={PAINT_X0 + 4} y={232} width={PAINT_X1 - PAINT_X0 - 8} height={204} fill="#d9483b" clipPath="url(#paintclip)" />
      <rect x={680} y={276} width={70} height={58} fill="#cfe8ff" stroke={INK} strokeWidth={6} />
      <path d="M 715 276 L 715 334 M 680 305 L 750 305" stroke={INK} strokeWidth={4} />
      <rect x={PAINT_X0 + 30} y={330} width={56} height={110} fill="#6b3a2a" stroke={INK} strokeWidth={6} />
      <rect x={0} y={440} width={BW} height={40} fill="#6e9b54" />
      {/* painter with a roller on a pole */}
      <Stick x={px} y={448} s={0.85} dir={1} armF={[1.15, 0.9]} armB={[0.7, 1.3]}>
        <path d={`M ${handAt([1.15, 0.9])[0]} ${handAt([1.15, 0.9])[1]} L 108 ${-140 + roll}`} stroke={INK} strokeWidth={8} strokeLinecap="round" />
        <rect x={100} y={-176 + roll} width={20} height={72} rx={8} fill="#d9483b" stroke={INK} strokeWidth={5} />
      </Stick>
      {/* the corner clock: still 2:00 */}
      <g transform="translate(92 92) scale(0.42)"><ClockFace r={150} hA={h2} mA={m2} /></g>
      <Sparkle x={210} y={250} dt={t - T.btestad - 0.3} r={30} />
    </g>
  );
};

// ---- 6. islanders shrug at a big clock with a "؟"
const ShrugScene: React.FC<SP> = ({t, ti}) => {
  const [h2, m2] = hm(2, 0);
  const sh = easeInOut(seg(t, T.e7na - 0.05, T.e7na + 0.25));
  const q = popIn(t - T.sa3a2, 0.28);
  return (
    <g>
      <Sky id="skyR" top={SKY_WARM[0]} bot={SKY_WARM[1]} horizon={BH} />
      <rect x={0} y={446} width={BW} height={34} fill="#6e9b54" />
      <g transform={`translate(640 ${206 + Math.sin(ti * 2) * 3}) rotate(${wobble(t - T.sa3a2, 3, 5) * 8})`}>
        <rect x={-8} y={150} width={16} height={100} fill="#6b4a32" stroke={INK} strokeWidth={5} />
        <ClockFace r={150} hA={h2} mA={m2} />
      </g>
      <QMark x={780} y={150} size={190} s={q} rot={wobble(t - T.sa3a2 - 0.28, 2.5, 4) * 14 + Math.sin(ti * 2.6) * 4} fill={YELLOW} />
      {[96, 196, 296, 396].map((x, i) => {
        const s = popIn(t - T.fa2ahl - i * 0.12, 0.26);
        return s <= 0.001 ? null : <Stick key={x} x={x} y={452} s={0.82 * s} dir={1} shrug={sh * (0.85 + 0.15 * Math.sin(ti * 6 + i))} hat={['#3d7be0', RED, '#ffd23f', GREEN][i]} rot={sh * Math.sin(ti * 3 + i) * 3} />;
      })}
    </g>
  );
};

// ---- 7. a paper "طلب" gets signatures one after another, then flies to the parliament
const SIG_Y = [-46, 0, 46, 92, 138];
const sigPath = (k: number) => {
  let d = `M 70 ${6}`;
  for (let i = 0; i < 6; i++) d += ` q ${-8 - rand(k * 9 + i) * 8} ${-22 - rand(k * 5 + i) * 10} ${-18 - rand(k + i) * 10} 0 q ${-4} ${16} ${-12} ${4}`;
  return d;
};
const Parliament: React.FC<{t: number}> = ({t}) => (
  <g>
    <rect x={-130} y={-8} width={260} height={22} fill="#e9e2cf" stroke={INK} strokeWidth={6} />
    {[-96, -48, 0, 48, 96].map((x) => <rect key={x} x={x - 12} y={-118} width={24} height={110} fill="#f4efe2" stroke={INK} strokeWidth={6} />)}
    <rect x={-136} y={-134} width={272} height={18} fill="#e9e2cf" stroke={INK} strokeWidth={6} />
    <path d="M -136 -134 L 0 -194 L 136 -134 Z" fill="#f4efe2" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M 0 -194 L 0 -250" stroke={INK} strokeWidth={6} />
    <g transform={`translate(0 -250) skewY(${Math.sin(t * 5) * 6})`}>
      <rect x={0} y={0} width={62} height={40} fill="#d9363e" stroke={INK} strokeWidth={4} />
      <path d="M 20 0 L 20 40 M 0 20 L 62 20" stroke="#fff" strokeWidth={10} /><path d="M 20 0 L 20 40 M 0 20 L 62 20" stroke="#2a3f8f" strokeWidth={5} />
    </g>
  </g>
);
const PetitionScene: React.FC<SP> = ({t, ti}) => {
  const paper = popIn(t - T.qaddemo, 0.28);
  const f = easeInOut(seg(t, T.men, T.waqt2 + 0.25));
  const px = lerp(600, 170, f), py = lerp(236, 236, f) - Math.sin(f * Math.PI) * 150, ps = lerp(1, 0.18, f) * paper;
  const land = T.waqt2 + 0.25;
  const noClock = popIn(t - T.ayzeen, 0.24);
  return (
    <g>
      <g transform={`translate(170 ${416}) scale(${0.95 * bump(t, land, 0.1)})`}><Parliament t={idle(t)} /></g>
      {f < 0.999 && paper > 0.001 && <g transform={`translate(${px} ${py + Math.sin(ti * 2) * 3}) rotate(${-3 - f * 380}) scale(${ps})`}>
        <rect x={-150} y={-196} width={300} height={392} rx={12} fill={PAPER} stroke={INK} strokeWidth={9} />
        <g transform={`scale(${bump(t, T.talab, 0.18)})`}><Txt x={0} y={-112} size={76} fill={INK} sw={0} rtl>طلب</Txt></g>
        <path d="M -110 -88 L 110 -88" stroke={DARK} strokeWidth={5} />
        {SIG_Y.map((y, k) => {
          const t0 = T.talab + 0.22 + k * 0.42, p = easeOut(seg(t, t0, t0 + 0.34));
          return <g key={k} transform={`translate(0 ${y})`}>
            <path d="M -110 10 L 110 10" stroke={GREY} strokeWidth={3} strokeDasharray="6 6" />
            {p > 0.001 && <path d={sigPath(k)} transform="translate(30 0)" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} stroke={['#2a3f8f', DARK, '#2a3f8f', DARK, '#2a3f8f'][k]} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
          </g>;
        })}
        {noClock > 0.001 && <g transform={`translate(-92 150) scale(${noClock * 0.32})`}><ClockFace r={110} hA={60} mA={0} /><Cross x={0} y={0} s={1} r={90} w={24} /></g>}
      </g>}
      <Sparkle x={210} y={170} dt={t - land} r={36} />
      <Check x={290} y={180} s={popIn(t - land - 0.05, 0.24) * 0.8} />
    </g>
  );
};

// ---- watches
const Watch: React.FC<{strap?: string; hA?: number; mA?: number}> = ({strap = '#7a4f2a', hA = 300, mA = 60}) => (
  <g>
    <rect x={-13} y={-50} width={26} height={100} rx={9} fill={strap} stroke={INK} strokeWidth={6} />
    <circle r={28} fill="#e0e4e8" stroke={INK} strokeWidth={6} />
    <circle r={21} fill="#fffbe6" />
    <Hand a={hA} len={12} w={4} /><Hand a={mA} len={17} w={3} />
  </g>
);
const STRAPS = ['#7a4f2a', '#2a3f8f', '#3a2416', '#a8382f', '#43a85a'];
const RAIL_Y = 176, DECK_Y = 282, HOOKS = [170, 300, 430, 560, 690];
const Bridge: React.FC = () => (
  <g>
    <path d={`M -10 ${DECK_Y + 20} Q ${MID} ${DECK_Y + 190} ${BW + 10} ${DECK_Y + 20}`} fill="none" stroke={INK} strokeWidth={30} />
    <path d={`M -10 ${DECK_Y + 20} Q ${MID} ${DECK_Y + 190} ${BW + 10} ${DECK_Y + 20}`} fill="none" stroke="#9aa5ad" strokeWidth={16} />
    {[120, 250, 610, 740].map((x) => { const y = DECK_Y + 20 + (1 - ((x - MID) / (MID + 10)) ** 2) * 85; return <path key={x} d={`M ${x} ${DECK_Y + 18} L ${x} ${y}`} stroke={INK} strokeWidth={10} />; })}
    <rect x={-10} y={DECK_Y} width={BW + 20} height={26} fill="#b8a48a" stroke={INK} strokeWidth={7} />
    {Array.from({length: 15}, (_, i) => <rect key={i} x={i * 62 - 4} y={RAIL_Y} width={12} height={DECK_Y - RAIL_Y} fill="#d9d2c4" stroke={INK} strokeWidth={4} />)}
    <rect x={-10} y={RAIL_Y - 9} width={BW + 20} height={18} rx={9} fill="#e3d9c6" stroke={INK} strokeWidth={6} />
  </g>
);
// ---- 8. wrists drop their watches; after drama pause (b) the watches hang one by one on the bridge railing, swinging
const ARM_X = [210, 430, 650];
const WatchesScene: React.FC<SP> = ({t, ti}) => {
  const away = easeIn(seg(t, T.alla2oha - 0.02, T.alla2oha + 0.32));
  const br = easeOut(seg(t, T.alla2oha, T.alla2oha + 0.38));
  const drop = (i: number) => T.qala3o + 0.06 + i * 0.2;
  const hangT = (k: number) => T.alla2oha + 0.2 + k * 0.22;
  const arms = (
    <g transform={`translate(0 ${away * 420})`}>
      {ARM_X.map((x, i) => {
        const wy = 236 + Math.sin(ti * 2 + i) * 4;
        const on = t < drop(i);
        return <g key={i}>
          <rect x={x - 34} y={wy - 10} width={68} height={300} rx={30} fill={SKIN} stroke={INK} strokeWidth={8} />
          <rect x={x - 42} y={wy + 120} width={84} height={200} rx={14} fill={['#3d7be0', '#d9483b', '#43a85a'][i]} stroke={INK} strokeWidth={8} />
          {/* open hand: palm + four fingers + thumb */}
          <rect x={x - 40} y={wy - 74} width={80} height={70} rx={22} fill={SKIN} stroke={INK} strokeWidth={8} />
          {[-27, -9, 9, 27].map((fx, j) => <rect key={fx} x={x + fx - 8} y={wy - 128 + Math.abs(j - 1.5) * 8} width={16} height={64} rx={8} fill={SKIN} stroke={INK} strokeWidth={6} />)}
          <rect x={x - 40} y={wy - 74} width={80} height={30} fill={SKIN} />
          <path d={`M ${x - 38} ${wy - 40} q -26 -8 -30 -40`} stroke={INK} strokeWidth={22} fill="none" strokeLinecap="round" />
          <path d={`M ${x - 38} ${wy - 40} q -26 -8 -30 -40`} stroke={SKIN} strokeWidth={10} fill="none" strokeLinecap="round" />
          {on && <g transform={`translate(${x} ${wy + 34})`}>
            <rect x={-40} y={-13} width={80} height={26} rx={9} fill={STRAPS[i]} stroke={INK} strokeWidth={6} />
            <circle r={26} fill="#e0e4e8" stroke={INK} strokeWidth={6} /><circle r={19} fill="#fffbe6" />
            <Hand a={300} len={11} w={4} /><Hand a={60} len={15} w={3} />
          </g>}
        </g>;
      })}
    </g>
  );
  return (
    <g>
      <Sky id="skyW" top={SKY_WARM[0]} bot={SKY_WARM[1]} horizon={392} />
      {br > 0 && <g transform={`translate(0 ${(1 - br) * 360})`}><Bridge /></g>}
      {arms}
      {/* the watches: fall off the wrists to the ground, then fly up and hang on the railing */}
      {HOOKS.map((hx, k) => {
        const th = hangT(k), from: Pt = k < 3 ? [ARM_X[k], 452] : [hx, 620];
        if (k < 3 && t >= drop(k) && t < th) {
          const d = t - drop(k), wy0 = 270, fall = Math.min(1, d / 0.42);
          const y = fall < 1 ? wy0 + (452 - wy0) * fall * fall : 452 - Math.abs(wobble(d - 0.42, 3, 9)) * 26;
          return <g key={k} transform={`translate(${ARM_X[k]} ${y}) rotate(${fall < 1 ? 90 * fall + d * 200 : 90})`}><Watch strap={STRAPS[k]} /></g>;
        }
        if (t < th) return null;
        const f = easeOut(seg(t, th, th + 0.22)), dt = t - th - 0.22;
        const pos: Pt = [lerp(from[0], hx, f), lerp(from[1], RAIL_Y + 54, f) - Math.sin(f * Math.PI) * 60];
        if (f < 1) return <g key={k} transform={`translate(${pos[0]} ${pos[1]}) rotate(${(1 - f) * 200})`}><Watch strap={STRAPS[k]} /></g>;
        const sw = 30 * Math.exp(-1.1 * dt) * Math.sin(5.6 * dt) + 4 * Math.sin(ti * 2.3 + k * 1.3);
        return <g key={k} transform={`translate(${hx} ${RAIL_Y}) rotate(${sw})`}>
          <rect x={-16} y={-16} width={32} height={30} rx={10} fill="none" stroke={STRAPS[k]} strokeWidth={8} />
          <g transform="translate(0 66) scale(1.3)"><Watch strap={STRAPS[k]} hA={30 + k * 70} mA={k * 97} /></g>
        </g>;
      })}
      <Sparkle x={730} y={120} dt={t - T.kobry} r={34} />
    </g>
  );
};

// ---- 9-11. newspapers from around the world spin in and stack up; the globe pulses; freeze on "استنى"; "إعلان" stamp
const NEWS: {x: number; y: number; r: number; from: Pt; c: string}[] = [
  {x: 590, y: 270, r: -7, from: [1100, -200], c: '#f4efe2'}, {x: 560, y: 236, r: 6, from: [600, 760], c: '#fbf6e6'},
  {x: 620, y: 226, r: -3, from: [1150, 420], c: '#efe9da'}, {x: 584, y: 214, r: 9, from: [300, -300], c: '#fffaf0'},
  {x: 600, y: 246, r: -1, from: [1100, 700], c: '#f7f1e2'},
];
const Paper: React.FC<{seed: number; c: string}> = ({seed, c}) => (
  <g>
    <rect x={-160} y={-112} width={320} height={224} rx={6} fill={c} stroke={INK} strokeWidth={8} />
    <path d={`M -130 -72 q 20 -16 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t ${20 + rand(seed) * 20} 0`} stroke={INK} strokeWidth={12} fill="none" strokeLinecap="round" />
    <path d="M -140 -44 L 140 -44" stroke={INK} strokeWidth={4} />
    <g transform="translate(-96 18)"><ClockFace r={44} hA={60 + seed * 50} mA={seed * 90} /></g>
    {[-18, 8, 34, 60].map((y, i) => <rect key={y} x={-30} y={y - 6} width={(120 + 40 * rand(seed * 7 + i)) * (i === 3 ? 0.6 : 1)} height={11} rx={5} fill={GREY} />)}
    <path d={`M -36 -20 L ${140} -20`} stroke={DARK} strokeWidth={9} strokeLinecap="round" opacity={0.85} />
  </g>
);
const Megaphone: React.FC = () => (
  <g>
    <path d="M -46 -24 L 44 -66 L 44 66 L -46 24 Z" fill={RED} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
    <ellipse cx={44} cy={0} rx={14} ry={66} fill="#ffb3a8" stroke={INK} strokeWidth={8} />
    <rect x={-78} y={-28} width={36} height={56} rx={8} fill="#f4efe2" stroke={INK} strokeWidth={8} />
    <path d="M -30 22 L -38 62" stroke={INK} strokeWidth={14} strokeLinecap="round" />
  </g>
);
const NewsScene: React.FC<SP> = ({t, ti}) => {
  const pulse = (k: number) => (t >= k ? Math.exp(-(t - k) * 2.6) : 0);
  const gp = Math.max(pulse(T.laf), pulse(T.alam2), pulse(T.khabar));
  const ring = (ti * 0.8) % 1;
  const st = stamp(t - T.e3lan);
  return (
    <g>
      {/* globe */}
      <g transform={`translate(180 250) scale(${1 + 0.1 * gp})`}>
        {[0, 0.5].map((o) => { const r = (ring + o) % 1; return <circle key={o} r={120 + r * 70} fill="none" stroke={YELLOW} strokeWidth={6} opacity={(1 - r) * 0.6} />; })}
        <defs><clipPath id="globeclip"><circle r={112} /></clipPath></defs>
        <circle r={112} fill={SEA} stroke={INK} strokeWidth={9} />
        <g clipPath="url(#globeclip)">
          {[0, 1].map((w) => <g key={w} transform={`translate(${((ti * 30) % 300) - 300 * w} 0)`}>
            <path d={poly(blob(-40, -30, 46, 11, 14, 0.5))} fill={LAND} stroke={INK} strokeWidth={5} />
            <path d={poly(blob(60, 30, 40, 12, 14, 0.5))} fill={LAND} stroke={INK} strokeWidth={5} />
            <path d={poly(blob(140, -50, 34, 13, 14, 0.5))} fill={LAND} stroke={INK} strokeWidth={5} />
            <path d={poly(blob(210, 50, 44, 14, 14, 0.5))} fill={LAND} stroke={INK} strokeWidth={5} />
          </g>)}
          {[-60, 0, 60].map((y) => <path key={y} d={`M -120 ${y} Q 0 ${y + 14} 120 ${y}`} stroke="#fff" strokeOpacity={0.3} strokeWidth={3} fill="none" />)}
        </g>
        <circle r={112} fill="none" stroke={INK} strokeWidth={9} />
      </g>
      {/* papers spin in and stack */}
      {NEWS.map((n, i) => {
        const t0 = T.khabar + 0.02 + i * 0.34, f = easeOut(seg(t, t0, t0 + 0.42));
        if (t < t0) return null;
        return <g key={i} transform={`translate(${lerp(n.from[0], n.x, f)} ${lerp(n.from[1], n.y, f) + (f >= 1 ? Math.sin(ti * 2 + i) * 2 : 0)}) rotate(${n.r + (1 - f) * 540}) scale(${lerp(0.3, 0.9, f) * bump(t, t0 + 0.42, 0.06)})`}><Paper seed={i + 1} c={n.c} /></g>;
      })}
      {/* the reveal: "إعلان" stamp + megaphone */}
      {st > 0 && <g transform={`translate(590 250) rotate(-9) scale(${st})`}>
        <rect x={-250} y={-82} width={500} height={164} rx={26} fill="rgba(255,90,78,0.14)" stroke={INK} strokeWidth={22} />
        <rect x={-250} y={-82} width={500} height={164} rx={26} fill="none" stroke={RED} strokeWidth={12} />
        <Txt x={-50} y={44} size={124} fill={RED} sw={0.08} rtl>إعلان</Txt>
        <g transform="translate(160 0) scale(0.78) rotate(-10)"><Megaphone /></g>
      </g>}
    </g>
  );
};

// ---- 12. tourism office with a megaphone; suitcases and planes fly to the island
const Suitcase: React.FC<{c: string}> = ({c}) => (
  <g>
    <path d="M -12 -22 L -12 -34 L 12 -34 L 12 -22" fill="none" stroke={INK} strokeWidth={6} />
    <rect x={-32} y={-24} width={64} height={48} rx={9} fill={c} stroke={INK} strokeWidth={6} />
    <path d="M -12 -24 L -12 24 M 12 -24 L 12 24" stroke={INK} strokeWidth={3} opacity={0.5} />
  </g>
);
const Plane: React.FC = () => (
  <g>
    <path d="M -10 -4 L -30 -38 L -16 -38 L 14 -4 Z M -10 4 L -30 38 L -16 38 L 14 4 Z M -40 -3 L -52 -22 L -44 -22 L -30 -3 Z" fill="#cfd6dd" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <path d="M -50 -7 L 38 -7 Q 56 0 38 7 L -50 7 Z" fill="#f4f6f8" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
  </g>
);
const ITEMS: [string, string][] = [['case', '#ffd23f'], ['plane', ''], ['case', '#3d7be0'], ['case', RED], ['plane', ''], ['case', GREEN], ['case', '#ffd23f']];
const MOUTH_P: Pt = [300, 170], ISLE_P: Pt = [690, 362];
const TourismScene: React.FC<SP> = ({t, ti}) => {
  const b = popIn(t - T.hay2a, 0.28), sign = popIn(t - T.seya7a, 0.26);
  const loud = t >= T.kanet ? 1 : 0;
  return (
    <g>
      <Sky id="skyT" top={SKY_COOL[0]} bot={SKY_COOL[1]} horizon={370} sea="#3c6f8a" />
      <g transform={`translate(${ISLE_P[0]} ${ISLE_P[1]})`}><Isle w={150} green="#55805a" /></g>
      {/* tourism office */}
      <g transform={`translate(150 440) scale(${b})`}>
        <rect x={-110} y={-170} width={220} height={170} fill="#e9e2cf" stroke={INK} strokeWidth={8} />
        <path d="M -126 -170 L 0 -232 L 126 -170 Z" fill="#5c6f7d" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
        <rect x={-30} y={-80} width={60} height={80} fill="#6b3a2a" stroke={INK} strokeWidth={6} />
        {[-80, 50].map((x) => <rect key={x} x={x} y={-130} width={34} height={34} fill="#cfe8ff" stroke={INK} strokeWidth={5} />)}
        <g transform={`translate(0 -150) scale(${sign})`}>
          <rect x={-96} y={-26} width={192} height={52} rx={10} fill={YELLOW} stroke={INK} strokeWidth={6} />
          <text x={0} y={16} textAnchor="middle" direction="rtl" fontFamily="Cairo" fontWeight={900} fontSize={38} fill={INK}>السياحة</text>
        </g>
      </g>
      <g transform={`translate(${MOUTH_P[0] - 44} ${MOUTH_P[1]}) rotate(${-8 + Math.sin(ti * 7) * 2 * loud}) scale(${popIn(t - T.hay2a - 0.15, 0.26) * (1 + 0.05 * loud * Math.abs(Math.sin(ti * 7)))})`}><Megaphone /></g>
      {loud > 0 && [0, 0.33, 0.66].map((o) => { const r = ((ti - idle(T.kanet)) * 1.3 + o) % 1; return <path key={o} d={`M ${MOUTH_P[0] + 20 + r * 120} ${MOUTH_P[1] - 50 - r * 30} Q ${MOUTH_P[0] + 50 + r * 140} ${MOUTH_P[1]} ${MOUTH_P[0] + 20 + r * 120} ${MOUTH_P[1] + 50 + r * 30}`} stroke="#fff" strokeWidth={8} fill="none" strokeLinecap="round" opacity={1 - r} />; })}
      {/* suitcases and planes fly to the island */}
      {ITEMS.map(([kind, c], i) => {
        const t0 = T.ashan + i * 0.17, f = easeInOut(seg(t, t0, t0 + 0.62));
        if (t < t0) return null;
        const landed = f >= 1;
        if (kind === 'plane') {
          const a = (ti - idle(t0)) * 1.8 + i;
          const p: Pt = landed ? [ISLE_P[0] + Math.cos(a) * 120, ISLE_P[1] - 150 + Math.sin(a) * 30] : [lerp(MOUTH_P[0], ISLE_P[0] + Math.cos(i) * 120, f), lerp(MOUTH_P[1], ISLE_P[1] - 150 + Math.sin(i) * 30, f) - Math.sin(f * Math.PI) * 60];
          return <g key={i} transform={`translate(${p[0]} ${p[1]}) scale(${0.8 * popIn(t - t0, 0.2)}) scale(${landed && Math.sin(a) < 0 ? -1 : 1} 1)`}><Plane /></g>;
        }
        const k = ITEMS.slice(0, i).filter(([kk]) => kk === 'case').length;
        const end: Pt = [ISLE_P[0] - 70 + k * 36, ISLE_P[1] - 60 - (k % 2) * 16];
        const p: Pt = [lerp(MOUTH_P[0], end[0], f), lerp(MOUTH_P[1], end[1], f) - Math.sin(f * Math.PI) * 110];
        return <g key={i} transform={`translate(${p[0]} ${p[1]}) rotate(${(1 - f) * 300}) scale(${0.62 * popIn(t - t0, 0.2) * (landed ? bump(t, t0 + 0.62, 0.15) : 1)})`}><Suitcase c={c} /></g>;
      })}
      <Sparkle x={ISLE_P[0] + 40} y={ISLE_P[1] - 130} dt={t - T.sowa7} r={36} />
    </g>
  );
};

// ---- 13. the bridge again: the watches are gone; a normal clock ticks on the island
const Bridge2Scene: React.FC<SP> = ({t, ti}) => {
  const sec = Math.floor(ti - T.gezira4 + 20);
  const [hA, mA] = hm(10, 9 + sec / 60);
  return (
    <g>
      <Sky id="skyB" top={SKY_COOL[0]} bot={SKY_COOL[1]} horizon={392} sea="#3c6f8a" />
      <Bridge />
      {HOOKS.map((x) => <circle key={x} cx={x} cy={RAIL_Y + 12} r={6} fill={GREY} stroke={INK} strokeWidth={3} />)}
      <g transform={`translate(${MID} 104) scale(${bump(t, T.bessa3a, 0.08)})`}>
        <path d="M -6 70 L -6 92 M 6 70 L 6 92" stroke={INK} strokeWidth={6} />
        <ClockFace r={84} hA={hA} mA={mA} sA={sec * 6} />
      </g>
      <Check x={MID + 110} y={160} s={popIn(t - T.adi2, 0.24)} />
    </g>
  );
};

// ---- 14. winter: night falls, stars, green northern lights; the sun does not rise at all
const STARS = Array.from({length: 46}, (_, i): [number, number, number] => [rand(i * 3.1) * BW, rand(i * 7.3 + 1) * 300, 2 + rand(i * 1.7) * 3.5]);
const Aurora: React.FC<{ti: number; a: number}> = ({ti, a}) => (
  <g opacity={a}>
    <defs>
      <filter id="aurblur" x="-10%" y="-60%" width="120%" height="220%"><feGaussianBlur stdDeviation="9" /></filter>
      <linearGradient id="aurfade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6dffa8" stopOpacity={0.55} /><stop offset="1" stopColor="#6dffa8" stopOpacity={0} /></linearGradient>
    </defs>
    {[0, 1, 2].map((k) => {
      const pts = Array.from({length: 46}, (_, i) => { const x = -20 + i * 20; return [x, 70 + k * 46 + 24 * Math.sin(x * 0.011 + ti * 1.2 + k * 1.7) + 12 * Math.sin(x * 0.03 - ti * 0.8 + k)] as Pt; });
      const line = 'M ' + pts.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join(' L ');
      return <g key={k}>
        <path d={`${line} L 900 ${260 + k * 40} L -20 ${260 + k * 40} Z`} fill="url(#aurfade)" opacity={0.55 - k * 0.12} filter="url(#aurblur)" />
        <path d={line} stroke={k === 1 ? '#9fffd0' : '#4dff95'} strokeWidth={10 - k * 2} fill="none" opacity={0.8} filter="url(#aurblur)" />
      </g>;
    })}
  </g>
);
const WinterScene: React.FC<SP> = ({t, ti}) => {
  const n = easeInOut(seg(t, T.bey7sal, T.aks + 0.45));
  const top = n < 0.5 ? mix(SKY_COOL[0], '#33456e', n * 2) : mix('#33456e', SKY_NIGHT[0], n * 2 - 1);
  const bot = n < 0.5 ? mix(SKY_COOL[1], '#7d6a8f', n * 2) : mix('#7d6a8f', SKY_NIGHT[1], n * 2 - 1);
  const sunY = lerp(150, 430, easeIn(seg(t, T.bey7sal, T.aks + 0.3)));
  const aur = easeInOut(seg(t, T.aks + 0.1, T.shams2 + 0.6));
  const cal = popIn(t - T.hawali, 0.26), cu = seg(t, T.hawali + 0.05, T.shahrein2 + 0.45), day = 1 + Math.floor(cu * 59);
  return (
    <g>
      <Sky id="skyN" top={top} bot={bot} horizon={360} sea={mix('#3c6f8a', '#0c1d3a', n)} />
      {STARS.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={n * (0.45 + 0.55 * Math.abs(Math.sin(ti * 2 + i * 1.3)))} />)}
      <Aurora ti={ti} a={aur} />
      {sunY < 420 && <g transform={`translate(640 ${sunY})`}><Sun r={40} rot={ti * 20} /></g>}
      <rect x={0} y={360} width={BW} height={BH - 360} fill={mix('#3c6f8a', '#0c1d3a', n)} />
      {n > 0.4 && [0, 1, 2].map((i) => <path key={i} d={`M ${120 + i * 250} ${400 + i * 20} l 80 0`} stroke="#9fffd0" strokeOpacity={0.3 * aur} strokeWidth={6} strokeLinecap="round" />)}
      <g transform={`translate(${MID - 40} 362)`}><Isle snow={n} lit={n} green={mix(LAND, '#22403d', n)} /></g>
      {/* the sun does not rise at all */}
      {t >= T.btetla3sh && <g transform={`translate(752 84) scale(${popIn(t - T.btetla3sh, 0.24) * 0.8})`}><Sun r={40} /><Cross x={0} y={0} s={stamp(t - T.btetla3sh - 0.08)} r={52} w={18} /></g>}
      {cal > 0.001 && <g transform={`translate(112 132) rotate(-5) scale(${cal * 0.92})`}><Calendar day={day} flip={cu > 0 && cu < 1 ? (cu * 59) % 1 : 0} dark /></g>}
    </g>
  );
};

// ---- 15. split board: right ☀ "شهرين من غير ليل", left ☾ "شهرين من غير شمس"; each pulses as it is said
const ChoiceCard: React.FC<{x: number; day: boolean; on: number; pulse: number; s: number}> = ({x, day, on, pulse, s}) => (
  <g transform={`translate(${x} 214) scale(${s * (1 + 0.05 * on + 0.04 * pulse)})`} opacity={0.55 + 0.45 * Math.max(on, s > 0 ? 0.6 : 0)}>
    {on > 0 && <rect x={-196} y={-196} width={392} height={392} rx={40} fill="none" stroke={YELLOW} strokeWidth={14} opacity={0.6 * on} />}
    <rect x={-182} y={-182} width={364} height={364} rx={32} fill={day ? '#ffe7a8' : '#1d2b55'} stroke={INK} strokeWidth={10} />
    {!day && STARS.slice(0, 9).map(([sx, sy, r], i) => <circle key={i} cx={-150 + (sx / BW) * 300} cy={-160 + (sy / 300) * 100} r={r * 0.7} fill="#fff" opacity={0.8} />)}
    <g transform="translate(0 -94)">{day ? <Sun r={44} rot={pulse * 20} /> : <Moon r={52} />}</g>
    <Txt x={0} y={36} size={70} fill={day ? INK : CHALK} sw={day ? 0 : 0.08} rtl>شهرين</Txt>
    <Txt x={0} y={124} size={60} fill={day ? '#c0392b' : YELLOW} sw={day ? 0 : 0.08} rtl>{day ? 'من غير ليل' : 'من غير شمس'}</Txt>
  </g>
);
const ChoiceScene: React.FC<SP> = ({t, ti}) => {
  const rOn = seg(t, T.testa7mel - 0.05, T.testa7mel + 0.2) * (1 - seg(t, T.wala - 0.15, T.wala + 0.1));
  const lOn = seg(t, T.wala - 0.05, T.wala + 0.2) * (1 - seg(t, T.ekteb - 0.1, T.ekteb + 0.2));
  const bounce = t >= T.ekteb ? Math.abs(Math.sin((ti - idle(T.ekteb)) * 6.2)) * 16 : 0;
  return (
    <g>
      <path d={`M ${MID} 22 L ${MID} ${BH - 22}`} stroke={CHALK} strokeWidth={6} strokeDasharray="16 16" strokeLinecap="round" opacity={0.55} />
      <ChoiceCard x={645} day on={rOn} pulse={rOn * Math.abs(Math.sin(ti * 7))} s={1} />
      <ChoiceCard x={215} day={false} on={lOn} pulse={lOn * Math.abs(Math.sin(ti * 7))} s={t >= T.wala - 0.05 ? 1 : 0.92} />
      {t >= T.ekteb && <g transform={`translate(${MID} ${418 - bounce}) scale(${0.46 * popIn(t - T.ekteb, 0.26)})`}>
        <path d="M -150 -110 L 150 -110 Q 180 -110 180 -80 L 180 60 Q 180 90 150 90 L 10 90 L -50 150 L -40 90 L -150 90 Q -180 90 -180 60 L -180 -80 Q -180 -110 -150 -110 Z" fill="#fff" stroke={INK} strokeWidth={18} strokeLinejoin="round" />
        {[-70, 0, 70].map((x, i) => <circle key={i} cx={x} cy={-10 - 16 * Math.max(0, Math.sin((ti - T.ekteb) * 9 - i * 0.9))} r={22} fill={GREY} />)}
      </g>}
    </g>
  );
};

const Board: React.FC<{t: number; dim: number; hold: number; warm: number}> = ({t, dim, hold, warm}) => {
  const ti = idle(t);
  let i = 0;
  for (let k = 0; k < SCENES.length; k++) if (t >= SCENES[k][0]) i = k;
  const [start, scene] = SCENES[i];
  const e = i === 0 ? 1 : easeInOut(seg(t, start, start + PUSH));
  const prev = i > 0 && e < 1 ? SCENES[i - 1][1] : null;
  const draw = (s: Scene) => (
    <g>
      {s === 'hook' && <HookScene t={t} ti={ti} />}
      {s === 'map' && <MapScene t={t} ti={ti} />}
      {s === 'summer' && <SummerScene t={t} ti={ti} />}
      {s === 'clock' && <ClockScene t={t} ti={ti} />}
      {s === 'people' && <PeopleScene t={t} ti={ti} />}
      {s === 'shrug' && <ShrugScene t={t} ti={ti} />}
      {s === 'petition' && <PetitionScene t={t} ti={ti} />}
      {s === 'watches' && <WatchesScene t={t} ti={ti} />}
      {s === 'news' && <NewsScene t={t} ti={ti} />}
      {s === 'tourism' && <TourismScene t={t} ti={ti} />}
      {s === 'bridge2' && <Bridge2Scene t={t} ti={ti} />}
      {s === 'winter' && <WinterScene t={t} ti={ti} />}
      {s === 'choice' && <ChoiceScene t={t} ti={ti} />}
      {s === 'loop' && <HookScene t={t} ti={ti} frozen />}
    </g>
  );
  return (
    <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        <radialGradient id="spot" cx="50%" cy="42%" r="62%">
          <stop offset="0" stopColor="#fff6d8" stopOpacity={0.1} /><stop offset="0.6" stopColor="#fff6d8" stopOpacity={0} /><stop offset="1" stopColor="#000" stopOpacity={0.3} />
        </radialGradient>
        <radialGradient id="halo" cx="50%" cy="50%" r="50%">
          <stop offset="0.55" stopColor="#ffe9b0" stopOpacity={0.12 + 0.12 * warm} /><stop offset="1" stopColor="#ffe9b0" stopOpacity={0} />
        </radialGradient>
      </defs>
      <g transform={`translate(${BX} ${BY})`}>
        <ellipse cx={MID} cy={BH / 2} rx={BW * 0.82} ry={BH * 0.98} fill="url(#halo)" />
        <rect x={-16} y={-16} width={BW + 32} height={BH + 32} rx={26} fill="#8a5a33" stroke={INK} strokeWidth={10} />
        <rect x={0} y={0} width={BW} height={BH} rx={14} fill={BOARD} stroke={INK} strokeWidth={6} />
        <rect x={10} y={10} width={BW - 20} height={BH - 20} rx={10} fill="none" stroke="#ffffff" strokeOpacity={0.05} strokeWidth={8} />
        <defs><clipPath id="boardclip"><rect x={3} y={3} width={BW - 6} height={BH - 6} rx={12} /></clipPath></defs>
        <g clipPath="url(#boardclip)">
          {prev && <g transform={`translate(${-BW * e} 0)`}>{draw(prev)}</g>}
          <g transform={`translate(${BW * (1 - e)} 0)`}>{draw(scene)}</g>
          <rect x={0} y={0} width={BW} height={BH} fill="url(#spot)" />
          {hold > 0 && <rect x={0} y={0} width={BW} height={BH} fill="url(#spot)" opacity={hold * 0.7} />}
          {/* the board stays visible during the signature line, a little darker while he stares */}
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
// music: light curious bed + soft hits + record scratch, synthesized by tools/curious_bed.py (already at their mix level)
type Cue = [number, string, number];
const TICKS = (t0: number, t1: number, every: number, n: string, v: number): Cue[] => Array.from({length: Math.max(0, Math.floor((t1 - t0) / every))}, (_, i): Cue => [t0 + i * every, n, v]);
const EP = 'sommaroy/sfx/';
const SFX: Cue[] = [
  // hook: the clock cracks from frame 0
  [0, EP + 'crack', 0.28], [T.gezira, EP + 'crack', 0.24], [T.sokan, EP + 'crack', 0.24], [T.hawlo, EP + 'crack', 0.28], [T.yelgho, 'whoosh', 0.24], [T.waqt, EP + 'crack', 0.4], [T.waqt + 0.42, 'click', 0.2], [T.waqt + 0.52, 'click', 0.16],
  // map
  [T.gezira2 - 0.1, 'swish', 0.22], [T.gezira2 + 0.2, 'pop', 0.18], [T.sommaroy, 'pop', 0.26], [T.shamal - 0.05, 'whoosh', 0.3], [T.norway, 'pop', 0.14], [T.khales, 'sparkle', 0.2],
  // summer
  [T.fiSayf - 0.1, 'swish', 0.2], [T.shams, 'twinkle', 0.14], [T.btghrabsh, 'boing', 0.16], [T.btghrabsh + 0.18, 'thud', 0.18], [T.aktar, 'pop', 0.22], ...TICKS(T.aktar + 0.05, T.tool + 0.2, 0.09, 'click', 0.1), [T.nahar, 'sparkle', 0.14],
  // 2:00 at night, kids
  [T.sa3a - 0.1, 'swish', 0.2], [T.sa3a, 'pop', 0.22], ...TICKS(T.sa3a + 0.05, T.etneen + 0.1, 0.07, EP + 'tick', 0.2), [T.etneen + 0.12, 'ding', 0.2], [T.bellel + 0.06, 'thud', 0.3], [T.bellel + 0.32, 'ding', 0.14],
  [T.el3eyal, 'pop', 0.2], ...TICKS(T.el3eyal + 0.02, T.wennas - 0.1, KP, 'step', 0.34),
  // fishing, painting
  [T.wennas - 0.1, 'swish', 0.2], [T.btestad, 'bubbles', 0.14], [T.btestad + 0.2, 'pop', 0.22], [T.wbtedhen, 'squish', 0.2], [T.byootha, 'squish', 0.14], [T.adi, 'ding', 0.12],
  // shrug
  [T.fa2ahl - 0.1, 'swish', 0.2], ...[0, 1, 2, 3].map((i): Cue => [T.fa2ahl + i * 0.12, 'pop', 0.14]), [T.e7na, 'boing', 0.18], [T.sa3a2, 'pop', 0.26],
  // petition
  [T.qaddemo - 0.1, 'swish', 0.2], [T.qaddemo, 'pop', 0.22], [T.talab, 'pop', 0.18], ...[0, 1, 2, 3, 4].map((i): Cue => [T.talab + 0.22 + i * 0.42, 'step', 0.2]), [T.ayzeen, 'thud', 0.2], [T.men, 'whoosh', 0.26], [T.waqt2 + 0.25, 'ding', 0.22],
  // watches
  [T.qala3o - 0.1, 'swish', 0.2], ...[0, 1, 2].map((i): Cue => [T.qala3o + 0.06 + i * 0.2, 'click', 0.26]), ...[0, 1, 2].map((i): Cue => [T.qala3o + 0.48 + i * 0.2, 'thud', 0.16]),
  [T.alla2oha, 'whoosh', 0.2], ...[0, 1, 2, 3, 4].map((i): Cue => [T.alla2oha + 0.42 + i * 0.22, 'click', 0.26]), [T.kobry, 'twinkle', 0.16],
  // newspapers
  [T.khabar - 0.1, 'swish', 0.2], ...[0, 1, 2, 3, 4].map((i): Cue => [T.khabar + 0.02 + i * 0.34, 'swish', 0.14]), ...[0, 1, 2, 3, 4].map((i): Cue => [T.khabar + 0.44 + i * 0.34, 'thud', 0.1]), [T.laf, 'whoosh', 0.14],
  // signature: record scratch exactly on "استنى" (scratch.wav is in the music folder; see below)
  [T.e3lan, 'thud', 0.5],
  // tourism
  [T.hay2a - 0.1, 'swish', 0.2], [T.hay2a, 'pop', 0.2], [T.seya7a, 'pop', 0.2], [T.wara, 'whoosh', 0.14], ...ITEMS.map((_, i): Cue => [T.ashan + i * 0.17, 'swish', 0.12]), ...ITEMS.map((_, i): Cue => [T.ashan + 0.62 + i * 0.17, 'pop', 0.1]), [T.sowa7, 'sparkle', 0.16],
  // bridge again
  [T.gezira4 - 0.1, 'swish', 0.2], ...TICKS(T.gezira4 + 0.4, T.wefi - 0.2, 1.0, EP + 'tick', 0.26), [T.adi2, 'ding', 0.2],
  // winter
  [T.wefi - 0.1, 'swish', 0.2], [T.aks, 'whoosh', 0.18], [T.shams2, 'sparkle', 0.14], [T.btetla3sh, 'thud', 0.3], [T.hawali, 'pop', 0.18], ...TICKS(T.hawali + 0.05, T.shahrein2 + 0.45, 0.09, 'click', 0.09),
  // choice + comments
  [T.testa7mel - 0.1, 'swish', 0.22], [T.testa7mel, 'pop', 0.24], [T.wala, 'pop', 0.24], [T.ekteb, 'pop', 0.24], [T.comments, 'boing', 0.14],
  // ending
  [T.fahman - 0.15, 'swish', 0.24], [T.fahman, 'pop', 0.2], [T.kasban, 'twinkle', 0.34],
];
const POSE_SWAP_SFX: Cue[] = POSES.slice(1).map(([t]) => [t - 0.06, 'swish', 0.08]);
const sfxFile = (n: string) => (n.startsWith('sommaroy/') ? `elfahman/${n}.wav` : `elfahman/sfx/${n}.wav`);

// ============================================================ captions (word for word from the script, tashkeel kept)
// The hook card is the biggest text in the video (two lines over the full width with a small margin); the other cards stay
// under it: normal 76, "سومَرُوي" / "استنى" / the two choice cards 82, the gold ending 82.
const caps = CAPS as unknown as {sizes: number[]; w100: number[]; base: {normal: number; big: number; gold: number}; cards: Record<string, Partial<Group>>};
const PAINT: [string, number, string][] = [
  ['الوقت', 0, RED], ['سومروي', 0, YELLOW], ['أكتر', 0, YELLOW], ['من', 0, YELLOW], ['شهرين', 0, YELLOW],
  ['اتنين', 0, RED], ['بالليل', 0, RED], ['من', 1, YELLOW], ['غير', 0, YELLOW], ['وقت', 0, YELLOW], ['الكوبري', 0, YELLOW],
  ['استنى', 0, RED], ['الغريب', 0, RED], ['إعلان', 0, RED], ['سياح', 0, YELLOW],
  ['ما', 1, RED], ['بتطلعش', 0, RED], ['خالص', 1, RED], ['ليل', 0, YELLOW], ['شمس', 0, YELLOW],
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
  const pin: Record<string, number> = {'استنى': T.estanna, 'الفهمان': T.fahman, 'كسبان': T.kasban};
  for (const g of out) for (const w of g.words) if (pin[nq(w.w)] !== undefined) w.s = pin[nq(w.w)];
  for (const g of out) g.s = g.words[0].s;
  for (let k = 0; k < out.length - 1; k++) out[k].e = Math.min(out[k].e, out[k + 1].s);
  out[0].e = out[1].s; // the hook card holds until line 2 starts
  out[0].s = 0;        // the whole hook line is on screen in frame 0
  return out;
})();

// ============================================================ composition
export const Sommaroy: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam0 = camAt(t, CAM0, CAM_KEYS);
  const sh = shakeAt(t, SHAKES);
  const cam: Cam = {x: cam0.x - sh.x, y: cam0.y - sh.y, z: cam0.z};
  const pose = poseAt(t, POSES);
  const squash = Math.max(squashAt(t, POSES), t < 0.1 ? Math.cos((t / 0.1) * Math.PI / 2) : 0, t > END - 0.07 ? Math.sin(((t - END + 0.07) / 0.07) * Math.PI / 2) : 0);
  const vf = Math.round((t - VO) * FPS);
  const talking = TALKABLE.includes(pose) && vf >= 0 && vf < MOUTH.length;
  const mouth = talking ? MOUTH[vf] : 0;
  const blink = BLINKS.some((b) => t >= b && t < b + 0.1) && pose !== 'shocked';
  const wink = t >= T.kasban && pose === 'temple'; // wink exactly on "كسبان"
  const sig = t >= T.estanna - 0.02 && t < T.tala3 ? 0.3 * easeOut(seg(t, T.estanna - 0.02, T.estanna + 0.12)) * (1 - seg(t, T.tala3 - 0.3, T.tala3)) : 0;
  const hold = inDrama(t);
  // mood: warm summer -> cooler after the "إعلان" reveal -> deep blue winter -> back to warm on the closing line (loop)
  const warm = clamp(1 - seg(t, T.e3lan - 0.05, T.e3lan + 0.4) + seg(t, T.fahman - 0.2, T.fahman + 0.3));
  const winter = seg(t, T.bey7sal, T.aks + 0.4) * (1 - seg(t, T.testa7mel - 0.1, T.testa7mel + 0.4));
  const cool = clamp(1 - warm - winter);
  const ROOM = 0.06 * warm + 0.22 * cool + 0.34 * winter;
  return (
    <AbsoluteFill style={{backgroundColor: '#140e0b'}}>
      <Fonts />
      <SetBack cam={cam} dim={ROOM + sig + hold * 0.1} />
      <Layer cam={cam} z={1000}>
        <Board t={t} dim={(sig / 0.3) * 0.32} hold={hold} warm={warm} />
        <Character pose={pose} mouth={mouth} blink={blink} wink={wink} x={CHAR_X} y={CHAR_Y} scale={CS} squash={squash} t={t}>
          <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
            {wink && <Sparkle x={HEAD[0] + 210} y={HEAD[1] - 40} dt={t - T.kasban} r={48} />}
          </svg>
        </Character>
      </Layer>
      <SetFront cam={cam} dim={ROOM + sig + hold * 0.1} />
      {/* colour mood over the whole picture (under the captions) */}
      <AbsoluteFill style={{background: `rgba(255,170,70,${0.07 * warm})`}} />
      <AbsoluteFill style={{background: `rgba(40,70,130,${0.13 * cool})`}} />
      <AbsoluteFill style={{background: `rgba(12,30,90,${0.24 * winter})`}} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse 78% 62% at 50% 36%, rgba(0,0,0,0) 52%, rgba(0,0,0,${0.3 + 0.22 * (1 - warm) + sig * 0.6 + hold * 0.14}) 100%)`}} />
      <DownArrows t={t} />
      <Captions t={t} groups={GROUPS} colors={{}} y={1250} x={460} />
      <Sequence from={Math.round(VO * FPS)}><Audio src={staticFile('elfahman/sommaroy/vo/vo.mp3')} volume={1} /></Sequence>
      <Audio src={staticFile('elfahman/sommaroy/music/bed.wav')} volume={1} />
      <Audio src={staticFile('elfahman/sommaroy/music/hits.wav')} volume={1} />
      <Sequence from={Math.round(T.estanna * FPS)} durationInFrames={Math.round(0.6 * FPS)}><Audio src={staticFile('elfahman/sommaroy/music/scratch.wav')} volume={1} /></Sequence>
      {[...SFX, ...POSE_SWAP_SFX].map(([tt, n, v], i) => (
        <Sequence key={i} from={Math.max(0, Math.round(tt * FPS))} durationInFrames={Math.round(1.6 * FPS)}>
          <Audio src={staticFile(sfxFile(n))} volume={v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
