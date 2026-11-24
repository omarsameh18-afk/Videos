import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Fonts} from '../lib/fonts';
import {FPS, clamp, easeInOut, easeOut, rand, seg} from '../lib/anim';
import {Cam, CamKey, Layer, camAt, shakeAt} from '../lib/camera';
import {SetBack, SetFront, DESK_SCREEN_Y} from '../lib/Set';
import {CANVAS, Character, HEAD, Pose, PoseKey, blinkTimes, mouthStates, poseAt, squashAt} from '../lib/Character';
import {Captions, Group, RED, YELLOW, Word, norm} from '../lib/Captions';
import {Sparkle, SweatDrop} from '../lib/fx';
import {BOARDS, Tea} from '../Boards13';
import WORDS from './phone.words.json';
import ENV from './phone.env.json';
import TIMING from './phone.timing.json';
import WW from './phone.wordw.json';

// Episode 13: "لو قفلت النت من موبايلك أسبوعين". ONE eleven_v4 take (voice XFkxnO6GgzVSxqEN2NVq, 989 credits), re-edited with
// tools/pace.py at 1.0x (silence only cut / digital silence added): sentence gaps ~0.38 s, commas ~0.17 s, hook and
// "استنى ده الغريب جاي!" in one go, 0.79 s mystery pause after "حصله إيه؟", 0.4 s tail. 16 full-frame boards drawn in code
// (../Boards13.tsx), 2.5D drift + parallax particles, timeline chips, the الفهمان cut-out library in the bottom 40%.

// ============================================================ timing
const words = WORDS as (Word & {sent: number})[];
const nq = (w: string) => norm(w).replace(/"/g, '');
const at = (w: string, nth = 0) => {
  const hits = words.map((x, i) => (nq(x.w) === nq(w) ? i : -1)).filter((i) => i >= 0);
  if (hits[nth] === undefined) throw new Error(`word not found: ${w} #${nth}`);
  return words[hits[nth]].s;
};
const SENT = (TIMING as {sentences: {s: number; e: number}[]}).sentences;
export const PHONE_DURATION_S = Math.round(TIMING.duration * FPS) / FPS;
const END = PHONE_DURATION_S;
const T = {
  osboo3en: at('أسبوعين'), alfalt: at('قفلت'), gebak: at('جيبك'), byrenn: at('بيرن'), saket: at('ساكت'), ashrat: at('عشرات'),
  wahid: at('الوحيد'), sa3teen: at('ساعتين'), tagroba: at('تجربة'), nezel: at('نزل'), a3adet: at('قعدت'), wesh: at('وش'),
  etmashet: at('اتمشت'), sab3a: at('سبعة'), ahsan: at('أحسن'), tab: at('طب'), hasalo: at('حصله'), tarkiz: at('تركيزهم'), asghar: at('أصغر'),
  maqdarush: at('مقدروش'), wa7ed: at('واحد'), ekteb: at('اكتب'), eb3at: at('وابعت'),
  estanna: 43.783, fahman: 64.366, kasban: 64.985, // measured audio onsets (timing.py / silencedetect), v2 voice
};
const MYST: [number, number] = [SENT[9].e, SENT[10].s];
const B = (i: number) => (i === 0 ? 0 : SENT[i].s); // board i starts on its sentence
const boardAt = (t: number) => { let i = 0; for (let k = 0; k < 16; k++) if (t >= B(k)) i = k; return i; };
// board events (seconds, absolute; converted to board-relative below)
const EV: Record<number, number[]> = {
  0: [T.alfalt], 1: [T.gebak, T.byrenn, T.saket], 3: [T.ashrat], 4: [T.wahid], 5: [T.sa3teen], 6: [T.tagroba, T.nezel],
  7: [T.a3adet, T.wesh, T.etmashet], 8: [T.sab3a], 9: [T.hasalo, MYST[0]], 11: [T.tarkiz, T.asghar], 12: [T.maqdarush],
  13: [T.wa7ed], 14: [T.ekteb, T.eb3at],
};

// ============================================================ character
const TALKABLE: Pose[] = ['hero', 'explain', 'point_up', 'thinking', 'temple', 'thumbs_up', 'worried'];
const POSES: PoseKey[] = [
  [0, 'hero'],                 // hook: raised-eyebrow smirk
  [SENT[1].s, 'explain'],      // "أول ساعة"
  [T.byrenn, 'worried'],       // the phantom ring (sweat drop)
  [SENT[2].s, 'explain'],      // "أول يوم": on / off / on / off
  [T.ashrat, 'point_up'],      // "عشرات المرات"
  [SENT[4].s, 'hero'],         // the ahwa: the only one looking up
  [SENT[5].s, 'explain'],      // spare time
  [T.sa3teen, 'point_up'],     // "+2:30"
  [SENT[6].s, 'explain'],      // a real experiment
  [T.etmashet, 'thumbs_up'],   // walked and moved more
  [SENT[8].s, 'explain'],      // mood meter
  [T.ahsan, 'thumbs_up'],      // "أحسن"
  [T.tab, 'thinking'],         // "طب والمخ نفسه… حصله إيه؟" held through the mystery pause
  [T.estanna, 'shocked'],      // signature exactly on "استنى"
  [SENT[11].s, 'point_up'],    // payoff: focus, 10 years younger
  [SENT[12].s, 'explain'],     // the bigger surprise
  [T.maqdarush, 'worried'],    // "مقدروش يكملوها"
  [SENT[13].s, 'explain'],     // 1 in 4
  [T.wa7ed, 'point_up'],       // "واحد بس"
  [SENT[14].s, 'explain'],     // comment question
  [T.fahman, 'temple'],        // hand on temple exactly on "الفهمان" (+ wink on "كسبان")
];
const MOUTH = mouthStates((ENV as {level: number[]}).level);
const BLINKS = blinkTimes(END, 13);
// series layout (identical to episode 11, Earth.tsx): he sits behind the desk of the study set
const CS = 0.6;
const CHAR_X = 540 - (CANVAS[0] * CS) / 2;
const CHAR_Y = DESK_SCREEN_Y - 1450 * CS;

// ============================================================ camera (2.5D)
const SHAKES: [number, number, number][] = [
  [T.alfalt, 5, 9], [T.gebak, 6, 9], [T.estanna, 18, 6], [T.asghar, 5, 9], [T.fahman, 3, 10],
];
// camera framings copied from episode 11 (CAM0 / BASE / NEAR / mystery push-in / "استنى" punch-in / comments / back to CAM0)
const CAM0: Cam = {x: 520, y: 860, z: 180};
const BASE: Cam = {x: 512, y: 866, z: 125};
const NEAR: Cam = {x: 510, y: 850, z: 150};
const CAM_KEYS: CamKey[] = [
  [0, 1.0, {x: 516, y: 866, z: 150}],
  [SENT[1].s - 0.1, SENT[1].s + 0.4, BASE],
  [SENT[3].s - 0.05, SENT[3].s + 0.4, NEAR],                       // proof: "عشرات المرات"
  [SENT[4].s - 0.1, SENT[4].s + 0.4, BASE],
  [T.sa3teen - 0.05, T.sa3teen + 0.4, NEAR],                       // "+2:30"
  [SENT[6].s - 0.1, SENT[6].s + 0.4, BASE],
  [SENT[8].s - 0.05, SENT[8].s + 0.4, NEAR],                       // mood board
  [T.tab - 0.2, MYST[1] - 0.02, {x: 512, y: 780, z: 215}],         // slow push-in on the question + mystery pause
  [T.estanna - 0.04, T.estanna + 0.1, {x: 540, y: 690, z: 280}],   // punch-in exactly on "استنى"
  [SENT[11].s - 0.1, SENT[11].s + 0.4, BASE],
  [SENT[12].s - 0.05, SENT[12].s + 0.4, NEAR],
  [SENT[13].s - 0.1, SENT[13].s + 0.4, BASE],
  [SENT[14].s - 0.1, SENT[14].s + 0.4, {x: 512, y: 868, z: 122}],
  [T.fahman - 0.1, T.fahman + 0.5, CAM0],                          // ends on the opening framing (loop)
];

// ============================================================ timeline chips (top)
const AR = {fontFamily: 'Cairo', fontWeight: 900, direction: 'rtl' as const};
const NODES = ['ساعة', 'يوم', 'كام يوم', 'أسبوعين'];
const NODE_OF = [-1, 0, 1, 1, 2, 2, 3, 3, 3, -2, -2, -2, -2, -2, -1, -1]; // -2 = hidden (mystery / payoff / twist)
const Timeline: React.FC<{node: number; t: number; since: number}> = ({node, t, since}) => {
  const x0 = 770, x1 = 90; // right-to-left, inside the board (860 wide)
  const xs = NODES.map((_, i) => x0 + ((x1 - x0) * i) / (NODES.length - 1));
  const prev = Math.max(0, node - 1);
  const fill = node < 0 ? x0 : xs[prev] + (xs[node] - xs[prev]) * easeInOut(seg(t, since, since + 0.4));
  return (
    <div style={{position: 'absolute', top: 0, left: 0, width: BW, height: STRIP, background: 'rgba(10,14,20,0.55)'}}>
      <svg width={BW} height={STRIP} style={{position: 'absolute'}}>
        <line x1={x0} y1={STRIP / 2} x2={x1} y2={STRIP / 2} stroke="rgba(255,255,255,0.25)" strokeWidth={8} strokeLinecap="round" />
        <line x1={x0} y1={STRIP / 2} x2={fill} y2={STRIP / 2} stroke={YELLOW} strokeWidth={8} strokeLinecap="round" />
      </svg>
      {xs.map((x, i) => {
        const on = i === node, done = i <= node;
        const sc = on ? 1 + 0.12 * Math.max(0, 1 - (t - since) / 0.3) : 0.9;
        return (
          <div key={i} style={{position: 'absolute', top: 0, height: STRIP, left: x - 80, width: 160, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <div style={{...AR, fontSize: 24, lineHeight: 1.35, padding: '0 14px 4px', borderRadius: 999, border: '3px solid #111', transform: `scale(${sc})`,
              background: on ? YELLOW : done ? '#FFF3C4' : 'rgba(255,255,255,0.85)', color: '#111', whiteSpace: 'nowrap'}}>{NODES[i]}</div>
          </div>
        );
      })}
    </div>
  );
};

// parallax particle layer per board (near plane: moves ~1.8x the board drift)
const PART: Record<number, 'dust' | 'gold' | 'bubbles' | null> = {
  0: 'dust', 1: 'dust', 2: 'dust', 3: 'dust', 4: 'dust', 5: 'gold', 6: 'dust', 7: null, 8: 'gold', 9: null, 10: null,
  11: 'gold', 12: 'dust', 13: 'dust', 14: 'dust', 15: 'gold',
};
const Particles: React.FC<{kind: string; t: number; dx: number; dy: number}> = ({kind, t, dx, dy}) => (
  <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
    {Array.from({length: 26}, (_, i) => {
      const r0 = rand(i * 3.7 + 1), r1 = rand(i * 9.1 + 2), r2 = rand(i * 5.3 + 3);
      const x = r0 * 1180 - 50 + dx * (1.4 + r2) + Math.sin(t * 0.6 + i) * 30, y = r1 * 1150 + dy * (1.4 + r2) + Math.cos(t * 0.5 + i * 2) * 30;
      const size = 3 + r2 * 5;
      return <circle key={i} cx={x} cy={y} r={size} fill={kind === 'gold' ? '#FFD23F' : '#FFF3C4'} opacity={kind === 'gold' ? 0.6 : 0.3} />;
    })}
  </svg>
);

// ============================================================ captions: 2-3 words, key words yellow / red, above his head
const KEY = ['أسبوعين', 'جيبك', 'بيرن', 'عشرات', 'القهوة', 'الوحيد', 'ساعتين', 'ونص', 'حقيقية', 'للنص', 'وش', 'لوش', 'سبعة', 'عشرة',
  'أحسن', 'والمخ', 'الغريب', 'تركيزهم', 'أصغر', 'عشر', 'سنين', 'المفاجأة', 'واحد', 'الرقم', 'الكومنتات', 'مخك', 'وابعت'];
const REDS = ['ساكت', 'مقدروش', 'يكملوها'];
const GROUPS: Group[] = (() => {
  const col = (w: string) => (REDS.some((k) => nq(w) === k) ? RED : KEY.some((k) => nq(w) === k) ? YELLOW : undefined);
  const ws = words.map((w): Word => ({w: w.w, s: w.s, e: w.e, ...(col(w.w) ? {c: col(w.w)} : {})}));
  const out: Group[] = [];
  // hook: caption 1 "لو قفلت نت موبايلك" from frame 0, caption 2 "أسبوعين… مخك هيحصله إيه؟" on the onset of "أسبوعين"
  const O = T.osboo3en;
  out.push({words: [{w: 'لو', s: 0, e: 0}, {w: 'قفلت', s: 0, e: 0, c: RED}, {w: 'نت', s: 0, e: 0}, {w: 'موبايلك', s: 0, e: 0}], s: 0, e: O, style: 'hook', fs: 140, br: 2, x: 540, maxW: 950});
  out.push({words: [{w: 'أسبوعين…', s: O, e: O, c: YELLOW}, {w: 'مخك', s: O, e: O, c: YELLOW}, {w: 'هيحصله', s: O, e: O}, {w: 'إيه؟', s: O, e: O}], s: O, e: 0, style: 'hook', fs: 118, br: 2, x: 540, maxW: 900});
  let cur: Word[] = [];
  const flush = () => { if (cur.length) out.push({words: cur, s: cur[0].s, e: cur[cur.length - 1].e}); cur = []; };
  ws.slice(10).forEach((w, k, arr) => {
    const sent = words[k + 10].sent, nxt = arr[k + 1] ? words[k + 11].sent : -1;
    if (cur.length && words[k + 9].sent !== sent) flush();
    cur.push(w);
    const end = /[.…!،:؟]$/.test(w.w) || nxt !== sent;
    const len = cur.reduce((a, x) => a + norm(x.w).length, 0);
    if (end || cur.length >= 3 || (cur.length >= 2 && len > 12)) flush();
  });
  flush();
  for (const g of out) if (g.words.every((w) => ['الفهمان', 'كسبان'].includes(nq(w.w)))) { g.style = 'gold'; g.fs = 118; }
  for (const g of out) if (g.style === undefined) g.fs = 96;
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
export const PHONE_GROUPS = GROUPS;
const CAP_Y = 1250; // episode 11 caption position (y 1250, x 460)

// ============================================================ board (episode 11 frame: x 80, y 84, 860 x 480 on the character plane)
// The beat drawings are made on a 1080-wide canvas; their content band (y SRC_Y .. SRC_Y + 603) fills the board under a thin
// timeline strip.
const BX = 80, BY = 84, BW = 860, BH = 480, STRIP = 58;
const BS = BW / 1080, SRC_Y = 250;
const INK = '#2d1c14';

// ============================================================ sound
type Cue = [number, string, number];
const SFX: Cue[] = [
  [T.alfalt, 'pop', 0.3], [T.alfalt, 'thud', 0.16],
  [SENT[1].s + 0.25, 'phone/sfx/buzz', 0.22], [T.gebak - 0.08, 'swish', 0.2], [T.byrenn, 'phone/sfx/buzz', 0.28], [T.saket + 0.15, 'pop', 0.12],
  ...Array.from({length: Math.floor((SENT[3].s - SENT[2].s) / 0.62)}, (_, i): Cue => [SENT[2].s + i * 0.62, 'phone/sfx/tap', 0.22]),
  [T.ashrat, 'ding', 0.18], [SENT[3].s + 0.15, 'whoosh', 0.14],
  [T.wahid, 'sparkle', 0.14], [T.sa3teen, 'pop', 0.22], [T.sa3teen + 0.05, 'twinkle', 0.16],
  [T.tagroba, 'phone/sfx/stamp', 0.4], [T.nezel, 'whoosh', 0.16], [T.nezel + 0.5, 'ding', 0.14],
  [T.a3adet, 'pop', 0.14], [T.wesh, 'pop', 0.14], [T.etmashet, 'step', 0.16],
  ...Array.from({length: 7}, (_, i): Cue => [T.sab3a + i * 0.22, 'pop', 0.11]),
  [T.hasalo, 'pop', 0.14], [T.estanna, 'stinger', 0.34],
  [T.tarkiz, 'sparkle', 0.2], [SENT[11].s + 0.9, 'swish', 0.14], [T.asghar, 'pop', 0.24], [T.asghar + 0.05, 'twinkle', 0.2],
  [T.maqdarush, 'boing', 0.12], ...[0.5, 0.9, 1.3].map((x): Cue => [SENT[13].s + x, 'thud', 0.14]), [T.wa7ed, 'ding', 0.2],
  [T.ekteb, 'pop', 0.14], [T.eb3at, 'swish', 0.18],
  [T.fahman - 0.15, 'swish', 0.22], [T.fahman, 'pop', 0.2], [T.kasban, 'twinkle', 0.34],
];
const BOARD_SWISH: Cue[] = SENT.slice(1).map((s): Cue => [s.s - 0.08, 'whoosh', 0.09]);
const sfxFile = (n: string) => (n.includes('/') ? `elfahman/${n}.wav` : `elfahman/sfx/${n}.wav`);

// ============================================================ composition
export const PhoneOff: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const bi = boardAt(t);
  const b0 = B(bi), b1 = bi < 15 ? B(bi + 1) : END;
  const lt = t - b0;
  const Board = BOARDS[bi];
  const ev = (EV[bi] ?? []).map((x) => x - b0);
  const bt = bi === 9 ? Math.min(lt, MYST[0] - b0) : lt; // mystery freeze: the board's own clock stops in the pause
  const cut = bi === 0 ? 1 : 1 + 0.04 * (1 - easeOut(clamp(lt / 0.25))); // small push on each new board
  const cam0 = camAt(t, CAM0, CAM_KEYS);
  const sh = shakeAt(t, SHAKES);
  const cam: Cam = {x: cam0.x - sh.x, y: cam0.y - sh.y, z: cam0.z};
  const pose = poseAt(t, POSES);
  const squash = Math.max(squashAt(t, POSES), t > END - 0.07 ? Math.sin(((t - END + 0.07) / 0.07) * Math.PI / 2) : 0);
  const vf = Math.round(t * FPS);
  const talking = TALKABLE.includes(pose) && vf < MOUTH.length;
  const mouth = talking ? MOUTH[vf] : 0;
  const blink = BLINKS.some((b) => t >= b && t < b + 0.1) && pose !== 'shocked' && t > 0.3 && !(t > T.fahman - 0.2);
  const wink = t >= T.kasban && pose === 'temple';
  const sweat = pose === 'worried';
  const myst = seg(t, T.hasalo, MYST[0]) * (1 - seg(t, MYST[1] - 0.02, MYST[1] + 0.1));
  const sig = t >= T.estanna - 0.02 && t < SENT[11].s ? 0.3 * easeOut(seg(t, T.estanna - 0.02, T.estanna + 0.12)) * (1 - seg(t, SENT[11].s - 0.3, SENT[11].s)) : 0;
  const ROOM = 0.06 + 0.22 * myst;
  const node = NODE_OF[bi];
  return (
    <AbsoluteFill style={{backgroundColor: '#140e0b'}}>
      <Fonts />
      <SetBack cam={cam} dim={ROOM + sig} />
      <Layer cam={cam} z={1000}>
        {/* the board on the wall (episode 11 frame and size); this video's drawings inside it */}
        <div style={{position: 'absolute', left: BX - BW * 0.32, top: BY - BH * 0.48, width: BW * 1.64, height: BH * 1.96, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(255,233,176,0.18) 55%, rgba(255,233,176,0) 72%)'}} />
        <div style={{position: 'absolute', left: BX - 16, top: BY - 16, width: BW + 32, height: BH + 32, borderRadius: 26, background: '#8a5a33', border: `10px solid ${INK}`, boxSizing: 'border-box'}} />
        <div style={{position: 'absolute', left: BX, top: BY, width: BW, height: BH, borderRadius: 14, overflow: 'hidden', border: `6px solid ${INK}`, boxSizing: 'border-box', background: '#21302b'}}>
          <div style={{position: 'absolute', left: -6, top: -6, width: 1080, height: 1920, transformOrigin: '0 0', transform: `scale(${BS}) translate(0px, ${-SRC_Y}px)`}}>
            <div style={{position: 'absolute', inset: 0, transformOrigin: `540px ${SRC_Y + 340}px`, transform: `scale(${cut})`}}>
              <Board t={bt} d={b1 - b0} ev={ev} />
            </div>
          </div>
          {node > -2 && <Timeline node={node} t={t} since={b0} />}
          <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse 62% 58% at 50% 42%, rgba(255,246,216,0.06) 0%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.28) 100%)`}} />
          {(sig > 0 || myst > 0) && <div style={{position: 'absolute', inset: 0, background: '#0b1210', opacity: (sig / 0.3) * 0.32 * 0.8 + myst * 0.25}} />}
        </div>
        <Character pose={pose} mouth={mouth} blink={blink} wink={wink} x={CHAR_X} y={CHAR_Y} scale={CS} squash={squash} t={t}>
          <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
            {wink && <Sparkle x={HEAD[0] + 210} y={HEAD[1] - 40} dt={t - T.kasban} r={48} />}
            {sweat && [0, 1, 2].map((i) => {
              const ws = POSES.filter(([, p]) => p === 'worried').map(([k]) => k).filter((k) => k <= t).pop() ?? 0;
              return <SweatDrop key={i} x={HEAD[0] + (i % 2 ? 230 : -220)} y={HEAD[1] - 170} dt={t - (ws + 0.15 + i * 0.95)} s={0.9} />;
            })}
          </svg>
        </Character>
      </Layer>
      <SetFront cam={cam} dim={ROOM + sig} />
      {/* the ahwa beat: a tea glass on his desk */}
      {bi === 4 && <Layer cam={cam} z={1000}><svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}><Tea x={860} y={DESK_SCREEN_Y + 34} s={0.85} t={t} /></svg></Layer>}
      <AbsoluteFill style={{background: `radial-gradient(ellipse 78% 62% at 50% 36%, rgba(0,0,0,0) 52%, rgba(0,0,0,${0.3 + sig * 0.6 + myst * 0.2}) 100%)`}} />
      <Captions t={t} groups={GROUPS.slice(0, 2)} colors={{}} y={CAP_Y} x={540} />
      <Captions t={t} groups={GROUPS.slice(2)} colors={{}} y={CAP_Y} x={460} />
      <Audio src={staticFile('elfahman/phone/vo/vo.wav')} />
      <Audio src={staticFile('elfahman/phone/music/bed.wav')} />
      <Audio src={staticFile('elfahman/phone/music/hits.wav')} />
      <Sequence from={Math.round(T.estanna * FPS)} durationInFrames={Math.round(0.6 * FPS)}><Audio src={staticFile('elfahman/phone/music/scratch.wav')} volume={0.7} /></Sequence>
      {[...SFX, ...BOARD_SWISH].map(([tt, n, v], i) => (
        <Sequence key={i} from={Math.max(0, Math.round(tt * FPS))} durationInFrames={Math.round(2 * FPS)}>
          <Audio src={staticFile(sfxFile(n))} volume={v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
