import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../../max/theme';
import { FONT_HEAD } from '../fonts';
import { GAUGE_SLAM } from '../visualTiming';

// Big meter; the needle slams from `from` to `to` (0-100) and settles with a bounce.
export const GaugeDial: React.FC<{ label: string; from: number; to: number; cx: number; cy: number; r: number; start?: number; pulse?: number }> = ({
  label, from, to, cx, cy, r, start = 0, pulse = 0,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  // SLAM: max -> target in < 0.4 s (stiff spring), then a decaying wobble around the target
  const t = spring({ frame: f - start, fps, config: { damping: 9, stiffness: 520, mass: 0.6 } });
  const since = Math.max(0, f - start - GAUGE_SLAM) / fps;
  const wobble = f - start > GAUGE_SLAM ? Math.sin(since * 22) * 7 * Math.exp(-since * 2.2) : 0;
  const v = Math.max(-5, from + (to - from) * t + Math.abs(wobble));
  const ang = Math.PI - (v / 100) * Math.PI; // 0 -> left, 100 -> right
  const zones = [
    { a: 0, b: 33, c: '#FF2E4D' },
    { a: 33, b: 66, c: '#FFC23D' },
    { a: 66, b: 100, c: C.accent },
  ];
  const pt = (val: number, rr: number) => [cx + Math.cos(Math.PI - (val / 100) * Math.PI) * rr, cy - Math.sin(Math.PI - (val / 100) * Math.PI) * rr];
  const arc = (a: number, b: number, rr: number) => {
    const [x1, y1] = pt(a, rr);
    const [x2, y2] = pt(b, rr);
    return `M ${x1} ${y1} A ${rr} ${rr} 0 0 1 ${x2} ${y2}`;
  };
  const k = f - start - GAUGE_SLAM;
  const shake = k >= 0 && k < 12 ? Math.sin(f * 2.9) * (12 - k) * 2.2 : 0;
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
      <g transform={`translate(${shake} 0) translate(${cx} ${cy}) scale(${1 + 0.04 * pulse}) translate(${-cx} ${-cy})`}>
        <path d={arc(0, 100, r + 26)} stroke="#0B0C1C" strokeWidth={96} fill="none" strokeLinecap="round" />
        {zones.map((z) => (
          <path key={z.a} d={arc(z.a + 0.6, z.b - 0.6, r)} stroke={z.c} strokeWidth={56} fill="none" />
        ))}
        {Array.from({ length: 11 }, (_, i) => {
          const [x1, y1] = pt(i * 10, r - 50);
          const [x2, y2] = pt(i * 10, r - (i % 5 === 0 ? 92 : 72));
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth={i % 5 === 0 ? 10 : 6} strokeLinecap="round" />;
        })}
        <text x={cx} y={cy - r * 0.38} textAnchor="middle" fontFamily={FONT_HEAD} fontSize={Math.round(r * 0.2)} fill="#fff" stroke="#0B0C1C" strokeWidth={10} paintOrder="stroke">
          {label.toUpperCase()}
        </text>
        <g transform={`rotate(${(-ang * 180) / Math.PI} ${cx} ${cy})`}>
          <path d={`M ${cx} ${cy - 16} L ${cx + r - 40} ${cy} L ${cx} ${cy + 16} Z`} fill={C.accent2} stroke="#0B0C1C" strokeWidth={7} strokeLinejoin="round" />
        </g>
        <circle cx={cx} cy={cy} r={34} fill="#0B0C1C" stroke="#fff" strokeWidth={8} />
      </g>
    </svg>
  );
};
