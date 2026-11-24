# Episode 13 v2 QA: لو قفلت النت من موبايلك أسبوعين

v2 = two fixes on v1: (1) the series study set behind every frame, with each beat drawn inside a framed board on the wall above him;
(2) a new hook line (1 eleven_v4 take). Everything else is the same.

- Output: `elfahman-13-phone-internet-off.mp4`. 1080x1920, **60 fps**, H.264 yuv420p + AAC, **65.80 s**. **−14.0 LUFS**, peak −1.2 dBFS (limiter before loudnorm).
- Hook: "لو قفلت النت من موبايلك أسبوعين بس، مخك هيحصله إيه؟", one take with `[calm, curious, unhurried]`. The connector has no speed setting, so 0.95 could not be set.
  **Hook = 3.74 s** of speech, said in one go. Its only pause is the breath after "بس", trimmed from 0.31 s to **0.25 s** (measures 0.25–0.27 s depending on the detector setting).
  **Gap after the hook = 0.43 s**, then "أول ساعة". The hook was raised +0.6 dB to match the main take. It starts at 0.00 s; the first 0.04 s is the soft attack of "لو".
- Rest of the voice: the v1 take reused (no new generation), cut from the same raw take at 1.0x. Nothing was sped up or stretched; only silence was cut.
  Sentence gaps 0.36–0.43 s (avg 0.40 incl. the hook gap), comma gaps 0.15–0.17 s, in-phrase micro-gaps ≤ 0.05 s (were 0.07, to stay under 66 s).
  **Mystery pause 0.76 s**. **Longest gap outside it: 0.43 s**. 0.40 s after the last word.
- Contact sheet (1 s, 66 frames): the study set (wall, bookshelf, globe, window, lamp, desk with the mug and books) is behind الفهمان in every frame,
  and الفهمان (orange hoodie, ف badge, round teal glasses) is in every frame, sitting behind the desk. The ahwa beat puts a tea glass on his desk.
- Frame 0: caption 1 "لو قفلت نت موبايلك" on screen, phone and Wi-Fi rings moving by frame 1. Loop: the last frame is the hook board inside the same set,
  and the swap from the temple/wink pose back to the smirk is hidden in a squash (`loop-last-first.png`).
- Credits: **78** (hook line only). Scribe 0. Episode total (v1 + v2) 1,067.
