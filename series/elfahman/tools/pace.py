# Relaxed, natural pacing from the raw take (from episode 10 v2). The voice stays at 1.0x: only silence is cut or added
# (digital silence, the take's own floor is below -80 dB). Each quiet run (-40 dB, blips < 60 ms merged) is matched to the
# word boundary nearest to it (Scribe), and the script's punctuation after that word sets its length:
#   sentence end (. ! ?)   -> clamp(own length, --sent-min, --sent-max)   (a natural breath, never cut shorter than --sent-min)
#   comma / colon (، , :)  -> clamp(own length, --comma-min, --comma-max)
#   inside a phrase        -> min(own length, --mid-max)
#   --hook N               -> no gap inside the first N words (said in one go)
#   --straight i,i         -> boundary after word i said straight through (--straight-gap)
#   --mystery i:s          -> boundary after word i set to exactly s seconds (may be lengthened)
#   --cut a:b              -> words a..b (a whole sentence) removed with their gaps; the boundary that remains is a sentence end
# Leading silence trimmed, --tail after the last word. Writes the edited voice, the Scribe words on the new timeline (removed
# words dropped), and <out_scribe>.pauses.json (every gap with its kind, for QA).
# usage: python3 series/elfahman/tools/pace.py <take.mp3> <scribe_take.json> <script.txt> <out_vo.mp3> <out_scribe.json>
#          [--hook 6] [--straight 104] [--mystery 135:0.8] [--cut 165:179] [--tail 0.4] [--set 75:0.3]
import argparse, json, re, subprocess
import numpy as np

ap = argparse.ArgumentParser()
for a in ('take', 'scribe', 'script', 'out_vo', 'out_scribe'): ap.add_argument(a)
ap.add_argument('--hook', type=int, default=0); ap.add_argument('--straight', default='')
ap.add_argument('--mystery', default=None); ap.add_argument('--cut', default=None); ap.add_argument('--tail', type=float, default=0.4)
ap.add_argument('--sent-min', type=float, default=0.38); ap.add_argument('--sent-max', type=float, default=0.48)
ap.add_argument('--comma-min', type=float, default=0.15); ap.add_argument('--comma-max', type=float, default=0.25)
ap.add_argument('--mid-max', type=float, default=0.15); ap.add_argument('--straight-gap', type=float, default=0.05)
ap.add_argument('--thr', type=float, default=-40.0)
ap.add_argument('--dots-min', type=float, default=None); ap.add_argument('--dots-max', type=float, default=None)  # '…' beat (episode 15); default: mid rule
ap.add_argument('--set', default='', help='b:len,... set the gap after word b to len s (a gap whose kept ends hold a soft breath tail)')
A = ap.parse_args()
SR = 44100
a = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', A.take, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout, np.float32).copy()
dur = len(a) / SR
win, hop = int(0.010 * SR), int(0.0025 * SR)
n = (len(a) - win) // hop
db = np.array([10 * np.log10((a[i * hop:i * hop + win] ** 2).mean() + 1e-12) for i in range(n)])
runs, i = [], 0
while i < n:
    if db[i] < A.thr:
        j = i
        while j < n and db[j] < A.thr: j += 1
        s, e = i * hop / SR, ((j - 1) * hop + win) / SR
        if e - s >= 0.04: runs.append([s, e])
        i = j
    else: i += 1
m = []
for r in runs:
    if m and r[0] - m[-1][1] < 0.06: m[-1][1] = r[1]
    else: m.append(r)
runs = m
W = json.load(open(A.scribe)); W = W['words'] if isinstance(W, dict) else W
W = [w for w in W if w.get('type', 'word') == 'word' and not w['text'].startswith('[')]
script = open(A.script, encoding='utf-8').read().split()
assert len(script) == len(W), (len(script), len(W))
first = runs[0][1] if runs and runs[0][0] < 0.01 else 0.0           # leading silence
last_end = runs[-1][0] if runs and runs[-1][1] >= dur - 0.02 else dur
body = [r for r in runs if r[0] > first + 0.001 and r[1] < last_end - 0.001]
NB = len(W) - 1
mid = [(W[b]['end'] + W[b + 1]['start']) / 2 for b in range(NB)]
strt = {int(x) for x in A.straight.split(',') if x}
myst = (int(A.mystery.split(':')[0]), float(A.mystery.split(':')[1])) if A.mystery else None
cut = tuple(map(int, A.cut.split(':'))) if A.cut else None
SET = {int(x.split(':')[0]): float(x.split(':')[1]) for x in A.set.split(',') if x}
def kind(b):
    w = script[b]
    if b < A.hook - 1: return 'hook'
    if b in strt: return 'straight'
    if myst and b == myst[0]: return 'mystery'
    if re.search(r'[.!?؟]$', w): return 'sentence'
    if re.search(r'[،,:]$', w): return 'comma'
    if A.dots_min is not None and re.search(r'…$', w): return 'dots'
    return 'mid'
# assign runs to boundaries; per boundary the longest run is "the" gap, the others are inner quiet bits (mid rule)
by_b = {}
for r in body:
    c = (r[0] + r[1]) / 2
    b = min(range(NB), key=lambda k: abs(mid[k] - c))
    by_b.setdefault(b, []).append(r)
# the cut: from the start of the gap after word cut[0]-1 to the end of the gap after word cut[1]
edits = []  # (t0, t1, new_len): replace audio [t0, t1) by new_len s of silence (t0..t1 is silent or the removed sentence)
gaps = []
if cut:
    g0 = max(by_b[cut[0] - 1], key=lambda r: r[1] - r[0]); g1 = max(by_b[cut[1]], key=lambda r: r[1] - r[0])
    for b in range(cut[0] - 1, cut[1] + 1): by_b.pop(b, None)
    L = min(max(min(g0[1] - g0[0], g1[1] - g1[0]), A.sent_min), A.sent_max)
    edits.append((g0[0], g1[1], L)); gaps.append({'b': cut[0] - 1, 'kind': 'sentence', 'own': round(g0[1] - g0[0], 3), 'len': round(L, 3), 'cut_sentence': True})
for b, rs in by_b.items():
    main = max(rs, key=lambda r: r[1] - r[0])
    for r in rs:
        own = r[1] - r[0]
        k = kind(b) if r is main else ('hook' if kind(b) == 'hook' else 'mid')
        L = {'hook': min(own, 0.03), 'straight': min(own, A.straight_gap), 'mystery': myst[1] if myst else own,
             'sentence': min(max(own, A.sent_min), A.sent_max), 'comma': min(max(own, A.comma_min), A.comma_max),
             'mid': min(own, A.mid_max), 'dots': min(max(own, A.dots_min or 0), A.dots_max or 9)}[k]
        if r is main and b in SET: L = min(SET[b], own) if SET[b] < own else SET[b]
        edits.append((r[0], r[1], L))
        if r is main: gaps.append({'b': b, 'kind': k, 'own': round(own, 3), 'len': round(L, 3), 't0': r[0]})
edits.sort()
# build the new audio
out, pos, mp = [], int(first * SR), []    # mp: (old_t, new_t) anchor points
newt = 0.0
def emit(x):
    global newt
    out.append(x); newt += len(x) / SR
for t0, t1, L in edits:
    i0, i1 = int(t0 * SR), int(t1 * SR)
    mp.append((pos / SR, newt)); emit(a[pos:i0]); mp.append((t0, newt))
    k = int(L * SR)
    if i1 - i0 >= k:                         # shorten: keep the run's two ends, drop the middle
        h = k // 2; emit(a[i0:i0 + h]); emit(a[i1 - (k - h):i1])
    else:                                    # lengthen: the run, plus digital silence in its middle
        h = (i1 - i0) // 2; emit(a[i0:i0 + h]); emit(np.zeros(k - (i1 - i0), np.float32)); emit(a[i0 + h:i1])
    mp.append((t1, newt)); pos = i1
    for g in gaps:
        if g.get('t0') == t0: g['at'] = round(newt - L, 3)
mp.append((pos / SR, newt)); emit(a[pos:int(last_end * SR)]); mp.append((last_end, newt))
emit(np.zeros(int(A.tail * SR), np.float32))
y = np.concatenate(out)
tmp = A.out_vo + '.f32'; y.astype(np.float32).tofile(tmp)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', tmp, '-c:a', 'libmp3lame', '-b:a', '192k', A.out_vo], check=True)
subprocess.run(['rm', tmp])
ox = np.array([p[0] for p in mp]); nx = np.array([p[1] for p in mp])
def T(t):  # old -> new time (inside an edited gap: clamped onto it)
    return float(np.interp(t, ox, nx))
keep = [k for k in range(len(W)) if not (cut and cut[0] <= k <= cut[1])]
NW = [{**W[k], 'start': round(T(W[k]['start']), 3), 'end': round(T(W[k]['end']), 3)} for k in keep]
json.dump({'words': NW}, open(A.out_scribe, 'w'), ensure_ascii=False)
for g in gaps: g['after'] = script[g['b']]; g.pop('t0', None)
gaps.sort(key=lambda g: g['b'])
L = len(y) / SR
info = {'take': round(dur, 3), 'length': round(L, 3), 'speed': 1.0, 'lead_trimmed': round(first, 3), 'speech_end': round(L - A.tail, 3),
        'end_silence': A.tail, 'gaps': gaps}
json.dump(info, open(A.out_scribe.replace('.json', '.pauses.json'), 'w'), ensure_ascii=False, indent=1)
sent = [g['len'] for g in gaps if g['kind'] == 'sentence']
print(f'take {dur:.2f} s -> {L:.2f} s at 1.0x; {len(edits)} gaps edited; sentence gaps {min(sent):.2f}-{max(sent):.2f} (avg {np.mean(sent):.2f}); '
      f'longest non-mystery {max(g["len"] for g in gaps if g["kind"] != "mystery"):.2f}')
