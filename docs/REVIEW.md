# Review checklist (run after every visual change)

Render PNG frames (and the MP4 at stage gates), open them, and check every item.

## Character
- [ ] Matches the approved proof sheet: proportions, round glasses, open lab coat with rolled sleeves, lime tank, chunky sneakers.
- [ ] Pink shaker is the same size in every pose and always gripped.
- [ ] Nothing floating, no broken limbs, no bad overlaps.

## Frame
- [ ] 1080x1920.
- [ ] Nothing important in the bottom 20% or the right 12% (Shorts UI).

## Captions
- [ ] Readable on a phone, high contrast.
- [ ] Max 6 words per line.
- [ ] Synced to the voice.

## Hook
- [ ] Visual + text land within the first 1.5 s.

## Motion / audio
- [ ] Lip-sync and blink working.
- [ ] No frozen frames.
- [ ] Audio not clipped.

## Content
- [ ] No banned words (config/bannedWords.json).
- [ ] Every stat has a source.
- [ ] No medical advice; Max never claims credentials.

## PACING RULES (permanent)
1. **Voice:** every gap between words/sentences trimmed to max 0.15 s; voice sped up 1.1x (pitch kept).
2. **Visual change every <= 1.5 s:** new pose/expression, punch-in zoom (100 -> 115%), shake on key words, card slide/pop.
   The render log prints the longest gap; it must be <= 1.5 s.
3. **Max stays big:** >= 45% of frame height, even when a card is on screen.
4. **Captions:** fixed band at ~65% height, never over Max's face or body; max 3 words at a time;
   no headline that repeats the caption.
5. **Hook (0-1.5 s):** question first, answer later.
6. **StatCard:** one clear line + source.
7. **Outro <= 1.5 s:** handle only; end on a line that loops back to the hook.
8. **Audio:** whoosh/pop SFX on every cut + quiet royalty-free music bed ~20 dB under the voice;
   final mix -14 LUFS integrated.
9. **Length:** hit the script's `meta.targetSec` (12-15 s for short myth scripts).

## ANIMATION RULES (permanent)
1. **Pose by meaning** (map: `INTENTS` in src/config.ts; each scene/sentence declares an `intent`):
   question -> thinking (fist under chin) · myth/wrong -> armsCrossed + smug (or facepalm) ·
   reveal/fact -> pointing AT the card · stat/number -> fingerUp · good news -> thumbsUp · ending -> flexing.
   Never facepalm on a question (validator).
2. **Max 1 pose per sentence** (`moves[].atSentence`). Pose changes are a 7-frame eased tween (`POSE_TWEEN_FRAMES`), never a snap.
3. **Life between poses:** idle breathing, slight sway (~0.7 deg), auto blink, plus camera punch-ins (background 100->115%,
   card pulse; Max himself only zooms where his zoomed body still fits).
4. **Pointing aims at a real on-screen target** (the card). Pointing is only allowed in card scenes (validator).
5. **Layout:** Max on the left (~60% of width), cards in the right column. Nothing overlaps Max's arms or face. His full
   body, shaker included, stays inside a 5% margin at every zoom — checked at render time from measured pose bounds
   (`npm run measure-poses` -> src/max/poseBounds.json; geometry in src/short/geometry.ts). Cards never overshoot toward Max.
6. **Max 2 text layers at once:** caption + ONE card (WrongVsRight swaps myth -> reality). No banners. Source line stays small at the bottom.
7. **Ending:** the last sentence finishes fully + 0.4 s tail. Audio and captions are never cut mid-sentence.

Self-review: `scripts/review-frames.sh <id> <frames...>` -> review/<id>/sheet.png, then check every rule above.
