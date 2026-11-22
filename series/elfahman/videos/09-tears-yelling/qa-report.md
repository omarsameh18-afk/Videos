# Episode 09 QA: why you cry when someone yells

- Output: `elfahman-09-tears-yelling.mp4`. 1080x1920, 60 fps, H.264 + AAC, 64.33 s. Loudness −14.1 LUFS, max true peak −1.4 dB.
- Voice: one eleven_v4 take (voice XFkxnO6GgzVSxqEN2NVq) at 1.0x, nothing time-stretched. Silence was only removed, never added: 44 cuts, 8.44 s removed (72.9 s → 64.34 s).
- **Longest pause in the body: 0.22 s** (after "ضعيف،", `capgaps.py`). ffmpeg silencedetect on the voice track measures 0.21 s at −40 dB and 0.25 s at −30 dB. All are within the 0.25 s cap.
  Quiet runs split by a click are counted as one pause (`--merge 0.06`). Without the merge, two gaps were really 0.43 s each.
- [MYSTERY PAUSE] after "تفتكر حصل إيه؟": 0.42 s (silencedetect: 0.39 s). That is the take's own length: under the 0.6 s cap and not lengthened. It is the only pause over 0.25 s.
- Leading silence: 0.005 s (the voice starts on frame 1). Silence after the last word: 0.40 s.
- Hook captions: caption 1 "ليه بتعيط غصب عنك" (4 words, بتعيط yellow, 150 px, centred, two lines) is on screen from frame 0.
  Caption 2 "لما حد يزعّقلك؟" (يزعّقلك red, 128 px) replaces it at 1.36 s, the onset of "لما". The hook is said in one breath with no pause between the two captions; line 1 ends at 2.06 s.
  The hook board moves from frame 0: the mouth shouts, sound waves fly out, and a tear is already rolling down his face (frame 1→2 diff 7.1).
- Captions match the script word for word: 76 cards, max 3 words after the hook. Both hook cards are bigger than every other card (others 67–112 px).
- Board: 87 beats, longest gap 1.75 s.
- Pop scan: every flagged jump is an intended beat: board pushes, caption swaps, the punch-in on "استنى", the reveal flash at 42.23 s, pose swaps and the ending squash.
- Loop: the last frame shows the hook board again (shouting mouth + tear), with the gold "الفهمان كسبان" caption held and the wink. First-vs-last frame diff is 16.5. As in earlier episodes, the pose and caption differ, and the cut sits inside the ending squash.
