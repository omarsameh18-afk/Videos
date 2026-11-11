# align.py audio16k.wav out.json : forced alignment of the known script with PocketSphinx (offline model)
import sys, json, re, wave
from pocketsphinx import Decoder
TEXT = ("so this woodpecker keeps banging its face into a tree why doesn't its brain get hurt you'd think its skull's "
        "a shock absorber right nope the whole head stops as one stiff piece like a hammer a cushion would just make "
        "its pecks weaker the trick is size a tiny brain feels way less pressure from the same hit")
d = Decoder(samprate=16000, bestpath=False)
d.add_word("skull's", 'S K AH L Z', True)
d.add_word('pecks', 'P EH K S', True)
d.set_align_text(TEXT)
audio = wave.open(sys.argv[1], 'rb').readframes(10 ** 9)
d.start_utt(); d.process_raw(audio, full_utt=True); d.end_utt()
words = [{'w': s.word, 's': round(s.start_frame / 100, 2), 'e': round((s.end_frame + 1) / 100, 2)}
         for s in d.seg() if s.word not in ('<s>', '</s>', '<sil>', '(NULL)')]
json.dump(words, open(sys.argv[2], 'w'), indent=0)
print(' '.join(f"{w['w']}@{w['s']}" for w in words))
