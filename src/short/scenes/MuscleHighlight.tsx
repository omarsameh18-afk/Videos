import React from 'react';
import { AbsoluteFill } from 'remotion';
import { CONTENT } from '../layout';
import { headline } from './common';
import { SceneProps } from './types';

// Placeholder until the anatomy figure lands in Stage C.
export const MuscleHighlight: React.FC<SceneProps> = ({ scene }) => {
  if (scene.type !== 'MuscleHighlight') return null;
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: CONTENT.x, width: CONTENT.width, top: CONTENT.top + 60, textAlign: 'center', ...headline(120) }}>
        {scene.props.muscles.join(' + ')}
      </div>
    </AbsoluteFill>
  );
};
