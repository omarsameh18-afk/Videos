export type ExpressionName = 'neutral' | 'shocked' | 'angry' | 'laughing' | 'smug' | 'thinking';
export type MouthShape =
  // the 5 talking mouths (driven by audio amplitude, see lipsync.ts)
  | 'closed' | 'small' | 'wide' | 'o' | 'laugh'
  // resting mouths per expression (shown when Max is silent)
  | 'smile' | 'grit' | 'smirk' | 'hmm' | 'gasp';
export const TALK_MOUTHS: MouthShape[] = ['closed', 'small', 'wide', 'o', 'laugh'];
export const EXPRESSION_NAMES: ExpressionName[] = ['neutral', 'shocked', 'angry', 'laughing', 'smug', 'thinking'];
export type EyeStyle = 'normal' | 'wide' | 'angry' | 'happy' | 'half' | 'up';

export interface Brow { y: number; angle: number } // y offset (px, + = down), angle (deg, + = inner end down)
export interface ExpressionDef {
  browL: Brow; // screen-left brow
  browR: Brow;
  eyes: EyeStyle;
  look: [number, number]; // pupil offset
  mouth: MouthShape; // resting mouth
  fx?: 'sweat' | 'vein' | 'tears' | 'sparkle' | 'question';
}

export const EXPRESSIONS: Record<ExpressionName, ExpressionDef> = {
  neutral: { browL: { y: 0, angle: -4 }, browR: { y: 0, angle: -4 }, eyes: 'normal', look: [0, 0], mouth: 'smile' },
  shocked: { browL: { y: -24, angle: -16 }, browR: { y: -24, angle: -16 }, eyes: 'wide', look: [0, 0], mouth: 'gasp', fx: 'sweat' },
  angry: { browL: { y: 10, angle: 26 }, browR: { y: 10, angle: 26 }, eyes: 'angry', look: [0, 2], mouth: 'grit', fx: 'vein' },
  laughing: { browL: { y: -14, angle: -10 }, browR: { y: -14, angle: -10 }, eyes: 'happy', look: [0, 0], mouth: 'laugh', fx: 'tears' },
  smug: { browL: { y: 4, angle: 8 }, browR: { y: -18, angle: -16 }, eyes: 'half', look: [7, 0], mouth: 'smirk', fx: 'sparkle' },
  thinking: { browL: { y: 6, angle: 14 }, browR: { y: -16, angle: -12 }, eyes: 'up', look: [8, -9], mouth: 'hmm', fx: 'question' },
};
