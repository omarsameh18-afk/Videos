import React from 'react';
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../../max/theme';
import { FONT_BODY } from '../fonts';
import { COLUMN, CONTENT } from '../layout';
import { headline } from './common';
import { SceneProps } from './types';

// Big number (counts up, lands with a pop) + one clear line.
export const StatCard: React.FC<SceneProps> = ({ scene, timing }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (scene.type !== 'StatCard') return null;
  const { value, decimals, prefix, suffix, label } = scene.props;
  const land = timing.land ?? 18;
  const enter = spring({ frame: f, fps, config: { damping: 12, stiffness: 240 } });
  const count = interpolate(f, [2, land], [0, value], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const pop = spring({ frame: f - land, fps, config: { damping: 6, stiffness: 320 } });
  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: COLUMN.x,
          width: COLUMN.width,
          top: COLUMN.top + 130,
          height: 560,
          borderRadius: 36,
          background: 'rgba(10,12,34,0.92)',
          border: `6px solid ${C.accent}`,
          boxShadow: '0 0 70px rgba(184,255,46,0.35), 0 14px 0 rgba(0,0,0,0.4)',
          transform: `translateX(${(1 - enter) * 700}px) scale(${interpolate(enter, [0, 1], [0.7, 1])})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '0 24px',
          boxSizing: 'border-box',
        }}
      >
        {prefix.trim() && <div style={headline(96, '#fff')}>{prefix.trim()}</div>}
        <div style={{ ...headline(300, C.accent), transform: `scale(${f >= land ? interpolate(pop, [0, 1], [1.3, 1]) : 1})` }}>
          {count.toFixed(decimals)}
          {suffix}
        </div>
      </div>
      {/* the one clear line: full-width banner above the card */}
      <div
        style={{
          position: 'absolute',
          left: CONTENT.x,
          width: CONTENT.width,
          top: CONTENT.top,
          height: 96,
          borderRadius: 20,
          background: C.accent,
          border: '5px solid #0B0C1C',
          boxShadow: '0 8px 0 rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONT_BODY,
          fontWeight: 900,
          fontSize: Math.min(46, Math.floor(860 / (label.join(' ').length * 0.62))),
          whiteSpace: 'nowrap',
          color: '#0B0C1C',
          transform: `scale(${interpolate(spring({ frame: f - land, fps, config: { damping: 10, stiffness: 260 } }), [0, 1], [0.6, 1])})`,
          opacity: f >= land ? 1 : 0,
        }}
      >
        {label.join(' ')}
      </div>
    </AbsoluteFill>
  );
};
