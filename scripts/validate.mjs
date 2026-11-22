// npm run validate <script.json>
import { readFileSync } from 'node:fs';
import { validateScript } from './lib/validate.mjs';

const file = process.argv[2];
if (!file) {
  console.error('usage: npm run validate <script.json>');
  process.exit(2);
}
const r = validateScript(JSON.parse(readFileSync(file, 'utf8')));
if (!r.ok) {
  console.error(`✗ ${file}: ${r.errors.length} problem(s)`);
  for (const e of r.errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`✓ ${file} is valid (${r.script.scenes.length} scenes)`);
