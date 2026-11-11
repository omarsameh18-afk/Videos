# Woodpecker Short v2: pictures and voice through ElevenLabs (no Higgsfield)

ElevenLabs flow "Woodpecker Short cut-outs" (NmwTrwRYQJoraWBfj3lG). Model for every picture: gpt-image-2.5-sunburst,
4K, quality high. Every picture after the hero uses the hero as its reference image.

| sprite | aspect | generation id | ElevenLabs credits |
|---|---|---|---|
| hero (bird_side) | 2:3 | JLJNALUJURDivi0x6Ae6 | 736 |
| bird_front (puzzled, edit of hero) | 2:3 | VYj3wmrn0G3VL8W1tomr | 979 |
| bird_focused (edit of hero) | 2:3 | XRF3KY7Pw0tBdNSkoVgE | 979 |
| bird_worried (edit of hero) | 2:3 | nMXYgnExGfmiHcleiUhw | 979 |
| brain | 1:1 | oPE7Mp3ANwvfcofkMaBP | 1339 |
| hammer | 1:1 | SmJiK9xJJmwSjnLarZN5 | 1339 |
| pillow | 1:1 | yOWWhGkBRTdqlAslm3oo | 1339 |
| trunk (set piece) | 1:3 | f9eytV43DX30vm16oZSN | 502 |
| voice: eleven_v4, "Tim Riley - Natural. Conversational" (1gZSmkYVRMS8w1i4plmP), 1 take | | OQnlY7yR19LwYLjzIIEF | 316 |

Total: 8,508 ElevenLabs credits.

Glitch found and fixed: the hero came back as RGB with a painted grey/white checkerboard instead of real transparency
-> key_checker.py. All later pictures were asked for on flat #9BCFFD and keyed with key.py. The three extra poses were
ECC-aligned to the hero on the lower body (cc 0.998) and trimmed with one common box (prep.py -> sprites.json).

Prompts: see the flow; the hero prompt is the STYLE_CHAR-style block ("Flat 2D cartoon style: thick smooth black
outlines of even weight, flat colours with one simple soft shade, clean vector-like linework, no texture, no text, no
border..."), poses use "Change: ... Preserve: ..." edits, props say "drawn in exactly the same drawing style as the
reference image (use it for style only, do not draw the bird)".
