import React from 'react';
import { C, line } from './theme';
import { ArmDef } from './poses';
import { Hand } from './Hand';

// 'ripped' = sleeves torn off the lab coat (shows the delts); 'rolled' = rolled-up sleeves
export const SLEEVES = 'ripped' as 'ripped' | 'rolled';

export const UPPER = 175;
export const FORE = 158;
export const SHOULDER = { x: 222, y: 372 };

// One huge cartoon arm. Always authored as the screen-left arm; the screen-right
// arm is a mirror image (see Character.tsx).
export const Arm: React.FC<{ def: ArmDef }> = ({ def }) => {
  const world = def.shoulder + def.elbow + def.wrist;
  return (
    <g transform={`translate(${SHOULDER.x} ${SHOULDER.y}) rotate(${def.shoulder})`}>
      {/* upper arm: big bicep on -x, tricep on +x */}
      <path
        d={`M -56 -6 C -100 50 -92 125 -40 ${UPPER + 6} L 40 ${UPPER + 6} C 70 120 66 40 54 -6 Z`}
        fill={C.skin}
        {...line}
      />
      <path d="M -30 112 C -48 92 -50 70 -40 50" fill="none" stroke={C.skinShade} strokeWidth={8} strokeLinecap="round" />
      {/* deltoid cap */}
      <path d="M -60 10 C -72 -40 -40 -66 0 -66 C 40 -66 70 -40 58 10 Q 0 30 -60 10 Z" fill={C.skin} {...line} />
      <path d="M -40 4 Q 0 18 40 4" fill="none" stroke={C.skinShade} strokeWidth={7} strokeLinecap="round" />
      {SLEEVES === 'rolled' ? (
        <g>
          <path d="M -62 -30 C -66 0 -64 20 -62 40 L 60 40 C 64 20 64 0 60 -30 C 40 -60 -40 -60 -62 -30 Z" fill={C.coat} {...line} />
          <path d="M -64 22 Q 0 36 64 22 L 63 48 Q 0 62 -63 48 Z" fill={C.coat} {...line} />
        </g>
      ) : (
        // sleeves ripped off the lab coat: short frayed stub over the deltoid
        <path
          d="M -58 -34 C -40 -70 40 -70 58 -34 L 50 -22 L 40 -30 L 30 -16 L 18 -26 L 6 -12 L -6 -24 L -18 -10 L -30 -22 L -42 -12 L -52 -24 Z"
          fill={C.coat}
          {...line}
          strokeWidth={5}
        />
      )}
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
