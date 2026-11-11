# How the woodpecker Short was made: steps, tools and costs

A record of one finished 2D cut-out cartoon Short, for estimating the budget of more videos like it.

## The result

- **Topic:** "Why don't woodpeckers get concussions?" (2022 *Current Biology* study, University of Antwerp).
- **Format:** vertical 2160x3840 (4K), 60 fps, MP4 (H.264 video, AAC sound), voice and sound effects mixed in, loops.
- **Two versions were made:**
  - **v1:** 20.1 s. Higgsfield free plan with cheaper image models; several props drawn in code.
  - **v2 (final):** 22.75 s. Every picture made with GPT Image 2.5 at 4K, and an ElevenLabs eleven_v4 voice.
- **Script:** 7 lines, 59 words.

## What was done, step by step

1. **Research and script.** Searched the web for candidate topics and picked the woodpecker idea. Checked the central fact against several science outlets that cover the original paper. Wrote a 67-word script, then rewrote it in a casual spoken style (59 words, 7 lines).
2. **Voice.**
   - v1: Higgsfield's ElevenLabs engine, voice "Mark", 2 takes.
   - v2: ElevenLabs connector, model eleven_v4, voice "Tim Riley – Natural. Conversational", 1 take.
3. **Word timing.** Each word's start time came from an offline aligner (PocketSphinx), checked against the silent gaps in the audio. Every visual beat was set to land on its word.
4. **Beat sheet.** One visual beat and one cartoon gag per line:
   - the tree opens its eyes and winces at every peck
   - a thought bubble with a brain on a spring
   - a slow-motion X-ray of the head
   - a hammer striking in sync with the beak
   - a pillow squashed on the beak, with a sweat drop
   - an X-ray zoom on the brain
   - big brain vs tiny brain hitting a trunk
   - the last frame matches the first, so it loops
5. **Pictures (v2).** One hero picture of the woodpecker first, then every other picture made with the hero as its reference:
   - 3 extra poses: puzzled facing the camera, focused, worried
   - 3 props: brain, hammer, pillow
   - 1 set piece: the tree trunk

   Each picture was checked on a coloured background. The hero came back with a fake painted checkerboard instead of a real transparent background, so it was removed in code. The rest were generated on flat light blue and the background was removed in code.
6. **Prep.** Script-based (Python):
   - aligned the extra poses to the hero, so pose swaps don't jump
   - trimmed every picture
   - measured the beak tip, feet, head and prop sizes
   - solved the peck angles so the beak just reaches the bark
7. **Animation in code (Remotion, React).**
   - a 2.5D camera with depth layers, depth-of-field blur on close-ups and gentle shake on impacts
   - pose swaps hidden inside quick squash motions (no cross-fades)
   - real geometry for pecks and pillow contact
   - drawn in code: wood chips, impact stars, tree face, thought bubble, spring, X-ray, sweat drop, brain faces and the slow-motion camera frame
8. **Sound.** 9 sound effects synthesized in code (free): knock, boing, pop, whoosh, thud, squish, ding, beep, swish. About 50 cues, each synced to the action and kept well below the voice.
9. **Checks.**
   - contact sheets of every beat
   - a half-size preview render
   - a frame-by-frame scan for unexpected jumps (only intended beats were flagged)
   - audio peak check, about -5.6 dB
10. **4K render and verification.** Rendered on CPU (no graphics card in the cloud container). Then checked the size, frame rate, frame count, sound length, frozen frames, and that the first and last frames match.

## Credits and money

### v2, the final version: ElevenLabs only

Credits are what ElevenLabs charged. The cents are what ElevenLabs' run status showed for each generation; its pre-run estimates were about half of that.

| Item | Settings | ElevenLabs credits | Price shown |
|---|---|---|---|
| Hero woodpecker | GPT Image 2.5 Sunburst, 4K, high, 2:3 | 736 | $0.147 |
| 3 poses (edits of the hero) | 4K, high, 2:3 | 979 each = 2,937 | $0.196 each = $0.587 |
| 3 props: brain, hammer, pillow | 4K, high, 1:1 | 1,339 each = 4,017 | $0.268 each = $0.803 |
| Tree trunk set piece | 4K, high, 1:3 | 502 | $0.100 |
| Voice | eleven_v4, 1 take, 59 words (22 s) | 316 | $0.063 |
| **Total** | | **8,508** | **≈ $1.70** |

No picture or voice had to be redone in v2. The background fix was done in code at no cost.

### v1, the first version: Higgsfield free plan

Total 7.85 of the plan's 10 free credits:

| Item | Higgsfield credits |
|---|---|
| Hero picture, Seedream 5.5 2K | 3.5 |
| Pose edit, Nano Banana 2 1K | 1.5 |
| 3 props, Z Image (one redo) | 0.45 |
| 2 voice takes, 1.2 each | 2.4 |

GPT Image 2.5 and 2.6 are refused on Higgsfield's free plan; they need the Basic plan or higher.

### Free parts

- Sound effects: synthesized in code.
- Word timing: offline aligner.
- Remotion: no license fee was involved here, but check Remotion's license terms if this is for a company.
- Rendering: in the cloud container.

## Time

| Step | Time |
|---|---|
| Picture generation (7 at once) | ~1–2 min per batch |
| Voice generation | under 1 min |
| Half-size preview render | ~3 min |
| 4K render on CPU (4 cores), v2, 1,365 frames | 57 min |
| 4K render on CPU, v1, 1,206 frames | 45 min |

A machine with a graphics card would be much faster. Claude's own usage and time for research, coding and checks was not measured, so it isn't included here.

## Estimate for one more video of the same kind

Same style, about 8 pictures, one voice take, 20–25 s:

| Item | ElevenLabs credits |
|---|---|
| 8 pictures at 4K high | ~8,200 |
| Voice, 1 take | ~300 |
| 20–30% buffer for redoing a picture or voice | ~1,700–2,550 |
| **Per video** | **~10,000–11,000 (≈ $1.70–2.20 at the prices shown above)** |

### Ways to lower the cost

- **Lower resolution:** GPT Image 2.5 at 1K was estimated at ~190 credits per picture, against 736–1,339 at 4K. Characters fill only part of the frame, so 2K is often enough.
- **Fewer pictures:** reuse the same character and props across videos. One hero plus its poses can serve a whole series. Draw simple shapes in code, as done for the effects.
- **Fewer takes:** one voice take, as here, instead of the default of two.

### Things that change the estimate

- More characters or poses per video: about 1,000 credits per extra 4K pose.
- Longer scripts: voice cost grows with length, but it's small compared with pictures.
- Plan limits: free plans can be busy, as ElevenLabs was once here, or capped. Check your ElevenLabs plan's monthly credit allowance against the numbers above.
- Prices: these credit and dollar figures are from this one run and can change.

## Where everything is

Repository `omarsameh18-afk/videos`, branch `claude/youtube-shorts-script-oj33nh`:

| What | Path |
|---|---|
| Script, beat sheet and sources | `scripts/woodpecker-concussion.md` |
| v2 animation code | `src/woodpecker2/Woodpecker2.tsx` |
| v1 animation code | `src/woodpecker/Woodpecker.tsx` |
| v2 pictures, voice and sounds | `public/woodpecker2/` |
| v1 pictures, voice and sounds | `public/woodpecker/` |
| Prompts, generation IDs, credit log, prep and keying scripts | `images/woodpecker2/`, `images/woodpecker/` |
| 4K render script | `scripts/render4k.sh` |

The finished videos are in `out/`, which is not in git: `woodpecker2-4K.mp4` (v2) and `woodpecker-4K.mp4` (v1).
