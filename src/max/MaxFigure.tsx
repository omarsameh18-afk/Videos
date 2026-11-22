import React from 'react';
import { Arm } from './Arm';
import { Head } from './Head';
import { Legs, Torso, CoatBack } from './Body';
import { Brow, ExpressionName, MouthShape } from './expressions';
import { POSES, PoseDef, PoseName } from './poses';

export interface MaxFigureProps {
  expression?: ExpressionName;
  pose?: PoseName | PoseDef;
  mouth?: MouthShape; // overrides the expression's resting mouth (used for lip-sync)
  blink?: number; // 0 = open, 1 = closed
  frame?: number; // drives idle effects (breathing, fx bob)
  showLegs?: boolean;
  brows?: { browL: Brow; browR: Brow };
  viewBox?: string; // crop, e.g. '250 60 300 300' for a head close-up
}

// Max, drawn for one frame from plain props (no animation logic).
// Canvas is 800 x 1000; place/scale it with a wrapper div.
export const MaxFigure: React.FC<MaxFigureProps> = ({
  expression = 'neutral',
  pose = 'idle',
  mouth,
  blink = 0,
  frame = 0,
  showLegs = true,
  brows,
  viewBox = '0 0 800 1000',
}) => {
  const p = typeof pose === 'string' ? POSES[pose] : pose;
  const breathe = Math.sin(frame / 14) * 0.012;
  const left = <Arm def={p.left} />;
  const right = (
    <g transform="translate(800 0) scale(-1 1)">
      <Arm def={p.right} />
    </g>
  );
  // draw order: back arm, front arm; arms flagged `front` go above the head
  const order = p.frontArm === 'right'
    ? [{ el: left, def: p.left }, { el: right, def: p.right }]
    : [{ el: right, def: p.right }, { el: left, def: p.left }];
  const midArms = order.filter((a) => !a.def.front).map((a) => a.el);
  const topArms = order.filter((a) => a.def.front).map((a) => a.el);

  return (
    <svg viewBox={viewBox} width="100%" height="100%" style={{ overflow: viewBox === '0 0 800 1000' ? 'visible' : 'hidden' }}>
      <g transform={`rotate(${p.lean ?? 0} 400 900)`}>
        <CoatBack />
        {showLegs && <Legs />}
        <g transform={`translate(400 700) scale(${1 + breathe} ${1 - breathe * 0.5}) translate(-400 -700)`}>
          <Torso />
          {midArms.map((a, i) => <React.Fragment key={i}>{a}</React.Fragment>)}
          <g transform={`translate(0 ${breathe * 200}) translate(400 300) scale(1.12) translate(-400 -300)`}>
            <Head expression={expression} mouth={mouth} blink={blink} frame={frame} brows={brows} />
          </g>
          {topArms.map((a, i) => <React.Fragment key={i}>{a}</React.Fragment>)}
        </g>
      </g>
    </svg>
  );
};
