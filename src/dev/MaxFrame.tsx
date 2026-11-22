import React from 'react';
import { AbsoluteFill } from 'remotion';
import { MaxFigure, MaxFigureProps } from '../max/MaxFigure';
import { C } from '../max/theme';

// One full-size 1080x1920 frame of Max, for checking detail at upload resolution.
export const MaxFrame: React.FC<MaxFigureProps> = (props) => (
  <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 40%, #232755 0%, ${C.bg} 70%)` }}>
    <AbsoluteFill style={{ top: 260, height: 1600 }}>
      <MaxFigure {...props} />
    </AbsoluteFill>
  </AbsoluteFill>
);
