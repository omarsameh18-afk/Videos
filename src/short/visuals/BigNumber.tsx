import React from 'react';
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../../max/theme';
import { VIS_MAIN } from '../geometry';
import { headline } from '../scenes/common';
import { NUMBER_LAND } from '../visualTiming';
import { VisualText } from './VisualText';

// One huge number counting up + a 3-word label.
export const BigNumberVisual: React.FC<{ value: number; decimals: number; prefix: string; suffix: string; label: string; pulse: number }> = ({
  value, decimals, prefix, suffix, label, pulse,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const count = interpolate(f, [2, NUMBER_LAND], [0, value], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const pop = spring({ frame: f - NUMBER_LAND, fps, config: { damping: 6, stiffness: 320 } });
  const text = `${prefix}${count.toFixed(decimals)}${suffix}`;
  const size = Math.min(520, Math.floor((VIS_MAIN.w - 60) / (Math.max(2, `${prefix}${value.toFixed(decimals)}${suffix}`.length) * 0.5)));
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{ position: 'absolute', left: VIS_MAIN.x, top: VIS_MAIN.y, width: VIS_MAIN.w, height: VIS_MAIN.h - 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...headline(size, C.accent), whiteSpace: 'nowrap', transform: `scale(${(f >= NUMBER_LAND ? interpolate(pop, [0, 1], [1.25, 1]) : 1) * (1 + 0.04 * pulse)})`, textShadow: '0 0 60px rgba(184,255,46,0.45), 0 14px 0 rgba(0,0,0,0.4)' }}>{text}</div>
      </div>
      <div style={{ position: 'absolute', left: VIS_MAIN.x, top: VIS_MAIN.y + VIS_MAIN.h - 200, width: VIS_MAIN.w, opacity: f >= NUMBER_LAND ? 1 : 0 }}>
        <VisualText text={label.toUpperCase()} width={VIS_MAIN.w - 60} max={110} style={{ margin: '0 auto' }} />
      </div>
    </div>
  );
};
