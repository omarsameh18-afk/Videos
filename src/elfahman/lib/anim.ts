export const FPS = 60;
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const seg = (t: number, t0: number, t1: number) => clamp((t - t0) / (t1 - t0));
export const easeInOut = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
export const easeOut = (u: number) => 1 - Math.pow(1 - u, 3);
export const easeIn = (u: number) => u * u * u;
// damped spring settle: 0 at u=0 -> oscillates -> 0. returns offset multiplier
export const wobble = (dt: number, freq = 4, decay = 5) => (dt < 0 ? 0 : Math.sin(2 * Math.PI * freq * dt) * Math.exp(-decay * dt));
// pop-in scale with overshoot: 0 -> 1
export const popIn = (dt: number, dur = 0.28) => {
  if (dt <= 0) return 0;
  const u = clamp(dt / dur);
  return u >= 1 ? 1 + wobble(dt - dur, 3, 9) * 0.04 : easeOut(u) * (1 + 0.18 * Math.sin(Math.PI * u));
};
export const popOut = (dt: number, dur = 0.16) => (dt <= 0 ? 1 : dt >= dur ? 0 : 1 + 0.15 * Math.sin(Math.PI * (dt / dur) * 0.5) - easeIn(dt / dur) * 1.15);
// deterministic pseudo-random
export const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const INK = '#151515';
