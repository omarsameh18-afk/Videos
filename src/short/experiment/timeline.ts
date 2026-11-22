// Pure timing/state for the two test subjects (used by React and by the Node pacing engine).
import type { BodyParams } from '../../max/body.ts';
import { DEFAULT_BODY, clampBody, lerpBody, MUSCLE_KEYS } from '../../max/body.ts';

export const EXPERIMENT_TYPES = ['SplitClone', 'GymSet', 'DayCounter', 'Reveal'];
export const START_BODY: BodyParams = { ...DEFAULT_BODY, chest: 0.9, shoulders: 0.9, arms: 0.9, back: 0.9, abs: 0.9, legs: 0.9 };
export const SUBJ = { feetY: 1290, scale: 0.68, cx: { left: 285, right: 795 }, labelY: 470, meterY: 540 };
export const REP = { lift: 12, steady: 16 }; // frames per press rep: 'train' sets are quick, 'lift' is steady
export const LIFT_BLOCK = 48; // frames of pressing per set in 'train'
export const restFrames = (timer = 60) => Math.round((timer / 60) * 30); // 1 min -> 1 s, 3 min -> 3 s

type Side = 'left' | 'right';
interface Subj { label: string; timer?: number; activity: string; expression?: string; body?: Record<string, number | undefined> }
interface SceneLike { type: string; props: Record<string, unknown> }
interface Timing { from: number; durationInFrames: number }

const target = (prev: BodyParams, t: Subj['body'] = {}): BodyParams => {
  const b = { ...prev };
  if (t.all !== undefined) for (const k of MUSCLE_KEYS) b[k] = t.all;
  for (const k of [...MUSCLE_KEYS, 'belly', 'fatigue'] as const) if (t[k] !== undefined) b[k] = t[k] as number;
  return clampBody(b);
};
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/** body of one subject at an absolute frame: each scene eases from the previous scene's target to its own */
export function bodyAt(scenes: SceneLike[], timings: Timing[], side: Side, frame: number): BodyParams {
  let prev = START_BODY;
  for (let i = 0; i < scenes.length; i++) {
    const subj = (scenes[i].props as Record<Side, Subj | undefined>)[side];
    if (!subj) continue;
    const goal = target(prev, subj.body);
    const t = timings[i];
    if (frame < t.from + t.durationInFrames || i === scenes.length - 1) {
      if (i === 0) return goal;
      const u = Math.max(0, Math.min(1, (frame - t.from) / Math.max(1, t.durationInFrames)));
      return lerpBody(prev, goal, ease(u));
    }
    prev = goal;
  }
  return prev;
}

export interface ActState { phase: 'lift' | 'rest' | 'idle' | 'flex'; press: number; restLeft: number }
/** what a subject is doing at a scene-relative frame. press: 0 = bar at chest, 1 = locked out overhead */
export function activityAt(subj: Subj, local: number): ActState {
  const press = (period: number) => (1 - Math.cos((2 * Math.PI * local) / period)) / 2;
  switch (subj.activity) {
    case 'lift':
      return { phase: 'lift', press: press(REP.steady), restLeft: 0 };
    case 'train': {
      const rest = restFrames(subj.timer);
      const cyc = LIFT_BLOCK + rest;
      const k = local % cyc;
      if (k < LIFT_BLOCK) return { phase: 'lift', press: (1 - Math.cos((2 * Math.PI * k) / REP.lift)) / 2, restLeft: 0 };
      return { phase: 'rest', press: 0, restLeft: 1 - (k - LIFT_BLOCK) / rest };
    }
    case 'rest':
      return { phase: 'rest', press: 0, restLeft: 1 - (local % 90) / 90 };
    case 'flex':
      return { phase: 'flex', press: 0, restLeft: 0 };
    default:
      return { phase: 'idle', press: 0, restLeft: 0 };
  }
}

/** frames (scene-relative) where a subject visibly switches between lifting and resting */
export function activitySwitches(subj: Subj, duration: number): number[] {
  if (subj.activity !== 'train') return [];
  const out: number[] = [];
  const cyc = LIFT_BLOCK + restFrames(subj.timer);
  for (let c = 0; c < duration; c += cyc) {
    if (c > 0) out.push(c);
    if (c + LIFT_BLOCK < duration) out.push(c + LIFT_BLOCK);
  }
  return out;
}
