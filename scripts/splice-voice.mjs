// Build a voice-over from sentences that were ALREADY recorded (zero TTS credits).
// Each narration sentence is found verbatim in a cached ElevenLabs recording (.cache/tts or voice/),
// cut on its character timestamps and joined. Writes voice/<id>.mp3 + voice/<id>.timestamps.json.
// usage: node scripts/splice-voice.mjs <script.json>
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { Script, narrationText } from '../src/schema/script.ts';

const script = Script.parse(JSON.parse(readFileSync(process.argv[2], 'utf8')));
const text = narrationText(script);
const sentences = text.match(/[^.?!]+[.?!]+/g).map((s) => s.trim());

const sources = [];
for (const dir of ['.cache/tts', 'voice']) {
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.timestamps.json'))) {
    const mp3 = `${dir}/${f.replace('.timestamps.json', '.mp3')}`;
    const j = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
    if (existsSync(mp3) && j.alignment && j.source !== 'spliced') sources.push({ mp3, al: j.alignment, chars: j.alignment.characters.join('') });
  }
}

const PAD_IN = 0.04;
const PAD_OUT = 0.1;
const GAP = 0.12;
const pieces = [];
for (const s of sentences) {
  const src = sources.find((x) => x.chars.includes(s));
  if (!src) throw new Error(`sentence not found in any recording (needs new TTS): "${s}"`);
  const i0 = src.chars.indexOf(s);
  const i1 = i0 + s.length - 1;
  const a = Math.max(0, src.al.character_start_times_seconds[i0] - PAD_IN);
  const b = src.al.character_end_times_seconds[i1] + PAD_OUT;
  pieces.push({ s, src, i0, i1, a, b });
}

mkdirSync('.cache/splice', { recursive: true });
const parts = [];
pieces.forEach((p, k) => {
  const out = `.cache/splice/p${k}.wav`;
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', p.src.mp3, '-af', `atrim=${p.a}:${p.b},asetpts=PTS-STARTPTS,afade=t=in:d=0.01,afade=t=out:st=${(p.b - p.a - 0.02).toFixed(3)}:d=0.02`, '-ar', '44100', '-ac', '1', out]);
  parts.push(out);
});
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', `anullsrc=r=44100:cl=mono`, '-t', String(GAP), '.cache/splice/gap.wav']);
const list = parts.flatMap((p, k) => (k ? ['.cache/splice/gap.wav', p] : [p]));
writeFileSync('.cache/splice/list.txt', list.map((p) => `file '${process.cwd()}/${p}'`).join('\n'));
const id = script.meta.id;
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', '.cache/splice/list.txt', '-c:a', 'libmp3lame', '-q:a', '2', `voice/${id}.mp3`]);

// timestamps for the joined text
const characters = [];
const st = [];
const en = [];
let off = 0;
pieces.forEach((p, k) => {
  if (k) {
    characters.push(' ');
    st.push(off - GAP);
    en.push(off);
  }
  for (let i = p.i0; i <= p.i1; i++) {
    characters.push(p.src.al.characters[i]);
    st.push(p.src.al.character_start_times_seconds[i] - p.a + off);
    en.push(p.src.al.character_end_times_seconds[i] - p.a + off);
  }
  off += p.b - p.a + GAP;
});
writeFileSync(`voice/${id}.timestamps.json`, JSON.stringify({ text, source: 'spliced', voiceId: script.voice.voiceId, alignment: { characters, character_start_times_seconds: st, character_end_times_seconds: en } }));
for (const p of pieces) console.log(`  ${p.src.mp3}  "${p.s}"`);
console.log(`wrote voice/${id}.mp3 (${pieces.length} sentences, 0 credits)`);
