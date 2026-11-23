# timing.json + vo.wav -> src/elfahman/sunData.json (captions, sentence times, per-frame mouth amplitude)
import json, re, sys, numpy as np
sys.path.insert(0, '/home/user/Videos/scripts/elfahman')
from analyze_voice import load, SR
D = '/home/user/Videos/voice/elfahman-12'; FPS = 30
T = json.load(open(f'{D}/timing.json'))
DISPLAY = [
 'لو الشمس اختفت دلوقتي، مش هتحس بحاجة لمدة ٨ دقايق!',
 'وبعدها فجأة، الدنيا كلها هتضلم… والقمر كمان هيختفي من السما.',
 'عشان نور الشمس بياخد حوالي ٨ دقايق لحد ما يوصلنا، والقمر أصلاً بينوّر من نورها.',
 'وفي نفس اللحظة، الأرض هتبطّل تلف حوالين الشمس، وهتطلع ماشية في خط مستقيم في الفضا.',
 'بعد كام يوم، الزرع الصغير هيبدأ يموت، عشان مفيش نور يعمل بيه أكله.',
 'بعد أسبوع، الدنيا كلها هتبقى تحت الصفر، أبرد من أي شتا عشته في حياتك.',
 'بعد كام شهر، البحار هتبدأ تتجمد من فوق.',
 'بعد سنة، الحرارة هتوصل لسالب سبعين، والنيل نفسه هيبقى تلج.',
 'والشجر الكبير؟ هيفضل عايش عشرات السنين، عشان شايل أكل جواه زي المخزن.',
 'طب يعني كده الحياة خلصت خالص؟',
 'استنى ده الغريب جاي!',
 'تحت التلج، مية البحر هتفضل سايلة آلاف السنين، عشان التلج نفسه هيدفّيها زي البطانية.',
 'وفي قاع المحيط، فيه كائنات عايشة جنب براكين تحت المية، عمرها ما شافت الشمس أصلاً.',
 'يعني لو الشمس اختفت… ممكن متاخدش بالها خالص!',
 'لو الشمس اختفت بكرة، أول حاجة هتعملها في الـ٨ دقايق دول إيه؟ اكتبهالي في الكومنتات.',
 'الفهمان كسبان.',
]
def chunk_words(words, maxw=4):
    n = len(words); k = -(-n // maxw)
    sizes = [n // k + (1 if i < n % k else 0) for i in range(k)]
    out, i = [], 0
    for s in sizes: out.append(words[i:i+s]); i += s
    return out
caps = []
for si, s in enumerate(T['sentences']):
    text = DISPLAY[si]
    phrases = [p.strip() for p in re.split(r'(?<=[،…؟])\s+', text) if p.strip()]
    # pick the (len(phrases)-1) longest pauses (by original length), keep time order
    ps = sorted(sorted(s['pauses'], key=lambda p: -p['orig'])[:len(phrases)-1], key=lambda p: p['sil_start'])
    bounds = [s['start']] + [x for p in ps for x in (p['sil_start'], p['sil_start'] + p['sil_dur'])] + [s['end']]
    for pi, ph in enumerate(phrases):
        a, b = bounds[2*pi], bounds[2*pi+1]
        chunks = chunk_words(ph.split())
        tot = sum(len(' '.join(c)) for c in chunks); t = a
        for c in chunks:
            d = (b - a) * len(' '.join(c)) / tot
            caps.append(dict(text=' '.join(c), start=round(t, 3), end=round(t + d, 3), s=si+1)); t += d
# hook override (caption 1 from frame 0, caption 2 as specified)
h = T['sentences'][0]; hp = sorted(h['pauses'], key=lambda p: -p['orig'])[0]
caps = [c for c in caps if c['s'] != 1]
caps = [dict(text='لو الشمس اختفت', start=0, end=hp['sil_start'] + hp['sil_dur'], s=1),
        dict(text='مش هتحس ٨ دقايق!', start=hp['sil_start'] + hp['sil_dur'], end=h['end'], s=1)] + caps
# captions hold until the next one starts (no blank flashes inside a sentence gap < 0.9s)
caps.sort(key=lambda c: c['start'])
for k in range(len(caps) - 1):
    if caps[k+1]['start'] - caps[k]['end'] < 0.9: caps[k]['end'] = caps[k+1]['start']
x = load(f'{D}/vo.wav'); n = SR // FPS
frames = int(np.ceil(T['duration'] * FPS))
amp = []
for f in range(frames):
    seg = x[f*n:(f+1)*n]; amp.append(float(np.sqrt(np.mean(seg**2))) if len(seg) else 0.0)
m = max(amp); amp = [round(min(1, a / (m * 0.6)), 3) for a in amp]
data = dict(fps=FPS, duration=T['duration'], frames=frames,
            sentences=[dict(i=s['i'], start=s['start'], end=s['end'], text=DISPLAY[k]) for k, s in enumerate(T['sentences'])],
            captions=caps, amp=amp)
json.dump(data, open('/home/user/Videos/src/elfahman/sunData.json', 'w'), ensure_ascii=False)
for c in caps: print(f"{c['start']:6.2f}-{c['end']:6.2f} s{c['s']:02d} {c['text']}")
