import React from 'react';
import { AbsoluteFill } from 'remotion';
import { MaxFigure } from '../max/MaxFigure';
import { EXPRESSION_NAMES, TALK_MOUTHS, MouthShape } from '../max/expressions';
import { POSE_NAMES } from '../max/poses';
import { C } from '../max/theme';

const CELL_W = 400;
const label: React.CSSProperties = {
  fontFamily: 'Arial Black, Arial',
  fontWeight: 900,
  fontSize: 30,
  color: C.accent,
  textAlign: 'center',
  textTransform: 'uppercase',
};
const rowTitle: React.CSSProperties = { ...label, fontSize: 44, color: '#fff', textAlign: 'left', padding: '30px 40px 0' };

const Cell: React.FC<{ title: string; sub: string; children: React.ReactNode; h?: number }> = ({ title, sub, children, h = 500 }) => (
  <div style={{ width: CELL_W, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <div style={{ width: CELL_W, height: h, overflow: h < 500 ? "hidden" : "visible" }}>{children}</div>
    <div style={label}>{title}</div>
    <div style={{ ...label, fontSize: 22, color: '#9AA3D9' }}>{sub}</div>
  </div>
);

const POSE_ROW_PAD = 200; // room for the sideways point
export const PROOF_SIZE = { width: CELL_W * 6 + POSE_ROW_PAD, height: 1760 };

// Proof that expression, pose and mouth are independent layers.
export const ProofSheet: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    <div style={rowTitle}>6 expressions · same body (idle)</div>
    <div style={{ display: 'flex' }}>
      {EXPRESSION_NAMES.map((e) => (
        <Cell key={e} title={e} sub="pose: idle">
          <MaxFigure expression={e} pose="idle" />
        </Cell>
      ))}
    </div>
    <div style={rowTitle}>6 poses · same face (neutral)</div>
    <div style={{ display: 'flex', paddingLeft: POSE_ROW_PAD }}>
      {POSE_NAMES.map((p) => (
        <Cell key={p} title={p} sub="face: neutral">
          <MaxFigure expression="neutral" pose={p} />
        </Cell>
      ))}
    </div>
    <div style={rowTitle}>5 talking mouths (audio-driven) + blink</div>
    <div style={{ display: 'flex' }}>
      {TALK_MOUTHS.map((m: MouthShape) => (
        <Cell key={m} title={m === 'o' ? '"O"' : m} sub="mouth" h={300}>
          <MaxFigure expression="neutral" pose="idle" mouth={m} viewBox="290 70 220 260" />
        </Cell>
      ))}
      <Cell title="blink" sub="auto, every 3-5 s" h={300}>
        <MaxFigure expression="neutral" pose="idle" blink={1} viewBox="290 70 220 260" />
      </Cell>
    </div>
  </AbsoluteFill>
);
