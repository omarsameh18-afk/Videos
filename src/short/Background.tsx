import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C } from '../max/theme';

// Default theme: navy gradient + slowly drifting lab grid. (More themes come with the variation system.)
export const Background: React.FC = () => {
  const f = useCurrentFrame();
  const drift = (f * 0.6) % 120;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 38%, #262B63 0%, ${C.bg} 72%)` }}>
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
