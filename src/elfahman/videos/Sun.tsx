import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Fonts} from '../lib/fonts';
import {FPS, clamp, easeInOut, easeOut, popIn, rand, seg} from '../lib/anim';
import {shakeAt} from '../lib/camera';
import {CANVAS, Character, HEAD, Pose, PoseKey, blinkTimes, mouthStates, poseAt, squashAt} from '../lib/Character';
import {Captions, Group, RED, YELLOW, Word, norm} from '../lib/Captions';
import {Sparkle, SweatDrop} from '../lib/fx';
import {BOARDS} from '../Boards';
import WORDS from './sun.words.json';
import ENV from './sun.env.json';
import TIMING from './sun.timing.json';
import WW from './sun.wordw.json';

// Episode 12 v2: "لو الشمس اختفت". Same voice recording as v1 (16 eleven_v4 sentences), re-edited with
// scripts/elfahman/assemble_voice_v2.py: 1.0x, silence only cut (sentence gaps ~0.35 s, commas <= 0.15 s, hook and
// "استنى ده الغريب جاي!" in one go, 0.8 s mystery pause after "خالص؟", ~0.4 s tail). 0 new credits.
// 16 full-frame boards drawn in code (../Boards.tsx, one per sentence, driven in 30 fps units), 2.5D drift + parallax
// particles, time chip + timeline bar, the الفهمان cut-out library big in the bottom 40% (centred-left), captions above his head.

// ============================================================ timing
const words = WORDS as (Word & {sent: number})[];
const nq = (w: string) => norm(w).replace(/"/g, '');
const at = (w: string, nth = 0) => {
  const hits = words.map((x, i) => (nq(x.w) === nq(w) ? i : -1)).filter((i) => i >= 0);
  if (hits[nth] === undefined) throw new Error(`word not found: ${w} #${nth}`);
  return words[hits[nth]].s;
};
const SENT = (TIMING as {sentences: {s: number; e: number}[]}).sentences;
export const SUN_DURATION_S = Math.round(TIMING.duration * FPS) / FPS;
const END = SUN_DURATION_S;
const T = {
  mesh: at('مش'), donya: at('الدنيا'), amar: at('والقمر'), ard: at('الأرض'), hatetla3: at('وهتطلع'), khat: at('خط'),
  hayefdal: at('هيفضل'), tab: at('طب'), khalas: at('خلصت'), estanna: at('استنى'), hayedaffeeha: at('هيدفّيها'), ka2enat: at('كائنات'),
  momken: at('ممكن'), ekteb: at('اكتبهالي'),
  fahman: 64.39, kasban: 65.04, // measured onsets (lip level dip in vo.wav)
};
const MYST: [number, number] = [SENT[9].e, SENT[10].s];
const B = (i: number) => (i === 0 ? 0 : SENT[i].s); // board i starts on its sentence
const boardAt = (t: number) => { let i = 0; for (let k = 0; k < 16; k++) if (t >= B(k)) i = k; return i; };
// board events (30 fps units, relative to the board start) — same meaning as v1
const EV: Record<number, number[]> = {
  1: [0, T.donya, T.amar], 3: [0, T.ard, 0, T.khat], 11: [T.hayedaffeeha], 13: [0, T.momken],
};

// ============================================================ character
const TALKABLE: Pose[] = ['hero', 'explain', 'point_up', 'thinking', 'temple', 'thumbs_up', 'worried'];
const POSES: PoseKey[] = [
  [0, 'hero'],                 // hook: relaxed smirk
  [T.donya, 'shocked'],        // the sky snaps black
  [SENT[2].s, 'explain'],      // light takes 8 minutes
  [SENT[3].s, 'explain'],      // the Earth flies off straight
  [SENT[4].s, 'worried'],      // plants die
  [SENT[5].s, 'worried'],      // below zero (sweat)
  [SENT[6].s, 'explain'],      // the seas freeze
  [SENT[7].s, 'shocked'],      // -70, the Nile is ice
  [SENT[8].s, 'explain'],      // big trees: storage
  [T.tab, 'thinking'],         // "خلصت خالص؟" held through the mystery pause
  [T.estanna, 'shocked'],      // signature exactly on "استنى"
  [SENT[11].s, 'explain'],     // the ice keeps the water warm
  [SENT[12].s, 'point_up'],    // ocean floor payoff
  [SENT[14].s, 'explain'],     // comment question
  [T.fahman, 'temple'],        // hand on temple exactly on "الفهمان" (+ wink on "كسبان")
];
const MOUTH = mouthStates((ENV as {level: number[]}).level);
const BLINKS = blinkTimes(END, 12);
const CS = 0.56;
const CHAR_X = 30;
const CHAR_Y = 1150 - 21 * CS; // top of his hair at y ~1150: he fills the bottom 40%, body runs off the bottom edge
const HEAD_SCREEN = {x: CHAR_X + HEAD[0] * CS, y: CHAR_Y + HEAD[1] * CS};

// ============================================================ camera (2.5D): board drifts slowly, particles drift faster
const SHAKES: [number, number, number][] = [
  [T.donya, 14, 6], [T.ard, 4, 9], [SENT[7].s, 6, 8], [T.estanna, 18, 6], [SENT[12].s, 3, 10], [T.fahman, 3, 10],
];
const punchAt = (t: number) => (t >= T.estanna - 0.04 && t < SENT[11].s ? easeOut(seg(t, T.estanna - 0.04, T.estanna + 0.1)) * (1 - seg(t, SENT[11].s - 0.25, SENT[11].s)) : 0);

// ============================================================ overlays: timeline + time chip (from video #7 / v1)
const AR = {fontFamily: 'Cairo', fontWeight: 900, direction: 'rtl' as const};
const NODES = ['دلوقتي', '٨ دقايق', 'أيام', 'أسبوع', 'شهور', 'سنة', 'آلاف السنين'];
const NODE_OF = [0, 1, 1, 1, 2, 3, 4, 5, 5, 5, 5, 6, 6, 6, 0, 0];
const CHIP = ['cd', 'بعد ٨ دقايق', 'ليه ٨ دقايق؟', 'في نفس اللحظة', 'بعد كام يوم', 'بعد أسبوع', 'بعد كام شهر', 'بعد سنة', 'عشرات السنين', '', '', 'آلاف السنين', 'قاع المحيط', '', 'cd', ''];
const countdown = (s: number) => { const sec = Math.max(0, 480 - Math.floor(s)); return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; };
const Timeline: React.FC<{node: number; t: number; since: number}> = ({node, t, since}) => {
  const x0 = 880, x1 = 90;
  const xs = NODES.map((_, i) => x0 + ((x1 - x0) * i) / (NODES.length - 1));
  const prev = Math.max(0, node - 1);
  const fill = node === 0 ? x0 : xs[prev] + (xs[node] - xs[prev]) * easeInOut(seg(t, since, since + 0.4));
  return (
    <div style={{position: 'absolute', top: 150, left: 0, width: 1080, height: 120}}>
      <svg width={1080} height={120}>
        <line x1={x0} y1={40} x2={x1} y2={40} stroke="rgba(0,0,0,0.55)" strokeWidth={16} strokeLinecap="round" />
        <line x1={x0} y1={40} x2={fill} y2={40} stroke={YELLOW} strokeWidth={10} strokeLinecap="round" />
        {xs.map((x, i) => <circle key={i} cx={x} cy={40} r={i === node ? 20 + Math.sin(t * 10) * 3 : 12} fill={i <= node ? YELLOW : '#555'} stroke="#111" strokeWidth={5} />)}
      </svg>
      <div style={{position: 'absolute', top: 64, left: Math.max(10, Math.min(1070 - 300, xs[node] - 150)), width: 300, textAlign: 'center', ...AR, fontSize: 36, color: '#fff', textShadow: '0 3px 6px #000, 0 0 3px #000'}}>{NODES[node]}</div>
    </div>
  );
};
const Chip: React.FC<{text: string; dt: number; still: boolean; spin: number}> = ({text, dt, still, spin}) => {
  const s = still ? 1 : popIn(dt, 0.26);
  return (
    <div style={{position: 'absolute', top: 290, left: 0, right: 130, display: 'flex', justifyContent: 'center'}}>
      <div style={{...AR, transform: `scale(${s})`, fontSize: 62, color: '#111', background: YELLOW, padding: '2px 36px 10px', borderRadius: 999, border: '6px solid #111', boxShadow: '0 10px 0 #111', display: 'flex', gap: 18, alignItems: 'center'}}>
        <svg width={56} height={56} viewBox="-30 -30 60 60" style={{marginTop: 8}}>
          <circle r={25} fill="#fff" stroke="#111" strokeWidth={5} />
          <line x1={0} y1={0} x2={Math.sin(spin) * 17} y2={-Math.cos(spin) * 17} stroke="#111" strokeWidth={5} strokeLinecap="round" />
          <line x1={0} y1={0} x2={Math.sin(spin / 12) * 11} y2={-Math.cos(spin / 12) * 11} stroke={RED} strokeWidth={5} strokeLinecap="round" />
        </svg>
        <span>{text}</span>
      </div>
    </div>
  );
};

// parallax particle layer per board (near plane: moves ~1.8x the board drift)
const PART: Record<number, 'dust' | 'stars' | 'snow' | 'bubbles' | 'gold' | null> = {
  0: 'dust', 1: 'stars', 2: 'stars', 3: 'stars', 4: 'stars', 5: 'snow', 6: 'snow', 7: 'snow', 8: 'snow', 9: 'snow', 10: null,
  11: 'bubbles', 12: 'bubbles', 13: 'bubbles', 14: 'dust', 15: 'gold',
};
const Particles: React.FC<{kind: string; t: number; dx: number; dy: number}> = ({kind, t, dx, dy}) => (
  <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
    {Array.from({length: kind === 'snow' ? 46 : 28}, (_, i) => {
      const r0 = rand(i * 3.7 + 1), r1 = rand(i * 9.1 + 2), r2 = rand(i * 5.3 + 3);
      let x = r0 * 1180 - 50 + dx * (1.4 + r2), y = r1 * 1920 + dy * (1.4 + r2);
      if (kind === 'snow') { y = ((r1 * 1920 + t * (60 + r2 * 80)) % 2000) - 40; x += Math.sin(t * 1.3 + i) * 20; }
      if (kind === 'bubbles') y = 1960 - ((r1 * 1920 + t * (70 + r2 * 90)) % 2000);
      if (kind === 'dust' || kind === 'gold') { x += Math.sin(t * 0.6 + i) * 30; y += Math.cos(t * 0.5 + i * 2) * 30; }
      const size = kind === 'stars' ? 1.5 + r2 * 3.5 : kind === 'snow' ? 4 + r2 * 7 : kind === 'bubbles' ? 5 + r2 * 9 : 3 + r2 * 5;
      const fill = kind === 'gold' ? '#FFD23F' : kind === 'bubbles' ? 'none' : kind === 'dust' ? '#FFF3C4' : '#fff';
      const op = kind === 'stars' ? 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i)) : kind === 'dust' ? 0.35 : 0.75;
      return <circle key={i} cx={x} cy={y} r={size} fill={fill} stroke={kind === 'bubbles' ? '#BFE6FF' : 'none'} strokeWidth={3} opacity={op} />;
    })}
  </svg>
);

// ============================================================ captions: 2-3 words, key words yellow, above his head
const KEY = ['اختفت', 'هتضلم', 'هيختفي', 'دقايق', 'مستقيم', 'يموت', 'الصفر', 'تتجمد', 'سبعين', 'تلج', 'المخزن', 'عشرات', 'خالص',
  'الغريب', 'سايلة', 'البطانية', 'براكين', 'المحيط', 'الكومنتات', 'آلاف', 'الشمس'];
const GROUPS: Group[] = (() => {
  const ws = words.map((w): Word => ({w: w.w, s: w.s, e: w.e, ...(KEY.some((k) => nq(w.w).includes(k)) ? {c: YELLOW} : {})}));
  const out: Group[] = [];
  // hook: caption 1 "لو الشمس اختفت" from frame 0 (words 0-3 spoken), caption 2 "مش هتحس ٨ دقايق!" on the onset of "مش"
  out.push({words: [{w: 'لو', s: 0, e: 0}, {w: 'الشمس', s: 0, e: 0, c: YELLOW}, {w: 'اختفت', s: 0, e: 0, c: YELLOW}], s: 0, e: T.mesh, style: 'hook', fs: 150, br: 2, x: 470, maxW: 860});
  out.push({words: [{w: 'مش', s: T.mesh, e: T.mesh}, {w: 'هتحس', s: T.mesh, e: T.mesh}, {w: '٨', s: T.mesh, e: T.mesh, c: YELLOW}, {w: 'دقايق!', s: T.mesh, e: T.mesh, c: YELLOW}], s: T.mesh, e: 0, style: 'hook', fs: 128, br: 2, x: 470, maxW: 860});
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
  out[0].s = 0; out[1].s = T.mesh;
  // real widths (Cairo Black at 100 px, scripts/elfahman/wordwidths.mjs) so no card runs off the frame
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
const CAP_Y = 1055;

// ============================================================ sound
type Cue = [number, string, number];
const SFX: Cue[] = [
  [0, 'sparkle', 0.12], [T.donya - 0.05, 'thud', 0.34], [T.donya, 'tremble', 0.14], [T.amar + 0.3, 'twinkle', 0.12],
  [SENT[3].s + 0.3, 'whoosh', 0.14], [T.ard + 0.3, 'whoosh', 0.18], [SENT[5].s + 0.4, 'sun/sfx/crack', 0.2], [SENT[6].s + 1.2, 'sun/sfx/crack', 0.22],
  [SENT[7].s, 'thud', 0.2], [SENT[8].s + 0.5, 'pop', 0.14], [T.tab, 'pop', 0.12], [T.estanna, 'stinger', 0.34],
  [T.hayedaffeeha, 'pop', 0.16], [SENT[12].s, 'bubbles', 0.2], [T.ka2enat, 'sparkle', 0.16], [T.momken, 'swish', 0.14],
  [T.ekteb, 'boing', 0.14], [T.fahman - 0.15, 'swish', 0.22], [T.fahman, 'pop', 0.2], [T.kasban, 'twinkle', 0.34],
  ...Array.from({length: 6}, (_, i): Cue => [0.2 + i, 'sun/sfx/tick', 0.08]),
];
const BOARD_SWISH: Cue[] = SENT.slice(1).map((s): Cue => [s.s - 0.08, 'whoosh', 0.1]);
const CHIP_POP: Cue[] = CHIP.map((c, i): Cue | null => (c && i > 0 ? [B(i) + 0.02, 'pop', 0.12] : null)).filter(Boolean) as Cue[];
const sfxFile = (n: string) => (n.includes('/') ? `elfahman/${n}.wav` : `elfahman/sfx/${n}.wav`);

// ============================================================ composition
export const Sun: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const bi = boardAt(t);
  const b0 = B(bi), b1 = bi < 15 ? B(bi + 1) : END;
  const lt = t - b0;
  const Board = BOARDS[bi];
  const ev = (EV[bi] ?? []).map((x) => (x === 0 ? 0 : (x - b0) * 30));
  // camera: cut punch (1.06 -> 1) + slow drift; particles drift ~1.8x (parallax); "استنى" punch-in toward his face
  const cut = 1 + 0.06 * (1 - easeOut(clamp(lt / 0.25)));
  const drift = 1 + lt * 0.006;
  const panX = Math.sin(t * 0.21) * 14, panY = Math.cos(t * 0.17) * 10;
  const sh = shakeAt(t, SHAKES);
  const punch = punchAt(t);
  const zoom = 1 + 0.22 * punch;
  const pose = poseAt(t, POSES);
  const squash = Math.max(squashAt(t, POSES), t > END - 0.07 ? Math.sin(((t - END + 0.07) / 0.07) * Math.PI / 2) : 0);
  const vf = Math.round(t * FPS);
  const talking = TALKABLE.includes(pose) && vf < MOUTH.length;
  const mouth = talking ? MOUTH[vf] : 0;
  const blink = BLINKS.some((b) => t >= b && t < b + 0.1) && pose !== 'shocked' && t > 0.3;
  const wink = t >= T.kasban && pose === 'temple';
  const sweat = bi === 5 && pose === 'worried';
  const myst = seg(t, T.khalas, MYST[0]) * (1 - seg(t, MYST[1] - 0.02, MYST[1] + 0.1));
  const chip = CHIP[bi];
  const part = PART[bi];
  return (
    <AbsoluteFill style={{backgroundColor: '#05060C'}}>
      <Fonts />
      {/* far plane: the board */}
      <AbsoluteFill style={{transformOrigin: `${HEAD_SCREEN.x}px ${HEAD_SCREEN.y}px`, transform: `scale(${zoom})`}}>
        <AbsoluteFill style={{transform: `translate(${panX + sh.x * 0.6}px, ${panY + sh.y * 0.6}px) scale(${cut * drift})`}}>
          <Board f={lt * 30} d={(b1 - b0) * 30} ev={ev} fps={30} />
        </AbsoluteFill>
        {part && <Particles kind={part} t={t} dx={panX * 1.8} dy={panY * 1.8} />}
        <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 62% at 50% 40%, rgba(0,0,0,0) 55%, rgba(0,0,0,${0.32 + 0.3 * myst + 0.25 * punch}) 100%)`}} />
        {/* near plane: الفهمان */}
        <div style={{position: 'absolute', inset: 0, transform: `translate(${sh.x}px, ${sh.y}px)`}}>
          <div style={{position: 'absolute', left: CHAR_X + 40, top: 1520, width: 680, height: 420, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(0,0,0,0.45), rgba(0,0,0,0) 70%)'}} />
          <Character pose={pose} mouth={mouth} blink={blink} wink={wink} x={CHAR_X} y={CHAR_Y} scale={CS} squash={squash} t={t}>
            <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
              {wink && <Sparkle x={HEAD[0] + 230} y={HEAD[1] - 60} dt={t - T.kasban} r={56} />}
              {sweat && [0, 1, 2, 3, 4].map((i) => <SweatDrop key={i} x={HEAD[0] + (i % 2 ? 250 : -240)} y={HEAD[1] - 170} dt={t - (b0 + 0.3 + i * 0.95)} s={1} />)}
            </svg>
          </Character>
        </div>
      </AbsoluteFill>
      {/* UI plane (no camera): timeline, chip, captions */}
      {bi < 15 && <Timeline node={NODE_OF[bi]} t={t} since={b0} />}
      {chip && <Chip key={bi} text={chip === 'cd' ? countdown(bi === 0 ? t : lt) : chip} dt={lt} still={bi === 0} spin={t * (2 + NODE_OF[bi] * 2.5)} />}
      <Captions t={t} groups={GROUPS.slice(0, 2)} colors={{}} y={930} x={470} />
      <Captions t={t} groups={GROUPS.slice(2)} colors={{}} y={CAP_Y} x={460} />
      <Audio src={staticFile('elfahman/sun/vo/vo.wav')} />
      <Audio src={staticFile('elfahman/sun/music/bed.wav')} />
      <Audio src={staticFile('elfahman/sun/music/hits.wav')} />
      <Sequence from={Math.round(T.estanna * FPS)} durationInFrames={Math.round(0.6 * FPS)}><Audio src={staticFile('elfahman/sun/music/scratch.wav')} volume={0.7} /></Sequence>
      {[...SFX, ...BOARD_SWISH, ...CHIP_POP].map(([tt, n, v], i) => (
        <Sequence key={i} from={Math.max(0, Math.round(tt * FPS))} durationInFrames={Math.round(2.5 * FPS)}>
          <Audio src={staticFile(sfxFile(n))} volume={v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
