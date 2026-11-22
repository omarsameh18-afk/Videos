import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { MaxFigure } from './MaxFigure';
import { Brow, ExpressionName, EXPRESSIONS } from './expressions';
import { blendPose, PoseDef, PoseName, POSES } from './poses';
import { blinkAmount } from './blink';
import { CharTiming, mouthAt } from './lipsync';

export interface Key<T> { at: number; value: T } // `at` = frame (local to this component)

export interface MaxProps {
  expression?: ExpressionName | Key<ExpressionName>[];
  pose?: PoseName | Key<PoseName>[];
  amplitude?: number[]; // per-frame loudness of the whole video (absolute frames)
  chars?: CharTiming[]; // ElevenLabs character timings (absolute seconds)
  frameOffset?: number; // absolute frame where this component's frame 0 sits
  seed?: number;
  showLegs?: boolean;
}

const toKeys = <T,>(v: T | Key<T>[]): Key<T>[] => (Array.isArray(v) ? [...v].sort((a, b) => a.at - b.at) : [{ at: 0, value: v }]);
const activeIndex = <T,>(keys: Key<T>[], frame: number) => {
  let i = 0;
  while (i + 1 < keys.length && keys[i + 1].at <= frame) i++;
  return i;
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpBrow = (a: Brow, b: Brow, t: number): Brow => ({ y: lerp(a.y, b.y, t), angle: lerp(a.angle, b.angle, t) });

/** Max with all automatic animation: lip-sync, blinking, brow springs, pose springs. */
export const Max: React.FC<MaxProps> = ({
  expression = 'neutral',
  pose = 'idle',
  amplitude,
  chars,
  frameOffset = 0,
  seed = 1,
  showLegs,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const abs = frame + frameOffset;

  // expression: brows spring from the previous expression (slight overshoot = "pop")
  const eKeys = toKeys(expression);
  const ei = activeIndex(eKeys, frame);
  const cur = eKeys[ei].value;
  const prev = ei > 0 ? eKeys[ei - 1].value : cur;
  const bt = ei > 0 ? spring({ frame: frame - eKeys[ei].at, fps, config: { damping: 9, stiffness: 220, mass: 0.6 } }) : 1;
  const brows = {
    browL: lerpBrow(EXPRESSIONS[prev].browL, EXPRESSIONS[cur].browL, bt),
    browR: lerpBrow(EXPRESSIONS[prev].browR, EXPRESSIONS[cur].browR, bt),
  };

  // pose: arms spring between poses
  const pKeys = toKeys(pose);
  const pi = activeIndex(pKeys, frame);
  const pt = pi > 0 ? spring({ frame: frame - pKeys[pi].at, fps, config: { damping: 14, stiffness: 160 } }) : 1;
  const poseDef: PoseDef = blendPose(POSES[pi > 0 ? pKeys[pi - 1].value : pKeys[pi].value], POSES[pKeys[pi].value], pt);

  return (
    <MaxFigure
      expression={cur}
      pose={poseDef}
      brows={brows}
      mouth={mouthAt(abs, fps, amplitude, cur, chars)}
      blink={blinkAmount(abs, fps, seed)}
      frame={abs}
      showLegs={showLegs}
    />
  );
};
