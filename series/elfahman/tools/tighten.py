# Tighten a voice take without a new generation (free): hook rule + pause caps.
#  - trims the leading silence, so the voice starts at frame 0
#  - hook (the first N script words): cuts the gaps between its words, then speeds that line up (pitch kept, at most
#    --max-speed) until it is fully spoken by --hook-end seconds
#  - caps every later pause at --max-pause seconds; leaves --tail seconds of room tone after the last word
#  - writes the edited voice + the Scribe words moved onto the new timeline (then run timing.py on those two files)
# usage: python3 series/elfahman/tools/tighten.py <take.mp3> <scribe_words_take.json> <out_vo.mp3> <out_scribe_words.json>
#          --hook-words 8 [--hook-end 2.85] [--max-speed 1.15] [--hook-gap 0.05] [--max-pause 0.32] [--tail 0.08]
import argparse, json, os, subprocess, tempfile
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument('take'); ap.add_argument('scribe'); ap.add_argument('out_vo'); ap.add_argument('out_scribe')
ap.add_argument('--hook-words', type=int, required=True)
ap.add_argument('--hook-end', type=float, default=2.85)
ap.add_argument('--max-speed', type=float, default=1.15)
ap.add_argument('--hook-gap', type=float, default=0.05)
ap.add_argument('--max-pause', type=float, default=0.32)
ap.add_argument('--tail', type=float, default=0.08)
ap.add_argument('--thr', type=float, default=-40.0, help='silence threshold, dBFS')
A = ap.parse_args()
SR = 44100

def decode(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).copy()

def silences(a, thr, min_len):
    win, hop = int(0.010 * SR), int(0.0025 * SR)
    n = (len(a) - win) // hop
    db = np.array([10 * np.log10((a[i * hop:i * hop + win] ** 2).mean() + 1e-12) for i in range(n)])
    quiet = db < thr
    runs, i = [], 0
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]: j += 1
            s, e = (i * hop) / SR, ((j - 1) * hop + win) / SR
            if e - s >= min_len: runs.append((s, e))
            i = j
        else: i += 1
    return runs

a = decode(A.take)
sw = json.load(open(A.scribe)); sw = sw['words'] if isinstance(sw, dict) else sw
sw = [w for w in sw if w.get('type', 'word') == 'word']
runs = silences(a, A.thr, 0.07)
dur = len(a) / SR
# leading silence: everything before the first 5 ms block louder than -50 dBFS (8 ms kept so the first sound is not clipped)
blk = int(0.005 * SR)
first = next(i for i in range(len(a) // blk) if 10 * np.log10((a[i * blk:(i + 1) * blk] ** 2).mean() + 1e-12) > -50)
lead = max(0.0, first * blk / SR - 0.008)
last = runs[-1][0] if runs and runs[-1][1] >= dur - 0.02 else dur                # end of the last word
# the hook ends at the first real pause after its last word starts
hook_last = sw[A.hook_words - 1]['start']
hook_pause = next(r for r in runs if r[0] > hook_last and r[1] - r[0] >= 0.2)
hook_end = hook_pause[0]

# cut list: (start, end) of removed audio on the take's timeline
cuts = []
if lead > 0: cuts.append((0.0, lead))
for s, e in runs:
    if s <= lead or e >= dur - 0.02: continue
    keep = A.hook_gap if e <= hook_end else A.max_pause
    if e - s > keep + 0.02:
        m = (s + e) / 2 if e <= hook_end else None
        # keep the natural decay after a word and a short breath of quiet before the next one
        if m is not None: cuts.append((s + keep / 2, e - keep / 2))
        else: cuts.append((s + keep * 0.6, e - keep * 0.4))
cuts.append((last + A.tail, dur))

def apply_cuts(a, cuts, t0, t1):
    """audio of [t0, t1) with the cuts removed, 6 ms cross-fades at each join; returns audio + breakpoints (take time -> new time)"""
    xf = int(0.006 * SR)
    out = np.zeros(0, np.float32); pts = []; pos = t0
    def add(seg):
        nonlocal out
        if len(out) >= xf and len(seg) >= xf:
            w = np.linspace(0, 1, xf, dtype=np.float32)
            out[-xf:] = out[-xf:] * (1 - w) + seg[:xf] * w
            out = np.concatenate([out, seg[xf:]])
        else: out = np.concatenate([out, seg])
    for s, e in [c for c in cuts if c[1] > t0 and c[0] < t1]:
        s, e = max(s, t0), min(e, t1)
        pts.append((pos, len(out) / SR)); add(a[int(pos * SR):int(s * SR)]); pts.append((s, len(out) / SR)); pos = e
    pts.append((pos, len(out) / SR)); add(a[int(pos * SR):int(t1 * SR)]); pts.append((t1, len(out) / SR))
    return out, pts

hook, hpts = apply_cuts(a, cuts, 0.0, hook_end)
hook[:int(0.004 * SR)] *= np.linspace(0, 1, int(0.004 * SR), dtype=np.float32)   # no click on the first sample
rest, rpts = apply_cuts(a, cuts, hook_end, dur)
hook_cut_len = len(hook) / SR
speed = min(A.max_speed, max(1.0, hook_cut_len / A.hook_end))
if speed > 1.001:
    with tempfile.TemporaryDirectory() as d:
        src, dst = os.path.join(d, 'h.f32'), os.path.join(d, 'o.f32')
        hook.tofile(src)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', src,
                        '-af', f'rubberband=tempo={speed:.5f}:pitch=1:transients=crisp:formant=preserved', '-f', 'f32le', dst], check=True)
        hook = np.fromfile(dst, np.float32)
hook_len = len(hook) / SR
k = hook_len / hook_cut_len
# join hook + rest with a short cross-fade (both sides are in a pause)
xf = int(0.006 * SR); w = np.linspace(0, 1, xf, dtype=np.float32)
hook[-xf:] = hook[-xf:] * (1 - w) + rest[:xf] * w
out = np.concatenate([hook, rest[xf:]])
fo = int(0.03 * SR); out[-fo:] *= np.linspace(1, 0, fo, dtype=np.float32)       # no click on the last sample
pts = [(t, n * k) for t, n in hpts] + [(t, hook_len - xf / SR + n) for t, n in rpts]
xs = np.array([p[0] for p in pts]); ys = np.array([p[1] for p in pts])
remap = lambda t: float(np.interp(t, xs, ys))

with tempfile.TemporaryDirectory() as d:
    src = os.path.join(d, 'o.f32'); out.tofile(src)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', src, '-c:a', 'libmp3lame', '-b:a', '192k', A.out_vo], check=True)
words = [{'text': w['text'], 'type': 'word', 'start': round(remap(w['start']), 3), 'end': round(remap(w['end']), 3)} for w in sw]
json.dump({'words': words}, open(A.out_scribe, 'w'), ensure_ascii=False)

removed = sum(e - s for s, e in cuts)
print(f'take {dur:.2f} s -> {len(out) / SR:.2f} s   ({len(cuts)} cuts, {removed:.2f} s of silence removed)')
print(f'leading silence trimmed: {lead:.3f} s')
print(f'hook: {hook_end - lead:.2f} s as spoken -> {hook_cut_len:.2f} s after the gap cuts -> {hook_len:.2f} s at {speed:.3f}x')
print(f'last word ends at {remap(last):.2f} s')
