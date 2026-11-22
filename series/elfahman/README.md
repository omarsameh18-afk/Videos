# الفهمان: series kit

A recurring Arabic (Egyptian dialect) YouTube Shorts series. One cut-out character, one study set, built **once**.
Each new video needs only: a script, 1 voice take, and at most 3–4 new prop pictures.
Same pipeline as the woodpecker Short: Remotion, 2.5D camera, pose swaps hidden inside a squash (never cross-fades),
effects drawn in code, synthesized SFX, word-timed beats, contact sheet + pop scan QA.

Output: 1080x1920, 60 fps, H.264 + AAC.

## What is already built (do not regenerate)

| Part | Where |
|---|---|
| 11 character pictures, aligned on one canvas: `hero`, `explain`, `point_up`, `shocked`, `thinking`, `laughing`, `temple`, `worried`, `thumbs_up` (+ `talk_open` / `talk_half` sources) | `public/elfahman/lib/*.png` |
| Lip-flap overlays (mouth half / open) for `hero explain point_up thinking temple thumbs_up worried` | `public/elfahman/lib/<pose>__mouth_half.png`, `__mouth_open.png` |
| Blink overlay for the same poses; wink overlay for `temple` | `<pose>__blink.png`, `temple__wink.png` |
| Layer offsets, face/mouth points, alignment scores | `public/elfahman/lib/character.json` (copy in `src/elfahman/lib/`) |
| Study set split into depth layers: wall (`set_bg.jpg`) + desk with mug and books (`set_fg.png`) | `public/elfahman/lib/` |
| 16 synthesized sound effects (pop, whoosh, swish, boing, thud, squish, ding, tremble, step, stinger, alarm, bubbles, sparkle, click, gulp, twinkle) | `public/elfahman/sfx/` (`series/elfahman/tools/sfx.py`) |
| Cairo Black font, embedded (no network at render time) | `src/elfahman/lib/cairoFont.ts` |
| Reusable code: camera, set, character (poses, squash swaps, lip flap, blinks), captions, effects | `src/elfahman/lib/` |
| Original pictures, prompts, credit log, QA sheets | `images/elfahman/` |

Pictures were made on ElevenLabs flow "Elfahman series library" (`WjuQnuJf71KyVebsnDY1`); prompts in `images/elfahman/prompts.md`.

## Series rules (built into the template)

- Voice: ElevenLabs **eleven_v4**, voice **XFkxnO6GgzVSxqEN2NVq** ("Fodoly"), `generations_count: 1`.
  Add tashkeel where the voice could misread: e.g. `خَرْبِشَك`, `مَيَّة` (water) vs `مِيَّة` (hundred), `داء الكَلَب`.
- Hook: something visibly moving from frame 1 (episode 1: a scared glass trembling on the desk).
  From episode 04 (**hook rule**): the voice starts on frame 0 (no leading silence), line 1 is one question with no pause
  inside it and is fully spoken by 3.0 s, and the whole question is ONE caption card (two lines) on screen from frame 1.
  `tools/tighten.py` does the audio part without a new voice take (see step 3).
- Mid-video signature **"استنى... ده الغريب جاي!"**: `shocked` pose + camera punch-in + small shake + stinger,
  exactly on the onset of "استنى". The room dims while he stares.
- Ending **"الفهمان كسبان"**: `temple` exactly on "الفهمان", wink exactly on "كسبان", gold caption held to the last frame.
  The first frames reuse the temple+wink pose and the ending camera, so the last frame loops into the first.
- Every pose swap lands on its word (the squash starts 0.07 s before, the swap happens on the word).
- Reactions stay natural. Health/safety topics carry the accurate safety message.
- Captions: 2–3 words (max 3; the hook card is the only exception), Cairo Black, white with thick black outline, key words
  yellow `#FFD23F` / red `#FF5A4E`, at ~65% of the frame height (y ≈ 1250: clear of the Shorts/TikTok channel name, title and
  buttons), never in the right 15% of the frame. The call-to-action cards are at least as big as a normal card (a long one
  goes on two lines instead of shrinking). Sizes come from real measured widths (`scripts/captionsizes.mjs`).
- The board is never empty: each board scene pushes the previous one out, and the previous drawing stays (a little darker)
  during the signature punch-in (episode 04, `Writing.tsx`).
- About 0.5 s of silence after the last word, not more.

## Making the next video (only a new script)

Work on a branch, in the repo root. Budget: ~580 credits per 40 s of voice + ~337 per prop at 1K high (max 3–4 props).

1. **Script.** Save it as `series/elfahman/videos/NN-topic/script.txt` (one sentence per line). Keep the two fixed lines.
   Add tashkeel to risky words only in the text you send to the voice; captions use `script.txt` as written.
2. **Voice (1 take).** ElevenLabs `creative_generate_speech`, model `eleven_v4`, voice `XFkxnO6GgzVSxqEN2NVq`,
   `generations_count: 1`. Save as `public/elfahman/NN-topic/vo/take1.mp3`.
3. **Word timing (free).** Run Scribe (`creative_transcribe_audio`, `eleven_scribe_v1`, wired to the voice node on the
   same flow; it cost 0 credits for episode 1) and download its `words.json`. Then:
   `python3 series/elfahman/tools/timing.py scribe_words.json script.txt public/elfahman/NN-topic/vo/take1.mp3 src/elfahman/videos/<topic>.words.json src/elfahman/videos/<topic>.env.json استنى الفهمان كسبان`
   It maps each Scribe word onto the script word at the same index, writes the 60 fps lip-flap level envelope, and
   prints the real audio onsets of the signature words. Pin those onsets in the episode file (as `T.estanna`,
   `T.fahman`, `T.kasban` in `Rabies.tsx`).
   **Hook rule / length (free, from episode 04).** Before `timing.py`, tighten the take:
   `python3 series/elfahman/tools/tighten.py public/elfahman/NN-topic/vo/take1.mp3 scribe_words_take1.json public/elfahman/NN-topic/vo/vo.mp3 scribe_words.json --hook-words <words in line 1>`
   It trims the leading silence, cuts the gaps between the hook's words, speeds only that line up (pitch kept, at most
   1.15x) until it ends by 2.85 s, caps every later pause at 0.32 s, and moves the Scribe words onto the new timeline.
   Then run `timing.py` on `vo.mp3` + the new `scribe_words.json`, with `const VO = 0` in the episode file.
4. **Props (≤ 3–4 pictures).** Only what code can't draw well. Prompt = style block + object + flat `#FF00FF`
   background (see `images/elfahman/prompts.md`), GPT Image 2.5 Sunburst, **1K high, 1 generation**.
   Save the originals as `images/elfahman/raw/<name>.png`, then key them with
   `python3 series/elfahman/tools/prep_props.py <episode> <name> ...` (writes `public/elfahman/<episode>/`). Log each item in
   `images/elfahman/credits.md`.
5. **Episode code.** Copy `src/elfahman/videos/Rabies.tsx` (or `Mummies.tsx`, episode 02) to `src/elfahman/videos/<Topic>.tsx` and change only:
   - the `T` beat table (word → time via `at('word', nth)`),
   - `POSES` (pose per beat; talkable poses lip-flap automatically),
   - `CAM_KEYS` / `SHAKES`,
   - the chalkboard `SCENES` and their small drawing components,
   - `SFX` cues and the caption `COLORS` key words.
   Keep the signature-line block and the ending/loop block as they are. Register the composition in `src/Root.tsx`.
   `Writing.tsx` (episode 04) is the newest template: voice on frame 0, one two-line hook card from frame 1, board scenes
   that push each other out (never an empty board), lettering on the board (Arabic shaped right-to-left, Latin left-to-right,
   `Wipe` reveals in the writing direction), maps, arrows, tags, all in code. Its caption list `writing.captions.json` also
   holds per-card options (`cards`: two-line break `br`, size `fs`) and the measured widths (`w100`):
   run `node scripts/captionsizes.mjs src/elfahman/videos/<topic>.words.json src/elfahman/videos/<topic>.captions.json`
   after changing the caption groups.
   `Doorway.tsx` (episode 03) is the template for a video with **no generated pictures**: stick figures, rooms, doors,
   thought bubbles, icons, brain and folders are all small SVG components there. Its hook is already on the board in
   frame 1 (door swinging, caption up), and its last shot is the same room with the door shut, so the end loops into the start.
   **Script changed after the voice was made?** Do not redo the whole take. Generate only the new line (1 take),
   match its loudness to the main take, join the files into `public/elfahman/NN-topic/vo/vo.mp3`, shift the main take's
   Scribe words by the join offset, merge both word lists into `scribe_words.json`, and run `timing.py` on `vo.mp3`
   (episode 02's hook line was added this way: `take0_hook.mp3` + `take1.mp3` -> `vo.mp3`). Words that now appear
   twice need the right `nth` in `at('word', nth)`, and the pinned onsets move by the offset.
6. **QA.**
   - Contact sheet: `COMP=<Id> REBUNDLE=1 node scripts/stills.mjs out/sheet.png 0 1.2 3.4 ...` (one time per beat).
   - Render: `scripts/render.sh <Id> out/<name>.mp4` (~10–12 min on 4 CPU cores for 40 s).
   - Pop scan: `python3 scripts/popscan.py out/<name>.mp4`. Every flagged jump must be an intended beat
     (board pop, punch-in, pose swap squash). Also check the first-vs-last frame difference stays small (loop).
   - Captions vs script (episodes that list their caption groups in `<topic>.captions.json`, from episode 03):
     `python3 scripts/captioncheck.py <script.txt> src/elfahman/videos/<topic>.words.json src/elfahman/videos/<topic>.captions.json`.
     It fails on any card over 3 words (except the hook card) and on a call-to-action card smaller than a normal card.
   - Hook: `python3 scripts/hookcheck.py <final>.mp4 public/elfahman/NN-topic/vo/vo.mp3` prints when the voice starts, when
     line 1 ends (must be <= 3.0 s), the silence after the last word, and checks frame 1 already differs from frame 2 (motion).
   - Loudness: `scripts/loudnorm.sh out/<name>.mp4 <final>.mp4` brings the mix to -14 LUFS (true peak <= -1.5 dB) without
     touching the picture (from episode 03).
   - Audio peak: `ffmpeg -i out/<name>.mp4 -af volumedetect -f null -` (keep max below -1 dB).

## Suspense episodes (from episode 05, `Liar.tsx`)

Episode 05 ("الكدّاب") is the template for a calm, darker "secret" episode:

- **Voice stays raw (1.0x).** No time-stretch and no gap-cutting. `tools/pauses.py` only trims the leading silence and
  *lengthens* chosen pauses with room tone: `--pause <index of the word before the pause>:<seconds>` (0.8 s for a drama
  pause). It also snaps the Scribe words onto the real audio onsets and writes `scribe_words.pauses.json` (every pause,
  hook end, speech end) for the report. Then run `timing.py` as usual.
- **Drama pause** = the board freezes (all idle motion runs on an idle clock that stops), the camera pushes in slowly,
  the music drops to one held low note, and the next word lands with a soft hit and a small shake (`DRAMA` in `Liar.tsx`).
- **Music** (0 credits): `tools/suspense_bed.py <words.json> <vo.mp3> public/elfahman/<ep>/music --end <seconds>
  --drama i,i,i --hits i,i,... --resolve <index of "الفهمان">` writes `bed.wav` (20 LU under the voice, resolves to major
  on the closing line, silent by the last frame) and `hits.wav`.
- **Mood**: set dimmed 25% (`ROOM`), soft vignette, spotlight gradient on the board.
- **Hook is the biggest text**: `"base"` in `<topic>.captions.json` sets the sizes of the other cards under the hook card
  and `"hook_biggest": true` makes `captioncheck.py` enforce it; `"allow": [card]` lists a card the brief asks for with
  more than 3 words.
- **Loop**: frame 0 starts directly in the hook pose (no wink frame); the cut from the last frame sits inside a squash.

## Strange-story episodes (from episode 06, `Sommaroy.tsx`)

Episode 06 ("سومَرُوي") is the template for a light "telling a friend a strange story" episode with a mood change:

- **Pauses without a new take**: `tools/pauses.py` also lengthens short "..." / sentence pauses to ~0.45 s (`--pause i:0.45`)
  as well as the drama pauses (`--pause i:0.8`). A pause that already has a breath inside it is left alone.
- **Music** (0 credits): `tools/curious_bed.py <words.json> <vo.mp3> public/elfahman/<ep>/music --end <s> --drama i,i,i
  --hits i,... --resolve <index of "الفهمان"> --scratch <onset of "استنى"> --dark <s> --winter <s>` writes `bed.wav`
  (plucked marimba + pizzicato in D major, 20 LU under the voice; darker B minor from `--dark`; cold pad + shimmer from
  `--winter`; one held low note in each drama pause; resolves on the closing line), `hits.wav`, `scratch.wav` (record
  scratch made from the bed itself, placed on "استنى") and `../sfx/crack.wav`, `../sfx/tick.wav`.
- **Freeze-frame**: the idle clock also stops from "استنى" to the next line, so the board freezes with the scratch.
- **Mood**: `warm` / `cool` / `winter` colour layers over the picture (under the captions) and the set dim follow the story;
  they return to warm on the closing line so the loop matches frame 0.
- **Maps in code**: Europe as a few polygons (`vectorEffect="non-scaling-stroke"` so the zoom keeps the lines thin), then a
  procedural fjord coast and island blobs for the close-up.
- **Long hook line**: when line 1 is too wide for the safe area, the hook card may use the full width with a 40 px margin
  (`"x": 540, "maxW": 1000`) and the base sizes drop so the hook stays the biggest text.

## Fast "what if" timeline episodes (from episode 07, `Humans.tsx`)

Episode 07 ("لو البشر كلهم اختفوا") is the template for a fast timeline with a strict pause rule:

- **Pause rule without a new take**: `tools/capgaps.py <take.mp3> <scribe_take.json> <vo.mp3> <scribe_words.json> --hook-words N
  --max-pause 0.25 --mystery <word index>:0.6 --tail 0.4` keeps the voice at 1.0x and only *removes* silence: leading silence
  trimmed, every gap cut to <= 0.25 s, one marked pause capped at 0.6 s (never lengthened), 0.4 s after the last word.
  It writes `scribe_words.pauses.json` (hook end, longest body pause, mystery pause, end silence) for the QA report.
- **Time chips**: `CHIPS` pops a big chip at the top of the board exactly on each time phrase, with a clock whose hands spin
  faster at each jump (`SPIN`) and a thin timeline bar filling right-to-left step by step. Scenes keep the top ~110 px light.
- **A beat every ~2 s**: `HUMANS_BEATS` lists every board beat; bundle it with esbuild and print the longest gap (episode 07: 1.88 s).
- **Music** (0 credits): `tools/ambient_bed.py <words.json> <vo.mp3> public/elfahman/<ep>/music --end <s> --chips t,... --wind <s>
  --birds <s> --night a,b --sig <onset of "استنى"> --reveal <s> --resolve <index of "الفهمان">`: pad that thins out into wind +
  birds, one held low note for the mystery, golden chord on the reveal, C major on the closing line, chip whooshes in `hits.wav`.

## Regenerating the library (only if the character must change)

`python3 series/elfahman/tools/prep_library.py` (keys, aligns poses to the hero with ECC, builds mouth/blink/wink layers,
keys props), `python3 series/elfahman/tools/prep_set.py` (set layers), `python3 series/elfahman/tools/sfx.py` (sounds).
Then copy `public/elfahman/lib/character.json` to `src/elfahman/lib/`. QA sheets land in `images/elfahman/qa/`.

## Science-surprise episodes (from episode 08, `Screens.tsx`)

Episode 08 ("الأطفال والشاشات") is the template for a "study surprise" episode (setup -> study -> mystery -> reveal -> nuance -> advice -> poll):

- **Same pause rule as episode 07** (`tools/capgaps.py ... --max-pause 0.25 --mystery <index of "والمفاجأة؟">:0.6 --tail 0.4`).
  The bed's drama window should use the measured silence start from `scribe_words.pauses.json` (Scribe word ends are padded):
  pass a copy of the words file with that word's `e` set to the measured start.
- **Long hook line**: a 9-word hook on two lines over the full width (`"x": 540, "maxW": 1040`) is ~65 px, so the base sizes drop
  to 61/63/63 to keep the hook card the biggest text (`hook_biggest`). Pick the line break with the smallest `w100`.
- **Mystery -> reveal in place**: the covered chart (cloth + big "؟") is swapped for the colourful reveal without a push, with a
  white flash (`isReveal`), the room dims during the pause and gets a warm lift on the reveal.
- **Link, not cause**: the causal arrow gets a ✗, then two arrows walk side by side (legs) — reuse for any correlation story.
- Drawing kit in code: `Kid` (g = 0 child .. 1 teen; arms phone / run / down), `Brain` (normal / glow / sleepy), `Phone`,
  `Scientist`, `Mom`, `Flag`, `Clock`, `Ball`, `Bolt` / `Spark`, `Confetti`, `MiniChart` (poll up / down).
- **Loop**: the last scene is the hook drawing run with `t - END`, so its motion arrives at the frame-0 state on the last frame.

## Hook caption rule (from episode 09, `Tears.tsx`; every video from now on)

- **Caption 1** = at most 4 words, big and centred (`"style": "hook", "x": 540`), on screen from frame 0 (episode 09: two lines
  "ليه بتعيط / غصب عنك", 150 px). **Caption 2** = the rest of the hook line, replaces caption 1 exactly when the voice reaches
  its first word (`out[0].e = out[1].s`), also big (128 px). The voice says the whole hook in one go.
- `<topic>.captions.json`: `"hook": <words in caption 1>`, `"hook_cards": 2`, `"hook_biggest": true`. `captioncheck.py` then
  fails if caption 1 has more than 4 words or if either hook card is not bigger than every other card.
- **Pause rule**: `tools/capgaps.py ... --max-pause 0.25 --mystery <index>:0.6 --tail 0.4 --merge 0.06`. `--merge` treats two
  quiet runs split by a click or a tiny blip (< 60 ms) as ONE pause, so it gets cut to 0.25 s too (without it, episode 09 had
  0.43 s gaps that the old report counted as two 0.22 s pauses).
- Drawing kit added in `Tears.tsx`: `MyFace` (his own face from a library pose, cropped round in SVG, loaded with
  `delayRender`, tears rolling), `ShoutMouth`, `Waves`, `Stamp`, `Person` (adult: shout / angry / smile, anger flush, `Steam`),
  `Lion`, `Alarm`, `Body` (outline that fills from the feet, neck squeeze, children clipped inside), `Heart` + `beat()`, `Gauge`,
  `Shoe`, `Fist`, `Gear`, `Lungs`, `EmojiFace` (cry / fume), envelope, ECG line.

## Viral "it almost happened" episodes (from episode 10, `Doomsday.tsx`)

Episode 10 ("العالم كان هيخلص الأسبوع اللي فات!") follows the episode 09 hook caption rule and pause rule:

- **Hook**: caption 1 "العالم كان هيخلص" (3 words, two lines, 165 px) from frame 0, caption 2 "الأسبوع اللي فات!" (118 px) on the onset
  of "الأسبوع". The voice says the whole hook in one go; it ends at 1.57 s.
- **Scribe can drop a word into the silence after it** (episode 10: "فات!" was timed 1.6–2.0 s inside a silence that starts at
  1.57 s), which made `capgaps.py` report the hook end at the *next* pause. Check the hook end with
  `ffmpeg -af silencedetect=n=-40dB:d=0.04` on `vo.mp3` and fix that word in `scribe_words.json` before `timing.py`.
- **Voice direction tags**: an inline `[playfully]` in the text sent to eleven_v4 gave the teasing tone on the metro line; Scribe
  returns the tag as a word, so drop it from the Scribe list before `capgaps.py`.
- Drawing kit added in `Doomsday.tsx`: `Earth` (crack 0..1, faces shock / smile / worry), `CalPage` + `FlipCal` (pages flip up and
  land on a day, continuous in t so the loop runs into frame 0), `Warn`, `Glasses`, `CrystalBall`, `Scientist` (+ top hat), `TopHat`
  (winking), `Wand`, `Rabbit`, `Mini` (tiny person, sweat), `Kid`, population curves (`hyper` -> ∞, `logi` flattening, `Axes`, `Line`),
  `Infinity_` (lemniscate, the font has no ∞), `Calculator`, `Bread`, `Dice`, `Cake`, `PartyHat`, `Confetti`, `House`, `Ear` + `Pinch`,
  `Clock`, `Typewriter`, `Film` (old film frame) + the `bw` filter (black-and-white photo), a month calendar grid (week starts on Saturday),
  a rolling digit counter.
- **Pause rule, second pass** (`tools/trimgaps.py`, from episode 10): after `capgaps.py` (-40 dB), breath tails between -40 and -30 dB
  could still make a gap measure 0.28 s at -30 dB. `python3 series/elfahman/tools/trimgaps.py <vo.mp3> <scribe_words.json> --pauses
  <scribe_words.pauses.json> --keep <mystery start>:<end> --keep-max 0.6` removes only the excess from the middle of every quiet run
  longer than 0.25 s at -30 dB (voice stays 1.0x) and shifts the words; then run `timing.py`. Do not run `capgaps.py --thr -30`
  instead: it clips word tails and moves the mystery pause.

## Relaxed pacing (from episode 10 v2, `DoomsdayV2.tsx`)

The pacing rule changed after episode 10: relaxed and natural, never rushed, never dead air. `tools/pace.py` re-edits the RAW take
(no new voice, 1.0x, nothing stretched; silence is cut or digital silence added) by the script's punctuation:
`python3 series/elfahman/tools/pace.py <take1.mp3> <scribe_words_take1.json> <script.txt> <vo_v2.mp3> <scribe_words_v2.json>
--hook 6 --straight <index of "استنى"> --mystery <index>:0.8 --cut a:b --tail 0.4 --sent-min 0.47 --sent-max 0.52 --comma-min 0.2 --comma-max 0.25`
- Sentence gaps (. ! ?) ~0.38–0.48 s, comma gaps ~0.17–0.24 s, gaps inside a phrase <= 0.15 s, nothing over 0.6 s except the
  0.8 s mystery pause (all measured with ffmpeg silencedetect at -40 dB; the `--sent-*` / `--comma-*` targets are a little higher
  because silencedetect counts soft breath tails as sound). `--set b:len` fixes one gap whose kept ends hold a breath.
- `--cut a:b` drops a whole sentence (its words and gaps); the boundary that remains gets a sentence gap. Write `script_v2.txt`
  without it, then `timing.py`, a new captions file (drop that sentence's cards) and the episode code with the word indices shifted.
- Body pace for episode 10 v2: 2.62 words/s (target 2.5–2.8).

## "What if" science episodes with generated props (from episode 11, `Earth.tsx`)

Episode 11 ("لو الأرض وقفت ثانية") follows the relaxed pacing rule, with 3 generated pictures (Earth, a wave, a dinosaur silhouette):

- **Speed**: eleven_v4 on the connector has no speed setting (only stability / similarity). A slower read is asked for with an inline
  tag after the hook (`[relaxed, unhurried storytelling]`); Scribe returns the tag's words (`[relaxed,`, `unhurried`, `storytelling]`),
  so drop all three before `pace.py`. Never slow the audio afterwards.
- **Pacing to a words/s target** (`tools/pacecheck.py`, new): `pace.py` now writes each edited gap's new position (`at`) into
  `<scribe>.pauses.json`; `pacecheck.py <vo.mp3> <pauses.json> [--json out]` measures every gap as heard (silencedetect -40 dB, blips
  under 70 ms merged), prints sentence / comma / mystery ranges, the longest silence outside the mystery pause, and flags any sentence
  gap outside 0.35–0.5 s or comma gap outside 0.15–0.25 s. To land on a target, rerun `pace.py` with `--set b:len` per gap, where
  len = old len − (measured − target) (episode 11: sentence target 0.385, comma 0.18, `--mid-max 0.12`; body pace 2.46 -> 2.52 words/s).
- **Scribe drift**: near the end of a long sentence Scribe can be ~0.3 s late, so a real sentence gap gets matched to the boundary
  before it (episode 11: the gap after "ده." was treated as "بالشكل|ده" and cut to 0.15 s). Check `pacecheck.py` output for a "mid"
  gap that measures like a sentence gap, and fix it with `--set`.
- **Hook cards with their own text**: a caption card may show text from the brief instead of the spoken words (`"text"` in
  `<topic>.captions.json` cards; `captionsizes.mjs` measures it and `captioncheck.py` counts its words). Episode 11: card 0
  "الأرض وقفت!" (fills the width, `maxW` 950) over the spoken hook words, card 1 "ثانية واحدة بس؟" (two lines) on "ثانية".
  Keep a hook card's `maxW` <= 950: the caption pops to 1.1x for a moment.
- **Generated props in SVG**: `useProps()` preloads the keyed PNGs once with `delayRender`, then `<image href>` draws them inside the
  board (`EarthPic` rotates the globe; `Pic` places the wave / dinosaur by their bottom centre).
- **Freeze on a word**: the hook globe spins at 360° / onset of "وقفت" so it stops upright exactly on the word; the loop scene runs
  the same spin with `t - END`, reaching the frame-0 angle on the last frame.
- Drawing kit added: `Gauge` (speedometer with a digital readout), `Plane`, `Car`, `House`, `Swirl` (air), `SeaWave`, `Tree` (bends
  in the wind), the hurricane spiral, a flooding city, `Stopwatch` (one sweep = one second), `Clock` with an `extra` sliver, the STOP
  octagon, a snail, a battery, `SpinArcs` (speed arcs around a spinning globe), `Stars`.
- Sounds added (`tools/earth_sfx.py`, 0 credits): `earth/sfx/screech.wav`, `wind.wav`, `crash.wav`.
