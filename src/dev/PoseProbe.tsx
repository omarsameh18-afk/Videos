import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { MaxFigure } from '../max/MaxFigure';
import { POSE_NAMES, PoseName } from '../max/poses';
import { ExpressionName } from '../max/expressions';

// Frame n = pose (n / EXPR.length) x expression (n % EXPR.length), drawn 1:1 in canvas units with
// the 800x1000 canvas at (800, 400) on a magenta field. scripts/measure-poses.py reads the bounds.
export const PROBE_POSES: PoseName[] = ['idle', ...POSE_NAMES];
export const PROBE_EXPR: ExpressionName[] = ['neutral', 'thinking', 'shocked', 'laughing', 'smug', 'angry'];
export const PROBE = { width: 2400, height: 1800, ox: 800, oy: 400 };

export const PoseProbe: React.FC = () => {
  const n = useCurrentFrame();
  const pose = PROBE_POSES[Math.floor(n / PROBE_EXPR.length)];
  const expression = PROBE_EXPR[n % PROBE_EXPR.length];
  return (
    <AbsoluteFill style={{ background: '#FF00FF' }}>
      <div style={{ position: 'absolute', left: PROBE.ox, top: PROBE.oy, width: 800, height: 1000 }}>
        <MaxFigure pose={pose} expression={expression} />
      </div>
    </AbsoluteFill>
  );
};
