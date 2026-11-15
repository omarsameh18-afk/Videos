# Prompt to paste in a NEW chat for the next الفهمان video

Start the new chat on repo `omarsameh18-afk/Videos` with the environment **"Videos"**, then paste this (fill in the topic, number and script):

---
Make the next الفهمان video. Everything is already built: read `CLAUDE.md` and `series/elfahman/README.md` and follow them exactly.
Do NOT regenerate the character, set, sounds or code: reuse the library and copy `src/elfahman/videos/Writing.tsx` (episode 04, every prop drawn in code) or `Rabies.tsx` / `Mummies.tsx` (with generated props) as the template.
Budget: ElevenLabs only, 1 voice take (eleven_v4, voice XFkxnO6GgzVSxqEN2NVq), at most 3–4 new props at 1K, log credits in `images/elfahman/credits.md`.
Hook rule: voice on frame 0, line 1 fully spoken by 3.0 s (`tools/tighten.py`), the whole hook question as ONE caption card from frame 1; max 3 words on every other card; the board is never empty; ~0.5 s of silence at the end.
Choose sensible defaults without asking. Keep the fixed lines "استنى... ده الغريب جاي!" and "الفهمان كسبان" with their gestures.

Video number: 05
Topic (folder name): <topic-in-english>
Script (final, use as is; the first line is the hook, so make sure it is in before sending):
```
<script here>
```
Visual ideas (optional): <...>

Deliver the MP4 and contact sheet in `series/elfahman/videos/05-<topic>/`, commit and push, and send me the files.
---

If the series code is not yet on `main`, add this line to the prompt:
"The series is on branch `claude/amazing-pascal-d1l58m` (episodes 01 and 02): fetch it and start your branch from it."
