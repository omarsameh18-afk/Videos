// Re-time a voice's character timestamps from a speech-to-text word list taken on the FINAL render audio
// (eleven_v3 timestamps smear words over pauses; STT word times are exact). Words must match 1:1.
// usage: node scripts/align-from-stt.mjs <script.json> <stt-words.json> <voice/id.timestamps.json> [speed=script.voice.speed]
import { readFileSync, writeFileSync } from 'node:fs';
import { Script, narrationText } from '../src/schema/script.ts';

const [scriptPath, sttPath, tsPath, speedArg] = process.argv.slice(2);
const script = Script.parse(JSON.parse(readFileSync(scriptPath, 'utf8')));
const speed = Number(speedArg ?? script.voice.speed);
const raw = JSON.parse(readFileSync(sttPath, 'utf8'));
const stt = (raw.words ?? raw).filter((w) => w.type === 'word');
const text = narrationText(script);
const words = text.split(' ');
const norm = (w) => w.toLowerCase().replace(/[^a-z0-9]/g, '');
if (words.length !== stt.length) throw new Error(`word count differs: script ${words.length}, stt ${stt.length}`);
words.forEach((w, i) => {
  if (norm(w) !== norm(stt[i].text)) throw new Error(`word ${i} differs: "${w}" vs "${stt[i].text}"`);
});
const chars = [], st = [], en = [];
words.forEach((w, i) => {
  const a = stt[i].start * speed, b = Math.max(stt[i].end, stt[i].start + 0.04) * speed; // back to the pre-speed timeline
  for (let k = 0; k < w.length; k++) {
    chars.push(w[k]);
    st.push(a + ((b - a) * k) / w.length);
    en.push(a + ((b - a) * (k + 1)) / w.length);
  }
  if (i < words.length - 1) {
    const nxt = stt[i + 1].start * speed;
    chars.push(' ');
    st.push(b);
    en.push(Math.max(b, nxt));
  }
});
const old = JSON.parse(readFileSync(tsPath, 'utf8'));
writeFileSync(tsPath, JSON.stringify({ ...old, source: 'stt-aligned', alignment: { characters: chars, character_start_times_seconds: st, character_end_times_seconds: en } }, null, 1));
console.log(`${tsPath}: ${words.length} words re-timed from STT (x${speed})`);
