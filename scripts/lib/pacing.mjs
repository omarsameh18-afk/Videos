// Pacing engine: one event timeline that drives the visuals and the SFX.
// - pose/expression per SENTENCE from its intent (max 1 pose per sentence)
// - a visual change at least every MAX_GAP_SEC (inserts camera punch-ins)
// - Max placement per scene + layout checks (no crop, no overlap with cards, >= 45% tall)
import { readFileSync } from 'node:fs';
import { sceneSentences } from './intents.mjs';
import { placeMax, maxRect, unionBounds, overlaps, CARD_RECT, MARGIN, UI_RIGHT, FEET_Y, FRAME, MAX_ZOOM } from '../../src/short/geometry.ts';

export const MAX_GAP_SEC = 1.5;
const BOUNDS = JSON.parse(readFileSync(new URL('../../src/max/poseBounds.json', import.meta.url), 'utf8'));
const norm = (w) => w.toLowerCase().replace(/[^a-z0-9']/g, '');

export function buildPacing(script, scenes, words, fps) {
  const f = (sec) => Math.max(0, Math.round(sec * fps));
  const total = scenes.at(-1).from + scenes.at(-1).durationInFrames;
  const exprKeys = [];
  const poseKeys = [];
  const shakes = [];
  const emphasisWords = [];
  const sfx = [];
  const changes = [];
  const zoomKeys = [];
  const layoutErrors = [];

  scenes.forEach((t, i) => {
    const sc = script.scenes[i];
    const sceneWords = words.slice(t.firstWord, t.firstWord + t.wordCount);
    const sentences = sceneSentences(sc);
    t.sentences = sentences.map((s) => ({ ...s, at: s.sentence === 0 ? 0 : f(sceneWords[s.firstWordInScene].start) - 2 - t.from }));

    // cut
    changes.push({ frame: t.from, kind: 'cut' });
    sfx.push({ t: t.from / fps, sfx: 'whoosh' });
    zoomKeys.push({ at: t.from, scale: 1 });
    // one pose (and expression) per sentence
    let prev = null;
    for (const s of t.sentences) {
      const at = t.from + Math.max(0, s.at);
      if (!prev || prev.pose !== s.pose) poseKeys.push({ at, value: s.pose });
      if (!prev || prev.expression !== s.expression) exprKeys.push({ at, value: s.expression });
      if (prev && (prev.pose !== s.pose || prev.expression !== s.expression)) changes.push({ frame: at, kind: 'pose' });
      prev = s;
    }
    // placement from the measured bounds of every pose used in this scene
    const poses = [...new Set(t.sentences.map((s) => s.pose))];
    const b = unionBounds(poses.map((p) => BOUNDS[p]));
    t.placement = placeMax(sc.type, b);
    const r = maxRect(t.placement, b, t.placement.maxZoom);
    const at = `scene ${i} (${sc.type})`;
    if (r.x < MARGIN.x - 0.5 || r.x + r.w > UI_RIGHT + 0.5 || r.y < MARGIN.y - 0.5) layoutErrors.push(`${at}: Max leaves the safe margin`);
    const card = CARD_RECT[sc.type];
    if (card && overlaps(r, card)) layoutErrors.push(`${at}: Max overlaps the card`);
    if (maxRect(t.placement, b).h < 0.45 * FRAME.h * 0.97) layoutErrors.push(`${at}: Max is only ${(maxRect(t.placement, b).h / FRAME.h * 100).toFixed(0)}% of frame height`);
    if (r.y + r.h > FEET_Y + 12) layoutErrors.push(`${at}: Max reaches into the caption band`);

    // emphasis words: shake + caption accent
    const emph = new Set(sc.emphasis.map(norm));
    sceneWords.forEach((w, k) => {
      if (emph.has(norm(w.text))) {
        const fr = f(w.start);
        shakes.push(fr);
        emphasisWords.push(t.firstWord + k);
        changes.push({ frame: fr, kind: 'shake' });
      }
    });
    // card events (one card at a time)
    if (sc.type === 'WrongVsRight') {
      const rev = t.sentences.find((s) => s.intent === 'reveal') ?? t.sentences.at(-1);
      t.reveal = Math.max(6, rev.at);
      changes.push({ frame: t.from + t.reveal, kind: 'card' });
      sfx.push({ t: (t.from + t.reveal) / fps, sfx: 'pop' });
    }
    if (sc.type === 'StatCard') {
      t.land = Math.round(0.6 * fps);
      changes.push({ frame: t.from + t.land, kind: 'card' });
      sfx.push({ t: (t.from + t.land) / fps, sfx: 'pop' });
    }
  });

  // fill gaps with camera punch-ins (100% <-> 115%, reset at each cut)
  const maxGap = Math.round(MAX_GAP_SEC * fps);
  const sorted = () => [...new Set(changes.map((c) => c.frame))].sort((a, b) => a - b);
  let frames = sorted();
  for (let guard = 0; guard < 200; guard++) {
    const pts = [...frames, total];
    let inserted = false;
    for (let i = 0; i + 1 < pts.length; i++) {
      if (pts[i + 1] - pts[i] > maxGap && total - pts[i] > maxGap * 0.6) {
        const lo = pts[i] + Math.round(fps * 0.6);
        const hi = pts[i] + maxGap - 2;
        const w = words.find((x) => f(x.start) >= lo && f(x.start) <= hi);
        changes.push({ frame: w ? f(w.start) : pts[i] + Math.round(maxGap * 0.8), kind: 'zoom' });
        frames = sorted();
        inserted = true;
        break;
      }
    }
    if (!inserted) break;
  }
  const sceneOf = (fr) => scenes.findLastIndex((t) => t.from <= fr);
  let lastScene = -1;
  let zoomed = false;
  for (const c of [...changes].sort((a, b) => a.frame - b.frame)) {
    const si = sceneOf(c.frame);
    if (si !== lastScene) {
      zoomed = false;
      lastScene = si;
    }
    if (c.kind === 'zoom' || c.kind === 'shake') {
      zoomed = !zoomed;
      zoomKeys.push({ at: c.frame, scale: zoomed ? MAX_ZOOM : 1 });
    }
  }
  zoomKeys.sort((a, b) => a.at - b.at);

  const fin = [...frames, total];
  let longest = 0;
  for (let i = 0; i + 1 < fin.length; i++) longest = Math.max(longest, fin[i + 1] - fin[i]);
  return {
    exprKeys: exprKeys.sort((a, b) => a.at - b.at),
    poseKeys: poseKeys.sort((a, b) => a.at - b.at),
    zoomKeys,
    shakes: shakes.sort((a, b) => a - b),
    emphasisWords,
    sfx: sfx.sort((a, b) => a.t - b.t),
    changes: changes.sort((a, b) => a.frame - b.frame),
    longestGapSec: longest / fps,
    layoutErrors,
  };
}
