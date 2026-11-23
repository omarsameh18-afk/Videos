import React from 'react';
import { AbsoluteFill, interpolate, Loop, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../../max/theme';
import { headline } from '../scenes/common';
import { SceneProps } from '../scenes/types';
import { Silhouette } from './Solo';

// FILL format: ONE Max, the clip fills 1080x1920 edge to edge (no side panels, no boxed clip).
// The clip sits DROP px lower so the title band above his hair stays clear; a zoomed copy of the same
// clip's top (gym wall) fills the strip behind the title band.
export const FILL = { drop: 110, titleH: 190, captionY: 1425, captionH: 140, sourceY: 206 };
const CLIP_FRAMES = 150;
const WAIST = 0.64; // below the hanging hands so the growth never cuts an arm

const Clip: React.FC<{ clip: string; start?: number }> = ({ clip, start = 0 }) => (
  <Loop durationInFrames={CLIP_FRAMES - start}>
    <OffthreadVideo src={staticFile(`clips/${clip}.mp4`)} startFrom={start} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
  </Loop>
);

const Body: React.FC<{ clip: string; start: number; upper: number; zoom: number; focusY: number }> = ({ clip, start, upper, zoom, focusY }) => (
  <div style={{ position: 'absolute', left: 0, top: FILL.drop, width: 1080, height: 1920, transform: `scale(${zoom})`, transformOrigin: `50% ${focusY * 100}%` }}>
    <div style={{ position: 'absolute', inset: 0 }}>
      <Clip clip={clip} start={start} />
    </div>
    {upper > 1.001 && (
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${upper}, ${1 + (upper - 1) * 0.3})`, transformOrigin: `50% ${WAIST * 100}%` }}>
        <div style={{ position: 'absolute', inset: 0, WebkitMaskImage: `radial-gradient(ellipse 64% 48% at 50% ${WAIST * 100 - 26}%, #000 78%, transparent 100%)`, clipPath: `inset(0 0 ${(1 - WAIST) * 100}% 0)` }}>
          <Clip clip={clip} start={start} />
        </div>
      </div>
    )}
  </div>
);

export const FillView: React.FC<SceneProps> = ({ scene, timing }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (scene.type !== 'ClipScene') return null;
  const p = scene.props;
  const dur = timing.durationInFrames;
  const first = timing.from === 0;
  const segF = Math.round(p.segSec * fps);
  const seq = p.seqLeft ?? [p.clip];
  const k = p.freeze ? 0 : Math.floor(f / segF);
  const clip = seq[k % seq.length];
  const start = (p.clipStarts?.[k % seq.length] ?? p.clipStart) || 0;
  const prog = Math.min(1, f / Math.max(1, dur - 1));
  const upper = p.upper ? interpolate(prog, [0, 1], [p.upper.from, p.upper.to]) : 1;
  const punch = first ? 0 : 1 - spring({ frame: f, fps, config: { damping: 12, stiffness: 200 } });
  const zoom = (p.zoom ?? 1) * (1 + 0.06 * punch) * (1 + 0.012 * Math.sin(f / 9) * (p.silhouette ? 0 : 1));
  const flash = first ? 0 : interpolate(f, [0, 2, 8], [0, p.flash ?? 0.45, 0], { extrapolateRight: 'clamp' });
  const tick = spring({ frame: f, fps, config: { damping: 9, stiffness: 320 } });
  const counter = p.week && p.showWeek ? `${p.unit} ${p.week.to}` : undefined;
  const glowIn = spring({ frame: f - 6, fps, config: { damping: 18, stiffness: 90, overshootClamping: true } });

  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: '#1B2140' }}>
      {p.silhouette ? (
        <>
          <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 62%, rgba(184,255,46,0.22), rgba(20,24,51,1) 62%)' }} />
          <div style={{ position: 'absolute', left: 0, top: 120, width: 1080, height: 1300, transform: 'scale(1.25)', transformOrigin: '50% 30%' }}>
            <Silhouette glow={glowIn} f={f} small />
          </div>
          {p.bigNumber &&
            (() => {
              const m = p.bigNumber.text.match(/^(\D*)(\d+)(.*)$/);
              const cnt = spring({ frame: f - 4, fps, config: { damping: 20, stiffness: 70, overshootClamping: true } });
              const shown = m ? `${m[1]}${Math.round(Number(m[2]) * cnt)}${m[3]}` : p.bigNumber.text;
              const pop = spring({ frame: f - 2, fps, config: { damping: 9, stiffness: 260 } });
              return (
                <div style={{ position: 'absolute', left: 0, width: 1080, top: 230, textAlign: 'center' }}>
                  <div style={{ ...headline(260, C.accent), lineHeight: 1, transform: `scale(${interpolate(pop, [0, 1], [0.6, 1])})` }}>{shown}</div>
                  <div style={{ ...headline(84, '#fff'), marginTop: 8, opacity: interpolate(f, [10, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>{p.bigNumber.label.toUpperCase()}</div>
                </div>
              );
            })()}
        </>
      ) : (
        <>
          {/* strip behind the title band: the same clip's wall, zoomed from the top */}
          <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: 'scale(1.3)', transformOrigin: '50% 0%' }}>
            <Sequence key={`w${k}`} from={p.freeze ? 0 : k * segF} layout="none">
              <Clip clip={clip} start={start} />
            </Sequence>
          </div>
          <Sequence key={k} from={p.freeze ? 0 : k * segF} durationInFrames={p.freeze ? undefined : segF} layout="none">
            <Body clip={clip} start={start} upper={upper} zoom={zoom} focusY={p.focusY ?? 0.5} />
          </Sequence>
        </>
      )}
      {/* title band: gradient so the text reads, never an empty block */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: FILL.titleH + 90, background: 'linear-gradient(rgba(11,12,28,0.82) 55%, rgba(11,12,28,0))' }} />
      {p.bodyMeters && (
        <div style={{ position: 'absolute', left: 28, top: FILL.titleH + 14, width: 330, padding: '8px 14px', borderRadius: 18, background: 'rgba(11,12,28,0.72)' }}>
          {(
            [
              ['UPPER BODY', p.bodyMeters.upper, C.accent],
              ['LEGS', p.bodyMeters.legs, C.accent2],
            ] as const
          ).map(([label, v, col]) => {
            const val = interpolate(prog, [0, 1], [v[0], v[1]]);
            const blink = v[1] <= 0 ? 0.55 + 0.45 * Math.abs(Math.sin(f / 5)) : 1;
            return (
              <div key={label} style={{ marginBottom: 6 }}>
                <div style={{ ...headline(46, '#fff'), textAlign: 'left' }}>
                  {label} <span style={{ color: col, opacity: blink }}>{Math.round(val)}%</span>
                </div>
                <div style={{ height: 26, borderRadius: 13, background: 'rgba(0,0,0,0.6)', border: '3px solid #0B0C1C', overflow: 'hidden' }}>
                  <div style={{ width: `${val}%`, height: '100%', background: col }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ position: 'absolute', left: 40, width: 880, top: 22, height: FILL.titleH - 22, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {p.lines.length > 0
          ? p.lines.map((l, i) => {
              const s = first ? 1 : spring({ frame: f - i * 5, fps, config: { damping: 12, stiffness: 320, overshootClamping: true } });
              return (
                <div key={i} style={{ ...headline(Math.min(96, Math.floor(840 / (l.length * 0.62))), i === p.lines.length - 1 ? C.accent : '#fff'), whiteSpace: 'nowrap', lineHeight: 1.0, transform: `scale(${s})` }}>
                  {l.toUpperCase()}
                </div>
              );
            })
          : counter && <div style={{ ...headline(130, C.accent), transform: `scale(${interpolate(tick, [0, 1], [1.4, 1])})` }}>{counter}</div>}
      </div>
      <AbsoluteFill style={{ background: '#fff', opacity: flash }} />
    </AbsoluteFill>
  );
};
