import React from 'react';
import { AbsoluteFill, Freeze, interpolate, Loop, OffthreadVideo, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../../max/theme';
import { FONT_HEAD } from '../fonts';
import { VERSUS } from '../geometry';
import { headline } from '../scenes/common';
import { SceneProps } from '../scenes/types';
import { TimerBadge } from '../experiment/SubjectsLayer';

const CLIP_FRAMES = 150;

const Half: React.FC<{ side: 'left' | 'right'; clip: string; scale: number; drain: number; freeze: boolean; mirror?: boolean }> = ({ side, clip, scale, drain, freeze, mirror }) => {
  const video = <OffthreadVideo src={staticFile(`clips/${clip}.mp4`)} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
  return (
    <div style={{ position: 'absolute', left: side === 'left' ? 0 : VERSUS.half, top: VERSUS.top, width: VERSUS.half, height: VERSUS.bottom - VERSUS.top, overflow: 'hidden' }}>
      <div
        style={{
          width: '100%',
          height: '100%',
          transform: `scale(${(mirror ? -1 : 1) * scale}, ${scale})`,
          transformOrigin: '50% 12%', // grows from the neck down: the head never leaves the frame
          filter: drain > 0 ? `saturate(${1 - 0.55 * drain}) brightness(${1 - 0.25 * drain})` : undefined,
        }}
      >
        {freeze ? <Freeze frame={60}>{video}</Freeze> : <Loop durationInFrames={CLIP_FRAMES}>{video}</Loop>}
      </div>
    </div>
  );
};

/** Edge-to-edge 1-min vs 3-min halves; week drives growth (right), drain (left) and the per-week rep numbers. */
export const VersusView: React.FC<SceneProps> = ({ scene, timing, pulse }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (scene.type !== 'ClipScene') return null;
  const p = scene.props;
  const dur = timing.durationInFrames;
  const w0 = p.week?.from ?? 1;
  const w1 = p.week?.to ?? w0;
  const n = w1 - w0 + 1;
  const weekNow = Math.min(w1, w0 + Math.floor((n * f) / dur)); // integer week shown
  const weekCont = w0 + Math.min(n - 1, (n * f) / dur); // continuous, for smooth growth
  const stepStart = Math.round(((weekNow - w0) / n) * dur);
  const tick = spring({ frame: f - stepStart, fps, config: { damping: 9, stiffness: 320 } });
  const first = timing.from === 0;

  const swap = p.swapRight && weekNow >= p.swapRight.atWeek;
  const rightClip = swap ? p.swapRight!.clip : p.clipRight ?? p.clip;
  const growR = 1 + (p.grow?.right ?? 0) * (weekCont - 1);
  const rightScale = swap ? p.swapRight!.scale + (p.grow?.right ?? 0) * 0.5 * (weekCont - p.swapRight!.atWeek) : growR;
  const leftScale = 1 + (p.grow?.left ?? 0) * (weekCont - 1);
  const drain = p.drainLeft ? Math.min(1, (weekCont - 1) / 7) : 0;
  const reps = p.repsByWeek;
  const repPop = (side: 'left' | 'right') => {
    if (!reps) return 1;
    const prev = reps[side][Math.max(0, weekNow - 2)];
    return weekNow > w0 && prev !== reps[side][weekNow - 1] ? interpolate(tick, [0, 1], [1.5, 1]) : 1;
  };

  return (
    <AbsoluteFill style={{ transform: `scale(${1 + 0.02 * pulse})` }}>
      <Half side="left" clip={p.clip} scale={leftScale} drain={drain} freeze={p.freeze} />
      <Half side="right" clip={rightClip} scale={rightScale} drain={0} freeze={p.freeze} mirror={p.mirrorRight && !swap} />
      {/* divider */}
      <div style={{ position: 'absolute', left: VERSUS.half - 4, top: VERSUS.top, width: 8, height: VERSUS.bottom - VERSUS.top, background: C.accent, boxShadow: '0 0 0 4px #0B0C1C' }} />
      {/* side labels (top corners) */}
      {p.labels &&
        (['left', 'right'] as const).map((side, i) => (
          <TimerBadge key={side} label={p.labels![i].toUpperCase()} x={side === 'left' ? 150 : VERSUS.half + 150} y={VERSUS.bottom - 220} scale={0.8} restLeft={1} resting={false} />
        ))}
      {/* one rep number per week */}
      {reps &&
        (['left', 'right'] as const).map((side) => (
          <div key={side} style={{ position: 'absolute', left: side === 'left' ? 24 : VERSUS.half + 24, top: VERSUS.bottom - 140, padding: '4px 20px', borderRadius: 20, background: 'rgba(11,12,28,0.88)', border: `5px solid ${side === 'left' ? C.accent2 : C.accent}`, transform: `scale(${repPop(side)})`, transformOrigin: 'left center' }}>
            <span style={{ fontFamily: FONT_HEAD, fontSize: 84, color: '#fff' }}>{reps[side][weekNow - 1]} REPS</span>
          </div>
        ))}
      {/* top band: week ticker or text lines */}
      <div style={{ position: 'absolute', left: 0, width: 1080, top: 40, height: VERSUS.top - 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {p.lines.length > 0
          ? p.lines.map((l, i) => {
              const s = first ? 1 : spring({ frame: f - i * 5, fps, config: { damping: 12, stiffness: 320, overshootClamping: true } });
              return (
                <div key={i} style={{ ...headline(Math.min(80, Math.floor(960 / (l.length * 0.66))), i === p.lines.length - 1 ? C.accent : '#fff'), whiteSpace: 'nowrap', lineHeight: 1.0, transform: `scale(${s})` }}>
                  {l.toUpperCase()}
                </div>
              );
            })
          : p.week && p.showWeek && (
              <div style={{ ...headline(120, C.accent), transform: `scale(${interpolate(tick, [0, 1], [1.35, 1])})` }}>WEEK {weekNow}</div>
            )}
      </div>
      {/* end card: big timers over the frozen halves */}
      {p.timers &&
        (['left', 'right'] as const).map((side, i) => (
          <TimerBadge key={`t${side}`} label={i ? '3 MIN' : '1 MIN'} x={side === 'left' ? 270 : 810} y={860} scale={interpolate(spring({ frame: f, fps, config: { damping: 11, stiffness: 260, overshootClamping: true } }), [0, 1], [0.6, 1.5])} restLeft={1} resting={false} />
        ))}
    </AbsoluteFill>
  );
};
