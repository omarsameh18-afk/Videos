# Drama pauses without a new voice take (free). The take stays at 1.0x: nothing is time-stretched and no gap is cut.
#  - trims only the leading silence, so the voice starts at frame 0
#  - lengthens the pause after chosen words to a target length by splicing in room tone (the pause's own quiet audio, looped)
#  - snaps each Scribe word that follows a pause onto the real audio onset, moves all words onto the new timeline
#  - prints every pause of the edited voice (for the report) and writes them to <out_scribe>.pauses.json
# usage: python3 series/elfahman/tools/pauses.py <take.mp3> <scribe_words_take.json> <out_vo.mp3> <out_scribe_words.json>
#          --hook-words 7 --pause <word index>:<seconds> [--pause ...] [--thr -40]
import argparse, json, subprocess, tempfile, os
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument('take'); ap.add_argument('scribe'); ap.add_argument('out_vo'); ap.add_argument('out_scribe')
ap.add_argument('--hook-words', type=int, required=True)
ap.add_argument('--pause', action='append', default=[], help='<index of the word before the pause>:<target seconds>')
ap.add_argument('--thr', type=float, default=-40.0)
A = ap.parse_args()
SR = 44100

def decode(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).copy()

def silences(a, thr, min_len=0.05):
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

a = decode(A.take); dur = len(a) / SR
sw = json.load(open(A.scribe)); sw = sw['words'] if isinstance(sw, dict) else sw
sw = [w for w in sw if w.get('type', 'word') == 'word']
runs = silences(a, A.thr)

# leading silence (8 ms kept so the first sound is not clipped)
blk = int(0.005 * SR)
first = next(i for i in range(len(a) // blk) if 10 * np.log10((a[i * blk:(i + 1) * blk] ** 2).mean() + 1e-12) > -50)
lead = max(0.0, first * blk / SR - 0.008)

def pause_after(i):
    """the longest quiet run between word i and word i+1 (Scribe times are coarse, so search generously)"""
    lo, hi = sw[i]['start'] + 0.1, sw[i + 1]['end']
    c = [r for r in runs if r[1] > lo and r[0] < hi]
    return max(c, key=lambda r: r[1] - r[0]) if c else None

# splice list: (position in the take, seconds of room tone to add)
adds = []
for spec in A.pause:
    i, target = spec.split(':'); i, target = int(i), float(target)
    r = pause_after(i)
    if r is None: raise SystemExit(f'no pause found after word {i} ({sw[i]["text"]})')
    have = r[1] - r[0]
    if have < target: adds.append(((r[0] + r[1]) / 2, target - have, r))
adds.sort()

xf = int(0.008 * SR)
def tone(r, n):
    """n samples of room tone: the middle of that pause, looped with cross-fades"""
    s, e = int((r[0] + 0.03) * SR), int((r[1] - 0.03) * SR)
    src = a[s:e]; out = src.copy()
    while len(out) < n + xf:
        w = np.linspace(0, 1, xf, dtype=np.float32)
        out[-xf:] = out[-xf:] * (1 - w) + src[:xf] * w
        out = np.concatenate([out, src[xf:]])
    return out[:n]

out = np.zeros(0, np.float32); pts = []; pos = lead
for at, extra, r in adds:
    pts.append((pos, len(out) / SR)); out = np.concatenate([out, a[int(pos * SR):int(at * SR)]]); pts.append((at, len(out) / SR))
    out = np.concatenate([out, tone(r, int(extra * SR))]); pos = at
pts.append((pos, len(out) / SR)); out = np.concatenate([out, a[int(pos * SR):]]); pts.append((dur, len(out) / SR))
out[:int(0.004 * SR)] *= np.linspace(0, 1, int(0.004 * SR), dtype=np.float32)   # no click on the first sample
xs = np.array([p[0] for p in pts]); ys = np.array([p[1] for p in pts])
remap = lambda t: float(np.interp(t, xs, ys))

with tempfile.TemporaryDirectory() as d:
    src = os.path.join(d, 'o.f32'); out.tofile(src)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', src, '-c:a', 'libmp3lame', '-b:a', '192k', A.out_vo], check=True)

# word times: a word that follows a quiet run starts where that run ends (real onset); the word before it ends where the run starts
words = []; used = set()
for k, w in enumerate(sw):
    s, e = w['start'], w['end']
    near = [r for r in runs if abs(r[1] - s) <= 0.16 and r[1] - r[0] >= 0.1 and r not in used]   # one word per pause
    if near: r = min(near, key=lambda r: abs(r[1] - s)); used.add(r); s = r[1]
    if k == 0: s = lead
    words.append({'text': w['text'], 'type': 'word', 'start': s, 'end': e})
for k in range(len(words) - 1):
    r = pause_after(k)
    if r and r[1] - r[0] >= 0.1 and abs(r[1] - words[k + 1]['start']) < 0.02: words[k]['end'] = max(words[k]['start'] + 0.05, min(words[k]['end'], r[0]) if words[k]['end'] > r[0] else words[k]['end'])
for w in words: w['start'], w['end'] = round(remap(w['start']), 3), round(remap(w['end']), 3)
json.dump({'words': words}, open(A.out_scribe, 'w'), ensure_ascii=False)

# report: pauses of the edited voice (quiet runs >= 0.15 s), named by the word before them
b = decode(A.out_vo); nruns = silences(b, A.thr)
last = nruns[-1][0] if nruns and nruns[-1][1] >= len(b) / SR - 0.03 else len(b) / SR
rep = []
for s, e in nruns:
    if e - s < 0.15 or s >= last - 0.01: continue
    prev = [k for k, w in enumerate(words) if w['start'] <= s + 0.03]
    k = prev[-1] if prev else 0
    rep.append({'after': words[k]['text'], 'index': k, 's': round(s, 3), 'e': round(e, 3), 'len': round(e - s, 3)})
hook_end = next(p['s'] for p in rep if p['index'] >= A.hook_words - 1)
json.dump({'lead_trimmed': round(lead, 3), 'hook_end': round(hook_end, 3), 'speech_end': round(last, 3), 'length': round(len(b) / SR, 3),
           'added': [{'after': sw[[k for k, w in enumerate(sw) if w['start'] <= at][-1]]['text'], 'added': round(x, 3)} for at, x, _ in adds], 'pauses': rep},
          open(A.out_scribe.replace('.json', '.pauses.json'), 'w'), ensure_ascii=False, indent=1)
print(f'take {dur:.2f} s -> {len(b) / SR:.2f} s at 1.0x (no stretch, nothing cut except {lead:.3f} s of leading silence; {sum(x for _, x, _ in adds):.2f} s of room tone added in {len(adds)} pauses)')
print(f'hook (line 1) ends at {hook_end:.2f} s; last word ends at {last:.2f} s')
for p in rep: print(f"  {p['s']:7.2f}  {p['len']:.2f} s  after {p['after']}")
