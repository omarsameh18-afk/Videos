# الفهمان: picture prompts (for regenerating or extending the library)

Model: gpt-image-2.5-sunburst. Character pictures go on flat #9BCFFD (keyed in code); props go on flat #FF00FF (keyed in code).

**Style block (start of every prompt):** "Premium clean 2D cartoon character/prop, flat colour cut-out style for an animated
YouTube show: thick smooth dark-brown outlines of even weight, flat colours with one simple soft cel shade, clean
vector-like linework, no texture, no text, no border."

**Hero:** style block + character sheet ("an Egyptian man about 30 ... round teal-framed glasses, thick neat black mustache,
light stubble, bright orange hoodie with white drawstrings and a cream circle badge with the Arabic letter ف in orange,
dark pants") + "half body from the waist up, facing the camera straight on, centred ... both arms relaxed down ...
mouth closed with a subtle confident smirk" + "Background: one perfectly flat solid light blue colour #9BCFFD".

**Poses (edits wired to the hero):** "Edit the reference image. Change ONLY <the arm / the mouth / the expression>: ...
Keep the head and face exactly identical to the reference (same head position, size and angle). Preserve everything
else exactly: same character, same framing and position in the frame, same size, ... same flat solid light blue
#9BCFFD background." The exact prompt of every node is stored on the ElevenLabs flow.

**Props:** style block + object + "Centred, filling about 60% of the frame. Background: a flat solid pure magenta
#FF00FF edge to edge, no gradient, no shadow, no floor." For anything see-through (glass, water) ask for it "drawn as
solid/opaque" so the magenta never shows through.
