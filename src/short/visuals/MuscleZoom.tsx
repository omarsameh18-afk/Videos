import React from 'react';
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../../max/theme';
import { VIS_MAIN } from '../geometry';
import { VisualText } from './VisualText';

const TEAR = { x: 470, y: 380 }; // tear cluster in muscle-art units (900 x 700)
const TEARS = [
  [430, 330], [500, 352], [455, 400], [520, 418], [470, 452], [410, 380], [540, 380],
];

// Flat muscle: zooms in on step 1, micro-tears glow; one label per step (sentence) underneath.
export const MuscleZoomVisual: React.FC<{ steps: string[]; stepAt: number[]; muscle: string; pulse: number }> = ({ steps, stepAt, muscle, pulse }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const zoomAt = stepAt[1] ?? 12;
  const enter = spring({ frame: f, fps, config: { damping: 14, stiffness: 180, overshootClamping: true } });
  const z = interpolate(f, [zoomAt, zoomAt + 12], [1, 2.1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) });
  const tearsOn = interpolate(f, [zoomAt + 6, zoomAt + 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const glow = 0.6 + 0.4 * Math.sin(f / 3);
  let step = 0;
  stepAt.forEach((a, i) => {
    if (f >= a) step = i;
  });
  const stepPop = spring({ frame: f - (stepAt[step] ?? 0), fps, config: { damping: 9, stiffness: 260 } });
  const sx = VIS_MAIN.w / 900;
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{ position: 'absolute', left: VIS_MAIN.x, top: VIS_MAIN.y, width: VIS_MAIN.w, height: VIS_MAIN.h, borderRadius: 36, overflow: 'hidden', background: 'rgba(8,10,26,0.72)', border: '4px solid rgba(255,255,255,0.18)', opacity: enter, transform: `scale(${(0.85 + 0.15 * enter) * (1 + 0.03 * pulse)})` }}>
        <svg width={VIS_MAIN.w} height={VIS_MAIN.h - 170} viewBox="0 0 900 700">
          <defs>
            <filter id="tearGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="9" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <clipPath id="belly">
              <path d="M 450 92 C 650 150 690 460 450 640 C 210 460 250 150 450 92 Z" />
            </clipPath>
          </defs>
          <g transform={`translate(${TEAR.x} ${TEAR.y}) scale(${z}) translate(${-TEAR.x} ${-TEAR.y})`}>
            {/* tendons */}
            <rect x={428} y={10} width={44} height={110} rx={20} fill="#F3E6D8" stroke="#0B0C1C" strokeWidth={6} />
            <rect x={428} y={600} width={44} height={90} rx={20} fill="#F3E6D8" stroke="#0B0C1C" strokeWidth={6} />
            {/* belly */}
            <path d="M 450 92 C 650 150 690 460 450 640 C 210 460 250 150 450 92 Z" fill="#E0566B" stroke="#0B0C1C" strokeWidth={8} />
            <g clipPath="url(#belly)" stroke="#B53A51" strokeWidth={7} fill="none" strokeLinecap="round">
              {[-150, -100, -50, 0, 50, 100, 150].map((o) => (
                <path key={o} d={`M ${450 + o * 0.35} 90 C ${450 + o * 1.25} 260 ${450 + o * 1.25} 470 ${450 + o * 0.35} 650`} />
              ))}
            </g>
            <path d="M 380 170 C 340 260 340 360 370 450" stroke="#FF8FA0" strokeWidth={12} fill="none" strokeLinecap="round" opacity={0.7} />
            {/* lime highlight outline */}
            <path d="M 450 92 C 650 150 690 460 450 640 C 210 460 250 150 450 92 Z" fill="none" stroke={C.accent} strokeWidth={10} opacity={tearsOn * 0.9} filter="url(#tearGlow)" />
            {/* micro-tears */}
            <g opacity={tearsOn} filter="url(#tearGlow)">
              {TEARS.map(([x, y], i) => (
                <path key={i} d={`M ${x - 14} ${y - 6} L ${x - 5} ${y + 4} L ${x + 3} ${y - 5} L ${x + 13} ${y + 5}`} stroke={i % 2 ? '#FFF6B0' : '#FFFFFF'} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.55 + 0.45 * Math.sin(f / 2.5 + i)} />
              ))}
              <circle cx={TEAR.x} cy={TEAR.y + 20} r={70} fill="#FFD25A" opacity={0.12 * glow} />
            </g>
          </g>
        </svg>
      </div>
      <div style={{ position: 'absolute', left: VIS_MAIN.x, top: VIS_MAIN.y + VIS_MAIN.h - 160, width: VIS_MAIN.w, transform: `scale(${interpolate(stepPop, [0, 1], [0.5, 1])})` }}>
        <VisualText text={(steps[Math.min(step, steps.length - 1)] ?? '').toUpperCase()} width={VIS_MAIN.w - 60} max={120} color={step === 0 ? '#FFFFFF' : C.accent} style={{ margin: '0 auto' }} />
      </div>
    </div>
  );
};
