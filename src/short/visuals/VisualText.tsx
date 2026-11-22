import React from 'react';
import { VISUAL_TEXT } from '../../config';
import { headline } from '../scenes/common';

// VISUAL RULE 4: visual text is >= 64px, <= 4 words, one line, never overflows (validator checks the fit).
export const fitPx = (text: string, width: number, max = 140) =>
  Math.max(VISUAL_TEXT.minPx, Math.min(max, Math.floor(width / (Math.max(1, text.length) * 0.47))));

export const VisualText: React.FC<{ text: string; width: number; max?: number; color?: string; style?: React.CSSProperties }> = ({
  text, width, max, color = '#fff', style,
}) => (
  <div style={{ ...headline(fitPx(text, width, max), color), whiteSpace: 'nowrap', textAlign: 'center', width, ...style }}>{text}</div>
);
