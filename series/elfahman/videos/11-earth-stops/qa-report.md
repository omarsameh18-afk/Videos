# Episode 11 QA: لو الأرض وقفت ثانية

- Output: `elfahman-11-earth-stops.mp4`. 1080x1920, 60 fps, H.264 + AAC, **65.08 s**. Loudness **−14.1 LUFS** (scripts/loudnorm.sh), sample peak −1.0 dBFS.
- Voice: ONE eleven_v4 take (voice XFkxnO6GgzVSxqEN2NVq, generation a1tg7VuqJs2D3IydN1gd, 68.2 s raw). Tashkeel on بتلِفّ (both) and بتبطّأ.
  eleven_v4 on the ElevenLabs connector has **no speed setting** (only stability / similarity), so the 0.95 speed was asked for with an
  inline `[relaxed, unhurried storytelling]` tag after the hook. Nothing was time-stretched or sped up: the take was re-edited at 1.0x
  with `tools/pace.py` (silence cut, or digital silence added), 68.2 s -> 65.1 s.
- **Body pace: 2.52 words/s** (157 words from "الأرض" after the hook to "كسبان", 2.49–64.68 s; target 2.5–2.8). Whole video incl. hook: 2.54.
- Gaps (ffmpeg silencedetect −40 dB, blips under 70 ms merged; `tools/pacecheck.py`):
  - **Sentence gaps (. ! ?)**: 16, **0.38–0.40 s, average 0.39 s**.
  - **Comma / colon gaps**: 11, **0.18 s** each (0.18–0.18).
  - Inside a phrase: max 0.12 s.
  - **Hook** "إيه اللي هيحصل لو الأرض وقفت ثانية؟": no gap inside, said in one go; voice starts at frame 0 (0.025 s encoder lead),
    **hook ends at 2.05–2.11 s** (≤ 2.5 s).
  - "استنى ده الغريب جاي!": straight through, then a **0.40 s** breath.
  - **Mystery pause** after "طب تفتكر الأرض ممكن توقف فعلاً؟": **0.79 s** (44.03–44.83 s). Not spoken; a pulsing "؟" holds the board.
  - **Longest silence outside the mystery pause: 0.40 s.** Nothing over 0.6 s.
  - No leading silence; **0.40 s** after the last word.
- Captions: caption 1 "الأرض وقفت!" (153 px, fills ~90% of the width) from frame 0; caption 2 "ثانية واحدة بس؟" (140 px, two lines) on
  "ثانية" (1.79 s). Every other card ≤ 3 words, 91–122 px, word for word from the script (`scripts/captioncheck.py`: match; hook cards
  are the biggest text). Call-to-action cards 117–118 px.
- Boards (16, each pushes the last out; the board is never empty): hook 2.6 s, spin 3.5, speedometer 6.7, plane 2.2, everything rides
  along 5.7, stop 6.0, thrown east 4.5, wind 4.0, wave 4.8, one second 2.1, question 2.7, "لأ" 6.0, slowing Earth 6.0, dinosaur 3.4,
  comment 3.3. Boards change on sentences or key words; inside a board, items pop on their word.
- Visual beats: speedometer 1670 -> 1450 km/h on "مصر" (pin on Egypt); plane 900 vs Earth 1450; STOP + brake on "هتقف"; people, cars and
  the sea thrown east; wind lines and bending trees; the wave hits the city on "هتضرب" (crash + shake) and floods it; 1-second stopwatch
  on "ثانية واحدة"; "؟" through the mystery pause; huge red "لأ"; "استنى" = shocked + punch-in + shake + stinger + record scratch (49.25 s);
  the payoff board (sunset gradient, rainbow trails, sparkles, snail, clock gaining a yellow sliver, "+ جزء من ثانية / كل ١٠٠ سنة") is
  the most colourful board in the video; dinosaur with "-½ ساعة"; comment bubble "طب لو...؟" + arrows down.
- Ending: temple on "الفهمان" (63.63 s), wink on "كسبان" (64.30 s); the last board is the hook's spinning Earth reaching its frame-0
  angle, so the last frame loops into the first (first-vs-last frame diff 13.0).
- Pop scan: every flagged jump is a board push, pose-swap squash, punch-in or shake.
- Credits: voice 941 + 3 pictures × 337 + Scribe 0 = **1,952** (see `images/elfahman/credits.md`).
