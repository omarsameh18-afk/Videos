// Script validation: schema + content rules. Used by `npm run validate` and `npm run render`.
import { readFileSync } from 'node:fs';
import { Script, narrationText } from '../../src/schema/script.ts';
import { intentErrors } from './intents.mjs';

const banned = JSON.parse(readFileSync(new URL('../../config/bannedWords.json', import.meta.url), 'utf8'));
export const MAX_WORDS_PER_LINE = 6;
export const HOOK_MAX_SEC = 3;
export const WORDS_PER_SEC = 3.2; // pre-voice estimate at 1.0x; the real hook length is re-checked after the voice edit

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const bannedRes = [
  ...banned.words.map((w) => ({ w, re: new RegExp(`(^|[^A-Za-z])${esc(w)}($|[^A-Za-z])`, 'i') })),
  ...banned.phrases.map((w) => ({ w, re: new RegExp(esc(w).replace(/ /g, '\\s+'), 'i') })),
];
const words = (s) => s.trim().split(/\s+/).filter(Boolean);

export function validateScript(raw) {
  const errors = [];
  const parsed = Script.safeParse(raw);
  if (!parsed.success) {
    for (const i of parsed.error.issues) errors.push(`schema: ${i.path.join('.') || '(root)'}: ${i.message}`);
    return { ok: false, errors };
  }
  const s = parsed.data;

  // texts to scan: [where, text]
  const texts = [['meta.title', s.meta.title]];
  s.scenes.forEach((sc, i) => {
    const at = `scenes[${i}] (${sc.type})`;
    texts.push([`${at}.narration`, sc.narration]);
    sc.onScreenText.forEach((l, j) => texts.push([`${at}.onScreenText[${j}]`, l]));
    for (const [k, v] of Object.entries(sc.props)) {
      if (typeof v === 'string') texts.push([`${at}.props.${k}`, v]);
      if (Array.isArray(v)) v.forEach((x, j) => typeof x === 'string' && texts.push([`${at}.props.${k}[${j}]`, x]));
    }

    // on-screen lines: max 6 words
    const lines = [...sc.onScreenText];
    if (sc.type === 'WrongVsRight') lines.push(sc.props.wrong, sc.props.right);
    if (sc.type === 'StatCard') lines.push(...sc.props.label);
    for (const l of lines) {
      if (words(l).length > MAX_WORDS_PER_LINE) errors.push(`${at}: line has ${words(l).length} words (max ${MAX_WORDS_PER_LINE}): "${l}"`);
    }
    if (sc.sourceIndex !== undefined && sc.sourceIndex >= s.meta.sources.length) {
      errors.push(`${at}: sourceIndex ${sc.sourceIndex} but only ${s.meta.sources.length} source(s)`);
    }
    errors.push(...intentErrors(sc, at));
    const said = words(sc.narration).map((w) => w.toLowerCase().replace(/[^a-z0-9']/g, ''));
    for (const e of sc.emphasis) if (!said.includes(e.toLowerCase().replace(/[^a-z0-9']/g, ''))) errors.push(`${at}: emphasis word "${e}" is not in the narration`);
    if (sc.type === 'StatCard' && sc.sourceIndex === undefined) errors.push(`${at}: StatCard needs a sourceIndex`);
  });

  for (const [where, t] of texts) {
    for (const { w, re } of bannedRes) if (re.test(t)) errors.push(`${where}: banned word "${w}"`);
  }

  if (s.scenes[0].type !== 'Hook') errors.push('scenes[0] must be a Hook');
  const hookSec = words(s.scenes[0].narration).length / (WORDS_PER_SEC * s.voice.speed);
  if (s.scenes[0].type === 'Hook' && hookSec > HOOK_MAX_SEC) {
    errors.push(`scenes[0] (Hook): narration ~${hookSec.toFixed(1)}s, must be <= ${HOOK_MAX_SEC}s (shorten it)`);
  }
  if (s.voice.text !== undefined && s.voice.text.trim() !== narrationText(s)) {
    errors.push('voice.text must equal the scene narrations joined with spaces (or leave it out)');
  }
  return { ok: errors.length === 0, errors, script: s };
}
