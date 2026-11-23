# timing_v2.json + vo.wav -> src/elfahman/videos/sun.words.json (per-word s/e, display spelling), sun.env.json (60 fps lip level),
# sun.timing.json (sentence starts/ends). Word times: each sentence is split at its comma pauses into phrases; inside a phrase
# the words share the voiced time by letter count (no Scribe run needed, 0 credits).
import json, re, subprocess, numpy as np
D = '/home/user/Videos'
T = json.load(open(f'{D}/voice/elfahman-12/timing_v2.json'))
DISPLAY = [l.strip() for l in open(f'{D}/series/elfahman/videos/12-sun-vanishes/script.txt', encoding='utf8') if l.strip()]
words = []
for k, s in enumerate(T['sentences']):
    ws = DISPLAY[k].split()
    phr, cur = [], []
    for w in ws:
        cur.append(w)
        if re.search(r'[،…؟]$', w) and w is not ws[-1]: phr.append(cur); cur = []
    if cur: phr.append(cur)
    cps = [p for p in s['pauses'] if p['comma']]
    cps.sort(key=lambda p: p['at'])
    if len(cps) != len(phr) - 1: raise SystemExit(f'sentence {k+1}: {len(phr)} phrases vs {len(cps)} comma pauses')
    b = [s['start']] + [x for p in cps for x in (p['at'], p['at'] + p['dur'])] + [s['end']]
    for pi, ph in enumerate(phr):
        a, e = b[2 * pi], b[2 * pi + 1]
        L = [len(re.sub(r'[^\w]', '', w)) + 1 for w in ph]; tot = sum(L); t = a
        for w, l in zip(ph, L):
            d = (e - a) * l / tot
            words.append({'w': w, 's': round(t, 3), 'e': round(t + d, 3), 'sent': k + 1}); t += d
json.dump(words, open(f'{D}/src/elfahman/videos/sun.words.json', 'w'), ensure_ascii=False, indent=0)
json.dump({'duration': T['duration'], 'sentences': [{'s': x['start'], 'e': x['end']} for x in T['sentences']]},
          open(f'{D}/src/elfahman/videos/sun.timing.json', 'w'))
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f'{D}/public/elfahman/sun/vo/vo.wav', '-ac', '1', '-ar', '48000', '-f', 's16le', '-'], capture_output=True).stdout
a = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
hop = 800
rms = np.array([np.sqrt((a[i:i + hop] ** 2).mean()) for i in range(0, len(a) - hop, hop)])
lvl = np.clip((20 * np.log10(rms + 1e-6) + 45) / 30, 0, 1)
json.dump({'fps': 60, 'level': [round(float(x), 3) for x in lvl]}, open(f'{D}/src/elfahman/videos/sun.env.json', 'w'))
print(len(words), 'words', T['duration'], 's')
