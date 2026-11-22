// Body sliders for the "test subject" format. Muscle sizes 0.8-1.4 (1 = the approved Max),
// belly 0-1, fatigue 0-1 (sweat, droopy eyes, heavy breathing).
export interface BodyParams {
  chest: number;
  shoulders: number;
  arms: number;
  back: number;
  abs: number;
  legs: number;
  belly: number;
  fatigue: number;
}
export const DEFAULT_BODY: BodyParams = { chest: 1, shoulders: 1, arms: 1, back: 1, abs: 1, legs: 1, belly: 0, fatigue: 0 };
export const MUSCLE_KEYS = ['chest', 'shoulders', 'arms', 'back', 'abs', 'legs'] as const;

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const clampBody = (b: BodyParams): BodyParams => ({
  ...b,
  ...Object.fromEntries(MUSCLE_KEYS.map((k) => [k, clamp(b[k], 0.8, 1.4)])),
  belly: clamp(b.belly, 0, 1),
  fatigue: clamp(b.fatigue, 0, 1),
});
export const lerpBody = (a: BodyParams, b: BodyParams, t: number): BodyParams =>
  Object.fromEntries(Object.keys(a).map((k) => [k, a[k as keyof BodyParams] + (b[k as keyof BodyParams] - a[k as keyof BodyParams]) * t])) as unknown as BodyParams;

// derived geometry
export const shoulderPivotX = (b: BodyParams) => 222 - (b.back - 1) * 70 - (b.shoulders - 1) * 40; // screen-left pivot
export const torsoScaleX = (b: BodyParams) => 0.6 * b.back + 0.4 * b.chest;
