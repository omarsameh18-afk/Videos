// JSON script format for one Short. Plain zod (no TS-only syntax) so Node can import it directly.
import { z } from 'zod';

export const EXPRESSIONS = ['neutral', 'shocked', 'angry', 'laughing', 'smug', 'thinking'] as const;
export const POSES = ['idle', 'pointing', 'flexing', 'armsCrossed', 'facepalm', 'thumbsUp', 'fingerUp', 'thinking'] as const;
export const MUSCLES = [
  'chest', 'shoulders', 'biceps', 'triceps', 'forearms', 'abs',
  'traps', 'lats', 'glutes', 'quads', 'hamstrings', 'calves',
] as const;

const Line = z.string().min(1);

export const INTENT_NAMES = ['question', 'myth', 'reveal', 'stat', 'goodNews', 'ending'] as const;

const SceneBase = {
  narration: z.string().min(1),
  // what the first sentence MEANS; pose + expression come from INTENTS in src/config.ts
  intent: z.enum(INTENT_NAMES).optional(),
  expression: z.enum(EXPRESSIONS).optional(), // optional override (must be allowed for the intent)
  pose: z.enum(POSES).optional(),
  onScreenText: z.array(Line).default([]), // one entry per line
  sourceIndex: z.number().int().min(0).optional(), // -> meta.sources[i], shown as a source footer
  // later sentences of this scene (0-based sentence index): max ONE pose per sentence
  moves: z
    .array(
      z.object({
        atSentence: z.number().int().min(1),
        intent: z.enum(INTENT_NAMES).optional(),
        expression: z.enum(EXPRESSIONS).optional(),
        pose: z.enum(POSES).optional(),
      }),
    )
    .default([]),
  // key words: camera shake + caption accent when spoken
  emphasis: z.array(z.string()).default([]),
};

export const HookScene = z.object({
  type: z.literal('Hook'),
  ...SceneBase,
  props: z.object({}).default({}),
});

export const MuscleHighlightScene = z.object({
  type: z.literal('MuscleHighlight'),
  ...SceneBase,
  props: z.object({
    muscles: z.array(z.enum(MUSCLES)).min(1),
    view: z.enum(['front', 'back']).default('front'),
  }),
});

export const WrongVsRightScene = z.object({
  type: z.literal('WrongVsRight'),
  ...SceneBase,
  props: z.object({
    wrong: Line,
    right: Line,
    wrongLabel: z.string().default('MYTH'),
    rightLabel: z.string().default('REALITY'),
  }),
});

export const StatCardScene = z.object({
  type: z.literal('StatCard'),
  ...SceneBase,
  props: z.object({
    value: z.number(),
    decimals: z.number().int().min(0).max(2).default(0),
    prefix: z.string().default(''),
    suffix: z.string().default(''),
    label: z.array(Line).min(1), // lines under the number
  }),
});

export const OutroScene = z.object({
  type: z.literal('Outro'),
  ...SceneBase,
  props: z.object({}).default({}),
});

export const Scene = z.discriminatedUnion('type', [HookScene, MuscleHighlightScene, WrongVsRightScene, StatCardScene, OutroScene]);

export const Source = z.object({
  label: z.string().min(1), // short footer text, e.g. "Schoenfeld et al., 2017"
  citation: z.string().optional(), // full reference
  url: z.string().url().optional(),
});

export const Script = z.object({
  meta: z.object({
    id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/, 'id must be a lowercase slug'),
    title: z.string().min(1),
    topic: z.string().min(1),
    sources: z.array(Source).min(1, 'at least one source is required'),
    variant: z.string().optional(),
    targetSec: z.tuple([z.number(), z.number()]).optional(), // allowed final length [min, max]
    seed: z.number().int().default(1),
  }),
  voice: z.object({
    voiceId: z.string().min(1),
    modelId: z.string().default('eleven_multilingual_v2'),
    // optional full voice-over; if given it must equal the scene narrations joined with spaces
    text: z.string().optional(),
    speed: z.number().min(0.8).max(1.3).default(1.1), // tempo change, pitch kept
    maxGapSec: z.number().min(0).default(0.15), // silences between words are cut down to this
  }),
  scenes: z.array(Scene).min(2),
});

export type ScriptT = z.infer<typeof Script>;
export type SceneT = z.infer<typeof Scene>;

export const narrationText = (s: ScriptT) => s.scenes.map((sc) => sc.narration.trim()).join(' ');

// sentence index of each word in a narration (split after . ? !)
export const sentenceOfWords = (narration: string) => {
  const ws = narration.trim().split(/\s+/).filter(Boolean);
  let s = 0;
  return ws.map((w, i) => {
    const cur = s;
    if (/[.?!]$/.test(w) && i < ws.length - 1) s++;
    return cur;
  });
};
