// The 16 boards of "لو الشمس اختفت" — all drawn in code. Each board is a full 1080x1920 scene.
import React from 'react';
import { interpolate, spring, Easing } from 'remotion';

export type BoardProps = { f: number; d: number; ev: number[]; fps: number };
const W = 1080;
const H = 1920;
const cl = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.bezier(0.33, 1, 0.68, 1);
export const AR: React.CSSProperties = { fontFamily: 'Cairo', fontWeight: 900, direction: 'rtl' };

const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const Stars: React.FC<{ f: number; n?: number; o?: number }> = ({ f, n = 90, o = 1 }) => (
  <g opacity={o}>
    {Array.from({ length: n }, (_, i) => (
      <circle key={i} cx={rnd(i) * W} cy={rnd(i + 500) * H} r={1 + rnd(i + 900) * 2.6} fill="#fff" opacity={0.35 + 0.65 * Math.abs(Math.sin(f / 18 + i))} />
    ))}
  </g>
);

const Sun: React.FC<{ cx: number; cy: number; r: number; f: number; o?: number }> = ({ cx, cy, r, f, o = 1 }) => (
  <g opacity={o}>
    <defs>
      <radialGradient id="sunGlow">
        <stop offset="0%" stopColor="#FFF6C8" stopOpacity={0.9} />
        <stop offset="45%" stopColor="#FFD54A" stopOpacity={0.45} />
        <stop offset="100%" stopColor="#FFB300" stopOpacity={0} />
      </radialGradient>
      <radialGradient id="sunBody">
        <stop offset="0%" stopColor="#FFFBE0" />
        <stop offset="60%" stopColor="#FFD23F" />
        <stop offset="100%" stopColor="#FF9F1C" />
      </radialGradient>
    </defs>
    <circle cx={cx} cy={cy} r={r * 4.2} fill="url(#sunGlow)" opacity={0.45 + 0.08 * Math.sin(f / 11)} />
    <circle cx={cx} cy={cy} r={r * 2.3} fill="url(#sunGlow)" />
    <ellipse cx={cx} cy={cy} rx={r * 4} ry={r * 0.07} fill="#FFF6C8" opacity={0.35} />
    <g transform={`rotate(${f * 0.6} ${cx} ${cy})`}>
      {Array.from({ length: 16 }, (_, i) => (
        <path key={i} d={`M${cx} ${cy - r * 1.18} L${cx - r * 0.12} ${cy - r * 1.55} L${cx + r * 0.12} ${cy - r * 1.55} Z`} fill="#FFC93C" transform={`rotate(${i * 22.5} ${cx} ${cy})`} />
      ))}
    </g>
    <circle cx={cx} cy={cy} r={r} fill="url(#sunBody)" />
  </g>
);

const Earth: React.FC<{ cx: number; cy: number; r: number; dark?: number }> = ({ cx, cy, r, dark = 0 }) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill="#2F80ED" />
    <path d={`M${cx - r * 0.6} ${cy - r * 0.3} q${r * 0.3} ${-r * 0.5} ${r * 0.7} ${-r * 0.2} q${r * 0.1} ${r * 0.4} ${-r * 0.3} ${r * 0.6} q${-r * 0.4} ${r * 0.1} ${-r * 0.4} ${-r * 0.4} Z`} fill="#3BB273" />
    <path d={`M${cx + r * 0.1} ${cy + r * 0.2} q${r * 0.4} ${-r * 0.1} ${r * 0.6} ${r * 0.2} q${-r * 0.1} ${r * 0.4} ${-r * 0.5} ${r * 0.4} Z`} fill="#3BB273" />
    <circle cx={cx} cy={cy} r={r} fill="#000" opacity={dark} />
  </g>
);

const Moon: React.FC<{ cx: number; cy: number; r: number; lit: number }> = ({ cx, cy, r, lit }) => (
  <g>
    <circle cx={cx} cy={cy} r={r * 1.8} fill="#FFF8D6" opacity={0.25 * lit} />
    <circle cx={cx} cy={cy} r={r} fill={`rgb(${Math.round(60 + 175 * lit)},${Math.round(60 + 170 * lit)},${Math.round(70 + 140 * lit)})`} />
    <circle cx={cx - r * 0.3} cy={cy - r * 0.2} r={r * 0.2} fill="#000" opacity={0.12} />
    <circle cx={cx + r * 0.3} cy={cy + r * 0.3} r={r * 0.14} fill="#000" opacity={0.12} />
  </g>
);

// Cairo skyline: Cairo Tower, a mosque with domes + minarets, blocks, the pyramids far away
const Skyline: React.FC<{ y: number; color: string; lights?: number }> = ({ y, color, lights = 0 }) => (
  <g>
    <path d={`M600 ${y - 60} L700 ${y - 190} L800 ${y - 60} Z M760 ${y - 60} L830 ${y - 150} L900 ${y - 60} Z`} fill={color} opacity={0.55} />
    <rect x={0} y={y - 90} width={W} height={H - y + 90} fill={color} />
    {[
      [20, 150, 110], [140, 120, 160], [270, 90, 120], [880, 130, 140], [960, 120, 190],
    ].map(([x, w, h], i) => (
      <rect key={i} x={x} y={y - 90 - h} width={w} height={h + 2} fill={color} />
    ))}
    {/* Cairo Tower */}
    <path d={`M455 ${y - 90} L470 ${y - 470} L490 ${y - 470} L505 ${y - 90} Z`} fill={color} />
    <path d={`M448 ${y - 470} Q480 ${y - 520} 512 ${y - 470} L505 ${y - 440} L455 ${y - 440} Z`} fill={color} />
    <rect x={477} y={y - 560} width={6} height={50} fill={color} />
    {/* mosque */}
    <path d={`M560 ${y - 90} L560 ${y - 170} Q640 ${y - 290} 720 ${y - 170} L720 ${y - 90} Z`} fill={color} />
    <rect x={540} y={y - 330} width={18} height={240} fill={color} />
    <path d={`M536 ${y - 330} L549 ${y - 380} L562 ${y - 330} Z`} fill={color} />
    <rect x={724} y={y - 330} width={18} height={240} fill={color} />
    <path d={`M720 ${y - 330} L733 ${y - 380} L746 ${y - 330} Z`} fill={color} />
    {lights > 0 &&
      Array.from({ length: 26 }, (_, i) => (
        <rect key={i} x={30 + rnd(i) * 1000} y={y - 60 - rnd(i + 40) * 160} width={10} height={14} fill="#FFE08A" opacity={lights * (rnd(i + 7) > 0.4 ? 1 : 0)} />
      ))}
  </g>
);

const Thermometer: React.FC<{ x: number; y: number; h: number; temp: number; min?: number; max?: number }> = ({ x, y, h, temp, min = -80, max = 40 }) => {
  const k = (temp - min) / (max - min);
  const zeroY = y + h - ((0 - min) / (max - min)) * h;
  const top = y + h - k * h;
  const cold = temp < 0;
  return (
    <g>
      <rect x={x - 46} y={y - 40} width={92} height={h + 80} rx={46} fill="#fff" stroke="#1d3557" strokeWidth={8} />
      <circle cx={x} cy={y + h + 70} r={74} fill="#fff" stroke="#1d3557" strokeWidth={8} />
      <rect x={x - 22} y={top} width={44} height={y + h + 40 - top} rx={22} fill={cold ? '#2D9CDB' : '#E63946'} />
      <circle cx={x} cy={y + h + 70} r={56} fill={cold ? '#2D9CDB' : '#E63946'} />
      {[40, 20, 0, -20, -40, -60, -80].map((t) => {
        const ty = y + h - ((t - min) / (max - min)) * h;
        return (
          <g key={t}>
            <rect x={x + 46} y={ty - 3} width={t === 0 ? 44 : 26} height={6} fill="#1d3557" />
            <text x={x + 100} y={ty + 14} fontSize={38} fontFamily="Cairo" fontWeight={800} fill="#fff" stroke="#1d3557" strokeWidth={6} paintOrder="stroke">
              {t}
            </text>
          </g>
        );
      })}
      <rect x={x - 90} y={zeroY - 2} width={180} height={4} fill="#1d3557" opacity={0.4} />
    </g>
  );
};

const Frost: React.FC<{ k: number }> = ({ k }) => (
  <g opacity={Math.min(1, k * 1.4)}>
    <defs>
      <radialGradient id="frostV" cx="50%" cy="45%" r="75%">
        <stop offset={`${Math.round(100 - k * 55)}%`} stopColor="#E8F7FF" stopOpacity={0} />
        <stop offset="100%" stopColor="#E8F7FF" stopOpacity={0.95} />
      </radialGradient>
    </defs>
    <rect width={W} height={H} fill="url(#frostV)" />
    {Array.from({ length: 22 }, (_, i) => {
      const side = i % 4;
      const t = rnd(i + 3);
      const [sx, sy, ang] = side === 0 ? [t * W, 0, 90] : side === 1 ? [W, t * H, 180] : side === 2 ? [t * W, H, 270] : [0, t * H, 0];
      const len = 80 + rnd(i + 11) * 260 * k;
      const a = ((ang + (rnd(i + 5) - 0.5) * 60) * Math.PI) / 180;
      const ex = sx + Math.cos(a) * len * k;
      const ey = sy + Math.sin(a) * len * k;
      return (
        <g key={i} stroke="#fff" strokeWidth={5} strokeLinecap="round" opacity={0.9}>
          <line x1={sx} y1={sy} x2={ex} y2={ey} />
          <line x1={(sx + ex) / 2} y1={(sy + ey) / 2} x2={(sx + ex) / 2 + Math.cos(a + 0.7) * 50 * k} y2={(sy + ey) / 2 + Math.sin(a + 0.7) * 50 * k} />
          <line x1={(sx + ex) / 2} y1={(sy + ey) / 2} x2={(sx + ex) / 2 + Math.cos(a - 0.7) * 50 * k} y2={(sy + ey) / 2 + Math.sin(a - 0.7) * 50 * k} />
        </g>
      );
    })}
  </g>
);

const Label: React.FC<{ x: number; y: number; text: string; size?: number; color?: string; bg?: string; s?: number }> = ({ x, y, text, size = 64, color = '#fff', bg = 'rgba(0,0,0,0.55)', s = 1 }) => (
  <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${s})`, ...AR, fontSize: size, color, background: bg, padding: '4px 30px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>
    {text}
  </div>
);

const Scene: React.FC<{ bg: string; children: React.ReactNode; html?: React.ReactNode }> = ({ bg, children, html }) => (
  <div style={{ position: 'absolute', inset: 0, background: bg, overflow: 'hidden' }}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
      {children}
    </svg>
    {html}
  </div>
);

const DAY_SKY = 'linear-gradient(180deg,#4FC3F7 0%,#8FD8FF 45%,#FFE3A3 80%,#FFC67A 100%)';

// 1 — bright sun over Cairo
export const B1: React.FC<BoardProps> = ({ f }) => (
  <Scene bg={DAY_SKY}>
    <Sun cx={540} cy={540 + Math.sin(f / 20) * 8} r={140 + Math.sin(f / 9) * 4} f={f} />
    <Skyline y={1260} color="#7A4E2D" />
    <rect x={0} y={1250} width={W} height={40} fill="#4FA3D8" opacity={0.7} />
  </Scene>
);

// 2 — sun pops, sky snaps black, moon fades a beat later
export const B2: React.FC<BoardProps> = ({ f, ev }) => {
  const off = ev[1] ?? 30;
  const moonOff = ev[2] ?? 90;
  const pop = interpolate(f, [off - 8, off - 3, off], [1, 1.25, 0], cl);
  const black = interpolate(f, [off, off + 3], [0, 1], cl);
  const flash = interpolate(f, [off - 1, off, off + 6], [0, 0.9, 0], cl);
  const moonO = interpolate(f, [moonOff, moonOff + 24], [1, 0], cl);
  return (
    <Scene bg={DAY_SKY}>
      <rect width={W} height={H} fill="#05060C" opacity={black} />
      <Stars f={f} o={black * 0.8} />
      <Sun cx={540} cy={540} r={140 * pop} f={f} o={pop > 0.02 ? 1 : 0} />
      {black > 0.5 && <Moon cx={800} cy={480} r={90} lit={moonO} />}
      <Skyline y={1260} color={black > 0.5 ? '#0B0D14' : '#7A4E2D'} lights={0} />
      <rect width={W} height={H} fill="#fff" opacity={flash} />
    </Scene>
  );
};

// 3 — dotted light ray Sun -> Earth, "٨ دقايق", Moon lit by the ray
export const B3: React.FC<BoardProps> = ({ f, d }) => {
  const k = interpolate(f, [8, d * 0.55], [0, 1], { ...cl, easing: ease });
  const sx = 900, sy = 700, ex = 230, ey = 900;
  const px = sx + (ex - sx) * k;
  const py = sy + (ey - sy) * k;
  const moonK = interpolate(f, [d * 0.6, d * 0.8], [0, 1], cl);
  return (
    <Scene
      bg="radial-gradient(circle at 80% 35%,#1B2350 0%,#070914 70%)"
      html={<Label x={520} y={620} text="٨ دقايق" size={84} color="#FFD23F" s={interpolate(f, [10, 22], [0, 1], { ...cl, easing: Easing.back(2) })} />}
    >
      <Stars f={f} />
      <Sun cx={sx} cy={sy} r={120} f={f} />
      <line x1={sx - 120} y1={sy + 36} x2={px} y2={py} stroke="#FFE066" strokeWidth={12} strokeDasharray="4 26" strokeDashoffset={-f * 3} strokeLinecap="round" />
      <circle cx={px} cy={py} r={18} fill="#FFF3B0" opacity={k < 1 ? 1 : 0} />
      <Earth cx={ex} cy={ey} r={95} />
      {k >= 1 && <line x1={sx - 120} y1={sy + 10} x2={230 + (330 - 230) * moonK} y2={720} stroke="#FFE066" strokeWidth={8} strokeDasharray="4 22" strokeDashoffset={-f * 3} strokeLinecap="round" opacity={0.8} />}
      <Moon cx={300} cy={700} r={42} lit={0.15 + 0.85 * moonK} />
    </Scene>
  );
};

// 4 — top view: Earth leaves its orbit and slides off straight
export const B4: React.FC<BoardProps> = ({ f, d, ev }) => {
  const cx = 540, cy = 780, R = 330;
  const leave = ev[1] ?? d * 0.3;
  const w = 0.045;
  const a0 = -Math.PI / 2;
  const aL = a0 + leave * w;
  const t = Math.max(0, f - leave);
  const ang = f < leave ? a0 + f * w : aL;
  let ex = cx + Math.cos(ang) * R;
  let ey = cy + Math.sin(ang) * R;
  // tangent direction at the leave point
  const tx = -Math.sin(aL), ty = Math.cos(aL);
  const v = 9;
  if (f >= leave) {
    ex += tx * t * v;
    ey += ty * t * v;
  }
  const lx = cx + Math.cos(aL) * R, ly = cy + Math.sin(aL) * R;
  const sunO = interpolate(f, [0, 10], [0.35, 0.35], cl);
  const lineK = interpolate(f, [ev[3] ?? d * 0.6, (ev[3] ?? d * 0.6) + 20], [0, 1], cl);
  return (
    <Scene
      bg="radial-gradient(circle at 50% 40%,#141A3A 0%,#05060C 75%)"
      html={lineK > 0 ? <Label x={540} y={900} text="خط مستقيم!" size={76} color="#FFD23F" s={lineK} /> : null}
    >
      <Stars f={f} n={70} />
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#9FB3FF" strokeWidth={5} strokeDasharray="14 16" opacity={0.6} />
      <circle cx={cx} cy={cy} r={90} fill="none" stroke="#FFD23F" strokeWidth={6} strokeDasharray="10 12" opacity={sunO + 0.3} />
      <path d={`M${cx - 40} ${cy - 40} L${cx + 40} ${cy + 40} M${cx + 40} ${cy - 40} L${cx - 40} ${cy + 40}`} stroke="#FF6B6B" strokeWidth={12} strokeLinecap="round" opacity={0.8} />
      {f >= leave && <line x1={lx} y1={ly} x2={ex} y2={ey} stroke="#FF6B6B" strokeWidth={10} strokeDasharray="22 14" strokeLinecap="round" />}
      <Earth cx={ex} cy={ey} r={62} dark={0.35} />
    </Scene>
  );
};

const Plant: React.FC<{ x: number; y: number; k: number; s: number; i: number; f: number }> = ({ x, y, k, s, i, f }) => {
  const sway = Math.sin(f / 14 + i) * 3 * (1 - k);
  const bend = k * (40 + i * 6);
  const green = [76, 175, 80];
  const brown = [141, 110, 62];
  const c = green.map((g, j) => Math.round(g + (brown[j] - g) * k));
  const col = `rgb(${c.join(',')})`;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={`M0 0 Q${sway} -60 ${bend * 0.9 + sway} ${-120 + bend * 0.9}`} stroke={col} strokeWidth={10} fill="none" strokeLinecap="round" />
      <g transform={`translate(${bend * 0.9 + sway} ${-120 + bend * 0.9}) rotate(${bend * 1.5})`}>
        <path d="M0 0 C-40 -20 -60 10 -70 30 C-40 30 -10 20 0 0 Z" fill={col} />
        <path d="M0 0 C40 -20 60 10 70 30 C40 30 10 20 0 0 Z" fill={col} />
      </g>
      <path d={`M${sway * 0.5} -60 C-30 -70 -50 -50 -56 ${-34 + k * 30}`} stroke={col} strokeWidth={8} fill="none" strokeLinecap="round" />
    </g>
  );
};

// 5 — "بعد كام يوم": small plants wilt
export const B5: React.FC<BoardProps> = ({ f, d }) => {
  const k = interpolate(f, [12, d * 0.85], [0, 1], { ...cl, easing: Easing.inOut(Easing.quad) });
  return (
    <Scene bg="linear-gradient(180deg,#0E1630 0%,#1C2541 55%,#2B2D42 100%)">
      <Stars f={f} n={50} o={0.6} />
      <rect x={0} y={880} width={W} height={H - 880} fill="#3E2C23" />
      <rect x={0} y={880} width={W} height={24} fill="#5A4032" />
      {[150, 340, 540, 740, 930].map((x, i) => (
        <Plant key={i} x={x} y={890} k={Math.max(0, Math.min(1, k * 1.2 - i * 0.05))} s={1.7 + (i % 2) * 0.3} i={i} f={f} />
      ))}
    </Scene>
  );
};

// 6 — "بعد أسبوع": thermometer under 0, frost creeps from the edges
export const B6: React.FC<BoardProps> = ({ f, d }) => {
  const temp = interpolate(f, [6, d * 0.6], [22, -20], { ...cl, easing: Easing.inOut(Easing.cubic) });
  const frost = interpolate(f, [d * 0.3, d], [0, 1], cl);
  return (
    <Scene
      bg="linear-gradient(180deg,#16324F 0%,#28536B 60%,#3D6F8A 100%)"
    >
      <Thermometer x={700} y={430} h={440} temp={temp} min={-80} max={40} />
      <Frost k={frost} />
    </Scene>
  );
};

// 7 — "بعد كام شهر": sea surface turns to ice with cracks
export const B7: React.FC<BoardProps> = ({ f, d }) => {
  const ice = interpolate(f, [8, d * 0.75], [0, 1], { ...cl, easing: Easing.inOut(Easing.quad) });
  const crack = interpolate(f, [d * 0.55, d * 0.95], [0, 1], cl);
  const waveA = 18 * (1 - ice);
  const wave = Array.from({ length: 28 }, (_, i) => `${i * 40},${900 + Math.sin(i / 2 + f / 8) * waveA}`).join(' L');
  return (
    <Scene bg="linear-gradient(180deg,#101C33 0%,#1C3050 50%,#0D2A45 100%)">
      <Stars f={f} n={40} o={0.5} />
      <path d={`M0 ${H} L${wave} L1120 ${H} Z`} fill="#0F4C81" />
      <path d={`M0 ${H} L${wave} L1120 ${H} Z`} fill="#CFEFFF" opacity={ice * 0.95} />
      <rect x={0} y={880} width={W} height={60 * ice} fill="#FFFFFF" opacity={ice * 0.6} />
      {Array.from({ length: 6 }, (_, i) => {
        const x0 = 90 + i * 180;
        const pts = [`${x0},905`, `${x0 + 40},990`, `${x0 - 10},1080`, `${x0 + 50},1180`, `${x0 + 10},1290`];
        const n = Math.max(0, Math.round(crack * pts.length));
        return n > 1 ? <polyline key={i} points={pts.slice(0, n).join(' ')} fill="none" stroke="#5B8DB8" strokeWidth={6} strokeLinejoin="round" /> : null;
      })}
    </Scene>
  );
};

// 8 — "بعد سنة": -70 and the Nile from above turns to white ice
export const B8: React.FC<BoardProps> = ({ f, d }) => {
  const temp = interpolate(f, [4, d * 0.45], [-20, -70], { ...cl, easing: Easing.out(Easing.cubic) });
  const ice = interpolate(f, [d * 0.35, d * 0.9], [0, 1], cl);
  const nile = 'M640 1500 C560 1360 700 1240 620 1100 C560 990 660 900 600 780 C560 700 520 640 470 560 C430 500 380 470 330 420 M470 560 C520 500 600 470 680 420';
  return (
    <Scene
      bg="linear-gradient(180deg,#C9B48A 0%,#B89F72 100%)"
      html={<Label x={830} y={760} text={"\u202A-70°\u202C"} size={110} color="#9BE7FF" bg="rgba(16,30,60,0.8)" s={interpolate(f, [d * 0.3, d * 0.42], [0, 1], { ...cl, easing: Easing.back(2) })} />}
    >
      <rect width={W} height={H} fill="#E9F4FF" opacity={ice * 0.75} />
      <path d={nile} fill="none" stroke="#2F80ED" strokeWidth={46} strokeLinecap="round" />
      <path d={nile} fill="none" stroke="#FFFFFF" strokeWidth={50} strokeLinecap="round" pathLength={1} strokeDasharray={`${ice} 1`} strokeDashoffset={0} />
      <path d="M260 440 L700 440 L640 300 L340 320 Z" fill="#2F80ED" opacity={0.25 * (1 - ice)} />
      <g transform="translate(0 -40)">
        <Thermometer x={200} y={520} h={400} temp={temp} min={-80} max={40} />
      </g>
    </Scene>
  );
};

// 9 — big tree still standing with a storage box inside its trunk
export const B9: React.FC<BoardProps> = ({ f }) => {
  const box = interpolate(f, [14, 30], [0, 1], { ...cl, easing: Easing.back(1.6) });
  const sway = Math.sin(f / 24) * 1.2;
  return (
    <Scene
      bg="linear-gradient(180deg,#0F1B33 0%,#2A3B5C 70%,#DDEBF7 70%,#F4F9FF 100%)"
      html={<Label x={820} y={830} text="مخزن أكل" size={60} color="#FFD23F" s={box} />}
    >
      <Stars f={f} n={40} o={0.5} />
      <g transform={`translate(0 -190) rotate(${sway} 540 1350)`}>
        <path d="M470 1350 L490 820 L590 820 L610 1350 Z" fill="#6B4226" />
        <path d="M500 900 L400 760 M580 900 L690 740" stroke="#6B4226" strokeWidth={36} strokeLinecap="round" />
        {[[540, 600, 260], [380, 700, 170], [700, 700, 180], [540, 450, 190]].map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill={['#2E7D32', '#388E3C', '#2E7D32', '#43A047'][i]} />
        ))}
        {[[460, 480], [640, 560], [400, 650], [580, 380], [720, 690]].map(([x, y], i) => (
          <ellipse key={i} cx={x} cy={y} rx={60} ry={22} fill="#fff" opacity={0.85} />
        ))}
        {/* cut-away window in the trunk */}
        <rect x={495} y={980} width={90} height={150} rx={20} fill="#3B2314" />
        <g transform={`translate(540 1055) scale(${box})`}>
          <rect x={-38} y={-30} width={76} height={60} rx={6} fill="#D9A55B" stroke="#7A4E2D" strokeWidth={5} />
          <line x1={-38} y1={-8} x2={38} y2={-8} stroke="#7A4E2D" strokeWidth={5} />
          <circle cx={-14} cy={-40} r={14} fill="#E63946" />
          <circle cx={12} cy={-42} r={12} fill="#F4A261" />
        </g>
      </g>
    </Scene>
  );
};

// 10 — thinking: hold through the mystery pause
export const B10: React.FC<BoardProps> = ({ f }) => (
  <Scene
    bg="radial-gradient(circle at 50% 40%,#2B2F4A 0%,#0A0C16 75%)"
    html={
      <div style={{ position: 'absolute', left: 0, right: 0, top: 380, textAlign: 'center', ...AR, fontSize: 420, color: '#FFD23F', transform: `scale(${1 + Math.sin(f / 7) * 0.05})`, textShadow: '0 0 60px rgba(255,210,63,0.5)' }}>
        ؟
      </div>
    }
  >
    <Stars f={f} n={50} o={0.4} />
  </Scene>
);

// 11 — "استنى ده الغريب جاي!" burst (punch-in + shake handled by the camera)
export const B11: React.FC<BoardProps> = ({ f }) => (
  <Scene bg="#FFC300">
    <g transform={`rotate(${f * 1.5} 540 820)`}>
      {Array.from({ length: 18 }, (_, i) => (
        <path key={i} d="M540 820 L520 -1400 L560 -1400 Z" fill="#FF8C00" transform={`rotate(${i * 20} 540 820) scale(1 1)`} />
      ))}
      {Array.from({ length: 18 }, (_, i) => (
        <path key={`b${i}`} d="M540 820 L380 -1400 L700 -1400 Z" fill="#FFAA00" opacity={0.55} transform={`rotate(${i * 20 + 10} 540 820)`} />
      ))}
    </g>
  </Scene>
);

// 12 — cross-section: ice on top, liquid water below, blanket
export const B12: React.FC<BoardProps> = ({ f, d, ev }) => {
  const bt = ev[ev.length - 1] ?? d * 0.62;
  const blanket = interpolate(f, [bt, bt + 12], [0, 1], { ...cl, easing: Easing.back(1.5) });
  return (
    <Scene
      bg="linear-gradient(180deg,#0B1024 0%,#1A2240 100%)"
      html={
        <>
          <Label x={540} y={650} text="تلج" size={60} color="#0B3C5D" bg="rgba(255,255,255,0.85)" />
          <Label x={540} y={900} text="مية سايلة" size={66} color="#fff" bg="rgba(0,60,120,0.7)" />
        </>
      }
    >
      <Stars f={f} n={40} o={0.5} />
      <rect x={0} y={400} width={W} height={230} fill="#DFF3FF" />
      <rect x={0} y={400} width={W} height={20} fill="#fff" />
      {Array.from({ length: 7 }, (_, i) => (
        <path key={i} d={`M${60 + i * 150} 440 l40 60 l-30 50`} stroke="#A9D6F5" strokeWidth={5} fill="none" />
      ))}
      <rect x={0} y={630} width={W} height={H - 630} fill="#1565C0" />
      <rect x={0} y={630} width={W} height={H - 630} fill="url(#deep)" />
      <defs>
        <linearGradient id="deep" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#42A5F5" />
          <stop offset="100%" stopColor="#0B2A5B" />
        </linearGradient>
      </defs>
      {Array.from({ length: 16 }, (_, i) => {
        const y = 1450 - ((f * (2 + rnd(i) * 2) + rnd(i + 3) * 800) % 800);
        return <circle key={i} cx={80 + rnd(i + 9) * 920 + Math.sin(f / 10 + i) * 10} cy={y} r={6 + rnd(i + 2) * 10} fill="#BFE6FF" opacity={0.5} />;
      })}
      {/* blanket lying on the ice */}
      <g transform={`translate(540 480) scale(${blanket * 1.15})`}>
        <path d="M-420 -30 Q-200 -70 0 -30 Q200 10 420 -30 L420 40 Q200 80 0 40 Q-200 0 -420 40 Z" fill="#E76F51" />
        {Array.from({ length: 8 }, (_, i) => (
          <line key={i} x1={-420 + i * 105} y1={-40} x2={-420 + i * 105} y2={50} stroke="#F4A261" strokeWidth={6} />
        ))}
        <path d="M-420 5 Q-200 -35 0 5 Q200 45 420 5" stroke="#F4A261" strokeWidth={6} fill="none" />
      </g>
      {/* warm glow under the blanket */}
      <rect x={0} y={630} width={W} height={120} fill="#FFB74D" opacity={0.18 * blanket} />
    </Scene>
  );
};

// 13 — ocean floor: glowing vent, tube worms, shrimp (most colorful board)
export const B13: React.FC<BoardProps> = ({ f }) => {
  const glow = 0.75 + Math.sin(f / 6) * 0.2;
  return (
    <Scene bg="linear-gradient(180deg,#05162E 0%,#0A2A4F 50%,#0B3B5E 100%)">
      <g transform="translate(0 -290)">
      <defs>
        <radialGradient id="ventGlow">
          <stop offset="0%" stopColor="#FFF176" stopOpacity={1} />
          <stop offset="35%" stopColor="#FF9800" stopOpacity={0.8} />
          <stop offset="100%" stopColor="#FF5722" stopOpacity={0} />
        </radialGradient>
      </defs>
      {Array.from({ length: 30 }, (_, i) => (
        <circle key={i} cx={rnd(i) * W} cy={(rnd(i + 30) * 1200 + 200 - f * (0.6 + rnd(i) * 0.8) + 2400) % 1200 + 200} r={3 + rnd(i + 60) * 5} fill={['#00E5FF', '#76FF03', '#E040FB', '#FFEA00'][i % 4]} opacity={0.7} />
      ))}
      <path d={`M0 1180 Q270 1120 540 1170 Q810 1220 1080 1150 L1080 ${H + 300} L0 ${H + 300} Z`} fill="#3E2723" />
      <defs>
        <filter id="bloom" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="28" /></filter>
        <radialGradient id="jelly"><stop offset="0%" stopColor="#fff" stopOpacity={0.9} /><stop offset="100%" stopColor="#E040FB" stopOpacity={0.2} /></radialGradient>
      </defs>
      {/* far reef silhouettes (depth layer) */}
      <path d="M0 1120 Q90 980 170 1060 Q240 940 330 1080 L330 1200 L0 1200 Z" fill="#0E3A5C" />
      <path d="M760 1090 Q840 960 920 1050 Q990 930 1080 1040 L1080 1200 L760 1200 Z" fill="#0E3A5C" />
      <circle cx={540} cy={820} r={520 * glow} fill="#FF6D00" opacity={0.22} filter="url(#bloom)" />
      <circle cx={540} cy={760} r={380 * glow} fill="url(#ventGlow)" opacity={0.9} />
      {/* jellyfish */}
      {[[180, 560, '#E040FB', 0], [900, 470, '#00E5FF', 1], [760, 700, '#76FF03', 2]].map(([x, y, c, i]) => {
        const bob = Math.sin(f / 14 + (i as number) * 2) * 22;
        return (
          <g key={i as number} transform={`translate(${x} ${(y as number) + bob})`}>
            <circle r={70} fill={c as string} opacity={0.25} filter="url(#bloom)" />
            <path d="M-46 0 Q-46 -50 0 -50 Q46 -50 46 0 Q23 12 0 4 Q-23 12 -46 0 Z" fill="url(#jelly)" stroke={c as string} strokeWidth={4} />
            {[-30, -10, 10, 30].map((dx, k) => <path key={k} d={`M${dx} 6 q ${Math.sin(f / 8 + k) * 10} 30 0 60 q ${-Math.sin(f / 8 + k) * 10} 30 0 60`} stroke={c as string} strokeWidth={4} fill="none" opacity={0.8} />)}
          </g>
        );
      })}
      {/* corals + anemones in front of the reef */}
      {[[110, '#FF4081'], [200, '#FFEA00'], [880, '#00E676'], [970, '#FF9100']].map(([x, c], i) => (
        <g key={i} transform={`translate(${x} 1175)`}>
          {[-40, -15, 15, 40].map((a, k) => <path key={k} d={`M0 0 Q ${a * 0.6} -60 ${a * 1.4 + Math.sin(f / 16 + k + i) * 6} -130`} stroke={c as string} strokeWidth={14} fill="none" strokeLinecap="round" />)}
          {[-40, -15, 15, 40].map((a, k) => <circle key={`c${k}`} cx={a * 1.4 + Math.sin(f / 16 + k + i) * 6} cy={-134} r={11} fill="#fff" opacity={0.85} />)}
        </g>
      ))}
      {/* smoke plume */}
      {Array.from({ length: 10 }, (_, i) => {
        const t = ((f * 2 + i * 40) % 400) / 400;
        return <circle key={i} cx={540 + Math.sin(t * 6 + i) * 40 * t} cy={880 - t * 520} r={40 + t * 90} fill="#4E342E" opacity={0.55 * (1 - t)} />;
      })}
      <path d="M470 1190 L500 900 L580 900 L610 1190 Z" fill="#5D4037" />
      <path d="M490 960 L590 960 M480 1060 L600 1060" stroke="#FF7043" strokeWidth={8} opacity={glow} />
      <ellipse cx={540} cy={900} rx={46} ry={14} fill="#FFEB3B" opacity={glow} />
      {/* tube worms */}
      {[300, 350, 400, 680, 730, 780, 830, 250].map((x, i) => {
        const h = 160 + rnd(i) * 120;
        const sw = Math.sin(f / 12 + i) * 10;
        return (
          <g key={i}>
            <path d={`M${x} 1185 Q${x + sw * 0.5} ${1185 - h / 2} ${x + sw} ${1185 - h}`} stroke="#F5F5F5" strokeWidth={22} fill="none" strokeLinecap="round" />
            <ellipse cx={x + sw} cy={1185 - h - 18} rx={20} ry={32} fill="#FF1744" />
            <ellipse cx={x + sw} cy={1185 - h - 26} rx={11} ry={16} fill="#FF8A80" />
          </g>
        );
      })}
      {/* shrimp */}
      {[[200, 1080, 1], [880, 1040, -1], [640, 1110, 1]].map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x + Math.sin(f / 15 + i) * 30} ${y}) scale(${s} 1)`}>
          <path d="M-50 0 C-30 -40 30 -40 50 0 C30 -10 -30 -10 -50 0 Z" fill="#FF80AB" />
          <path d="M-50 0 L-75 -18 L-72 12 Z" fill="#FF4081" />
          <circle cx={36} cy={-12} r={5} fill="#000" />
          <path d="M48 -6 Q90 -40 110 -20 M48 -4 Q86 -20 104 0" stroke="#FF80AB" strokeWidth={3} fill="none" />
        </g>
      ))}
          </g>
    </Scene>
  );
};

// 14 — "يعني لو الشمس اختفت… ممكن متاخدش بالها خالص!"
export const B14: React.FC<BoardProps> = ({ f, ev }) => {
  const off = ev[1] ?? 40;
  const sunO = interpolate(f, [0, off - 6, off], [1, 1, 0], cl);
  const zz = interpolate(f, [off, off + 12], [0, 1], { ...cl, easing: Easing.back(2) });
  return (
    <Scene bg="linear-gradient(180deg,#000 0%,#05162E 40%,#0A2A4F 100%)">
      <g transform="translate(0 -290)">
      <Sun cx={540} cy={720} r={80} f={f} o={sunO} />
      <line x1={0} y1={520} x2={W} y2={520} stroke="#4FC3F7" strokeWidth={4} strokeDasharray="20 14" opacity={0.6} />
      <path d={`M0 1180 Q270 1120 540 1170 Q810 1220 1080 1150 L1080 ${H + 300} L0 ${H + 300} Z`} fill="#3E2723" />
      <circle cx={600} cy={1000} r={240} fill="#FF9800" opacity={0.3} />
      <path d="M560 1190 L580 1000 L640 1000 L660 1190 Z" fill="#5D4037" />
      {[440, 490, 740, 790].map((x, i) => {
        const sw = Math.sin(f / 12 + i) * 8;
        return (
          <g key={i}>
            <path d={`M${x} 1185 Q${x + sw / 2} 1100 ${x + sw} 1010`} stroke="#F5F5F5" strokeWidth={20} fill="none" strokeLinecap="round" />
            <ellipse cx={x + sw} cy={995} rx={18} ry={28} fill="#FF1744" />
          </g>
        );
      })}
      <text x={820} y={900} fontSize={80} fontFamily="Cairo" fontWeight={900} fill="#fff" opacity={zz} transform={`translate(${820 * (1 - zz)} ${900 * (1 - zz)}) scale(${zz})`}>
        z Z
      </text>
          </g>
    </Scene>
  );
};

// 15 — comment arrows + countdown chip again
export const B15: React.FC<BoardProps> = ({ f }) => {
  const bob = Math.sin(f / 5) * 14;
  return (
    <Scene bg="linear-gradient(180deg,#4FC3F7 0%,#8FD8FF 55%,#FFE3A3 100%)">
      <Sun cx={540} cy={560} r={110} f={f} />
      <Skyline y={1260} color="#7A4E2D" />
      {/* speech bubble */}
      <g transform={`translate(540 ${880 + bob * 0.3})`}>
        <path d="M-200 -110 h400 a40 40 0 0 1 40 40 v140 a40 40 0 0 1 -40 40 h-260 l-70 60 l10 -60 h-80 a40 40 0 0 1 -40 -40 v-140 a40 40 0 0 1 40 -40 Z" fill="#fff" stroke="#1d3557" strokeWidth={8} />
        {[-110, 0, 110].map((x) => (
          <circle key={x} cx={x} cy={0} r={22} fill="#1d3557" />
        ))}
      </g>
      {/* arrows toward the Shorts comment button (right side) */}
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${800 + i * 40 + bob} ${1290 + i * 60 + bob}) rotate(35)`} opacity={0.6 + 0.4 * Math.abs(Math.sin(f / 6 + i))}>
          <path d="M0 -20 L70 -20 L70 -46 L120 0 L70 46 L70 20 L0 20 Z" fill="#E63946" stroke="#fff" strokeWidth={6} />
        </g>
      ))}
    </Scene>
  );
};

// 16 — "الفهمان كسبان" gold caption; last frames return to the bright sun (loop to frame 0)
export const B16: React.FC<BoardProps> = ({ f, d }) => {
  const toSun = interpolate(f, [d - 10, d - 1], [0, 1], cl);
  return (
    <>
      <Scene bg="radial-gradient(circle at 50% 45%,#3A2A00 0%,#120C00 75%)">
        {Array.from({ length: 24 }, (_, i) => (
          <circle key={i} cx={rnd(i) * W} cy={(rnd(i + 3) * H + f * 4) % H} r={4 + rnd(i + 8) * 6} fill="#FFD23F" opacity={0.6} />
        ))}
      </Scene>
      <div style={{ position: 'absolute', inset: 0, opacity: toSun }}>
        <B1 f={f} d={d} ev={[]} fps={30} />
      </div>
    </>
  );
};

export const BOARDS = [B1, B2, B3, B4, B5, B6, B7, B8, B9, B10, B11, B12, B13, B14, B15, B16];
