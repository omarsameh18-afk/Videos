# Caption check: rebuilds the caption groups (sizes file) from the timed words and compares them with the script, word for word.
# Rules: max 3 words per card; the hook line (captions.json "hook": N words) is the only card allowed more, and must be card 1.
# With measured widths ("w100", from scripts/captionsizes.mjs) it also prints each card's real font size (same maths as
# Captions.tsx) and fails if a call-to-action card ("cta": [card numbers]) is smaller than a normal card (96 px).
# usage: python3 scripts/captioncheck.py <script.txt> <words.json> <captions.json>
import json, re, sys
script_path, words_path, caps_path = sys.argv[1:4]
script = open(script_path, encoding='utf-8').read().split()
words = [w['w'] for w in json.load(open(words_path, encoding='utf-8'))]
caps = json.load(open(caps_path, encoding='utf-8'))
sizes, hook, cards, w100, cta = caps['sizes'], caps.get('hook', 0), caps.get('cards', {}), caps.get('w100'), caps.get('cta', [])
base = {'normal': 96, 'big': 132, 'gold': 116, **caps.get('base', {})}   # an episode may set its own base sizes ("base")
allow = caps.get('allow', [])   # cards the brief asks for with more than 3 words (e.g. a quoted comment kept whole)
clean = lambda w: re.sub(r'[.،,:]$', '', re.sub(r'\.\.\.|…', '', w))   # same as Captions.tsx clean()
norm = lambda w: re.sub(r'[.…!،,:؟?]', '', re.sub(r'[ً-ْـ]', '', w))
def font(k, g):   # Captions.tsx: base size by style, shrunk to the card's width
    c = cards.get(str(k), {})
    style = c.get('style') or ('big' if len(g) == 1 and norm(g[0]) == 'استنى' else 'gold' if all(norm(w) in ('الفهمان', 'كسبان') for w in g) else None)
    fs = c.get('fs') or base.get(style, base['normal'])
    x = c.get('x', 460); max_w = c.get('maxW', 2 * min(x - 70, 900 - x))
    est = (w100[k] / 100 + 0.2) * fs
    return fs * min(1, max_w / est)
ok = words == script and sum(sizes) == len(words)
i = 0; fss = []
for k, n in enumerate(sizes):
    g = words[i:i + n]; i += n
    is_hook = k == 0 and hook and n == hook
    if k == 0 and caps.get('hook_cards', 1) == 2 and n > 4: flag_h = True; ok = False; print('   <-- hook caption 1 has more than 4 words')
    flag = '' if 1 <= n <= 3 or is_hook else '   (allowed exception: more than 3 words)' if k in allow else '   <-- more than 3 words'
    if flag and k not in allow: ok = False
    br = cards.get(str(k), {}).get('br')
    cuts = [0] + ([] if br is None else br if isinstance(br, list) else [br]) + [n]
    text = '  /  '.join(' '.join(clean(w) for w in g[a:b]) for a, b in zip(cuts, cuts[1:]))
    size = ''
    if w100:
        fs = font(k, g); fss.append(fs); size = f'{fs:5.0f} px  '
        if k in cta and fs < base['normal'] - 0.5: flag += '   <-- call-to-action card smaller than a normal card'; ok = False
    print(f'{n}  {size}{text}{"   (hook: one card, two lines)" if is_hook else ""}{flag}')
print(f'\nscript words {len(script)}, timed words {len(words)}, caption words {sum(sizes)}, captions {len(sizes)}')
if w100:
    hc = caps.get('hook_cards', 1) if hook else 0   # from episode 09: the hook is 2 cards (caption 1 <= 4 words from frame 0, then caption 2)
    rest = [f for k, f in enumerate(fss) if k >= hc]
    if hc == 2: print(f'hook caption 2: {fss[1]:.0f} px')
    print(f'font sizes: hook card {fss[0]:.0f} px, other cards {min(rest):.0f}-{max(rest):.0f} px, call-to-action cards {", ".join(f"{fss[k]:.0f}" for k in cta)} px')
    if caps.get('hook_biggest'):
        big = min(fss[:max(hc, 1)]) > max(rest); print('hook card is the biggest text' if big else 'HOOK CARD IS NOT THE BIGGEST TEXT'); ok = ok and big
print('CAPTIONS MATCH THE SCRIPT WORD FOR WORD' if ok else 'MISMATCH')
sys.exit(0 if ok else 1)
