import React from 'react';
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../../max/theme';
import { CARD_RECT } from '../layout';
import { headline } from './common';
import { SceneProps } from './types';

const R = CARD_RECT.StatCard;

// One card: big number (counts up, lands with a pop) + its one clear line underneath.
export const StatCard: React.FC<SceneProps> = ({ scene, timing, pulse }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (scene.type !== 'StatCard') return null;
  const { value, decimals, prefix, suffix, label } = scene.props;
  const land = timing.land ?? 18;
  const enter = spring({ frame: f, fps, config: { damping: 12, stiffness: 240, overshootClamping: true } });
  const count = interpolate(f, [2, land], [0, value], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const pop = spring({ frame: f - land, fps, config: { damping: 6, stiffness: 320 } });
  const longest = Math.max(...label.map((l) => l.length));
  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: R.x,
          top: R.y,
          width: R.w,
          height: R.h,
          borderRadius: 34,
          background: 'rgba(10,12,34,0.94)',
          border: `6px solid ${C.accent}`,
          boxShadow: '0 0 70px rgba(184,255,46,0.35), 0 14px 0 rgba(0,0,0,0.4)',
          transform: `translateX(${(1 - enter) * 600}px) scale(${interpolate(enter, [0, 1], [0.7, 1]) * (1 + 0.05 * pulse)})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '0 18px',
          boxSizing: 'border-box',
        }}
      >
        {prefix.trim() && <div style={headline(92, '#fff')}>{prefix.trim()}</div>}
        <div style={{ ...headline(260, C.accent), transform: `scale(${f >= land ? interpolate(pop, [0, 1], [1.3, 1]) : 1})` }}>
          {count.toFixed(decimals)}
          {suffix}
        </div>
        <div
          style={{
            marginTop: 14,
            ...headline(Math.min(48, Math.floor((R.w - 36) / (longest * 0.47))), '#fff'),
            lineHeight: 1.08,
            opacity: interpolate(f, [land, land + 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
          }}
        >
          {label.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
