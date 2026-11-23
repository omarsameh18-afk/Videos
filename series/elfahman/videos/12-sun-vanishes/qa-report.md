# Episode 12 v2 QA: لو الشمس اختفت

- Output: `elfahman-12-sun-vanishes-v2.mp4`. 1080x1920, **60 fps**, H.264 yuv420p + AAC, **65.97 s**. Loudness **−14.1 LUFS**, peak −1.4 dBFS.
- Voice: the v1 recording (16 eleven_v4 sentences, voice XFkxnO6GgzVSxqEN2NVq), re-edited with `scripts/elfahman/assemble_voice_v2.py`:
  1.0x, silence only cut. **0 new credits** (v1 spent 931).
- Pace: 171 words / 65.97 s = **2.59 words/s**.
- Gaps as heard (ffmpeg silencedetect −40 dB): sentence gaps 0.33–0.37 s (avg 0.35), comma / inside-sentence gaps ≤ 0.15 s,
  hook and "استنى ده الغريب جاي!" in one go, mystery pause after "خالص؟" **0.80 s** (longest gap), 0.37 s after the last word, no leading silence.
- Character: الفهمان library (`public/elfahman/lib/`: orange hoodie with the ف badge, round teal glasses, mustache), bottom 40% of the frame,
  centred-left. Every-frame check: orange hoodie share of the bottom 38% is 0.24–0.29 in all 3958 frames (never missing).
  Poses: hook hero (smirk) → shocked on "الدنيا" (sky goes black) → explain → worried (+ sweat on "بعد أسبوع") → shocked (−70) → explain →
  thinking from "طب" through the mystery pause → shocked + punch-in + shake + stinger exactly on "استنى" → explain → point_up (ocean floor) →
  explain (comments) → temple on "الفهمان", wink on "كسبان". Swaps hidden in squash, lip-flap (closed/half/open) + random blinks.
- Captions: 2–3 words, Cairo Black, white + thick black outline, key words #FFD23F, centre y 1055 (above his head; hook cards at y 930),
  widths measured in the real font (`scripts/elfahman/wordwidths.mjs`). Caption 1 "لو الشمس اختفت" from frame 0 → caption 2 "مش هتحس ٨ دقايق!" on "مش".
- Pop scan: every flagged jump is a board cut, the blackout flash/shake, the "استنى" punch-in, or the end fade back to the sun (loop).
- Credits: 0 (this version). Episode total 931.
