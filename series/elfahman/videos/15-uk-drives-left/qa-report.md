# Episode 15 QA: ليه الإنجليز بيسوقوا شمال؟

## Layout (= #14 v2, copied exactly from `SkipperV2.tsx`)
- Set z 1300, CAM0 {520, 860, 180} and the same BASE / NEAR framings, board x 110 y 106 820 x 910 with the wood frame (screen ~40..1040 x ~40..1150
  at CAM0), الفهمان 0.42 sitting behind the desk (CHAR_Y = DESK_SCREEN_Y − 1450·0.42), captions y 1385 (x 460, hook cards x 540).
- `layout-check.png` (rendered BEFORE the full render): #14 v2 and #15 side by side at 0 s, 15 s, 40 s with guide lines. Board size and position,
  desk height, character size and position are identical. Passed.
- Board drawings use board space 1080 x 1200 shown 1:1; anything important stays out of the bottom-centre where his head sits.

## Output
- 1080x1920, **60 fps**, H.264 **yuv420p (tv range)**, AAC, **60.65 s**, **−14.0 LUFS** integrated, peak −1.4 dBFS.
  (The Remotion render came out yuvj420p / full range; it was converted to yuv420p tv range like #14 v2, audio copied untouched.)

## Voice and pacing (one eleven_v4 take, 1.0x, silence edited only — nothing sped up or slowed)
- Raw take 61.39 s → 60.62 s voice track (`tools/pace.py`; new `--dots-min/--dots-max` for the "…" storytelling beats).
- Scribe word ends were ~0.3 s late; every punctuation boundary was snapped onto the measured silence before pacing
  (`scribe_words_take1.snap.json`).
- Hook "ليه الإنجليز بيسوقوا عكس الدنيا كلها؟": 0.00–**2.15 s**, said in one go (no pause inside). Gap after the hook: **0.41 s**.
- Body (144 words, 2.56 s → 60.22 s): **2.50 words/s**.
- Sentence gaps (. ! ?): 20, **0.40–0.49 s, average 0.44 s**. Comma gaps: 6, **0.19–0.24 s, avg 0.20 s**. "…" beats: 9, **0.26–0.32 s, avg 0.29 s**.
- Mystery pause after "تفتكر ليه؟": **0.78 s**. Longest silence anywhere else: **0.49 s**. Leading silence 0.00 s, **0.40 s** after the last word.
- "السبب… سيف!": 0.32 s beat after "السبب", then "سيف!".

## Picture checks
- Contact sheet `contact-sheet.png` (1 s, 61 frames): every frame shows الفهمان from the library (orange hoodie, ف badge, round teal glasses,
  mustache) sitting behind the desk in the study set, with the #14 v2 layout; the board is big and readable.
- LEFT/RIGHT rule, checked board by board: hook (UK red car in the LEFT lane, Cairo taxi in the RIGHT lane, both going up); جون up the LEFT lane,
  stranger down the right lane, sword hand (his right = screen right) towards him; wagons: up-wagon in the RIGHT lane, down-wagon in the LEFT lane,
  driver on the rear-LEFT horse next to the centre line; soldiers up the RIGHT lane; Cairo taxi up the RIGHT lane on "يمين!"; the comic taxi swerves
  into the LEFT lane and meets oncoming cars; the CTA cars meet nose-to-nose in the same lane.
- Frame 0: caption 1 "ليه الإنجليز بيسوقوا" (الإنجليز yellow) on screen, the split-road board (UK vs Egypt) clear on mute; road markings
  scroll and the "؟" pulses from frame 1 (frame 0 → 1 mean pixel difference 4.73).
- Twist: shocked pose, punch-in and small shake exactly on "يمين!" (43.97 s). Ending: temple on "الفهمان" (59.37 s), wink on "كسبان" (59.89 s,
  measured), gold caption held to the last frame. No stock transition line.
- Loop: the last board replays the hook board on the same clock (t − END), so the last frame is the frame-0 board; camera CAM0 in both frames (board-area difference last → frame 0: 3.6; only the pose and caption change, hidden in the end squash);
  `loop-last-first.png`.
- Known substitution: the library has no "pointing down" pose, so on "منشنه" he points up while a ⬇ and the @ comment icon bounce on the board.

## Credits
- Voice 967 (one take). Scribe 0 (listed). Pictures 1,294 (جون 667, wagon 275, Napoleon 352; 2K high, each checked, none regenerated).
  Music + SFX 0 (synthesized). **Episode listed total: 2,261.** Account moved 3,253 → 560 left (delta 2,693).
