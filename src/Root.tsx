import React from 'react';
import { Composition } from 'remotion';
import { ProofSheet, PROOF_SIZE } from './dev/ProofSheet';
import { RigTest } from './dev/RigTest';
import { MaxFrame } from './dev/MaxFrame';
import { MaxFigureProps } from './max/MaxFigure';
import { VIDEO } from './config';
import { Short, calculateShortMetadata } from './short/Short';
import { ShortProps } from './short/types';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Short"
      component={Short}
      width={VIDEO.width}
      height={VIDEO.height}
      fps={VIDEO.fps}
      durationInFrames={1}
      calculateMetadata={calculateShortMetadata}
      defaultProps={{ durationInFrames: 1, scenes: [], words: [], pages: [], chars: [], amplitude: [], audioSrc: '', exprKeys: [], poseKeys: [], zoomKeys: [], shakes: [], emphasisWords: [] } as unknown as ShortProps}
    />
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
