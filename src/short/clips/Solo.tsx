import React from 'react';
import { AbsoluteFill, interpolate, Loop, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../../max/theme';
import { FONT_HEAD } from '../fonts';
import { VERSUS } from '../geometry';
import { headline } from '../scenes/common';
import { SceneProps } from '../scenes/types';

// SOLO format: ONE Max, full frame, visible transformation over time.
// The 9:16 clip is fitted so his whole body (head to feet) sits between the top band and the caption band;
// a blurred, darkened copy of the same clip fills the rest of the frame edge to edge.
const CLIP_FRAMES = 150;
const PANEL = { top: VERSUS.top, bottom: VERSUS.bottom };
const PH = PANEL.bottom - PANEL.top;
const VH = Math.round(PH / 0.92); // the clip shows head at ~4% and feet at ~93% of its height
const VW = Math.round((VH * 1072) / 1928);
const VTOP = PANEL.top - Math.round(VH * 0.035);
const WAIST = 0.56; // where the tank top ends in the library clips (fraction of clip height)

const Clip: React.FC<{ clip: string; start?: number; style?: React.CSSProperties }> = ({ clip, start = 0, style }) => (
  <Loop durationInFrames={CLIP_FRAMES - start}>
    <OffthreadVideo src={staticFile(`clips/${clip}.mp4`)} startFrom={start} muted style={{ width: '100%', height: '100%', objectFit: 'cover', ...style }} />
  </Loop>
);

/** The fitted character clip; `upper` > 1 scales only the body above the waist (legs stay the same). */
const Body: React.FC<{ clip: string; upper: number; punch: number; start: number }> = ({ clip, upper, punch, start }) => {
  const s = 1 + 0.08 * punch;
  const box: React.CSSProperties = { position: 'absolute', left: (1080 - VW) / 2, top: VTOP - PANEL.top, width: VW, height: VH, transform: `scale(${s})`, transformOrigin: '50% 60%', overflow: 'hidden' };
  return (
    <div style={box}>
      {/* legs + background: unscaled */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <Clip clip={clip} start={start} />
      </div>
      {upper > 1.001 && (
        <div style={{ position: 'absolute', inset: 0, transform: `scale(${upper}, ${1 + (upper - 1) * 0.6})`, transformOrigin: `50% ${WAIST * 100}%` }}>
          <div style={{ position: 'absolute', inset: 0, WebkitMaskImage: `radial-gradient(ellipse 64% 48% at 50% ${WAIST * 100 - 26}%, #000 78%, transparent 100%)`, clipPath: `inset(0 0 ${(1 - WAIST) * 100}% 0)` }}>
            <Clip clip={clip} start={start} />
          </div>
        </div>
      )}
    </div>
  );
};

/** Simple front body silhouette; the legs glow (reveal card). */
const Silhouette: React.FC<{ glow: number; f: number; small?: boolean }> = ({ glow, f, small }) => {
  const pulse = 0.65 + 0.35 * Math.sin(f / 4);
  const up = '#3A4066';
  const legFill = C.accent;
  return (
    <svg width={small ? 400 : 560} height={small ? 714 : 1000} viewBox="0 0 280 500" style={{ position: 'absolute', left: small ? 340 : 260, top: small ? 410 : 90, overflow: 'visible' }}>
      <defs>
        <filter id="legGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={6 + 6 * pulse} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g stroke="#0B0C1C" strokeWidth={5} strokeLinejoin="round">
        <circle cx={140} cy={42} r={32} fill={up} />
        <path d="M118 74 L162 74 L166 90 Q214 96 224 120 L246 230 Q250 246 236 248 L222 248 L204 150 L196 232 L84 232 L76 150 L58 248 L44 248 Q30 246 34 230 L56 120 Q66 96 114 90 Z" fill={up} />
        <g filter="url(#legGlow)" opacity={0.35 + 0.65 * glow}>
          <path d="M84 232 L196 232 L200 262 L188 470 L150 470 L142 290 L138 290 L130 470 L92 470 L80 262 Z" fill={legFill} />
        </g>
      </g>
    </svg>
  );
};

export const SoloView: React.FC<SceneProps> = ({ scene, timing }) => {
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
  const prog = Math.min(1, f / Math.max(1, dur - 1));
  const upper = p.upper ? interpolate(prog, [0, 1], [p.upper.from, p.upper.to]) : 1;
  const enterPunch = first ? 0 : 1 - spring({ frame: f, fps, config: { damping: 12, stiffness: 200 } });
  const flash = first ? 0 : interpolate(f, [0, 2, 9], [0, 0.6, 0], { extrapolateRight: 'clamp' });
  const tick = spring({ frame: f, fps, config: { damping: 9, stiffness: 320 } });
  const counter = p.week && p.showWeek ? `${p.unit} ${p.week.to}` : undefined;
  const glowIn = spring({ frame: f - 6, fps, config: { damping: 18, stiffness: 90, overshootClamping: true } });

  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 0, top: PANEL.top, width: 1080, height: PH, overflow: 'hidden', background: '#141833' }}>
        {p.silhouette ? (
          <>
            <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 70%, rgba(184,255,46,0.18), rgba(11,12,28,0) 60%)' }} />
            <Silhouette glow={glowIn} f={f} small={!!p.bigNumber} />
            {p.bigNumber && (() => {
              const m = p.bigNumber.text.match(/^(\D*)(\d+)(.*)$/);
              const cnt = spring({ frame: f - 4, fps, config: { damping: 20, stiffness: 70, overshootClamping: true } });
              const shown = m ? `${m[1]}${Math.round(Number(m[2]) * cnt)}${m[3]}` : p.bigNumber.text;
              const pop = spring({ frame: f - 2, fps, config: { damping: 9, stiffness: 260 } });
              return (
                <div style={{ position: 'absolute', left: 0, width: 1080, top: 20, textAlign: 'center' }}>
                  <div style={{ ...headline(250, C.accent), lineHeight: 1, transform: `scale(${interpolate(pop, [0, 1], [0.6, 1])})` }}>{shown}</div>
                  <div style={{ ...headline(76, '#fff'), marginTop: 6, opacity: interpolate(f, [10, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>{p.bigNumber.label.toUpperCase()}</div>
                </div>
              );
            })()}
            {p.tags.map((t, i) => {
              const s = spring({ frame: f - 12 - i * 8, fps, config: { damping: 10, stiffness: 300, overshootClamping: true } });
              return (
                <div key={t} style={{ position: 'absolute', left: 60, top: 800 + i * 110, ...headline(84, i ? '#fff' : C.accent), transform: `scale(${s})`, transformOrigin: 'left center', whiteSpace: 'nowrap' }}>
                  {t.toUpperCase()}
                </div>
              );
            })}
          </>
        ) : (
          <>
            {/* edge-to-edge fill: blurred copy of the same clip */}
            <div style={{ position: 'absolute', inset: -60, filter: 'blur(28px) brightness(0.55)' }}>
              <Sequence key={`bg${k}`} from={p.freeze ? 0 : k * segF} layout="none">
                <Clip clip={clip} start={p.clipStart} />
              </Sequence>
            </div>
            <Sequence key={k} from={p.freeze ? 0 : k * segF} durationInFrames={p.freeze ? undefined : segF} layout="none">
              <Body clip={clip} upper={upper} punch={enterPunch} start={p.clipStart} />
            </Sequence>
          </>
        )}
        {p.bodyMeters && (
          <div style={{ position: 'absolute', left: 36, top: 26, width: 420 }}>
            {(
              [
                ['UPPER BODY', p.bodyMeters.upper, C.accent],
                ['LEGS', p.bodyMeters.legs, C.accent2],
              ] as const
            ).map(([label, v, col], i) => {
              const val = interpolate(prog, [0, 1], [v[0], v[1]]);
              const blink = v[1] <= 0 ? 0.55 + 0.45 * Math.abs(Math.sin(f / 5)) : 1;
              return (
                <div key={label} style={{ marginBottom: 16 }}>
                  <div style={{ ...headline(50, '#fff'), textAlign: 'left', marginBottom: 4 }}>
                    {label} <span style={{ color: col, opacity: blink }}>{Math.round(val)}%</span>
                  </div>
                  <div style={{ height: 34, borderRadius: 17, background: 'rgba(11,12,28,0.85)', border: '4px solid #0B0C1C', overflow: 'hidden' }}>
                    <div style={{ width: `${val}%`, height: '100%', background: col }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <AbsoluteFill style={{ background: '#fff', opacity: flash }} />
      </div>
      <div style={{ position: 'absolute', left: 0, width: 1080, top: 40, height: PANEL.top - 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {p.lines.length > 0
          ? p.lines.map((l, i) => {
              const s = first ? 1 : spring({ frame: f - i * 5, fps, config: { damping: 12, stiffness: 320, overshootClamping: true } });
              return (
                <div key={i} style={{ ...headline(Math.min(80, Math.floor(960 / (l.length * 0.66))), i === p.lines.length - 1 ? C.accent : '#fff'), whiteSpace: 'nowrap', lineHeight: 1.0, transform: `scale(${s})` }}>
                  {l.toUpperCase()}
                </div>
              );
            })
          : counter && <div style={{ ...headline(120, C.accent), transform: `scale(${interpolate(tick, [0, 1], [1.35, 1])})` }}>{counter}</div>}
      </div>
    </AbsoluteFill>
  );
};
