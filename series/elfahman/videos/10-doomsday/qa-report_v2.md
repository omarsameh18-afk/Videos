# Episode 10 v2 QA: relaxed pacing (same voice take, same visuals)

- Output: `elfahman-10-doomsday_v2.mp4`. 1080x1920, 60 fps, H.264 + AAC, **71.95 s**. Loudness **−14.1 LUFS**, max true peak −1.3 dB.
- Voice: the SAME v1 take (`take1.mp3`, generation eZPfZeOTIiQYAYkrCZPb), re-edited with `tools/pace.py` at 1.0x. Nothing is
  time-stretched; only silence was cut, or digital silence added (the take's floor is below −80 dB). **0 new credits.**
- Cut: "وأغلب العلما شايفين إنه كان بيهزّر بالتاريخ، بس كان عايز يقرص ودن الناس من الزحمة." (15 words) with its board (laughing,
  winking hat, ear pinch). "تمانية مليار بس." now goes straight into "بس بصراحة، لما تركب المترو..." with one sentence gap.
- **Body pace: 2.62 words/s** (182 words from "ومش" to "كسبان", 69.5 s; target 2.5–2.8).
- Gaps, measured with ffmpeg silencedetect at −40 dB (a click under 70 ms inside a gap counts as part of it):
  - **Sentence gaps (. ! ?)**: 18, **0.38–0.48 s, average 0.44 s**.
  - Comma / colon gaps: 22, 0.17–0.24 s, average 0.21 s.
  - Inside a phrase: max 0.15 s.
  - Hook "العالم كان هيخلص الأسبوع اللي فات!": no gap inside; it ends at 1.55 s.
  - "استنى ده الغريب جاي!": 0.04 s after "استنى" (said straight through), then a 0.42 s breath after "جاي!".
  - **Mystery pause** after "طب ليه الدنيا مخلصتش؟ تفتكر؟": **0.79 s**.
  - **Longest gap outside the mystery pause: 0.48 s.** Nothing is over 0.6 s.
  - At −30 dB, which also counts breath tails as silence: sentence gaps 0.47–0.55 s, commas 0.21–0.33 s, mystery 0.85 s, nothing else over 0.6 s.
- Leading silence: 0 s (the voice is on frame 1). Silence after the last word: 0.40 s.
- Hook captions are exactly as in v1. Caption 1 "العالم كان هيخلص" (165 px, هيخلص red) is on screen from frame 0. Caption 2
  "الأسبوع اللي فات!" (118 px, فات yellow) replaces it on the onset of "الأسبوع" (0.92 s). The hook board moves from frame 0 (frame 1→2 diff 11.0).
- Captions match `script_v2.txt` word for word: 78 cards, at most 3 words each after the hook. The hook cards are the biggest text.
- Visuals: every board, caption, pose, gesture, camera move and sound cue is re-timed to the new words. Boards change on sentences
  or key words, and each is held at least 1.7 s. The pins are "استنى" 39.32 s, "الفهمان" 70.45 s and "كسبان" 71.18 s. The music bed
  was re-synthesized for the new timeline (`music_v2/`).
- Loop: the last frame is the hook board again with the gold caption and the wink (first-vs-last frame diff 18.3, as in v1).
