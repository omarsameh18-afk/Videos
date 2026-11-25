# words.json (+sent index) and skipper.timing.json (sentence bounds from the measured gaps) for episode 14
import json, subprocess
E = 'series/elfahman/videos/14-oldest-skipper'; V = 'src/elfahman/videos'
lines = open(f'{E}/script.txt').read().strip().split('\n')
W = json.load(open(f'{V}/skipper.words.json'))
P = json.load(open(f'{E}/pacecheck.json'))
gap = {g['b']: (g['start'], g['start'] + g['measured']) for g in P if g['kind'] in ('sentence', 'mystery')}
k, sents = 0, []
for si, l in enumerate(lines):
    n = len(l.split())
    for w in W[k:k + n]: w['sent'] = si + 1
    sents.append({'s': W[k]['s'], 'e': W[k + n - 1]['e'], 'last': k + n - 1}); k += n
assert k == len(W)
for si in range(len(sents) - 1):
    b = sents[si]['last']
    if b in gap: sents[si]['e'] = round(gap[b][0], 3); sents[si + 1]['s'] = round(gap[b][1], 3)
sents[0]['s'] = 0
for s in sents: s.pop('last')
dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', 'public/elfahman/skipper/vo/vo.mp3']))
json.dump(W, open(f'{V}/skipper.words.json', 'w'), ensure_ascii=False, indent=0)
json.dump({'duration': round(dur, 3), 'sentences': sents}, open(f'{V}/skipper.timing.json', 'w'))
body_w = len(W) - len(lines[0].split())
print(f'duration {dur:.2f}; hook 0-{sents[0]["e"]:.2f} s, gap after hook {sents[1]["s"] - sents[0]["e"]:.2f}; body {body_w} words / {sents[-1]["e"] - sents[1]["s"]:.2f} s = {body_w / (sents[-1]["e"] - sents[1]["s"]):.2f} w/s')
for i, s in enumerate(sents): print(i, s)
