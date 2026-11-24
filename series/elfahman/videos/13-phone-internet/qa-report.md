# Episode 13 v3 QA: لو قفلت النت من موبايلك أسبوعين

v3 = layout fix + 2 visual fixes. The audio is the v2 audio, unchanged (`public/elfahman/phone/vo/vo.wav`, music, SFX). **0 ElevenLabs credits.**

## Layout
- The requested reference, video #12 v2 (`Sun.tsx`), has **no study set, desk or wall board**: it uses full-frame boards and he stands.
  The layout described in the brief (study set, board on the wall, he sits behind the desk) is the series template up to video #11 (`Earth.tsx`).
  Video #13 now copies #11's values exactly:
  - Set: `SetBack` / `SetFront`, z = 1300.
  - Camera: CAM0 {520, 860, 180}, BASE {512, 866, 125}, NEAR {510, 850, 150}, the mystery push-in {512, 780, 215}, the "استنى" punch-in {540, 690, 280}, and the end back to CAM0.
  - Board: x 80, y 84, 860 x 480, with the #11 wood frame.
  - Character: scale 0.6, centred, CHAR_Y = DESK_SCREEN_Y − 1450·0.6, so he sits behind the desk.
  - Captions: y 1250, x 460 (hook cards x 540). Sizes 96 normal / 118 gold.
  - The timeline chips are now a thin strip inside the board top.
- `layout-check.png`: #13 at 5 s, #11 at 5 s, #12 at 5 s, side by side. Board size and position, desk height, and character size and position are identical between #13 and #11.

## Visual fixes
1. Payoff board: the calendar flips BACKWARD one page per year, 2026 → 2016, starting 0.15 s into the line. It lands on 2016 just before "أصغر", where the gold "-١٠ سنين" badge pops.
2. Middle boards:
   - "ووقتهم على الموبايل نزل للنص": a phone Screen Time screen (وقت الشاشة / المتوسط اليومي) whose daily number drops 5:14 → 2:41 on "نزل"; the weekly bars halve and turn green. The "تجربة حقيقية" stamp is kept.
   - "مع أهلها وصحابها": four small cartoon people (hair, hijab, beard, clothes; no stick figures) sitting together on a bench with speech bubbles. One walks outside past a tree on "اتمشت".
   - "سبعة من كل عشرة": 10 different small cartoon people, grey at first. 7 light up one by one (colour, smile, glow, small hop).

## Checks
- 1080x1920, **60 fps**, yuv420p, **65.80 s**, **−14.0 LUFS**, peak −1.2 dBFS.
- Contact sheet (1 s, 66 frames): every frame shows the study set with the #11 layout (wall board, bookshelf, window, lamp, desk with the mug and books), and الفهمان (orange hoodie, ف badge, teal round glasses) sitting behind the desk.
- Frame 0: caption 1 on screen, motion by frame 1 (diff 6.0). 0.40 s after the last word.
- Loop: the last frame is the hook board and the CAM0 framing, the same as frame 0; the pose swap is hidden in a squash (`loop-last-first.png`).
- Credits: **0** (v3). Episode total stays 1,067.
