import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Max, Key } from '../max/Max';
import { ExpressionName } from '../max/expressions';
import { PoseName } from '../max/poses';
import { MAX_PLACEMENT, Placement } from './layout';
import { ShortProps } from './types';

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// One persistent Max for the whole video, so brows/poses spring across scene cuts
// and he glides to each scene's spot.
export const MaxLayer: React.FC<ShortProps> = ({ script, scenes, amplitude, chars }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const expressions: Key<ExpressionName>[] = scenes.map((t, i) => ({ at: t.from, value: script.scenes[i].expression }));
  const poses: Key<PoseName>[] = scenes.map((t, i) => ({ at: t.from, value: script.scenes[i].pose }));

  let i = 0;
  while (i + 1 < scenes.length && scenes[i + 1].from <= frame) i++;
  const cur: Placement = MAX_PLACEMENT[script.scenes[i].type];
  const prev: Placement = i > 0 ? MAX_PLACEMENT[script.scenes[i - 1].type] : cur;
  const t = i > 0 ? spring({ frame: frame - scenes[i].from, fps, config: { damping: 15, stiffness: 140 } }) : 1;
  const enter = spring({ frame, fps, config: { damping: 12, stiffness: 200 } }); // pop in at the very start
  const p = { cx: lerp(prev.cx, cur.cx, t), top: lerp(prev.top, cur.top, t), width: lerp(prev.width, cur.width, t) };

  return (
    <div
      style={{
        position: 'absolute',
        left: p.cx - p.width / 2,
        top: p.top + (1 - enter) * 300,
        width: p.width,
        height: p.width * 1.25,
      }}
    >
      <Max expression={expressions} pose={poses} amplitude={amplitude} chars={chars} seed={script.meta.seed} />
    </div>
  );
};
