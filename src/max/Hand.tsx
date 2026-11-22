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

export const HAND_SCALE = 1.3; // hands only; the shaker keeps its own size

export const Hand: React.FC<{ shape: HandShape; worldAngle: number; shakerTilt?: number; shakerOffset?: [number, number] }> = ({
  shape,
  worldAngle,
  shakerTilt = 0,
  shakerOffset = [0, 0],
}) => {
  if (shape === 'shaker') {
    return (
      <g>
        <g transform={`translate(0 ${37 * HAND_SCALE}) rotate(${-worldAngle}) translate(${-shakerOffset[0]} ${shakerOffset[1]}) rotate(${shakerTilt})`}>
          <Shaker />
        </g>
        <g transform={`scale(${HAND_SCALE})`}>
          <Fist />
        </g>
      </g>
    );
  }
  return <g transform={`scale(${HAND_SCALE})`}>{handShape(shape)}</g>;
};

const handShape = (shape: HandShape) => {
  switch (shape) {
    case 'hidden':
      return null;
    case 'fist':
      return <Fist />;
    case 'shaker':
      return null; // handled above
    case 'point':
      return (
        <g>
          <rect x={-17} y={36} width={34} height={72} rx={17} fill={C.skin} {...line} />
          <path d="M -8 94 Q 0 89 8 94" fill="none" {...line} strokeWidth={3.5} />
          <rect x={-36} y={2} width={72} height={62} rx={26} fill={C.skin} {...line} />
          <path d="M -18 40 Q 0 38 12 44" fill="none" {...line} strokeWidth={4} />
          <ellipse cx={28} cy={30} rx={14} ry={20} fill={C.skin} {...line} />
        </g>
      );
    case 'one':
      // "number one": palm to camera, index finger up, other fingers curled, thumb across
      return (
        <g>
          <rect x={-34} y={36} width={32} height={74} rx={16} fill={C.skin} {...line} />
          {[8, 24].map((x) => (
            <circle key={x} cx={x} cy={62} r={14} fill={C.skin} {...line} strokeWidth={4} />
          ))}
          <rect x={-38} y={2} width={76} height={66} rx={24} fill={C.skin} {...line} />
          <rect x={-26} y={30} width={50} height={22} rx={11} fill={C.skin} {...line} strokeWidth={4} transform="rotate(-12 0 41)" />
        </g>
      );
    case 'thumbsUp':
      // used with the forearm pointing up: thumb sticks out past the fist along +y
      return (
        <g>
          <rect x={-38} y={44} width={38} height={62} rx={19} fill={C.skin} {...line} />
          <path d="M -28 92 Q -19 86 -10 92" fill="none" {...line} strokeWidth={3.5} />
          <rect x={-38} y={2} width={80} height={72} rx={26} fill={C.skin} {...line} />
          {[2, 20, 38, 56].map((y) => (
            <rect key={y} x={14} y={y + 2} width={34} height={18} rx={9} fill={C.skin} {...line} strokeWidth={4} />
          ))}
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
