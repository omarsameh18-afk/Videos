import React from 'react';
import { Composition } from 'remotion';
import { ProofSheet, PROOF_SIZE } from './dev/ProofSheet';
import { RigTest } from './dev/RigTest';
import { MaxFrame } from './dev/MaxFrame';
import { VisualGallery } from './dev/VisualGallery';
import { BodyProbe } from './dev/BodyProbe';
import { PoseProbe, PROBE, PROBE_POSES, PROBE_EXPR } from './dev/PoseProbe';
import { MaxFigureProps } from './max/MaxFigure';
import { VIDEO } from './config';
import { Short, calculateShortMetadata } from './short/Short';
import { ShortProps } from './short/types';
import { SunVanishes, SUN_FRAMES } from './elfahman/SunVanishes';

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
    <Composition id="ElFahman12" component={SunVanishes} width={1080} height={1920} fps={30} durationInFrames={SUN_FRAMES} />
    <Composition id="ProofSheet" component={ProofSheet} {...PROOF_SIZE} fps={VIDEO.fps} durationInFrames={1} />
    <Composition id="BodyProbe" component={BodyProbe} width={2400} height={1800} fps={30} durationInFrames={1} />
    <Composition id="VisualGallery" component={VisualGallery} width={VIDEO.width} height={VIDEO.height} fps={VIDEO.fps} durationInFrames={60} defaultProps={{ which: 'split' as 'split' | 'number' | 'gauge' }} />
    <Composition id="PoseProbe" component={PoseProbe} width={PROBE.width} height={PROBE.height} fps={30} durationInFrames={PROBE_POSES.length * PROBE_EXPR.length} />
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
