# Second pass after capgaps.py (from episode 10): a breath or a soft word tail between -40 and -30 dBFS is "sound" for
# capgaps (-40 dB) but reads as silence at -30 dB, so a gap can still measure > max-pause there. This finds every quiet run at
# --thr (default -30 dB) longer than --max-pause and removes only the excess, from the middle of that run (voice stays 1.0x,
# nothing is lengthened). The marked mystery pause (--keep start:end, seconds on the input timeline) may stay up to --keep-max.
# It shifts the words file (timing.py format or Scribe format) and updates <pauses.json> if given.
# usage: python3 series/elfahman/tools/trimgaps.py <vo.mp3> <scribe_words.json> [--pauses p.json] [--keep 47.6:48.1] [--keep-max 0.6]
import argparse, json, subprocess
import numpy as np
ap = argparse.ArgumentParser()
ap.add_argument('vo'); ap.add_argument('words')
ap.add_argument('--thr', type=float, default=-30.0); ap.add_argument('--max-pause', type=float, default=0.25)
ap.add_argument('--keep', default=None); ap.add_argument('--keep-max', type=float, default=0.6); ap.add_argument('--pauses', default=None)
A = ap.parse_args(); SR = 44100
a = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', A.vo, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout, np.float32).copy()
dur = len(a) / SR
win, hop = int(0.010 * SR), int(0.0025 * SR)
n = (len(a) - win) // hop
db = np.array([10 * np.log10((a[i * hop:i * hop + win] ** 2).mean() + 1e-12) for i in range(n)])
runs, i = [], 0
while i < n:
    if db[i] < A.thr:
        j = i
        while j < n and db[j] < A.thr: j += 1
        runs.append((i * hop / SR, ((j - 1) * hop + win) / SR)); i = j
    else: i += 1
keep = tuple(map(float, A.keep.split(':'))) if A.keep else None
cuts = []
for s, e in runs:
    if s < 0.05 or e > dur - 0.05: continue           # leading / tail silence is not a body pause
    cap = A.keep_max if keep and s < keep[1] and e > keep[0] else A.max_pause
    L = e - s
    if L > cap + 0.004:
        ex = L - cap + 0.01; m = (s + e) / 2
        cuts.append((m - ex / 2, m + ex / 2))
segs, prev = [], 0
for c0, c1 in cuts:
    segs.append(a[prev:int(c0 * SR)]); prev = int(c1 * SR)
segs.append(a[prev:])
out = np.concatenate(segs)
f = 64  # 1.5 ms crossfade-free join: tiny fade at each join to avoid clicks
pos = 0
for sg in segs[:-1]:
    pos += len(sg)
    lo, hi = max(0, pos - f), min(len(out), pos + f)
    out[lo:hi] *= np.concatenate([np.linspace(1, 0, pos - lo), np.linspace(0, 1, hi - pos)])
def shift(t):
    return t - sum(min(max(t - c0, 0), c1 - c0) for c0, c1 in cuts)
tmp = A.vo + '.tmp.f32'
out.astype(np.float32).tofile(tmp)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', tmp, '-c:a', 'libmp3lame', '-b:a', '192k', A.vo], check=True)
subprocess.run(['rm', tmp])
W = json.load(open(A.words)); lst = W['words'] if isinstance(W, dict) else W
for w in lst:
    for k in ('start', 'end', 's', 'e'):
        if k in w: w[k] = round(shift(w[k]), 3)
json.dump(W, open(A.words, 'w'), ensure_ascii=False)
print(f'{len(cuts)} cuts at {A.thr} dB: ' + ', '.join(f'{c0:.2f}-{c1:.2f} ({c1 - c0:.3f} s)' for c0, c1 in cuts) + f'; {dur:.2f} -> {len(out) / SR:.2f} s')
if A.pauses:
    P = json.load(open(A.pauses))
    def walk(o):
        if isinstance(o, dict):
            for k, v in o.items():
                if k in ('s', 'e', 'hook_end', 'speech_end') and isinstance(v, (int, float)): o[k] = round(shift(v), 3)
                else: walk(v)
        elif isinstance(o, list):
            for v in o: walk(v)
    walk(P); P['length'] = round(len(out) / SR, 3); P['trimgaps'] = {'thr': A.thr, 'cuts': [[round(c0, 3), round(c1, 3)] for c0, c1 in cuts]}
    json.dump(P, open(A.pauses, 'w'), ensure_ascii=False, indent=1)
