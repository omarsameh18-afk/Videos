import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { CHANNEL } from '../../config';
import { C } from '../../max/theme';
import { CONTENT } from '../layout';
import { headline } from './common';
import { SceneProps } from './types';

// <= 1.5 s: handle only. The narration ends on a line that loops back into the hook.
export const Outro: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame: f, fps, config: { damping: 9, stiffness: 260 } });
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: CONTENT.x, width: CONTENT.width, top: CONTENT.top + 10, textAlign: 'center' }}>
        <div style={{ ...headline(110, C.accent), transform: `scale(${interpolate(a, [0, 1], [0.5, 1])})`, opacity: a }}>{CHANNEL.handle}</div>
      </div>
    </AbsoluteFill>
  );
};
