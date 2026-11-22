// Arm rig. Each arm is drawn pointing straight down, then rotated at the shoulder,
// elbow and wrist. The screen-right arm is mirrored, so positive angles always mean
// "outward / away from the body" for both arms.
export type HandShape = 'fist' | 'point' | 'thumbsUp' | 'open' | 'shaker' | 'hidden';
export type PoseName = 'idle' | 'pointing' | 'flexing' | 'armsCrossed' | 'facepalm' | 'thumbsUp' | 'fingerUp';

export const POSE_NAMES: PoseName[] = ['pointing', 'flexing', 'armsCrossed', 'facepalm', 'thumbsUp', 'fingerUp'];

export interface ArmDef {
  shoulder: number;
  elbow: number;
  wrist: number;
  hand: HandShape;
  front?: boolean; // draw above the head (e.g. facepalm)
}
export interface PoseDef { left: ArmDef; right: ArmDef; lean?: number; frontArm?: 'left' | 'right' }

const hang = (hand: HandShape = 'shaker'): ArmDef => ({ shoulder: 16, elbow: -14, wrist: 0, hand });

export const POSES: Record<PoseName, PoseDef> = {
  idle: { left: hang('fist'), right: hang('shaker') },
  pointing: { left: { shoulder: 135, elbow: 40, wrist: 0, hand: 'point' }, right: hang('shaker'), lean: -2 },
  flexing: {
    left: { shoulder: 100, elbow: 105, wrist: 10, hand: 'fist' },
    right: { shoulder: 100, elbow: 105, wrist: 10, hand: 'shaker' },
  },
  armsCrossed: {
    left: { shoulder: -8, elbow: -112, wrist: 0, hand: 'hidden' },
    right: { shoulder: -14, elbow: -100, wrist: 20, hand: 'shaker', front: false },
    frontArm: 'left',
  },
  facepalm: {
    left: { shoulder: -65, elbow: -112, wrist: -4, hand: 'open', front: true },
    right: hang('shaker'),
    lean: 3,
  },
  thumbsUp: { left: { shoulder: 52, elbow: 116, wrist: 0, hand: 'thumbsUp' }, right: hang('shaker') },
  fingerUp: { left: { shoulder: 30, elbow: 128, wrist: 0, hand: 'point' }, right: hang('shaker') },
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const blendArm = (a: ArmDef, b: ArmDef, t: number): ArmDef => ({
  shoulder: lerp(a.shoulder, b.shoulder, t),
  elbow: lerp(a.elbow, b.elbow, t),
  wrist: lerp(a.wrist, b.wrist, t),
  hand: t < 0.5 ? a.hand : b.hand,
  front: t < 0.5 ? a.front : b.front,
});
export const blendPose = (a: PoseDef, b: PoseDef, t: number): PoseDef => ({
  left: blendArm(a.left, b.left, t),
  right: blendArm(a.right, b.right, t),
  lean: lerp(a.lean ?? 0, b.lean ?? 0, t),
  frontArm: t < 0.5 ? a.frontArm : b.frontArm,
});
