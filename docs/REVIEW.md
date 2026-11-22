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
