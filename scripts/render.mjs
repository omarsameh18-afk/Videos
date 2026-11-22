// npm run render -- <script.json> [audio.mp3]
// - validates the script
// - voice: given MP3 (+ <name>.timestamps.json next to it), else ElevenLabs TTS with timestamps (cached)
// - times scenes from the audio, builds captions, renders out/<id>.mp4
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { basename } from 'node:path';
import { validateScript, HOOK_MAX_SEC } from './lib/validate.mjs';
import { synthesize } from './lib/tts.mjs';
import { computeAmplitude } from './lib/amplitude.mjs';
import { alignmentToWords, captionPages, sceneTimings } from './lib/timing.mjs';
import { narrationText } from '../src/schema/script.ts';

const FPS = 30;
const MAX_SEC = 60;
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

// 2. voice + timestamps (saved next to the MP3 in voice/)
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

// 3. timing
const { amplitude, durationSec } = computeAmplitude(mp3, FPS);
const words = alignmentToWords(ts.alignment);
const scenes = sceneTimings(script, words, durationSec, FPS);
for (const t of scenes) {
  const ws = words.slice(t.firstWord, t.firstWord + t.wordCount);
  t.beats = ws
    .map((w, k) => (k === 0 || /[.?!]$/.test(ws[k - 1].text) ? Math.max(0, Math.round(w.start * FPS) - t.from) : null))
    .filter((b) => b !== null);
  t.beats[0] = 0;
}
const pages = captionPages(words, scenes, { maxWords: 3 });
const chars = ts.alignment.characters.map((c, i) => ({
  char: c,
  start: ts.alignment.character_start_times_seconds[i],
  end: ts.alignment.character_end_times_seconds[i],
}));
const durationInFrames = scenes.at(-1).from + scenes.at(-1).durationInFrames;

const hook = scenes[0];
const hookSec = words[hook.firstWord + hook.wordCount - 1].end;
if (hookSec > HOOK_MAX_SEC) die(`hook narration lasts ${hookSec.toFixed(2)}s (max ${HOOK_MAX_SEC}s)`);
if (durationInFrames / FPS > MAX_SEC) die(`video is ${(durationInFrames / FPS).toFixed(1)}s (max ${MAX_SEC}s)`);
console.log(`✓ ${scenes.length} scenes, ${words.length} words, ${(durationInFrames / FPS).toFixed(2)}s, hook ${hookSec.toFixed(2)}s`);

// 4. render
mkdirSync('public/renders', { recursive: true });
mkdirSync('.cache/props', { recursive: true });
mkdirSync('out', { recursive: true });
const audioSrc = `renders/${id}.mp3`;
copyFileSync(mp3, `public/${audioSrc}`);
const propsFile = `.cache/props/${id}.json`;
writeFileSync(propsFile, JSON.stringify({ script, audioSrc, durationInFrames, scenes, words, pages, chars, amplitude }));
const out = `out/${id}.mp4`;
const extra = process.env.FRAMES ? [`--frames=${process.env.FRAMES}`] : [];
execFileSync('npx', ['remotion', 'render', 'src/index.ts', 'Short', out, `--props=${propsFile}`, ...extra], { stdio: 'inherit' });

const probe = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_name,pix_fmt,width,height,r_frame_rate:format=duration', '-of', 'compact', out]).toString();
console.log(probe.trim());
console.log(`✓ ${out} (${basename(mp3)})`);
