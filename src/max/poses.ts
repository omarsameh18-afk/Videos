// Arm rig. Each arm is drawn pointing straight down, then rotated at the shoulder,
// elbow and wrist. The screen-right arm is mirrored, so positive angles always mean
// "outward / away from the body" for both arms.
export type HandShape = 'fist' | 'point' | 'one' | 'thumbsUp' | 'open' | 'shaker' | 'hidden';
export type PoseName = 'idle' | 'pointing' | 'flexing' | 'armsCrossed' | 'facepalm' | 'thumbsUp' | 'fingerUp' | 'thinking';

export const POSE_NAMES: PoseName[] = ['pointing', 'flexing', 'armsCrossed', 'facepalm', 'thumbsUp', 'fingerUp', 'thinking'];

export interface ArmDef {
  shoulder: number;
  elbow: number;
  wrist: number;
  hand: HandShape;
  front?: boolean; // draw above the head (e.g. facepalm)
  shakerTilt?: number; // extra shaker rotation (deg) when this hand holds it
  shakerOffset?: [number, number]; // shaker shift in screen-aligned px (x = outward)
}
export interface PoseDef { left: ArmDef; right: ArmDef; lean?: number; frontArm?: 'left' | 'right' }

const hang = (hand: HandShape = 'shaker'): ArmDef => ({ shoulder: 16, elbow: -14, wrist: 0, hand });

export const POSES: Record<PoseName, PoseDef> = {
  idle: { left: hang('fist'), right: hang('shaker') },
  // compact "look there" point: forearm rises 45 deg up-and-out so it aims at a card
  // beside/above him without the arm ever reaching into the card (Max is mirrored next to cards)
  pointing: { left: { shoulder: -15, elbow: 150, wrist: 0, hand: 'point', front: true }, right: hang('shaker') },
  flexing: {
    left: { shoulder: 100, elbow: 105, wrist: 10, hand: 'fist' },
    right: { shoulder: 100, elbow: 105, wrist: 10, hand: 'shaker' },
  },
  armsCrossed: {
    // front arm: fist resting on the opposite bicep, gripping the upright shaker beside that shoulder
    left: { shoulder: -40, elbow: -72, wrist: 0, hand: 'shaker' },
    // back arm: hand tucked under the front arm's bicep
    right: { shoulder: -14, elbow: -100, wrist: 0, hand: 'hidden' },
    frontArm: 'left',
  },
  facepalm: {
    left: { shoulder: -65, elbow: -112, wrist: -4, hand: 'open', front: true },
    right: hang('shaker'),
    lean: 3,
  },
  thumbsUp: { left: { shoulder: 52, elbow: 116, wrist: 0, hand: 'thumbsUp' }, right: hang('shaker') },
  // question: fist under the chin
  thinking: { left: { shoulder: -24, elbow: -130, wrist: -10, hand: 'fist', front: true }, right: hang('shaker') },
  // index finger raised beside the head ("one thing...")
  fingerUp: { left: { shoulder: 22, elbow: 150, wrist: 6, hand: 'one' }, right: hang('shaker') },
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const blendArm = (a: ArmDef, b: ArmDef, t: number): ArmDef => ({
  shoulder: lerp(a.shoulder, b.shoulder, t),
  elbow: lerp(a.elbow, b.elbow, t),
  wrist: lerp(a.wrist, b.wrist, t),
  hand: t < 0.5 ? a.hand : b.hand,
  front: t < 0.5 ? a.front : b.front,
  shakerTilt: lerp(a.shakerTilt ?? 0, b.shakerTilt ?? 0, t),
  shakerOffset: [lerp(a.shakerOffset?.[0] ?? 0, b.shakerOffset?.[0] ?? 0, t), lerp(a.shakerOffset?.[1] ?? 0, b.shakerOffset?.[1] ?? 0, t)],
});
export const blendPose = (a: PoseDef, b: PoseDef, t: number): PoseDef => ({
  left: blendArm(a.left, b.left, t),
  right: blendArm(a.right, b.right, t),
  lean: lerp(a.lean ?? 0, b.lean ?? 0, t),
  frontArm: t < 0.5 ? a.frontArm : b.frontArm,
});
