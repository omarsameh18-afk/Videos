// Mix VO + music bed + SFX for video #12 -> public/elfahman-12/mix.wav (-14 LUFS)
import { readFileSync, mkdirSync } from 'node:fs';
import { mixAudio } from '../lib/mix.mjs';
const d = JSON.parse(readFileSync('src/elfahman/sunData.json', 'utf8'));
const caps = (s) => d.captions.filter((c) => c.s === s);
const events = [];
d.sentences.slice(1).forEach((s) => events.push({ t: s.start - 0.12, sfx: 'whoosh' }));
events.push({ t: caps(2)[1].start, sfx: 'thud' });   // sun pops / sky snaps black
events.push({ t: d.sentences[10].start, sfx: 'thud' }); // "استنى"
events.push({ t: caps(16)[0].start, sfx: 'pop' });
mkdirSync('public/elfahman-12', { recursive: true });
const r = mixAudio({ voice: 'voice/elfahman-12/vo.wav', events, durSec: d.duration, out: 'public/elfahman-12/mix.wav', musicDb: -22, whooshDb: -14 });
console.log(r);
