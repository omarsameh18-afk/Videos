import React from 'react';
import {AbsoluteFill} from 'remotion';
import {easeInOut, lerp, seg} from './anim';

// 2.5D camera. World units = screen px on the character plane (z = 1000) when the camera rests at z = 0.
export type Cam = {x: number; y: number; z: number};
export type CamKey = [number, number, Cam]; // glide from the previous value to Cam during [t0, t1]

export const camAt = (t: number, cam0: Cam, keys: CamKey[], ease = easeInOut): Cam => {
  let c = cam0;
  for (const [t0, t1, to] of keys) {
    if (t <= t0) break;
    const u = ease(seg(t, t0, t1));
    const k0 = 1000 / (1000 - c.z), k1 = 1000 / (1000 - to.z);
    const k = Math.exp(lerp(Math.log(k0), Math.log(k1), u)); // perceptually even zoom
    c = {x: lerp(c.x, to.x, u), y: lerp(c.y, to.y, u), z: 1000 - 1000 / k};
  }
  return c;
};

// decaying hand-held shake from a list of [time, amplitude px, decay]
export const shakeAt = (t: number, hits: [number, number, number][]) => {
  let amp = 0;
  for (const [h, a, d] of hits) if (t >= h) amp += a * Math.exp(-d * (t - h));
  return {
    x: (amp * (Math.sin(2 * Math.PI * 13.3 * t) + 0.6 * Math.sin(2 * Math.PI * 7.1 * t + 1))) / 1.6,
    y: (amp * (Math.sin(2 * Math.PI * 11.7 * t + 2) + 0.5 * Math.sin(2 * Math.PI * 5.3 * t))) / 1.5,
  };
};

export const Layer: React.FC<{cam: Cam; z: number; blur?: number; children: React.ReactNode}> = ({cam, z, blur = 0, children}) => {
  const d = z - cam.z;
  if (d < 200) return null;
  const k = 1000 / d;
  return (
    <AbsoluteFill style={{filter: blur > 0.05 ? `blur(${blur}px)` : undefined}}>
      <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0',
        transform: `translate(540px, 960px) scale(${k}) translate(${-cam.x}px, ${-cam.y}px)`}}>{children}</div>
    </AbsoluteFill>
  );
};
