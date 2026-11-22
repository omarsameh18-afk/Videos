import React from 'react';
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../../max/theme';
import { FONT_BODY } from '../fonts';
import { CONTENT } from '../layout';
import { headline } from './common';
import { SceneProps } from './types';

// Big animated number (counts up) + label lines.
export const StatCard: React.FC<SceneProps> = ({ scene }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (scene.type !== 'StatCard') return null;
  const { value, decimals, prefix, suffix, label } = scene.props;
  const enter = spring({ frame: f, fps, config: { damping: 12, stiffness: 170 } });
  const count = interpolate(f, [4, 4 + fps * 0.9], [0, value], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const done = spring({ frame: f - (4 + fps * 0.9), fps, config: { damping: 7, stiffness: 300 } });
  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: CONTENT.x,
          width: CONTENT.width,
          top: CONTENT.top + 40,
          height: 760,
          borderRadius: 44,
          background: 'rgba(10,12,34,0.78)',
          border: `6px solid ${C.accent}`,
          boxShadow: `0 0 80px rgba(184,255,46,0.35), 0 16px 0 rgba(0,0,0,0.4)`,
          transform: `scale(${interpolate(enter, [0, 1], [0.6, 1])})`,
          opacity: enter,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <div style={{ ...headline(300, C.accent), transform: `scale(${f > 4 + fps * 0.9 ? interpolate(done, [0, 1], [1.15, 1]) : 1})` }}>
          {prefix}
          {count.toFixed(decimals)}
          {suffix}
        </div>
        <div style={{ marginTop: 20 }}>
          {label.map((l, i) => (
            <div key={i} style={{ fontFamily: FONT_BODY, fontWeight: 900, fontSize: 46, color: '#fff', lineHeight: 1.3, whiteSpace: 'nowrap', opacity: interpolate(f, [10 + i * 5, 18 + i * 5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
              {l}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
