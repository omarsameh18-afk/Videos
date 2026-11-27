# Snap every punctuation boundary of the cleaned Scribe words onto the measured silence of the raw take (episode 16; Scribe
# word ends drift up to ~0.3 s late). For boundary b the silence run (-40 dB, >= 40 ms) whose centre is nearest to the
# Scribe mid-point minus a running lateness estimate is taken; word b ends at its start, word b+1 starts at its end.
import json, re, subprocess, sys
take, scribe, script, out = sys.argv[1:5]
o = subprocess.run(['ffmpeg', '-v', 'info', '-i', take, '-af', 'silencedetect=n=-40dB:d=0.04', '-f', 'null', '-'], capture_output=True, text=True).stderr
ss = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', o)]; ee = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', o)]
runs = [r for r in zip(ss, ee)]
W = json.load(open(scribe))['words']; S = open(script, encoding='utf-8').read().split()
assert len(W) == len(S)
late = 0.1
used = set()
for b in range(len(W) - 1):
    if not re.search(r'[.!?؟،,:…]$', S[b]): continue
    m = (W[b]['end'] + W[b + 1]['start']) / 2 - late
    cand = [(abs((r[0] + r[1]) / 2 - m), k) for k, r in enumerate(runs) if k not in used]
    d, k = min(cand)
    if d > 0.4: print('no run for', b, S[b]); continue
    used.add(k); r = runs[k]
    late = 0.5 * late + 0.5 * ((W[b]['end'] + W[b + 1]['start']) / 2 - (r[0] + r[1]) / 2)
    W[b]['end'] = round(min(W[b]['end'], r[0]), 3); W[b + 1]['start'] = round(r[1] - 0.01, 3)
    if W[b]['start'] >= W[b]['end']: W[b]['start'] = round(W[b]['end'] - 0.15, 3)
    print(f'{b:4d} {S[b]:10s} run {r[0]:.2f}-{r[1]:.2f} ({r[1]-r[0]:.2f})  late {late:.2f}')
json.dump({'words': W}, open(out, 'w'), ensure_ascii=False)
