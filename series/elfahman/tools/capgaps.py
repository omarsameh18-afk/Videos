# Fast-pace pause edit without a new voice take (free), from episode 07. The take stays at 1.0x: nothing is time-stretched,
# no pause is ever lengthened. Only silence is removed:
#  - the leading silence is trimmed, so the voice starts at frame 0
#  - every quiet run between words longer than --max-pause is cut down to --max-pause (the natural decay after the word
#    and a short breath before the next one are kept)
#  - optionally ONE pause (after the word index given with --mystery i:seconds) is capped at a longer length instead
#    (only cut, never lengthened: if it is already shorter, it stays as it is)
#  - --tail seconds of silence are kept after the last word
#  - writes the edited voice + the Scribe words moved onto the new timeline + <out_scribe>.pauses.json (every pause, for QA)
# usage: python3 series/elfahman/tools/capgaps.py <take.mp3> <scribe_words_take.json> <out_vo.mp3> <out_scribe_words.json>
#          --hook-words 8 [--max-pause 0.25] [--mystery 140:0.6] [--tail 0.4] [--thr -40]
import argparse, json, os, subprocess, tempfile
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument('take'); ap.add_argument('scribe'); ap.add_argument('out_vo'); ap.add_argument('out_scribe')
ap.add_argument('--hook-words', type=int, required=True)
ap.add_argument('--max-pause', type=float, default=0.25)
ap.add_argument('--mystery', default=None, help='<index of the word before the pause>:<max seconds>')
ap.add_argument('--tail', type=float, default=0.4)
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

a = decode(A.take); dur = len(a) / SR
sw = json.load(open(A.scribe)); sw = sw['words'] if isinstance(sw, dict) else sw
sw = [w for w in sw if w.get('type', 'word') == 'word']
runs = silences(a, A.thr, 0.05)
blk = int(0.005 * SR)
first = next(i for i in range(len(a) // blk) if 10 * np.log10((a[i * blk:(i + 1) * blk] ** 2).mean() + 1e-12) > -50)
lead = max(0.0, first * blk / SR - 0.008)
last = runs[-1][0] if runs and runs[-1][1] >= dur - 0.02 else dur

# the mystery pause: the longest quiet run between word i and word i+1
mys = None
if A.mystery:
    mi, mlen = A.mystery.split(':'); mi, mlen = int(mi), float(mlen)
    lo, hi = sw[mi]['start'] + 0.1, sw[mi + 1]['end']
    c = [r for r in runs if r[1] > lo and r[0] < hi]
    mys = (max(c, key=lambda r: r[1] - r[0]), mlen)

cuts = [(0.0, lead)] if lead > 0 else []
for s, e in runs:
    if s <= lead + 0.001 or e >= dur - 0.02: continue
    keep = mys[1] if mys and (s, e) == mys[0] else A.max_pause
    keep -= 0.03   # margin: the measured pause after the edit (cross-fades, window) stays under the cap
    if e - s > keep:
        cuts.append((s + keep * 0.6, e - keep * 0.4))
cuts.append((min(dur, last + A.tail), dur))

xf = int(0.005 * SR)
out = np.zeros(0, np.float32); pts = []; pos = 0.0
def add(seg):
    global out
    if len(out) >= xf and len(seg) >= xf:
        w = np.linspace(0, 1, xf, dtype=np.float32)
        out[-xf:] = out[-xf:] * (1 - w) + seg[:xf] * w
        out = np.concatenate([out, seg[xf:]])
    else: out = np.concatenate([out, seg])
for s, e in cuts:
    pts.append((pos, len(out) / SR)); add(a[int(pos * SR):int(s * SR)]); pts.append((s, len(out) / SR)); pos = e
pts.append((pos, len(out) / SR)); add(a[int(pos * SR):]); pts.append((dur, len(out) / SR))
out[:int(0.004 * SR)] *= np.linspace(0, 1, int(0.004 * SR), dtype=np.float32)
fo = int(0.03 * SR); out[-fo:] *= np.linspace(1, 0, fo, dtype=np.float32)
xs = np.array([p[0] for p in pts]); ys = np.array([p[1] for p in pts])
remap = lambda t: float(np.interp(t, xs, ys))
# the take may end with less than --tail of silence: pad with digital silence after the last word (end only)
have = len(out) / SR - remap(last)
if have < A.tail: out = np.concatenate([out, np.zeros(int((A.tail - have) * SR), np.float32)])

with tempfile.TemporaryDirectory() as d:
    src = os.path.join(d, 'o.f32'); out.tofile(src)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', src, '-c:a', 'libmp3lame', '-b:a', '192k', A.out_vo], check=True)

# word times: a word that follows a quiet run >= 0.1 s starts where that run ends (real onset)
words = []; used = set()
for k, w in enumerate(sw):
    s, e = w['start'], w['end']
    near = [r for r in runs if abs(r[1] - s) <= 0.16 and r[1] - r[0] >= 0.1 and r not in used]   # one word per pause
    if near: r = min(near, key=lambda r: abs(r[1] - s)); used.add(r); s = r[1]
    if k == 0: s = lead
    words.append({'text': w['text'], 'type': 'word', 'start': round(remap(s), 3), 'end': round(remap(max(e, s + 0.05)), 3)})
json.dump({'words': words}, open(A.out_scribe, 'w'), ensure_ascii=False)

# report on the edited file
b = decode(A.out_vo); L = len(b) / SR; nr = silences(b, A.thr, 0.05)
end_sil = nr[-1][1] - nr[-1][0] if nr and nr[-1][1] >= L - 0.03 else 0.0
speech_end = L - end_sil
body = [r for r in nr if r[0] > 0.02 and r[1] < L - 0.03]
rep = []
for s, e in body:
    prev = [k for k, w in enumerate(words) if w['start'] <= s + 0.03]
    k = prev[-1] if prev else 0
    rep.append({'after': words[k]['text'], 'index': k, 's': round(s, 3), 'e': round(e, 3), 'len': round(e - s, 3)})
hook_end = words[A.hook_words - 1]['end']
hp = [p for p in rep if p['s'] >= words[A.hook_words - 1]['start']]
if hp: hook_end = hp[0]['s']
mysrep = None
if mys:
    ms = remap((mys[0][0] + mys[0][1]) / 2)
    m = [p for p in rep if p['s'] <= ms <= p['e']]
    mysrep = m[0] if m else None
others = [p for p in rep if p is not mysrep]
summary = {'take': round(dur, 3), 'length': round(L, 3), 'speed': 1.0, 'lead_trimmed': round(lead, 3), 'hook_end': round(hook_end, 3),
           'speech_end': round(speech_end, 3), 'end_silence': round(end_sil, 3),
           'longest_body_pause': max(others, key=lambda p: p['len']) if others else None, 'mystery_pause': mysrep,
           'cuts': len(cuts), 'removed': round(sum(e - s for s, e in cuts), 3), 'pauses': rep}
json.dump(summary, open(A.out_scribe.replace('.json', '.pauses.json'), 'w'), ensure_ascii=False, indent=1)
print(f'take {dur:.2f} s -> {L:.2f} s at 1.0x (no stretch; {len(cuts)} cuts, {summary["removed"]:.2f} s of silence removed, lead {lead:.3f} s)')
print(f'hook (line 1) ends at {hook_end:.2f} s; last word ends at {speech_end:.2f} s; end silence {end_sil:.2f} s')
print('longest body pause:', summary['longest_body_pause'])
print('mystery pause:', mysrep)
