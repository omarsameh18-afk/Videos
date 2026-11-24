import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Fonts} from '../lib/fonts';
import {FPS, clamp, easeInOut, easeOut, rand, seg} from '../lib/anim';
import {shakeAt} from '../lib/camera';
import {Character, HEAD, Pose, PoseKey, blinkTimes, mouthStates, poseAt, squashAt} from '../lib/Character';
import {Captions, Group, RED, YELLOW, Word, norm} from '../lib/Captions';
import {Sparkle, SweatDrop} from '../lib/fx';
import {BOARDS} from '../Boards13';
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
  estanna: 43.573, fahman: 64.482, kasban: 65.117, // measured audio onsets (timing.py / silencedetect)
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
const CS = 0.56;
const CHAR_X = 30;
const CHAR_Y = 1150 - 21 * CS; // top of his hair at y ~1150: he fills the bottom 40%, body runs off the bottom edge
const HEAD_SCREEN = {x: CHAR_X + HEAD[0] * CS, y: CHAR_Y + HEAD[1] * CS};

// ============================================================ camera (2.5D)
const SHAKES: [number, number, number][] = [
  [T.alfalt, 5, 9], [T.gebak, 6, 9], [T.estanna, 18, 6], [T.asghar, 5, 9], [T.fahman, 3, 10],
];
const punchAt = (t: number) => (t >= T.estanna - 0.04 && t < SENT[11].s ? easeOut(seg(t, T.estanna - 0.04, T.estanna + 0.1)) * (1 - seg(t, SENT[11].s - 0.25, SENT[11].s)) : 0);

// ============================================================ timeline chips (top)
const AR = {fontFamily: 'Cairo', fontWeight: 900, direction: 'rtl' as const};
const NODES = ['ساعة', 'يوم', 'كام يوم', 'أسبوعين'];
const NODE_OF = [-1, 0, 1, 1, 2, 2, 3, 3, 3, -2, -2, -2, -2, -2, -1, -1]; // -2 = hidden (mystery / payoff / twist)
const Timeline: React.FC<{node: number; t: number; since: number}> = ({node, t, since}) => {
  const x0 = 860, x1 = 220;
  const xs = NODES.map((_, i) => x0 + ((x1 - x0) * i) / (NODES.length - 1));
  const prev = Math.max(0, node - 1);
  const fill = node < 0 ? x0 : xs[prev] + (xs[node] - xs[prev]) * easeInOut(seg(t, since, since + 0.4));
  return (
    <div style={{position: 'absolute', top: 150, left: 0, width: 1080, height: 150}}>
      <svg width={1080} height={150} style={{position: 'absolute'}}>
        <line x1={x0} y1={40} x2={x1} y2={40} stroke="rgba(0,0,0,0.55)" strokeWidth={16} strokeLinecap="round" />
        <line x1={x0} y1={40} x2={fill} y2={40} stroke={YELLOW} strokeWidth={10} strokeLinecap="round" />
        {xs.map((x, i) => <circle key={i} cx={x} cy={40} r={i === node ? 18 + Math.sin(t * 10) * 3 : 12} fill={i <= node ? YELLOW : '#555'} stroke="#111" strokeWidth={5} />)}
      </svg>
      {xs.map((x, i) => {
        const on = i === node, done = i <= node;
        const s = on ? 1 + 0.12 * Math.max(0, 1 - (t - since) / 0.3) : 0.86;
        return (
          <div key={i} style={{position: 'absolute', top: 66, left: x - 110, width: 220, display: 'flex', justifyContent: 'center'}}>
            <div style={{...AR, fontSize: 36, lineHeight: 1.35, padding: '0 18px 6px', borderRadius: 999, border: '4px solid #111', transform: `scale(${s})`,
              background: on ? YELLOW : done ? '#FFF3C4' : 'rgba(255,255,255,0.85)', color: '#111', boxShadow: '0 5px 0 #111', whiteSpace: 'nowrap'}}>{NODES[i]}</div>
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
  out.push({words: [{w: 'لو', s: 0, e: 0}, {w: 'قفلت', s: 0, e: 0, c: RED}, {w: 'نت', s: 0, e: 0}, {w: 'موبايلك', s: 0, e: 0}], s: 0, e: O, style: 'hook', fs: 140, br: 2, x: 470, maxW: 860});
  out.push({words: [{w: 'أسبوعين…', s: O, e: O, c: YELLOW}, {w: 'مخك', s: O, e: O, c: YELLOW}, {w: 'هيحصله', s: O, e: O}, {w: 'إيه؟', s: O, e: O}], s: O, e: 0, style: 'hook', fs: 118, br: 2, x: 470, maxW: 860});
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
  for (const g of out) if (g.words.every((w) => ['الفهمان', 'كسبان'].includes(nq(w.w)))) { g.style = 'gold'; g.fs = 120; }
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
export const PHONE_GROUPS = GROUPS;
const CAP_Y = 1055;

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
  // mystery freeze: the board's own clock stops in the pause
  const bt = bi === 9 ? Math.min(lt, MYST[0] - b0) : lt;
  // camera: cut punch (1.05 -> 1) + slow drift that returns to rest at the loop point; particles drift ~1.8x (parallax)
  const cut = bi === 0 ? 1 : 1 + 0.05 * (1 - easeOut(clamp(lt / 0.25)));
  const drift = 1 + Math.min(lt, 4) * 0.006 * (bi === 15 ? 1 - seg(t, END - 0.6, END) : 1) * (bi === 0 ? 0 : 1);
  const loopU = (2 * Math.PI * t) / END;
  const panX = Math.sin(loopU * 5) * 12, panY = Math.sin(loopU * 4) * 9;
  const sh = shakeAt(t, SHAKES);
  const punch = punchAt(t);
  const zoom = 1 + 0.22 * punch;
  const pose = poseAt(t, POSES);
  const squash = Math.max(squashAt(t, POSES), t > END - 0.07 ? Math.sin(((t - END + 0.07) / 0.07) * Math.PI / 2) : 0);
  const vf = Math.round(t * FPS);
  const talking = TALKABLE.includes(pose) && vf < MOUTH.length;
  const mouth = talking ? MOUTH[vf] : 0;
  const blink = BLINKS.some((b) => t >= b && t < b + 0.1) && pose !== 'shocked' && t > 0.3 && !(t > T.fahman - 0.2);
  const wink = t >= T.kasban && pose === 'temple';
  const sweat = pose === 'worried';
  const myst = seg(t, T.hasalo, MYST[0]) * (1 - seg(t, MYST[1] - 0.02, MYST[1] + 0.1));
  const part = PART[bi];
  const node = NODE_OF[bi];
  return (
    <AbsoluteFill style={{backgroundColor: '#0B0E1C'}}>
      <Fonts />
      {/* far plane: the board */}
      <AbsoluteFill style={{transformOrigin: `${HEAD_SCREEN.x}px ${HEAD_SCREEN.y}px`, transform: `scale(${zoom})`}}>
        <AbsoluteFill style={{transform: `translate(${panX + sh.x * 0.6}px, ${panY + sh.y * 0.6}px) scale(${cut * drift * 1.03})`}}>
          <Board t={bt} d={b1 - b0} ev={ev} />
        </AbsoluteFill>
        {part && <Particles kind={part} t={t} dx={panX * 1.8} dy={panY * 1.8} />}
        <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 62% at 50% 40%, rgba(0,0,0,0) 55%, rgba(0,0,0,${0.28 + 0.35 * myst + 0.25 * punch}) 100%)`}} />
        {/* near plane: الفهمان */}
        <div style={{position: 'absolute', inset: 0, transform: `translate(${sh.x}px, ${sh.y}px)`}}>
          <div style={{position: 'absolute', left: CHAR_X + 40, top: 1520, width: 680, height: 420, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(0,0,0,0.45), rgba(0,0,0,0) 70%)'}} />
          <Character pose={pose} mouth={mouth} blink={blink} wink={wink} x={CHAR_X} y={CHAR_Y} scale={CS} squash={squash} t={t}>
            <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
              {wink && <Sparkle x={HEAD[0] + 230} y={HEAD[1] - 60} dt={t - T.kasban} r={56} />}
              {sweat && [0, 1, 2].map((i) => {
                const ws = POSES.filter(([, p]) => p === 'worried').map(([k]) => k).filter((k) => k <= t).pop() ?? 0;
                return <SweatDrop key={i} x={HEAD[0] + (i % 2 ? 250 : -240)} y={HEAD[1] - 170} dt={t - (ws + 0.15 + i * 0.95)} s={1} />;
              })}
            </svg>
          </Character>
        </div>
      </AbsoluteFill>
      {/* UI plane (no camera): timeline chips + captions */}
      {node > -2 && <Timeline node={node} t={t} since={b0} />}
      <Captions t={t} groups={GROUPS.slice(0, 2)} colors={{}} y={930} x={470} />
      <Captions t={t} groups={GROUPS.slice(2)} colors={{}} y={CAP_Y} x={460} />
      <Audio src={staticFile('elfahman/phone/vo/vo.mp3')} />
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
