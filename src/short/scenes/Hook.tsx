import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../../max/theme';
import { CONTENT } from '../layout';
import { fitSize, headline } from './common';
import { SceneProps } from './types';

// Big bold text slams in on frame 0 (Max, shocked, is drawn by MaxLayer).
export const Hook: React.FC<SceneProps> = ({ scene }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lines = scene.onScreenText;
  const flash = interpolate(f, [0, 6], [0.5, 0], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: CONTENT.x, width: CONTENT.width, top: CONTENT.top, textAlign: 'center' }}>
        {lines.map((l, i) => {
          const s = spring({ frame: f - i * 5, fps, config: { damping: 9, stiffness: 260 } });
          const shake = i === lines.length - 1 && f < 16 ? Math.sin(f * 2.4) * (16 - f) * 0.6 : 0;
          return (
            <div
              key={i}
              style={{
                ...headline(fitSize(l, i === lines.length - 1 ? 150 : 124, CONTENT.width), i === lines.length - 1 ? C.accent : '#fff'),
                whiteSpace: 'nowrap',
                transform: `translateX(${shake}px) scale(${interpolate(s, [0, 1], [2.2, 1])})`,
                opacity: Math.min(1, s * 2),
              }}
            >
              {l}
            </div>
          );
        })}
      </div>
      <AbsoluteFill style={{ background: '#fff', opacity: flash }} />
    </AbsoluteFill>
  );
};
