# Episode 14 QA: أقدم واحد زوّغ من الشغل

## Layout
- The requested reference, video #12 (`Sun.tsx`), has **no study set, desk or wall board**. It uses full-frame boards and he stands.
  The layout the brief describes (study set, board on the wall, he sits behind the desk) is the series layout of #11 and #13 v3.
  #14 copies #13 v3 (`PhoneOff.tsx`) exactly: set z 1300, CAM0 {520, 860, 180}, board x 80 y 84 860 x 480 with the wood frame,
  character scale 0.6 seated (CHAR_Y = DESK_SCREEN_Y − 1450·0.6), captions y 1250 x 460 (hook x 540).
- `layout-check.png` (rendered before the full render) shows #14, #13 and #12 at 5 s side by side. #14 and #13 have the same
  board size and position, desk height, and character size and position.

## Output
- 1080x1920, **60 fps**, H.264 yuv420p, AAC, **62.53 s**, **−14.1 LUFS** integrated, peak −1.4 dBFS.

## Voice and pacing (one eleven_v4 take, 1.0x, silence edited only)
- Hook "أقدم واحد زوّغ من الشغل في التاريخ… كان مصري!": 0.00–**3.28 s**, said in one go with a 0.22 s breath at "التاريخ…".
  This is **under the 3.8–4.2 s target**. The take is read at that speed, the connector has no speed setting (0.95 could not be set),
  and the audio is never slowed afterwards. Gap after the hook: **0.39 s**.
- Body (146 words, 3.67 s → 62.11 s): **2.50 words/s**.
- Sentence gaps: 19, **0.37–0.43 s, average 0.40 s**. Comma / "…" gaps: 23, **0.15–0.24 s, average 0.21 s**.
- Mystery pause after "تفتكر عملوا إيه؟": **0.77 s**. Longest silence anywhere else: **0.43 s**.
- "استنى ده الغريب جاي!" said straight through, then 0.42 s. Leading silence 0.00 s, 0.42 s after the last word.

## Picture checks
- Contact sheet (1 s, 63 frames): every frame shows الفهمان from the library (orange hoodie, ف badge, round teal glasses)
  sitting behind the desk in the study set, with the #13 layout.
- Frame 0: caption 1 "أقدم واحد زوّغ" on screen. The slab is popping and Seba is peeking, so frame 1 already moves (diff 5.2).
- Signature: shocked pose, punch-in and shake at 40.52 s, exactly on the onset of "استنى". Temple pose on "الفهمان" (61.08 s),
  wink on "كسبان" (61.77 s), gold caption held to the last frame.
- Pop scan: every flagged jump is an intended beat (board changes, stamps, the punch-in, the badge, pose squashes).
- Loop (`loop-last-first.png`): the board's last frame is the hook slab sliding in, so it reaches the frame-0 position. The camera is
  CAM0 in both frames. The temple → hero swap is hidden inside the end squash. Only the caption (gold → hook card) and the pose change.

## Credits
- Voice 934 (one take). Scribe 0, pictures 0 (all 20 boards drawn in code), music and SFX 0. **Episode total: 934.**
