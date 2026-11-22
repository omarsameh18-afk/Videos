import React from 'react';
import { C, line } from './theme';

// Protein shaker, origin = grip centre, drawn upright.
export const Shaker: React.FC<{ tilt?: number }> = ({ tilt = 0 }) => (
  <g transform={`rotate(${tilt})`}>
    {/* body */}
    <path d="M -34 -78 L 34 -78 L 28 72 Q 0 82 -28 72 Z" fill={C.shaker} {...line} />
    <path d="M 14 -70 L 10 64 Q 18 64 24 62 L 28 -70 Z" fill={C.shakerShade} />
    {/* liquid level marks */}
    <path d="M -22 -40 L -10 -40 M -22 -20 L -14 -20 M -22 0 L -10 0" stroke="#fff" strokeWidth={4} strokeLinecap="round" opacity={0.7} />
    {/* lime band + bolt */}
    <rect x={-31} y={18} width={60} height={30} fill={C.tank} {...line} />
    <path d="M 4 21 L -8 35 L 0 35 L -4 46 L 10 30 L 2 30 Z" fill={C.outline} />
    {/* lid */}
    <rect x={-40} y={-104} width={80} height={30} rx={8} fill={C.shakerLid} {...line} />
    <path d="M -14 -104 L -10 -124 L 12 -124 L 16 -104 Z" fill={C.shakerLid} {...line} />
    <rect x={-30} y={-98} width={18} height={6} rx={3} fill="#fff" opacity={0.35} />
  </g>
);
