import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Max, Key } from '../max/Max';
import { ExpressionName } from '../max/expressions';
import { PoseName } from '../max/poses';
import { feetYFor, maxMode } from './geometry';
import { punchAt } from './camera';
import { ShortProps } from './types';

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// One persistent Max. Placement/scale per scene come from geometry.placeMax (never cropped,
// never over a card); punch-in zoom is capped per scene; idle sway keeps him alive.
export const MaxLayer: React.FC<ShortProps> = ({ script, scenes, amplitude, chars, exprKeys, poseKeys, zoomKeys }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  let si = 0;
  while (si + 1 < scenes.length && scenes[si + 1].from <= frame) si++;
  if (maxMode(script.scenes[si].type) === 'none') return null; // experiment scenes: the subjects are the cast
  const cur = scenes[si].placement;
  const prev = si > 0 ? scenes[si - 1].placement : cur;
  const move = si > 0 ? spring({ frame: frame - scenes[si].from, fps, config: { damping: 18, stiffness: 240 } }) : 1;
  const cx = lerp(prev.cx, cur.cx, move);
  const scale = lerp(prev.scale, cur.scale, move);
  const feetY = lerp(feetYFor(script.scenes[Math.max(0, si - 1)].type), feetYFor(script.scenes[si].type), si > 0 ? move : 1);
  const zoom = 1 + (cur.maxZoom - 1) * punchAt(zoomKeys, frame, fps);
  const sway = Math.sin(frame / 38) * 0.7; // degrees, around the feet
  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 240 } });
  const s = scale * zoom;
  const W = 800 * s;
  const Hh = 1000 * s;
  return (
    <div
      style={{
        position: 'absolute',
        left: cx - W / 2,
        top: feetY - 999 * s + (1 - enter) * 200,
        width: W,
        height: Hh,
        transformOrigin: '50% 99.9%',
        transform: `rotate(${sway}deg) scaleX(${(si > 0 && move < 0.5 ? prev.flip : cur.flip) ? -1 : 1})`,
      }}
    >
      <Max
        expression={exprKeys as Key<ExpressionName>[]}
        pose={poseKeys as Key<PoseName>[]}
        amplitude={amplitude}
        chars={chars}
        seed={script.meta.seed}
      />
    </div>
  );
};
