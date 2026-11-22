import type { ScriptT } from '../schema/script';
import type { CharTiming } from '../max/lipsync';
import type { ExpressionName } from '../max/expressions';
import type { PoseName } from '../max/poses';

export interface Word { text: string; start: number; end: number }
export interface SceneTiming {
  from: number;
  durationInFrames: number;
  firstWord: number;
  wordCount: number;
  beats?: number[];
  reveal?: number; // WrongVsRight: frame (scene-relative) the second card lands
  land?: number; // StatCard: frame (scene-relative) the number lands
}
export interface CaptionPage { words: number[]; start: number; end: number }
export interface FrameKey<T> { at: number; value: T }

// Everything the Short composition needs; produced by scripts/render.mjs.
export type ShortProps = {
  script: ScriptT;
  audioSrc: string; // final mix, path inside public/
  durationInFrames: number;
  scenes: SceneTiming[];
  words: Word[];
  pages: CaptionPage[];
  chars: CharTiming[];
  amplitude: number[];
  exprKeys: FrameKey<ExpressionName>[];
  poseKeys: FrameKey<PoseName>[];
  zoomKeys: { at: number; scale: number }[];
  shakes: number[];
  emphasisWords: number[];
};
