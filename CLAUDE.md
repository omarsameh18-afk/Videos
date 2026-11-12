# Videos repo: notes for Claude

## الفهمان series (Arabic Egyptian YouTube Shorts)
Everything for this series is already built and saved. **Do not rebuild the character, set, sounds or code.**
Read `series/elfahman/README.md` first: it has the series rules and the step-by-step recipe for a new video.

- Reusable library (character poses, mouth/blink/wink layers, set, sounds, font): `public/elfahman/lib/`, `public/elfahman/sfx/`
- Reusable code: `src/elfahman/lib/`; episode template to copy: `src/elfahman/videos/Rabies.tsx`
- Tools: `series/elfahman/tools/` (timing.py, prep scripts, sfx.py); QA: `scripts/stills.mjs`, `scripts/popscan.py`; render: `scripts/render.sh`
- Each episode lives in `series/elfahman/videos/NN-topic/` (script, words, final MP4, contact sheet)
- Credits: log every generation in `images/elfahman/credits.md` (ElevenLabs Starter 30k/month: pictures 1K-2K only, 1 voice take, max 3-4 new props per video)

## Setup in a fresh session
`npm ci` and `pip install opencv-python-headless numpy pillow`. The cloud environment must be "Videos"
(it allows downloads from elevenlabsusercontent.com). Commit the final MP4 + contact sheet into the episode folder.
