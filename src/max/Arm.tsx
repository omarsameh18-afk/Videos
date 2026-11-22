import React from 'react';
import { C, line } from './theme';
import { ArmDef } from './poses';
import { Hand } from './Hand';

export const UPPER = 175;
export const FORE = 158;
export const SHOULDER = { x: 222, y: 372 };

// One huge cartoon arm. Always authored as the screen-left arm; the screen-right
// arm is a mirror image (see MaxFigure.tsx).
export const Arm: React.FC<{ def: ArmDef }> = ({ def }) => {
  const world = def.shoulder + def.elbow + def.wrist;
  return (
    <g transform={`translate(${SHOULDER.x} ${SHOULDER.y}) rotate(${def.shoulder})`}>
      {/* shoulder ball: a circle centred on the pivot, so its outline is identical at any angle */}
      <circle cx={0} cy={0} r={62} fill={C.skin} {...line} />
      {/* upper arm: big bicep on -x, tricep on +x */}
      <path
        d={`M -60 0 C -100 50 -92 125 -40 ${UPPER + 6} L 40 ${UPPER + 6} C 70 120 66 40 60 0 Z`}
        fill={C.skin}
        {...line}
      />
      <path d="M -30 112 C -48 92 -50 70 -40 50" fill="none" stroke={C.skinShade} strokeWidth={8} strokeLinecap="round" />
      {/* ripped-off lab-coat sleeve: the top of the shoulder ball, frayed edge across the arm */}
      <path
        d="M -63.2 10 A 64 64 0 1 1 63.2 10 L 52 20 L 40 8 L 28 22 L 14 8 L 0 22 L -14 8 L -28 22 L -40 8 L -52 20 Z"
        fill={C.coat}
        {...line}
        strokeWidth={5}
      />
      <path d="M -40 -30 A 48 48 0 0 1 36 -34" fill="none" stroke={C.coatShade} strokeWidth={6} strokeLinecap="round" />
      {/* forearm */}
      <g transform={`translate(0 ${UPPER}) rotate(${def.elbow})`}>
        <circle cx={0} cy={0} r={40} fill={C.skin} {...line} />
        <path d={`M -40 -4 C -60 40 -50 110 -30 ${FORE + 4} L 30 ${FORE + 4} C 46 110 58 40 40 -4 Z`} fill={C.skin} {...line} />
        <circle cx={0} cy={0} r={34} fill={C.skin} />
        <path d="M -16 40 C -24 70 -20 100 -14 120" fill="none" stroke={C.skinShade} strokeWidth={6} strokeLinecap="round" />
        <g transform={`translate(0 ${FORE}) rotate(${def.wrist})`}>
          <Hand shape={def.hand} worldAngle={world} />
        </g>
      </g>
    </g>
  );
};
