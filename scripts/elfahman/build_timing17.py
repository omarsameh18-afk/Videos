# words.json (+sent index) and blackout.timing.json (sentence bounds from the measured silences of vo.mp3) for episode 17
import json, re, subprocess
E = 'series/elfahman/videos/17-blackout-week'; V = 'src/elfahman/videos'; VO = 'public/elfahman/blackout/vo/vo.mp3'
lines = open(f'{E}/script_v2.txt').read().strip().split('\n')
W = json.load(open(f'{V}/blackout.words.json'))
o = subprocess.run(['ffmpeg', '-i', VO, '-af', 'silencedetect=n=-40dB:d=0.04', '-f', 'null', '-'], capture_output=True, text=True).stderr
runs = list(zip([float(x) for x in re.findall(r'silence_start: ([\d.]+)', o)], [float(x) for x in re.findall(r'silence_end: ([\d.]+)', o)]))
k, sents = 0, []
m = []
for r in runs:  # two quiet runs split by a blip under 70 ms count as one gap (as pacecheck.py)
    if m and r[0] - m[-1][1] < 0.07: m[-1] = (m[-1][0], r[1])
    else: m.append(r)
runs = m
for si, l in enumerate(lines):
    n = len(l.split())
    for w in W[k:k + n]: w['sent'] = si
    sents.append({'s': W[k]['s'], 'e': W[k + n - 1]['e'], 'last': k + n - 1}); k += n
assert k == len(W)
for si in range(len(sents) - 1):
    b = sents[si]['last']; m = (W[b]['e'] + W[b + 1]['s']) / 2
    r = max((r for r in runs if r[0] - 0.35 <= m <= r[1] + 0.35), key=lambda r: r[1] - r[0])
    sents[si]['e'] = round(r[0], 3); sents[si + 1]['s'] = round(r[1], 3)
    W[b]['e'] = min(W[b]['e'], round(r[0], 3)); W[b + 1]['s'] = round(r[1], 3)
sents[0]['s'] = 0
for s in sents: s.pop('last')
dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', VO]))
json.dump(W, open(f'{V}/blackout.words.json', 'w'), ensure_ascii=False, indent=0)
json.dump({'duration': round(dur, 3), 'sentences': sents}, open(f'{V}/blackout.timing.json', 'w'))
body_w = len(W) - len(lines[0].split())
print(f'duration {dur:.2f}; hook 0-{sents[0]["e"]:.2f}, gap after hook {sents[1]["s"] - sents[0]["e"]:.2f}; body {body_w} words / {sents[-1]["e"] - sents[1]["s"]:.2f} s = {body_w / (sents[-1]["e"] - sents[1]["s"]):.2f} w/s')
for i, s in enumerate(sents): print(i, s, round(sents[i + 1]['s'] - s['e'], 2) if i + 1 < len(sents) else '')
