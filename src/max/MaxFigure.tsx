import React from 'react';
import { Arm } from './Arm';
import { Head } from './Head';
import { Legs, Torso, CoatBack } from './Body';
import { Brow, ExpressionName, MouthShape } from './expressions';
import { POSES, PoseDef, PoseName, fistPos } from './poses';
import { BodyParams, DEFAULT_BODY, shoulderPivotX } from './body';
import { C, line } from './theme';

export interface MaxFigureProps {
  expression?: ExpressionName;
  pose?: PoseName | PoseDef;
  mouth?: MouthShape; // overrides the expression's resting mouth (used for lip-sync)
  blink?: number; // 0 = open, 1 = closed
  frame?: number; // drives idle effects (breathing, fx bob)
  showLegs?: boolean;
  brows?: { browL: Brow; browR: Brow };
  viewBox?: string; // crop, e.g. '250 60 300 300' for a head close-up
  body?: BodyParams; // muscle sliders, belly, fatigue (test-subject format)
  barbell?: boolean; // draw a barbell between the fists (press poses)
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
  body = DEFAULT_BODY,
  barbell = false,
}) => {
  const p = typeof pose === 'string' ? POSES[pose] : pose;
  // heavy breathing when tired: deeper and faster
  const breathe = Math.sin(frame / (14 - 8 * body.fatigue)) * (0.012 + 0.03 * body.fatigue);
  const px = shoulderPivotX(body);
  const armProps = { pivotX: px, armScale: body.arms, shoulderScale: body.shoulders };
  const left = <Arm def={p.left} {...armProps} />;
  const right = (
    <g transform="translate(800 0) scale(-1 1)">
      <Arm def={p.right} {...armProps} />
    </g>
  );
  // panting mouth when exhausted and not talking
  const pant = body.fatigue > 0.45 && !mouth ? (Math.sin(frame / (14 - 8 * body.fatigue)) > 0 ? 'o' : 'small') : mouth;
  let bar: React.ReactNode = null;
  if (barbell) {
    const [lx, ly] = fistPos(p.left, 'left', px);
    const [rx, ry] = fistPos(p.right, 'right', px);
    const y = (ly + ry) / 2;
    bar = (
      <g>
        <rect x={lx - 70} y={y - 9} width={rx - lx + 140} height={18} rx={9} fill="#C9CED8" {...line} strokeWidth={5} />
        {[lx - 70, rx + 32].map((x, i) => (
          <g key={i}>
            <rect x={x} y={y - 78} width={38} height={156} rx={10} fill="#2B2F45" {...line} />
            <rect x={x + (i ? -26 : 38)} y={y - 56} width={26} height={112} rx={8} fill={C.accent2} {...line} strokeWidth={5} />
          </g>
        ))}
      </g>
    );
  }
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
        {showLegs && <Legs body={body} />}
        <g transform={`translate(400 700) scale(${1 + breathe} ${1 - breathe * 0.5}) translate(-400 -700)`}>
          <Torso body={body} />
          {bar /* behind the head (bar travels behind the neck), under the arms */}
          {midArms.map((a, i) => <React.Fragment key={i}>{a}</React.Fragment>)}
          <g transform={`translate(0 ${breathe * 200}) translate(400 300) scale(1.12) translate(-400 -300)`}>
            <Head expression={expression} mouth={pant} blink={blink} frame={frame} brows={brows} fatigue={body.fatigue} />
          </g>
          {topArms.map((a, i) => <React.Fragment key={i}>{a}</React.Fragment>)}
        </g>
      </g>
    </svg>
  );
};
