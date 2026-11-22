import { mulberry32 } from './random';

const cache = new Map<string, number[]>();

// Blink start frames: one every 3-5 s, deterministic per seed.
const schedule = (seed: number, fps: number, until: number) => {
  const key = `${seed}:${fps}`;
  let starts = cache.get(key);
  if (!starts || starts[starts.length - 1] < until) {
    const rnd = mulberry32(seed);
    starts = [];
    let f = Math.round(fps * (1 + rnd() * 2));
    while (f < until + fps * 10) {
      starts.push(f);
      f += Math.round(fps * (3 + rnd() * 2));
    }
    cache.set(key, starts);
  }
  return starts;
};

const BLINK_FRAMES = 7;

// 0 = eyes open, 1 = fully closed
export const blinkAmount = (frame: number, fps: number, seed = 1) => {
  const starts = schedule(seed, fps, frame);
  for (const s of starts) {
    if (s > frame) break;
    const d = frame - s;
    if (d < BLINK_FRAMES) return 1 - Math.abs(d - (BLINK_FRAMES - 1) / 2) / ((BLINK_FRAMES - 1) / 2);
  }
  return 0;
};
