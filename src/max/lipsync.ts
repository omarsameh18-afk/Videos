import { ExpressionName, EXPRESSIONS, MouthShape } from './expressions';

// Per-frame loudness (0..1) is computed from the MP3 before rendering
// (scripts/lib/amplitude.mjs) and passed in as `amplitude[]`.
export interface CharTiming { char: string; start: number; end: number } // seconds

export const MOUTH_THRESHOLDS = { small: 0.12, wide: 0.42 };
const SILENCE_FOR_REST = 12; // frames of silence before the expression's resting mouth returns

const ROUND = /[ouwOUW]/;

export const charAt = (chars: CharTiming[] | undefined, t: number): string | undefined => {
  if (!chars?.length) return undefined;
  let lo = 0;
  let hi = chars.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (chars[mid].end <= t) lo = mid + 1;
    else if (chars[mid].start > t) hi = mid - 1;
    else return chars[mid].char;
  }
  return undefined;
};

/**
 * Picks one of the 5 talking mouths (closed, small, wide, o, laugh) from audio amplitude.
 * - loud + laughing expression -> laugh
 * - currently voiced letter is o/u/w (from ElevenLabs timestamps) -> o
 * - otherwise amplitude picks closed / small / wide
 * After a pause the expression's resting mouth (smile, grit, smirk...) comes back.
 */
export const mouthAt = (
  frame: number,
  fps: number,
  amplitude: number[] | undefined,
  expression: ExpressionName,
  chars?: CharTiming[],
): MouthShape => {
  const rest = EXPRESSIONS[expression].mouth;
  if (!amplitude?.length) return rest;
  const a = amplitude[frame] ?? 0;
  if (a < MOUTH_THRESHOLDS.small) {
    let silent = 0;
    for (let f = frame; f >= 0 && silent <= SILENCE_FOR_REST; f--) {
      if ((amplitude[f] ?? 0) >= MOUTH_THRESHOLDS.small) break;
      silent++;
    }
    return silent > SILENCE_FOR_REST ? rest : 'closed';
  }
  if (expression === 'laughing') return a >= MOUTH_THRESHOLDS.wide ? 'laugh' : 'small';
  const c = charAt(chars, frame / fps);
  if (c && ROUND.test(c)) return 'o';
  return a >= MOUTH_THRESHOLDS.wide ? 'wide' : 'small';
};
