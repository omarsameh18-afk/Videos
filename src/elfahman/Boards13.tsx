// The 16 boards of الفهمان #13 "لو قفلت النت من موبايلك أسبوعين" — all drawn in code (0 picture credits).
// Each board is a full 1080x1920 scene. Props: t = seconds since the board started, d = board length (s),
// ev = event times in seconds relative to the board start (word onsets from the voice).
import React from 'react';
import {clamp, easeInOut, easeOut, easeIn, popIn, rand, seg, wobble} from './lib/anim';

export type BoardProps = {t: number; d: number; ev: number[]};
const W = 1080;
const H = 1920;
const YEL = '#FFD23F';
const RED = '#FF5A4E';
const INK = '#1b1410';
export const AR: React.CSSProperties = {fontFamily: 'Cairo', fontWeight: 900, direction: 'rtl'};

// ------------------------------------------------------------------ shared scene + text
const Scene: React.FC<{bg: string; children?: React.ReactNode; html?: React.ReactNode}> = ({bg, children, html}) => (
  <div style={{position: 'absolute', inset: 0, background: bg, overflow: 'hidden'}}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
      {children}
    </svg>
    {html}
  </div>
);
const Txt: React.FC<{x: number; y: number; s?: number; size?: number; color?: string; stroke?: number; rot?: number; children: React.ReactNode; o?: number}> = ({x, y, s = 1, size = 70, color = '#fff', stroke = 10, rot = 0, children, o = 1}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${s})`, opacity: o, ...AR, fontSize: size, color,
    WebkitTextStroke: `${stroke}px ${INK}`, paintOrder: 'stroke fill', whiteSpace: 'nowrap', lineHeight: 1.2}}>{children}</div>
);
const Pill: React.FC<{x: number; y: number; s?: number; size?: number; bg?: string; color?: string; children: React.ReactNode; rot?: number}> = ({x, y, s = 1, size = 64, bg = YEL, color = INK, children, rot = 0}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${s})`, ...AR, fontSize: size, color, background: bg,
    padding: '0px 34px 10px', borderRadius: 999, border: `7px solid ${INK}`, boxShadow: `0 10px 0 ${INK}`, whiteSpace: 'nowrap', lineHeight: 1.45}}>{children}</div>
);

// soft floating dots (code-drawn depth layer inside the board)
const Dots: React.FC<{t: number; color?: string; n?: number; o?: number}> = ({t, color = '#fff', n = 26, o = 0.25}) => (
  <g opacity={o}>
    {Array.from({length: n}, (_, i) => (
      <circle key={i} cx={rand(i + 1) * W + Math.sin(t * 0.5 + i) * 20} cy={rand(i + 40) * 1150 + Math.cos(t * 0.4 + i * 2) * 20} r={4 + rand(i + 80) * 10} fill={color} />
    ))}
  </g>
);

// ------------------------------------------------------------------ icons
export const Wifi: React.FC<{x: number; y: number; s: number; color?: string; o?: number}> = ({x, y, s, color = '#fff', o = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} fill="none" stroke={color} strokeWidth={14} strokeLinecap="round">
    <path d="M -80 -30 A 115 115 0 0 1 80 -30" />
    <path d="M -52 0 A 74 74 0 0 1 52 0" />
    <path d="M -25 28 A 36 36 0 0 1 25 28" />
    <circle cx={0} cy={58} r={10} fill={color} stroke="none" />
  </g>
);
export const RedX: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (s <= 0 ? null : (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle r={92} fill={RED} stroke={INK} strokeWidth={10} />
    <path d="M -42 -42 L 42 42 M 42 -42 L -42 42" stroke="#fff" strokeWidth={22} strokeLinecap="round" />
  </g>
));
// phone: x,y = centre. screen: 0 off .. 1 on. kind decides what is on the screen.
export const Phone: React.FC<{x: number; y: number; w: number; h: number; on?: number; kind?: 'wifi' | 'apps' | 'blank' | 'bar'; xk?: number; rot?: number; glow?: number; t?: number}> = ({x, y, w, h, on = 1, kind = 'wifi', xk = 0, rot = 0, glow = 0, t = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    {glow > 0 && <ellipse cx={0} cy={0} rx={w * 0.95} ry={h * 0.7} fill="#7FD3FF" opacity={0.28 * glow} />}
    <rect x={-w / 2 + 10} y={-h / 2 + 16} width={w} height={h} rx={w * 0.16} fill={INK} opacity={0.35} />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={w * 0.16} fill="#22252e" stroke={INK} strokeWidth={9} />
    <rect x={-w / 2 + w * 0.07} y={-h / 2 + w * 0.12} width={w * 0.86} height={h - w * 0.24} rx={w * 0.08} fill="#0b0c10" />
    <g opacity={on}>
      <rect x={-w / 2 + w * 0.07} y={-h / 2 + w * 0.12} width={w * 0.86} height={h - w * 0.24} rx={w * 0.08} fill={kind === 'apps' ? '#3b6fe0' : '#2a8cff'} />
      <rect x={-w / 2 + w * 0.07} y={-h / 2 + w * 0.12} width={w * 0.86} height={(h - w * 0.24) * 0.5} rx={w * 0.08} fill="#fff" opacity={0.12} />
      {kind === 'wifi' && <Wifi x={0} y={-h * 0.04} s={w / 300} />}
      {kind === 'apps' && Array.from({length: 12}, (_, i) => (
        <rect key={i} x={-w * 0.33 + (i % 3) * w * 0.25} y={-h * 0.3 + Math.floor(i / 3) * w * 0.27} width={w * 0.17} height={w * 0.17} rx={w * 0.04}
          fill={['#FF5A4E', '#FFD23F', '#35C46B', '#ffffff', '#FF9F1C', '#B57BFF'][i % 6]} />
      ))}
      {kind === 'bar' && <rect x={-w * 0.3} y={-6} width={w * 0.6} height={12} rx={6} fill="#fff" opacity={0.6} />}
    </g>
    <circle cx={0} cy={-h / 2 + w * 0.065} r={w * 0.022} fill="#555" />
    {xk > 0 && <RedX x={w * 0.36} y={-h * 0.36} s={xk * (w / 300) * 0.95} />}
  </g>
);
const Eye: React.FC<{x: number; y: number; s: number; t: number; i: number}> = ({x, y, s, t, i}) => {
  const bl = (t * 0.7 + rand(i) * 3) % 2.2 < 0.12 ? 0.1 : 1;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse rx={48} ry={30 * bl} fill="#fff" stroke={INK} strokeWidth={7} />
      {bl > 0.5 && <circle cx={Math.sin(t * 2 + i) * 10} r={16} fill="#2a8cff" stroke={INK} strokeWidth={5} />}
      {bl > 0.5 && <circle cx={Math.sin(t * 2 + i) * 10} r={7} fill={INK} />}
    </g>
  );
};
// tiny person icon (x = centre, y = feet). look: 'down' head tilted to a phone, 'up' head up. glow lights the face blue.
export const Person: React.FC<{x: number; y: number; s?: number; color?: string; skin?: string; look?: 'down' | 'up' | 'side'; glow?: number; phone?: boolean; legs?: number; flip?: boolean; o?: number}> = ({x, y, s = 1, color = '#5B8DEF', skin = '#C98B5E', look = 'up', glow = 0, phone = false, legs = 0, flip = false, o = 1}) => {
  const hd = look === 'down' ? 14 : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`} opacity={o}>
      <line x1={-14} y1={-60} x2={-14 - legs * 16} y2={0} stroke={INK} strokeWidth={16} strokeLinecap="round" />
      <line x1={14} y1={-60} x2={14 + legs * 16} y2={0} stroke={INK} strokeWidth={16} strokeLinecap="round" />
      <path d="M -42 -60 Q -46 -150 0 -152 Q 46 -150 42 -60 Z" fill={color} stroke={INK} strokeWidth={7} />
      <circle cx={look === 'side' ? 6 : 0} cy={-190 + hd} r={36} fill={skin} stroke={INK} strokeWidth={7} />
      {look !== 'down' && <><circle cx={-11 + (look === 'side' ? 12 : 0)} cy={-194} r={4.5} fill={INK} /><circle cx={11 + (look === 'side' ? 12 : 0)} cy={-194} r={4.5} fill={INK} /></>}
      {look === 'down' && <><path d="M -16 -172 q 5 4 10 0" stroke={INK} strokeWidth={4} fill="none" /><path d="M 6 -172 q 5 4 10 0" stroke={INK} strokeWidth={4} fill="none" /></>}
      {glow > 0 && <circle cx={0} cy={-178 + hd} r={34} fill="#7FD3FF" opacity={0.45 * glow} />}
      {phone && (
        <g>
          <path d="M -30 -118 Q -10 -96 -8 -126 M 30 -118 Q 10 -96 8 -126" stroke={INK} strokeWidth={12} fill="none" strokeLinecap="round" />
          <rect x={-16} y={-142} width={32} height={22} rx={4} fill="#7FD3FF" stroke={INK} strokeWidth={4} />
          <path d="M -16 -142 L -60 -230 L 60 -230 L 16 -142 Z" fill="#7FD3FF" opacity={0.18 * glow} />
        </g>
      )}
    </g>
  );
};
// emoji face: k = 0 grey/flat -> 1 yellow smile
const Face: React.FC<{x: number; y: number; r: number; k: number}> = ({x, y, r, k}) => {
  const c = k > 0.5 ? YEL : '#9aa0a8';
  const curve = -6 + 26 * k;
  return (
    <g transform={`translate(${x} ${y}) scale(${1 + 0.25 * Math.sin(Math.PI * clamp(k))})`}>
      <circle r={r} fill={c} stroke={INK} strokeWidth={7} />
      <circle cx={-r * 0.33} cy={-r * 0.2} r={r * 0.11} fill={INK} />
      <circle cx={r * 0.33} cy={-r * 0.2} r={r * 0.11} fill={INK} />
      <path d={`M ${-r * 0.42} ${r * 0.3} Q 0 ${r * 0.3 + curve * (r / 60)} ${r * 0.42} ${r * 0.3}`} stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round" />
    </g>
  );
};
const ClockIcon: React.FC<{x: number; y: number; r: number; spin: number}> = ({x, y, r, spin}) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r} fill="#fff" stroke={INK} strokeWidth={r * 0.12} />
    {Array.from({length: 12}, (_, i) => (
      <line key={i} x1={0} y1={-r * 0.8} x2={0} y2={-r * 0.68} stroke={INK} strokeWidth={r * 0.05} transform={`rotate(${i * 30})`} />
    ))}
    <line x1={0} y1={0} x2={Math.sin(spin) * r * 0.7} y2={-Math.cos(spin) * r * 0.7} stroke={INK} strokeWidth={r * 0.08} strokeLinecap="round" />
    <line x1={0} y1={0} x2={Math.sin(spin / 12) * r * 0.45} y2={-Math.cos(spin / 12) * r * 0.45} stroke={RED} strokeWidth={r * 0.1} strokeLinecap="round" />
    <circle r={r * 0.08} fill={INK} />
  </g>
);
// brain: lobes + folds. glow 0..1
export const Brain: React.FC<{x: number; y: number; s: number; glow?: number; tint?: string}> = ({x, y, s, glow = 0, tint = '#FF9EC1'}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {glow > 0 && <circle r={230} fill="#FFE98A" opacity={0.35 * glow} />}
    {glow > 0 && <circle r={170} fill="#FFF6C8" opacity={0.4 * glow} />}
    <path d="M -150 20 C -190 -40 -150 -120 -80 -130 C -60 -170 20 -175 40 -140 C 100 -165 165 -120 155 -60 C 200 -20 180 60 130 70 C 120 120 50 130 20 100 C -20 135 -100 125 -110 80 C -160 85 -175 50 -150 20 Z"
      fill={tint} stroke={INK} strokeWidth={10} strokeLinejoin="round" />
    <path d="M 0 -150 C -20 -90 20 -40 0 20 C -15 60 10 90 15 100" stroke={INK} strokeWidth={7} fill="none" opacity={0.6} />
    <path d="M -110 -60 C -70 -80 -50 -40 -80 -10 M -120 40 C -80 20 -50 50 -60 80 M 60 -100 C 90 -70 70 -40 100 -20 M 70 20 C 110 10 120 50 100 60 M -40 -100 C -20 -70 -50 -50 -40 -20"
      stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round" opacity={0.6} />
    <ellipse cx={-60} cy={-80} rx={40} ry={18} fill="#fff" opacity={0.35} transform="rotate(-20 -60 -80)" />
  </g>
);
const Sparkles: React.FC<{t: number; cx: number; cy: number; R: number; n?: number; color?: string}> = ({t, cx, cy, R, n = 10, color = '#FFF3A0'}) => (
  <g>
    {Array.from({length: n}, (_, i) => {
      const a = (i / n) * Math.PI * 2 + t * 0.6;
      const r = R * (0.8 + 0.25 * Math.sin(t * 3 + i));
      const sc = 0.5 + 0.5 * Math.abs(Math.sin(t * 2.4 + i * 1.3));
      return (
        <path key={i} transform={`translate(${cx + Math.cos(a) * r} ${cy + Math.sin(a) * r}) scale(${sc})`}
          d="M0 -26 Q 4 -4 26 0 Q 4 4 0 26 Q -4 4 -26 0 Q -4 -4 0 -26 Z" fill={color} stroke={INK} strokeWidth={3} />
      );
    })}
  </g>
);
const Tree: React.FC<{x: number; y: number; s: number; t: number}> = ({x, y, s, t}) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(${Math.sin(t * 1.6) * 2})`}>
    <rect x={-16} y={-120} width={32} height={120} rx={8} fill="#8B5A2B" stroke={INK} strokeWidth={7} />
    <circle cx={0} cy={-190} r={90} fill="#35C46B" stroke={INK} strokeWidth={8} />
    <circle cx={-60} cy={-140} r={55} fill="#2FB062" stroke={INK} strokeWidth={8} />
    <circle cx={60} cy={-140} r={55} fill="#2FB062" stroke={INK} strokeWidth={8} />
    <circle cx={-25} cy={-215} r={22} fill="#fff" opacity={0.25} />
  </g>
);
const Bubble: React.FC<{x: number; y: number; s: number; flip?: boolean; dots?: number}> = ({x, y, s, flip = false, dots = 0}) => (s <= 0 ? null : (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
    <path d="M -70 -45 Q -70 -80 -35 -80 L 50 -80 Q 85 -80 85 -45 L 85 0 Q 85 35 50 35 L -10 35 L -45 70 L -40 35 Q -70 35 -70 0 Z" fill="#fff" stroke={INK} strokeWidth={7} />
    {[0, 1, 2].map((i) => <circle key={i} cx={-25 + i * 32} cy={-22} r={9} fill={INK} opacity={0.35 + 0.65 * Math.abs(Math.sin(dots * 4 - i * 0.7))} />)}
  </g>
));
const Door: React.FC<{x: number; y: number; open: number}> = ({x, y, open}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-120} y={-330} width={240} height={330} fill="#FFF3C4" stroke={INK} strokeWidth={9} />
    <rect x={-120} y={-330} width={240} height={330} fill="#FFE98A" opacity={0.6 + 0.3 * open} />
    <path d={`M -120 -330 L ${-120 + 240 * (1 - open * 0.75)} ${-330 + 26 * open} L ${-120 + 240 * (1 - open * 0.75)} ${-26 * open} L -120 0 Z`} fill="#A0522D" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
    <circle cx={-120 + 240 * (1 - open * 0.75) - 26} cy={-160} r={10} fill={YEL} stroke={INK} strokeWidth={4} />
  </g>
);
const Star: React.FC<{x: number; y: number; r: number; rot?: number}> = ({x, y, r, rot = 0}) => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + (rot * Math.PI) / 180 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r;
    pts.push(`${x + rr * Math.cos(a)},${y + rr * Math.sin(a)}`);
  }
  return <polygon points={pts.join(' ')} fill={YEL} stroke={INK} strokeWidth={r * 0.14} strokeLinejoin="round" />;
};
const Tea: React.FC<{x: number; y: number; s: number; t: number}> = ({x, y, s, t}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[0, 1, 2].map((i) => (
      <path key={i} d={`M ${-14 + i * 14} -120 q 12 -20 0 -40 q -12 -20 0 -40`} stroke="#fff" strokeWidth={6} fill="none" strokeLinecap="round"
        opacity={0.5 * Math.abs(Math.sin(t * 1.5 + i))} transform={`translate(0 ${-((t * 30 + i * 20) % 30)})`} />
    ))}
    <ellipse cx={0} cy={6} rx={78} ry={16} fill="#eee" stroke={INK} strokeWidth={6} />
    <path d="M -38 -100 L 38 -100 L 28 0 L -28 0 Z" fill="#B5361C" stroke={INK} strokeWidth={7} strokeLinejoin="round" opacity={0.92} />
    <path d="M -38 -100 L 38 -100 L 36 -80 L -36 -80 Z" fill="#fff" opacity={0.35} />
    <path d="M -22 -92 L -18 -10" stroke="#fff" strokeWidth={6} opacity={0.4} strokeLinecap="round" />
  </g>
);
const ArrowDown: React.FC<{x: number; y: number; s: number; color?: string}> = ({x, y, s, color = YEL}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -28 -90 L 28 -90 L 28 0 L 62 0 L 0 70 L -62 0 L -28 0 Z" fill={color} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
  </g>
);
const SendIcon: React.FC<{x: number; y: number; s: number; rot?: number}> = ({x, y, s, rot = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(${rot})`}>
    <path d="M -80 -10 L 90 -70 L 40 80 L 10 20 Z" fill="#fff" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
    <path d="M 10 20 L 90 -70" stroke={INK} strokeWidth={6} />
  </g>
);

// ------------------------------------------------------------------ backgrounds
const BG_NIGHT = 'radial-gradient(ellipse at 50% 35%,#2D3B6B 0%,#151B33 60%,#0B0E1C 100%)';
const BG_WARM = 'radial-gradient(ellipse at 50% 35%,#FFB86B 0%,#E9733A 55%,#8A3418 100%)';
const BG_TEAL = 'radial-gradient(ellipse at 50% 35%,#4FD1C5 0%,#1E8C8C 60%,#0E4A55 100%)';
const BG_PURPLE = 'radial-gradient(ellipse at 50% 35%,#8E6CFF 0%,#5537C9 60%,#2A1870 100%)';
const BG_GREEN = 'radial-gradient(ellipse at 50% 35%,#8BE27A 0%,#3FAF5B 60%,#1C6A3A 100%)';
const BG_SKY = 'linear-gradient(180deg,#5FC8FF 0%,#9EE0FF 55%,#E8F7FF 100%)';

// floor line under the boards so the bottom of the frame (behind him) is never empty
const Floor: React.FC<{c?: string; o?: number}> = ({c = '#000', o = 0.22}) => <rect x={0} y={1180} width={W} height={H - 1180} fill={c} opacity={o} />;

// ================================================================== 1 — hook: big phone, Wi-Fi gets a red X with a pop
// ev[0] = onset of "قفلت" (the X pops). Loop: at t=0 the X is not there yet, the same as the end of board 16.
export const B1: React.FC<BoardProps> = ({t, ev}) => {
  const xk = popIn(t - (ev[0] ?? 0.2), 0.3);
  const bob = Math.sin(t * 2.2) * 14;
  const shake = t > ev[0] && t < ev[0] + 0.3 ? Math.sin(t * 80) * 6 * (1 - (t - ev[0]) / 0.3) : 0;
  return (
    <Scene bg={BG_NIGHT}>
      <Dots t={t} color="#9EC7FF" o={0.18} />
      <Phone x={690 + shake} y={530 + bob} w={280} h={500} kind="wifi" xk={xk} rot={-6 + Math.sin(t * 1.4) * 2} glow={1 - 0.6 * xk} t={t} />
      {[0, 1, 2].map((i) => {
        const p = ((t * 0.9 + i / 3) % 1);
        return <circle key={i} cx={690} cy={530 + bob} r={180 + p * 200} fill="none" stroke="#9EC7FF" strokeWidth={6} opacity={(1 - p) * 0.35 * (1 - xk)} />;
      })}
      <Floor />
    </Scene>
  );
};

// ================================================================== 2 — first hour: hand jerks to the pocket, ghost buzz, then nothing
// ev[0] = "جيبك" (hand jerks in), ev[1] = "بيرن" (buzz lines), ev[2] = "ساكت" (buzz vanishes)
export const B2: React.FC<BoardProps> = ({t, ev}) => {
  const [jerk = 1.6, buzz = 3.4, quiet = 4.3] = ev;
  const hand = easeOut(seg(t, jerk - 0.12, jerk + 0.08));
  const buzzOn = t >= buzz && t < quiet ? 1 : t >= quiet ? Math.max(0, 1 - (t - quiet) / 0.25) : 0;
  const pre = t >= 0.2 && t < jerk ? 0.6 : 0; // a phantom buzz first: the hand jerks because of it
  const amp = Math.max(buzzOn, pre);
  const vib = Math.sin(t * 90) * 7 * amp;
  const empty = seg(t, quiet + 0.1, quiet + 0.5);
  return (
    <Scene bg={BG_TEAL} html={<>
      {amp > 0.05 && <Txt x={250 + vib} y={420} size={88} rot={-12} o={amp} color={YEL}>بززز</Txt>}
      {amp > 0.05 && <Txt x={850 - vib} y={470} size={70} rot={10} o={amp} color={YEL}>بززز</Txt>}
      {empty > 0 && <Txt x={540} y={700} size={96} s={popIn(t - quiet - 0.1)} color="#fff">مفيش حاجة!</Txt>}
    </>}>
      <Dots t={t} o={0.15} />
      {/* jeans pocket close-up */}
      <g transform="translate(540 650)">
        <path d="M -330 -230 L 330 -230 L 300 260 Q 0 330 -300 260 Z" fill="#3E6FB0" stroke={INK} strokeWidth={10} />
        <path d="M -330 -230 L 330 -230" stroke="#2A4F85" strokeWidth={30} />
        <path d="M -230 -215 Q 0 -60 230 -215" fill="#2F5A96" stroke={INK} strokeWidth={9} />
        <path d="M -225 -200 Q 0 -70 225 -200" fill="none" stroke={YEL} strokeWidth={5} strokeDasharray="16 12" opacity={0.8} />
        <path d="M -300 240 Q 0 300 300 240" fill="none" stroke={YEL} strokeWidth={5} strokeDasharray="16 12" opacity={0.8} />
        {/* the phantom phone inside the pocket (dashed ghost) */}
        <g transform={`translate(${vib} ${-60})`} opacity={(1 - empty) * 0.85}>
          <rect x={-85} y={-150} width={170} height={300} rx={26} fill="none" stroke="#fff" strokeWidth={8} strokeDasharray="22 14" />
        </g>
        {amp > 0.05 && [0, 1, 2].map((i) => (
          <g key={i} opacity={amp}>
            <path d={`M ${-150 - i * 34} ${-120 + i * 10} q -20 50 0 100`} stroke="#fff" strokeWidth={9} fill="none" strokeLinecap="round" transform={`translate(${vib} -50)`} />
            <path d={`M ${150 + i * 34} ${-120 + i * 10} q 20 50 0 100`} stroke="#fff" strokeWidth={9} fill="none" strokeLinecap="round" transform={`translate(${vib} -50)`} />
          </g>
        ))}
        {/* his hand (orange hoodie sleeve) jerks down into the pocket */}
        <g transform={`translate(${190 - hand * 140} ${-560 + hand * 380}) rotate(${-25 + hand * 20})`}>
          <rect x={-70} y={-260} width={140} height={250} rx={40} fill="#FF7A1A" stroke={INK} strokeWidth={9} />
          <rect x={-74} y={-40} width={148} height={46} rx={18} fill="#E0600A" stroke={INK} strokeWidth={8} />
          <path d="M -60 0 Q -70 90 -20 110 Q 40 120 60 70 L 60 0 Z" fill="#A86A45" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
        </g>
        {/* pocket front edge over the hand */}
        <path d="M -230 -215 Q 0 -60 230 -215 L 230 -180 Q 0 -30 -230 -180 Z" fill="#3E6FB0" stroke={INK} strokeWidth={8} opacity={hand > 0.6 ? 1 : 0} />
      </g>
      <Floor />
    </Scene>
  );
};

// ================================================================== 3 — first day: screen on/off/on/off loop, unlock counter ticking
export const B3: React.FC<BoardProps> = ({t}) => {
  const P = 0.62; // one on/off cycle
  const cyc = Math.floor(t / P);
  const on = (t % P) < P * 0.55 ? 1 : 0.0;
  const count = 1 + cyc;
  const bump = popIn((t % P), 0.18);
  return (
    <Scene bg={BG_PURPLE} html={<>
      <div style={{position: 'absolute', left: 120, top: 380, width: 280, height: 170, transform: `scale(${0.85 + 0.15 * bump})`, transformOrigin: '50% 50%',
        background: '#fff', border: `8px solid ${INK}`, borderRadius: 36, boxShadow: `0 12px 0 ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14}}>
        <svg width={70} height={84} viewBox="-35 -45 70 90"><path d="M -18 -8 L -18 -22 A 18 18 0 0 1 18 -22" stroke={INK} strokeWidth={9} fill="none" strokeLinecap="round" /><rect x={-28} y={-8} width={56} height={46} rx={10} fill={YEL} stroke={INK} strokeWidth={7} /></svg>
        <span style={{...AR, fontSize: 96, color: INK, direction: 'ltr'}}>{count}×</span>
      </div>
    </>}>
      <Dots t={t} o={0.15} />
      <Phone x={680} y={650} w={300} h={540} kind="apps" on={on} rot={4 + Math.sin(t * 2) * 2} glow={on} t={t} />
      {/* thumb tap ring on each wake */}
      <circle cx={680} cy={860} r={30 + 40 * (t % P) / P} fill="none" stroke="#fff" strokeWidth={6} opacity={1 - (t % P) / P} />
      <Floor />
    </Scene>
  );
};

// ================================================================== 4 — proof: counter flies to "عشرات المرات", eyes pop around
export const B4: React.FC<BoardProps> = ({t, ev}) => {
  const [hit = 0.9] = ev; // "عشرات"
  const fly = easeInOut(seg(t, 0, hit));
  const n = Math.round(5 + fly * 75);
  const eyes = [[180, 420], [900, 430], [150, 640], [930, 650], [250, 880], [830, 880], [540, 380]];
  return (
    <Scene bg={BG_PURPLE} html={<>
      <div style={{position: 'absolute', left: 540 + (1 - fly) * -280, top: 560 + (1 - fly) * -120, transform: `translate(-50%,-50%) scale(${0.6 + 0.6 * fly + (t > hit ? 0.06 * wobble(t - hit, 3, 6) : 0)})`,
        ...AR, fontSize: 200, color: YEL, WebkitTextStroke: `14px ${INK}`, paintOrder: 'stroke fill', direction: 'ltr', lineHeight: 1}}>{n}+</div>
      {t > hit && <Txt x={540} y={760} size={96} s={popIn(t - hit)} color="#fff">عشرات المرات</Txt>}
    </>}>
      <Dots t={t} o={0.15} />
      {eyes.map(([x, y], i) => <Eye key={i} x={x} y={y} s={popIn(t - 0.15 - i * 0.22) * 1.1} t={t} i={i} />)}
      <Floor />
    </Scene>
  );
};

// ================================================================== 5 — ahwa: 3 friends heads down in phone glow; he is the only one looking up
const Ahwa: React.FC<{t: number; dim?: number}> = ({t, dim = 0}) => (
  <g>
    {/* arches + lanterns */}
    {[180, 540, 900].map((x, i) => (
      <g key={i}>
        <path d={`M ${x - 150} 1000 L ${x - 150} 420 Q ${x} 250 ${x + 150} 420 L ${x + 150} 1000 Z`} fill="#5A2E1A" opacity={0.55} />
        <line x1={x} y1={300} x2={x} y2={400} stroke={INK} strokeWidth={5} />
        <path d={`M ${x - 30} 400 L ${x + 30} 400 L ${x + 22} 460 L ${x - 22} 460 Z`} fill="#FFD23F" stroke={INK} strokeWidth={5} />
        <circle cx={x} cy={430} r={70} fill="#FFE98A" opacity={0.18 + 0.05 * Math.sin(t * 3 + i)} />
      </g>
    ))}
    <rect x={0} y={1000} width={W} height={920} fill="#6B3A22" />
    <rect x={0} y={1000} width={W} height={14} fill={INK} opacity={0.4} />
    {/* tables */}
    {[[270, 1010], [800, 1010]].map(([x, y], i) => (
      <g key={i}>
        <rect x={x - 12} y={y - 130} width={24} height={130} fill="#3A2416" />
        <ellipse cx={x} cy={y - 130} rx={150} ry={26} fill="#C0C6CC" stroke={INK} strokeWidth={6} />
      </g>
    ))}
    <rect x={0} y={0} width={W} height={H} fill="#000" opacity={dim} />
  </g>
);
export const B5: React.FC<BoardProps> = ({t, ev}) => {
  const [only = 2.5] = ev; // "الوحيد": a soft spotlight finds him
  const spot = seg(t, only - 0.1, only + 0.4);
  return (
    <Scene bg={BG_WARM} html={spot > 0 ? <Txt x={700} y={560} size={64} s={popIn(t - only)} color={YEL}>الوحيد!</Txt> : null}>
      <Ahwa t={t} dim={0.25 * spot} />
      <Person x={170} y={960} s={1.45} color="#5B8DEF" look="down" phone glow={0.9 + 0.1 * Math.sin(t * 5)} />
      <Person x={450} y={960} s={1.45} color="#35C46B" look="down" phone glow={0.9 + 0.1 * Math.sin(t * 4 + 1)} skin="#B77A50" />
      <Person x={900} y={960} s={1.45} color="#B57BFF" look="down" phone glow={0.9 + 0.1 * Math.sin(t * 6 + 2)} skin="#D9A273" />
      {/* tea glass on his table, front right */}
      <ellipse cx={890} cy={1350} rx={170} ry={34} fill="#C0C6CC" stroke={INK} strokeWidth={7} />
      <Tea x={890} y={1345} s={1.1} t={t} />
      {spot > 0 && <path d="M 300 0 L 120 1600 L 760 1600 L 600 0 Z" fill="#FFF6C8" opacity={0.18 * spot} />}
    </Scene>
  );
};

// ================================================================== 6 — "+٢:٣٠ ساعة" yellow chip with a spinning clock
export const B6: React.FC<BoardProps> = ({t, ev}) => {
  const [hit = 1.6] = ev; // "ساعتين"
  const s = popIn(t - hit, 0.32);
  const spin = t * (t < hit ? 3 : 14);
  return (
    <Scene bg={BG_WARM} html={t > hit ? (
      <div style={{position: 'absolute', left: 540, top: 820, transform: `translate(-50%,-50%) scale(${s})`, ...AR, fontSize: 120, color: INK, background: YEL, padding: '0 50px 14px',
        borderRadius: 999, border: `9px solid ${INK}`, boxShadow: `0 14px 0 ${INK}`, whiteSpace: 'nowrap', lineHeight: 1.4}}>{'\u2066+٢:٣٠\u2069 ساعة'}</div>
    ) : null}>
      <Ahwa t={t} dim={0.45} />
      <circle cx={540} cy={580} r={240} fill="#FFE98A" opacity={0.25 + 0.1 * Math.sin(t * 4)} />
      <ClockIcon x={540} y={580} r={190} spin={spin} />
      {t > hit && <Sparkles t={t} cx={540} cy={580} R={260} n={8} />}
    </Scene>
  );
};

// ================================================================== 7 — screen time bar shrinks full -> half ("النص"), "تجربة حقيقية" stamp
export const B7: React.FC<BoardProps> = ({t, ev}) => {
  const [stamp = 1.0, half = 4.8] = ev; // "تجربة", "نزل"
  const k = easeInOut(seg(t, half - 0.2, half + 0.6));
  const w = 760 * (1 - 0.5 * k);
  const st = t > stamp ? 1 + 1.4 * (1 - easeOut(seg(t, stamp, stamp + 0.18))) : 0;
  return (
    <Scene bg={BG_TEAL} html={<>
      <Txt x={540} y={470} size={64} color="#fff">وقت الموبايل</Txt>
      {k > 0.5 && <Txt x={160 + w / 2 + 10} y={800} size={100} s={popIn(t - half - 0.3)} color={YEL}>النص</Txt>}
      {st > 0 && (
        <div style={{position: 'absolute', left: 740, top: 830, transform: `translate(-50%,-50%) rotate(-10deg) scale(${st})`, opacity: Math.min(1, (t - stamp) / 0.08), ...AR, fontSize: 58, color: RED,
          border: `9px solid ${RED}`, borderRadius: 18, padding: '0 22px 8px', background: 'rgba(255,255,255,0.9)', whiteSpace: 'nowrap'}}>تجربة حقيقية</div>
      )}
    </>}>
      <Dots t={t} o={0.15} />
      <Phone x={180} y={650} w={120} h={210} kind="bar" rot={-8} />
      <rect x={160} y={570} width={760} height={110} rx={55} fill="#0E4A55" stroke={INK} strokeWidth={9} />
      <rect x={160} y={570} width={w} height={110} rx={55} fill={k > 0.5 ? '#35C46B' : RED} stroke={INK} strokeWidth={9} />
      <rect x={180} y={585} width={Math.max(0, w - 40)} height={26} rx={13} fill="#fff" opacity={0.3} />
      <line x1={540} y1={540} x2={540} y2={710} stroke="#fff" strokeWidth={6} strokeDasharray="14 10" opacity={0.7} />
      <Floor />
    </Scene>
  );
};

// ================================================================== 8 — face to face + walking + tree (outdoors)
export const B8: React.FC<BoardProps> = ({t, ev}) => {
  const [sit = 0.3, face = 2.0, walk = 3.3] = ev; // "قعدت", "وش", "اتمشت"
  const a = popIn(t - sit), b = popIn(t - face), c = popIn(t - walk);
  const step = Math.sin(t * 9);
  const wx = 690 + (t - walk) * 50;
  return (
    <Scene bg={BG_SKY}>
      <circle cx={900} cy={330} r={90} fill="#FFE066" stroke={INK} strokeWidth={7} />
      <path d="M 0 900 Q 300 820 540 880 Q 800 940 1080 860 L 1080 1920 L 0 1920 Z" fill="#7BD66B" />
      <path d="M 0 1000 Q 400 950 1080 1010 L 1080 1920 L 0 1920 Z" fill="#5FBF55" />
      {/* two people face to face */}
      <g opacity={a > 0 ? 1 : 0} transform={`translate(0 ${(1 - Math.min(1, a)) * 60})`}>
        <Person x={170} y={900} s={1.3} color="#FF7A1A" look="side" />
        <Person x={440} y={900} s={1.3} color="#5B8DEF" look="side" flip skin="#B77A50" />
        <Bubble x={190} y={470} s={b} dots={t} />
        <Bubble x={420} y={440} s={b} flip dots={t + 0.5} />
      </g>
      {/* tree + a walking figure */}
      <g transform={`scale(${Math.min(1, c)})`} style={{transformOrigin: '860px 900px'}}>
        <Tree x={900} y={900} s={1.25} t={t} />
      </g>
      {c > 0 && <Person x={wx} y={900 + Math.abs(step) * -6} s={1.1} color="#35C46B" look="side" legs={step} skin="#D9A273" />}
    </Scene>
  );
};

// ================================================================== 9 — mood meter: 10 faces, 7 turn grey -> smiling yellow one by one
export const B9: React.FC<BoardProps> = ({t, ev}) => {
  const [go = 1.2] = ev; // "سبعة"
  const turned = (i: number) => (i < 7 ? easeOut(seg(t, go + i * 0.22, go + i * 0.22 + 0.18)) : 0);
  return (
    <Scene bg={BG_GREEN} html={t > go + 1.6 ? <Txt x={540} y={860} size={96} s={popIn(t - go - 1.6)} color={YEL}>٧ من ١٠</Txt> : null}>
      <Dots t={t} o={0.15} />
      {Array.from({length: 10}, (_, i) => {
        const r = Math.floor(i / 5), c = i % 5;
        const x = 900 - c * 190, y = 470 + r * 200; // right-to-left order
        return <Face key={i} x={x} y={y + Math.sin(t * 2 + i) * 4} r={74} k={turned(i)} />;
      })}
      <Floor />
    </Scene>
  );
};

// ================================================================== 10 — "حصله إيه؟": brain with a "?" (held through the mystery pause)
export const B10: React.FC<BoardProps> = ({t, ev}) => {
  const [q = 0.9] = ev; // "حصله"
  const freeze = ev[1] ?? 99; // pause start: everything holds still
  const tt = Math.min(t, freeze);
  return (
    <Scene bg="radial-gradient(ellipse at 50% 35%,#3C2F5E 0%,#1A1430 65%,#0B0816 100%)" html={t > q ? (
      <Txt x={760} y={420 + Math.sin(tt * 3) * 8} size={220} s={popIn(t - q, 0.3)} color={YEL} stroke={14}>؟</Txt>
    ) : null}>
      <Dots t={tt} o={0.12} />
      <Brain x={500} y={640 + Math.sin(tt * 1.8) * 10} s={1.25} tint="#D9A0C0" />
      <Floor />
    </Scene>
  );
};

// ================================================================== 11 — "استنى ده الغريب جاي!": same brain, the "?" flips to "!"
export const B11: React.FC<BoardProps> = ({t}) => (
  <Scene bg="radial-gradient(ellipse at 50% 35%,#5E2F3C 0%,#2A1018 65%,#12060A 100%)" html={
    <Txt x={760} y={420} size={240} s={popIn(t, 0.22)} color={RED} stroke={14}>!</Txt>
  }>
    <Brain x={500} y={640} s={1.25 + 0.05 * wobble(t, 4, 5)} tint="#D9A0C0" />
    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
      const a = (i / 8) * Math.PI * 2;
      const k = easeOut(seg(t, 0, 0.4));
      return <line key={i} x1={500 + Math.cos(a) * 260} y1={640 + Math.sin(a) * 230} x2={500 + Math.cos(a) * (260 + 90 * k)} y2={640 + Math.sin(a) * (230 + 90 * k)} stroke={YEL} strokeWidth={12} strokeLinecap="round" opacity={1 - seg(t, 0.6, 1.2)} />;
    })}
    <Floor />
  </Scene>
);

// ================================================================== 12 — PAYOFF (most colourful): glowing brain, calendar flips back, gold "-١٠ سنين"
export const B12: React.FC<BoardProps> = ({t, ev}) => {
  const [focus = 0.3, younger = 1.6] = ev; // "تركيزهم", "أصغر"
  const glow = easeOut(seg(t, focus, focus + 0.6));
  const flips = Math.floor(clamp((t - 0.9) / 1.4) * 10); // 10 pages flip back
  const pageK = ((t - 0.9) / 0.14) % 1;
  const year = 2026 - flips;
  const badge = popIn(t - younger, 0.34);
  return (
    <Scene bg="conic-gradient(from 0deg at 50% 32%,#FF5A4E,#FF9F1C,#FFD23F,#35C46B,#2A8CFF,#B57BFF,#FF5A9E,#FF5A4E)" html={<>
      <div style={{position: 'absolute', left: 820, top: 480, transform: 'translate(-50%,-50%)', ...AR, fontSize: 62, color: INK, direction: 'ltr'}}>{year}</div>
      {badge > 0 && (
        <div style={{position: 'absolute', left: 540, top: 800, transform: `translate(-50%,-50%) rotate(-4deg) scale(${badge})`, ...AR, fontSize: 120, color: INK,
          background: 'linear-gradient(180deg,#FFF3A0,#FFD23F 45%,#F2A900)', padding: '0 54px 16px', borderRadius: 999, border: `10px solid ${INK}`, boxShadow: `0 14px 0 ${INK}, 0 0 60px #FFF3A0`, whiteSpace: 'nowrap', lineHeight: 1.4}}>{'\u2066-١٠\u2069 سنين'}</div>
      )}
    </>}>
      <rect x={0} y={0} width={W} height={H} fill="#fff" opacity={0.18} />
      {Array.from({length: 16}, (_, i) => (
        <path key={i} d="M 540 600 L 520 -400 L 560 -400 Z" fill="#fff" opacity={0.18} transform={`rotate(${i * 22.5 + t * 12} 540 600)`} />
      ))}
      <Brain x={360} y={520 + Math.sin(t * 2) * 10} s={1.0 + 0.04 * glow} glow={glow * (0.85 + 0.15 * Math.sin(t * 6))} tint="#FF8DB8" />
      {glow > 0 && <Sparkles t={t} cx={360} cy={520} R={260} n={10} />}
      {/* calendar flipping back */}
      <g transform="translate(820 520)">
        <rect x={-130} y={-150} width={260} height={290} rx={22} fill="#fff" stroke={INK} strokeWidth={9} />
        <rect x={-130} y={-150} width={260} height={80} rx={22} fill={RED} stroke={INK} strokeWidth={9} />
        {[-70, 70].map((x) => <rect key={x} x={x - 10} y={-176} width={20} height={50} rx={10} fill="#ddd" stroke={INK} strokeWidth={6} />)}
        {t > 0.9 && flips < 10 && (
          <path d={`M -130 -70 L 130 -70 L 130 ${-70 + 210 * (1 - pageK)} L -130 ${-70 + 210 * (1 - pageK)} Z`} fill="#f4f4f4" stroke={INK} strokeWidth={6} opacity={0.95} />
        )}
        <path d="M -60 -100 A 40 40 0 1 1 -20 -60" stroke="#fff" strokeWidth={8} fill="none" />
        <path d="M -20 -60 l -6 -22 l 22 4 z" fill="#fff" />
      </g>
    </Scene>
  );
};

// ================================================================== 13 — crowd walks to a door "أسبوعين"; most turn back
export const B13: React.FC<BoardProps> = ({t, ev}) => {
  const [turn = 2.4] = ev; // "مقدروش"
  const N = 12;
  return (
    <Scene bg="radial-gradient(ellipse at 50% 40%,#5A6B8C 0%,#2E3650 65%,#161A28 100%)" html={<Pill x={830} y={360} size={56}>أسبوعين</Pill>}>
      <Dots t={t} o={0.1} />
      <rect x={0} y={900} width={W} height={1020} fill="#20263A" />
      <Door x={830} y={900} open={0.25 + 0.1 * Math.sin(t * 2)} />
      {Array.from({length: N}, (_, i) => {
        const keep = i === 2 || i === 7 || i === 10; // only a few keep going
        const row = i % 3;
        const start = 60 + (i * 47) % 260 - row * 20;
        const tt = t * (0.8 + rand(i) * 0.3);
        const back = keep ? 0 : easeInOut(seg(t, turn + rand(i + 3) * 0.6, turn + 0.4 + rand(i + 3) * 0.6));
        const fwd = Math.min(tt * 140, 470);
        const x = start + fwd - back * (t - turn) * 200 * (back > 0 ? 1 : 0);
        const xx = keep ? Math.min(start + tt * 140, 790) : Math.max(-80, x);
        const step = Math.sin(t * 10 + i);
        return <Person key={i} x={xx} y={880 + row * 26} s={0.78 + row * 0.06} color={['#FF5A4E', '#35C46B', '#5B8DEF', '#B57BFF', '#FF9F1C'][i % 5]} look="side" legs={step} flip={back > 0.5} skin={['#C98B5E', '#B77A50', '#D9A273'][i % 3]} o={keep && xx >= 780 ? Math.max(0, 1 - (t - (790 - start) / 140)) : 1} />;
      })}
    </Scene>
  );
};

// ================================================================== 14 — 4 people, 3 fall off one by one, 1 stays with a gold star
export const B14: React.FC<BoardProps> = ({t, ev}) => {
  const [one = 1.4] = ev; // "واحد"
  const fallAt = [0.5, 0.9, 1.3];
  return (
    <Scene bg="radial-gradient(ellipse at 50% 35%,#4B5D7A 0%,#26304A 65%,#121725 100%)" html={t > one + 0.4 ? <Txt x={540} y={330} size={96} s={popIn(t - one - 0.4)} color={YEL}>واحد بس!</Txt> : null}>
      <Dots t={t} o={0.1} />
      <rect x={110} y={740} width={860} height={36} rx={18} fill="#8FA3C4" stroke={INK} strokeWidth={8} />
      {[0, 1, 2, 3].map((i) => {
        const x = 870 - i * 220;
        const fi = i === 0 ? -1 : i - 1; // person 0 (right) stays
        const ft = fi >= 0 ? t - fallAt[fi] : -1;
        const y = 740 + (ft > 0 ? 900 * ft * ft : 0);
        const rot = ft > 0 ? Math.min(80, ft * 220) * (i % 2 ? 1 : -1) : 0;
        return (
          <g key={i} transform={`rotate(${rot} ${x} ${y - 100})`}>
            <Person x={x} y={y} s={0.95} color={['#FFD23F', '#5B8DEF', '#B57BFF', '#35C46B'][i]} look="up" skin={['#C98B5E', '#B77A50', '#D9A273', '#C98B5E'][i]} o={ft > 0.9 ? 0 : 1} />
          </g>
        );
      })}
      {t > one && <Star x={870} y={460 + Math.sin(t * 3) * 6} r={56 * popIn(t - one)} rot={t * 40} />}
      {t > one && <Sparkles t={t} cx={870} cy={600} R={170} n={6} />}
      <Floor />
    </Scene>
  );
};

// ================================================================== 15 — comments: arrows down + phone with the Wi-Fi X + "ابعته" send icon
export const B15: React.FC<BoardProps> = ({t, ev}) => {
  const [write = 2.6, send = 4.7] = ev; // "اكتب", "وابعت"
  const xk = popIn(t - 0.3, 0.3);
  return (
    <Scene bg={BG_NIGHT} html={<>
      {t > send && <Pill x={300} y={430} s={popIn(t - send)} size={60}>ابعته</Pill>}
    </>}>
      <Dots t={t} color="#9EC7FF" o={0.18} />
      <Phone x={690} y={560 + Math.sin(t * 2.2) * 14} w={260} h={470} kind="wifi" xk={xk} rot={-6} glow={0.4} t={t} />
      {t > write && [0, 1, 2].map((i) => (
        <ArrowDown key={i} x={200 + i * 340} y={850 + ((t * 2 + i * 0.3) % 1) * 50} s={0.8 * popIn(t - write - i * 0.12)} color={i === 1 ? RED : YEL} />
      ))}
      {t > send && <SendIcon x={300 + Math.sin(t * 3) * 10} y={600 - ((t - send) * 20) % 30} s={popIn(t - send) * 1.1} rot={-10} />}
      <Floor />
    </Scene>
  );
};

// ================================================================== 16 — "الفهمان كسبان": gold glow, then back to the hook phone (loop to frame 0)
export const B16: React.FC<BoardProps> = ({t, d}) => {
  const toHook = clamp((t - (d - 0.3)) / 0.28);
  return (
    <>
      <Scene bg="radial-gradient(circle at 50% 40%,#5A4200 0%,#1E1500 75%)">
        {Array.from({length: 24}, (_, i) => (
          <circle key={i} cx={rand(i) * W} cy={(rand(i + 3) * 1150 + t * 120) % 1150} r={4 + rand(i + 8) * 6} fill={YEL} opacity={0.6} />
        ))}
        <Phone x={690} y={530} w={280} h={500} kind="wifi" xk={0} rot={-6} glow={0.3} />
        <Floor />
      </Scene>
      <div style={{position: 'absolute', inset: 0, opacity: toHook}}>
        <B1 t={0} d={3} ev={[99]} />
      </div>
    </>
  );
};

export const BOARDS = [B1, B2, B3, B4, B5, B6, B7, B8, B9, B10, B11, B12, B13, B14, B15, B16];
