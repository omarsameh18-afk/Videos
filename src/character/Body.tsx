import React from 'react';
import { C, line } from './theme';

const Mirror: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>
    {children}
    <g transform="translate(800 0) scale(-1 1)">{children}</g>
  </>
);

export const Legs: React.FC = () => (
  <g>
    <path d="M 304 700 L 496 700 L 508 948 L 414 948 L 400 790 L 386 948 L 292 948 Z" fill={C.pants} {...line} />
    <path d="M 400 760 L 400 800" stroke={C.pantsShade} strokeWidth={6} />
    <Mirror>
      <path d="M 282 944 L 392 944 Q 398 984 386 990 L 264 990 Q 250 980 262 962 Q 270 948 282 944 Z" fill={C.shoe} {...line} />
      <path d="M 260 978 L 392 978" stroke={C.sole} strokeWidth={10} strokeLinecap="round" />
      <path d="M 304 952 L 326 960 M 318 948 L 338 956" stroke={C.tank} strokeWidth={5} strokeLinecap="round" />
    </Mirror>
  </g>
);

// Back layer: lab coat tails (behind torso)
export const CoatBack: React.FC = () => (
  <Mirror>
    <path d="M 250 520 L 286 700 L 226 900 L 330 906 L 330 600 Z" fill={C.coatShade} {...line} />
  </Mirror>
);

export const Torso: React.FC = () => (
  <g>
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
    {/* pecs + abs hints */}
    <path d="M 318 478 C 346 506 384 504 400 478 C 416 504 454 506 482 478" fill="none" stroke={C.tankShade} strokeWidth={7} strokeLinecap="round" />
    <path d="M 400 520 L 400 680 M 368 572 Q 384 578 396 572 M 404 572 Q 416 578 432 572 M 372 626 Q 386 632 396 626 M 404 626 Q 414 632 428 626" fill="none" stroke={C.tankShade} strokeWidth={6} strokeLinecap="round" />
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
