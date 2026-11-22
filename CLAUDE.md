# BrainPump Shorts (Max) — working rules

## Self-review
- Claude is both builder and strict reviewer. After every visual change: render PNG frames, open them,
  check them against docs/REVIEW.md, fix what fails.
- Max 2 self-fix loops per stage. If something still fails, stop and list the issue.
- Never ask Omar to copy things to another chat. Only stop at GATES (end of a stage).
- At a GATE reply with ONLY: a 3-line summary, 1 image/MP4 path, and "PASS" or "NEEDS OMAR: <one question>".

## Project rules
- Character is Max, channel is BrainPump (@brainpump_us). Brand settings: src/config.ts.
- Max never says or shows doctor/scientist/coach/PT and never gives medical advice.
- Banned words: config/bannedWords.json (checked by `npm run validate`).
- Render spec: 1080x1920, 30 fps, H.264, yuv420p, AAC, max 60 s.
- Secrets: ELEVENLABS_API_KEY lives in .env only. Never commit .env.
- In the cloud container set REMOTION_BROWSER=/opt/pw-browsers/chromium_headless_shell.
