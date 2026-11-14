# Caption check: rebuilds the caption groups (sizes file) from the timed words and compares them with the script, word for word.
# usage: python3 scripts/captioncheck.py <script.txt> <words.json> <captions.json>
import json, re, sys
script_path, words_path, caps_path = sys.argv[1:4]
script = open(script_path, encoding='utf-8').read().split()
words = [w['w'] for w in json.load(open(words_path, encoding='utf-8'))]
sizes = json.load(open(caps_path, encoding='utf-8'))['sizes']
clean = lambda w: re.sub(r'[.،,:]$', '', re.sub(r'\.\.\.|…', '', w))   # same as Captions.tsx clean()
ok = words == script and sum(sizes) == len(words)
i = 0
for n in sizes:
    g = words[i:i + n]; i += n
    flag = '' if 1 <= n <= 3 else '   <-- more than 3 words'
    if n > 3: ok = False
    print(f'{n}  {" ".join(clean(w) for w in g)}{flag}')
print(f'\nscript words {len(script)}, timed words {len(words)}, caption words {sum(sizes)}, captions {len(sizes)}')
print('CAPTIONS MATCH THE SCRIPT WORD FOR WORD' if ok else 'MISMATCH')
sys.exit(0 if ok else 1)
