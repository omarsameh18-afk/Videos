# BrainPump Shorts — Max animation system

Remotion project that turns **one JSON script + one ElevenLabs MP3** into a 1080×1920 / 30 fps YouTube Short starring **Max**.
Channel: **BrainPump** (`@brainpump_us`). All brand settings live in `src/config.ts`.

> Content rule: Max never calls himself a doctor / scientist / coach / PT and never gives medical advice.

## Layout
```
src/config.ts          channel name, handle, catchphrase, video size, Shorts safe zones
src/max/               the character rig
  MaxFigure.tsx        draws Max for one frame from plain props
  Max.tsx              animated Max: lip-sync, auto-blink, brow springs, pose springs
  Head.tsx Arm.tsx Hand.tsx Body.tsx Shaker.tsx   layered SVG parts
  expressions.ts       6 expressions (brows, eyes, resting mouth, fx)
  poses.ts             arm rig angles for each pose
  lipsync.ts           amplitude (+ ElevenLabs letters) -> mouth shape
  blink.ts random.ts   seeded blink schedule
scripts/lib/amplitude.mjs   per-frame loudness from the MP3 (ffmpeg)
src/dev/               ProofSheet + RigTest compositions
```

## Rig
- **Expressions** (independent of pose): neutral, shocked, angry, laughing, smug, thinking
- **Poses**: pointing, flexing, armsCrossed, facepalm, thumbsUp, fingerUp (+ idle)
- **Talking mouths**: closed, small, wide, O, laugh. Loudness picks closed/small/wide. The O mouth is used when the letter being spoken is o/u/w (from ElevenLabs timestamps), and laugh when Max is laughing.
- **Blink** every 3–5 s (seeded). **Brows** spring with overshoot on expression change; arms spring between poses.

## Making a Short
```
npm run validate -- scripts/example.json            # schema + content rules
npm run render   -- scripts/example.json            # ElevenLabs TTS with timestamps (needs ELEVENLABS_API_KEY in .env), cached in .cache/tts
npm run render   -- scripts/example.json voice/x.mp3  # use an existing MP3; needs voice/x.timestamps.json next to it
npm run import-voice -- script.json voice/x.mp3 scribe-words.json  # word timings (ElevenLabs Scribe) -> timestamps JSON
```
Output: `out/<meta.id>.mp4` (1080x1920, 30 fps, H.264 yuv420p, AAC, <= 60 s). Script format: `src/schema/script.ts`.
Review stills: `scripts/review-frames.sh <id> <frame>...` -> `review/<id>/sheet.png`. Checklist: `docs/REVIEW.md`.

## Commands
```
npm run studio        # live preview
npm run proof-sheet   # review/proof-sheet.png
npm run rig-test      # review/rig-test.mp4
```
In this cloud container set `REMOTION_BROWSER=/opt/pw-browsers/chromium_headless_shell`.
