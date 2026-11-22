import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Max, Key } from '../max/Max';
import { MAX_CANVAS_H, MAX_FEET_Y, MAX_PLACEMENT, MAX_W } from './layout';
import { ShortProps } from './types';

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const last = <T extends { at: number }>(keys: T[], f: number) => {
  let i = -1;
  while (i + 1 < keys.length && keys[i + 1].at <= f) i++;
  return i;
};

// One persistent, big Max: glides between scene spots, punch-in zooms from his feet.
export const MaxLayer: React.FC<ShortProps> = ({ script, scenes, amplitude, chars, exprKeys, poseKeys, zoomKeys }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const si = Math.max(0, last(scenes.map((s) => ({ at: s.from })), frame));
  const cur = MAX_PLACEMENT[script.scenes[si].type];
  const prev = si > 0 ? MAX_PLACEMENT[script.scenes[si - 1].type] : cur;
  const move = si > 0 ? spring({ frame: frame - scenes[si].from, fps, config: { damping: 16, stiffness: 220 } }) : 1;
  const cx = lerp(prev.cx, cur.cx, move);

  const zi = last(zoomKeys, frame);
  const zTo = zi >= 0 ? zoomKeys[zi].scale : 1;
  const zFrom = zi > 0 ? zoomKeys[zi - 1].scale : 1;
  const zt = zi >= 0 ? spring({ frame: frame - zoomKeys[zi].at, fps, config: { damping: 14, stiffness: 320 } }) : 1;
  const zoom = lerp(zFrom, zTo, zt);
  const enter = spring({ frame, fps, config: { damping: 12, stiffness: 240 } });

  return (
    <div
      style={{
        position: 'absolute',
        left: cx - MAX_W / 2,
        top: MAX_FEET_Y - MAX_CANVAS_H * 0.998 + (1 - enter) * 260,
        width: MAX_W,
        height: MAX_CANVAS_H,
        transformOrigin: '50% 99.8%',
        transform: `scale(${(cur.flip ? -1 : 1) * zoom}, ${zoom})`,
      }}
    >
      <Max
        expression={exprKeys as Key<typeof exprKeys[number]['value']>[]}
        pose={poseKeys as Key<typeof poseKeys[number]['value']>[]}
        amplitude={amplitude}
        chars={chars}
        seed={script.meta.seed}
      />
    </div>
  );
};
