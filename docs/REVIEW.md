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

## VISUAL RULES (permanent) — "science explained with animation"
1. **Explain with a visual component**, not a standing puppet: `AnimatedChart` (line/bar draws on), `Gauge` (needle slams
   and settles), `MuscleZoom` (flat muscle, zoom-in, highlight + glowing micro-tears), `SplitVersus` (wrong vs right with
   icons), `BigNumber` (huge count-up + <= 3-word label). Schema: src/schema/script.ts; components: src/short/visuals/.
2. **The visual is the star** (VIS_MAIN + label area ≈ 65% of the safe area). During visuals Max shrinks to the
   bottom-right corner (~17% tall) and reacts (pose by meaning; pointing aims at the visual). Max is big only in the hook
   (medium, under the gauge) and the ending (full size). Checked at render time (no overlap with the visual).
3. **3+ backgrounds** (lab, gym floor, chalkboard), chosen per scene (`background`, else rotating). Never one background
   for the whole Short (render fails).
4. **Visual text >= 64px, <= 4 words, one line, never overflows** (validator checks word count + fit; entrances never
   overshoot past their box). Caption highlight = lime, only on the ONE key word (`emphasis`, max 1 per scene).
5. **Hook = visual interrupt on frame 1** (e.g. gauge needle slams to 0 + white flash + Max shocked) with the question text.

Dev check for visuals not used in a Short: `VisualGallery` composition (review/visual-gallery.png).

## v5 RULES (permanent)
1. **Hook gauge:** the needle SLAMS from max to the target in < 0.4 s (lands on frame 6) with camera shake + a thud SFX,
   then wobbles and settles. Max never covers the gauge (render check).
2. **Captions by phrase:** 1-3 words with complete sense, chunked at punctuation; never end a chunk on a dangling word
   ("A MOVE YOUR", "FROM A", "TO."). Verb particles stay with their verb ("kicked in", "used to").
   Chunker: `chunkWords` in scripts/lib/timing.mjs.
3. **No fake-science decoration:** background decoration is abstract (dots, lines, shapes) and never text.
4. **Composition:** the main visual is big and fills the upper frame (972x1000 panel, ~52% of frame height,
   full width); Max is a ~30%-tall reactor bottom-left (render fails under 27%); captions in the column beside his
   head at ~65% height; source line under them. No empty bottom half.
5. **No label that repeats the caption** (validator: a headline label whose words appear contiguously in the narration).
6. **Charts have simple axis labels** (`xLabel` "Weeks", `yLabel` "Level"); schematic charts say "schematic" in the source line.
7. **End card:** the loop line is the hero (huge); `@brainpump_us` small at the bottom; captions hidden on the end card.

## US AUDIENCE RULES (permanent)
- Max's voice is locked to ONE American male ElevenLabs voice: **Liam, voiceId `TX3LPaxmHKxFdv7VOQHJ`**
  (`VOICE_LOCK` in src/config.ts; validator rejects any other voiceId).
- US spelling; lbs / inches only. US gym slang is fine (leg day, PR, pre-workout).
- Validator rejects "kg", "cm", "colour", "programme" and other UK/metric forms (config/usAudience.json, with the US replacement).

## EXPERIMENT FORMAT RULES (main format: "What happens if…", Max is the test subject)
1. **Rig sliders** (`body` per subject, src/max/body.ts): chest, shoulders, arms, back, abs, legs 0.8-1.4 (`all` sets
   every muscle), belly 0-1, fatigue 0-1 (sweat, droopy lids, flushed cheeks, heavy breathing / panting).
   Each scene's `body` is the target at the END of the scene; bodies ease there smoothly from the previous scene.
2. **Scenes:** `SplitClone` (two Maxes side by side, labels on top; `timersCenter` flies the timers to centre for the loop),
   `GymSet` (squat racks, barbell press reps, rest-timer rings, optional meters), `DayCounter` ("WEEK 1 → 8" ticker =
   story spine, a pop per tick), `Reveal` (flash + zoom on the focus subject + 1-3 tags).
3. **Activities:** `train` = sets of quick press reps + a rest whose length follows the subject's timer (1 MIN vs 3 MIN
   is visible); tired subjects gasp, fresh ones sip the shaker. `lift`, `rest`, `idle`, `flex` also available.
4. **Layout:** subjects ~34% of frame height, feet on y 1290, never overlapping each other (bar path never sweeps wider
   than the lockout); labels/ticker/meters stacked above without overlap; captions just below their feet (~68-75%);
   source line under the captions. The reveal zoom keeps the focus subject fully in frame.
5. **Story:** hook = both subjects + the two timers slamming in on frame 1; the spine is the week ticker; the twist is a
   Reveal; payoff carries the source; the last line loops back to the two timers (timers fly back to centre).
6. **Tags / meter labels must not repeat the narration** (validator) — e.g. "+ MUSCLE" while the VO says "bigger".
All earlier rules (pacing, animation, visual, v5, US audience) still apply.

## AI-CLIP FORMAT RULES (character shots = ElevenLabs image -> video, Remotion assembles)
1. **Budget:** only `gemini-3.1-flash-image` (1K, 9:16) and `kling-2.5-turbo` (5 s, 9:16). Always `estimate_only` first;
   hard cap per task (default 30K credits) - stop and report when close. Measured: image ~406 (609 with a reference),
   clip ~2,121.
2. **Consistency:** one MASTER Max image; every pose image uses it as reference; every clip starts from the MASTER or a
   pose image. Prompts end with "static camera, no morphing, no logos, no text; the pink shaker stays a shaker" + a
   negative prompt. Review a 3-frame contact sheet per clip before use (e.g. `flex` lost the shaker -> not used).
3. **Files:** download every result immediately (signed links expire in hours) to assets/clips/ and record name,
   model, generation id, prompt and credits in assets/clips/manifest.json (`node scripts/clip-add.mjs`).
   Video/image files are git-ignored; the manifest is committed.
4. **Assembly:** `ClipScene` (full or split panels) + overlays: question in the top band on frame 1, week ticker,
   rep counters, meters, reveal flash/zoom, tags in the top band (never over the character), timers for the loop.
   Captions sit below the panels; all earlier rules apply.

## AI-CLIP v3 RULES (versus format)
1. **Full-frame versus:** each Max fills his half edge-to-edge (y 10%-78%), no boxed cards; lime divider; captions at ~80%.
2. **Result-first hook (0-2 s):** final state on frame 1 (BIG-MAX on the 3-min side, drained Max on the 1-min side) + the claim
   in the top band; the explanation follows.
3. **Visible transformation:** the week drives everything - 3-min side grows ~4%/week (anchored at the neck so the
   head never leaves frame) and swaps to the BIG-MAX clip from week 6; 1-min side stays AVERAGE (max +5% by week 8). Both start as
   AVERAGE-MAX in week 1. Full normal colors - no grey/desaturated filters.
4. **Rep counters:** ONE number per week (pops when it changes), never live counting from 0.
5. **Payoff <= 5 s:** one line + source. End: frozen halves + both timers + a question that loops to the hook.
6. **Zero-credit edits:** re-use recorded sentences with `node scripts/splice-voice.mjs <script>` (exact sentence match
   on cached ElevenLabs recordings) and render with `npm run render -- <script> voice/<id>.mp3`.
   If a wanted line was never recorded, use the closest recorded one and put the exact wording on screen.

## SOLO FORMAT RULE (permanent, default from "skip-leg-day" on)
1. **ONE Max, full frame, visible transformation over time.** No split-screen by default (versus only when a video
   truly compares two subjects and Omar asks for it). Layout: ClipScene `layout: "solo"`.
2. His whole body (head to feet) sits between the top band and the caption band; a blurred copy of the same clip fills
   the frame edge to edge. Time counter (`unit` MONTH/WEEK) in the top band, one value per scene, whoosh on every change.
3. Transformation must be visible: `upper` scales only the body above the waist (feathered, no box edges), `bodyMeters`
   show what grows and what stays at 0, swap to the changed-body clip when the story says so.
4. Every claim on screen must match the cited paper's wording; if the exact figure can't be verified, use the verified
   wording instead and say so at the GATE.
5. No single clip > 4 s in a row; phrase captions (split at commas before mid-phrase); source from the claim to the end.

## BUDGET (until Dec 1)
- BrainPump budget = 50K ElevenLabs credits total; never touch the last 16K of the account (reserved).
- Ledger: docs/budget.md (account usage before/after each video). Report the running total in every GATE.

## FILL FORMAT (Video #1 "max-365" on)
- Clip fills 1080x1920 edge to edge (ClipScene `layout: "fill"`), dropped 110 px under a gradient title band; captions at ~78%
  (y 1425, box x 50-930); source top-left under the title; meters top-left. No blurred side panels, no boxed clip.
- Upper-body growth line sits below the hanging hands (0.64), vertical growth factor 0.3 so the head stays clear.
- eleven_v3 voice: run `node scripts/desilence.mjs <tts.mp3> <tts.timestamps.json> <id>` (its timestamps smear words
  over pauses), then render with voice/<id>.mp3. Extra SFX per scene via `props.sfx` (boing, scratch).

## CARDS + STT CHECK (from "skip-half")
- Cards (`props.card`): big, <= 8 words, rows auto-sized per row, "→" drawn as an SVG arrow; `hide: [from,to]` clears a key moment.
- Hand-written `captionChunks` per scene when the chunker can't make clean phrases (validator: joins to the narration, <= 4 words).
- FINAL CHECK: transcribe the final MP4 audio (ElevenLabs scribe via the connector, from the public raw file in review/stt/),
  compare word-for-word with the script, then `node scripts/align-from-stt.mjs <script> <words.json> voice/<id>.timestamps.json`
  and re-render with `voice.maxGapSec: 2` so the audio stays exactly the transcribed one (captions in sync to ~1 frame).

## CREDIT SAFETY (permanent, from protein-window)
- A `creative_run_flow_nodes` / `creative_add_flow_node` call that TIMES OUT can still execute minutes later and charge.
  Run ONE paid node per call, and after a timeout check the node's `generations` AND re-check the node again ~3 min
  later before anything else. Never re-run a timed-out paid call.
- Library clips are git-ignored: in a fresh container re-download them from the ElevenLabs flow "BrainPump - Max clips"
  (generation ids in assets/clips/manifest.json) with `creative_get_generations`.
