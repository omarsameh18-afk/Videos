import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../../max/theme';
import { HOOK_GAUGE, HOOK_TEXT } from '../geometry';
import { GaugeDial } from '../visuals/Gauge';
import { VisualText } from '../visuals/VisualText';
import { SceneProps } from './types';

// Visual interrupt on frame 1: white flash, gauge needle slams, the question slams in.
export const Hook: React.FC<SceneProps> = ({ scene, pulse }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (scene.type !== 'Hook') return null;
  const flash = interpolate(f, [0, 5], [0.7, 0], { extrapolateRight: 'clamp' });
  // slams up from small; clamped so the line never grows past its box
  const s = spring({ frame: f, fps, config: { damping: 12, stiffness: 420, overshootClamping: true } });
  const line = scene.onScreenText[0] ?? '';
  return (
    <AbsoluteFill>
      {scene.props.gauge && <GaugeDial {...scene.props.gauge} cx={HOOK_GAUGE.cx} cy={HOOK_GAUGE.cy} r={HOOK_GAUGE.r} pulse={pulse} />}
      <div style={{ position: 'absolute', left: HOOK_TEXT.x, top: HOOK_TEXT.y, width: HOOK_TEXT.w, transform: `scale(${interpolate(s, [0, 1], [0.45, 1]) * (1 + 0.03 * pulse)})` }}>
        <VisualText text={line.toUpperCase()} width={HOOK_TEXT.w * 0.94} max={110} color={C.accent} style={{ margin: '0 auto' }} />
      </div>
      <AbsoluteFill style={{ background: '#fff', opacity: flash }} />
    </AbsoluteFill>
  );
};
