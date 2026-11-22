import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { MaxFigure } from '../../max/MaxFigure';
import { POSES, blendPose, PoseDef } from '../../max/poses';
import { ExpressionName } from '../../max/expressions';
import { blinkAmount } from '../../max/blink';
import { C } from '../../max/theme';
import { FONT_HEAD } from '../fonts';
import { ShortProps } from '../types';
import { activityAt, bodyAt, EXPERIMENT_TYPES, SUBJ } from './timeline';

type Side = 'left' | 'right';
const sides: Side[] = ['left', 'right'];

// squat rack behind each subject
const Rack: React.FC<{ cx: number }> = ({ cx }) => {
  const s = SUBJ.scale;
  const top = SUBJ.feetY - 1000 * s;
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', left: 0, top: 0 }}>
      {[-1, 1].map((d) => (
        <g key={d}>
          <rect x={cx + d * 250 * s - 14} y={top + 40} width={28} height={SUBJ.feetY - top - 40} rx={6} fill="#3A3F5C" stroke="#0B0C1C" strokeWidth={5} />
          <rect x={cx + d * 250 * s - (d > 0 ? 0 : 34)} y={top + 330 * s} width={34} height={14} rx={4} fill="#8C93B8" />
        </g>
      ))}
      <rect x={cx - 250 * s - 14} y={top + 30} width={500 * s + 28} height={22} rx={8} fill="#3A3F5C" stroke="#0B0C1C" strokeWidth={5} />
      <rect x={cx - 300 * s} y={SUBJ.feetY - 6} width={600 * s} height={14} rx={6} fill="#2B2F45" />
    </svg>
  );
};

// floor shaker (put down while lifting)
const FloorShaker: React.FC<{ x: number }> = ({ x }) => (
  <svg width={1080} height={1920} style={{ position: 'absolute', left: 0, top: 0 }}>
    <g transform={`translate(${x} ${SUBJ.feetY - 40}) scale(0.5)`}>
      <path d="M -34 -78 L 34 -78 L 28 72 Q 0 82 -28 72 Z" fill={C.shaker} stroke="#1B1B2F" strokeWidth={6} />
      <rect x={-40} y={-104} width={80} height={30} rx={8} fill={C.shakerLid} />
    </g>
  </svg>
);

// label badge + rest-timer ring
export const TimerBadge: React.FC<{ label: string; x: number; y: number; scale: number; restLeft: number; resting: boolean }> = ({ label, x, y, scale, restLeft, resting }) => (
  <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${scale})`, display: 'flex', alignItems: 'center', gap: 14 }}>
    <svg width={96} height={96} viewBox="-50 -50 100 100">
      <circle r={40} fill="#0B0C1C" stroke="#3A3F5C" strokeWidth={10} />
      <circle r={40} fill="none" stroke={resting ? C.accent : '#8C93B8'} strokeWidth={10} strokeDasharray={`${(resting ? restLeft : 1) * 251} 251`} transform="rotate(-90)" strokeLinecap="round" />
      <path d="M 0 -22 L 0 2 L 14 10" stroke="#fff" strokeWidth={7} fill="none" strokeLinecap="round" />
      <rect x={-8} y={-58} width={16} height={12} rx={4} fill="#8C93B8" />
    </svg>
    <div style={{ fontFamily: FONT_HEAD, fontSize: 76, color: '#fff', WebkitTextStroke: '9px #0B0C1C', paintOrder: 'stroke fill', whiteSpace: 'nowrap' }}>{label}</div>
  </div>
);

/** The two test subjects for experiment scenes: bodies change smoothly, sets/rests animate, reveal camera. */
export const SubjectsLayer: React.FC<ShortProps> = ({ script, scenes }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  let si = 0;
  while (si + 1 < scenes.length && scenes[si + 1].from <= frame) si++;
  const sc = script.scenes[si];
  if (!EXPERIMENT_TYPES.includes(sc.type)) return null; // (ClipScene uses AI clips, not the rig)
  const local = frame - scenes[si].from;
  const props = sc.props as Record<string, unknown>;
  const exp = script.scenes.map((s) => (EXPERIMENT_TYPES.includes(s.type) ? s : { type: s.type, props: {} })) as { type: string; props: Record<string, unknown> }[];

  // reveal camera: zoom on the focus subject, feet anchored, centred horizontally
  let cam = '';
  if (sc.type === 'Reveal') {
    const z = spring({ frame: local, fps, config: { damping: 15, stiffness: 140, overshootClamping: true } });
    const fx = SUBJ.cx[props.focus as Side];
    const zoom = 1 + 0.25 * z;
    cam = `translate(${(540 - fx) * z}px, 0px) translate(${fx}px, ${SUBJ.feetY}px) scale(${zoom}) translate(${-fx}px, ${-SUBJ.feetY}px)`;
  }
  // timer badges: hook = slam at centre then fly to the heads; timersCenter scene = fly back to centre (loop)
  const first = si === 0;
  const toCenter = (props.timersCenter as boolean) ? spring({ frame: local, fps, config: { damping: 14, stiffness: 200, overshootClamping: true } }) : 0;
  const fromCenter = first ? 1 - spring({ frame: local - 10, fps, config: { damping: 14, stiffness: 180, overshootClamping: true } }) : 0;
  const centerAmt = Math.max(toCenter, fromCenter);
  const slam = first ? spring({ frame: local, fps, config: { damping: 12, stiffness: 420, overshootClamping: true } }) : 1;

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{ position: 'absolute', inset: 0, transform: cam, transformOrigin: '0 0' }}>
        {sides.map((side) => {
          const subj = props[side] as { label: string; timer?: number; activity: string; expression?: ExpressionName };
          const body = bodyAt(exp, scenes, side, frame);
          const act = activityAt(subj, local);
          const tired = body.fatigue > 0.4;
          let pose: PoseDef = POSES.idle;
          let expression: ExpressionName = 'neutral';
          if (act.phase === 'lift') {
            pose = blendPose(POSES.pressDown, POSES.pressUp, act.press);
            expression = 'angry';
          } else if (act.phase === 'rest') {
            pose = tired ? POSES.idle : POSES.sip;
            expression = tired ? 'shocked' : 'smug';
          } else if (act.phase === 'flex') {
            pose = POSES.flexing;
            expression = sc.type === 'Reveal' && props.focus === side ? 'laughing' : 'neutral';
          }
          if (subj.expression) expression = subj.expression;
          const s = SUBJ.scale;
          const cx = SUBJ.cx[side];
          return (
            <React.Fragment key={side}>
              <Rack cx={cx} />
              {act.phase === 'lift' && <FloorShaker x={cx + (side === 'left' ? -150 : 150)} />}
              <div style={{ position: 'absolute', left: cx - 400 * s, top: SUBJ.feetY - 999 * s, width: 800 * s, height: 1000 * s }}>
                <MaxFigure body={body} pose={pose} barbell={act.phase === 'lift'} expression={expression} frame={frame + (side === 'left' ? 0 : 17)} blink={blinkAmount(frame, fps, script.meta.seed + (side === 'left' ? 0 : 5))} />
              </div>
            </React.Fragment>
          );
        })}
      </div>
      {sc.type !== 'Reveal' &&
        sides.map((side) => {
          const subj = props[side] as { label: string; timer?: number; activity: string };
          const act = activityAt(subj, local);
          const x = interpolate(centerAmt, [0, 1], [SUBJ.cx[side], side === 'left' ? 285 : 795]);
          const y = interpolate(centerAmt, [0, 1], [SUBJ.labelY, 380]);
          const sc2 = interpolate(centerAmt, [0, 1], [1, 1.4]) * (first ? interpolate(slam, [0, 1], [1.25, 1]) : 1);
          return <TimerBadge key={side} label={subj.label.toUpperCase()} x={x} y={y} scale={sc2} restLeft={act.restLeft} resting={act.phase === 'rest'} />;
        })}
    </div>
  );
};
