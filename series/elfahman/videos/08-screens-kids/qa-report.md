# Episode 08 QA: kids and screens

- Output: `elfahman-08-screens-kids.mp4`. 1080x1920, 60 fps, H.264 + AAC, 59.67 s. Loudness −14.1 LUFS, max peak −1.4 dB.
- Voice: one eleven_v4 take at 1.0x, nothing time-stretched. Silence was only removed, never added: 34 cuts, 5.07 s removed (64.8 s → 59.66 s).
- **Longest pause in the body: 0.232 s** (after "الذاكرة،", `capgaps.py`). ffmpeg silencedetect at −40 dB measures 0.21 s. Both are under the 0.25 s cap.
- Mystery pause after "والمفاجأة؟": 0.37 s, the take's own length. It is under the 0.6 s cap and was not lengthened.
- Leading silence: 0.005 s (the voice starts on frame 1). Silence after the last word: 0.40 s.
- Hook: one breath at natural speed. The full two-line hook card is on screen from frame 0. The kid's brain pulses and sparks from frame 0 (frame 1→2 diff 4.99). Line 1 ends at 3.10 s (it was not sped up, per the no-speed-up rule).
- Board: 116 beats, longest gap 1.58 s.
- Captions: match the script word for word, 73 cards. The hook card is the biggest text (65 px; the other cards are 61–63 px).
- Pop scan: every flagged jump is an intended beat (board pushes, the reveal flash, pose swaps, the ending squash).
