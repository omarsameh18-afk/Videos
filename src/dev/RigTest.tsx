import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from 'remotion';
import { Max, Key } from '../max/Max';
import { ExpressionName } from '../max/expressions';
import { PoseName } from '../max/poses';
import { C } from '../max/theme';

const S = 30;
const expressions: Key<ExpressionName>[] = [
  { at: 0, value: 'neutral' },
  { at: 1.5 * S, value: 'shocked' },
  { at: 3 * S, value: 'angry' },
  { at: 4.5 * S, value: 'laughing' },
  { at: 6 * S, value: 'smug' },
  { at: 7.5 * S, value: 'thinking' },
  { at: 9 * S, value: 'neutral' },
];
const poses: Key<PoseName>[] = [
  { at: 0, value: 'idle' },
  { at: 1.5 * S, value: 'pointing' },
  { at: 3 * S, value: 'armsCrossed' },
  { at: 4.5 * S, value: 'thumbsUp' },
  { at: 6 * S, value: 'flexing' },
  { at: 7.5 * S, value: 'fingerUp' },
  { at: 9 * S, value: 'facepalm' },
];

// 10 s check of lip-sync (synthetic audio), blinking, brow springs and pose springs.
export const RigTest: React.FC<{ amplitude: number[] }> = ({ amplitude }) => {
  const frame = useCurrentFrame();
  const e = [...expressions].reverse().find((k) => k.at <= frame)!.value;
  const p = [...poses].reverse().find((k) => k.at <= frame)!.value;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 40%, #232755 0%, ${C.bg} 70%)` }}>
      <Audio src={staticFile('rigtest/test.mp3')} />
      <div style={{ position: 'absolute', top: 160, width: '100%', textAlign: 'center', fontFamily: 'Arial Black, Arial', fontWeight: 900, fontSize: 64, color: C.accent, textTransform: 'uppercase' }}>
        {e} · {p}
      </div>
      <AbsoluteFill style={{ top: 300, height: 1500 }}>
        <Max expression={expressions} pose={poses} amplitude={amplitude} seed={7} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
