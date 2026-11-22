// Channel + render config. Everything brand-specific lives here.
export const CHANNEL = {
  name: 'BrainPump',
  handle: '@brainpump_us',
  catchphrase: 'Pump your brain.',
};

export const CHARACTER = {
  name: 'Max',
  // Max never says/shows doctor, scientist, coach or PT and never gives medical advice.
  // Banned words live in config/bannedWords.json (enforced by `npm run validate`).
};

export const VIDEO = {
  width: 1080,
  height: 1920,
  fps: 30,
  maxSeconds: 60,
};

// YouTube Shorts UI overlays (title, channel row, like/comment/share column).
// Keep captions and key content inside SAFE.
export const SAFE_ZONE = {
  top: 140, // status bar / search
  bottom: 384, // ~20% of 1920: title + channel + music row
  right: 140, // action buttons column
  left: 48,
};
export const SAFE = {
  x: SAFE_ZONE.left,
  y: SAFE_ZONE.top,
  width: VIDEO.width - SAFE_ZONE.left - SAFE_ZONE.right,
  height: VIDEO.height - SAFE_ZONE.top - SAFE_ZONE.bottom,
  bottomY: VIDEO.height - SAFE_ZONE.bottom,
  centerX: SAFE_ZONE.left + (VIDEO.width - SAFE_ZONE.left - SAFE_ZONE.right) / 2,
};

// ANIMATION RULE 1: pose by MEANING. A scene/sentence declares an intent; pose + expression
// come from here (an explicit pose/expression must be one of the allowed ones).
export const INTENTS = {
  question: { pose: 'thinking', expression: 'thinking', poses: ['thinking'], expressions: ['thinking', 'shocked', 'neutral'] },
  myth: { pose: 'armsCrossed', expression: 'smug', poses: ['armsCrossed', 'facepalm'], expressions: ['smug', 'angry', 'neutral'] },
  reveal: { pose: 'pointing', expression: 'shocked', poses: ['pointing'], expressions: ['shocked', 'neutral', 'smug'] },
  stat: { pose: 'fingerUp', expression: 'neutral', poses: ['fingerUp'], expressions: ['neutral', 'smug', 'thinking'] },
  goodNews: { pose: 'thumbsUp', expression: 'laughing', poses: ['thumbsUp'], expressions: ['laughing', 'smug', 'neutral'] },
  ending: { pose: 'flexing', expression: 'laughing', poses: ['flexing'], expressions: ['laughing', 'smug'] },
} as const;
export type Intent = keyof typeof INTENTS;
export const DEFAULT_INTENT: Record<string, Intent> = {
  Hook: 'question',
  WrongVsRight: 'myth',
  StatCard: 'stat',
  MuscleHighlight: 'reveal',
  Outro: 'ending',
  AnimatedChart: 'stat',
  Gauge: 'stat',
  MuscleZoom: 'reveal',
  SplitVersus: 'myth',
  BigNumber: 'stat',
};
// "visual is the star" scenes: Max shrinks to the bottom-right corner and reacts
export const VISUAL_SCENES = ['AnimatedChart', 'Gauge', 'MuscleZoom', 'SplitVersus', 'BigNumber'];
// pointing is only allowed where there is a card/visual to point at
export const CARD_SCENES = ['WrongVsRight', 'StatCard', 'MuscleHighlight', ...VISUAL_SCENES];

// VISUAL RULES: on-screen visual text
export const VISUAL_TEXT = { minPx: 64, maxWords: 4 };
export const BACKGROUNDS = ['lab', 'gym', 'chalkboard'] as const;
export type BackgroundName = (typeof BACKGROUNDS)[number];
