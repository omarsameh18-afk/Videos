# Independent pacing check for episode 16: every silence (-40 dB, >= 40 ms, blips < 70 ms merged) longer than 0.12 s in vo.mp3,
# matched IN ORDER to the script's punctuation boundaries (. ! ? -> sentence, ، : -> comma, … -> dots). Prints each gap.
import re, subprocess, sys, json
vo, script = sys.argv[1:3]
o = subprocess.run(['ffmpeg', '-v', 'info', '-i', vo, '-af', 'silencedetect=n=-40dB:d=0.04', '-f', 'null', '-'], capture_output=True, text=True).stderr
ss = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', o)]; ee = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', o)]
m = []
for r in zip(ss, ee):
    r = list(r)
    if m and r[0] - m[-1][1] < 0.07: m[-1][1] = r[1]
    else: m.append(r)
words = open(script, encoding='utf-8').read().split()
bnd = [(i, w) for i, w in enumerate(words[:-1]) if re.search(r'[.!?؟،,:…]$', w)]
dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', vo]))
body = [r for r in m if r[0] > 0.05 and r[1] < dur - 0.05 and r[1] - r[0] > 0.12]
print(f'{len(body)} silences > 0.12 s, {len(bnd)} punctuation boundaries')
out = []
for (i, w), r in zip(bnd, body):
    k = 'sentence' if re.search(r'[.!?؟]$', w) else 'dots' if w.endswith('…') else 'comma'
    out.append({'b': i, 'after': w, 'kind': k, 'start': round(r[0], 3), 'end': round(r[1], 3), 'len': round(r[1] - r[0], 3)})
    print(f'{i:4d} {k:8s} {r[0]:7.2f} {r[1] - r[0]:.3f}  {w}')
other = [r for r in m if r[0] > 0.05 and r[1] < dur - 0.05 and r[1] - r[0] <= 0.12]
print('longest in-phrase silence', round(max((r[1] - r[0] for r in other), default=0), 3))
lead = m[0][1] if m and m[0][0] < 0.01 else 0.0
tail = dur - m[-1][0] if m and m[-1][1] >= dur - 0.02 else 0.0
print(f'lead {lead:.3f} tail {tail:.3f} duration {dur:.3f}')
if len(sys.argv) > 3: json.dump({'gaps': out, 'lead': lead, 'tail': tail, 'duration': dur}, open(sys.argv[3], 'w'), ensure_ascii=False, indent=1)
