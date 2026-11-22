import React from 'react';
import { C, line } from './theme';
import { BodyParams, DEFAULT_BODY, torsoScaleX } from './body';

const Mirror: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>
    {children}
    <g transform="translate(800 0) scale(-1 1)">{children}</g>
  </>
);

export const Legs: React.FC<{ body?: BodyParams }> = ({ body = DEFAULT_BODY }) => (
  <g>
    <g transform={`translate(400 0) scale(${body.legs} 1) translate(-400 0)`}>
      <path d="M 304 700 L 496 700 L 508 948 L 414 948 L 400 790 L 386 948 L 292 948 Z" fill={C.pants} {...line} />
      <path d="M 400 760 L 400 800" stroke={C.pantsShade} strokeWidth={6} />
      <path d="M 330 760 Q 338 830 332 900 M 470 760 Q 462 830 468 900" fill="none" stroke={C.pantsShade} strokeWidth={6} opacity={Math.max(0, (body.legs - 1) * 3)} />
    </g>
    <Mirror>
      {/* chunky sneaker: upper, toe cap, lime stripe, laces, white midsole, thick dark outsole */}
      <path d="M 300 924 L 380 924 Q 394 928 394 958 L 394 972 L 246 972 Q 238 948 262 938 Q 280 932 300 924 Z" fill={C.shoe} {...line} />
      <path d="M 246 972 Q 238 948 262 938 Q 280 934 292 942 Q 286 960 290 972 Z" fill={C.coatShade} {...line} strokeWidth={4} />
      <path d="M 302 958 Q 340 954 380 934" fill="none" stroke={C.tank} strokeWidth={10} strokeLinecap="round" />
      <path d="M 314 930 L 324 940 M 330 926 L 340 936 M 346 924 L 356 934" stroke={C.outline} strokeWidth={4} strokeLinecap="round" />
      <rect x={238} y={966} width={160} height={14} rx={7} fill="#FFFFFF" {...line} strokeWidth={4} />
      <rect x={236} y={978} width={164} height={20} rx={10} fill={C.sole} stroke={C.soleEdge} strokeWidth={3} />
    </Mirror>
  </g>
);

// Back layer: lab coat tails (behind torso)
export const CoatBack: React.FC = () => (
  <Mirror>
    <path d="M 250 520 L 286 700 L 226 900 L 330 906 L 330 600 Z" fill={C.coatShade} {...line} />
  </Mirror>
);

export const Torso: React.FC<{ body?: BodyParams }> = ({ body = DEFAULT_BODY }) => {
  const absDef = Math.max(0, Math.min(1, (body.abs - 0.8) / 0.6)) * (1 - body.belly);
  return (
  <g transform={`translate(400 0) scale(${torsoScaleX(body)} 1) translate(-400 0)`}>
    {/* skin V-taper: traps + lats */}
    <path
      d="M 352 300 C 300 330 236 330 206 356 C 186 378 190 424 214 446 L 300 716 L 500 716 L 586 446 C 610 424 614 378 594 356 C 564 330 500 330 448 300 Z"
      fill={C.skin}
      {...line}
    />
    {/* neon tank top */}
    <path
      d="M 314 340 L 354 340 C 362 400 438 400 446 340 L 486 340 C 494 384 540 420 566 452 L 506 732 L 294 732 L 234 452 C 260 420 306 384 314 340 Z"
      fill={C.tank}
      {...line}
    />
    {/* pecs (chest slider) */}
    <g transform={`translate(400 470) scale(${body.chest}) translate(-400 -470)`}>
      <path d="M 318 478 C 346 506 384 504 400 478 C 416 504 454 506 482 478" fill="none" stroke={C.tankShade} strokeWidth={5 + (body.chest - 0.8) * 8} strokeLinecap="round" />
    </g>
    {/* abs (abs slider; hidden by belly) */}
    <g opacity={0.25 + 0.75 * absDef}>
      <path d="M 400 520 L 400 680 M 368 572 Q 384 578 396 572 M 404 572 Q 416 578 432 572 M 372 626 Q 386 632 396 626 M 404 626 Q 414 632 428 626" fill="none" stroke={C.tankShade} strokeWidth={4 + absDef * 4} strokeLinecap="round" />
      {body.abs > 1.12 &&
        [528, 582, 636].map((y) =>
          [-1, 1].map((sx) => <rect key={`${y}${sx}`} x={sx < 0 ? 366 : 406} y={y} width={28} height={40} rx={12} fill={C.tankShade} opacity={Math.min(1, (body.abs - 1.12) * 4) * (1 - body.belly)} />),
        )}
    </g>
    {/* belly (belly slider) */}
    {body.belly > 0.02 && (
      <ellipse cx={400} cy={655} rx={110 + 90 * body.belly} ry={40 + 70 * body.belly} fill={C.tank} {...line} opacity={Math.min(1, body.belly * 4)} />
    )}
    <path d="M 296 712 L 504 712" stroke={C.tankShade} strokeWidth={6} />
    {/* open lab coat front panels */}
    <Mirror>
      <path
        d="M 340 318 C 290 330 224 334 200 360 C 186 380 192 424 214 452 L 286 700 L 258 906 L 334 910 L 326 720 L 300 560 L 296 470 L 322 380 Z"
        fill={C.coat}
        {...line}
      />
      {/* lapel */}
      <path d="M 340 318 L 322 380 L 296 470 L 266 420 L 284 360 Z" fill={C.coatShade} {...line} strokeWidth={5} />
      <path d="M 296 470 L 300 560 L 326 720" fill="none" stroke={C.coatShade} strokeWidth={5} />
      {/* button */}
      <circle cx={292} cy={620} r={7} fill={C.coatShade} {...line} strokeWidth={3} />
    </Mirror>
    {/* pocket with pens (screen-left only) */}
    <g>
      <rect x={232} y={760} width={70} height={58} rx={6} fill={C.coat} {...line} strokeWidth={5} />
      <rect x={244} y={736} width={10} height={36} rx={4} fill={C.accent2} {...line} strokeWidth={3} />
      <rect x={262} y={730} width={10} height={42} rx={4} fill={C.tank} {...line} strokeWidth={3} />
      <rect x={280} y={740} width={10} height={32} rx={4} fill="#4DA3FF" {...line} strokeWidth={3} />
    </g>
  </g>
  );
};
