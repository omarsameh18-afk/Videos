import React from 'react';
import { AbsoluteFill, interpolate, Loop, OffthreadVideo, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../../max/theme';
import { FONT_HEAD } from '../fonts';
import { CLIP } from '../geometry';
import { headline } from '../scenes/common';
import { SceneProps } from '../scenes/types';
import { VisualText } from '../visuals/VisualText';
import { TimerBadge } from '../experiment/SubjectsLayer';

const CLIP_FRAMES = 150; // 5 s generated clips, looped if the scene is longer

const Panel: React.FC<{ name: string; box: { x: number; y: number; w: number; h: number }; mirror?: boolean; zoom?: number; pulse: number }> = ({ name, box, mirror, zoom = 1, pulse }) => (
  <div
    style={{
      position: 'absolute',
      left: box.x,
      top: box.y,
      width: box.w,
      height: box.h,
      borderRadius: 34,
      overflow: 'hidden',
      border: '6px solid #0B0C1C',
      boxShadow: '0 14px 0 rgba(0,0,0,0.35)',
      transform: `scale(${1 + 0.03 * pulse})`,
    }}
  >
    <div style={{ width: '100%', height: '100%', transform: `scale(${(mirror ? -1 : 1) * zoom}, ${zoom})`, transformOrigin: '50% 40%' }}>
      <Loop durationInFrames={CLIP_FRAMES}>
        <OffthreadVideo src={staticFile(`clips/${name}.mp4`)} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </Loop>
    </div>
  </div>
);

/** One scene built from AI clips: full or split panels + overlays (question, labels, week, reps, meters, reveal). */
export const ClipSceneView: React.FC<SceneProps> = ({ scene, timing, pulse }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (scene.type !== 'ClipScene') return null;
  const p = scene.props;
  const dur = timing.durationInFrames;
  // first scene: everything is on screen at full strength from frame 1 (hook)
  const enter = timing.from === 0 ? 1 : spring({ frame: f, fps, config: { damping: 14, stiffness: 260, overshootClamping: true } });
  const zoom = p.reveal ? 1 + 0.15 * spring({ frame: f, fps, config: { damping: 15, stiffness: 120, overshootClamping: true } }) : 1;
  const flash = p.reveal ? interpolate(f, [0, 3, 10], [0, 0.9, 0], { extrapolateRight: 'clamp' }) : 0;
  const topText = p.question ?? (p.week ? `WEEK ${Math.min(p.week.to, p.week.from + Math.floor(((p.week.to - p.week.from + 1) * f) / dur))}` : undefined);
  const weekStep = p.week ? Math.floor(((p.week.to - p.week.from + 1) * f) / dur) : 0;
  const tick = p.week ? spring({ frame: f - Math.round((weekStep / (p.week.to - p.week.from + 1)) * dur), fps, config: { damping: 9, stiffness: 320 } }) : 1;
  const repAt = (n: number) => Math.min(n, Math.floor((n * f) / Math.max(1, dur * 0.85)));
  const boxes = p.layout === 'split' ? CLIP.split : [CLIP.full];
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', inset: 0, opacity: enter, transform: `translateY(${(1 - enter) * 60}px)` }}>
        <Panel name={p.clip} box={boxes[0]} zoom={zoom} pulse={pulse} />
        {p.layout === 'split' && <Panel name={p.clipRight ?? p.clip} box={boxes[1]} mirror={p.mirrorRight} pulse={pulse} />}
      </div>
      {topText && (
        <div style={{ position: 'absolute', left: CLIP.topText.x, top: CLIP.topText.y, width: CLIP.topText.w, transform: `scale(${p.week ? interpolate(tick, [0, 1], [1.3, 1]) : interpolate(enter, [0, 1], [0.6, 1])})` }}>
          <VisualText text={topText.toUpperCase()} width={CLIP.topText.w} max={130} color={C.accent} style={{ margin: '0 auto' }} />
        </div>
      )}
      {p.layout === 'split' && p.labels &&
        boxes.map((b, i) => (
          <div key={i} style={{ position: 'absolute', left: b.x + b.w / 2, top: CLIP.labelY + 4 }}>
            <TimerBadge label={p.labels![i].toUpperCase()} x={0} y={30} scale={0.95} restLeft={1} resting={false} />
          </div>
        ))}
      {p.reps &&
        boxes.map((b, i) => {
          const n = repAt(i === 0 ? p.reps!.left : p.reps!.right);
          return (
            <div key={`r${i}`} style={{ position: 'absolute', left: b.x + 16, top: b.y + b.h - 120, padding: '6px 18px', borderRadius: 18, background: 'rgba(11,12,28,0.85)', border: `4px solid ${i ? C.accent : C.accent2}` }}>
              <span style={{ fontFamily: FONT_HEAD, fontSize: 72, color: '#fff' }}>REPS {n}</span>
            </div>
          );
        })}
      {p.meters &&
        boxes.map((b, i) => (
          <div key={`m${i}`} style={{ position: 'absolute', left: b.x + 20, top: b.y + b.h - 70, width: b.w - 40, height: 40, borderRadius: 20, background: 'rgba(11,12,28,0.85)', border: '4px solid #0B0C1C', overflow: 'hidden' }}>
            <div style={{ width: `${(i ? p.meters!.right : p.meters!.left) * spring({ frame: f - 4, fps, config: { damping: 20, stiffness: 60, overshootClamping: true } })}%`, height: '100%', background: i ? C.accent : C.accent2 }} />
          </div>
        ))}
      {p.tags.length > 0 && (
        // tags live in the top band, never over the character
        <div style={{ position: 'absolute', left: CLIP.topText.x, top: CLIP.topText.y + 10, width: CLIP.topText.w, display: 'flex', justifyContent: 'center', gap: 36 }}>
          {p.tags.map((t, i) => {
            const s = spring({ frame: f - Math.round(dur * 0.25) - i * 8, fps, config: { damping: 10, stiffness: 300, overshootClamping: true } });
            return (
              <div key={t} style={{ ...headline(Math.min(110, Math.floor(CLIP.topText.w / p.tags.length / (t.length * 0.5))), i % 2 ? '#fff' : C.accent), whiteSpace: 'nowrap', transform: `scale(${s})`, opacity: s }}>
                {t.toUpperCase()}
              </div>
            );
          })}
        </div>
      )}
      {p.timers && (
        <div style={{ position: 'absolute', left: 0, top: 70, width: 1080 }}>
          <TimerBadge label="1 MIN" x={300} y={60} scale={interpolate(enter, [0, 1], [0.5, 1.15])} restLeft={1} resting={false} />
          <TimerBadge label="3 MIN" x={780} y={60} scale={interpolate(enter, [0, 1], [0.5, 1.15])} restLeft={1} resting={false} />
        </div>
      )}
      <AbsoluteFill style={{ background: '#fff', opacity: flash }} />
    </AbsoluteFill>
  );
};
