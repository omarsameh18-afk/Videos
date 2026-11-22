import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../../max/theme';
import { FONT_BODY } from '../fonts';
import { CONTENT } from '../layout';
import { CheckIcon, headline, XIcon } from './common';
import { SceneProps } from './types';

const Card: React.FC<{ good: boolean; label: string; text: string; enter: number; strike?: number; top: number }> = ({
  good, label, text, enter, strike = 0, top,
}) => (
  <div
    style={{
      position: 'absolute',
      left: CONTENT.x,
      width: CONTENT.width,
      top,
      height: 360,
      borderRadius: 36,
      background: good ? 'rgba(184,255,46,0.14)' : 'rgba(255,46,77,0.16)',
      border: `6px solid ${good ? C.accent : '#FF2E4D'}`,
      boxShadow: '0 14px 0 rgba(0,0,0,0.35)',
      transform: `translateX(${(1 - enter) * (good ? 1100 : -1100)}px) rotate(${(1 - enter) * (good ? 6 : -6)}deg)`,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '0 44px',
      boxSizing: 'border-box',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
      {good ? <CheckIcon size={92} /> : <XIcon size={92} />}
      <div style={{ fontFamily: FONT_BODY, fontWeight: 900, fontSize: 46, letterSpacing: 4, color: good ? C.accent : '#FF5A72' }}>{label}</div>
    </div>
    <div style={{ position: 'relative', marginTop: 18, alignSelf: 'flex-start' }}>
      <div style={headline(104, good ? '#fff' : '#FFD7DD')}>{text}</div>
      {strike > 0 && (
        <div style={{ position: 'absolute', left: -8, top: '50%', height: 14, width: `${strike * 104}%`, background: '#FF2E4D', borderRadius: 7, transform: 'rotate(-3deg)' }} />
      )}
    </div>
  </div>
);

// Myth card slides in, then the reality card on the scene's second beat (next sentence).
export const WrongVsRight: React.FC<SceneProps> = ({ scene, timing }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (scene.type !== 'WrongVsRight') return null;
  const reveal = timing.beats[1] ?? Math.round(timing.durationInFrames * 0.45);
  const a = spring({ frame: f, fps, config: { damping: 14, stiffness: 150 } });
  const b = spring({ frame: f - reveal, fps, config: { damping: 14, stiffness: 150 } });
  const strike = interpolate(f, [reveal + 6, reveal + 16], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill>
      <Card good={false} label={scene.props.wrongLabel} text={scene.props.wrong} enter={a} strike={strike} top={CONTENT.top + 20} />
      <Card good label={scene.props.rightLabel} text={scene.props.right} enter={b} top={CONTENT.top + 420} />
    </AbsoluteFill>
  );
};
