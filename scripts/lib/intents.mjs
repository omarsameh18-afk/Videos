// Resolve each sentence's pose + expression from its intent (ANIMATION RULE 1).
import { INTENTS, DEFAULT_INTENT, CARD_SCENES } from '../../src/config.ts';
import { sentenceOfWords } from '../../src/schema/script.ts';

/** -> [{ sentence, firstWordInScene, intent, pose, expression }] for one scene */
export function sceneSentences(sc) {
  const sent = sentenceOfWords(sc.narration);
  const n = sent.length ? sent[sent.length - 1] + 1 : 1;
  const out = [];
  let prev = null;
  for (let k = 0; k < n; k++) {
    const m = k === 0 ? sc : sc.moves.find((x) => x.atSentence === k);
    const intent = m?.intent ?? (k === 0 ? DEFAULT_INTENT[sc.type] : prev.intent);
    const map = INTENTS[intent];
    const pose = m?.pose ?? (m?.intent || k === 0 ? map.pose : prev.pose);
    const expression = m?.expression ?? (m?.intent || k === 0 ? map.expression : prev.expression);
    const cur = { sentence: k, firstWordInScene: sent.indexOf(k), intent, pose, expression, explicit: !!m };
    out.push(cur);
    prev = cur;
  }
  return out;
}

/** rule violations for one scene */
export function intentErrors(sc, at) {
  const errs = [];
  if (['SplitClone', 'GymSet', 'DayCounter', 'Reveal', 'ClipScene'].includes(sc.type)) return errs; // subjects, no narrator pose
  const nSent = sentenceOfWords(sc.narration).at(-1) + 1;
  const seen = new Set();
  for (const m of sc.moves) {
    if (m.atSentence >= nSent) errs.push(`${at}: move atSentence ${m.atSentence} but narration has ${nSent} sentence(s)`);
    if (seen.has(m.atSentence)) errs.push(`${at}: more than one move for sentence ${m.atSentence} (max 1 pose per sentence)`);
    seen.add(m.atSentence);
  }
  if (errs.length) return errs;
  for (const s of sceneSentences(sc)) {
    const map = INTENTS[s.intent];
    if (!map.poses.includes(s.pose)) errs.push(`${at} sentence ${s.sentence}: pose "${s.pose}" does not fit intent "${s.intent}" (use ${map.poses.join('/')})`);
    if (!map.expressions.includes(s.expression)) errs.push(`${at} sentence ${s.sentence}: expression "${s.expression}" does not fit intent "${s.intent}" (use ${map.expressions.join('/')})`);
    if (s.intent === 'question' && s.pose === 'facepalm') errs.push(`${at} sentence ${s.sentence}: never facepalm on a question`);
    if (s.pose === 'pointing' && !CARD_SCENES.includes(sc.type)) errs.push(`${at} sentence ${s.sentence}: pointing needs a card to point at (${CARD_SCENES.join('/')})`);
  }
  return errs;
}
