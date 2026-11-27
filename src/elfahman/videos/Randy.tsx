import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Fonts} from '../lib/fonts';
import {FPS, clamp, easeOut, seg} from '../lib/anim';
import {Cam, CamKey, Layer, camAt, shakeAt} from '../lib/camera';
import {SetBack, SetFront, DESK_SCREEN_Y} from '../lib/Set';
import {CANVAS, Character, HEAD, Pose, PoseKey, blinkTimes, mouthStates, poseAt, squashAt} from '../lib/Character';
import {Captions, GOLD, Group, RED, YELLOW, Word} from '../lib/Captions';
import {Sparkle, SweatDrop} from '../lib/fx';
import {BOARDS_16, B16, makeB20} from '../Boards16';
import WORDS from './randy.words.json';
import ENV from './randy.env.json';
import TIMING from './randy.timing.json';
import WW from './randy.wordw.json';

// Episode 16: "ولد قرر مينامش ١١ يوم". ONE eleven_v4 take (voice XFkxnO6GgzVSxqEN2NVq, 1,135 credits) with inline audio tags,
// re-edited with tools/pace.py at 1.0x on boundaries snapped onto the measured silences (silence only cut / digital silence
// added): hook in one go, sentence gaps ~0.39 s, commas ~0.19 s, "…" beats ~0.27 s, 0.77 s mystery pause after "تفتكر حصله إيه؟",
// 0.4 s tail. 20 boards (../Boards16.tsx), 2 generated props (young راندي, old راندي in bed).
// LAYOUT = video #14 v2 (SkipperV2.tsx), copied exactly (as #15 UkLeft.tsx): set, board x 110 y 106 820 x 910 on the character plane
// (screen ~40..1040 x ~40..1150 at CAM0), الفهمان at 0.42 sitting behind the desk, captions at y 1385 (x 460, hook cards x 540),
// same camera framings.

// ============================================================ timing
const words = WORDS as (Word & {sent: number})[];
const wi = (i: number) => words[i].s;
const SENT = (TIMING as {sentences: {s: number; e: number}[]}).sentences;
export const RANDY_DURATION_S = Math.round(TIMING.duration * FPS) / FPS;
const END = RANDY_DURATION_S;
const NB = 20;
const T = {
  kamleen: wi(8), meen: wi(22), sahleen: wi(31), coca: wi(32), asabi: wi(48), la3eb: wi(61), ghalabo: wi(85), nesy: wi(100),
  mafeesh: wi(113), twist: wi(131), sa3a: wi(147), eb3ato: wi(148),
  fahman: wi(153), kasban: 61.92, // measured on vo.mp3 (timing.py onset check): الفهمان 61.27, كسبان 61.92
};
const MYST: [number, number] = [SENT[15].e, SENT[16].s];
const B = (i: number) => (i === 0 ? 0 : SENT[i].s); // board i starts on its sentence
const boardAt = (t: number) => { let i = 0; for (let k = 0; k < NB; k++) if (t >= B(k)) i = k; return i; };
const BOARDS = [...BOARDS_16, makeB20(END)];

// ============================================================ character
const TALKABLE: Pose[] = ['hero', 'explain', 'point_up', 'thinking', 'temple', 'thumbs_up', 'worried'];
const POSES: PoseKey[] = [
  [0, 'hero'],                 // hook: raised eyebrows, half smile (shocked-lite)
  [T.kamleen, 'explain'],      // "كاملين!"
  [SENT[2].s, 'explain'],      // the coin toss
  [T.meen, 'point_up'],        // "مين فيهم…؟"
  [SENT[3].s, 'laughing'],     // "[laughs softly] وراندي خسر."
  [SENT[4].s, 'explain'],      // "أول يومين؟"
  [T.sahleen, 'thumbs_up'],    // "سهلين."
  [T.coca, 'explain'],         // cola, shower, friends
  [SENT[5].s, 'laughing'],     // "[laughs softly] حتى في الحمام…"
  [SENT[6].s, 'worried'],      // day 3: nervous, can't say a sentence (sweat drop)
  [SENT[7].s, 'explain'],      // day 4
  [T.la3eb, 'shocked'],        // "لاعب كورة مشهور!"
  [SENT[8].s, 'laughing'],     // "زي ما تصحى فاكر نفسك محمد صلاح."
  [SENT[9].s, 'thinking'],     // day 5: the forest (hand on chin)
  [SENT[10].s, 'explain'],     // day 10: the sleep scientist
  [T.ghalabo, 'point_up'],     // "وراندي غلبه في لعبة!"
  [SENT[11].s, 'explain'],     // day 11: subtract seven
  [T.nesy, 'shocked'],         // "ونسي هو بيعمل إيه." (small)
  [SENT[13].s, 'explain'],     // slept 15 hours
  [SENT[14].s, 'explain'],     // the press
  [T.mafeesh, 'thinking'],     // "مفيش حاجة وحشة حصلت!" one raised eyebrow
  [SENT[15].s, 'thinking'],    // "تفتكر حصله إيه؟" held through the mystery pause
  [SENT[16].s, 'explain'],     // "راندي… بقى يقعد بالليالي"
  [T.twist, 'shocked'],        // TWIST exactly on "ينام!"
  [SENT[17].s, 'explain'],     // Guinness
  [SENT[18].s, 'explain'],     // CTA
  [T.sa3a, 'point_up'],        // "كام ساعة؟" (no point-down pose in the library: finger up + a bouncing ⬇ under the comment icon)
  [T.fahman, 'temple'],        // hand on temple exactly on "الفهمان" (+ wink on "كسبان")
];
const MOUTH = mouthStates((ENV as {level: number[]}).level);
const BLINKS = blinkTimes(END, 16);
const CS = 0.42; // = #14 v2
const CHAR_X = 540 - (CANVAS[0] * CS) / 2;
const CHAR_Y = DESK_SCREEN_Y - 1450 * CS;

// ============================================================ camera (2.5D) — framings = #14 v2
const SHAKES: [number, number, number][] = [[0.02, 4, 9], [wi(28), 4, 9], [T.la3eb, 4, 9], [T.nesy, 3, 9], [T.twist, 12, 7], [wi(134), 5, 9], [T.fahman, 3, 10]];
const CAM0: Cam = {x: 520, y: 860, z: 180};
const BASE: Cam = {x: 512, y: 866, z: 125};
const NEAR: Cam = {x: 510, y: 850, z: 150};
const CAM_KEYS: CamKey[] = [
  [0, 1.0, {x: 516, y: 866, z: 150}],
  [SENT[1].s - 0.1, SENT[1].s + 0.4, BASE],
  [SENT[3].s - 0.05, SENT[3].s + 0.4, NEAR],                       // "وراندي خسر."
  [SENT[4].s - 0.1, SENT[4].s + 0.4, BASE],
  [SENT[7].s - 0.05, SENT[7].s + 0.4, NEAR],                       // day 4: the footballer
  [SENT[8].s - 0.1, SENT[8].s + 0.4, BASE],
  [SENT[11].s - 0.05, SENT[11].s + 0.4, NEAR],                     // day 11: the chalkboard
  [SENT[13].s - 0.1, SENT[13].s + 0.4, BASE],
  [SENT[15].s - 0.1, MYST[1] - 0.02, {x: 512, y: 880, z: 200}],    // slow push on the question + the mystery pause
  [MYST[1] - 0.02, MYST[1] + 0.4, NEAR],                           // old راندي
  [T.twist - 0.04, T.twist + 0.1, {x: 540, y: 900, z: 270}],       // TWIST punch-in exactly on "ينام!"
  [SENT[17].s - 0.15, SENT[17].s + 0.4, BASE],                     // eases out of the punch on the next line
  [SENT[18].s - 0.05, SENT[18].s + 0.4, NEAR],
  [T.fahman - 0.1, T.fahman + 0.5, CAM0],                          // ends on the opening framing (loop)
];

// ============================================================ captions: cards by hand (2-3 words), numbers as digits, key words coloured
const GOLDC = 'gold';
const REP: Record<number, string | null> = {
  92: '٧', 94: '١٠٠…', 98: '٦٥', 99: null, 106: '١٥', 120: '٤٠', 79: 'الـ١٠،', 89: 'الـ١١،',
};
const COL: Record<number, string> = {
  10: YELLOW, 27: YELLOW, 125: YELLOW, 28: RED, 39: YELLOW, 61: YELLOW, 62: YELLOW, 63: YELLOW, 69: YELLOW, 70: YELLOW, 74: RED, 85: YELLOW,
  98: RED, 113: YELLOW, 114: YELLOW, 115: YELLOW, 129: RED, 130: RED, 131: RED, 133: YELLOW, 139: RED,
};
const CARDS: number[][] = [
  [9, 10], [11, 12, 13], [14, 15], [16, 17],
  [18, 19, 20], [21], [22, 23], [24, 25, 26],
  [27, 28],
  [29, 30, 31], [32, 33], [34, 35, 36],
  [37, 38, 39], [40, 41], [42, 43, 44],
  [45, 46], [47, 48], [49, 50, 51], [52, 53, 54],
  [55, 56], [57, 58], [59, 60], [61, 62, 63],
  [64, 65, 66], [67, 68], [69, 70],
  [71, 72], [73, 74], [75, 76],
  [77, 78, 79], [80, 81], [82, 83], [84, 85], [86, 87],
  [88, 89], [90, 91], [92, 93, 94], [95],
  [96, 97, 98, 99], [100, 101], [102, 103],
  [104, 105], [106, 107],
  [108, 109, 110], [111, 112], [113, 114, 115], [116],
  [117, 118, 119], [120, 121], [122, 123, 124],
  [125], [126, 127, 128], [129, 130, 131],
  [132, 133], [134, 135], [136, 137], [138, 139],
  [140, 141, 142], [143, 144], [145, 146, 147], [148, 149], [150, 151, 152],
  [153, 154],
];
const GROUPS: Group[] = (() => {
  const out: Group[] = [];
  // hook: caption 1 "ولد عنده ١٧ سنة" from frame 0, caption 2 "قرر مينامش ١١ يوم كاملين!" on the onset of "قرر"
  const O = wi(4);
  out.push({words: [{w: 'ولد', s: 0, e: 0}, {w: 'عنده', s: 0, e: 0}, {w: '١٧', s: 0, e: 0, c: YELLOW}, {w: 'سنة', s: 0, e: 0}], s: 0, e: O, style: 'hook', fs: 122, br: 2, x: 540, maxW: 900});
  out.push({words: [{w: 'قرر', s: O, e: O}, {w: 'مينامش', s: O, e: O, c: YELLOW}, {w: '١١', s: O, e: O, c: RED}, {w: 'يوم', s: O, e: O, c: RED}, {w: 'كاملين!', s: O, e: O}], s: O, e: 0, style: 'hook', fs: 108, br: 2, x: 540, maxW: 900});
  const used = new Set<number>();
  for (const c of CARDS) {
    for (const i of c) { if (used.has(i)) throw new Error(`word ${i} twice`); used.add(i); }
    const ws: Word[] = [];
    for (const i of c) {
      if (REP[i] === null) { if (ws.length) ws[ws.length - 1].e = words[i].e; continue; }
      const w = REP[i] ?? words[i].w;
      ws.push({w, s: words[i].s, e: words[i].e, ...(COL[i] ? {c: COL[i]} : {})});
    }
    out.push({words: ws, s: ws[0].s, e: ws[ws.length - 1].e});
  }
  for (let i = 9; i < words.length; i++) if (!used.has(i)) throw new Error(`word ${i} not in a card`);
  const last = out[out.length - 1];
  last.style = 'gold'; last.fs = 104; last.words[0].s = T.fahman; last.words[1].s = T.kasban; last.s = T.fahman;
  for (const g of out) if (g.style === undefined) g.fs = 92;
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
export const RANDY_GROUPS = GROUPS;
void GOLD; void GOLDC;
const CAP_Y = 1385; // = #14 v2

// ============================================================ board (= #14 v2: x 110, y 106, 820 x 910 on the character plane)
const BX = 110, BY = 106, BW = 820, BH = 910;
const INK = '#2d1c14';
const VIEW = {z: 1, cx: 540, cy: 600}; // board space 1080 x 1200 shown 1:1

// ============================================================ sound (SFX ~18 dB under the voice)
type Cue = [number, string, number];
const S = (n: string) => `randy/sfx/${n}`;
const SFX: Cue[] = [
  [0, S('tick'), 0.22], [1.0, S('tick'), 0.2], [2.0, S('tick'), 0.2], [wi(6), 'phone/sfx/stamp', 0.26], [3.0, S('tick'), 0.16],
  [wi(13), 'ding', 0.16], [wi(13) + 0.25, 'sparkle', 0.14],
  [wi(21), S('coinspin'), 0.3], [T.meen, 'pop', 0.14], [T.meen + 0.12, 'pop', 0.12],
  [SENT[3].s + 0.75, S('trombone'), 0.22], [wi(28), 'phone/sfx/stamp', 0.26],
  [T.sahleen, 'ding', 0.16], [T.coca - 0.05, S('fizz'), 0.26], [wi(33) - 0.05, S('shower'), 0.18], [wi(35) - 0.4, 'step', 0.14],
  [wi(40) - 0.45, S('knock'), 0.34], [wi(44), 'pop', 0.12],
  [T.asabi, 'squish', 0.16], [wi(49), 'boing', 0.12],
  [wi(57), 'swish', 0.14], [T.la3eb - 0.1, 'sparkle', 0.18], [T.la3eb, 'twinkle', 0.16],
  [wi(66) - 0.1, 'swish', 0.12], [wi(69) - 0.25, S('cheer'), 0.2],
  [wi(73), S('hum'), 0.3],
  [wi(80) - 0.2, 'step', 0.14], [wi(83), S('pinball'), 0.22], [T.ghalabo, 'ding', 0.2],
  [wi(91), S('chalk'), 0.2], [wi(95), S('chalk'), 0.18], [wi(97), S('chalk'), 0.16], [T.nesy, S('clink'), 0.32],
  [wi(105) - 0.35, 'thud', 0.18], [wi(105) + 0.2, S('snore'), 0.2], [wi(106), 'pop', 0.16],
  ...[0.2, 0.75, 1.1, 1.7, 2.3, 2.6, 3.0].map((x): Cue => [SENT[14].s + x, S('flash'), 0.16]), [wi(110), 'pop', 0.14], [T.mafeesh, 'twinkle', 0.14],
  [SENT[15].s, 'whoosh', 0.12], [SENT[15].s + 0.2, S('tick'), 0.14],
  [SENT[16].s, S('tick'), 0.2], [wi(126), S('tick'), 0.22], [wi(129), S('tick'), 0.22], [T.twist, 'stinger', 0.3],
  [wi(134), S('bookthud'), 0.36], [wi(139), 'phone/sfx/stamp', 0.3],
  [wi(146), 'pop', 0.16], [T.eb3ato, 'whoosh', 0.16], [wi(149) + 0.1, 'pop', 0.14], [wi(151), 'twinkle', 0.14],
  [T.fahman - 0.15, 'swish', 0.2], [T.fahman, 'pop', 0.18], [T.kasban, 'twinkle', 0.32], [END - 0.5, 'whoosh', 0.1],
];
const BOARD_SWISH: Cue[] = SENT.slice(1).filter((_, i) => ![3, 12, 16, 19].includes(i + 1)).map((s): Cue => [s.s - 0.08, 'whoosh', 0.09]);
const sfxFile = (n: string) => (n.includes('/') ? `elfahman/${n}.wav` : `elfahman/sfx/${n}.wav`);

// ============================================================ composition
export const Randy: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const bi = boardAt(t);
  const b0 = B(bi), b1 = bi < NB - 1 ? B(bi + 1) : END;
  const lt = t - b0;
  const Board = BOARDS[bi];
  const bt = bi === 15 ? Math.min(lt, MYST[0] - b0) : lt; // board 16 holds still in the mystery pause except the "؟" pulse
  const noPush = [0, 3, 12, 15, NB - 1];
  const cut = noPush.includes(bi) ? 1 : 1 + 0.04 * (1 - easeOut(clamp(lt / 0.25)));
  const cam0 = camAt(t, CAM0, CAM_KEYS);
  const sh = shakeAt(t, SHAKES);
  const cam: Cam = {x: cam0.x - sh.x, y: cam0.y - sh.y, z: cam0.z};
  const pose = poseAt(t, POSES);
  const squash = Math.max(squashAt(t, POSES), t > END - 0.07 ? Math.sin(((t - END + 0.07) / 0.07) * Math.PI / 2) : 0);
  const vf = Math.round(t * FPS);
  const talking = TALKABLE.includes(pose) && vf < MOUTH.length;
  const mouth = talking ? MOUTH[vf] : 0;
  const nod = pose === 'thumbs_up' ? Math.sin(clamp((t - T.sahleen) / 0.5) * Math.PI * 2) * 8 : 0;
  const blink = BLINKS.some((b) => t >= b && t < b + 0.1) && pose !== 'shocked' && t > 0.3 && !(t > T.fahman - 0.2) && pose !== 'temple';
  const wink = pose === 'temple' && t >= T.kasban;
  const sweat = pose === 'worried';
  const myst = seg(t, SENT[15].s, MYST[0]) * (1 - seg(t, MYST[1] - 0.02, MYST[1] + 0.1));
  const sig = t >= T.twist - 0.02 && t < SENT[17].s ? 0.3 * easeOut(seg(t, T.twist - 0.02, T.twist + 0.12)) * (1 - seg(t, SENT[17].s - 0.3, SENT[17].s)) : 0;
  const ROOM = 0.06 + 0.22 * myst;
  const ws = POSES.filter(([, p]) => p === 'worried').map(([k]) => k).filter((k) => k <= t).pop() ?? 0;
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
              {bi === 15 ? <B16 t={bt} d={b1 - b0} b0={b0} tq={lt} /> : <Board t={bt} d={b1 - b0} b0={b0} />}
            </div>
          </div>
          <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse 62% 58% at 50% 42%, rgba(255,246,216,0.06) 0%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.22) 100%)`}} />
          {(sig > 0 || myst > 0) && <div style={{position: 'absolute', inset: 0, background: '#0b1210', opacity: (sig / 0.3) * 0.15 + myst * 0.2}} />}
        </div>
        <div style={{position: 'absolute', inset: 0, transform: `translateY(${nod}px)`}}>
          <Character pose={pose} mouth={mouth} blink={blink} wink={wink} x={CHAR_X} y={CHAR_Y} scale={CS} squash={squash} t={t}>
            <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
              {wink && <Sparkle x={HEAD[0] + 210} y={HEAD[1] - 40} dt={t - T.kasban} r={48} />}
              {sweat && [0, 1, 2].map((i) => <SweatDrop key={i} x={HEAD[0] + (i % 2 ? 230 : -220)} y={HEAD[1] - 170} dt={t - (ws + 0.15 + i * 0.95)} s={0.9} />)}
            </svg>
          </Character>
        </div>
      </Layer>
      <SetFront cam={cam} dim={ROOM + sig} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse 78% 62% at 50% 36%, rgba(0,0,0,0) 52%, rgba(0,0,0,${0.3 + sig * 0.6 + myst * 0.2}) 100%)`}} />
      <Captions t={t} groups={GROUPS.slice(0, 2)} colors={{}} y={CAP_Y} x={540} />
      <Captions t={t} groups={GROUPS.slice(2)} colors={{}} y={CAP_Y} x={460} />
      <Audio src={staticFile('elfahman/randy/vo/vo.mp3')} />
      <Audio src={staticFile('elfahman/randy/music/bed.wav')} />
      <Audio src={staticFile('elfahman/randy/music/hits.wav')} />
      {[...SFX, ...BOARD_SWISH].map(([tt, n, v], i) => (
        <Sequence key={i} from={Math.max(0, Math.round(tt * FPS))} durationInFrames={Math.round(2.6 * FPS)}>
          <Audio src={staticFile(sfxFile(n))} volume={v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
