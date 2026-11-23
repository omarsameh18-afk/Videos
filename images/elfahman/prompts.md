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

## Episode 11 props (style block + object + magenta background, gpt-image-2.5-sunburst 1K high 1:1)

- **earth**: "The planet Earth seen from space as a perfect round globe, Africa and Europe facing the camera with Egypt clearly visible,
  bright saturated blue oceans, green and sandy continents, a few simple white cloud swirls, no face. Centred, filling about 75% of the
  frame, perfectly circular." Drawn in code at radius r with `<image>` scaled by r / 468 (the globe is ~935 px wide in its crop).
- **wave**: "One huge towering ocean wave seen from the side, curling over from left to right with a big white foamy crest and spray,
  deep saturated blue and teal water drawn solid and opaque, the wave rising from a flat base at the bottom edge. No city, no boats,
  no people, no sky. Centred, filling about 80% of the frame."
- **dino**: "a clean solid silhouette of a long-necked sauropod dinosaur (brontosaurus) standing in side view facing left, the whole
  body filled with one flat solid very dark green-black colour #1E2A22, smooth simple shape, no outline details, no eyes ..." (style
  block shortened: a silhouette has no outlines/shading).
