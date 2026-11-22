// Pacing engine: one event timeline that drives the visuals and the SFX.
// - pose/expression per SENTENCE from its intent (max 1 pose per sentence)
// - a visual change at least every MAX_GAP_SEC (inserts camera punch-ins)
// - Max placement per scene + layout checks (no crop, no overlap with cards, >= 45% tall)
import { readFileSync } from 'node:fs';
import { sceneSentences } from './intents.mjs';
import { placeMax, maxRectAt, feetYFor, maxMode, unionBounds, overlaps, CARD_RECT, MARGIN, FRAME, MAX_ZOOM, VIS_MAIN, HOOK_GAUGE, HOOK_TEXT, SIDE_CAPTION, END_TEXT } from '../../src/short/geometry.ts';
import { chartMarkerFrame, GAUGE_SLAM, NUMBER_LAND } from '../../src/short/visualTiming.ts';
import { BACKGROUNDS } from '../../src/config.ts';
import { activitySwitches, LIFT_BLOCK, REP, restFrames } from '../../src/short/experiment/timeline.ts';

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

  const bgStart = script.meta.seed % BACKGROUNDS.length;
  scenes.forEach((t, i) => {
    const sc = script.scenes[i];
    // VISUAL RULE 3: background per scene, rotating so neighbours differ
    t.background = sc.background ?? BACKGROUNDS[(bgStart + i) % BACKGROUNDS.length];
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
    const feetY = feetYFor(sc.type);
    const mode = maxMode(sc.type);
    if (mode === 'none') {
      // experiment scene: subject events (sets/rests, reps, ticker, reveal) are the visual changes
      if (sc.type === 'ClipScene') {
        const p = sc.props;
        const dur = t.durationInFrames;
        if (p.week) {
          const n = p.week.to - p.week.from + 1;
          for (let k = 1; k < n; k++) {
            const fr = t.from + Math.round((k / n) * dur);
            changes.push({ frame: fr, kind: 'card' });
            sfx.push({ t: fr / fps, sfx: 'pop' });
          }
        }
        if (p.reps) for (const n of [p.reps.left, p.reps.right]) for (let k = 1; k <= n; k++) changes.push({ frame: t.from + Math.ceil((k * dur * 0.85) / n), kind: 'rep' });
        if (p.reveal) sfx.push({ t: t.from / fps + 0.03, sfx: 'thud' });
        if (p.swapRight && p.week && p.swapRight.atWeek > p.week.from && p.swapRight.atWeek <= p.week.to) {
          const n = p.week.to - p.week.from + 1;
          const fr = t.from + Math.round(((p.swapRight.atWeek - p.week.from) / n) * dur);
          sfx.push({ t: fr / fps, sfx: 'whoosh' }, { t: fr / fps + 0.05, sfx: 'thud' });
          changes.push({ frame: fr, kind: 'card' });
        }
        const segF = Math.round((p.segSec ?? 2) * fps);
        if ((p.seqLeft ?? []).length > 1 || (p.seqRight ?? []).length > 1) for (let fr = segF; fr < dur; fr += segF) changes.push({ frame: t.from + fr, kind: 'move' });
        if (p.tags.length) p.tags.forEach((_, k) => { const fr = t.from + Math.round(dur * 0.25) + k * 8; changes.push({ frame: fr, kind: 'card' }); sfx.push({ t: fr / fps, sfx: 'pop' }); });
        if (i === 0) sfx.push({ t: t.from / fps + 0.05, sfx: 'thud' });
      }
      for (const side of sc.type === 'ClipScene' ? [] : ['left', 'right']) {
        const subj = sc.props[side];
        for (const fr of activitySwitches(subj, t.durationInFrames)) changes.push({ frame: t.from + fr, kind: 'move' });
        const period = subj.activity === 'train' ? REP.lift : subj.activity === 'lift' ? REP.steady : 0;
        if (period) {
          const cyc = subj.activity === 'train' ? LIFT_BLOCK + restFrames(subj.timer) : t.durationInFrames + 1;
          for (let fr = period; fr < t.durationInFrames; fr += period) if (fr % cyc < LIFT_BLOCK || subj.activity === 'lift') changes.push({ frame: t.from + fr, kind: 'rep' });
        }
      }
      if (i === 0 && sc.type !== 'ClipScene') {
        sfx.push({ t: t.from / fps + 0.05, sfx: 'thud' });
        changes.push({ frame: t.from + 10, kind: 'card' });
      }
      if (sc.type === 'DayCounter') {
        const n = sc.props.to - sc.props.from + 1;
        for (let k = 1; k < n; k++) {
          const fr = t.from + Math.round((k / n) * t.durationInFrames);
          changes.push({ frame: fr, kind: 'card' });
          sfx.push({ t: fr / fps, sfx: 'pop' });
        }
      }
      if (sc.type === 'GymSet' && sc.props.meters) changes.push({ frame: t.from + 6, kind: 'card' });
      if (sc.type === 'Reveal') {
        sfx.push({ t: t.from / fps + 0.03, sfx: 'thud' });
        sc.props.tags.forEach((_, k) => {
          const fr = t.from + Math.round(t.durationInFrames * 0.3) + k * 8;
          changes.push({ frame: fr, kind: 'card' });
          sfx.push({ t: fr / fps, sfx: 'pop' });
        });
      }
    }
    const r = maxRectAt(t.placement, b, feetY, t.placement.maxZoom);
    const at = `scene ${i} (${sc.type})`;
    if (mode !== 'none' && (r.x < MARGIN.x - 0.5 || r.x + r.w > FRAME.w - MARGIN.x + 0.5 || r.y < MARGIN.y - 0.5 || feetY > FRAME.h - MARGIN.y)) layoutErrors.push(`${at}: Max leaves the 5% margin`);
    const card = CARD_RECT[sc.type];
    if (card && overlaps(r, card)) layoutErrors.push(`${at}: Max overlaps the card`);
    if (mode === 'reactor') {
      const visual = sc.type === 'Hook' ? [HOOK_TEXT, { x: HOOK_GAUGE.cx - HOOK_GAUGE.r - 80, y: HOOK_GAUGE.cy - HOOK_GAUGE.r - 80, w: 2 * HOOK_GAUGE.r + 160, h: HOOK_GAUGE.r + 120 }] : [VIS_MAIN];
      if (visual.some((v) => overlaps(r, v))) layoutErrors.push(`${at}: Max overlaps the visual`);
      if (overlaps(r, SIDE_CAPTION)) layoutErrors.push(`${at}: Max overlaps the caption column`);
      const hh = maxRectAt(t.placement, b, feetY).h / FRAME.h;
      if (hh < 0.27) layoutErrors.push(`${at}: Max reactor is only ${(hh * 100).toFixed(0)}% tall (want ~30%)`);
    }
    if (mode === 'end' && overlaps(r, END_TEXT)) layoutErrors.push(`${at}: Max overlaps the end-card text`);

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
    // visual beats (frames relative to the scene) -> a change + a pop each
    const beats = [];
    if ((sc.type === 'Hook' && sc.props.gauge) || sc.type === 'Gauge') beats.push(GAUGE_SLAM);
    if (sc.type === 'AnimatedChart' && sc.props.marker) beats.push(chartMarkerFrame(t.durationInFrames, sc.props.xTicks.length, sc.props.marker.at));
    if (sc.type === 'MuscleZoom') t.sentences.slice(1).forEach((x) => beats.push(Math.max(1, x.at)));
    if (sc.type === 'SplitVersus') {
      const rev = t.sentences.find((x) => x.intent === 'reveal') ?? t.sentences.at(-1);
      beats.push(Math.max(6, rev.at));
    }
    if (sc.type === 'BigNumber') beats.push(NUMBER_LAND);
    for (const bt of beats) {
      changes.push({ frame: t.from + bt, kind: 'card' });
      sfx.push({ t: (t.from + bt) / fps, sfx: bt === GAUGE_SLAM && ((sc.type === 'Hook' && sc.props.gauge) || sc.type === 'Gauge') ? 'thud' : 'pop' });
    }
  });
  const bgs = new Set(scenes.map((t) => t.background));
  if (scenes.length > 1 && bgs.size < 2) layoutErrors.push('the whole Short uses one background (need 2+)');

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
