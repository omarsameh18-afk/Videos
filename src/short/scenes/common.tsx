import React from 'react';
import { C } from '../../max/theme';
import { FONT_HEAD } from '../fonts';

export const headline = (size: number, color = '#FFFFFF'): React.CSSProperties => ({
  fontFamily: FONT_HEAD,
  fontSize: size,
  lineHeight: 1.02,
  color,
  textTransform: 'uppercase',
  WebkitTextStroke: `${Math.round(size / 9)}px #0B0C1C`,
  paintOrder: 'stroke fill',
  textShadow: '0 10px 0 rgba(0,0,0,0.35)',
  letterSpacing: 1,
});

export const XIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <circle cx={50} cy={50} r={44} fill="#FF2E4D" stroke="#0B0C1C" strokeWidth={8} />
    <path d="M 32 32 L 68 68 M 68 32 L 32 68" stroke="#fff" strokeWidth={13} strokeLinecap="round" />
  </svg>
);
export const CheckIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <circle cx={50} cy={50} r={44} fill={C.accent} stroke="#0B0C1C" strokeWidth={8} />
    <path d="M 28 52 L 44 68 L 74 34" fill="none" stroke="#0B0C1C" strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Anton is ~0.47em per character: shrink a line so it fits on one line in `width`.
export const fitSize = (text: string, max: number, width: number) => Math.min(max, Math.floor(width / (Math.max(1, text.length) * 0.47)));
