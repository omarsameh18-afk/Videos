import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Background } from '../short/Background';
import { SplitVersusVisual } from '../short/visuals/SplitVersus';
import { BigNumberVisual } from '../short/visuals/BigNumber';
import { GaugeDial } from '../short/visuals/Gauge';
import { VIS_MAIN } from '../short/geometry';

// Dev check for the visuals not used in the example Short.
export const VisualGallery: React.FC<{ which: 'split' | 'number' | 'gauge' }> = ({ which }) => (
  <AbsoluteFill>
    <Background zoomKeys={[]} variant={which === 'split' ? 'lab' : which === 'number' ? 'chalkboard' : 'gym'} />
    {which === 'split' && <SplitVersusVisual wrong="Sore = growth" right="Progress = growth" wrongLabel="MYTH" rightLabel="FACT" revealAt={20} pulse={0} />}
    {which === 'number' && <BigNumberVisual value={48} decimals={0} prefix="" suffix="h" label="Protein synthesis window" pulse={0} />}
    {which === 'gauge' && <GaugeDial label="Effort" from={10} to={85} cx={VIS_MAIN.x + VIS_MAIN.w / 2} cy={VIS_MAIN.y + VIS_MAIN.h - 60} r={VIS_MAIN.w / 2 - 70} />}
  </AbsoluteFill>
);
