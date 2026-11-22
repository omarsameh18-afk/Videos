// Download a finished ElevenLabs generation right away and record it in assets/clips/manifest.json.
// usage: node scripts/clip-add.mjs <name> <url> <ext> <credits> <model> <generation_id> <prompt...>
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const [name, url, ext, credits, model, generationId, ...prompt] = process.argv.slice(2);
const file = `assets/clips/${name}.${ext}`;
execFileSync('curl', ['-sSf', '-o', file, url]);
const man = existsSync('assets/clips/manifest.json') ? JSON.parse(readFileSync('assets/clips/manifest.json', 'utf8')) : { items: [] };
man.items = man.items.filter((x) => x.name !== name);
man.items.push({ name, file, model, generationId, credits: Number(credits), prompt: prompt.join(' ') });
man.totalCredits = man.items.reduce((s, x) => s + x.credits, 0);
writeFileSync('assets/clips/manifest.json', JSON.stringify(man, null, 2) + '\n');
console.log(`${file}  (+${credits} credits, total ${man.totalCredits})`);
