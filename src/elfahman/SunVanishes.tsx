// Video #12 — "لو الشمس اختفت". One board per sentence + time chip, timeline bar, captions, الفهمان reactor.
import React from 'react';
import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing } from 'remotion';
import { loadFont } from './font';
import data from './sunData.json';
import { BOARDS, AR } from './Boards';
import { Fahman, FExpr, FGesture } from './Fahman';

loadFont();
const cl = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const FPS = data.fps;
export const SUN_FRAMES = Math.ceil(data.duration * FPS);
const S = data.sentences.map((s) => Math.round(s.start * FPS));
const boardRange = (i: number) => [i === 0 ? 0 : S[i], i < 15 ? S[i + 1] : SUN_FRAMES] as const;
const capsOf = (i: number) => data.captions.filter((c) => c.s === i + 1);

// timeline (RTL): node index per board
const NODES = ['دلوقتي', '٨ دقايق', 'أيام', 'أسبوع', 'شهور', 'سنة', 'آلاف السنين'];
const NODE_OF = [0, 1, 1, 1, 2, 3, 4, 5, 5, 5, 5, 6, 6, 6, 0, 0];
// time chip per board ('' = none, 'cd' = 8:00 countdown)
const CHIP = ['cd', 'بعد ٨ دقايق', 'ليه ٨ دقايق؟', 'في نفس اللحظة', 'بعد كام يوم', 'بعد أسبوع', 'بعد كام شهر', 'بعد سنة', 'عشرات السنين', '', '', 'آلاف السنين', 'قاع المحيط', '', 'cd', ''];
const EXPR: FExpr[] = ['smirk', 'shocked', 'neutral', 'shocked', 'sad', 'cold', 'neutral', 'shocked', 'smirk', 'thinking', 'excited', 'smirk', 'amazed', 'smirk', 'smirk', 'smirk'];
const GEST: FGesture[] = ['none', 'none', 'none', 'none', 'none', 'none', 'none', 'none', 'none', 'chin', 'none', 'none', 'none', 'fingerUp', 'none', 'temple'];

const boardAt = (f: number) => {
  for (let i = 15; i >= 0; i--) if (f >= boardRange(i)[0]) return i;
  return 0;
};

const Chip: React.FC<{ text: string; f: number; still?: boolean }> = ({ text, f, still }) => {
  const s = interpolate(f, [0, 8], [0.4, 1], { ...cl, easing: Easing.back(2.2) });
  const sc = still ? 1 : s;
  return (
    <div style={{ position: 'absolute', top: 300, left: 0, right: 130, display: 'flex', justifyContent: 'center' }}>
      <div style={{ ...AR, transform: `scale(${sc})`, fontSize: 62, color: '#111', background: '#FFD23F', padding: '2px 40px 10px', borderRadius: 999, border: '6px solid #111', boxShadow: '0 10px 0 #111', display: 'flex', gap: 18, alignItems: 'center' }}>
        <span style={{ fontSize: 54 }}>⏱</span>
        <span>{text}</span>
      </div>
    </div>
  );
};

const countdown = (f: number) => {
  const sec = Math.max(0, 480 - Math.floor(f / FPS));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const Timeline: React.FC<{ node: number; f: number }> = ({ node, f }) => {
  const x0 = 880; // right end (start of time, RTL)
  const x1 = 90;
  const xs = NODES.map((_, i) => x0 + ((x1 - x0) * i) / (NODES.length - 1));
  return (
    <div style={{ position: 'absolute', top: 150, left: 0, width: 1080, height: 120 }}>
      <svg width={1080} height={120}>
        <line x1={x0} y1={40} x2={x1} y2={40} stroke="rgba(0,0,0,0.55)" strokeWidth={16} strokeLinecap="round" />
        <line x1={x0} y1={40} x2={xs[node]} y2={40} stroke="#FFD23F" strokeWidth={10} strokeLinecap="round" />
        {xs.map((x, i) => (
          <circle key={i} cx={x} cy={40} r={i === node ? 20 + Math.sin(f / 5) * 3 : 12} fill={i <= node ? '#FFD23F' : '#555'} stroke="#111" strokeWidth={5} />
        ))}
      </svg>
      <div style={{ position: 'absolute', top: 66, left: xs[node] - 150, width: 300, textAlign: 'center', ...AR, fontSize: 34, color: '#fff', textShadow: '0 3px 6px #000, 0 0 3px #000' }}>
        {NODES[node]}
      </div>
    </div>
  );
};

const Caption: React.FC<{ f: number }> = ({ f }) => {
  const t = f / FPS;
  const c = data.captions.find((x) => t >= x.start && t < x.end);
  if (!c) return null;
  const lf = f - Math.round(c.start * FPS);
  const s = c.start === 0 ? 1 : interpolate(lf, [0, 5], [0.82, 1], { ...cl, easing: Easing.back(2.5) });
  const gold = c.s === 16;
  return (
    <div style={{ position: 'absolute', top: gold ? 820 : 1110, left: 30, right: 130, display: 'flex', justifyContent: 'center' }}>
      <div
        style={{
          ...AR,
          transform: `scale(${gold ? s * 1.15 : s})`,
          fontSize: gold ? 104 : Math.min(84, Math.round(1750 / c.text.length)),
          whiteSpace: 'nowrap',
          lineHeight: 1.25,
          textAlign: 'center',
          color: gold ? '#FFD23F' : '#fff',
          WebkitTextStroke: gold ? '4px #5A3A00' : '3px #000',
          paintOrder: 'stroke fill',
          textShadow: gold ? '0 8px 0 #5A3A00, 0 0 40px rgba(255,210,63,0.7)' : '0 6px 0 #000, 0 0 12px rgba(0,0,0,0.9)',
        }}
      >
        {c.text}
      </div>
    </div>
  );
};

const blinkAt = (f: number) => {
  const p = f % 113;
  return p < 4 ? [0, 0.7, 1, 0.4][p] : 0;
};

export const SunVanishes: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bi = boardAt(f);
  const [a, b] = boardRange(bi);
  const lf = f - a;
  const d = b - a;
  const Board = BOARDS[bi];
  const ev = capsOf(bi).map((c) => Math.round(c.start * FPS) - a);
  // camera: gentle drift + cut punch; board 11 punch-in + shake
  const cut = interpolate(lf, [0, 7], [1.08, 1], { ...cl, easing: Easing.out(Easing.cubic) });
  const drift = 1 + lf * 0.00035;
  const shake = bi === 10 ? interpolate(lf, [0, 14], [22, 0], cl) : bi === 1 && ev[1] !== undefined ? interpolate(lf, [ev[1], ev[1] + 10], [16, 0], cl) : 0;
  const sx = Math.sin(f * 2.1) * shake;
  const sy = Math.cos(f * 2.7) * shake;
  // character
  const mouth = data.amp[f] ?? 0;
  const gestureT = spring({ frame: lf - 4, fps, config: { damping: 14, stiffness: 160 } });
  const wink = bi === 15 && lf > 8 && lf < d - 12 ? 1 : 0;
  const big = bi === 10;
  const charScale = big ? interpolate(lf, [0, 6], [1.0, 1.55], { ...cl, easing: Easing.back(2) }) : 1;
  const shiver = bi === 5 ? Math.sin(f * 3) * 3 : 0;
  const pop = spring({ frame: lf, fps, config: { damping: 9, stiffness: 220 }, from: 0.92, to: 1 });
  const chip = CHIP[bi];
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <AbsoluteFill style={{ transform: `translate(${sx}px,${sy}px) scale(${cut * drift})` }}>
        <Board f={lf} d={d} ev={ev} fps={FPS} />
      </AbsoluteFill>
      {bi < 15 && <Timeline node={NODE_OF[bi]} f={f} />}
      {chip && <Chip key={bi} still={bi === 0} text={chip === 'cd' ? countdown(bi === 0 ? f : lf) : chip} f={lf} />}
      <div
        style={{
          position: 'absolute',
          left: big ? 250 : 20,
          top: big ? 1020 : 1215,
          width: 340,
          height: 390,
          transformOrigin: '50% 100%',
          transform: `translate(${sx * 0.5 + shiver}px,${sy * 0.5}px) scale(${charScale * pop})`,
        }}
      >
        <Fahman expr={EXPR[bi]} gesture={GEST[bi]} gestureT={gestureT} mouth={mouth} blink={wink ? 0 : blinkAt(f)} wink={wink} look={bi === 9 ? { x: 0.6, y: -0.8 } : bi === 13 ? { x: 0, y: -1 } : { x: 0.3, y: 0 }} />
      </div>
      <Caption f={f} />
      <Audio src={staticFile('elfahman-12/mix.wav')} />
    </AbsoluteFill>
  );
};
