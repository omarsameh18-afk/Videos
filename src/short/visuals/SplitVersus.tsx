import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../../max/theme';
import { FONT_BODY, FONT_HEAD } from '../fonts';
import { VIS_MAIN } from '../geometry';
import { CheckIcon, XIcon } from '../scenes/common';
import { VisualText } from './VisualText';

// Left/right: wrong (X) vs right (check), VS badge (text keeps clear of it); the right panel slams in on the reveal sentence.
export const SplitVersusVisual: React.FC<{ wrong: string; right: string; wrongLabel: string; rightLabel: string; revealAt: number; pulse: number }> = ({
  wrong, right, wrongLabel, rightLabel, revealAt, pulse,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame: f, fps, config: { damping: 13, stiffness: 220, overshootClamping: true } });
  const b = spring({ frame: f - revealAt, fps, config: { damping: 12, stiffness: 240, overshootClamping: true } });
  const w = (VIS_MAIN.w - 24) / 2;
  const panel = (good: boolean, label: string, text: string, t: number, x: number) => (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: VIS_MAIN.y,
        width: w,
        height: VIS_MAIN.h,
        borderRadius: 32,
        background: good ? 'rgba(22,40,10,0.92)' : 'rgba(48,10,20,0.92)',
        border: `6px solid ${good ? C.accent : '#FF2E4D'}`,
        transform: `translateY(${(1 - t) * 900}px) scale(${1 + 0.03 * pulse})`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 30,
        opacity: f >= (good ? revealAt : 0) ? 1 : 0,
      }}
    >
      {good ? <CheckIcon size={170} /> : <XIcon size={170} />}
      <div style={{ fontFamily: FONT_BODY, fontWeight: 900, fontSize: 40, letterSpacing: 4, color: good ? C.accent : '#FF5A72' }}>{label}</div>
      {text.split('=').map((l, i) => (
        <VisualText key={i} text={(i ? '= ' : '') + l.trim().toUpperCase()} width={w - 130} max={110} color={good ? '#fff' : '#FFD7DD'} />
      ))}
    </div>
  );
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {panel(false, wrongLabel, wrong, a, VIS_MAIN.x)}
      {panel(true, rightLabel, right, b, VIS_MAIN.x + w + 24)}
      <div style={{ position: 'absolute', left: VIS_MAIN.x + VIS_MAIN.w / 2 - 70, top: VIS_MAIN.y + VIS_MAIN.h / 2 - 70, width: 140, height: 140, borderRadius: 70, background: '#0B0C1C', border: '6px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_HEAD, fontSize: 64, color: '#fff', transform: `scale(${a})` }}>VS</div>
    </div>
  );
};
