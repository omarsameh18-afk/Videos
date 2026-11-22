import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { CHANNEL } from '../../config';
import { C } from '../../max/theme';
import { FONT_BODY } from '../fonts';
import { END_HANDLE_Y, END_TEXT } from '../geometry';
import { headline } from './common';
import { SceneProps } from './types';

// End card: the loop line is the HERO (huge); the handle is small at the bottom. Captions are hidden here
// (the hero text IS the line being said).
export const Outro: React.FC<SceneProps> = ({ scene, pulse }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = scene.narration.trim().toUpperCase().split(/\s+/);
  const lines = words.length > 2 ? [words.slice(0, -1).join(' '), words[words.length - 1]] : [words.join(' ')];
  const longest = Math.max(...lines.map((l) => l.length));
  const size = Math.min(260, Math.floor((END_TEXT.w - 40) / (longest * 0.47)));
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: END_TEXT.x, top: END_TEXT.y, width: END_TEXT.w, height: END_TEXT.h, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {lines.map((l, i) => {
          const s = spring({ frame: f - i * 4, fps, config: { damping: 11, stiffness: 300, overshootClamping: true } });
          return (
            <div key={i} style={{ ...headline(size, i === lines.length - 1 ? C.accent : '#fff'), whiteSpace: 'nowrap', transform: `scale(${interpolate(s, [0, 1], [0.4, 1]) * (1 + 0.03 * pulse)})`, opacity: s }}>
              {l}
            </div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', left: 0, width: 1080, top: END_HANDLE_Y, textAlign: 'center', fontFamily: FONT_BODY, fontWeight: 800, fontSize: 40, color: '#E8ECFF', opacity: interpolate(f, [6, 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
        {CHANNEL.handle}
      </div>
    </AbsoluteFill>
  );
};
