import React from 'react';
import { Composition } from 'remotion';
import { ProofSheet, PROOF_SIZE } from './dev/ProofSheet';
import { RigTest } from './dev/RigTest';
import { MaxFrame } from './dev/MaxFrame';
import { MaxFigureProps } from './max/MaxFigure';
import { VIDEO } from './config';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="ProofSheet" component={ProofSheet} {...PROOF_SIZE} fps={VIDEO.fps} durationInFrames={1} />
    <Composition
      id="MaxFrame"
      component={MaxFrame}
      width={VIDEO.width}
      height={VIDEO.height}
      fps={VIDEO.fps}
      durationInFrames={1}
      defaultProps={{ expression: 'neutral', pose: 'idle' } as MaxFigureProps}
    />
    <Composition
      id="RigTest"
      component={RigTest}
      width={VIDEO.width}
      height={VIDEO.height}
      fps={VIDEO.fps}
      durationInFrames={300}
      defaultProps={{ amplitude: [] as number[] }}
    />
  </>
);
