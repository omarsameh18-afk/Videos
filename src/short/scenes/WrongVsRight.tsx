import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../../max/theme';
import { FONT_BODY } from '../fonts';
import { COLUMN } from '../layout';
import { CheckIcon, headline, XIcon } from './common';
import { SceneProps } from './types';

const Card: React.FC<{ good: boolean; label: string; text: string; enter: number; strike?: number; top: number }> = ({
  good, label, text, enter, strike = 0, top,
}) => (
  <div
    style={{
      position: 'absolute',
      left: COLUMN.x,
      width: COLUMN.width,
      top,
      height: 330,
      borderRadius: 32,
      background: good ? 'rgba(22,40,10,0.92)' : 'rgba(48,10,20,0.92)',
      border: `6px solid ${good ? C.accent : '#FF2E4D'}`,
      boxShadow: '0 12px 0 rgba(0,0,0,0.35)',
      transform: `translateX(${(1 - enter) * 700}px) rotate(${(1 - enter) * 8}deg) scale(${interpolate(enter, [0, 1], [0.8, 1])})`,
      padding: '26px 28px',
      boxSizing: 'border-box',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      {good ? <CheckIcon size={72} /> : <XIcon size={72} />}
      <div style={{ fontFamily: FONT_BODY, fontWeight: 900, fontSize: 36, letterSpacing: 3, color: good ? C.accent : '#FF5A72' }}>{label}</div>
    </div>
    <div style={{ position: 'relative', marginTop: 14 }}>
      <div style={headline(84, good ? '#fff' : '#FFD7DD')}>{text}</div>
      {strike > 0 && (
        <div style={{ position: 'absolute', left: -6, top: '42%', height: 14, width: `${strike * 100}%`, background: '#FF2E4D', borderRadius: 7, transform: 'rotate(-4deg)' }} />
      )}
    </div>
  </div>
);

// Myth card slides in on the cut; the reality card pops in on the scene's last sentence.
export const WrongVsRight: React.FC<SceneProps> = ({ scene, timing }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (scene.type !== 'WrongVsRight') return null;
  const reveal = timing.reveal ?? Math.round(timing.durationInFrames * 0.5);
  const a = spring({ frame: f, fps, config: { damping: 13, stiffness: 220 } });
  const b = spring({ frame: f - reveal, fps, config: { damping: 11, stiffness: 240 } });
  const strike = interpolate(f, [reveal + 3, reveal + 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill>
      <Card good={false} label={scene.props.wrongLabel} text={scene.props.wrong} enter={a} strike={strike} top={COLUMN.top} />
      <Card good label={scene.props.rightLabel} text={scene.props.right} enter={b} top={COLUMN.top + 370} />
    </AbsoluteFill>
  );
};
