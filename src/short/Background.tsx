import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../max/theme';
import { punchAt } from './camera';

// Default theme: navy gradient + drifting lab grid. The camera punch-in zooms the background 100->115%.
export const Background: React.FC<{ zoomKeys: { at: number; scale: number }[] }> = ({ zoomKeys }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const drift = (f * 0.6) % 120;
  const z = 1 + 0.15 * punchAt(zoomKeys, f, fps);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 38%, #262B63 0%, ${C.bg} 72%)`, transform: `scale(${z})` }}>
      <AbsoluteFill
        style={{
          opacity: 0.12,
          backgroundImage: 'linear-gradient(#8FA0FF 2px, transparent 2px), linear-gradient(90deg, #8FA0FF 2px, transparent 2px)',
          backgroundSize: '120px 120px',
          backgroundPosition: `0 ${drift}px`,
        }}
      />
    </AbsoluteFill>
  );
};
