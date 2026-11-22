# Episode 10 QA: the world was going to end last week (the 1960 doomsday paper)

- Output: `elfahman-10-doomsday.mp4`. 1080x1920, 60 fps, H.264 + AAC, 68.85 s. Loudness −14.1 LUFS, max true peak −1.4 dB.
- Voice: one eleven_v4 take (voice XFkxnO6GgzVSxqEN2NVq) at 1.0x, nothing time-stretched. Silence was only removed, never added:
  `capgaps.py` (−40 dB, 45 cuts, 7.10 s) + `trimgaps.py` (−30 dB breath tails, 34 small cuts, 2.49 s): 78.6 s → 68.85 s.
- **Longest pause in the body: 0.21 s** at −40 dB (ffmpeg silencedetect on the voice track), **0.24 s** at −30 dB. All are within the 0.25 s cap.
- [MYSTERY PAUSE] after "طب ليه الدنيا مخلصتش؟ تفتكر؟": 0.44 s at −40 dB (0.46 s at −30 dB). That is the take's own length:
  under the 0.6 s cap and not lengthened. It is the only pause over 0.25 s.
- Leading silence: 0.007 s (the voice starts on frame 1). Silence after the last word: 0.40 s.
- Hook captions: caption 1 "العالم كان هيخلص" (3 words, هيخلص red, 165 px, centred, two lines) is on screen from frame 0.
  Caption 2 "الأسبوع اللي فات!" (فات yellow, 118 px) replaces it at 0.93 s, the onset of "الأسبوع". The hook is said in one go,
  with no pause between the two captions. It ends at 1.57 s, where silencedetect places the start of the first silence.
  (`hookcheck.py` reports 7.03 s because the pause after "فات!" is now 0.19 s, under its 0.2 s detection threshold.)
- The hook board moves from frame 0: the Earth cracks and shakes, the red warning flashes, and the calendar pages flip and land on
  ١٣ نوفمبر (frame 1→2 diff 11.0).
- Captions match the script word for word: 84 cards, at most 3 words each after the hook. Both hook cards are bigger than every
  other card (others 77–112 px; the call-to-action cards are 112, 112 and 96 px).
- Board: 107 beats, longest gap 1.95 s.
- Pop scan: every flagged jump is an intended beat (board pushes, caption swaps, pose-swap squashes, the punch-in on "استنى", the answer flash, the ending squash).
- Loop: the last frame shows the hook board again (cracking Earth, warning, calendar flipping), with the gold "الفهمان كسبان"
  caption held and the wink. The first-vs-last frame diff is 18.6. As in earlier episodes, the pose and caption differ, and the cut sits inside the ending squash.
- Credits: 1,117 for the voice (estimate 1,116.89), 0 for Scribe, 0 for pictures (all drawn in code). Series total: 13,569.
