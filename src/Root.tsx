import React from 'react';
import { Composition, AbsoluteFill } from 'remotion';
import { Character, CharacterProps } from './character/Character';
import { C } from './character/theme';

const CharacterStill: React.FC<CharacterProps & { label?: string }> = ({ label, ...props }) => (
  <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 40%, #232755 0%, ${C.bg} 70%)` }}>
    <AbsoluteFill style={{ top: 300, height: 1560 }}>
      <Character {...props} />
    </AbsoluteFill>
    {label && (
      <div style={{ position: 'absolute', top: 120, width: '100%', textAlign: 'center', fontFamily: 'Arial Black, Arial', fontWeight: 900, fontSize: 90, color: C.accent, textTransform: 'uppercase', letterSpacing: 2 }}>
        {label}
      </div>
    )}
  </AbsoluteFill>
);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="CharacterStill"
      component={CharacterStill}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={1}
      defaultProps={{ expression: 'neutral', pose: 'idle', label: 'neutral' } as CharacterProps & { label?: string }}
    />
  </>
);
