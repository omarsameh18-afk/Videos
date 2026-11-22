// Pacing engine: one event timeline that drives both the visuals and the SFX.
// Guarantees a visual change at least every MAX_GAP frames by inserting punch-in zooms.

export const MAX_GAP_SEC = 1.5;
export const ZOOM_IN = 1.15;
const norm = (w) => w.toLowerCase().replace(/[^a-z0-9']/g, '');

export function buildPacing(script, scenes, words, fps) {
  const f = (sec) => Math.max(0, Math.round(sec * fps));
  const total = scenes.at(-1).from + scenes.at(-1).durationInFrames;
  const exprKeys = [];
  const poseKeys = [];
  const shakes = [];
  const emphasisWords = [];
  const sfx = [];
  const changes = []; // { frame, kind }
  const zoomKeys = []; // { at, scale }

  scenes.forEach((t, i) => {
    const sc = script.scenes[i];
    const sceneWords = words.slice(t.firstWord, t.firstWord + t.wordCount);
    // cut: new scene, new expression/pose, cards slide in, zoom resets
    exprKeys.push({ at: t.from, value: sc.expression });
    poseKeys.push({ at: t.from, value: sc.pose });
    zoomKeys.push({ at: t.from, scale: 1 });
    changes.push({ frame: t.from, kind: 'cut' });
    sfx.push({ t: t.from / fps, sfx: 'whoosh' });

    for (const m of sc.moves) {
      const at = Math.max(t.from, f(sceneWords[m.atWord].start) - 2);
      if (m.expression) exprKeys.push({ at, value: m.expression });
      if (m.pose) poseKeys.push({ at, value: m.pose });
      changes.push({ frame: at, kind: 'move' });
    }
    const emph = new Set(sc.emphasis.map(norm));
    sceneWords.forEach((w, k) => {
      if (emph.has(norm(w.text))) {
        const at = f(w.start);
        shakes.push(at);
        emphasisWords.push(t.firstWord + k);
        changes.push({ frame: at, kind: 'shake' });
      }
    });
    // card events
    if (sc.type === 'WrongVsRight') {
      // reality card lands on the scene's last sentence
      const starts = sceneWords.map((w, k) => (k > 0 && /[.?!]$/.test(sceneWords[k - 1].text) ? k : -1)).filter((k) => k > 0);
      const k = starts.length ? starts.at(-1) : Math.floor(sceneWords.length / 2);
      t.reveal = Math.max(6, f(sceneWords[k].start) - t.from - 2);
      changes.push({ frame: t.from + t.reveal, kind: 'card' });
      sfx.push({ t: (t.from + t.reveal) / fps, sfx: 'pop' });
    }
    if (sc.type === 'StatCard') {
      t.land = Math.round(0.6 * fps);
      changes.push({ frame: t.from + t.land, kind: 'card' });
      sfx.push({ t: (t.from + t.land) / fps, sfx: 'pop' });
    }
  });

  // fill gaps with punch-in zooms (toggle 100% <-> 115%, reset at each cut)
  const maxGap = Math.round(MAX_GAP_SEC * fps);
  const sorted = () => [...new Set(changes.map((c) => c.frame))].sort((a, b) => a - b);
  let frames = sorted();
  for (let guard = 0; guard < 200; guard++) {
    const pts = [...frames, total];
    let inserted = false;
    for (let i = 0; i + 1 < pts.length; i++) {
      if (pts[i + 1] - pts[i] > maxGap && total - pts[i] > maxGap * 0.6) {
        // prefer a word start inside the window, else a fixed step
        const lo = pts[i] + Math.round(fps * 0.6);
        const hi = pts[i] + maxGap - 2;
        const w = words.find((x) => f(x.start) >= lo && f(x.start) <= hi);
        const at = w ? f(w.start) : pts[i] + Math.round(maxGap * 0.8);
        changes.push({ frame: at, kind: 'zoom' });
        frames = sorted();
        inserted = true;
        break;
      }
    }
    if (!inserted) break;
  }
  // zoom keys: every 'zoom' and 'shake' event punches (toggles) within its scene
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
      zoomKeys.push({ at: c.frame, scale: zoomed ? ZOOM_IN : 1 });
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
  };
}
