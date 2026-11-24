# Episode 13 QA: لو قفلت النت من موبايلك أسبوعين

- Output: `elfahman-13-phone-internet-off.mp4`. 1080x1920, **60 fps**, H.264 **yuv420p** + AAC, **65.93 s**. Loudness **−14.1 LUFS**, true peak −1.4 dBFS.
- Voice: ONE eleven_v4 take (voice XFkxnO6GgzVSxqEN2NVq), 71.0 s raw, re-edited at 1.0x by `tools/pace.py` (silence cut or added, nothing stretched).
  The connector has no speed setting, so 0.95 could not be set. The inline "relaxed" tag would have pushed the take over 1,000 credits, so it was left out.
- Pace: body (line 2 → end) 170 words / 62.06 s = **2.74 words/s**.
- Gaps as heard (ffmpeg silencedetect −40 dB, `pacecheck.json`): sentence gaps 0.35–0.41 s (**avg 0.38**), comma gaps 0.15–0.18 s (avg 0.17),
  in-phrase gaps ≤ 0.07 s, hook in one go (ends 3.06 s), "استنى ده الغريب جاي!" straight through, **mystery pause 0.79 s** after "حصله إيه؟",
  **longest gap outside the mystery pause 0.41 s**, no leading silence, 0.40 s after the last word.
- Character: الفهمان library (`public/elfahman/lib/`) in the bottom 40% in every frame. The 1 s contact sheet (66 frames) shows the orange hoodie,
  ف badge and round teal glasses in all of them. Poses: hero smirk → explain → worried + sweat on "بيرن" → explain → point_up on "عشرات" →
  hero at the ahwa → point_up on "ساعتين" → thumbs_up on "اتمشت" / "أحسن" → thinking from "طب" through the pause → shocked + punch-in + shake +
  scratch/stinger on "استنى" → point_up (payoff) → worried on "مقدروش" → point_up on "واحد" → explain → temple on "الفهمان", wink on "كسبان".
- Frame 0: caption 1 "لو قفلت نت موبايلك" is on screen, and the phone bobs and Wi-Fi rings move by frame 1 (frame 1→2 diff 5.2). Caption 2 "أسبوعين… مخك هيحصله إيه؟" starts on "أسبوعين".
- Loop: the last frame is the hook board (same phone, timeline, camera at rest), and the pose swap into frame 0 is hidden in a squash (`loop-last-first.png`).
  The remaining first-vs-last difference (14.0) is the pose and the gold caption, the same as earlier episodes.
- Pop scan: each flagged jump is a board cut, the X pop, the screen on/off loop (board 3), the clock chip, the stamp, the "استنى" punch-in/shake, or the calendar flips.
- Credits: 989 (voice). 0 for pictures, Scribe, music and SFX.
