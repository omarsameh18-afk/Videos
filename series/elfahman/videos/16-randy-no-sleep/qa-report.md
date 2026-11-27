# Episode 16 QA: ولد قرر مينامش ١١ يوم

## Layout (= #14 v2, copied exactly, same values as #15)
- Set, CAM0 {520, 860, 180} and the same BASE / NEAR framings, board x 110 y 106 820 x 910 with the wood frame (screen ~40..1040 x ~40..1150
  at CAM0), الفهمان 0.42 sitting behind the desk (CHAR_Y = DESK_SCREEN_Y − 1450·0.42), captions y 1385 (x 460, hook cards x 540).
- `layout-check.png` (rendered BEFORE the full render): #14 v2 and #16 side by side at 0 s, 15 s, 40 s with guide lines. Board size and position,
  desk height, character size and position identical. Passed.
- Tiredness check (stills at day 3 / 5 / 11 next to the rested face): soft grey-purple circles + a few strands (day 3), lower eyelids (day 5+),
  faint red rims (day 11). Subtle, same face; kept.

## Output
- `elfahman-16-randy-no-sleep.mp4`: 1080x1920, **60 fps**, H.264 **yuv420p (tv range)**, AAC, **62.70 s**, **−14.1 LUFS** integrated, peak −1.4 dBFS.
  (Remotion renders yuvj420p / full range; converted to tv range like #14 v2 / #15. Frames 2508–2559, the collapse into bed, were re-rendered
  after the contact-sheet review and spliced in; colours checked identical to the main render.)

## Voice and pacing (ONE eleven_v4 take, 1.0x, silence edited only — nothing sped up, slowed or stretched)
- Raw take 61.44 s → 62.67 s voice track (`tools/pace.py` on boundaries snapped onto measured silences, `scripts/elfahman/snap16.py`).
- Speed 0.95 could not be set (eleven_v4 on this connector has no speed setting); the #15 instruction tag
  `[warm, amused, calm and unhurried, telling a friend a story at an ahwa]` opens the text instead.
- Hook "ولد عنده سبعتاشر سنة، قرر مينامش حداشر يوم كاملين!": 0.00–**3.63 s**, one go with one comma breath (0.19 s). Voice starts at 0.025 s.
  Gap after the hook: **0.40 s**.
- Body (146 words, 4.03 s → 62.27 s): **2.51 words/s**.
- Sentence gaps (. ! ?): 22, **0.36–0.41 s, average 0.39 s**. Comma / colon gaps: 13, **0.18–0.21 s, avg 0.19 s**.
  "…" beats: 10, **0.25–0.28 s, avg 0.27 s** (the shortest, after "غابة…", measures 0.246 s at −40 dB).
- Mystery pause after "تفتكر حصله إيه؟": **0.77 s**. Longest silence anywhere else: **0.41 s**. In-phrase silences ≤ 0.11 s.
  Leading silence 0.00 s, **0.43 s** after the last word.
- The two [laughs softly] are short soft laughs (~0.4–0.9 s) at the start of "وراندي خسر." and "حتى في الحمام…"; the sentence gap before
  each is kept (0.38 s / 0.35 s + laugh).
- Loudness is not flat (per line, speech frames only, `loudness.json`): [whispers] lines −26.4 dB ("اليوم الخامس…") and −30.4 dB ("بعد أكتر
  من أربعين سنة…"); [excited] / [surprised] lines the loudest (−15.6 dB); the rest −16 to −20 dB. Per-second range 24 dB, std 4.7 dB.
- Audio tags: the Scribe alignment gives every tag a 0.04–0.05 s slot with no speech of its own (the audio runs from the previous silence straight
  into the next scripted word), so no tag word is spoken; captions are built from the script, never from the tags. (An independent re-transcription
  was not possible: the connector re-aligns the generation to its text and file upload is not available here.)

## Picture checks
- `contact-sheet.png` (1 s, 63 frames): every frame shows الفهمان from the library (orange hoodie, ف badge, round teal glasses, mustache) sitting
  behind the desk in the study set with the #14 v2 layout; the board drawings fill the board; راندي is the same picture (crew cut, freckles,
  red-and-white varsity jacket, jeans) in every beat, with code-drawn tiredness / wide eyes / arm on top.
- Frame 0: caption 1 "ولد عنده ١٧ سنة" (١٧ yellow) on screen; the hook board (wide-eyed راندي, calendar on "١", spinning clock, crossed-out Zzz)
  reads on mute; the calendar page and clock move from frame 1 (frame 1 → 2 difference 4.4). Caption 2 "قرر مينامش ١١ يوم كاملين!" on "قرر";
  the red ١١ stamp lands on "حداشر".
- Twist: shocked stare, punch-in and shake exactly on "ينام" (53.17 s). Ending: temple on "الفهمان" (61.25 s), wink on "كسبان" (61.92 s, measured),
  gold caption held to the last frame. No stock transition line.
- Pop scan: every flagged jump is an intended beat (board changes, twist punch-in, book slam, CTA cut, loop board).
- Loop: the last board replays the hook board on the same clock (t − END); board-area difference last → frame 0 is 1.6 (`loop-last-first.png`);
  only the pose and caption change, inside the end squash.
- Known substitutions: the library has no "pointing down" pose (CTA: finger up + a bouncing ⬇ under the comment icon); the window, moon and bedside
  clock of beat 17 are drawn in code (the picture is old راندي in bed on magenta) so the moon can move; prop 2 was made from a text prompt, not wired
  to prop 1 (433 vs 190 credits), with the same features (freckles, crew cut, big ears).

## Credits
- Voice 1,135 (one take). Scribe 0. Pictures 380 (190 + 190, 1K high). Music + SFX 0 (synthesized). **Episode total: 1,515.**
- Account: 0 → 1,515 used after the generations (exact match). At the end of the session it showed 5,674 used; the extra 4,159 was not started
  from this session (shared plan).

---

# v2 (voice fix) — 2026-11-27

Only the voice changed (and the timing that follows it, plus the hook caption "ما ينامش"); layout, board drawings, character, SFX and loop
are the v1 code.

- **Voice**: ONE new eleven_v4 take (Fodoly), the fully diacritized VOICE TEXT sent exactly as written (`voice_v2.sent.txt`, tashkeel untouched,
  same inline tags as v1; the v1 opening instruction tag was not added because the text had to be sent exactly). 65.2 s raw → 63.63 s at 1.0x.
- **Pronunciation check** (independent Scribe transcript of the take as a plain audio file, `transcript_take2_independent.txt`): وَلَد → "ولد",
  ما يِنامْش → "ما ينامش", حِداشَر → "11", هَيْنام → "هينام", بِيْكَلِّموه → "بيكلموه", حَصَلُّه → "حصل له", خَمَسْتاشَر → "15". All correct.
  No tag word (laughs / whispers / excited / surprised / sarcastic / curious) appears in the transcript. The two [laughs softly] are short
  chuckles (~0.2 s) at the end of the previous line.
- **Output**: 1080x1920, 60 fps, H.264 yuv420p (tv), AAC, **63.63 s**, **−14.2 LUFS**, peak −1.4 dBFS.
- **Pacing** (measured on vo.mp3, silencedetect −40 dB): hook 0–3.77 s in one go (one comma breath 0.17 s), gap after the hook 0.40 s; body 146 words
  in 59.02 s = **2.47 words/s**; sentence gaps 22 × **0.35–0.40 s** (avg 0.37); comma gaps 13 × **0.16–0.18 s**; "…" beats 10 × **0.25–0.27 s**;
  **mystery pause 0.77 s** (after "تفتكر حصله إيه؟"); **longest gap elsewhere 0.40 s**; in-phrase ≤ 0.09 s; lead 0.00 s, tail 0.44 s.
- **Re-timed**: every caption, pose, board beat and SFX follows the new word times (same word indices; "ما ينامش" is one timing entry).
  TWIST (shocked + punch-in + shake) on "ينام" at 53.88 s; temple on "الفهمان" 62.03 s, wink on "كسبان" 62.77 s (measured); bed re-made on the new timeline.
- **Captions**: caption 1 "ولد عنده ١٧ سنة" from frame 0; caption 2 "قرر ما ينامش ١١ يوم كاملين!" (ما ينامش yellow, ١١ يوم red) on "قرر". Nothing else changed.
- **QA**: contact sheet every 1 s (64 frames) passed; frame 0 → 1 moving (4.4); pop scan: every jump cluster is a board change or an intended beat;
  loop board-area difference last → frame 0 = 1.6 (`loop-last-first.png`).
- **Credits**: voice 1,231 + independent transcript 359 (estimated ~22, charged 359) = **1,590**. Account 5,674 → 7,264 used (of 131,000).
