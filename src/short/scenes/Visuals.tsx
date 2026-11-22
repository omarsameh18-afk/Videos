import React from 'react';
import { AbsoluteFill } from 'remotion';
import { ChartVisual } from '../visuals/AnimatedChart';
import { GaugeDial } from '../visuals/Gauge';
import { MuscleZoomVisual } from '../visuals/MuscleZoom';
import { SplitVersusVisual } from '../visuals/SplitVersus';
import { BigNumberVisual } from '../visuals/BigNumber';
import { VIS_MAIN } from '../geometry';
import { SceneProps } from './types';

const stepFrames = (timing: SceneProps['timing']) => (timing.sentences ?? [{ at: 0 }]).map((s) => Math.max(0, s.at));

export const AnimatedChart: React.FC<SceneProps> = ({ scene, timing, pulse }) =>
  scene.type !== 'AnimatedChart' ? null : (
    <AbsoluteFill>
      <ChartVisual {...scene.props} duration={timing.durationInFrames} pulse={pulse} />
    </AbsoluteFill>
  );

export const Gauge: React.FC<SceneProps> = ({ scene, pulse }) =>
  scene.type !== 'Gauge' ? null : (
    <AbsoluteFill>
      <GaugeDial {...scene.props} cx={VIS_MAIN.x + VIS_MAIN.w / 2} cy={VIS_MAIN.y + VIS_MAIN.h - 60} r={VIS_MAIN.w / 2 - 70} pulse={pulse} />
    </AbsoluteFill>
  );

export const MuscleZoom: React.FC<SceneProps> = ({ scene, timing, pulse }) =>
  scene.type !== 'MuscleZoom' ? null : (
    <AbsoluteFill>
      <MuscleZoomVisual steps={scene.props.steps} muscle={scene.props.muscle} stepAt={stepFrames(timing)} pulse={pulse} />
    </AbsoluteFill>
  );

export const SplitVersus: React.FC<SceneProps> = ({ scene, timing, pulse }) => {
  if (scene.type !== 'SplitVersus') return null;
  const steps = stepFrames(timing);
  const rev = (timing.sentences ?? []).find((s) => s.intent === 'reveal');
  return (
    <AbsoluteFill>
      <SplitVersusVisual {...scene.props} revealAt={rev ? Math.max(6, rev.at) : steps[steps.length - 1] || Math.round(timing.durationInFrames * 0.45)} pulse={pulse} />
    </AbsoluteFill>
  );
};

export const BigNumber: React.FC<SceneProps> = ({ scene, pulse }) =>
  scene.type !== 'BigNumber' ? null : (
    <AbsoluteFill>
      <BigNumberVisual {...scene.props} pulse={pulse} />
    </AbsoluteFill>
  );
