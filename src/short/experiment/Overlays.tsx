import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../../max/theme';
import { FONT_HEAD } from '../fonts';
import { headline } from '../scenes/common';
import { SceneProps } from '../scenes/types';
import { VisualText } from '../visuals/VisualText';
import { SUBJ } from './timeline';

/** DayCounter: big "WEEK n" ticker (story spine) + progress dots. */
export const DayCounter: React.FC<SceneProps> = ({ scene, timing, pulse }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (scene.type !== 'DayCounter') return null;
  const { from, to, unit } = scene.props;
  const n = to - from + 1;
  const step = Math.min(n - 1, Math.floor((f / timing.durationInFrames) * n));
  const val = from + step;
  const stepStart = Math.round((step / n) * timing.durationInFrames);
  const pop = spring({ frame: f - stepStart, fps, config: { damping: 9, stiffness: 320 } });
  return (
    <div style={{ position: 'absolute', left: 0, width: 1080, top: 150, textAlign: 'center' }}>
      <div style={{ ...headline(150, C.accent), transform: `scale(${interpolate(pop, [0, 1], [1.4, 1]) * (1 + 0.03 * pulse)})`, display: 'inline-block' }}>
        {unit.toUpperCase()} {val}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 6 }}>
        {Array.from({ length: Math.max(8, to) }, (_, i) => (
          <div key={i} style={{ width: 52, height: 14, borderRadius: 7, background: i < val ? C.accent : 'rgba(255,255,255,0.2)', border: '3px solid #0B0C1C' }} />
        ))}
      </div>
    </div>
  );
};

/** GymSet meters: one bar per subject filling up (e.g. TOTAL WORK). */
export const GymMeters: React.FC<SceneProps> = ({ scene }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (scene.type !== 'GymSet' || !scene.props.meters) return null;
  const m = scene.props.meters;
  const t = spring({ frame: f - 6, fps, config: { damping: 20, stiffness: 60, overshootClamping: true } });
  return (
    <>
      <div style={{ position: 'absolute', left: 54, width: 972, top: 150 }}>
        <VisualText text={m.label.toUpperCase()} width={972} max={120} color="#fff" style={{ margin: '0 auto' }} />
      </div>
      {(['left', 'right'] as const).map((side) => (
        <div key={side} style={{ position: 'absolute', left: SUBJ.cx[side] - 190, top: SUBJ.meterY, width: 380, height: 46, borderRadius: 23, background: 'rgba(11,12,28,0.85)', border: '5px solid #0B0C1C', overflow: 'hidden' }}>
          <div style={{ width: `${m[side] * t}%`, height: '100%', background: side === 'right' ? C.accent : C.accent2 }} />
        </div>
      ))}
    </>
  );
};

/** Reveal: flash + tags popping above the zoomed focus subject. */
export const RevealTags: React.FC<SceneProps> = ({ scene, timing }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (scene.type !== 'Reveal') return null;
  const flash = interpolate(f, [0, 3, 9], [0, 0.85, 0], { extrapolateRight: 'clamp' });
  const at0 = Math.round(timing.durationInFrames * 0.3);
  return (
    <>
      <div style={{ position: 'absolute', left: 54, width: 972, top: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        {scene.props.tags.map((t, i) => {
          const s = spring({ frame: f - at0 - i * 8, fps, config: { damping: 10, stiffness: 300, overshootClamping: true } });
          return (
            <div key={t} style={{ fontFamily: FONT_HEAD, fontSize: 120, color: i % 2 ? '#fff' : C.accent, WebkitTextStroke: '12px #0B0C1C', paintOrder: 'stroke fill', transform: `scale(${s})`, opacity: s, lineHeight: 1.05 }}>
              {t.toUpperCase()}
            </div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: flash }} />
    </>
  );
};

export const SplitClone: React.FC<SceneProps> = () => null; // the subjects layer + badges are the scene
export const GymSet: React.FC<SceneProps> = (p) => <GymMeters {...p} />;
export const Reveal: React.FC<SceneProps> = (p) => <RevealTags {...p} />;
