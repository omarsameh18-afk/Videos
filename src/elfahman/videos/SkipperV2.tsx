import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Fonts} from '../lib/fonts';
import {FPS, clamp, easeOut, seg} from '../lib/anim';
import {Cam, CamKey, Layer, camAt, shakeAt} from '../lib/camera';
import {SetBack, SetFront, DESK_SCREEN_Y} from '../lib/Set';
import {CANVAS, Character, HEAD, Pose, PoseKey, blinkTimes, mouthStates, poseAt, squashAt} from '../lib/Character';
import {Captions, Group, RED, YELLOW, Word, norm} from '../lib/Captions';
import {Sparkle, SweatDrop} from '../lib/fx';
import {BOARDS_V2 as BOARDS, VIEWS} from '../Boards14v2';
import WORDS from './skipper.words.json';
import ENV from './skipper.env.json';
import TIMING from './skipper.timing.json';
import WW from './skipper.wordw.json';

// Episode 14: "أقدم واحد زوّغ من الشغل". ONE eleven_v4 take (voice XFkxnO6GgzVSxqEN2NVq, 934 credits), re-edited with
// tools/pace.py at 1.0x (silence only cut / digital silence added): sentence gaps ~0.40 s, commas ~0.21 s, the hook and
// "استنى ده الغريب جاي!" in one go, 0.77 s mystery pause after "عملوا إيه؟", 0.4 s tail. 20 boards drawn in code (../Boards14.tsx).
// v2 LAYOUT (this video only): the same audio, timings, captions text and board drawings as v1. The board fills the top ~60%
// (screen y ~40 -> 1150, ~40 px side margins at the opening framing), each drawing is zoomed to fill it (VIEWS), a new hook board
// (Seba sneaking away) that the last board replays for the loop, الفهمان at 70% of v1 still sitting behind the desk, captions at y ~1385.

// ============================================================ timing
const words = WORDS as (Word & {sent: number})[];
const nq = (w: string) => norm(w).replace(/"/g, '');
const at = (w: string, nth = 0) => {
  const hits = words.map((x, i) => (nq(x.w) === nq(w) ? i : -1)).filter((i) => i >= 0);
  if (hits[nth] === undefined) throw new Error(`word not found: ${w} #${nth}`);
  return words[hits[nth]].s;
};
const SENT = (TIMING as {sentences: {s: number; e: number}[]}).sentences;
export const SKIPPER_V2_DURATION_S = Math.round(TIMING.duration * FPS) / FPS;
const END = SKIPPER_V2_DURATION_S;
const NB = 20;
const T = {
  masri: at('مصري'), seba: at('سبا'), talat: at('تلات'), magash: at('مجاش'), meen: at('مين'), ghab: at('غاب'), aqrab: at('العقرب'), qarasoh: at('قرصه'),
  ozr: at('عذر'), arbe3een: at('لأربعين'), wag3ah: at('وجعاه'), shwaya: at('شوية'), tani: at('تاني'), booza: at('البوظة'), wasta: at('الواسطة'),
  naharda: at('النهارده'), tamaneen: at('تمانين'), et2akhar: at('اتأخر'), amalo: at('عملوا'), sabo: at('سابوا'), e7na: at('إحنا'), a3do: at('وقعدوا'),
  ba3atolhom: at('بعتولهم'), fetayer: at('فطاير'), edrab: at('إضراب'), hayekteb: at('هيكتب'), eb3ato: at('وابعته'),
  estanna: 40.52, fahman: 61.08, kasban: 61.77, // measured audio onsets (timing.py / silencedetect)
};
const MYST: [number, number] = [SENT[12].e, SENT[13].s];
const B = (i: number) => (i === 0 ? 0 : SENT[i].s); // board i starts on its sentence
const boardAt = (t: number) => { let i = 0; for (let k = 0; k < NB; k++) if (t >= B(k)) i = k; return i; };
const EV: Record<number, number[]> = {
  0: [at('زوّغ')], 1: [T.seba, T.talat], 2: [T.magash], 3: [T.meen, T.ghab], 4: [T.aqrab, T.qarasoh], 5: [T.ozr], 6: [T.arbe3een],
  7: [T.wag3ah, T.shwaya, T.tani], 8: [T.booza], 9: [T.wasta], 10: [T.naharda], 11: [T.tamaneen, T.et2akhar], 12: [T.amalo],
  14: [T.sabo, T.e7na], 15: [T.a3do], 16: [T.ba3atolhom, T.fetayer], 17: [T.edrab], 18: [T.hayekteb, T.eb3ato],
};

// ============================================================ character
const TALKABLE: Pose[] = ['hero', 'explain', 'point_up', 'thinking', 'temple', 'thumbs_up', 'worried'];
const POSES: PoseKey[] = [
  [0, 'hero'],                 // hook: raised-eyebrow smirk
  [SENT[1].s, 'explain'],      // "اسمه سِبا"
  [T.magash, 'point_up'],      // "مجاش الشغل"
  [SENT[3].s, 'explain'],      // the scribe
  [T.qarasoh, 'worried'],      // the scorpion nip: he winces
  [SENT[5].s, 'explain'],      // "ماشي، عذر محترم" (both hands, ironic smile)
  [T.arbe3een, 'point_up'],    // "لأربعين عامل!"
  [SENT[7].s, 'hero'],         // the bandaged eye: skeptical eyebrow
  [SENT[8].s, 'explain'],      // beer
  [T.booza, 'laughing'],       // "البوظة بتاعتنا"
  [SENT[9].s, 'explain'],      // with the boss
  [T.wasta, 'temple'],         // "الواسطة" hand on temple + wink
  [SENT[10].s, 'explain'],     // the museum
  [T.et2akhar, 'worried'],     // the wages were late
  [T.amalo, 'thinking'],       // "عملوا إيه؟" held through the mystery pause
  [T.estanna, 'shocked'],      // signature exactly on "استنى"
  [SENT[14].s, 'explain'],     // payoff: the strike
  [T.e7na, 'point_up'],        // "إحنا جعانين!"
  [SENT[15].s, 'explain'],     // sit-in at the temple
  [T.fetayer, 'laughing'],     // "فطاير!"
  [SENT[17].s, 'explain'],     // "وده يا سيدي"
  [T.edrab, 'thumbs_up'],      // "أول إضراب" badge
  [SENT[18].s, 'explain'],     // comment question
  [T.eb3ato, 'point_up'],      // "وابعته"
  [T.fahman, 'temple'],        // hand on temple exactly on "الفهمان" (+ wink on "كسبان")
];
const MOUTH = mouthStates((ENV as {level: number[]}).level);
const BLINKS = blinkTimes(END, 14);
// v2: 70% of the v1 size (0.6), still sitting behind the desk of the study set (same desk line formula)
const CS = 0.42;
const CHAR_X = 540 - (CANVAS[0] * CS) / 2;
const CHAR_Y = DESK_SCREEN_Y - 1450 * CS;

// ============================================================ camera (2.5D)
const SHAKES: [number, number, number][] = [
  [0.02, 4, 9], [T.qarasoh, 6, 9], [T.estanna, 18, 6], [T.sabo, 5, 9], [T.edrab, 6, 9], [T.fahman, 3, 10],
];
// camera framings copied from episode 13 v3 (CAM0 / BASE / NEAR / mystery push-in / "استنى" punch-in / back to CAM0)
const CAM0: Cam = {x: 520, y: 860, z: 180};
const BASE: Cam = {x: 512, y: 866, z: 125};
const NEAR: Cam = {x: 510, y: 850, z: 150};
const CAM_KEYS: CamKey[] = [
  [0, 1.0, {x: 516, y: 866, z: 150}],
  [SENT[1].s - 0.1, SENT[1].s + 0.4, BASE],
  [SENT[4].s - 0.05, SENT[4].s + 0.4, NEAR],                       // the scorpion
  [SENT[5].s - 0.1, SENT[5].s + 0.4, BASE],
  [SENT[6].s - 0.05, SENT[6].s + 0.4, NEAR],                       // forty workers
  [SENT[7].s - 0.1, SENT[7].s + 0.4, BASE],
  [SENT[10].s - 0.05, SENT[10].s + 0.4, NEAR],                     // the museum
  [SENT[11].s - 0.1, SENT[11].s + 0.4, BASE],
  [SENT[12].s - 0.1, MYST[1] - 0.02, {x: 512, y: 880, z: 200}],    // slow push-in on the question + mystery pause (v2: his face is lower)
  [T.estanna - 0.04, T.estanna + 0.1, {x: 540, y: 900, z: 270}],   // punch-in exactly on "استنى" (v2: his face is lower)
  [SENT[14].s - 0.1, SENT[14].s + 0.4, NEAR],                      // payoff
  [SENT[15].s - 0.1, SENT[15].s + 0.4, BASE],
  [SENT[17].s - 0.05, SENT[17].s + 0.4, NEAR],                     // the badge
  [SENT[18].s - 0.1, SENT[18].s + 0.4, {x: 512, y: 868, z: 122}],
  [T.fahman - 0.1, T.fahman + 0.5, CAM0],                          // ends on the opening framing (loop)
];

// ============================================================ captions: 2-3 words, key words yellow / red
const KEY = ['مصري', 'سبا', 'الملوك', 'تلات', 'آلاف', 'كاتب', 'حجر', 'العقرب', 'محترم', 'لأربعين', 'عامل', 'عينه', 'بيرة', 'البوظة', 'المدير',
  'الواسطة', 'الفراعنة', 'موجود', 'النهارده', 'تمانين', 'قمح', 'الغريب', 'المعبد', 'فطاير', 'إضراب', 'البشرية', 'والمصريين', 'عذرك', 'وابعته', 'لزميلك'];
const REDS = ['مجاش', 'غاب', 'قرصه', 'اتأخر', 'جعانين', 'غايب'];
const HOOK_N = 9;
const GROUPS: Group[] = (() => {
  const col = (w: string) => (REDS.some((k) => nq(w) === k) ? RED : KEY.some((k) => nq(w) === k) ? YELLOW : undefined);
  const ws = words.map((w): Word => ({w: w.w, s: w.s, e: w.e, ...(col(w.w) ? {c: col(w.w)} : {})}));
  const out: Group[] = [];
  // hook: caption 1 "أقدم واحد زوّغ" from frame 0, caption 2 "من الشغل… كان مصري!" on the onset of "من"
  const O = words[3].s;
  out.push({words: [{w: 'أقدم', s: 0, e: 0}, {w: 'واحد', s: 0, e: 0}, {w: 'زوّغ', s: 0, e: 0, c: YELLOW}], s: 0, e: O, style: 'hook', fs: 108, br: 2, x: 540, maxW: 950});
  out.push({words: [{w: 'من', s: O, e: O}, {w: 'الشغل…', s: O, e: O}, {w: 'كان', s: O, e: O}, {w: 'مصري!', s: O, e: O, c: YELLOW}], s: O, e: 0, style: 'hook', fs: 102, br: 2, x: 540, maxW: 900});
  let cur: Word[] = [];
  const flush = () => { if (cur.length) out.push({words: cur, s: cur[0].s, e: cur[cur.length - 1].e}); cur = []; };
  ws.slice(HOOK_N).forEach((w, k, arr) => {
    const i = k + HOOK_N;
    const sent = words[i].sent, nxt = arr[k + 1] ? words[i + 1].sent : -1;
    if (cur.length && words[i - 1].sent !== sent) flush();
    cur.push(w);
    const end = /[.…!،:؟]$/.test(w.w) || nxt !== sent;
    const len = cur.reduce((a, x) => a + norm(x.w).length, 0);
    if (end || cur.length >= 3 || (cur.length >= 2 && len > 12)) flush();
  });
  flush();
  for (const g of out) if (g.words.every((w) => ['الفهمان', 'كسبان'].includes(nq(w.w)))) { g.style = 'gold'; g.fs = 104; }
  for (const g of out) if (g.style === undefined) g.fs = 92;
  const pin: Record<string, number> = {'استنى': T.estanna, 'الفهمان': T.fahman, 'كسبان': T.kasban};
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
export const SKIPPER_V2_GROUPS = GROUPS;
const CAP_Y = 1385; // v2: over the hoodie, inside y 1250..1500 (x 460, hook cards x 540)

// ============================================================ board (v2: x 110, y 106, 820 x 910 on the character plane = screen ~40..1040 x ~40..1150 at CAM0)
const BX = 110, BY = 106, BW = 820, BH = 910;
const INK = '#2d1c14';

// ============================================================ sound
type Cue = [number, string, number];
const SFX: Cue[] = [
  [0, 'pop', 0.26], [T.masri, 'boing', 0.1],
  [T.seba, 'pop', 0.14], [T.talat, 'ding', 0.18], [SENT[1].s + 0.2, 'step', 0.12],
  [T.magash, 'squish', 0.16], [T.meen, 'pop', 0.14], [SENT[3].s + 0.5, 'phone/sfx/tap', 0.14], [SENT[3].s + 1.2, 'phone/sfx/tap', 0.12],
  ...[0, 0.18, 0.36, 0.54].map((x): Cue => [T.aqrab - 0.4 + x, 'skipper/sfx/tick', 0.16]), [T.qarasoh, 'thud', 0.18], [T.qarasoh, 'pop', 0.22],
  [T.ozr, 'phone/sfx/stamp', 0.36], [SENT[6].s + 0.1, 'whoosh', 0.14], ...Array.from({length: 6}, (_, i): Cue => [T.arbe3een + 0.1 + i * 0.09, 'pop', 0.08]),
  [T.wag3ah, 'click', 0.18], [T.shwaya, 'click', 0.18], [T.tani, 'ding', 0.16],
  [SENT[8].s + 0.1, 'bubbles', 0.18], [T.booza, 'pop', 0.18], [T.wasta, 'phone/sfx/stamp', 0.34], [T.wasta + 0.3, 'twinkle', 0.14],
  [T.naharda, 'sparkle', 0.18], [T.tamaneen, 'pop', 0.18], [T.et2akhar, 'phone/sfx/stamp', 0.34],
  [T.amalo, 'pop', 0.14], [T.estanna, 'stinger', 0.34],
  [T.sabo, 'thud', 0.22], [T.sabo + 0.12, 'thud', 0.16], [T.e7na, 'pop', 0.24], [T.e7na + 0.05, 'twinkle', 0.16],
  [T.a3do, 'thud', 0.14], [T.ba3atolhom - 0.15, 'swish', 0.2], [T.fetayer, 'ding', 0.16],
  [T.edrab, 'phone/sfx/stamp', 0.3], [T.edrab + 0.05, 'sparkle', 0.24],
  [T.hayekteb, 'pop', 0.14], [T.eb3ato, 'swish', 0.18],
  [T.fahman - 0.15, 'swish', 0.22], [T.fahman, 'pop', 0.2], [T.kasban, 'twinkle', 0.34], [END - 0.5, 'whoosh', 0.1],
];
const BOARD_SWISH: Cue[] = SENT.slice(1).filter((_, i) => i + 1 !== 13 && i + 1 !== 19).map((s): Cue => [s.s - 0.08, 'whoosh', 0.09]);
const sfxFile = (n: string) => (n.includes('/') ? `elfahman/${n}.wav` : `elfahman/sfx/${n}.wav`);

// ============================================================ composition
export const SkipperV2: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const bi = boardAt(t);
  const src = bi === 13 ? 12 : bi; // "استنى": board 13 stays (frozen, dimmed)
  const b0 = B(src), b1 = bi < NB - 1 ? B(bi + 1) : END;
  const lt = t - b0;
  const Board = BOARDS[src];
  const ev = (EV[src] ?? []).map((x) => x - b0);
  const bt = src === 12 ? Math.min(lt, MYST[0] - b0) : lt; // mystery freeze: the board's own clock stops in the pause
  const cut = bi === 0 || bi === 13 || bi === NB - 1 ? 1 : 1 + 0.04 * (1 - easeOut(clamp(lt / 0.25))); // small push on each new board
  const cam0 = camAt(t, CAM0, CAM_KEYS);
  const sh = shakeAt(t, SHAKES);
  const cam: Cam = {x: cam0.x - sh.x, y: cam0.y - sh.y, z: cam0.z};
  const pose = poseAt(t, POSES);
  const squash = Math.max(squashAt(t, POSES), t > END - 0.07 ? Math.sin(((t - END + 0.07) / 0.07) * Math.PI / 2) : 0);
  const vf = Math.round(t * FPS);
  const talking = TALKABLE.includes(pose) && vf < MOUTH.length;
  const mouth = talking ? MOUTH[vf] : 0;
  const blink = BLINKS.some((b) => t >= b && t < b + 0.1) && pose !== 'shocked' && t > 0.3 && !(t > T.fahman - 0.2) && pose !== 'temple';
  const wink = pose === 'temple' && (t >= T.kasban || (t >= T.wasta + 0.3 && t < SENT[10].s));
  const winkAt = t >= T.kasban ? T.kasban : T.wasta + 0.3;
  const sweat = pose === 'worried';
  const myst = seg(t, T.amalo, MYST[0]) * (1 - seg(t, MYST[1] - 0.02, MYST[1] + 0.1));
  const sig = t >= T.estanna - 0.02 && t < SENT[14].s ? 0.3 * easeOut(seg(t, T.estanna - 0.02, T.estanna + 0.12)) * (1 - seg(t, SENT[14].s - 0.3, SENT[14].s)) : 0;
  const ROOM = 0.06 + 0.22 * myst;
  return (
    <AbsoluteFill style={{backgroundColor: '#140e0b'}}>
      <Fonts />
      <SetBack cam={cam} dim={ROOM + sig} />
      <Layer cam={cam} z={1000}>
        {/* the board on the wall (series frame and size); this video's drawings inside it */}
        <div style={{position: 'absolute', left: BX - BW * 0.32, top: BY - BH * 0.48, width: BW * 1.64, height: BH * 1.96, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(255,233,176,0.18) 55%, rgba(255,233,176,0) 72%)'}} />
        <div style={{position: 'absolute', left: BX - 16, top: BY - 16, width: BW + 32, height: BH + 32, borderRadius: 26, background: '#8a5a33', border: `10px solid ${INK}`, boxSizing: 'border-box'}} />
        <div style={{position: 'absolute', left: BX, top: BY, width: BW, height: BH, borderRadius: 14, overflow: 'hidden', border: `6px solid ${INK}`, boxSizing: 'border-box', background: '#21302b'}}>
          <div style={{position: 'absolute', left: -6, top: -6, width: 1080, height: 1920, transformOrigin: '0 0',
            transform: `translate(${BW / 2}px, ${BH / 2}px) scale(${(BW * VIEWS[bi].z) / 1080}) translate(${-VIEWS[bi].cx}px, ${-VIEWS[bi].cy}px)`}}>
            <div style={{position: 'absolute', inset: 0, transformOrigin: `${VIEWS[bi].cx}px ${VIEWS[bi].cy}px`, transform: `scale(${cut})`}}>
              <Board t={bt} d={b1 - b0} ev={ev} />
            </div>
          </div>
          <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse 62% 58% at 50% 42%, rgba(255,246,216,0.06) 0%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.28) 100%)`}} />
          {(sig > 0 || myst > 0) && <div style={{position: 'absolute', inset: 0, background: '#0b1210', opacity: (sig / 0.3) * 0.32 * 0.8 + myst * 0.25}} />}
        </div>
        <Character pose={pose} mouth={mouth} blink={blink} wink={wink} x={CHAR_X} y={CHAR_Y} scale={CS} squash={squash} t={t}>
          <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
            {wink && <Sparkle x={HEAD[0] + 210} y={HEAD[1] - 40} dt={t - winkAt} r={48} />}
            {sweat && [0, 1, 2].map((i) => {
              const ws = POSES.filter(([, p]) => p === 'worried').map(([k]) => k).filter((k) => k <= t).pop() ?? 0;
              return <SweatDrop key={i} x={HEAD[0] + (i % 2 ? 230 : -220)} y={HEAD[1] - 170} dt={t - (ws + 0.15 + i * 0.95)} s={0.9} />;
            })}
          </svg>
        </Character>
      </Layer>
      <SetFront cam={cam} dim={ROOM + sig} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse 78% 62% at 50% 36%, rgba(0,0,0,0) 52%, rgba(0,0,0,${0.3 + sig * 0.6 + myst * 0.2}) 100%)`}} />
      <Captions t={t} groups={GROUPS.slice(0, 2)} colors={{}} y={CAP_Y} x={540} />
      <Captions t={t} groups={GROUPS.slice(2)} colors={{}} y={CAP_Y} x={460} />
      <Audio src={staticFile('elfahman/skipper/vo/vo.mp3')} />
      <Audio src={staticFile('elfahman/skipper/music/bed.wav')} />
      <Audio src={staticFile('elfahman/skipper/music/hits.wav')} />
      <Sequence from={Math.round(T.estanna * FPS)} durationInFrames={Math.round(0.6 * FPS)}><Audio src={staticFile('elfahman/skipper/music/scratch.wav')} volume={0.7} /></Sequence>
      {[...SFX, ...BOARD_SWISH].map(([tt, n, v], i) => (
        <Sequence key={i} from={Math.max(0, Math.round(tt * FPS))} durationInFrames={Math.round(2 * FPS)}>
          <Audio src={staticFile(sfxFile(n))} volume={v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
