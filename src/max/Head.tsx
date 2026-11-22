import React from 'react';
import { C, line } from './theme';
import { EXPRESSIONS, ExpressionName, MouthShape, Brow, EyeStyle } from './expressions';

const EYE_L = { x: 364, y: 218 };
const EYE_R = { x: 436, y: 218 };
const LENS_R = 33;
const MOUTH = { x: 400, y: 268 };

const BrowShape: React.FC<{ cx: number; b: Brow; mirror?: boolean }> = ({ cx, b, mirror }) => {
  // authored for the screen-left brow; inner end is on the right (+x)
  const s = mirror ? -1 : 1;
  return (
    <g transform={`translate(${cx} ${168 + b.y}) scale(${s} 1) rotate(${b.angle})`}>
      <path d="M -34 6 Q -10 -14 32 -4 L 30 10 Q -8 2 -32 18 Z" fill={C.brow} {...line} strokeWidth={5} />
    </g>
  );
};

const Eye: React.FC<{ x: number; y: number; style: EyeStyle; look: [number, number]; blink: number; mirror?: boolean }> = ({
  x, y, style, look, blink, mirror,
}) => {
  const s = mirror ? -1 : 1;
  const [lx, ly] = look;
  if (style === 'happy') {
    return <path d={`M ${x - 17} ${y + 6} Q ${x} ${y - 16} ${x + 17} ${y + 6}`} fill="none" {...line} strokeWidth={7} />;
  }
  const rx = style === 'wide' ? 24 : 19;
  const ry = (style === 'wide' ? 27 : 22) * (1 - blink * 0.92);
  const pr = style === 'wide' ? 6 : 10;
  return (
    <g>
      <ellipse cx={x} cy={y} rx={rx} ry={Math.max(ry, 1.5)} fill={C.eyeWhite} {...line} strokeWidth={4} />
      {ry > 6 && (
        <g>
          <circle cx={x + lx} cy={y + ly} r={pr} fill={C.pupil} />
          <circle cx={x + lx + 3} cy={y + ly - 4} r={pr * 0.35} fill="#fff" />
        </g>
      )}
      {style === 'angry' && ry > 6 && (
        <path
          d={`M ${x - 26 * s} ${y - 30} L ${x + 26 * s} ${y - 30} L ${x + 26 * s} ${y - 2} L ${x - 26 * s} ${y - 18} Z`}
          fill={C.skin}
          {...line}
          strokeWidth={0}
        />
      )}
      {style === 'angry' && ry > 6 && (
        <path d={`M ${x - 22 * s} ${y - 16} L ${x + 22 * s} ${y - 3}`} {...line} strokeWidth={5} />
      )}
      {style === 'half' && ry > 6 && (
        <g>
          <path d={`M ${x - 26} ${y - 30} L ${x + 26} ${y - 30} L ${x + 26} ${y - 1} L ${x - 26} ${y - 1} Z`} fill={C.skin} />
          <path d={`M ${x - 20} ${y - 1} L ${x + 20} ${y - 1}`} {...line} strokeWidth={5} />
        </g>
      )}
    </g>
  );
};

export const Mouth: React.FC<{ shape: MouthShape }> = ({ shape }) => {
  const { x, y } = MOUTH;
  const t = `translate(${x} ${y})`;
  switch (shape) {
    case 'closed':
      return <path transform={t} d="M -20 0 Q 0 6 20 0" fill="none" {...line} />;
    case 'smile':
      return <path transform={t} d="M -24 -4 Q 0 14 24 -4" fill="none" {...line} />;
    case 'small':
      return <ellipse transform={t} cx={0} cy={2} rx={14} ry={8} fill={C.mouth} {...line} />;
    case 'wide':
      // tall open "ah"
      return (
        <g transform={t}>
          <path d="M -24 -10 Q 0 -16 24 -10 Q 30 34 0 40 Q -30 34 -24 -10 Z" fill={C.mouth} {...line} />
          <path d="M -20 -10 Q 0 -14 20 -10 L 18 -2 Q 0 -5 -18 -2 Z" fill={C.teeth} />
          <path d="M -14 30 Q 0 20 14 30 Q 7 38 0 38 Q -7 38 -14 30 Z" fill={C.tongue} />
        </g>
      );
    case 'o':
      return (
        <g transform={t}>
          <ellipse cx={0} cy={6} rx={16} ry={20} fill={C.mouth} {...line} />
        </g>
      );
    case 'gasp':
      return (
        <g transform={t}>
          <ellipse cx={0} cy={12} rx={22} ry={30} fill={C.mouth} {...line} />
          <ellipse cx={0} cy={30} rx={12} ry={8} fill={C.tongue} />
        </g>
      );
    case 'grit':
      return (
        <g transform={t}>
          <path d="M -30 2 Q 0 -6 30 2 L 28 22 Q 0 16 -28 22 Z" fill={C.teeth} {...line} />
          <path d="M -29 12 Q 0 6 29 12 M -14 -1 L -14 19 M 0 -2 L 0 18 M 14 -1 L 14 19" fill="none" {...line} strokeWidth={3.5} />
        </g>
      );
    case 'laugh':
      // wide crescent grin, corners pulled up
      return (
        <g transform={t}>
          <path d="M -46 -18 Q 0 2 46 -18 Q 36 38 0 40 Q -36 38 -46 -18 Z" fill={C.mouth} {...line} />
          <path d="M -42 -15 Q 0 4 42 -15 L 38 -4 Q 0 14 -38 -4 Z" fill={C.teeth} />
          <path d="M -18 30 Q 0 18 18 30 Q 8 39 0 39 Q -8 39 -18 30 Z" fill={C.tongue} />
          <path d="M -52 -22 Q -46 -20 -44 -14 M 52 -22 Q 46 -20 44 -14" fill="none" {...line} strokeWidth={4} />
        </g>
      );
    case 'smirk':
      return <path transform={t} d="M -20 4 Q 6 8 22 -10 M 22 -10 Q 26 -12 28 -8" fill="none" {...line} />;
    case 'hmm':
      return <path transform={t} d="M -4 6 Q 6 0 14 6 Q 22 12 28 4" fill="none" {...line} />;
  }
};

const Fx: React.FC<{ fx?: string; frame: number }> = ({ fx, frame }) => {
  const bob = Math.sin(frame / 5) * 3;
  switch (fx) {
    case 'sweat':
      return (
        <g transform={`translate(0 ${bob})`}>
          <path d="M 492 150 Q 506 176 498 186 Q 486 194 480 182 Q 478 170 492 150 Z" fill={C.sweat} {...line} strokeWidth={4} />
          <path d="M 300 150 L 280 138 M 296 170 L 272 168 M 304 130 L 290 112" {...line} strokeWidth={5} />
          <path d="M 500 120 L 518 104 M 506 140 L 530 134" {...line} strokeWidth={5} />
        </g>
      );
    case 'vein':
      return (
        <g transform="translate(462 132)" stroke={C.anger} strokeWidth={6} strokeLinecap="round" fill="none">
          <path d="M -14 -4 Q -4 -4 -4 -14 M 4 -14 Q 4 -4 14 -4 M 14 4 Q 4 4 4 14 M -4 14 Q -4 4 -14 4" />
        </g>
      );
    case 'tears':
      return (
        <g transform={`translate(0 ${Math.abs(bob)})`}>
          <path d="M 324 232 Q 312 250 316 258 Q 324 264 330 256 Q 332 246 324 232 Z" fill={C.sweat} {...line} strokeWidth={3} />
          <path d="M 476 232 Q 488 250 484 258 Q 476 264 470 256 Q 468 246 476 232 Z" fill={C.sweat} {...line} strokeWidth={3} />
        </g>
      );
    case 'sparkle':
      return (
        <g transform={`translate(452 200) scale(${1 + Math.sin(frame / 4) * 0.15})`}>
          <path d="M 0 -18 L 4 -4 L 18 0 L 4 4 L 0 18 L -4 4 L -18 0 L -4 -4 Z" fill="#fff" stroke={C.outline} strokeWidth={2} />
        </g>
      );
    case 'question':
      return (
        <g transform={`translate(520 ${110 + bob}) rotate(12)`}>
          <text x={0} y={0} fontFamily="Arial Black, Arial" fontWeight={900} fontSize={70} fill={C.tank} stroke={C.outline} strokeWidth={5} paintOrder="stroke">
            ?
          </text>
        </g>
      );
    default:
      return null;
  }
};

export const Head: React.FC<{
  expression: ExpressionName;
  mouth?: MouthShape;
  blink?: number;
  frame?: number;
  brows?: { browL: Brow; browR: Brow }; // animated brows (springs) override the expression's
}> = ({ expression, mouth, blink = 0, frame = 0, brows }) => {
  const e = { ...EXPRESSIONS[expression], ...brows };
  return (
    <g>
      {/* neck */}
      <path d="M 356 280 L 444 280 L 452 350 L 348 350 Z" fill={C.skin} {...line} />
      <path d="M 360 300 Q 400 322 440 300 L 444 316 Q 400 336 356 316 Z" fill={C.skinShade} />
      {/* ears */}
      <ellipse cx={316} cy={224} rx={15} ry={24} fill={C.skin} {...line} />
      <ellipse cx={484} cy={224} rx={15} ry={24} fill={C.skin} {...line} />
      {/* head with strong jaw */}
      <path
        d="M 320 196 C 318 138 352 112 400 112 C 448 112 482 138 480 196 L 480 246 C 478 288 446 310 400 310 C 354 310 322 288 320 246 Z"
        fill={C.skin}
        {...line}
      />
      {/* chin dimple */}
      <path d="M 392 298 Q 400 304 408 298" fill="none" stroke={C.skinShade} strokeWidth={5} strokeLinecap="round" />
      {expression === 'angry' && <ellipse cx={400} cy={150} rx={70} ry={30} fill={C.anger} opacity={0.18} />}
      {(expression === 'laughing' || expression === 'smug') && (
        <g opacity={0.45}>
          <ellipse cx={340} cy={262} rx={16} ry={9} fill={C.blush} />
          <ellipse cx={460} cy={262} rx={16} ry={9} fill={C.blush} />
        </g>
      )}
      {/* hair: nerdy side-part swoop */}
      <path
        d="M 316 206 C 300 128 352 84 414 88 C 474 92 500 134 484 204 C 478 170 472 146 460 132 C 430 144 392 140 366 124 C 354 150 334 170 316 206 Z"
        fill={C.hair}
        {...line}
      />
      <path d="M 368 120 C 384 102 420 96 462 112" fill="none" stroke={C.hairHi} strokeWidth={7} strokeLinecap="round" />
      <path d="M 420 92 C 418 70 436 58 452 64 C 440 70 436 80 440 94" fill={C.hair} {...line} strokeWidth={5} />
      {/* eyes (inside lenses) */}
      <Eye x={EYE_L.x} y={EYE_L.y} style={e.eyes} look={e.look} blink={blink} />
      <Eye x={EYE_R.x} y={EYE_R.y} style={e.eyes} look={e.look} blink={blink} mirror />
      {/* glasses */}
      <g>
        <circle cx={EYE_L.x} cy={EYE_L.y} r={LENS_R} fill={C.lens} fillOpacity={0.22} stroke={C.outline} strokeWidth={9} />
        <circle cx={EYE_R.x} cy={EYE_R.y} r={LENS_R} fill={C.lens} fillOpacity={0.22} stroke={C.outline} strokeWidth={9} />
        <path d={`M ${EYE_L.x + LENS_R} ${EYE_L.y - 4} Q 400 ${EYE_L.y - 14} ${EYE_R.x - LENS_R} ${EYE_R.y - 4}`} fill="none" stroke={C.outline} strokeWidth={8} strokeLinecap="round" />
        <path d={`M ${EYE_L.x - LENS_R} ${EYE_L.y - 6} L 318 ${EYE_L.y - 10} M ${EYE_R.x + LENS_R} ${EYE_R.y - 6} L 482 ${EYE_R.y - 10}`} stroke={C.outline} strokeWidth={8} strokeLinecap="round" />
        <path d={`M ${EYE_L.x - 18} ${EYE_L.y - 20} Q ${EYE_L.x - 8} ${EYE_L.y - 26} ${EYE_L.x + 2} ${EYE_L.y - 24}`} fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" opacity={0.9} />
        <path d={`M ${EYE_R.x - 18} ${EYE_R.y - 20} Q ${EYE_R.x - 8} ${EYE_R.y - 26} ${EYE_R.x + 2} ${EYE_R.y - 24}`} fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" opacity={0.9} />
      </g>
      {/* brows */}
      <BrowShape cx={EYE_L.x - 2} b={e.browL} />
      <BrowShape cx={EYE_R.x + 2} b={e.browR} mirror />
      {/* nose */}
      <path d="M 400 232 Q 392 250 398 256 Q 404 258 410 254" fill="none" stroke={C.skinShade} strokeWidth={6} strokeLinecap="round" />
      <Mouth shape={mouth ?? e.mouth} />
      <Fx fx={e.fx} frame={frame} />
    </g>
  );
};
