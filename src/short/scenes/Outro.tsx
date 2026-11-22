import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { CHANNEL } from '../../config';
import { C } from '../../max/theme';
import { FONT_BODY } from '../fonts';
import { CONTENT } from '../layout';
import { headline } from './common';
import { SceneProps } from './types';

// Channel name + catchphrase (from config) with Max.
export const Outro: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame: f, fps, config: { damping: 10, stiffness: 200 } });
  const b = spring({ frame: f - 8, fps, config: { damping: 10, stiffness: 200 } });
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: CONTENT.x, width: CONTENT.width, top: CONTENT.top + 20, textAlign: 'center' }}>
        <div style={{ ...headline(170, '#fff'), transform: `scale(${interpolate(a, [0, 1], [0.4, 1])})`, opacity: a }}>
          BRAIN<span style={{ color: C.accent }}>PUMP</span>
        </div>
        <div style={{ ...headline(96, C.accent), marginTop: 14, transform: `translateY(${(1 - b) * 60}px)`, opacity: b }}>{CHANNEL.catchphrase}</div>
        <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 44, color: '#C9D0FF', marginTop: 18, opacity: b }}>{CHANNEL.handle}</div>
      </div>
    </AbsoluteFill>
  );
};
