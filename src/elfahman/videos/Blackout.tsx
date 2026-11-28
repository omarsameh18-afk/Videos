import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Fonts} from '../lib/fonts';
import {FPS, clamp, easeOut, seg} from '../lib/anim';
import {Cam, CamKey, Layer, camAt, shakeAt} from '../lib/camera';
import {SetBack, SetFront, DESK_SCREEN_Y} from '../lib/Set';
import {CANVAS, Character, HEAD, Pose, PoseKey, blinkTimes, mouthStates, poseAt, squashAt} from '../lib/Character';
import {Captions, GOLD, Group, RED, YELLOW, Word} from '../lib/Captions';
import {Sparkle, SweatDrop} from '../lib/fx';
import {BOARDS_17, B12, makeLoop} from '../Boards17';
import WORDS from './blackout.words.json';
import ENV from './blackout.env.json';
import TIMING from './blackout.timing.json';
import WW from './blackout.wordw.json';

// Episode 17: "لو الكهربا قطعت عن الدنيا أسبوع". ONE eleven_v4 take of the fully diacritized text (voice XFkxnO6GgzVSxqEN2NVq, 1,333 credits),
// script line 7 (the phone tower) cut out of that take at its breaths, re-paced with tools/pace.py at 1.0x (silence only cut / digital
// silence added): hook in one go (0.2 s beat), sentence gaps 0.43-0.49 s, commas 0.18-0.24 s, "…" beats ~0.3 s, 0.79 s mystery pause
// after "بس تفتكر ده ممكن يحصل بجد؟", 0.4 s tail. 16 story boards + the loop board (../Boards17.tsx), all drawn in code (0 picture credits).
// LAYOUT = video #14 v2 (SkipperV2.tsx), copied exactly (as #15 / #16): set, board x 110 y 106 820 x 910 on the character plane
// (screen ~40..1040 x ~40..1150 at CAM0), الفهمان at 0.42 sitting behind the desk, captions at y 1385, same camera framings.
// The study set stays normally lit the whole video (no room dim); ONLY the board gets darker as the days pass (BOARD_DIM).

// ============================================================ timing
const words = WORDS as (Word & {sent: number})[];
const wi = (i: number) => words[i].s;
const SENT = (TIMING as {sentences: {s: number; e: number}[]}).sentences;
export const BLACKOUT_DURATION_S = Math.round(TIMING.duration * FPS) / FPS;
const END = BLACKOUT_DURATION_S;
const NB = 17;
const T = {
  osboo3: wi(6), daas: wi(11), wala: wi(15), aadi: wi(18), mafeesh: wi(27), motor: wi(31), ashara: wi(39), makana: wi(47), visa: wi(50),
  tolomba: wi(57), baqiya: wi(66), nogoom: wi(76), domino: wi(85), twist: wi(98), sharar: wi(111), hayatak: wi(124), awel: wi(130), eb3ato: wi(138),
  fahman: 62.78, kasban: 63.53, // measured on vo.mp3 (timing.py onset check): الفهمان 62.78, كسبان 63.53, بروفة 42.90
};
const MYST: [number, number] = [SENT[11].e, SENT[12].s];
const B = (i: number) => (i === 0 ? 0 : SENT[i].s); // board i starts on its sentence
const boardAt = (t: number) => { let i = 0; for (let k = 0; k < NB; k++) if (t >= B(k)) i = k; return i; };
const BOARDS = [...BOARDS_17, makeLoop(END)];

// board-only darkness (the set never dims): beats 1-5 normal, phone a little dimmer, day 2 dimmer, day 3 / night drawn dark blue with
// candle light (+ a small extra), day 7 warm candle light, mystery dark, 1859 + today normal, CTA + ending = the frame-0 board
const DIM = [0, 0, 0, 0, 0, 0.1, 0.2, 0.2, 0.06, 0.06, 0.04, 0, 0, 0, 0, 0, 0];
const dimAt = (t: number) => {
  const i = boardAt(t), lt = t - B(i), prev = i > 0 ? DIM[i - 1] : DIM[0];
  return prev + (DIM[i] - prev) * clamp(lt / 0.35);
};

// ============================================================ character
const TALKABLE: Pose[] = ['hero', 'explain', 'point_up', 'thinking', 'temple', 'thumbs_up', 'worried'];
const POSES: PoseKey[] = [
  [0, 'hero'],                  // hook: raised eyebrows, half smile (shocked-lite)
  [T.osboo3, 'explain'],        // "أسبوع كامل؟"
  [SENT[1].s, 'thinking'],      // حمادة presses the switch… nothing
  [SENT[2].s, 'laughing'],      // "قال عادي…" (small, natural)
  [SENT[3].s, 'explain'],       // the tap
  [T.mafeesh, 'shocked'],       // "مفيش مية." (small)
  [SENT[4].s, 'point_up'],      // "ما هو موتور المية… شغال بالكهربا."
  [SENT[5].s, 'explain'],       // the phone
  [T.ashara, 'worried'],        // "عشرة في المية." (sweat drop)
  [SENT[6].s, 'explain'],       // day 2: the cash machine
  [SENT[7].s, 'thinking'],      // "والبنزينة؟"
  [T.tolomba, 'point_up'],      // "بس الطلمبة بالكهربا."
  [SENT[8].s, 'explain'],       // day 3: the freezer
  [T.baqiya, 'laughing'],       // "البقية في حياتك."
  [SENT[9].s, 'thinking'],      // night, the stars (hand on chin)
  [SENT[10].s, 'thumbs_up'],    // day 7: dominoes with the neighbours
  [SENT[11].s, 'thinking'],     // "بس تفتكر…؟" held through the mystery pause
  [SENT[12].s, 'explain'],      // "حصلت…"
  [T.twist, 'shocked'],         // TWIST exactly on "بروفة"
  [SENT[13].s, 'explain'],      // the solar storm
  [SENT[14].s, 'point_up'],     // "حياتك كلها على السلك ده."
  [SENT[15].s, 'explain'],      // CTA
  [T.eb3ato, 'point_up'],       // "وابعته…" (no point-down pose in the library: finger up + the bouncing ⬇ under the comment icon)
  [T.fahman, 'temple'],         // hand on temple exactly on "الفهمان" (+ wink on "كسبان")
];
const MOUTH = mouthStates((ENV as {level: number[]}).level);
const BLINKS = blinkTimes(END, 17);
const CS = 0.42; // = #14 v2
const CHAR_X = 540 - (CANVAS[0] * CS) / 2;
const CHAR_Y = DESK_SCREEN_Y - 1450 * CS;

// ============================================================ camera (2.5D) — framings = #14 v2
const SHAKES: [number, number, number][] = [[0.02, 4, 9], [T.wala, 3, 9], [T.mafeesh, 3, 9], [T.domino, 3, 10], [T.twist, 12, 7], [T.sharar, 5, 9], [T.fahman, 3, 10]];
const CAM0: Cam = {x: 520, y: 860, z: 180};
const BASE: Cam = {x: 512, y: 866, z: 125};
const NEAR: Cam = {x: 510, y: 850, z: 150};
const CAM_KEYS: CamKey[] = [
  [0, 1.0, {x: 516, y: 866, z: 150}],
  [SENT[1].s - 0.1, SENT[1].s + 0.4, BASE],
  [SENT[3].s - 0.05, SENT[3].s + 0.4, NEAR],                       // the tap
  [SENT[4].s - 0.1, SENT[4].s + 0.4, BASE],
  [SENT[6].s - 0.05, SENT[6].s + 0.4, NEAR],                       // day 2
  [SENT[7].s - 0.1, SENT[7].s + 0.4, BASE],
  [SENT[9].s - 0.05, SENT[9].s + 0.4, NEAR],                       // night, stars
  [SENT[10].s - 0.1, SENT[10].s + 0.4, BASE],
  [SENT[11].s - 0.1, MYST[1] - 0.02, {x: 512, y: 880, z: 200}],    // slow push on the question + the mystery pause
  [MYST[1] - 0.02, MYST[1] + 0.4, NEAR],
  [T.twist - 0.04, T.twist + 0.1, {x: 540, y: 900, z: 270}],       // TWIST punch-in exactly on "بروفة"
  [SENT[13].s - 0.15, SENT[13].s + 0.4, BASE],                     // eases out of the punch on the next line
  [SENT[15].s - 0.05, SENT[15].s + 0.4, NEAR],
  [T.fahman - 0.1, T.fahman + 0.5, CAM0],                          // ends on the opening framing (loop)
];

// ============================================================ captions: cards by hand (2-3 words), numbers as digits, key words coloured, ZERO tashkeel
const strip = (w: string) => w.replace(/[ً-ٰٟۖ-ۭ]/g, '');
const REP: Record<number, string | null> = {39: '١٠٪', 40: null, 41: null, 100: '١٨٥٩', 101: null, 102: null, 103: null, 143: '١٠٪', 144: null, 145: null};
const COL: Record<number, string> = {
  8: YELLOW, 15: RED, 16: RED, 19: YELLOW, 20: YELLOW, 27: RED, 28: RED, 39: RED, 49: RED, 50: YELLOW, 57: YELLOW, 61: RED, 62: RED,
  76: YELLOW, 85: YELLOW, 96: YELLOW, 98: RED, 100: RED, 111: RED, 116: YELLOW, 124: RED, 125: RED, 143: RED,
};
const CARDS: number[][] = [
  [8, 9, 10], [11, 12], [13, 14], [15, 16],
  [17, 18], [19, 20], [21, 22],
  [23, 24], [25, 26], [27, 28],
  [29, 30], [31, 32], [33, 34],
  [35, 36], [37, 38], [39, 40, 41],
  [42, 43], [44, 45, 46], [47, 48, 49], [50, 51, 52],
  [53], [54, 55], [56, 57, 58],
  [59, 60], [61, 62], [63, 64, 65], [66, 67, 68],
  [69], [70, 71, 72], [73, 74, 75], [76, 77, 78],
  [79, 80], [81, 82, 83], [84, 85], [86, 87], [88, 89, 90],
  [91, 92], [93, 94], [95, 96],
  [97, 98], [99, 100, 101, 102, 103],
  [104, 105, 106], [107, 108, 109], [110, 111], [112, 113, 114], [115, 116],
  [117, 118, 119], [120, 121, 122], [123], [124, 125], [126, 127, 128],
  [129, 130, 131], [132, 133], [134, 135, 136], [137], [138, 139], [140, 141, 142], [143, 144, 145],
  [146, 147],
];
const GROUPS: Group[] = (() => {
  const out: Group[] = [];
  // hook: caption 1 "لو الكهربا قطعت" from frame 0, caption 2 "عن الدنيا كلها… أسبوع كامل؟" on the onset of "عن"
  const O = wi(3);
  out.push({words: [{w: 'لو', s: 0, e: 0}, {w: 'الكهربا', s: 0, e: 0, c: YELLOW}, {w: 'قطعت', s: 0, e: 0}], s: 0, e: O, style: 'hook', fs: 132, x: 500, maxW: 820});
  out.push({words: [{w: 'عن', s: O, e: O}, {w: 'الدنيا', s: O, e: O, c: YELLOW}, {w: 'كلها…', s: O, e: O, c: YELLOW}, {w: 'أسبوع', s: O, e: O, c: RED}, {w: 'كامل؟', s: O, e: O, c: RED}], s: O, e: 0, style: 'hook', fs: 116, br: 3, x: 500, maxW: 820});
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
  for (let i = 8; i < words.length; i++) if (!used.has(i)) throw new Error(`word ${i} not in a card`);
  const last = out[out.length - 1];
  last.style = 'gold'; last.fs = 104; last.words[0].s = T.fahman; last.words[1].s = T.kasban; last.s = T.fahman;
  for (const g of out) if (g.style === undefined) g.fs = 92;
  out[0].s = 0; out[1].s = O;
  for (const g of out) for (const w of g.words) w.w = strip(w.w);
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
export const BLACKOUT_GROUPS = GROUPS;
void GOLD;
const CAP_Y = 1385; // = #14 v2

// ============================================================ board (= #14 v2: x 110, y 106, 820 x 910 on the character plane)
const BX = 110, BY = 106, BW = 820, BH = 910;
const INK = '#2d1c14';
const VIEW = {z: 1, cx: 540, cy: 600}; // board space 1080 x 1200 shown 1:1

// ============================================================ sound (SFX ~18 dB under the voice)
type Cue = [number, string, number];
const S = (n: string) => `blackout/sfx/${n}`;
const SFX: Cue[] = [
  ...[0.02, 0.32, 0.95, 1.25, 1.55, 2.05, 2.35].map((x, i): Cue => [x, S('clunk'), i ? 0.2 : 0.26]),
  [wi(2), S('fizzle'), 0.22], [wi(4), 'pop', 0.12], [wi(6) + 0.25, 'whoosh', 0.12],
  [T.daas, S('click'), 0.34], [T.wala, S('click'), 0.32], [T.wala + 0.22, S('click'), 0.3], [T.wala + 0.44, S('click'), 0.3],
  [wi(19) - 0.05, 'pop', 0.14], [wi(21) - 0.05, 'pop', 0.14],
  [wi(23) - 0.15, S('squeak'), 0.2], [wi(23) + 0.4, S('sputter'), 0.32], [T.mafeesh, 'pop', 0.12],
  [T.motor, S('hum'), 0.12], [wi(34), 'pop', 0.14],
  [T.ashara + 0.02, S('lowbatt'), 0.24], [T.ashara + 1.22, S('lowbatt'), 0.18],
  [wi(42), 'pop', 0.12], [T.makana, S('tapscreen'), 0.24], [T.makana + 0.45, S('deadbeep'), 0.26], [wi(51), 'pop', 0.12],
  [wi(54) + 0.3, 'ding', 0.12], [T.tolomba, 'pop', 0.14], [T.tolomba + 0.3, 'boing', 0.1],
  [wi(59), 'pop', 0.12], [wi(61) - 0.3, S('creak'), 0.18], [wi(62), S('drip'), 0.3], [T.baqiya, 'pop', 0.12],
  [SENT[9].s, S('crickets'), 0.22], [T.nogoom - 0.2, 'twinkle', 0.22], [T.nogoom + 0.4, 'sparkle', 0.14],
  [wi(79), 'pop', 0.12], [T.domino, S('clack'), 0.4], [wi(87), S('chuckle'), 0.2],
  [SENT[11].s, 'whoosh', 0.1],
  [T.twist - 0.02, 'stinger', 0.3], [T.twist + 0.02, S('flip'), 0.3], [wi(102), 'thud', 0.2], [wi(103), 'pop', 0.16],
  [wi(104) + 0.2, 'whoosh', 0.18], [T.sharar - 0.05, S('crackle'), 0.32], [wi(115), 'pop', 0.14],
  [wi(117), 'pop', 0.1], [wi(123), 'pop', 0.12], [T.hayatak - 0.05, S('hum'), 0.26],
  [T.awel, 'pop', 0.16], [T.eb3ato, 'whoosh', 0.16], [wi(141) + 0.1, 'pop', 0.14], [wi(143), S('lowbatt'), 0.16],
  [T.fahman - 0.15, 'swish', 0.2], [T.fahman, 'pop', 0.18], [T.kasban, 'twinkle', 0.32],
];
const BOARD_SWISH: Cue[] = SENT.slice(1).filter((_, i) => ![11, 12, 16].includes(i + 1)).map((s): Cue => [s.s - 0.08, 'whoosh', 0.08]);
const sfxFile = (n: string) => (n.includes('/') ? `elfahman/${n}.wav` : `elfahman/sfx/${n}.wav`);

// ============================================================ composition
export const Blackout: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const bi = boardAt(t);
  const b0 = B(bi), b1 = bi < NB - 1 ? B(bi + 1) : END;
  const lt = t - b0;
  const Board = BOARDS[bi];
  const bt = bi === 11 ? Math.min(lt, MYST[0] - b0) : lt; // the "؟" board holds still in the mystery pause except the pulse
  const noPush = [0, 11, 12, NB - 1];
  const cut = noPush.includes(bi) ? 1 : 1 + 0.04 * (1 - easeOut(clamp(lt / 0.25)));
  const cam0 = camAt(t, CAM0, CAM_KEYS);
  const sh = shakeAt(t, SHAKES);
  const cam: Cam = {x: cam0.x - sh.x, y: cam0.y - sh.y, z: cam0.z};
  const pose = poseAt(t, POSES);
  const squash = Math.max(squashAt(t, POSES), t > END - 0.07 ? Math.sin(((t - END + 0.07) / 0.07) * Math.PI / 2) : 0);
  const vf = Math.round(t * FPS);
  const talking = TALKABLE.includes(pose) && vf < MOUTH.length;
  const mouth = talking ? MOUTH[vf] : 0;
  const nod = pose === 'thumbs_up' ? Math.sin(clamp((t - SENT[10].s) / 0.5) * Math.PI * 2) * 8 : 0;
  const blink = BLINKS.some((b) => t >= b && t < b + 0.1) && pose !== 'shocked' && t > 0.3 && !(t > T.fahman - 0.2) && pose !== 'temple';
  const wink = pose === 'temple' && t >= T.kasban;
  const sweat = pose === 'worried';
  const myst = seg(t, SENT[11].s, MYST[0]) * (1 - seg(t, MYST[1] - 0.02, MYST[1] + 0.1));
  const sig = t >= T.twist - 0.02 && t < SENT[13].s ? 0.3 * easeOut(seg(t, T.twist - 0.02, T.twist + 0.12)) * (1 - seg(t, SENT[13].s - 0.3, SENT[13].s)) : 0;
  const ROOM = 0.06; // the study set stays normally lit the whole video (= the series' base level)
  const dim = dimAt(t);
  const ws = POSES.filter(([, p]) => p === 'worried').map(([k]) => k).filter((k) => k <= t).pop() ?? 0;
  return (
    <AbsoluteFill style={{backgroundColor: '#140e0b'}}>
      <Fonts />
      <SetBack cam={cam} dim={ROOM} />
      <Layer cam={cam} z={1000}>
        <div style={{position: 'absolute', left: BX - BW * 0.32, top: BY - BH * 0.48, width: BW * 1.64, height: BH * 1.96, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(255,233,176,0.18) 55%, rgba(255,233,176,0) 72%)'}} />
        <div style={{position: 'absolute', left: BX - 16, top: BY - 16, width: BW + 32, height: BH + 32, borderRadius: 26, background: '#8a5a33', border: `10px solid ${INK}`, boxSizing: 'border-box'}} />
        <div style={{position: 'absolute', left: BX, top: BY, width: BW, height: BH, borderRadius: 14, overflow: 'hidden', border: `6px solid ${INK}`, boxSizing: 'border-box', background: '#21302b'}}>
          <div style={{position: 'absolute', left: -6, top: -6, width: 1080, height: 1920, transformOrigin: '0 0',
            transform: `translate(${BW / 2}px, ${BH / 2}px) scale(${(BW * VIEW.z) / 1080}) translate(${-VIEW.cx}px, ${-VIEW.cy}px)`}}>
            <div style={{position: 'absolute', inset: 0, transformOrigin: `${VIEW.cx}px ${VIEW.cy}px`, transform: `scale(${cut})`}}>
              {bi === 11 ? <B12 t={bt} d={b1 - b0} b0={b0} tq={lt} /> : <Board t={bt} d={b1 - b0} b0={b0} />}
            </div>
          </div>
          <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse 62% 58% at 50% 42%, rgba(255,246,216,0.06) 0%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.22) 100%)`}} />
          {dim > 0 && <div style={{position: 'absolute', inset: 0, background: '#0b1020', opacity: dim}} />}
          {(sig > 0 || myst > 0) && <div style={{position: 'absolute', inset: 0, background: '#0b1210', opacity: (sig / 0.3) * 0.12 + myst * 0.15}} />}
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
      <SetFront cam={cam} dim={ROOM} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse 78% 62% at 50% 36%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.3) 100%)`}} />
      <Captions t={t} groups={GROUPS.slice(0, 2)} colors={{}} y={CAP_Y} x={500} />
      <Captions t={t} groups={GROUPS.slice(2)} colors={{}} y={CAP_Y} x={460} />
      <Audio src={staticFile('elfahman/blackout/vo/vo.mp3')} />
      <Audio src={staticFile('elfahman/blackout/music/bed.wav')} />
      {[...SFX, ...BOARD_SWISH].map(([tt, n, v], i) => (
        <Sequence key={i} from={Math.max(0, Math.round(tt * FPS))} durationInFrames={Math.round(3 * FPS)}>
          <Audio src={staticFile(sfxFile(n))} volume={v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
