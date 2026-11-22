import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../../max/theme';
import { FONT_BODY } from '../fonts';
import { CARD_RECT } from '../layout';
import { CheckIcon, fitSize, headline, XIcon } from './common';
import { SceneProps } from './types';

const R = CARD_RECT.WrongVsRight;

const Card: React.FC<{ good: boolean; label: string; text: string; x: number; rot: number; scale: number; strike?: number }> = ({
  good, label, text, x, rot, scale, strike = 0,
}) => {
  const lines = text.toUpperCase().split('=').map((l) => l.trim()).filter(Boolean);
  return (
    <div
      style={{
        position: 'absolute',
        left: R.x,
        top: R.y,
        width: R.w,
        height: R.h,
        borderRadius: 32,
        background: good ? 'rgba(22,40,10,0.94)' : 'rgba(48,10,20,0.94)',
        border: `6px solid ${good ? C.accent : '#FF2E4D'}`,
        boxShadow: '0 12px 0 rgba(0,0,0,0.35)',
        transform: `translateX(${x}px) rotate(${rot}deg) scale(${scale})`,
        padding: '26px 24px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {good ? <CheckIcon size={66} /> : <XIcon size={66} />}
        <div style={{ fontFamily: FONT_BODY, fontWeight: 900, fontSize: 34, letterSpacing: 3, color: good ? C.accent : '#FF5A72' }}>{label}</div>
      </div>
      <div style={{ position: 'relative', marginTop: 18 }}>
        {lines.map((l, i) => (
          <div key={i} style={{ ...headline(fitSize(l, 96, R.w - 56), good ? '#fff' : '#FFD7DD'), whiteSpace: 'nowrap' }}>
            {i === 1 ? `= ${l}` : l}
          </div>
        ))}
        {strike > 0 && (
          <div style={{ position: 'absolute', left: -6, top: '46%', height: 14, width: `${strike * 100}%`, background: '#FF2E4D', borderRadius: 7, transform: 'rotate(-6deg)' }} />
        )}
      </div>
    </div>
  );
};

// ONE card at a time: the myth card gets struck out and flies off as the reality card slams in.
export const WrongVsRight: React.FC<SceneProps> = ({ scene, timing, pulse }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (scene.type !== 'WrongVsRight') return null;
  const reveal = timing.reveal ?? Math.round(timing.durationInFrames * 0.5);
  const a = spring({ frame: f, fps, config: { damping: 13, stiffness: 220, overshootClamping: true } });
  const strike = interpolate(f, [reveal - 8, reveal - 2], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const out = spring({ frame: f - reveal, fps, config: { damping: 16, stiffness: 260 } });
  // no overshoot: a card must never swing into Max's space
  const b = spring({ frame: f - reveal - 2, fps, config: { damping: 11, stiffness: 240, overshootClamping: true } });
  const p = 1 + 0.05 * pulse;
  return (
    <AbsoluteFill>
      {out < 0.99 && <Card good={false} label={scene.props.wrongLabel} text={scene.props.wrong} x={(1 - a) * 600 + out * 700} rot={(1 - a) * 8 + out * 20} scale={p} strike={strike} />}
      {f >= reveal && <Card good label={scene.props.rightLabel} text={scene.props.right} x={(1 - b) * 600} rot={(1 - b) * 8} scale={interpolate(b, [0, 1], [0.7, 1]) * p} />}
    </AbsoluteFill>
  );
};
