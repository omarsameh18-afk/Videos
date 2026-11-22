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
  const endFrame = Math.ceil((audioSec + tailSec) * fps);
  return starts.map((from, i) => ({
    from,
    durationInFrames: (i + 1 < starts.length ? starts[i + 1] : endFrame) - from,
    firstWord: counts.slice(0, i).reduce((a, b) => a + b, 0),
    wordCount: counts[i],
  }));
}

/** Caption pages: <= maxWords words, never across a scene boundary, break after . ? ! */
export function captionPages(words, scenes, { maxWords = 4 } = {}) {
  const pages = [];
  for (const sc of scenes) {
    let page = [];
    for (let i = sc.firstWord; i < sc.firstWord + sc.wordCount && i < words.length; i++) {
      page.push(i);
      const endOfSentence = /[.?!]$/.test(words[i].text);
      const softBreak = /[,;:]$/.test(words[i].text) && page.length >= 2;
      if (page.length >= maxWords || endOfSentence || softBreak) {
        pages.push(page);
        page = [];
      }
    }
    if (page.length) pages.push(page);
  }
  return pages.map((idx, p) => ({
    words: idx,
    start: words[idx[0]].start,
    end: p + 1 < pages.length ? words[pages[p + 1][0]].start : words[idx[idx.length - 1]].end + 0.6,
  }));
}
