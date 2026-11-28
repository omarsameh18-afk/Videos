# Episode 17 QA: لو الكهربا قطعت عن الدنيا أسبوع

## Decision applied (Omar, 2026-11-28)
Script line 7 ("والشبكة فصلت، بطاريات الأبراج بتكفي ساعات بس.") cut out of the EXISTING take: the cut runs from the start of the silence after
"المية." to the end of the silence after "بس." (both edges in silence below −40 dB, so no click and one breath only); the join is a 0.46 s sentence gap.
Its captions and visual beat 7 (phone tower) are gone; the phone at ١٠٪ goes straight into "اليوم التاني…". Nothing new recorded, nothing sped up.

## Output
- `elfahman-17-blackout-week.mp4`: 1080x1920, **60 fps**, H.264 yuv420p (tv), AAC, **64.52 s**, **−14.1 LUFS**, peak −1.4 dBFS.

## Layout (= #14 v2, copied exactly, as #15 / #16)
- Set, CAM0 / BASE / NEAR framings, board x 110 y 106 820 x 910 with the wood frame, الفهمان 0.42 sitting behind the desk, captions y 1385
  (hook cards x 500, max width 820, so they stay out of the right 15%).
- `layout-check.png` (rendered BEFORE the full render): #14 v2 and #17 side by side at 0 s, 15 s, 40 s: board size and position, desk height,
  character size and position identical. Passed.
- The study set is never dimmed (no room dim, no mystery dim of the set); only the board darkens (overlay 0.10 phone, 0.20 day 2, night / day 3 boards
  drawn dark blue with candle + moon light, day 7 warm candle light, mystery board dark, 1859 / today / CTA / ending normal).

## Voice and pacing (ONE eleven_v4 take, 1.0x, silence edited only)
- Raw take 70.53 s → 64.52 s (line 7 removed + `tools/pace.py`). Hook "لو الكهربا قطعت عن الدنيا كلها… أسبوع كامل؟": 0.00–**2.98 s** in one go with
  a 0.20 s beat at "…"; **gap after the hook 0.44 s**. Voice starts at 0.00 s.
- Body (140 words, 3.43 → 64.08 s): **2.31 words/s** — below the 2.5–2.8 target because the take itself is slow (speech alone is 52.5 s for 155 words);
  only allowed to edit silence, so it could not be raised without cutting gaps under 0.4 s.
- Sentence gaps: 17, **0.43–0.50 s, average 0.45 s** (incl. the line-7 join 0.46 s). Comma gaps: 12, **0.18–0.24 s** (avg 0.21). "…" beats ~0.27–0.33 s.
- **Mystery pause 0.79 s** (after "بس تفتكر ده ممكن يحصل بجد؟"). **Longest gap elsewhere 0.50 s.** In-phrase ≤ 0.12 s. Lead 0.00 s, tail 0.40 s.
- Loudness is not flat (`loudness.json`, speech frames per line): [whispers] night line −25.4 dB, [whispers] mystery question −33.5 dB;
  [surprised] "حصلت بروفة…" −17.2 dB and "مفيش مية." −17.9 dB among the loudest; the rest −17.2 to −20.0 dB. Per-second range −33.5 … −14.4 dB (19 dB, std 4.0).
- Tags: the forced alignment gives each tag a ~0.05 s slot with no speech; [laughs softly] is a short chuckle before "البقية في حياتك".
- Word check: hook checked by an independent Scribe transcript (all 7 words right). The full take was NOT independently transcribed (~375 credits
  would have broken the 1,700 limit and the "0 new credits" rule), so the after-take list (حمادة، مَيَّة/المِيَّة، بروفة، ١٨٥٩ …) is unverified by machine.

## Picture checks
- `contact-sheet.png` (1 s, 65 frames): passed — see criteria (a)–(d) in the brief.
- Frame 0: caption 1 "لو الكهربا قطعت" (الكهربا yellow), lit Cairo skyline + bulb + globe, clear on mute; windows start switching off in frame 1
  (frame 0→1 diff 2.9, 1→2 diff 9.2). Caption 2 "عن الدنيا كلها… أسبوع كامل؟" on "عن" (1.04 s).
- TWIST: shocked stare + punch-in + shake exactly on "بروفة" (42.90 s); calendar flips back from ٢٠٢٦ and lands on ١٨٥٩ on "تسعة", red stamp on "وخمسين".
- Ending: temple on "الفهمان" (62.78 s), wink on "كسبان" (63.53 s), gold caption to the last frame; last board = the frame-0 board (board-area diff
  last → frame 0 = 3.4, `loop-last-first.png`); only pose + caption change, inside the end squash. No stock transition line.
- Pop scan: every flagged jump is an intended beat (board changes, twist punch-in, sparks, CTA, loop board).
- Captions: 61 cards, zero tashkeel ("دايمًا" → "دايما"), no tag words, max 3 words outside the hook cards, numbers as digits (١٠٪ twice, ١٨٥٩).
- Substitutions: حمادة drawn in code instead of the planned generated picture (keeps him identical and kept new credits at 0); the library has no
  point-down pose (CTA: finger up + a bouncing ⬇ under the comment icon, as #16).

## Credits
Hook test 64 + hook transcript 26 + full take 1,333 + word timing 0 = **1,423**; after the user's decision: **0 new**.
Account 9,037 → 10,460 used (of 131,000), unchanged at the end.
