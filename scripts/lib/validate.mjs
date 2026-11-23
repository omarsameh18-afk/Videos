// Script validation: schema + content rules. Used by `npm run validate` and `npm run render`.
import { existsSync, readFileSync } from 'node:fs';
import { Script, narrationText } from '../../src/schema/script.ts';
import { intentErrors } from './intents.mjs';
import { VISUAL_TEXT, VOICE_LOCK } from '../../src/config.ts';
import { VIS_MAIN, HOOK_TEXT } from '../../src/short/geometry.ts';

const us = JSON.parse(readFileSync(new URL('../../config/usAudience.json', import.meta.url), 'utf8'));
const bareW = (w) => w.toLowerCase().replace(/[^a-z0-9']/g, '');
// label repeats the caption: all of its words appear, in order and adjacent, in the narration
const repeats = (label, narration) => {
  const l = label.replace(/=/g, ' ').split(/\s+/).map(bareW).filter(Boolean);
  const n = narration.split(/\s+/).map(bareW).filter(Boolean);
  for (let i = 0; i + l.length <= n.length; i++) if (l.every((w, k) => n[i + k] === w)) return true;
  return false;
};

// VISUAL RULE 4: visual text <= 4 words and fits on one line at >= 64px (Anton ~0.47em per char)
const fits = (text, width) => text.length * 0.47 * VISUAL_TEXT.minPx <= width;

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
    const walk = (v, path) => {
      if (typeof v === 'string') texts.push([path, v]);
      else if (Array.isArray(v)) v.forEach((x, j) => walk(x, `${path}[${j}]`));
      else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`);
    };
    walk(sc.props, `${at}.props`);

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
    const vis = []; // [text, available width]
    if (sc.type === 'Hook') sc.onScreenText.forEach((l) => vis.push([l, HOOK_TEXT.w]));
    if (sc.type === 'Hook' && sc.props.gauge) vis.push([sc.props.gauge.label, 520]);
    if (sc.type === 'Gauge') vis.push([sc.props.label, 520]);
    if (sc.type === 'AnimatedChart') {
      sc.props.series.forEach((x) => vis.push([x.label, VIS_MAIN.w / 2 - 40]));
      if (sc.props.marker) vis.push([sc.props.marker.label, 560]);
      vis.push([sc.props.xLabel, 700], [sc.props.yLabel, 600]);
      if (sc.props.marker && sc.props.marker.at >= sc.props.xTicks.length) errors.push(`${at}: marker.at is past the last x tick`);
      sc.props.series.forEach((x) => x.points.length !== sc.props.xTicks.length && errors.push(`${at}: series "${x.label}" needs ${sc.props.xTicks.length} points`));
    }
    if (sc.type === 'MuscleZoom') sc.props.steps.forEach((x) => vis.push([x, VIS_MAIN.w - 60]));
    if (sc.type === 'SplitVersus') [sc.props.wrong, sc.props.right].forEach((x) => x.split('=').forEach((p, k) => vis.push([(k ? '= ' : '') + p.trim(), (VIS_MAIN.w - 24) / 2 - 130])));
    if (sc.type === 'BigNumber') {
      vis.push([sc.props.label, VIS_MAIN.w - 60]);
      if (words(sc.props.label).length > 3) errors.push(`${at}: BigNumber label must be <= 3 words`);
    }
    // no on-screen label that just repeats the caption (headline-type labels; chart/gauge data labels exempt)
    const headlines = [
      ...(sc.type === 'Hook' ? sc.onScreenText : []),
      ...(sc.type === 'MuscleZoom' ? sc.props.steps : []),
      ...(sc.type === 'SplitVersus' ? [sc.props.wrong, sc.props.right] : []),
      ...(sc.type === 'BigNumber' ? [sc.props.label] : []),
      ...(sc.type === 'AnimatedChart' && sc.props.marker ? [sc.props.marker.label] : []),
    ];
    if (sc.captionChunks) {
      if (sc.captionChunks.join(' ').split(/\s+/).join(' ') !== sc.narration.trim().split(/\s+/).join(' ')) errors.push(`${at}: captionChunks do not join to the narration`);
      for (const c of sc.captionChunks) if (c.trim().split(/\s+/).length > 4) errors.push(`${at}: caption chunk "${c}" has more than 4 words`);
    }
    if (sc.type === 'ClipScene') {
      const p = sc.props;
      if (p.question) { vis.push([p.question, 972]); headlines.push(p.question); }
      p.lines.forEach((x) => { vis.push([x, 1000]); headlines.push(x); });
      if (p.repsByWeek && p.week) for (const side of ['left', 'right']) if (p.repsByWeek[side].length < p.week.to) errors.push(`${at}: repsByWeek.${side} needs ${p.week.to} weeks`);
      if (p.swapRight) p.clipRight = p.clipRight ?? p.clip;
      (p.labels ?? []).forEach((x) => vis.push([x, 380]));
      p.tags.forEach((x) => { vis.push([x, 972]); headlines.push(x); });
      if (p.card) {
        // cards: owner rule = <= 8 words per card (symbols like → / + = don't count), each row must fit
        const cw = [p.card.tag ?? '', ...p.card.rows].join(' ').split(/\s+/).filter((w) => /[a-z0-9]/i.test(w)).length;
        if (cw > 8) errors.push(`${at}: card has ${cw} words (max 8)`);
        for (const x of [p.card.title, p.card.tag, ...p.card.rows].filter(Boolean)) if (!fits(x, 880)) errors.push(`${at}: card text "${x}" does not fit`);
      }
      if (p.meters) { vis.push([p.meters.label, 972]); headlines.push(p.meters.label); }
      const man = existsSync('assets/clips/manifest.json') ? JSON.parse(readFileSync('assets/clips/manifest.json', 'utf8')).items.map((x) => x.name) : [];
      for (const c of [p.clip, p.clipRight, p.swapRight?.clip, ...(p.seqLeft ?? []), ...(p.seqRight ?? []), ...(p.seqRightBig ?? [])].filter(Boolean)) if (!man.includes(c)) errors.push(`${at}: clip "${c}" is not in assets/clips/manifest.json`);
    }
    if (['SplitClone', 'GymSet', 'DayCounter', 'Reveal'].includes(sc.type)) {
      for (const side of ['left', 'right']) vis.push([sc.props[side].label, 380]);
      if (sc.type === 'GymSet' && sc.props.meters) { vis.push([sc.props.meters.label, VIS_MAIN.w]); headlines.push(sc.props.meters.label); }
      if (sc.type === 'Reveal') sc.props.tags.forEach((x) => { vis.push([x, VIS_MAIN.w]); headlines.push(x); });
    }
    for (const h of headlines) if (repeats(h, sc.narration)) errors.push(`${at}: label "${h}" repeats the caption - drop the label or reword it`);
    for (const [text, w] of vis) {
      const n = words(text.replace(/=/g, ' ')).length;
      if (n > VISUAL_TEXT.maxWords) errors.push(`${at}: visual text "${text}" has ${n} words (max ${VISUAL_TEXT.maxWords})`);
      if (!fits(text, w)) errors.push(`${at}: visual text "${text}" does not fit on one line at ${VISUAL_TEXT.minPx}px`);
    }
    if (sc.type === 'StatCard' && sc.sourceIndex === undefined) errors.push(`${at}: StatCard needs a sourceIndex`);
  });

  for (const [where, t] of texts) {
    for (const { w, re } of bannedRes) if (re.test(t)) errors.push(`${where}: banned word "${w}"`);
    for (const w of t.split(/[\s/]+/)) {
      const b = bareW(w);
      if (us.banned[b]) errors.push(`${where}: "${w}" is not US style - use "${us.banned[b]}"`);
      if (/^\d+(\.\d+)?(kg|cm|km|m)$/i.test(b)) errors.push(`${where}: "${w}" - US audience uses lbs/inches`);
    }
  }
  if (s.voice.voiceId !== VOICE_LOCK.voiceId) errors.push(`voice.voiceId must be the locked Max voice ${VOICE_LOCK.voiceId} (${VOICE_LOCK.name})`);

  if (!['Hook', 'SplitClone', 'ClipScene'].includes(s.scenes[0].type)) errors.push('scenes[0] must be a Hook (or a SplitClone experiment hook)');
  const hookSec = words(s.scenes[0].narration).length / (WORDS_PER_SEC * s.voice.speed);
  if (hookSec > HOOK_MAX_SEC) {
    errors.push(`scenes[0] (Hook): narration ~${hookSec.toFixed(1)}s, must be <= ${HOOK_MAX_SEC}s (shorten it)`);
  }
  if (s.voice.text !== undefined && s.voice.text.trim() !== narrationText(s)) {
    errors.push('voice.text must equal the scene narrations joined with spaces (or leave it out)');
  }
  return { ok: errors.length === 0, errors, script: s };
}
