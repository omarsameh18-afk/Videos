// npm run render -- <script.json> [audio.mp3]
// 1 validate  2 voice (+timestamps next to the MP3)  3 tighten voice (gaps <= maxGap, speed)
// 4 time scenes + pacing events  5 mix music/SFX to -14 LUFS  6 render out/<id>.mp4
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { validateScript, HOOK_MAX_SEC } from './lib/validate.mjs';
import { synthesize } from './lib/tts.mjs';
import { computeAmplitude } from './lib/amplitude.mjs';
import { alignmentToWords, captionPages, sceneTimings } from './lib/timing.mjs';
import { editVoice } from './lib/voiceEdit.mjs';
import { buildPacing, MAX_GAP_SEC } from './lib/pacing.mjs';
import { mixAudio, measureLufs } from './lib/mix.mjs';
import { narrationText } from '../src/schema/script.ts';

const FPS = 30;
const MAX_SEC = 60;
const OUTRO_MAX_SEC = 1.5;
const problems = [];
const die = (m) => {
  console.error(`✗ ${m}`);
  process.exit(1);
};

const [scriptFile, audioArg] = process.argv.slice(2);
if (!scriptFile) die('usage: npm run render -- <script.json> [audio.mp3]');

// 1. validate
const v = validateScript(JSON.parse(readFileSync(scriptFile, 'utf8')));
if (!v.ok) die(`${scriptFile} is invalid:\n  - ${v.errors.join('\n  - ')}`);
const script = v.script;
const id = script.meta.id;
console.log(`✓ script valid: ${id}`);

// 2. raw voice + timestamps (kept next to the MP3 in voice/)
mkdirSync('voice', { recursive: true });
let mp3;
let tsFile;
if (audioArg) {
  mp3 = audioArg;
  tsFile = audioArg.replace(/\.mp3$/i, '.timestamps.json');
  if (!existsSync(tsFile)) die(`missing ${tsFile} (ElevenLabs timestamps saved next to the MP3)`);
} else {
  const r = await synthesize({ voiceId: script.voice.voiceId, modelId: script.voice.modelId, text: narrationText(script) });
  console.log(`✓ voice ${r.cached ? '(cache hit)' : '(ElevenLabs)'}`);
  mp3 = `voice/${id}.mp3`;
  tsFile = `voice/${id}.timestamps.json`;
  copyFileSync(r.mp3, mp3);
  copyFileSync(r.timestamps, tsFile);
}
const ts = JSON.parse(readFileSync(tsFile, 'utf8'));
if (ts.text && ts.text.trim() !== narrationText(script)) console.warn('warning: timestamps text differs from the script narration');

// 3. tighten the voice
mkdirSync('.cache/edit', { recursive: true });
const voiceWav = `.cache/edit/${id}.voice.wav`;
const ed = editVoice(mp3, ts.alignment, voiceWav, { maxGap: script.voice.maxGapSec, speed: script.voice.speed });
writeFileSync(`.cache/edit/${id}.timestamps.json`, JSON.stringify({ alignment: ed.alignment }));
console.log(`✓ voice tightened: ${ed.sourceSec.toFixed(2)}s -> ${ed.editedSec.toFixed(2)}s (cut ${ed.removedSec.toFixed(2)}s of silence, x${script.voice.speed})`);

// 4. timing + pacing
const { amplitude, durationSec } = computeAmplitude(voiceWav, FPS);
const words = alignmentToWords(ed.alignment);
const scenes = sceneTimings(script, words, durationSec, FPS, { tailSec: 0.4, leadFrames: 1 });
const pacing = buildPacing(script, scenes, words, FPS);
const pages = captionPages(words, scenes, { maxWords: 4, maxChars: 30 });
const chars = ed.alignment.characters.map((c, i) => ({
  char: c,
  start: ed.alignment.character_start_times_seconds[i],
  end: ed.alignment.character_end_times_seconds[i],
}));
const durationInFrames = scenes.at(-1).from + scenes.at(-1).durationInFrames;
const durSec = durationInFrames / FPS;

const hook = scenes[0];
const hookSec = words[hook.firstWord + hook.wordCount - 1].end;
const outroSec = scenes.at(-1).durationInFrames / FPS;
if (hookSec > HOOK_MAX_SEC) problems.push(`hook narration lasts ${hookSec.toFixed(2)}s (max ${HOOK_MAX_SEC}s)`);
if (script.scenes.at(-1).type === 'Outro' && outroSec > OUTRO_MAX_SEC) problems.push(`outro lasts ${outroSec.toFixed(2)}s (max ${OUTRO_MAX_SEC}s)`);
if (pacing.longestGapSec > MAX_GAP_SEC + 1e-6) problems.push(`longest gap without a visual change ${pacing.longestGapSec.toFixed(2)}s (max ${MAX_GAP_SEC}s)`);
problems.push(...pacing.layoutErrors);
if (durSec > MAX_SEC) problems.push(`video is ${durSec.toFixed(1)}s (max ${MAX_SEC}s)`);
const tgt = script.meta.targetSec;
if (tgt && (durSec < tgt[0] || durSec > tgt[1])) problems.push(`video is ${durSec.toFixed(2)}s, target ${tgt[0]}-${tgt[1]}s`);
console.log(
  `✓ ${scenes.length} scenes, ${words.length} words, ${durSec.toFixed(2)}s, hook ${hookSec.toFixed(2)}s, outro ${outroSec.toFixed(2)}s, ` +
    `${pacing.changes.length} visual changes, longest gap ${pacing.longestGapSec.toFixed(2)}s`,
);
if (problems.length) die(`pacing rules failed:\n  - ${problems.join('\n  - ')}`);

// 5. audio mix
mkdirSync('public/renders', { recursive: true });
const audioSrc = `renders/${id}.wav`;
const mix = mixAudio({ voice: voiceWav, events: pacing.sfx, durSec, out: `public/${audioSrc}` });
console.log(`✓ mix: voice ${mix.voiceLufs.toFixed(1)} LUFS, music ${mix.musicGainDb.toFixed(1)} dB, ${pacing.sfx.length} SFX, final ${mix.finalLufs.toFixed(1)} LUFS`);

// 6. render (AI clips are served from public/clips)
if (script.scenes.some((x) => x.type === 'ClipScene')) {
  mkdirSync('public/clips', { recursive: true });
  for (const x of script.scenes.filter((y) => y.type === 'ClipScene')) for (const c of new Set([x.props.clip, x.props.clipRight, x.props.swapRight?.clip, ...(x.props.seqLeft ?? []), ...(x.props.seqRight ?? []), ...(x.props.seqRightBig ?? [])].filter(Boolean))) copyFileSync(`assets/clips/${c}.mp4`, `public/clips/${c}.mp4`);
}
mkdirSync('.cache/props', { recursive: true });
mkdirSync('out', { recursive: true });
const propsFile = `.cache/props/${id}.json`;
const { layoutErrors, changes, longestGapSec, ...visual } = pacing;
writeFileSync(propsFile, JSON.stringify({ script, audioSrc, durationInFrames, scenes, words, pages, chars, amplitude, ...visual }));
const out = `out/${id}.mp4`;
const extra = process.env.FRAMES ? [`--frames=${process.env.FRAMES}`] : [];
execFileSync('npx', ['remotion', 'render', 'src/index.ts', 'Short', out, `--props=${propsFile}`, ...extra], { stdio: ['ignore', 'ignore', 'inherit'] });

const probe = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_name,pix_fmt,width,height,r_frame_rate:format=duration', '-of', 'compact', out]).toString();
console.log(probe.trim());
if (!process.env.FRAMES) console.log(`✓ ${out}: ${measureLufs(out).toFixed(1)} LUFS`);
