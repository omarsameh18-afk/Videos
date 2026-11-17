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

## Regenerating the library (only if the character must change)

`python3 series/elfahman/tools/prep_library.py` (keys, aligns poses to the hero with ECC, builds mouth/blink/wink layers,
keys props), `python3 series/elfahman/tools/prep_set.py` (set layers), `python3 series/elfahman/tools/sfx.py` (sounds).
Then copy `public/elfahman/lib/character.json` to `src/elfahman/lib/`. QA sheets land in `images/elfahman/qa/`.
