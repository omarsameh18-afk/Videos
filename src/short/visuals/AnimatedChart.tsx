import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../../max/theme';
import { FONT_HEAD } from '../fonts';
import { VIS_LOW, VIS_MAIN } from '../geometry';
import { CHART } from '../visualTiming';
import { VisualText } from './VisualText';

const COLORS: Record<string, string> = { lime: C.accent, pink: C.accent2, white: '#FFFFFF', blue: '#4DA3FF' };
interface Series { label: string; color: string; points: number[] }

// Line (or bar) chart that draws itself; series labels ride the line ends; optional marker.
export const ChartVisual: React.FC<{ kind: 'line' | 'bar'; xTicks: string[]; xLabel: string; series: Series[]; marker?: { at: number; label: string }; duration: number; pulse: number }> = ({
  kind, xTicks, xLabel, series, marker, duration, pulse,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const P = { x: VIS_MAIN.x + 30, y: VIS_MAIN.y + 150, w: VIS_MAIN.w - 60, h: VIS_MAIN.h - 200 };
  const n = xTicks.length;
  const X = (i: number) => P.x + (i / (n - 1)) * P.w;
  const Y = (v: number) => P.y + P.h - (v / 100) * P.h;
  const p = interpolate(f, [CHART.drawStart, CHART.drawStart + (duration - CHART.drawStart) * CHART.drawFrac], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const axisIn = spring({ frame: f, fps, config: { damping: 14, stiffness: 200, overshootClamping: true } });
  const markerOn = marker ? p >= marker.at / (n - 1) : false;
  const markerT = marker ? spring({ frame: f - Math.ceil(CHART.drawStart + (duration - CHART.drawStart) * CHART.drawFrac * (marker.at / (n - 1))), fps, config: { damping: 9, stiffness: 260 } }) : 0;
  return (
    <div style={{ position: 'absolute', inset: 0, transform: `scale(${1 + 0.03 * pulse})`, transformOrigin: '50% 30%' }}>
      <svg width={1080} height={1920} style={{ position: 'absolute', left: 0, top: 0 }}>
        <rect x={VIS_MAIN.x} y={VIS_MAIN.y} width={VIS_MAIN.w} height={VIS_MAIN.h} rx={36} fill="rgba(8,10,26,0.72)" stroke="rgba(255,255,255,0.18)" strokeWidth={4} opacity={axisIn} />
        {/* axes */}
        <path d={`M ${P.x} ${P.y - 20} L ${P.x} ${P.y + P.h} L ${P.x + P.w * axisIn} ${P.y + P.h}`} stroke="#fff" strokeWidth={8} fill="none" strokeLinecap="round" opacity={0.9} />
        {xTicks.map((_, i) => (
          <line key={i} x1={X(i)} x2={X(i)} y1={P.y + P.h} y2={P.y + P.h + 18} stroke="#fff" strokeWidth={5} opacity={0.6 * axisIn} />
        ))}
        {/* marker */}
        {marker && markerOn && (
          <g opacity={Math.min(1, markerT * 1.5)}>
            <line x1={X(marker.at)} x2={X(marker.at)} y1={P.y + P.h} y2={P.y + P.h - (P.h + 10) * markerT} stroke="#FFC23D" strokeWidth={8} strokeDasharray="18 14" />
          </g>
        )}
        {/* series */}
        {series.map((s, si) => {
          const col = COLORS[s.color];
          if (kind === 'bar') {
            const bw = (P.w / n) * 0.7 / series.length;
            return s.points.map((v, i) => {
              const h = (v / 100) * P.h * interpolate(p, [i / n, Math.min(1, (i + 1) / n)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
              return <rect key={`${si}-${i}`} x={X(i) - (bw * series.length) / 2 + si * bw} y={P.y + P.h - h} width={bw - 6} height={h} rx={8} fill={col} stroke="#0B0C1C" strokeWidth={5} />;
            });
          }
          const d = s.points.map((v, i) => `${i ? 'L' : 'M'} ${X(i)} ${Y(v)}`).join(' ');
          const k = Math.min(s.points.length - 1, Math.floor(p * (s.points.length - 1)));
          const frac = p * (s.points.length - 1) - k;
          const hx = k < s.points.length - 1 ? X(k) + (X(k + 1) - X(k)) * frac : X(k);
          const hy = k < s.points.length - 1 ? Y(s.points[k]) + (Y(s.points[k + 1]) - Y(s.points[k])) * frac : Y(s.points[k]);
          return (
            <g key={si}>
              <path d={d} pathLength={1} stroke="#0B0C1C" strokeWidth={26} fill="none" strokeDasharray={`${p} 1`} strokeLinecap="round" strokeLinejoin="round" />
              <path d={d} pathLength={1} stroke={col} strokeWidth={14} fill="none" strokeDasharray={`${p} 1`} strokeLinecap="round" strokeLinejoin="round" />
              {p > 0 && <circle cx={hx} cy={hy} r={18} fill={col} stroke="#0B0C1C" strokeWidth={6} />}
            </g>
          );
        })}
      </svg>
      {/* series labels (>= 64px): top-left / top-right of the plot */}
      {series.map((s, si) => (
        <div key={s.label} style={{ position: 'absolute', top: VIS_MAIN.y + 24, left: si === 0 ? VIS_MAIN.x + 30 : undefined, right: si === 0 ? undefined : 1080 - (VIS_MAIN.x + VIS_MAIN.w) + 30, fontFamily: FONT_HEAD, fontSize: 72, color: COLORS[s.color], WebkitTextStroke: '8px #0B0C1C', paintOrder: 'stroke fill', opacity: interpolate(p, [si * 0.25, si * 0.25 + 0.1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
          {s.label.toUpperCase()}
        </div>
      ))}
      {/* marker label + x label in the lower-left label area */}
      <div style={{ position: 'absolute', left: VIS_LOW.x, top: VIS_LOW.y, width: VIS_LOW.w }}>
        {marker && markerOn && (
          <div style={{ transform: `scale(${interpolate(markerT, [0, 1], [0.4, 1])})`, transformOrigin: 'left center' }}>
            <VisualText text={marker.label.toUpperCase()} width={VIS_LOW.w} max={120} color="#FFC23D" style={{ textAlign: 'left' }} />
          </div>
        )}
        {xLabel && !markerOn && <VisualText text={xLabel.toUpperCase()} width={VIS_LOW.w} max={80} color="#C9D0FF" style={{ textAlign: 'left' }} />}
      </div>
    </div>
  );
};
