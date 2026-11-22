import type { ScriptT } from '../schema/script';
import type { CharTiming } from '../max/lipsync';

export interface Word { text: string; start: number; end: number }
export interface SceneTiming { from: number; durationInFrames: number; firstWord: number; wordCount: number; beats: number[] }
export interface CaptionPage { words: number[]; start: number; end: number }

// Everything the Short composition needs; produced by scripts/render.mjs.
export type ShortProps = {
  script: ScriptT;
  audioSrc: string; // path inside public/
  durationInFrames: number;
  scenes: SceneTiming[];
  words: Word[];
  pages: CaptionPage[];
  chars: CharTiming[];
  amplitude: number[];
};
