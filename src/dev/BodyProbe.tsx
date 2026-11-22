import React from 'react';
import { AbsoluteFill } from 'remotion';
import { MaxFigure } from '../max/MaxFigure';
import { BodyParams, DEFAULT_BODY } from '../max/body';
import { PoseName } from '../max/poses';
import { C } from '../max/theme';

const all = (v: number): BodyParams => ({ ...DEFAULT_BODY, chest: v, shoulders: v, arms: v, back: v, abs: v, legs: v });
const CELLS: { t: string; body: BodyParams; pose?: PoseName; bar?: boolean; e?: 'neutral' | 'angry' | 'smug' }[] = [
  { t: 'all 0.85', body: all(0.85) },
  { t: 'default', body: DEFAULT_BODY },
  { t: 'all 1.35', body: all(1.35) },
  { t: 'belly 1', body: { ...DEFAULT_BODY, belly: 1 } },
  { t: 'fatigue 1', body: { ...DEFAULT_BODY, fatigue: 1 } },
  { t: 'pressDown', body: DEFAULT_BODY, pose: 'pressDown', bar: true, e: 'angry' },
  { t: 'pressUp 1.3', body: all(1.3), pose: 'pressUp', bar: true, e: 'angry' },
  { t: 'sip', body: DEFAULT_BODY, pose: 'sip', e: 'smug' },
];
export const BodyProbe: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg, display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
    {CELLS.map((c) => (
      <div key={c.t} style={{ width: 600, height: 900, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 150, left: 50, width: 500, height: 625 }}>
          <MaxFigure body={c.body} pose={c.pose ?? 'idle'} barbell={c.bar} expression={c.e ?? 'neutral'} frame={10} />
        </div>
        <div style={{ position: 'absolute', top: 20, width: 600, textAlign: 'center', color: C.accent, fontFamily: 'Anton', fontSize: 56 }}>{c.t}</div>
      </div>
    ))}
  </AbsoluteFill>
);
