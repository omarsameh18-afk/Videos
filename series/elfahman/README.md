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
- Mid-video signature **"استنى... ده الغريب جاي!"**: `shocked` pose + camera punch-in + small shake + stinger,
  exactly on the onset of "استنى". The room dims while he stares.
- Ending **"الفهمان كسبان"**: `temple` exactly on "الفهمان", wink exactly on "كسبان", gold caption held to the last frame.
  The first frames reuse the temple+wink pose and the ending camera, so the last frame loops into the first.
- Every pose swap lands on its word (the squash starts 0.07 s before, the swap happens on the word).
- Reactions stay natural. Health/safety topics carry the accurate safety message.
- Captions: 2–3 words, Cairo Black, white with thick black outline, key words yellow `#FFD23F` / red `#FF5A4E`,
  at ~65% of the frame height (y ≈ 1250: clear of the Shorts/TikTok channel name, title and buttons), never in the right 15% of the frame.

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
6. **QA.**
   - Contact sheet: `COMP=<Id> REBUNDLE=1 node scripts/stills.mjs out/sheet.png 0 1.2 3.4 ...` (one time per beat).
   - Render: `scripts/render.sh <Id> out/<name>.mp4` (~10–12 min on 4 CPU cores for 40 s).
   - Pop scan: `python3 scripts/popscan.py out/<name>.mp4`. Every flagged jump must be an intended beat
     (board pop, punch-in, pose swap squash). Also check the first-vs-last frame difference stays small (loop).
   - Audio peak: `ffmpeg -i out/<name>.mp4 -af volumedetect -f null -` (keep max below -1 dB).

## Regenerating the library (only if the character must change)

`python3 series/elfahman/tools/prep_library.py` (keys, aligns poses to the hero with ECC, builds mouth/blink/wink layers,
keys props), `python3 series/elfahman/tools/prep_set.py` (set layers), `python3 series/elfahman/tools/sfx.py` (sounds).
Then copy `public/elfahman/lib/character.json` to `src/elfahman/lib/`. QA sheets land in `images/elfahman/qa/`.
