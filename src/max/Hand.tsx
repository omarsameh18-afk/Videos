import React from 'react';
import { C, line } from './theme';
import { HandShape } from './poses';
import { Shaker } from './Shaker';

// Hands are drawn with the wrist at the origin, pointing down (+y).
const Fist: React.FC = () => (
  <g>
    <rect x={-38} y={2} width={76} height={70} rx={28} fill={C.skin} {...line} />
    <path d="M -20 30 Q -6 28 6 34 M -20 46 Q -6 44 6 50" fill="none" {...line} strokeWidth={4} />
    <ellipse cx={30} cy={36} rx={16} ry={22} fill={C.skin} {...line} />
  </g>
);

export const Hand: React.FC<{ shape: HandShape; worldAngle: number }> = ({ shape, worldAngle }) => {
  switch (shape) {
    case 'hidden':
      return null;
    case 'fist':
      return <Fist />;
    case 'shaker':
      return (
        <g>
          <g transform={`translate(0 38) rotate(${-worldAngle})`}>
            <Shaker />
          </g>
          <Fist />
        </g>
      );
    case 'point':
      return (
        <g>
          <rect x={-13} y={40} width={26} height={86} rx={13} fill={C.skin} {...line} />
          <rect x={-36} y={2} width={72} height={62} rx={26} fill={C.skin} {...line} />
          <path d="M -18 40 Q 0 38 12 44" fill="none" {...line} strokeWidth={4} />
          <ellipse cx={28} cy={30} rx={14} ry={20} fill={C.skin} {...line} />
        </g>
      );
    case 'thumbsUp':
      // used with the forearm pointing up: thumb sticks out past the fist along +y
      return (
        <g>
          <rect x={-34} y={44} width={30} height={84} rx={15} fill={C.skin} {...line} />
          <path d="M -26 116 Q -19 110 -12 116" fill="none" {...line} strokeWidth={3.5} />
          <rect x={-38} y={2} width={80} height={72} rx={26} fill={C.skin} {...line} />
          <path d="M 6 18 L 40 18 M 6 34 L 40 34 M 6 50 L 40 50" fill="none" {...line} strokeWidth={4} />
          <path d="M -30 64 Q -14 70 4 62" fill="none" {...line} strokeWidth={4} />
        </g>
      );
    case 'open':
      return (
        <g>
          {[-27, -9, 9, 27].map((x, i) => (
            <rect key={i} x={x - 9} y={30} width={18} height={i === 0 || i === 3 ? 62 : 74} rx={9} fill={C.skin} {...line} />
          ))}
          <ellipse cx={0} cy={36} rx={40} ry={36} fill={C.skin} {...line} />
          <rect x={30} y={8} width={46} height={20} rx={10} fill={C.skin} {...line} transform="rotate(30 30 18)" />
        </g>
      );
  }
};
