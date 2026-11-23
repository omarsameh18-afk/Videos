// الفهمان — code-drawn bust (head + shoulders + one gesture arm). viewBox 0 0 400 460.
import React from 'react';
import { interpolate } from 'remotion';

export type FExpr = 'smirk' | 'shocked' | 'thinking' | 'sad' | 'excited' | 'amazed' | 'neutral' | 'cold';
export type FGesture = 'none' | 'fingerUp' | 'chin' | 'temple';

const SKIN = '#C98A5E';
const SKIN_D = '#A8693F';
const HAIR = '#1B1512';
const HOODIE = '#1E8C74';
const HOODIE_D = '#156A57';

type Props = { expr: FExpr; gesture: FGesture; mouth: number; blink: number; wink: number; look?: { x: number; y: number }; gestureT?: number };

const BROWS: Record<FExpr, { l: number; r: number; y: number }> = {
  smirk: { l: -4, r: 10, y: 0 },
  neutral: { l: 0, r: 0, y: 0 },
  shocked: { l: -14, r: 14, y: -16 },
  amazed: { l: -10, r: 10, y: -12 },
  excited: { l: -8, r: 8, y: -10 },
  thinking: { l: 6, r: -14, y: -4 },
  sad: { l: 14, r: -14, y: -2 },
  cold: { l: 10, r: -10, y: 2 },
};

export const Fahman: React.FC<Props> = ({ expr, gesture, mouth, blink, wink, look = { x: 0, y: 0 }, gestureT = 1 }) => {
  const b = BROWS[expr];
  const wide = expr === 'shocked' || expr === 'amazed' || expr === 'excited';
  const eyeH = (wide ? 22 : 17) * (1 - blink);
  const pupR = expr === 'shocked' ? 6 : 8;
  const lx = look.x * 5;
  const ly = look.y * 5;
  const m = Math.max(0, Math.min(1, mouth));
  const g = gestureT;
  return (
    <svg viewBox="0 0 400 460" width="100%" height="100%" style={{ overflow: 'visible' }}>
      {/* shoulders / hoodie */}
      <path d="M40 460 C40 360 110 318 200 318 C290 318 360 360 360 460 Z" fill={HOODIE} />
      <path d="M150 322 C165 352 235 352 250 322 C240 340 160 340 150 322 Z" fill={HOODIE_D} />
      <path d="M182 348 L176 410 M218 348 L224 410" stroke="#F2F2F2" strokeWidth={5} strokeLinecap="round" />
      <circle cx={176} cy={414} r={5} fill="#F2F2F2" />
      <circle cx={224} cy={414} r={5} fill="#F2F2F2" />
      {/* neck */}
      <rect x={172} y={270} width={56} height={60} rx={18} fill={SKIN_D} />
      {/* ears */}
      <ellipse cx={108} cy={180} rx={16} ry={24} fill={SKIN_D} />
      <ellipse cx={292} cy={180} rx={16} ry={24} fill={SKIN_D} />
      {/* head */}
      <path d="M110 150 C110 70 160 40 200 40 C240 40 290 70 290 150 C290 230 255 290 200 290 C145 290 110 230 110 150 Z" fill={SKIN} />
      {/* hair with quiff */}
      <path d="M106 150 C98 80 140 30 200 28 C250 26 300 60 296 150 C286 120 276 104 258 98 C236 108 196 104 170 92 C150 104 128 118 106 150 Z" fill={HAIR} />
      <path d="M170 92 C180 50 240 34 270 58 C250 56 220 66 206 96 Z" fill={HAIR} />
      {/* brows */}
      <g transform={`translate(0 ${b.y})`}>
        <rect x={138} y={128} width={50} height={11} rx={5} fill={HAIR} transform={`rotate(${b.l} 163 133)`} />
        <rect x={212} y={128} width={50} height={11} rx={5} fill={HAIR} transform={`rotate(${b.r} 237 133)`} />
      </g>
      {/* eyes */}
      <g>
        <ellipse cx={163} cy={165} rx={17} ry={Math.max(1.5, eyeH)} fill="#fff" />
        {eyeH > 4 && <circle cx={163 + lx} cy={166 + ly} r={pupR} fill="#2A1B12" />}
        {wink > 0.5 ? (
          <path d="M220 168 Q237 156 254 168" stroke={HAIR} strokeWidth={5} fill="none" strokeLinecap="round" />
        ) : (
          <>
            <ellipse cx={237} cy={165} rx={17} ry={Math.max(1.5, eyeH)} fill="#fff" />
            {eyeH > 4 && <circle cx={237 + lx} cy={166 + ly} r={pupR} fill="#2A1B12" />}
          </>
        )}
      </g>
      {/* nose */}
      <path d="M200 175 C196 200 190 210 200 214 C206 216 212 212 212 208" stroke={SKIN_D} strokeWidth={5} fill="none" strokeLinecap="round" />
      {/* stubble */}
      <path d="M140 230 C160 280 240 280 260 230 C250 262 150 262 140 230 Z" fill="#3A2A20" opacity={0.18} />
      {/* mouth */}
      {expr === 'shocked' || expr === 'amazed' ? (
        <ellipse cx={200} cy={246} rx={14 + m * 6} ry={16 + m * 10} fill="#5A1E1E" />
      ) : m > 0.12 ? (
        <path d={`M172 240 Q200 ${244 + m * 34} 228 240 Q200 ${236 + m * 4} 172 240 Z`} fill="#5A1E1E" />
      ) : expr === 'sad' || expr === 'cold' ? (
        <path d="M178 252 Q200 238 222 252" stroke="#5A1E1E" strokeWidth={6} fill="none" strokeLinecap="round" />
      ) : expr === 'thinking' ? (
        <path d="M184 246 L218 242" stroke="#5A1E1E" strokeWidth={6} fill="none" strokeLinecap="round" />
      ) : expr === 'excited' ? (
        <path d="M172 238 Q200 274 228 238 Z" fill="#5A1E1E" />
      ) : (
        <path d="M176 244 Q204 256 228 234" stroke="#5A1E1E" strokeWidth={6} fill="none" strokeLinecap="round" />
      )}
      {/* gesture arm (his left = viewer right) */}
      {gesture !== 'none' && <Arm gesture={gesture} t={g} />}
    </svg>
  );
};

const Arm: React.FC<{ gesture: FGesture; t: number }> = ({ gesture, t }) => {
  // hand target per gesture; arm rises from the shoulder (330, 430)
  const targets: Record<Exclude<FGesture, 'none'>, { x: number; y: number }> = {
    fingerUp: { x: 360, y: 150 },
    chin: { x: 230, y: 300 },
    temple: { x: 300, y: 150 },
  };
  const tg = targets[gesture as Exclude<FGesture, 'none'>];
  const hx = interpolate(t, [0, 1], [350, tg.x]);
  const hy = interpolate(t, [0, 1], [480, tg.y]);
  const ex = (330 + hx) / 2 + 40;
  const ey = (440 + hy) / 2 + 30;
  return (
    <g>
      <path d={`M320 440 Q${ex} ${ey} ${hx} ${hy + 30}`} stroke={HOODIE} strokeWidth={54} fill="none" strokeLinecap="round" />
      <g transform={`translate(${hx} ${hy})`}>
        <circle cx={0} cy={22} r={26} fill={SKIN} />
        {gesture === 'fingerUp' && <rect x={-7} y={-40} width={15} height={56} rx={7} fill={SKIN} />}
        {gesture === 'temple' && <rect x={-30} y={-6} width={44} height={15} rx={7} fill={SKIN} transform="rotate(-30)" />}
        {gesture === 'chin' && <path d="M-22 10 Q0 -2 22 10" stroke={SKIN_D} strokeWidth={4} fill="none" />}
      </g>
    </g>
  );
};
