import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../max/theme';
import type { BackgroundName } from '../config';
import { punchAt } from './camera';
import { FONT_BODY } from './fonts';

// VISUAL RULE 3: several backgrounds per Short (lab, gym floor, chalkboard). All zoom on camera punch-ins.

const Lab: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 38%, #262B63 0%, ${C.bg} 72%)` }}>
    <AbsoluteFill
      style={{
        opacity: 0.12,
        backgroundImage: 'linear-gradient(#8FA0FF 2px, transparent 2px), linear-gradient(90deg, #8FA0FF 2px, transparent 2px)',
        backgroundSize: '120px 120px',
        backgroundPosition: `0 ${(f * 0.6) % 120}px`,
      }}
    />
    <svg width={1080} height={1920} style={{ position: 'absolute', opacity: 0.16 }}>
      {[[160, 420], [880, 300], [820, 1500], [200, 1650]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y + Math.sin(f / 30 + i) * 10}) rotate(${f * 0.2 + i * 40})`} stroke="#B8FF2E" strokeWidth={5} fill="none">
          <polygon points="0,-60 52,-30 52,30 0,60 -52,30 -52,-30" />
          <line x1={52} y1={-30} x2={110} y2={-62} />
          <circle cx={118} cy={-66} r={12} />
        </g>
      ))}
    </svg>
  </AbsoluteFill>
);

const Gym: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill style={{ background: 'linear-gradient(#20232F 0%, #171923 62%, #101118 62.2%, #0B0C12 100%)' }}>
    {/* wall: lime stripe + rack silhouettes */}
    <div style={{ position: 'absolute', top: 1010, left: 0, right: 0, height: 26, background: C.accent, opacity: 0.85 }} />
    <div style={{ position: 'absolute', top: 1046, left: 0, right: 0, height: 8, background: C.accent, opacity: 0.35 }} />
    <svg width={1080} height={1920} style={{ position: 'absolute', opacity: 0.22 }}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i} transform={`translate(${120 + i * 170} 900)`} fill="#8C93B8">
          <rect x={-60} y={-10} width={120} height={14} rx={6} />
          <rect x={-72} y={-34} width={22} height={62} rx={6} />
          <rect x={50} y={-34} width={22} height={62} rx={6} />
        </g>
      ))}
      <rect x={60} y={940} width={960} height={14} rx={6} fill="#8C93B8" />
    </svg>
    {/* rubber floor tiles in perspective */}
    <svg width={1080} height={1920} style={{ position: 'absolute', opacity: 0.25 }}>
      {Array.from({ length: 13 }, (_, i) => (
        <line key={`v${i}`} x1={540 + (i - 6) * 90} y1={1192} x2={540 + (i - 6) * 330} y2={1920} stroke="#3A3F5C" strokeWidth={4} />
      ))}
      {[1250, 1340, 1460, 1620, 1820].map((y) => (
        <line key={y} x1={0} y1={y} x2={1080} y2={y} stroke="#3A3F5C" strokeWidth={4} />
      ))}
    </svg>
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 30%, rgba(184,255,46,${0.1 + Math.sin(f / 20) * 0.02}) 0%, transparent 55%)` }} />
  </AbsoluteFill>
);

const CHALK = ['F = m · a', 'ATP → ADP', 'MPS ↑', '∆ fibre', 'week 1 → 3', 'Σ volume'];
const Chalkboard: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 40%, #2C5240 0%, #1C3A2C 60%, #12271D 100%)' }}>
    <AbsoluteFill style={{ border: '26px solid #6B4A2B', boxShadow: 'inset 0 0 60px rgba(0,0,0,0.6)' }} />
    {CHALK.map((t, i) => (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: 70 + ((i * 337) % 760),
          top: 210 + i * 270 + Math.sin(f / 40 + i) * 4,
          transform: `rotate(${(i % 2 ? -1 : 1) * 6}deg)`,
          fontFamily: FONT_BODY,
          fontStyle: 'italic',
          fontWeight: 700,
          fontSize: 54,
          color: 'rgba(255,255,255,0.13)',
        }}
      >
        {t}
      </div>
    ))}
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 30% 70%, rgba(255,255,255,0.05) 0%, transparent 40%)' }} />
  </AbsoluteFill>
);

export const Background: React.FC<{ zoomKeys: { at: number; scale: number }[]; variant: BackgroundName }> = ({ zoomKeys, variant }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const z = 1 + 0.15 * punchAt(zoomKeys, f, fps);
  const V = variant === 'gym' ? Gym : variant === 'chalkboard' ? Chalkboard : Lab;
  return (
    <AbsoluteFill style={{ transform: `scale(${z})` }}>
      <V f={f} />
    </AbsoluteFill>
  );
};
