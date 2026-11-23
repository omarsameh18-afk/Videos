import React from 'react';
import {Img, staticFile} from 'remotion';
import meta from './character.json';
import {clamp, rand} from './anim';

// الفهمان cut-out character. All poses share one canvas (aligned to the hero), so swaps never jump.
export type Pose = 'hero' | 'talk_open' | 'talk_half' | 'explain' | 'point_up' | 'shocked' | 'thinking' | 'laughing' | 'temple' | 'worried' | 'thumbs_up';
export const CANVAS = meta.canvas as [number, number];
const L = meta.layers as Record<string, {x: number; y: number; w: number; h: number}>;
export const HEAD = meta.head as [number, number];    // canvas px, middle of the face
export const MOUTH = meta.mouth as [number, number];
const has = (k: string) => k in L;

// pose timeline: [time, pose]; swaps happen exactly at `time`, hidden inside a squash that starts just before it
export type PoseKey = [number, Pose];
export const poseAt = (t: number, keys: PoseKey[]): Pose => {
  let p = keys[0][1];
  for (const [k, pose] of keys) if (t >= k) p = pose;
  return p;
};
// squash/stretch around each swap: 0 far away, peaks (1) exactly at the swap
export const squashAt = (t: number, keys: PoseKey[], pre = 0.07, post = 0.1) => {
  let s = 0;
  for (const [k] of keys.slice(1)) {
    const d = t - k;
    if (d > -pre && d < 0) s = Math.max(s, Math.sin(((d + pre) / pre) * Math.PI / 2));
    if (d >= 0 && d < post) s = Math.max(s, Math.cos((d / post) * Math.PI / 2));
  }
  return s;
};

// mouth state from the voice level envelope (60 fps) with a 3-frame minimum hold, so it never flickers
export const mouthStates = (level: number[]) => {
  const out: (0 | 1 | 2)[] = [];
  let cur: 0 | 1 | 2 = 0, held = 99;
  for (let i = 0; i < level.length; i++) {
    const v = Math.max(level[i] ?? 0, level[i + 1] ?? 0); // 1-frame lookahead: mouth opens with the sound
    const want: 0 | 1 | 2 = v > 0.62 ? 2 : v > 0.3 ? 1 : 0;
    if (want !== cur && held >= 3) { cur = want; held = 0; } else held++;
    out.push(cur);
  }
  return out;
};

// deterministic random blinks: start times
export const blinkTimes = (dur: number, seed = 3) => {
  const ts: number[] = []; let t = 1.2;
  for (let i = 0; t < dur; i++) { ts.push(t); t += 2.3 + rand(seed + i * 7.7) * 2.2; }
  return ts;
};

const LayerImg: React.FC<{k: string}> = ({k}) => {
  const g = L[k];
  return <Img src={staticFile(`elfahman/lib/${k}.png`)} style={{position: 'absolute', left: g.x, top: g.y, width: g.w, height: g.h}} />;
};

export const Character: React.FC<{
  pose: Pose; mouth: 0 | 1 | 2; blink: boolean; wink?: boolean; x: number; y: number; scale: number;
  squash?: number; t: number; tilt?: number; children?: React.ReactNode;
}> = ({pose, mouth, blink, wink = false, x, y, scale, squash = 0, t, tilt = 0, children}) => {
  const [cw, ch] = CANVAS;
  const breathe = Math.sin(t * 2 * Math.PI * 0.27);
  const sy = 1 - 0.045 * squash + 0.004 * breathe, sx = 1 + 0.03 * squash - 0.002 * breathe;
  const m = mouth === 2 ? '__mouth_open' : mouth === 1 ? '__mouth_half' : '';
  const blinkK = `${pose}__blink`;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: cw * scale, height: ch * scale}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: cw, height: ch, transformOrigin: '0 0', transform: `scale(${scale})`}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: cw, height: ch, transformOrigin: `${cw / 2}px ${ch}px`,
          transform: `translateY(${clamp(squash) * 10}px) scale(${sx}, ${sy}) rotate(${tilt}deg)`}}>
          <LayerImg k={pose} />
          {m && has(pose + m) && <LayerImg k={pose + m} />}
          {wink && has(`${pose}__wink`) ? <LayerImg k={`${pose}__wink`} /> : blink && has(blinkK) && <LayerImg k={blinkK} />}
          {children}
        </div>
      </div>
    </div>
  );
};
