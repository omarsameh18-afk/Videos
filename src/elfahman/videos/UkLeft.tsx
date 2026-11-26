import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Fonts} from '../lib/fonts';
import {FPS, clamp, easeOut, seg} from '../lib/anim';
import {Cam, CamKey, Layer, camAt, shakeAt} from '../lib/camera';
import {SetBack, SetFront, DESK_SCREEN_Y} from '../lib/Set';
import {CANVAS, Character, HEAD, Pose, PoseKey, blinkTimes, mouthStates, poseAt, squashAt} from '../lib/Character';
import {Captions, Group, RED, YELLOW, Word, norm} from '../lib/Captions';
import {Sparkle} from '../lib/fx';
import {BOARDS_15, makeB19} from '../Boards15';
import WORDS from './ukleft.words.json';
import ENV from './ukleft.env.json';
import TIMING from './ukleft.timing.json';
import WW from './ukleft.wordw.json';

// Episode 15: "ليه الإنجليز بيسوقوا شمال؟". ONE eleven_v4 take (voice XFkxnO6GgzVSxqEN2NVq, 967 credits), re-edited with
// tools/pace.py at 1.0x (silence only cut / digital silence added): hook in one go, sentence gaps ~0.44 s, commas ~0.20 s,
// "…" beats ~0.29 s, 0.78 s mystery pause after "تفتكر ليه؟", 0.4 s tail. 19 boards (../Boards15.tsx), 3 generated props.
// LAYOUT = video #14 v2 (SkipperV2.tsx), copied exactly: set, board x 110 y 106 820 x 910 on the character plane (screen ~40..1040 x
// ~40..1150 at CAM0), الفهمان at 0.42 sitting behind the desk, captions at y 1385 (x 460, hook cards x 540), same camera framings.

// ============================================================ timing
const words = WORDS as (Word & {sent: number})[];
const nq = (w: string) => norm(w).replace(/"/g, '');
const at = (w: string, nth = 0) => {
  const hits = words.map((x, i) => (nq(x.w) === nq(w) ? i : -1)).filter((i) => i >= 0);
  if (hits[nth] === undefined) throw new Error(`word not found: ${w} #${nth}`);
  return words[hits[nth]].s;
};
const SENT = (TIMING as {sentences: {s: number; e: number}[]}).sentences;
export const UKLEFT_DURATION_S = Math.round(TIMING.duration * FPS) / FPS;
const END = UKLEFT_DURATION_S;
const NB = 19;
const T = {
  aks: at('عكس'), seif: at('سيف'), haramya: at('حرامية'), yameen1: at('اليمين'), manteqi: at('منطقي'), karbag: at('الكرباج'),
  napoleon: at('نابليون'), yameenA: at('يمين'), yameenB: at('يمين', 1), shamal1: at('شمال'), hend: at('الهند'), masr: at('ومصر'),
  twist: at('يمين', 2), sabaqhom: at('سبقهم'), shamal3: at('شمال', 2), hadsa: at('حادثة'), manshenoh: at('منشنه'),
  fahman: at('الفهمان'), kasban: 59.89, // measured on vo.mp3: الفهمان 59.37, كسبان 59.89 (the k-closure dip)
};
const MYST: [number, number] = [SENT[14].e, SENT[15].s];
const B = (i: number) => (i === 0 ? 0 : SENT[i].s); // board i starts on its sentence
const boardAt = (t: number) => { let i = 0; for (let k = 0; k < NB; k++) if (t >= B(k)) i = k; return i; };
const BOARDS = [...BOARDS_15, makeB19(END)];

// ============================================================ character
const TALKABLE: Pose[] = ['hero', 'explain', 'point_up', 'thinking', 'temple', 'thumbs_up', 'worried'];
const POSES: PoseKey[] = [
  [0, 'thinking'],             // hook: hand on chin
  [T.aks, 'explain'],          // "عكس الدنيا كلها؟"
  [SENT[1].s, 'point_up'],     // "السبب… سيف!"
  [SENT[2].s, 'explain'],      // the knight John
  [SENT[5].s, 'thumbs_up'],    // "منطقي جدًا." (small nod)
  [SENT[6].s, 'explain'],      // France + America wagons
  [T.napoleon, 'hero'],        // "ييجي نابليون" raised eyebrows, half smile
  [SENT[10].s, 'explain'],     // Napoleon's armies
  [SENT[12].s, 'explain'],
  [T.twist, 'shocked'],        // TWIST exactly on "يمين!"
  [SENT[14].s, 'thinking'],    // "تفتكر ليه؟" held through the mystery pause
  [SENT[15].s, 'point_up'],    // the popular explanation
  [SENT[16].s, 'explain'],
  [T.shamal3, 'laughing'],     // "كان زمانك بتسوق شمال." (the taxi swerves)
  [SENT[17].s, 'explain'],     // CTA
  [T.manshenoh, 'point_up'],   // "منشنه" (no point-down pose in the library: finger up + bouncing ⬇ on the board)
  [T.fahman, 'temple'],        // hand on temple exactly on "الفهمان" (+ wink on "كسبان")
];
const MOUTH = mouthStates((ENV as {level: number[]}).level);
const BLINKS = blinkTimes(END, 15);
const CS = 0.42; // = #14 v2
const CHAR_X = 540 - (CANVAS[0] * CS) / 2;
const CHAR_Y = DESK_SCREEN_Y - 1450 * CS;

// ============================================================ camera (2.5D) — framings = #14 v2
const SHAKES: [number, number, number][] = [[0.02, 4, 9], [T.seif, 4, 9], [T.twist, 12, 7], [T.hadsa, 5, 9], [T.fahman, 3, 10]];
const CAM0: Cam = {x: 520, y: 860, z: 180};
const BASE: Cam = {x: 512, y: 866, z: 125};
const NEAR: Cam = {x: 510, y: 850, z: 150};
const CAM_KEYS: CamKey[] = [
  [0, 1.0, {x: 516, y: 866, z: 150}],
  [SENT[1].s - 0.1, SENT[1].s + 0.4, BASE],
  [SENT[3].s - 0.05, SENT[3].s + 0.4, NEAR],                       // the sword hand
  [SENT[4].s - 0.1, SENT[4].s + 0.4, BASE],
  [SENT[7].s - 0.05, SENT[7].s + 0.4, NEAR],                       // the driver
  [SENT[8].s - 0.1, SENT[8].s + 0.4, BASE],
  [SENT[9].s - 0.05, SENT[9].s + 0.4, NEAR],                       // Napoleon
  [SENT[10].s - 0.1, SENT[10].s + 0.4, BASE],
  [SENT[13].s - 0.05, SENT[13].s + 0.4, NEAR],                     // "طب ومصر؟"
  [T.twist - 0.04, T.twist + 0.1, {x: 540, y: 900, z: 270}],       // TWIST punch-in exactly on "يمين!"
  [SENT[14].s - 0.15, MYST[1] - 0.02, {x: 512, y: 880, z: 200}],   // eases out of the punch into a slow push on the question + pause
  [MYST[1] - 0.02, MYST[1] + 0.4, NEAR],                           // the explanation
  [SENT[16].s - 0.1, SENT[16].s + 0.4, BASE],
  [SENT[17].s - 0.05, SENT[17].s + 0.4, NEAR],
  [T.fahman - 0.1, T.fahman + 0.5, CAM0],                          // ends on the opening framing (loop)
];

// ============================================================ captions: 2-3 words, key words yellow / red
const KEY = ['الشمال', 'شمال', 'نابليون', 'مصر', 'ومصر'];
const REDS = ['سيف', 'اليمين', 'يمين', 'حادثة'];
const HOOK_N = 6;
const GROUPS: Group[] = (() => {
  const col = (w: string) => (REDS.some((k) => nq(w) === k) ? RED : KEY.some((k) => nq(w) === k) ? YELLOW : undefined);
  const ws = words.map((w): Word => ({w: w.w, s: w.s, e: w.e, ...(col(w.w) ? {c: col(w.w)} : {})}));
  const out: Group[] = [];
  // hook: caption 1 "ليه الإنجليز بيسوقوا" from frame 0, caption 2 "عكس الدنيا كلها؟" on the onset of "عكس"
  const O = words[3].s;
  out.push({words: [{w: 'ليه', s: 0, e: 0}, {w: 'الإنجليز', s: 0, e: 0, c: YELLOW}, {w: 'بيسوقوا', s: 0, e: 0}], s: 0, e: O, style: 'hook', fs: 108, br: 1, x: 540, maxW: 950});
  out.push({words: [{w: 'عكس', s: O, e: O, c: RED}, {w: 'الدنيا', s: O, e: O}, {w: 'كلها؟', s: O, e: O}], s: O, e: 0, style: 'hook', fs: 104, br: 1, x: 540, maxW: 900});
  let cur: Word[] = [];
  const flush = () => { if (cur.length) out.push({words: cur, s: cur[0].s, e: cur[cur.length - 1].e}); cur = []; };
  ws.slice(HOOK_N).forEach((w, k, arr) => {
    const i = k + HOOK_N;
    const sent = words[i].sent, nxt = arr[k + 1] ? words[i + 1].sent : -1;
    if (cur.length && words[i - 1].sent !== sent) flush();
    if (['الفهمان'].includes(nq(w.w))) flush();
    cur.push(w);
    const end = /[.…!،:؟]$/.test(w.w) || nxt !== sent;
    const len = cur.reduce((a, x) => a + norm(x.w).length, 0);
    if (end || cur.length >= 3 || (cur.length >= 2 && len > 12)) flush();
  });
  flush();
  for (const g of out) if (g.words.every((w) => ['الفهمان', 'كسبان'].includes(nq(w.w)))) { g.style = 'gold'; g.fs = 104; }
  for (const g of out) if (g.style === undefined) g.fs = 92;
  const pin: Record<string, number> = {'الفهمان': T.fahman, 'كسبان': T.kasban};
  for (const g of out) for (const w of g.words) if (pin[nq(w.w)] !== undefined) w.s = pin[nq(w.w)];
  for (const g of out) g.s = g.words[0].s;
  out[0].s = 0; out[1].s = O;
  const ww = WW as Record<string, number>;
  const cl = (w: string) => w.replace(/\.\.\.|…/g, '').replace(/[.،,:]$/g, '');
  for (const g of out) {
    const cuts = [0, ...(g.br === undefined ? [] : [g.br as number]), g.words.length];
    g.w100 = Math.max(...cuts.slice(1).map((c, i) => g.words.slice(cuts[i], c).reduce((a, w, j) => a + (ww[cl(w.w)] ?? 60 * cl(w.w).length) + (j ? ww[' '] : 0), 0)));
    if (g.style !== 'hook') g.maxW = 780;
  }
  for (let k = 0; k < out.length; k++) { const nx = out[k + 1]; out[k].e = nx ? (nx.s - (out[k].e || nx.s) < 1.2 ? nx.s : out[k].e + 0.25) : 1e9; }
  return out;
})();
export const UKLEFT_GROUPS = GROUPS;
const CAP_Y = 1385; // = #14 v2

// ============================================================ board (= #14 v2: x 110, y 106, 820 x 910 on the character plane)
const BX = 110, BY = 106, BW = 820, BH = 910;
const INK = '#2d1c14';
const VIEW = {z: 1, cx: 540, cy: 600}; // board space 1080 x 1200 shown 1:1

// ============================================================ sound
type Cue = [number, string, number];
const S = (n: string) => `ukleft/sfx/${n}`;
const SFX: Cue[] = [
  [0, 'pop', 0.22],
  [T.seif - 0.08, S('shing'), 0.3], [T.seif + 0.3, 'sparkle', 0.12],
  [SENT[2].s, S('trot'), 0.2], [SENT[2].s + 2.0, S('trot'), 0.18], [T.haramya, 'pop', 0.12], [T.haramya + 0.25, 'pop', 0.1],
  [T.yameen1, 'ding', 0.16], [SENT[4].s, S('trot'), 0.14], [at('السيف', 1), 'ding', 0.18], [T.manteqi, 'twinkle', 0.18],
  [SENT[6].s, S('hooves'), 0.2], [at('فرنسا'), 'pop', 0.14], [at('وأمريكا'), 'pop', 0.14],
  [at('الشمال', 1), 'pop', 0.12], [at('اليمين', 1), 'pop', 0.12], [T.karbag - 0.22, S('whip'), 0.32],
  [SENT[8].s, S('hooves'), 0.12], [at('اليمين', 2), 'phone/sfx/stamp', 0.3],
  [T.napoleon - 1.2, S('drumroll'), 0.26],
  [T.yameenA, 'phone/sfx/stamp', 0.26], [at('جيوشه') - 0.3, S('march'), 0.2], [T.yameenB, 'phone/sfx/stamp', 0.3],
  [at('ماقدرش') + 0.35, 'boing', 0.24], [T.shamal1, 'phone/sfx/stamp', 0.3],
  [T.hend, 'pop', 0.16], [at('وأستراليا'), 'pop', 0.16], [at('شمال', 1), 'phone/sfx/stamp', 0.26],
  [T.masr - 0.25, 'pop', 0.18], ...[0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9].map((x): Cue => [at('سبعين') + x, 'skipper/sfx/tick', 0.12]),
  [at('بنسوق') - 0.9, 'whoosh', 0.12], [T.twist, 'stinger', 0.3], [T.twist, 'phone/sfx/stamp', 0.3],
  [at('نابليون', 2), 'pop', 0.16], [T.sabaqhom, 'sparkle', 0.2], [at('مصر') + 0.2, 'pop', 0.14], [at('تمانين') - 0.3, 'whoosh', 0.14],
  [T.shamal3 - 0.5, 'swish', 0.16], [T.shamal3 + 0.1, S('honk'), 0.22],
  [T.hadsa, S('puff'), 0.3], [T.manshenoh - 0.15, 'pop', 0.18],
  [T.fahman - 0.15, 'swish', 0.2], [T.fahman, 'pop', 0.18], [T.kasban, 'twinkle', 0.32], [END - 0.5, 'whoosh', 0.1],
];
const BOARD_SWISH: Cue[] = SENT.slice(1).filter((_, i) => ![5, 14, 18].includes(i + 1)).map((s): Cue => [s.s - 0.08, 'whoosh', 0.09]);
const sfxFile = (n: string) => (n.includes('/') ? `elfahman/${n}.wav` : `elfahman/sfx/${n}.wav`);

// ============================================================ composition
export const UkLeft: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const bi = boardAt(t);
  const b0 = B(bi), b1 = bi < NB - 1 ? B(bi + 1) : END;
  const lt = t - b0;
  const Board = BOARDS[bi];
  const bt = bi === 14 ? Math.min(lt, MYST[0] - b0 + 10) : lt; // board 15 holds still except the "؟" pulse
  const cut = bi === 0 || bi === 5 || bi === 14 || bi === NB - 1 ? 1 : 1 + 0.04 * (1 - easeOut(clamp(lt / 0.25))); // small push on each new board
  const cam0 = camAt(t, CAM0, CAM_KEYS);
  const sh = shakeAt(t, SHAKES);
  const cam: Cam = {x: cam0.x - sh.x, y: cam0.y - sh.y, z: cam0.z};
  const pose = poseAt(t, POSES);
  const squash = Math.max(squashAt(t, POSES), t > END - 0.07 ? Math.sin(((t - END + 0.07) / 0.07) * Math.PI / 2) : 0);
  const vf = Math.round(t * FPS);
  const talking = TALKABLE.includes(pose) && vf < MOUTH.length;
  const mouth = talking ? MOUTH[vf] : 0;
  const nod = pose === 'thumbs_up' ? Math.sin(clamp((t - SENT[5].s) / 0.5) * Math.PI * 2) * 8 : 0; // small nod on "منطقي جدًا"
  const blink = BLINKS.some((b) => t >= b && t < b + 0.1) && pose !== 'shocked' && t > 0.3 && !(t > T.fahman - 0.2) && pose !== 'temple';
  const wink = pose === 'temple' && t >= T.kasban;
  const myst = seg(t, SENT[14].s, MYST[0]) * (1 - seg(t, MYST[1] - 0.02, MYST[1] + 0.1));
  const sig = t >= T.twist - 0.02 && t < SENT[14].s ? 0.3 * easeOut(seg(t, T.twist - 0.02, T.twist + 0.12)) * (1 - seg(t, SENT[14].s - 0.3, SENT[14].s)) : 0;
  const ROOM = 0.06 + 0.22 * myst;
  return (
    <AbsoluteFill style={{backgroundColor: '#140e0b'}}>
      <Fonts />
      <SetBack cam={cam} dim={ROOM + sig} />
      <Layer cam={cam} z={1000}>
        <div style={{position: 'absolute', left: BX - BW * 0.32, top: BY - BH * 0.48, width: BW * 1.64, height: BH * 1.96, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(255,233,176,0.18) 55%, rgba(255,233,176,0) 72%)'}} />
        <div style={{position: 'absolute', left: BX - 16, top: BY - 16, width: BW + 32, height: BH + 32, borderRadius: 26, background: '#8a5a33', border: `10px solid ${INK}`, boxSizing: 'border-box'}} />
        <div style={{position: 'absolute', left: BX, top: BY, width: BW, height: BH, borderRadius: 14, overflow: 'hidden', border: `6px solid ${INK}`, boxSizing: 'border-box', background: '#21302b'}}>
          <div style={{position: 'absolute', left: -6, top: -6, width: 1080, height: 1920, transformOrigin: '0 0',
            transform: `translate(${BW / 2}px, ${BH / 2}px) scale(${(BW * VIEW.z) / 1080}) translate(${-VIEW.cx}px, ${-VIEW.cy}px)`}}>
            <div style={{position: 'absolute', inset: 0, transformOrigin: `${VIEW.cx}px ${VIEW.cy}px`, transform: `scale(${cut})`}}>
              <Board t={bt} d={b1 - b0} b0={b0} />
            </div>
          </div>
          <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse 62% 58% at 50% 42%, rgba(255,246,216,0.06) 0%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.22) 100%)`}} />
          {(sig > 0 || myst > 0) && <div style={{position: 'absolute', inset: 0, background: '#0b1210', opacity: (sig / 0.3) * 0.15 + myst * 0.2}} />}
        </div>
        <div style={{position: 'absolute', inset: 0, transform: `translateY(${nod}px)`}}>
          <Character pose={pose} mouth={mouth} blink={blink} wink={wink} x={CHAR_X} y={CHAR_Y} scale={CS} squash={squash} t={t}>
            <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
              {wink && <Sparkle x={HEAD[0] + 210} y={HEAD[1] - 40} dt={t - T.kasban} r={48} />}
            </svg>
          </Character>
        </div>
      </Layer>
      <SetFront cam={cam} dim={ROOM + sig} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse 78% 62% at 50% 36%, rgba(0,0,0,0) 52%, rgba(0,0,0,${0.3 + sig * 0.6 + myst * 0.2}) 100%)`}} />
      <Captions t={t} groups={GROUPS.slice(0, 2)} colors={{}} y={CAP_Y} x={540} />
      <Captions t={t} groups={GROUPS.slice(2)} colors={{}} y={CAP_Y} x={460} />
      <Audio src={staticFile('elfahman/ukleft/vo/vo.mp3')} />
      <Audio src={staticFile('elfahman/ukleft/music/bed.wav')} />
      <Audio src={staticFile('elfahman/ukleft/music/hits.wav')} />
      {[...SFX, ...BOARD_SWISH].map(([tt, n, v], i) => (
        <Sequence key={i} from={Math.max(0, Math.round(tt * FPS))} durationInFrames={Math.round(2.6 * FPS)}>
          <Audio src={staticFile(sfxFile(n))} volume={v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
