// Turns a timestamps JSON (character alignment over the voice-over text) into
// words, scene timings and caption pages.

export const tokens = (s) => s.trim().split(/\s+/).filter(Boolean);
const norm = (w) => w.toLowerCase().replace(/[^a-z0-9']/g, '');

/** Character alignment -> words [{ text, start, end }] */
export function alignmentToWords(al) {
  const words = [];
  let cur = null;
  al.characters.forEach((ch, i) => {
    const s = al.character_start_times_seconds[i];
    const e = al.character_end_times_seconds[i];
    if (/\s/.test(ch)) {
      if (cur) words.push(cur);
      cur = null;
    } else if (!cur) cur = { text: ch, start: s, end: e };
    else {
      cur.text += ch;
      cur.end = e;
    }
  });
  if (cur) words.push(cur);
  return words;
}

/**
 * Word-level timings (e.g. from ElevenLabs Scribe) -> character alignment over `text`.
 * Words are matched to the script text in order; characters are spread evenly inside each word.
 */
export function wordsToAlignment(text, timedWords) {
  const scriptWords = tokens(text);
  const tw = timedWords.filter((w) => norm(w.text));
  if (tw.length !== scriptWords.length) {
    // tolerate small differences by matching on normalised text
    console.warn(`warning: ${tw.length} timed words vs ${scriptWords.length} script words`);
  }
  const characters = [];
  const starts = [];
  const ends = [];
  let t = 0;
  scriptWords.forEach((w, i) => {
    const m = tw[Math.min(i, tw.length - 1)];
    const ws = Math.max(m.start, t);
    const we = Math.max(m.end, ws + 0.05);
    if (i > 0) {
      characters.push(' ');
      starts.push(t);
      ends.push(ws);
    }
    const d = (we - ws) / w.length;
    [...w].forEach((c, k) => {
      characters.push(c);
      starts.push(ws + d * k);
      ends.push(ws + d * (k + 1));
    });
    t = we;
  });
  return { characters, character_start_times_seconds: starts, character_end_times_seconds: ends };
}

/** Scene start/duration in frames, driven by when each scene's first word is spoken. */
export function sceneTimings(script, words, audioSec, fps, { leadFrames = 3, tailSec = 0.8 } = {}) {
  const counts = script.scenes.map((s) => tokens(s.narration).length);
  const total = counts.reduce((a, b) => a + b, 0);
  if (total !== words.length) console.warn(`warning: script has ${total} words, audio alignment has ${words.length}`);
  const starts = [];
  let wi = 0;
  counts.forEach((c, i) => {
    const w = words[Math.min(wi, words.length - 1)];
    starts.push(i === 0 ? 0 : Math.max(0, Math.round(w.start * fps) - leadFrames));
    wi += c;
  });
  // the last sentence always finishes fully: end = last word end + tail (never cut mid-sentence)
  const endFrame = Math.round((Math.min(audioSec, words[words.length - 1].end + tailSec) > 0 ? words[words.length - 1].end + tailSec : audioSec) * fps);
  return starts.map((from, i) => ({
    from,
    durationInFrames: (i + 1 < starts.length ? starts[i + 1] : endFrame) - from,
    firstWord: counts.slice(0, i).reduce((a, b) => a + b, 0),
    wordCount: counts[i],
  }));
}

// words that must never END a caption chunk (they dangle: "A MOVE YOUR", "FROM A")
export const DANGLING = new Set([
  'a', 'an', 'the', 'your', 'my', 'our', 'their', 'his', 'her', 'its', 'to', 'of', 'from', 'in', 'on', 'at', 'for',
  'with', 'and', 'but', 'or', 'nor', 'is', 'are', 'was', 'were', 'be', "it's", "that's", 'that', 'this',
  'these', 'those', 'after', 'before', 'into', 'than', 'as', 'by', 'so', 'if', 'very', 'really', 'no', 'one',
  'more', 'most', 'some', 'any', 'every', "isn't", "don't", "doesn't", 'can', 'will', 'would', 'should',
  'means', 'mean', 'makes', 'make', 'gets', 'get',
]);
const PARTICLES = new Set(['in', 'up', 'to', 'on', 'off', 'out', 'down', 'over']);
const bare = (w) => w.toLowerCase().replace(/[^a-z0-9']/g, '');
const closes = (w) => /[.,;:?!]$/.test(w);

/**
 * CAPTION RULE: chunk by phrase/meaning, 1-3 words, never end on a dangling word, never across punctuation
 * or a scene boundary. Dynamic programming over each punctuation-delimited segment.
 */
export function chunkWords(texts, { maxWords = 3, maxChars = 24 } = {}) {
  const cost = (ch) => {
    const last = ch[ch.length - 1];
    const before = ch.length > 1 ? bare(ch[ch.length - 2]) : '';
    // "kicked in", "used to", "showed up": a particle after a verb completes the phrase
    const particle = PARTICLES.has(bare(last)) && /(ed|ing)$/.test(before);
    let c = ch.length === 1 ? 5 : ch.length === 2 ? 0.6 : 0;
    if (ch.join(' ').length > maxChars && ch.length > 1) c += 50;
    if (!closes(last) && !particle && DANGLING.has(bare(last))) c += 20;
    if (ch.length === 1 && DANGLING.has(bare(last))) c += 30;
    return c;
  };
  const out = [];
  let seg = [];
  const flush = () => {
    const n = seg.length;
    const best = [0];
    const prev = [0];
    for (let i = 1; i <= n; i++) {
      best[i] = Infinity;
      for (let j = 1; j <= Math.min(maxWords, i); j++) {
        const c = best[i - j] + cost(seg.slice(i - j, i).map((k) => texts[k]));
        if (c < best[i]) {
          best[i] = c;
          prev[i] = j;
        }
      }
    }
    const chunks = [];
    for (let i = n; i > 0; i -= prev[i]) chunks.unshift(seg.slice(i - prev[i], i));
    out.push(...chunks);
    seg = [];
  };
  texts.forEach((w, k) => {
    seg.push(k);
    if (/[.;:?!]$/.test(w) || (/,$/.test(w) && seg.length >= 2)) flush();
  });
  if (seg.length) flush();
  return out;
}

/** Caption pages from phrase chunks, never across a scene boundary. */
export function captionPages(words, scenes, opts = {}) {
  const pages = [];
  for (const sc of scenes) {
    const idx = Array.from({ length: sc.wordCount }, (_, k) => sc.firstWord + k).filter((i) => i < words.length);
    for (const ch of chunkWords(idx.map((i) => words[i].text), opts)) pages.push(ch.map((k) => idx[k]));
  }
  return pages.map((idx, p) => ({
    words: idx,
    start: words[idx[0]].start,
    end: p + 1 < pages.length ? words[pages[p + 1][0]].start : words[idx[idx.length - 1]].end + 0.6,
  }));
}
