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
  // the ONE key word (lime in captions) + camera shake when spoken
  emphasis: z.array(z.string()).max(1, 'max 1 key word per scene').default([]),
  background: z.enum(['lab', 'gym', 'chalkboard']).optional(),
};

const GaugeProps = z.object({
  label: z.string().min(1), // e.g. "SORENESS"
  from: z.number().min(0).max(100).default(100), // needle start (0-100)
  to: z.number().min(0).max(100).default(0), // needle slams here
});

export const HookScene = z.object({
  type: z.literal('Hook'),
  ...SceneBase,
  // optional visual interrupt on frame 1
  props: z.object({ gauge: GaugeProps.optional() }).default({}),
});

const Color = z.enum(['lime', 'pink', 'white', 'blue']);
export const AnimatedChartScene = z.object({
  type: z.literal('AnimatedChart'),
  ...SceneBase,
  props: z.object({
    kind: z.enum(['line', 'bar']).default('line'),
    xTicks: z.array(z.string()).min(2), // e.g. ["0", "1", ... "10"] (weeks)
    xLabel: z.string().default('Weeks'),
    yLabel: z.string().default('Level'),
    series: z
      .array(z.object({ label: z.string().min(1), color: Color, points: z.array(z.number().min(0).max(100)).min(2) }))
      .min(1)
      .max(3),
    marker: z.object({ at: z.number().int().min(0), label: z.string().min(1) }).optional(), // vertical marker at x index
  }),
});

export const GaugeScene = z.object({ type: z.literal('Gauge'), ...SceneBase, props: GaugeProps });

export const MuscleZoomScene = z.object({
  type: z.literal('MuscleZoom'),
  ...SceneBase,
  props: z.object({
    muscle: z.enum(MUSCLES).default('biceps'),
    steps: z.array(z.string().min(1)).min(1), // one label per sentence (shown in order)
  }),
});

export const SplitVersusScene = z.object({
  type: z.literal('SplitVersus'),
  ...SceneBase,
  props: z.object({ wrong: z.string().min(1), right: z.string().min(1), wrongLabel: z.string().default('MYTH'), rightLabel: z.string().default('FACT') }),
});

export const BigNumberScene = z.object({
  type: z.literal('BigNumber'),
  ...SceneBase,
  props: z.object({
    value: z.number(),
    decimals: z.number().int().min(0).max(2).default(0),
    prefix: z.string().default(''),
    suffix: z.string().default(''),
    label: z.string().min(1), // max 3 words
  }),
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

// ---- "What happens if..." experiments: two Max test subjects whose bodies change over time
const Slider = z.number().min(0.8).max(1.4);
export const BodyTarget = z.object({
  chest: Slider.optional(), shoulders: Slider.optional(), arms: Slider.optional(), back: Slider.optional(),
  abs: Slider.optional(), legs: Slider.optional(), all: Slider.optional(), // all = every muscle slider at once
  belly: z.number().min(0).max(1).optional(), fatigue: z.number().min(0).max(1).optional(),
});
export const ACTIVITIES = ['idle', 'lift', 'train', 'rest', 'flex'] as const;
export const Subject = z.object({
  label: z.string().min(1), // big label on top, e.g. "1 MIN"
  timer: z.number().int().min(5).max(600).optional(), // rest between sets (s); drives the rest-timer ring
  activity: z.enum(ACTIVITIES).default('idle'), // train = auto cycle of sets + rests (rest length follows timer)
  expression: z.enum(EXPRESSIONS).optional(),
  body: BodyTarget.default({}), // reached by the END of the scene (smoothly animated from the previous scene)
});
const Stage = { left: Subject, right: Subject };
export const SplitCloneScene = z.object({ type: z.literal('SplitClone'), ...SceneBase, props: z.object({ ...Stage, timersCenter: z.boolean().default(false) }) });
export const GymSetScene = z.object({
  type: z.literal('GymSet'),
  ...SceneBase,
  props: z.object({ ...Stage, meters: z.object({ label: z.string().min(1), left: z.number().min(0).max(100), right: z.number().min(0).max(100) }).optional() }),
});
export const DayCounterScene = z.object({
  type: z.literal('DayCounter'),
  ...SceneBase,
  props: z.object({ ...Stage, unit: z.string().default('WEEK'), from: z.number().int().min(0), to: z.number().int().min(0) }),
});
export const RevealScene = z.object({
  type: z.literal('Reveal'),
  ...SceneBase,
  props: z.object({ ...Stage, focus: z.enum(['left', 'right']), tags: z.array(z.string().min(1)).max(3).default([]) }),
});
export const EXPERIMENT_TYPES = ['SplitClone', 'GymSet', 'DayCounter', 'Reveal'];

export const Scene = z.discriminatedUnion('type', [
  SplitCloneScene, GymSetScene, DayCounterScene, RevealScene,
  HookScene, MuscleHighlightScene, WrongVsRightScene, StatCardScene, OutroScene,
  AnimatedChartScene, GaugeScene, MuscleZoomScene, SplitVersusScene, BigNumberScene,
]);

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
    voiceId: z.string().min(1).default('TX3LPaxmHKxFdv7VOQHJ'), // locked: see VOICE_LOCK in src/config.ts
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
