# Prompt to paste in a NEW chat for the next الفهمان video

Start the new chat on repo `omarsameh18-afk/Videos` with the environment **"Videos"**, then paste this (fill in the topic, number and script):

---
Make the next الفهمان video. Everything is already built: read `CLAUDE.md` and `series/elfahman/README.md` and follow them exactly.
Do NOT regenerate the character, set, sounds or code: reuse the library and copy `src/elfahman/videos/Rabies.tsx` as the template.
Budget: ElevenLabs only, 1 voice take (eleven_v4, voice XFkxnO6GgzVSxqEN2NVq), at most 3–4 new props at 1K, log credits in `images/elfahman/credits.md`.
Choose sensible defaults without asking. Keep the fixed lines "استنى... ده الغريب جاي!" and "الفهمان كسبان" with their gestures.

Video number: 02
Topic (folder name): <topic-in-english>
Script (final, use as is):
```
<script here>
```
Visual ideas (optional): <...>

Deliver the MP4 and contact sheet in `series/elfahman/videos/02-<topic>/`, commit and push, and send me the files.
---

If the series code is not yet on `main`, add this line to the prompt:
"The series is on branch `claude/sharp-lovelace-qujoey`: fetch it and start your branch from it."
