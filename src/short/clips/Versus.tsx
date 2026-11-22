import React from 'react';
import { AbsoluteFill, Freeze, interpolate, Loop, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../../max/theme';
import { FONT_HEAD } from '../fonts';
import { VERSUS } from '../geometry';
import { headline } from '../scenes/common';
import { SceneProps } from '../scenes/types';
import { TimerBadge } from '../experiment/SubjectsLayer';

const CLIP_FRAMES = 150;
// clips whose wanted state starts later (e.g. avg-exhausted is calm for ~2 s): start there (comp frames)
const CLIP_START: Record<string, number> = { 'avg-exhausted': 60 };
// clips that glitch later (avg-curl-fail spawns a 2nd shaker at ~2.75 s): hold their last clean frame
const CLIP_END: Record<string, number> = { 'avg-curl-fail': 78 };

const Video: React.FC<{ clip: string; offset: number; freeze: boolean }> = ({ clip, offset, freeze }) => {
  const start = Math.min(CLIP_FRAMES - 30, (CLIP_START[clip] ?? 0) + offset);
  const v = <OffthreadVideo src={staticFile(`clips/${clip}.mp4`)} startFrom={start} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
  const lf = useCurrentFrame();
  const end = CLIP_END[clip];
  if (freeze) return <Freeze frame={Math.min(40, end ? end - start - 1 : 40)}>{v}</Freeze>;
  if (end) return lf >= end - start ? <Freeze frame={end - start - 1}>{v}</Freeze> : v;
  return <Loop durationInFrames={CLIP_FRAMES - start}>{v}</Loop>;
};

/** One half: plays `seq` in segments of segF frames (each segment restarts its clip), scaled from the neck down. */
const Half: React.FC<{ side: 'left' | 'right'; seq: string[]; segF: number; from: number; scale: number; freeze: boolean; mirror?: boolean; offset: number; punch?: number }> = ({
  side, seq, segF, from, scale, freeze, mirror, offset, punch = 0,
}) => {
  const f = useCurrentFrame() - from;
  const k = freeze ? 0 : Math.max(0, Math.floor(f / segF));
  const clip = seq[k % seq.length];
  const s = scale * (1 + 0.12 * punch);
  return (
    <div style={{ position: 'absolute', left: side === 'left' ? 0 : VERSUS.half, top: VERSUS.top, width: VERSUS.half, height: VERSUS.bottom - VERSUS.top, overflow: 'hidden' }}>
      <div style={{ width: '100%', height: '100%', transform: `scale(${(mirror ? -1 : 1) * s}, ${s})`, transformOrigin: '50% 12%' }}>
        <Sequence key={k} from={from + k * segF} durationInFrames={freeze ? undefined : segF} layout="none">
          <Video clip={clip} offset={offset} freeze={freeze} />
        </Sequence>
      </div>
    </div>
  );
};

/** Edge-to-edge 1-min vs 3-min halves; the week drives growth, the BIG swap (growth moment) and the rep numbers. */
export const VersusView: React.FC<SceneProps> = ({ scene, timing, pulse }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (scene.type !== 'ClipScene') return null;
  const p = scene.props;
  const dur = timing.durationInFrames;
  const segF = Math.round(p.segSec * fps);
  const w0 = p.week?.from ?? 1;
  const w1 = p.week?.to ?? w0;
  const n = w1 - w0 + 1;
  const weekNow = Math.min(w1, w0 + Math.floor((n * f) / dur));
  const weekCont = w0 + Math.min(n - 1, (n * f) / dur);
  const stepStart = Math.round(((weekNow - w0) / n) * dur);
  const tick = spring({ frame: f - stepStart, fps, config: { damping: 9, stiffness: 320 } });
  const first = timing.from === 0;

  // growth moment: the week the 3-min side switches to the BIG clips
  const atW = p.swapRight?.atWeek;
  const swap = atW !== undefined && weekNow >= atW;
  const swapFrame = atW !== undefined && atW > w0 && atW <= w1 ? Math.round(((atW - w0) / n) * dur) : swap ? 0 : -1;
  const sinceSwap = swapFrame >= 0 ? f - swapFrame : -1;
  const growFlash = swapFrame > 0 && sinceSwap >= 0 ? interpolate(sinceSwap, [0, 2, 10], [0, 0.85, 0], { extrapolateRight: 'clamp' }) : 0;
  const punch = swapFrame > 0 && sinceSwap >= 0 ? 1 - spring({ frame: sinceSwap, fps, config: { damping: 12, stiffness: 200 } }) : 0;

  const seqL = p.seqLeft ?? [p.clip];
  const seqR = swap ? p.seqRightBig ?? [p.swapRight!.clip] : p.seqRight ?? [p.clipRight ?? p.clip];
  const rightFrom = swap && swapFrame > 0 ? swapFrame : 0;
  const rightScale = swap ? p.swapRight!.scale : 1 + (p.grow?.right ?? 0) * (weekCont - 1);
  const leftScale = 1 + (p.grow?.left ?? 0) * (weekCont - 1);
  const reps = p.repsByWeek;
  const repPop = (side: 'left' | 'right') => {
    if (!reps) return 1;
    const prev = reps[side][Math.max(0, weekNow - 2)];
    return weekNow > w0 && prev !== reps[side][weekNow - 1] ? interpolate(tick, [0, 1], [1.5, 1]) : 1;
  };

  return (
    <AbsoluteFill style={{ transform: `scale(${1 + 0.02 * pulse})` }}>
      <Half side="left" seq={seqL} segF={segF} from={0} scale={leftScale} freeze={p.freeze} offset={0} />
      <Half side="right" seq={seqR} segF={segF} from={rightFrom} scale={rightScale} freeze={p.freeze} mirror={p.mirrorRight && !swap} offset={swap ? 0 : p.offsetRight} punch={punch} />
      <div style={{ position: 'absolute', left: VERSUS.half, top: VERSUS.top, width: VERSUS.half, height: VERSUS.bottom - VERSUS.top, background: '#fff', opacity: growFlash }} />
      <div style={{ position: 'absolute', left: VERSUS.half - 4, top: VERSUS.top, width: 8, height: VERSUS.bottom - VERSUS.top, background: C.accent, boxShadow: '0 0 0 4px #0B0C1C' }} />
      {p.labels &&
        (['left', 'right'] as const).map((side, i) => (
          <TimerBadge key={side} label={p.labels![i].toUpperCase()} x={side === 'left' ? 150 : VERSUS.half + 150} y={VERSUS.bottom - 200} scale={0.8} restLeft={1} resting={false} />
        ))}
      {reps &&
        (['left', 'right'] as const).map((side) => (
          <div key={side} style={{ position: 'absolute', left: side === 'left' ? 24 : VERSUS.half + 24, top: VERSUS.bottom - 130, padding: '2px 18px', borderRadius: 20, background: 'rgba(11,12,28,0.88)', border: `5px solid ${side === 'left' ? C.accent2 : C.accent}`, transform: `scale(${repPop(side)})`, transformOrigin: 'left center' }}>
            <span style={{ fontFamily: FONT_HEAD, fontSize: 80, color: '#fff' }}>{reps[side][weekNow - 1]} REPS</span>
          </div>
        ))}
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
          : p.week && p.showWeek && <div style={{ ...headline(120, C.accent), transform: `scale(${interpolate(tick, [0, 1], [1.35, 1])})` }}>WEEK {weekNow}</div>}
      </div>
      {p.timers &&
        (['left', 'right'] as const).map((side, i) => (
          <TimerBadge key={`t${side}`} label={i ? '3 MIN' : '1 MIN'} x={side === 'left' ? 270 : 760} y={760} scale={interpolate(spring({ frame: f, fps, config: { damping: 11, stiffness: 260, overshootClamping: true } }), [0, 1], [0.6, 1.3])} restLeft={1} resting={false} />
        ))}
    </AbsoluteFill>
  );
};
