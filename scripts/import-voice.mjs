// Turn ElevenLabs Scribe word timings into the character-timestamps JSON the renderer uses,
// saved next to the MP3:  node scripts/import-voice.mjs <script.json> <audio.mp3> <scribe-words.json>
import { readFileSync, writeFileSync } from 'node:fs';
import { Script, narrationText } from '../src/schema/script.ts';
import { wordsToAlignment } from './lib/timing.mjs';

const [scriptFile, mp3, wordsFile] = process.argv.slice(2);
if (!wordsFile) {
  console.error('usage: node scripts/import-voice.mjs <script.json> <audio.mp3> <scribe-words.json>');
  process.exit(2);
}
const script = Script.parse(JSON.parse(readFileSync(scriptFile, 'utf8')));
const text = narrationText(script);
const raw = JSON.parse(readFileSync(wordsFile, 'utf8'));
const timed = (raw.words ?? raw).filter((w) => (w.type ?? 'word') === 'word');
const out = mp3.replace(/\.mp3$/i, '.timestamps.json');
writeFileSync(
  out,
  JSON.stringify(
    { text, voiceId: script.voice.voiceId, modelId: script.voice.modelId, source: 'elevenlabs-scribe', alignment: wordsToAlignment(text, timed) },
    null,
    1,
  ),
);
console.log(`wrote ${out}`);
